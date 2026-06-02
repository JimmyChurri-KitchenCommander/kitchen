import { Router } from "express";
import { db } from "@workspace/db";
import { suppliersTable, priceHistoryTable, venuesTable, invoicesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { inventoryItemsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAnyRelation } from "../middlewares/venueAuth";

const router = Router();

function parseSupplier(
  s: typeof suppliersTable.$inferSelect,
  latestInvoiceDate?: string | null,
) {
  let daysSinceLastInvoice: number | null = null;
  let hasInvoiceGap = false;
  if (latestInvoiceDate) {
    const d = new Date(latestInvoiceDate + "T00:00:00Z");
    daysSinceLastInvoice = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (s.expectedInvoiceFrequencyDays && daysSinceLastInvoice > s.expectedInvoiceFrequencyDays * 1.5) {
      hasInvoiceGap = true;
    }
  } else if (s.expectedInvoiceFrequencyDays) {
    // No invoices on file but a cadence is set — treat as gap.
    hasInvoiceGap = true;
  }
  return {
    ...s,
    minimumOrderValue: s.minimumOrderValue ? parseFloat(s.minimumOrderValue) : null,
    deliveryFee: s.deliveryFee ? parseFloat(s.deliveryFee) : null,
    expectedInvoiceFrequencyDays: s.expectedInvoiceFrequencyDays ?? null,
    lastInvoiceDate: latestInvoiceDate ?? null,
    daysSinceLastInvoice,
    hasInvoiceGap,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt?.toISOString() ?? null,
  };
}

async function fetchLatestInvoiceMap(venueId: number): Promise<Map<number, string>> {
  const invs = await db.select({
    supplierId: invoicesTable.supplierId,
    invoiceDate: invoicesTable.invoiceDate,
  }).from(invoicesTable).where(eq(invoicesTable.venueId, venueId));
  const m = new Map<number, string>();
  for (const i of invs) {
    if (!i.supplierId) continue;
    const prev = m.get(i.supplierId);
    if (!prev || i.invoiceDate > prev) m.set(i.supplierId, i.invoiceDate);
  }
  return m;
}

function computeCutoffs(suppliers: typeof suppliersTable.$inferSelect[]) {
  const now = new Date();
  return suppliers
    .filter((s) => s.orderCutoffTime && s.deliveryDays)
    .map((s) => {
      const [hours, minutes] = (s.orderCutoffTime as string).split(":").map(Number);
      const cutoffToday = new Date(now);
      cutoffToday.setHours(hours, minutes, 0, 0);
      const minutesUntilCutoff = Math.floor((cutoffToday.getTime() - now.getTime()) / 60000);
      const isUrgent = minutesUntilCutoff >= 0 && minutesUntilCutoff <= 120;
      const timeStr = minutesUntilCutoff < 0 ? "cutoff passed"
        : minutesUntilCutoff < 60 ? `${minutesUntilCutoff}m`
        : `${Math.floor(minutesUntilCutoff / 60)}h ${minutesUntilCutoff % 60}m`;
      return {
        supplierId: s.id, supplierName: s.name, cutoffTime: s.orderCutoffTime as string,
        deliveryDay: s.deliveryDays as string, minutesUntilCutoff: minutesUntilCutoff >= 0 ? minutesUntilCutoff : null,
        isUrgent, message: `${s.name} order cutoff in ${timeStr}`,
      };
    })
    .sort((a, b) => (a.minutesUntilCutoff ?? 9999) - (b.minutesUntilCutoff ?? 9999));
}

router.get("/venues/:venueId/suppliers", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [suppliers, latestMap] = await Promise.all([
      db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
      fetchLatestInvoiceMap(venueId),
    ]);
    res.json(suppliers.map((s) => parseSupplier(s, latestMap.get(s.id) ?? null)));
  } catch (err) {
    req.log.error({ err }, "Failed to list suppliers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/suppliers", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { name, contactName, email, phone, deliveryDays, orderCutoffTime, minimumOrderValue, deliveryFee, notes, website, category, reliabilityRating, expectedInvoiceFrequencyDays } = req.body as Record<string, unknown>;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const [supplier] = await db
      .insert(suppliersTable)
      .values({
        venueId, name: name as string,
        contactName: contactName as string | undefined,
        email: email as string | undefined,
        phone: phone as string | undefined,
        deliveryDays: deliveryDays as string | undefined,
        orderCutoffTime: orderCutoffTime as string | undefined,
        minimumOrderValue: minimumOrderValue ? String(minimumOrderValue) : null,
        deliveryFee: deliveryFee ? String(deliveryFee) : null,
        notes: notes as string | undefined,
        website: website as string | undefined,
        category: category as string | undefined,
        reliabilityRating: reliabilityRating ? Number(reliabilityRating) : null,
        expectedInvoiceFrequencyDays: expectedInvoiceFrequencyDays !== undefined && expectedInvoiceFrequencyDays !== null
          ? Number(expectedInvoiceFrequencyDays) : null,
      })
      .returning();
    res.status(201).json(parseSupplier(supplier, null));
  } catch (err) {
    req.log.error({ err }, "Failed to create supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/price-comparison", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const items = await db
      .select({
        id: inventoryItemsTable.id,
        name: inventoryItemsTable.name,
        unit: inventoryItemsTable.unit,
        cost: inventoryItemsTable.averageCost,
        supplierId: suppliersTable.id,
        supplierName: suppliersTable.name,
        deliveryDays: suppliersTable.deliveryDays,
        orderCutoffTime: suppliersTable.orderCutoffTime,
        minimumOrderValue: suppliersTable.minimumOrderValue,
        deliveryFee: suppliersTable.deliveryFee,
      })
      .from(inventoryItemsTable)
      .leftJoin(suppliersTable, eq(inventoryItemsTable.supplierId, suppliersTable.id))
      .where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true)))
      .orderBy(inventoryItemsTable.name);

    res.json(items.map(i => ({
      id: i.id, name: i.name, unit: i.unit, cost: parseFloat(i.cost),
      supplierId: i.supplierId ?? null,
      supplierName: i.supplierName ?? null,
      deliveryDays: i.deliveryDays ?? null,
      orderCutoffTime: i.orderCutoffTime ?? null,
      minimumOrderValue: i.minimumOrderValue ? parseFloat(i.minimumOrderValue) : null,
      deliveryFee: i.deliveryFee ? parseFloat(i.deliveryFee) : null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get price comparison");
    res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.get("/venues/:venueId/suppliers/:supplierId/products", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const supplierId = parseInt(req.params["supplierId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const items = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(
        eq(inventoryItemsTable.venueId, venueId),
        eq(inventoryItemsTable.supplierId, supplierId),
        eq(inventoryItemsTable.isActive, true),
      ))
      .orderBy(inventoryItemsTable.name);

    const history = await db
      .select()
      .from(priceHistoryTable)
      .where(eq(priceHistoryTable.supplierId, supplierId));

    const latestChange = new Map<string, {
      oldPrice: number | null; newPrice: number; changePercent: number | null; recordedAt: string;
    }>();
    for (const h of [...history].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())) {
      if (!latestChange.has(h.itemName)) {
        latestChange.set(h.itemName, {
          oldPrice: h.oldPrice ? parseFloat(h.oldPrice) : null,
          newPrice: parseFloat(h.newPrice),
          changePercent: h.changePercent ? parseFloat(h.changePercent) : null,
          recordedAt: h.recordedAt.toISOString(),
        });
      }
    }

    res.json(items.map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      currentStock: parseFloat(i.currentStock),
      parLevel: parseFloat(i.parLevel),
      averageCost: parseFloat(i.averageCost),
      shelfLifeDays: i.shelfLifeDays,
      lastRestocked: i.lastRestocked?.toISOString() ?? null,
      latestPriceChange: latestChange.get(i.name) ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get supplier products");
    res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.get("/venues/:venueId/suppliers/cutoffs", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const suppliers = await db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId));
    res.json(computeCutoffs(suppliers));
  } catch (err) {
    req.log.error({ err }, "Failed to get supplier cutoffs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/suppliers/:supplierId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const supplierId = parseInt(req.params["supplierId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [supplier] = await db
      .select()
      .from(suppliersTable)
      .where(and(eq(suppliersTable.id, supplierId), eq(suppliersTable.venueId, venueId)));
    if (!supplier) { res.status(404).json({ error: "Supplier not found" }); return; }
    const latestMap = await fetchLatestInvoiceMap(venueId);
    res.json(parseSupplier(supplier, latestMap.get(supplier.id) ?? null));
  } catch (err) {
    req.log.error({ err }, "Failed to get supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/suppliers/:supplierId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const supplierId = parseInt(req.params["supplierId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const fields = ["name", "contactName", "email", "phone", "deliveryDays", "orderCutoffTime", "notes", "website", "category", "reliabilityRating"];
    const body = req.body as Record<string, unknown>;
    for (const f of fields) { if (body[f] !== undefined) updates[f] = body[f]; }
    if (body["minimumOrderValue"] !== undefined) updates["minimumOrderValue"] = String(body["minimumOrderValue"]);
    if (body["deliveryFee"] !== undefined) updates["deliveryFee"] = String(body["deliveryFee"]);
    if (body["expectedInvoiceFrequencyDays"] !== undefined) {
      updates["expectedInvoiceFrequencyDays"] = body["expectedInvoiceFrequencyDays"] === null
        ? null : Number(body["expectedInvoiceFrequencyDays"]);
    }
    const [supplier] = await db
      .update(suppliersTable)
      .set(updates)
      .where(and(eq(suppliersTable.id, supplierId), eq(suppliersTable.venueId, venueId)))
      .returning();
    if (!supplier) { res.status(404).json({ error: "Supplier not found" }); return; }
    const latestMap = await fetchLatestInvoiceMap(venueId);
    res.json(parseSupplier(supplier, latestMap.get(supplier.id) ?? null));
  } catch (err) {
    req.log.error({ err }, "Failed to update supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/suppliers/:supplierId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const supplierId = parseInt(req.params["supplierId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    await db.delete(suppliersTable).where(and(eq(suppliersTable.id, supplierId), eq(suppliersTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/suppliers/:supplierId/price-history", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const supplierId = parseInt(req.params["supplierId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const history = await db.select().from(priceHistoryTable).where(eq(priceHistoryTable.supplierId, supplierId));
    res.json(history.map((h) => ({
      ...h,
      oldPrice: h.oldPrice ? parseFloat(h.oldPrice) : null,
      newPrice: parseFloat(h.newPrice),
      changePercent: h.changePercent ? parseFloat(h.changePercent) : null,
      recordedAt: h.recordedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get price history");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
