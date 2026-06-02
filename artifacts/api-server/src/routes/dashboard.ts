import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryItemsTable, suppliersTable, wasteLogsTable, recipesTable } from "@workspace/db";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getVenueIfAccess } from "../middlewares/venueAuth";

const router = Router();

function computeStagnantDays(lastRestocked: Date | null): number {
  if (!lastRestocked) return 0;
  return Math.floor((Date.now() - new Date(lastRestocked).getTime()) / (1000 * 60 * 60 * 24));
}

function computeStatus(currentStock: string, parLevel: string, shelfLifeDays: number | null, stagnantDays: number) {
  const stock = parseFloat(currentStock);
  const par = parseFloat(parLevel);
  if (stock === 0) return "critical";
  if (shelfLifeDays && stagnantDays >= shelfLifeDays * 0.8) return "expiry_risk";
  if (stagnantDays >= 7) return "stagnant";
  if (stock < par * 0.25) return "critical";
  if (stock < par * 0.5) return "low_stock";
  return "healthy";
}

function computeCutoffs(suppliers: typeof suppliersTable.$inferSelect[]) {
  const now = new Date();
  return suppliers
    .filter((s) => s.orderCutoffTime && s.deliveryDays)
    .map((s) => {
      const [hours, minutes] = (s.orderCutoffTime as string).split(":").map(Number);
      const cutoffToday = new Date(now);
      cutoffToday.setHours(hours!, minutes!, 0, 0);
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

router.get("/venues/:venueId/dashboard", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const venue = await getVenueIfAccess(venueId, req.userId!);
    if (!venue) { res.status(404).json({ error: "Venue not found" }); return; }

    const [rawItems, suppliers, wasteLogs] = await Promise.all([
      db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId)),
      db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
      db.select().from(wasteLogsTable).where(eq(wasteLogsTable.venueId, venueId)),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const wasteToday = wasteLogs
      .filter((w) => w.loggedAt >= today)
      .reduce((sum, w) => sum + parseFloat(w.costImpact), 0);

    const enriched = rawItems.map((item) => {
      const stagnantDays = computeStagnantDays(item.lastRestocked);
      const status = computeStatus(item.currentStock, item.parLevel, item.shelfLifeDays, stagnantDays);
      return { ...item, stagnantDays, status, stockNum: parseFloat(item.currentStock), costNum: parseFloat(item.averageCost) };
    });

    const inventoryValue = enriched.reduce((sum, i) => sum + i.stockNum * i.costNum, 0);
    const critical = enriched.filter((i) => i.status === "critical");
    const lowStock = enriched.filter((i) => i.status === "low_stock");
    const stagnant = enriched.filter((i) => i.status === "stagnant");
    const expiryRisk = enriched.filter((i) => i.status === "expiry_risk");

    const suggestions = enriched
      .filter((i) => i.status === "stagnant" || i.status === "expiry_risk")
      .map((item) => {
        const days = item.stagnantDays;
        let action: "run_special" | "reduce_prep" | "family_meal" | "freeze_preserve" | "discount" = "run_special";
        let suggestion = `${item.stockNum}${item.unit} ${item.name} — run as tonight's special`;
        let urgency: "low" | "medium" | "high" | "critical" = "low";
        if (days >= 14) { urgency = "critical"; action = "freeze_preserve"; suggestion = `${item.name} has been sitting ${days} days — freeze or use in family meal today`; }
        else if (days >= 10) { urgency = "high"; action = "family_meal"; suggestion = `Use ${item.name} in family meal — ${days} days stagnant`; }
        else if (days >= 7) { urgency = "medium"; action = "run_special"; suggestion = `Put ${item.name} on tonight's special — ${days} days without movement`; }
        else if (item.status === "expiry_risk") { urgency = "high"; action = "reduce_prep"; suggestion = `${item.name} approaching shelf life — use today`; }
        return { itemId: item.id, itemName: item.name, stagnantDays: days, currentStock: item.stockNum, unit: item.unit, suggestion, action, urgency };
      });

    const toShape = (i: (typeof enriched)[0]) => ({
      id: i.id, venueId: i.venueId, supplierId: i.supplierId, supplierName: null as string | null,
      name: i.name, unit: i.unit, currentStock: i.stockNum, averageCost: i.costNum,
      parLevel: parseFloat(i.parLevel), shelfLifeDays: i.shelfLifeDays, stagnantDays: i.stagnantDays,
      status: i.status, lastRestocked: i.lastRestocked?.toISOString() ?? null, createdAt: i.createdAt.toISOString(),
    });

    // Prep alerts: in-house prepped items that are low/critical
    const prepAlertItems = enriched.filter(
      (i) => i.productionRecipeId !== null && i.productionRecipeId !== undefined
        && (i.status === "critical" || i.status === "low_stock")
    );
    let prepAlerts: {
      itemId: number; itemName: string; currentStock: number; parLevel: number;
      unit: string; productionRecipeId: number; productionRecipeName: string;
    }[] = [];
    if (prepAlertItems.length > 0) {
      const recipeIds = [...new Set(prepAlertItems.map(i => i.productionRecipeId!))];
      const recipes = await Promise.all(recipeIds.map(id => db.select().from(recipesTable).where(eq(recipesTable.id, id)).then(r => r[0])));
      const recipeMap = new Map(recipes.filter(Boolean).map(r => [r!.id, r!.name]));
      prepAlerts = prepAlertItems.map(i => ({
        itemId: i.id, itemName: i.name, currentStock: i.stockNum,
        parLevel: parseFloat(i.parLevel), unit: i.unit,
        productionRecipeId: i.productionRecipeId!,
        productionRecipeName: recipeMap.get(i.productionRecipeId!) ?? "Unknown recipe",
      }));
    }

    res.json({
      venueId, venueName: venue.name,
      alerts: { critical: critical.map(toShape), lowStock: lowStock.map(toShape), stagnant: stagnant.map(toShape), expiryRisk: expiryRisk.map(toShape) },
      supplierCutoffs: computeCutoffs(suppliers), suggestions,
      wasteToday: Math.round(wasteToday * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      lowStockCount: lowStock.length, stagnantCount: stagnant.length, criticalCount: critical.length,
      prepAlerts,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
