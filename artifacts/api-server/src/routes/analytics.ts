import { Router } from "express";
import { db } from "@workspace/db";
import { venuesTable, inventoryItemsTable, wasteLogsTable, priceHistoryTable, suppliersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getVenueIfAccess } from "../middlewares/venueAuth";

const router = Router();

function computeStagnantDays(lastRestocked: Date | null): number {
  if (!lastRestocked) return 0;
  return Math.floor((Date.now() - new Date(lastRestocked).getTime()) / (1000 * 60 * 60 * 24));
}

router.get("/venues/:venueId/analytics", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const venue = await getVenueIfAccess(venueId, req.userId!);
    if (!venue) { res.status(404).json({ error: "Venue not found" }); return; }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [items, wasteLogs, suppliers] = await Promise.all([
      db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId)),
      db.select().from(wasteLogsTable).where(eq(wasteLogsTable.venueId, venueId)),
      db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
    ]);

    const recentWaste = wasteLogs.filter((w) => w.loggedAt >= thirtyDaysAgo);
    const totalWasteCost = recentWaste.reduce((sum, w) => sum + parseFloat(w.costImpact), 0);
    const inventoryValue = items.reduce((sum, i) => sum + parseFloat(i.currentStock) * parseFloat(i.averageCost), 0);
    const stagnantValue = items
      .filter((i) => computeStagnantDays(i.lastRestocked) >= 7)
      .reduce((sum, i) => sum + parseFloat(i.currentStock) * parseFloat(i.averageCost), 0);

    const priceSpikes: { supplierName: string; itemName: string; changePercent: number; oldPrice: number; newPrice: number }[] = [];
    for (const supplier of suppliers) {
      const history = await db.select().from(priceHistoryTable).where(eq(priceHistoryTable.supplierId, supplier.id));
      for (const h of history.filter((h) => h.changePercent && parseFloat(h.changePercent) >= 10)) {
        priceSpikes.push({
          supplierName: supplier.name, itemName: h.itemName,
          changePercent: parseFloat(h.changePercent as string),
          oldPrice: h.oldPrice ? parseFloat(h.oldPrice) : 0,
          newPrice: parseFloat(h.newPrice),
        });
      }
    }

    const wasteTrendMap = new Map<string, { totalCost: number; count: number }>();
    for (const w of recentWaste) {
      const date = w.loggedAt.toISOString().split("T")[0] as string;
      const entry = wasteTrendMap.get(date) ?? { totalCost: 0, count: 0 };
      entry.totalCost += parseFloat(w.costImpact);
      entry.count += 1;
      wasteTrendMap.set(date, entry);
    }
    const wasteTrend = Array.from(wasteTrendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, totalCost: Math.round(data.totalCost * 100) / 100, count: data.count }));

    res.json({
      venueId, period: 30,
      totalWasteCost: Math.round(totalWasteCost * 100) / 100,
      avgFoodCostPercent: null, avgGpPercent: null,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      stagnantValue: Math.round(stagnantValue * 100) / 100,
      priceSpikes: priceSpikes.slice(0, 10), wasteTrend,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
