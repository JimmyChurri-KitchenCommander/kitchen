import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, invoiceItemsTable, venuesTable, inventoryItemsTable, priceHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";
import { markRecipeCostsUpdatedForInventoryItems } from "../utils/recipeCostFreshness";

const router = Router();

function parseInvoice(i: typeof invoicesTable.$inferSelect) {
  return {
    id: i.id, venueId: i.venueId, supplierId: i.supplierId, supplierName: i.supplierName,
    invoiceNumber: i.invoiceNumber, invoiceDate: i.invoiceDate,
    totalAmount: parseFloat(i.totalAmount),
    notes: i.notes ?? null,
    noteResolvedAt: i.noteResolvedAt ? i.noteResolvedAt.toISOString() : null,
    imageUrl: i.imageUrl, createdAt: i.createdAt.toISOString(),
  };
}

function parseLineItem(item: typeof invoiceItemsTable.$inferSelect) {
  return {
    id: item.id, invoiceId: item.invoiceId, inventoryItemId: item.inventoryItemId,
    description: item.description, quantity: parseFloat(item.quantity), unit: item.unit,
    unitPrice: parseFloat(item.unitPrice), totalPrice: parseFloat(item.totalPrice),
  };
}

router.get("/venues/:venueId/invoices", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.venueId, venueId));
    res.json(invoices.map(parseInvoice));
  } catch (err) {
    req.log.error({ err }, "Failed to list invoices");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/invoices", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { supplierId, supplierName, invoiceNumber, invoiceDate, totalAmount, imageUrl, notes, lineItems: rawLineItems, applyToInventory } = req.body as Record<string, unknown>;
    if (!supplierName || !invoiceDate) {
      res.status(400).json({ error: "supplierName and invoiceDate are required" }); return;
    }
    const [invoice] = await db.insert(invoicesTable).values({
      venueId, supplierId: supplierId ? Number(supplierId) : null,
      supplierName: supplierName as string,
      invoiceNumber: invoiceNumber as string | undefined,
      invoiceDate: invoiceDate as string,
      totalAmount: String(totalAmount ?? 0),
      imageUrl: imageUrl as string | undefined,
      notes: notes as string | undefined,
      createdBy: req.userId!,
    }).returning();

    if (Array.isArray(rawLineItems) && rawLineItems.length > 0) {
      type RawItem = { description?: string; quantity?: number; unit?: string; unitPrice?: number; totalPrice?: number; inventoryItemId?: number | null };
      const items = rawLineItems as RawItem[];
      const toInsert = items
        .filter(i => i.description && i.quantity != null && i.unitPrice != null)
        .map(i => ({
          invoiceId: invoice!.id,
          inventoryItemId: i.inventoryItemId ?? null,
          description: String(i.description ?? ""),
          quantity: String(i.quantity ?? 0),
          unit: String(i.unit ?? ""),
          unitPrice: String(i.unitPrice ?? 0),
          totalPrice: String(i.totalPrice ?? (Number(i.quantity ?? 0) * Number(i.unitPrice ?? 0))),
        }));
      if (toInsert.length > 0) {
        await db.insert(invoiceItemsTable).values(toInsert);
      }
      if (applyToInventory === true && supplierId) {
        const costChangedItemIds: number[] = [];
        for (const item of items) {
          if (!item.inventoryItemId || item.unitPrice == null) continue;
          const [existing] = await db.select()
            .from(inventoryItemsTable)
            .where(and(eq(inventoryItemsTable.id, item.inventoryItemId), eq(inventoryItemsTable.venueId, venueId)));
          if (!existing) continue;
          const newCost = Number(item.unitPrice);
          const oldCost = parseFloat(existing.averageCost);
          await db.update(inventoryItemsTable)
            .set({ averageCost: String(newCost), supplierId: Number(supplierId), updatedAt: new Date() })
            .where(eq(inventoryItemsTable.id, item.inventoryItemId));
          const changePercent = oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : null;
          if (Math.abs(newCost - oldCost) > 0.0001) {
            costChangedItemIds.push(item.inventoryItemId);
          }
          await db.insert(priceHistoryTable).values({
            supplierId: Number(supplierId),
            inventoryItemId: item.inventoryItemId,
            itemName: existing.name,
            oldPrice: oldCost > 0 ? String(oldCost) : null,
            newPrice: String(newCost),
            changePercent: changePercent !== null ? String(changePercent.toFixed(2)) : null,
          });
        }
        await markRecipeCostsUpdatedForInventoryItems(venueId, costChangedItemIds);
      }
    }

    res.status(201).json(parseInvoice(invoice!));
  } catch (err) {
    req.log.error({ err }, "Failed to create invoice");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update or resolve an invoice note
router.patch("/venues/:venueId/invoices/:invoiceId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const invoiceId = parseInt(req.params["invoiceId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [existing] = await db.select().from(invoicesTable)
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.venueId, venueId)));
    if (!existing) { res.status(404).json({ error: "Invoice not found" }); return; }

    const { notes, resolveNote } = req.body as Record<string, unknown>;
    const updates: Partial<typeof invoicesTable.$inferInsert> = { updatedAt: new Date() };

    if (notes !== undefined) {
      updates.notes = notes === null ? null : String(notes);
    }
    if (resolveNote === true) {
      updates.noteResolvedAt = new Date();
    } else if (resolveNote === false) {
      updates.noteResolvedAt = null;
    }

    const [updated] = await db.update(invoicesTable)
      .set(updates)
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.venueId, venueId)))
      .returning();

    res.json(parseInvoice(updated!));
  } catch (err) {
    req.log.error({ err }, "Failed to update invoice note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/invoices/:invoiceId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const invoiceId = parseInt(req.params["invoiceId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [invoice] = await db.select().from(invoicesTable)
      .where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.venueId, venueId)));
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
    const lineItems = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, invoiceId));
    res.json({ ...parseInvoice(invoice), lineItems: lineItems.map(parseLineItem) });
  } catch (err) {
    req.log.error({ err }, "Failed to get invoice");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/invoices/:invoiceId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const invoiceId = parseInt(req.params["invoiceId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    await db.delete(invoicesTable).where(and(eq(invoicesTable.id, invoiceId), eq(invoicesTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete invoice");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
