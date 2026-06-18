import { Router } from "express";
import { db } from "@workspace/db";
import {
  invoicesTable,
  invoiceItemsTable,
  inventoryItemsTable,
  venuesTable,
  priceHistoryTable,
  suppliersTable,
} from "@workspace/db";

import { priceHistoryTable } from "@workspace/db/schema/priceHistory";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { applyInventoryMovement } from "../services/inventoryLedger";

const router = Router();

interface ExtractedLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface ExtractedInvoice {
  supplierName: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  totalAmount: number;
  lineItems: ExtractedLineItem[];
  rawText: string;
}

async function extractInvoiceFromImage(base64Image: string): Promise<ExtractedInvoice> {
  const today = new Date().toISOString().split("T")[0];
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: `You are an expert at reading restaurant delivery dockets and invoices.
Extract ALL line items from this invoice/docket image.

Return ONLY valid JSON in this exact format — no markdown, no explanation, just the JSON object:
{
  "supplierName": "supplier or vendor name exactly as on the document",
  "invoiceNumber": "invoice or docket number, or null if not visible",
  "invoiceDate": "YYYY-MM-DD (use today ${today} if not legible)",
  "totalAmount": number (the grand total before any adjustments, 0 if not visible),
  "lineItems": [
    {
      "description": "clean readable product name (not codes)",
      "quantity": number,
      "unit": "kg/g/L/ml/each/case/box/dozen/bunch/bag etc",
      "unitPrice": number (price per unit, 0 if missing),
      "totalPrice": number (line total, calculate if possible, else 0)
    }
  ],
  "rawText": "full text content of the document as you read it"
}

CRITICAL rules:
- Use plain numbers — NEVER use comma thousands separators. Write 3340.00 not 3,340.00
- Use numbers not strings for all numeric fields
- Extract EVERY product line item — skip discount/deduction/GST/total summary rows
- If a line total is missing, calculate: quantity × unitPrice
- description should be the product name, not stock codes
- invoiceDate must be YYYY-MM-DD`,
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse invoice data from image");
  // Strip thousands-separator commas between digits (e.g. 3,340.00 → 3340.00)
  const sanitized = jsonMatch[0].replace(/(\d),(\d)/g, "$1$2");
  return JSON.parse(sanitized) as ExtractedInvoice;
}

function fuzzyScore(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const words = needle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  let hits = 0;
  for (const w of words) {
    if (h.includes(w)) hits++;
  }
  return hits / words.length;
}

// ── SCAN (no DB write — returns extracted + matched data for review) ──────────
router.post("/venues/:venueId/invoices/scan", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const { imageBase64 } = req.body as { imageBase64?: string };
    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" }); return;
    }

    let extracted: ExtractedInvoice;
    try {
      extracted = await extractInvoiceFromImage(imageBase64);
    } catch (aiErr) {
      req.log.error({ aiErr }, "AI extraction failed");
      res.status(422).json({ error: "Could not read the invoice. Try a clearer, well-lit photo." }); return;
    }

    // Fuzzy-match supplier
    const suppliers = await db
      .select({ id: suppliersTable.id, name: suppliersTable.name })
      .from(suppliersTable)
      .where(eq(suppliersTable.venueId, venueId));

    let matchedSupplierId: number | null = null;
    let bestSupplierScore = 0;
    for (const s of suppliers) {
      const score = fuzzyScore(s.name, extracted.supplierName) ||
        fuzzyScore(extracted.supplierName, s.name);
      if (score > 0.5 && score > bestSupplierScore) {
        bestSupplierScore = score;
        matchedSupplierId = s.id;
      }
    }

    // Fuzzy-match each line item to an inventory item
    const inventoryItems = await db
      .select({ id: inventoryItemsTable.id, name: inventoryItemsTable.name })
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.venueId, venueId));

    const lineItemsWithMatches = extracted.lineItems.map((item) => {
      let bestMatch: { id: number; name: string } | null = null;
      let bestScore = 0;
      for (const inv of inventoryItems) {
        const score = Math.max(
          fuzzyScore(inv.name, item.description),
          fuzzyScore(item.description, inv.name)
        );
        if (score > 0.45 && score > bestScore) {
          bestScore = score;
          bestMatch = inv;
        }
      }
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        matchedInventoryItemId: bestMatch?.id ?? null,
        matchedInventoryItemName: bestMatch?.name ?? null,
      };
    });

    res.json({
      supplierName: extracted.supplierName,
      matchedSupplierId,
      supplierMatched: matchedSupplierId !== null,
      invoiceNumber: extracted.invoiceNumber,
      invoiceDate: extracted.invoiceDate || new Date().toISOString().split("T")[0],
      totalAmount: extracted.totalAmount,
      lineItems: lineItemsWithMatches,
      rawText: extracted.rawText,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to scan invoice");
    res.status(500).json({ error: "Scan failed. Please try again with a clearer photo." });
  }
});

// ── CONFIRM (saves reviewed/edited invoice + optionally creates supplier + applies costs) ──
router.post("/venues/:venueId/invoices/confirm", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const body = req.body as {
      supplierId?: number | null;
      supplierName: string;
      createNewSupplier?: boolean;
      invoiceNumber?: string | null;
      invoiceDate: string;
      totalAmount: number;
      applyToInventory: boolean;
      lineItems: Array<{
        description: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
        inventoryItemId?: number | null;
      }>;
    };

    if (!body.supplierName || !body.invoiceDate) {
      res.status(400).json({ error: "supplierName and invoiceDate are required" }); return;
    }

    // Auto-create supplier if requested and no match was found
    let resolvedSupplierId = body.supplierId ?? null;
    if (!resolvedSupplierId && body.createNewSupplier && body.supplierName) {
      const [newSupplier] = await db
        .insert(suppliersTable)
        .values({ venueId, name: body.supplierName })
        .returning();
      resolvedSupplierId = newSupplier.id;
    }

    // Save invoice
    const [invoice] = await db.insert(invoicesTable).values({
      venueId,
      supplierId: resolvedSupplierId,
      supplierName: body.supplierName,
      invoiceNumber: body.invoiceNumber ?? undefined,
      invoiceDate: body.invoiceDate,
      totalAmount: String(body.totalAmount ?? 0),
      status: body.applyToInventory ? "processed" : "pending",
    }).returning();

    // Save line items
    for (const item of body.lineItems) {
      await db.insert(invoiceItemsTable).values({
        invoiceId: invoice.id,
        inventoryItemId: item.inventoryItemId ?? null,
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice),
      });
    }

    // Optionally apply costs to inventory
    let updatedCount = 0;
    if (body.applyToInventory) {
      const supplier = resolvedSupplierId
        ? (await db.select().from(suppliersTable).where(eq(suppliersTable.id, resolvedSupplierId)))[0]
        : null;

      for (const item of body.lineItems) {
        if (!item.inventoryItemId) continue;

        const [existing] = await db
          .select({ averageCost: inventoryItemsTable.averageCost })
          .from(inventoryItemsTable)
          .where(eq(inventoryItemsTable.id, item.inventoryItemId));

        if (!existing) continue;

        const newCost = item.unitPrice;
        const oldCost = parseFloat(existing.averageCost);

        await db
          .update(inventoryItemsTable)
          .set({ averageCost: String(newCost), updatedAt: new Date() })
          .where(eq(inventoryItemsTable.id, item.inventoryItemId));

        if (supplier && Math.abs(newCost - oldCost) > 0.0001) {
          const changePercent = oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : 0;
          await db.insert(priceHistoryTable).values({
            supplierId: supplier.id,
            itemName: item.description,
            oldPrice: String(oldCost),
            newPrice: String(newCost),
            changePercent: String(changePercent.toFixed(2)),
          });
        }

        updatedCount++;
      }
    }

    res.status(201).json({
      invoice: {
        id: invoice.id,
        venueId: invoice.venueId,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplierName,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        totalAmount: parseFloat(invoice.totalAmount),
        status: invoice.status,
        imageUrl: invoice.imageUrl,
        notes: invoice.notes,
        createdAt: invoice.createdAt.toISOString(),
      },
      updatedCount,
      newSupplierId: resolvedSupplierId !== body.supplierId ? resolvedSupplierId : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm invoice");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── APPLY existing saved invoice ──────────────────────────────────────────────
router.post("/venues/:venueId/invoices/:invoiceId/apply", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const invoiceId = parseInt(req.params["invoiceId"] as string);

    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.venueId, venueId)));
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

    const lineItems = await db
      .select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoiceId, invoiceId));

    let updatedCount = 0;
    const supplier = invoice.supplierId
      ? (await db.select().from(suppliersTable).where(eq(suppliersTable.id, invoice.supplierId)))[0]
      : null;

    for (const item of lineItems) {
      if (!item.inventoryItemId) continue;

      const [existing] = await db
        .select({ averageCost: inventoryItemsTable.averageCost })
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, item.inventoryItemId));

      if (!existing) continue;

      const newCost = parseFloat(item.unitPrice);
      const oldCost = parseFloat(existing.averageCost);

      await db
        .update(inventoryItemsTable)
        .set({ averageCost: item.unitPrice, updatedAt: new Date() })
        .where(eq(inventoryItemsTable.id, item.inventoryItemId));

      if (supplier && Math.abs(newCost - oldCost) > 0.0001) {
        const changePercent = oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : 0;
        await db.insert(priceHistoryTable).values({
          supplierId: supplier.id,
          itemName: item.description,
          oldPrice: String(oldCost),
          newPrice: String(newCost),
          changePercent: String(changePercent.toFixed(2)),
        });
      }
      updatedCount++;
    }

    await db.update(invoicesTable).set({ status: "processed" }).where(eq(invoicesTable.id, invoiceId));
    res.json({ updatedCount });
  } catch (err) {
    req.log.error({ err }, "Failed to apply invoice");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GOODS RECEIVING ───────────────────────────────────────────────────────────
router.post("/venues/:venueId/invoices/:invoiceId/receive", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const invoiceId = parseInt(req.params["invoiceId"] as string);

    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" });
      return;
    }

    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.id, invoiceId),
          eq(invoicesTable.venueId, venueId)
        )
      );

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const { receivedBy, items } = req.body as {
      receivedBy: string;
      items: Array<{
        id: number;
        receivedStatus: "received" | "short" | "rejected";
        receivedQuantity: number;
        receivingNotes?: string;
      }>;
    };

    const now = new Date();
    let restockedCount = 0;

    const supplier = invoice.supplierId
      ? (
          await db
            .select()
            .from(suppliersTable)
            .where(eq(suppliersTable.id, invoice.supplierId))
        )[0]
      : null;

    for (const item of items) {
      // Load line item first
      const [lineItem] = await db
        .select()
        .from(invoiceItemsTable)
        .where(eq(invoiceItemsTable.id, item.id));

      if (!lineItem) continue;

      const orderedQty = parseFloat(lineItem.quantity);
      const varianceQty = orderedQty - item.receivedQuantity;

      // Update receiving information
      await db
        .update(invoiceItemsTable)
        .set({
          receivedStatus: item.receivedStatus,
          receivedQuantity: String(item.receivedQuantity),
          varianceQuantity: String(varianceQty.toFixed(3)),
          receivingNotes: item.receivingNotes ?? null,
          receivedAt: now,
          receivedBy,
        })
        .where(eq(invoiceItemsTable.id, item.id));

      // Skip inventory updates if rejected
      if (
        item.receivedStatus === "rejected" ||
        item.receivedQuantity <= 0
      ) {
        continue;
      }

      if (!lineItem.inventoryItemId) continue;

      const [existing] = await db
        .select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, lineItem.inventoryItemId));

      if (!existing) continue;

      const newCost = parseFloat(lineItem.unitPrice);
      const oldCost = parseFloat(existing.averageCost ?? "0");

      await applyInventoryMovement({
        venueId,
        inventoryItemId: lineItem.inventoryItemId,
        transactionType: "PURCHASE",
        quantityDelta: item.receivedQuantity,
        unitCost: newCost,
        reason: `Received delivery from ${supplier?.name ?? invoice.supplierName}`,
        referenceType: "invoice_item",
        referenceId: lineItem.id,
        createdBy: receivedBy ?? undefined,
        createLayer: true,
        expiresAt: existing.expiresAt ?? null,
        updateAverageCost: true,
        metadata: {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          receivedStatus: item.receivedStatus,
        },
      });

      // Log supplier price change
      if (supplier && Math.abs(newCost - oldCost) > 0.0001) {
        const changePercent =
          oldCost > 0
            ? ((newCost - oldCost) / oldCost) * 100
            : 0;

        await db.insert(priceHistoryTable).values({
          supplierId: supplier.id,
          inventoryItemId: lineItem.inventoryItemId,
          itemName: lineItem.description,
          oldPrice: String(oldCost),
          newPrice: String(newCost),
          changePercent: String(changePercent.toFixed(2)),
        });
      }

      restockedCount++;
    }

    // Mark invoice received
    await db
      .update(invoicesTable)
      .set({
        status: "processed",
        receivedAt: now,
        receivedBy,
        receivingCompleted: true,
        updatedAt: now,
      })
      .where(eq(invoicesTable.id, invoiceId));

    res.json({
      success: true,
      invoiceId,
      restockedCount,
      receivedAt: now,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process goods receiving");
    res.status(500).json({
      error: "Internal server error",
    });
  }
});




// END OF FILE
export default router;
