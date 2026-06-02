import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryItemsTable, suppliersTable, venuesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function assertVenueOwner(venueId: number, userId: string) {
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  return venue && venue.userId === userId;
}

function computeStatus(currentStock: string, parLevel: string, shelfLifeDays: number | null, lastRestocked: Date | null) {
  const stock = parseFloat(currentStock);
  const par = parseFloat(parLevel);
  const stagnantDays = lastRestocked
    ? Math.floor((Date.now() - new Date(lastRestocked).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  if (stock === 0) return "critical";
  if (shelfLifeDays && stagnantDays >= shelfLifeDays * 0.8) return "expiry_risk";
  if (stagnantDays >= 7) return "stagnant";
  if (stock < par * 0.25) return "critical";
  if (stock < par * 0.5) return "low_stock";
  return "healthy";
}

router.get("/venues/:venueId/suggested-orders", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" });
      return;
    }

    const [items, suppliers] = await Promise.all([
      db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId)),
      db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
    ]);

    const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

    const needsOrder = items.filter((item) => {
      const stock = parseFloat(item.currentStock);
      const par = parseFloat(item.parLevel);
      return stock < par;
    });

    type GroupKey = string;
    const groupsMap = new Map<GroupKey, {
      supplierId: number | null;
      supplierName: string;
      deliveryDays: string | null;
      orderCutoffTime: string | null;
      minimumOrderValue: number | null;
      items: {
        itemId: number;
        itemName: string;
        unit: string;
        currentStock: number;
        parLevel: number;
        suggestedQty: number;
        estimatedCost: number;
        averageCost: number;
        status: string;
      }[];
    }>();

    for (const item of needsOrder) {
      const supplier = item.supplierId ? supplierMap.get(item.supplierId) : undefined;
      const key: GroupKey = item.supplierId ? `supplier-${item.supplierId}` : "unassigned";
      const supplierName = supplier?.name ?? "Unassigned";

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          supplierId: item.supplierId ?? null,
          supplierName,
          deliveryDays: supplier?.deliveryDays ?? null,
          orderCutoffTime: supplier?.orderCutoffTime ?? null,
          minimumOrderValue: supplier?.minimumOrderValue ? parseFloat(supplier.minimumOrderValue) : null,
          items: [],
        });
      }

      const stock = parseFloat(item.currentStock);
      const par = parseFloat(item.parLevel);
      const cost = parseFloat(item.averageCost);
      const suggestedQty = Math.ceil(par - stock);
      const estimatedCost = parseFloat((suggestedQty * cost).toFixed(2));
      const status = computeStatus(item.currentStock, item.parLevel, item.shelfLifeDays, item.lastRestocked);

      groupsMap.get(key)!.items.push({
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        currentStock: stock,
        parLevel: par,
        suggestedQty,
        estimatedCost,
        averageCost: cost,
        status,
      });
    }

    const groups = Array.from(groupsMap.values()).map((g) => {
      const subtotal = parseFloat(g.items.reduce((sum, i) => sum + i.estimatedCost, 0).toFixed(2));
      const meetsMinimum = g.minimumOrderValue != null ? subtotal >= g.minimumOrderValue : null;
      return { ...g, subtotal, meetsMinimum };
    });

    groups.sort((a, b) => {
      if (a.supplierId === null) return 1;
      if (b.supplierId === null) return -1;
      return b.subtotal - a.subtotal;
    });

    const grandTotal = parseFloat(groups.reduce((sum, g) => sum + g.subtotal, 0).toFixed(2));
    const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

    res.json({ groups, grandTotal, totalItems });
  } catch (err) {
    req.log.error({ err }, "Failed to compute suggested orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
