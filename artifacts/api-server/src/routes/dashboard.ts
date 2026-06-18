import { Router } from "express";
import { db } from "@workspace/db";
import {
  cleaningTasksTable,
  complianceTasksTable,
  inventoryItemsTable,
  prepTasksTable,
  recipesTable,
  suppliersTable,
  temperatureEquipmentTable,
  temperatureLogsTable,
  wasteLogsTable,
} from "@workspace/db";
import { eq, and, isNotNull, ne, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getVenueIfAccess } from "../middlewares/venueAuth";
import { cleaningFrequencyToDays } from "./cleaning";

const router = Router();

type AttentionItem = {
  id: string;
  category: "prep" | "stock" | "order" | "compliance" | "food_cost" | "waste";
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
  href: string;
};

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

function isCleaningOverdue(task: typeof cleaningTasksTable.$inferSelect, now = new Date()): boolean {
  if (!task.isActive) return false;
  if (!task.lastCompletedAt) return true;
  const elapsedDays = (now.getTime() - task.lastCompletedAt.getTime()) / 86_400_000;
  return elapsedDays >= cleaningFrequencyToDays(task.frequency);
}

function attentionHeadline(count: number): string {
  if (count === 0) return "All clear for now";
  return `${count} thing${count === 1 ? "" : "s"} need attention today`;
}

router.get("/venues/:venueId/dashboard", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const venue = await getVenueIfAccess(venueId, req.userId!);
    if (!venue) { res.status(404).json({ error: "Venue not found" }); return; }

    const [
      rawItems,
      suppliers,
      wasteLogs,
      todayPrepTasks,
      cleaningTasks,
      pendingComplianceTasks,
      temperatureEquipment,
      todayTemperatureLogs,
      recipesForConfidence,
    ] = await Promise.all([
      db.select().from(inventoryItemsTable).where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true))),
      db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
      db.select().from(wasteLogsTable).where(eq(wasteLogsTable.venueId, venueId)),
      db.select().from(prepTasksTable).where(and(
        eq(prepTasksTable.venueId, venueId),
        eq(prepTasksTable.prepDate, new Date().toISOString().slice(0, 10)),
        ne(prepTasksTable.isArchived, true),
      )),
      db.select().from(cleaningTasksTable).where(eq(cleaningTasksTable.venueId, venueId)),
      db.select().from(complianceTasksTable).where(and(eq(complianceTasksTable.venueId, venueId), eq(complianceTasksTable.status, "pending"))),
      db.select().from(temperatureEquipmentTable).where(and(eq(temperatureEquipmentTable.venueId, venueId), ne(temperatureEquipmentTable.isArchived, true))),
      db.select().from(temperatureLogsTable).where(and(eq(temperatureLogsTable.venueId, venueId), sql`${temperatureLogsTable.checkedAt} >= ${new Date(new Date().setHours(0, 0, 0, 0))}`)),
      db.select().from(recipesTable).where(and(eq(recipesTable.venueId, venueId), ne(recipesTable.isArchived, true))),
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

    const supplierCutoffs = computeCutoffs(suppliers);
    const urgentCutoffCount = supplierCutoffs.filter(c => c.isUrgent).length;
    const orderItems = enriched.filter(i => parseFloat(i.parLevel) > 0 && i.stockNum < parseFloat(i.parLevel));
    const orderGrandTotal = orderItems.reduce((sum, item) => {
      const suggestedQty = Math.max(0, parseFloat(item.parLevel) - item.stockNum);
      return sum + suggestedQty * item.costNum;
    }, 0);

    const openPrepTasks = todayPrepTasks.filter(t => t.status !== "done");
    const urgentPrepTasks = openPrepTasks.filter(t => t.priority === "high" || t.isCritical);

    const cleaningOverdueCount = cleaningTasks.filter(t => isCleaningOverdue(t)).length;
    const unresolvedTemperatureFails = todayTemperatureLogs.filter(l => l.status === "fail" && l.isResolved !== true).length;
    const lastLogByEquipment = new Map<number, typeof temperatureLogsTable.$inferSelect>();
    for (const log of todayTemperatureLogs) {
      if (log.equipmentId && (!lastLogByEquipment.has(log.equipmentId) || log.checkedAt > lastLogByEquipment.get(log.equipmentId)!.checkedAt)) {
        lastLogByEquipment.set(log.equipmentId, log);
      }
    }
    const temperatureOverdueCount = temperatureEquipment.filter(e => {
      const lastLog = lastLogByEquipment.get(e.id);
      if (!lastLog) return true;
      if (!e.checkIntervalHours) return false;
      return (Date.now() - lastLog.checkedAt.getTime()) / 36e5 > e.checkIntervalHours;
    }).length;
    const complianceIssueCount = pendingComplianceTasks.length + cleaningOverdueCount + unresolvedTemperatureFails + temperatureOverdueCount;

    const staleReviewCount = recipesForConfidence.filter(r => {
      if (!r.lastReviewedAt) return true;
      return (Date.now() - r.lastReviewedAt.getTime()) / 86_400_000 > 60;
    }).length;
    const staleCostCount = recipesForConfidence.filter(r => {
      if (!r.lastCostUpdateAt) return true;
      return (Date.now() - r.lastCostUpdateAt.getTime()) / 86_400_000 > 30;
    }).length;
    const foodCostScore = recipesForConfidence.length === 0
      ? 100
      : Math.max(0, Math.round(100 - ((staleReviewCount + staleCostCount) / (recipesForConfidence.length * 2)) * 100));
    const foodCostLevel = foodCostScore >= 80 ? "strong" : foodCostScore >= 55 ? "watch" : "weak";

    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWaste = wasteLogs.filter(w => w.loggedAt >= sevenDaysAgo && w.loggedAt < today);
    const sevenDayAverageWaste = recentWaste.reduce((sum, w) => sum + parseFloat(w.costImpact), 0) / 7;
    const wasteElevated = wasteToday > 0 && wasteToday > Math.max(25, sevenDayAverageWaste * 1.5);

    const attentionItems: AttentionItem[] = [];
    if (urgentPrepTasks.length > 0) {
      attentionItems.push({
        id: "prep-urgent",
        category: "prep",
        severity: "high",
        title: `${urgentPrepTasks.length} urgent prep task${urgentPrepTasks.length === 1 ? "" : "s"} open`,
        detail: `${urgentPrepTasks[0]?.title ?? "Prep"} needs attention before service.`,
        href: "/prep-board",
      });
    } else if (prepAlerts.length > 0) {
      attentionItems.push({
        id: "prep-stock",
        category: "prep",
        severity: "high",
        title: `${prepAlerts.length} prep item${prepAlerts.length === 1 ? "" : "s"} below par`,
        detail: `${prepAlerts[0]!.itemName} is below par for service.`,
        href: "/prep-board",
      });
    }
    if (critical.length > 0) {
      attentionItems.push({
        id: "stock-critical",
        category: "stock",
        severity: "critical",
        title: `${critical.length} stock item${critical.length === 1 ? "" : "s"} critical`,
        detail: `${critical[0]!.name} is at ${critical[0]!.stockNum} ${critical[0]!.unit}.`,
        href: "/inventory?status=critical",
      });
    } else if (lowStock.length >= 3) {
      attentionItems.push({
        id: "stock-low",
        category: "stock",
        severity: "medium",
        title: `${lowStock.length} stock items running low`,
        detail: "Check low stock before placing orders.",
        href: "/inventory?status=low_stock",
      });
    }
    if (orderItems.length > 0 || urgentCutoffCount > 0) {
      attentionItems.push({
        id: "orders-required",
        category: "order",
        severity: urgentCutoffCount > 0 ? "high" : "medium",
        title: `${orderItems.length} item${orderItems.length === 1 ? "" : "s"} to order`,
        detail: urgentCutoffCount > 0 ? "Supplier cutoff is close." : "Par levels show ordering gaps.",
        href: "/orders",
      });
    }
    if (complianceIssueCount > 0) {
      attentionItems.push({
        id: "compliance-issues",
        category: "compliance",
        severity: unresolvedTemperatureFails > 0 ? "critical" : "high",
        title: `${complianceIssueCount} compliance issue${complianceIssueCount === 1 ? "" : "s"}`,
        detail: unresolvedTemperatureFails > 0 ? "Temperature failure needs resolving." : "Checks or documents are overdue.",
        href: unresolvedTemperatureFails > 0 || temperatureOverdueCount > 0 ? "/temperature" : "/compliance",
      });
    }
    if (foodCostLevel === "weak" || staleReviewCount > 0) {
      attentionItems.push({
        id: "food-cost-confidence",
        category: "food_cost",
        severity: foodCostLevel === "weak" ? "high" : "medium",
        title: foodCostLevel === "weak" ? "Food cost confidence is weak" : `${staleReviewCount} recipe review${staleReviewCount === 1 ? "" : "s"} due`,
        detail: foodCostLevel === "weak" ? "Recipe costs need review before trusting margin." : "Review recipes to keep food cost reliable.",
        href: "/recipes",
      });
    }
    if (wasteElevated) {
      attentionItems.push({
        id: "waste-elevated",
        category: "waste",
        severity: "medium",
        title: "Waste is elevated today",
        detail: `$${wasteToday.toFixed(2)} logged today vs $${sevenDayAverageWaste.toFixed(2)} average.`,
        href: "/waste",
      });
    }

    const attentionSummary = {
      count: attentionItems.length,
      headline: attentionHeadline(attentionItems.length),
      items: attentionItems.slice(0, 6),
    };

    res.json({
      venueId, venueName: venue.name,
      alerts: { critical: critical.map(toShape), lowStock: lowStock.map(toShape), stagnant: stagnant.map(toShape), expiryRisk: expiryRisk.map(toShape) },
      supplierCutoffs, suggestions,
      wasteToday: Math.round(wasteToday * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      lowStockCount: lowStock.length, stagnantCount: stagnant.length, criticalCount: critical.length,
      prepAlerts,
      attentionSummary,
      prepSummary: { openTasks: openPrepTasks.length, urgentTasks: urgentPrepTasks.length, prepAlertCount: prepAlerts.length },
      ordersSummary: { totalItems: orderItems.length, grandTotal: Math.round(orderGrandTotal * 100) / 100, urgentCutoffCount },
      complianceSummary: {
        pendingTaskCount: pendingComplianceTasks.length,
        cleaningOverdueCount,
        temperatureIssueCount: unresolvedTemperatureFails + temperatureOverdueCount,
        totalIssueCount: complianceIssueCount,
      },
      foodCost: {
        score: foodCostScore,
        level: foodCostLevel,
        headline: foodCostLevel === "strong" ? "Recipe costing is in good shape" : foodCostLevel === "watch" ? "Recipe costing needs a check" : "Recipe costing needs attention",
      },
      wasteAlert: {
        todayCost: Math.round(wasteToday * 100) / 100,
        sevenDayAverage: Math.round(sevenDayAverageWaste * 100) / 100,
        isElevated: wasteElevated,
        message: wasteElevated ? `Waste is running above recent average today.` : null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
