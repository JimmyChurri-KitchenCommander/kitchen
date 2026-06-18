import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  cleaningTasksTable,
  complianceTasksTable,
  inventoryItemsTable,
  invoicesTable,
  menusTable,
  prepTasksTable,
  priceHistoryTable,
  recipesTable,
  stocktakesTable,
  suppliersTable,
  temperatureEquipmentTable,
  temperatureLogsTable,
  venuesTable,
  wasteLogsTable,
} from "@workspace/db";
import { cleaningFrequencyToDays } from "../routes/cleaning.js";
import { calculatePrepPlan } from "./prepPlan.js";

type ReadinessStatus = "ready" | "watch" | "not_ready";
type BriefingStatus = "ready" | "watch" | "action_required" | "info";
type ConfidenceLevel = "high" | "medium" | "low";

export type AssistantEvidence = {
  label: string;
  value: string;
  href?: string;
};

export type AssistantBriefingAnswer = {
  id: string;
  question: string;
  answer: string;
  status: BriefingStatus;
  confidence: ConfidenceLevel;
  evidence: AssistantEvidence[];
  href?: string;
};

export type KitchenAssistantContext = {
  meta: {
    venueId: number;
    venueName: string;
    generatedAt: string;
    targetDate: string;
    tomorrowDate: string;
    timezone: string;
    avgCoversPerService: number | null;
  };
  readiness: {
    status: ReadinessStatus;
    score: number;
    headline: string;
    blockers: Array<{
      category: string;
      title: string;
      detail: string;
      severity: "critical" | "high" | "medium";
      href: string;
    }>;
  };
  foodCost: {
    trend: "stable" | "rising" | "uncertain";
    confidenceScore: number;
    confidenceLevel: "strong" | "fair" | "weak";
    headline: string;
    drivers: Array<{
      type: string;
      label: string;
      detail: string;
      impact: "high" | "medium" | "low";
    }>;
  };
  prep: {
    targetDate: string;
    openTaskCount: number;
    urgentTaskCount: number;
    prepGapCount: number;
    suggestedTasks: Array<{
      title: string;
      recipeName: string;
      gapQuantity: number;
      unit: string;
    }>;
    headline: string;
  };
  ordering: {
    itemCount: number;
    estimatedTotal: number;
    urgentCutoffCount: number;
    topItems: Array<{
      itemName: string;
      suggestedQty: number;
      unit: string;
      supplierName: string | null;
    }>;
    headline: string;
  };
  waste: {
    periodDays: number;
    totalCost: number;
    todayCost: number;
    isElevatedToday: boolean;
    topItems: Array<{
      itemName: string;
      totalCost: number;
      count: number;
      topReason: string;
    }>;
    stagnantValue: number;
    headline: string;
  };
  briefing: AssistantBriefingAnswer[];
};

export type BuildAssistantContextOptions = {
  targetDate?: string;
  covers?: number;
};

function computeStagnantDays(lastRestocked: Date | null): number {
  if (!lastRestocked) return 0;
  return Math.floor((Date.now() - new Date(lastRestocked).getTime()) / 86_400_000);
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

function isCleaningOverdue(task: typeof cleaningTasksTable.$inferSelect, now = new Date()): boolean {
  if (!task.isActive) return false;
  if (!task.lastCompletedAt) return true;
  const elapsedDays = (now.getTime() - task.lastCompletedAt.getTime()) / 86_400_000;
  return elapsedDays >= cleaningFrequencyToDays(task.frequency);
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function addDaysIso(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`);
  return date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" });
}

function confidenceFromScore(score: number): ConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

export async function buildKitchenAssistantContext(
  venueId: number,
  options: BuildAssistantContextOptions = {},
): Promise<KitchenAssistantContext> {
  const targetDate = options.targetDate ?? new Date().toISOString().slice(0, 10);
  const tomorrowDate = addDaysIso(targetDate, 1);
  const targetStart = new Date(`${targetDate}T00:00:00`);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const sevenDaysAgo = new Date(targetStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue) throw new Error("Venue not found");

  const [
    rawItems,
    suppliers,
    wasteLogs,
    targetPrepTasks,
    tomorrowPrepTasks,
    cleaningTasks,
    pendingComplianceTasks,
    temperatureEquipment,
    targetTemperatureLogs,
    recipes,
    invoices,
    stocktakes,
    activeMenu,
  ] = await Promise.all([
    db.select().from(inventoryItemsTable).where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true))),
    db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
    db.select().from(wasteLogsTable).where(eq(wasteLogsTable.venueId, venueId)),
    db.select().from(prepTasksTable).where(and(
      eq(prepTasksTable.venueId, venueId),
      eq(prepTasksTable.prepDate, targetDate),
      ne(prepTasksTable.isArchived, true),
    )),
    db.select().from(prepTasksTable).where(and(
      eq(prepTasksTable.venueId, venueId),
      eq(prepTasksTable.prepDate, tomorrowDate),
      ne(prepTasksTable.isArchived, true),
    )),
    db.select().from(cleaningTasksTable).where(eq(cleaningTasksTable.venueId, venueId)),
    db.select().from(complianceTasksTable).where(and(eq(complianceTasksTable.venueId, venueId), eq(complianceTasksTable.status, "pending"))),
    db.select().from(temperatureEquipmentTable).where(and(eq(temperatureEquipmentTable.venueId, venueId), ne(temperatureEquipmentTable.isArchived, true))),
    db.select().from(temperatureLogsTable).where(and(
      eq(temperatureLogsTable.venueId, venueId),
      sql`${temperatureLogsTable.checkedAt} >= ${targetStart}`,
    )),
    db.select().from(recipesTable).where(and(eq(recipesTable.venueId, venueId), ne(recipesTable.isArchived, true))),
    db.select().from(invoicesTable).where(eq(invoicesTable.venueId, venueId)),
    db.select().from(stocktakesTable)
      .where(and(eq(stocktakesTable.venueId, venueId), eq(stocktakesTable.status, "submitted")))
      .orderBy(desc(stocktakesTable.conductedAt))
      .limit(1),
    db.select().from(menusTable).where(and(eq(menusTable.venueId, venueId), eq(menusTable.isActive, true))).limit(1),
  ]);

  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));
  const enriched = rawItems.map((item) => {
    const stagnantDays = computeStagnantDays(item.lastRestocked);
    const status = computeStatus(item.currentStock, item.parLevel, item.shelfLifeDays, stagnantDays);
    return {
      ...item,
      stagnantDays,
      status,
      stockNum: parseFloat(item.currentStock),
      costNum: parseFloat(item.averageCost),
    };
  });

  const critical = enriched.filter((i) => i.status === "critical");
  const lowStock = enriched.filter((i) => i.status === "low_stock");
  const stagnant = enriched.filter((i) => i.status === "stagnant" || i.status === "expiry_risk");
  const stagnantValue = stagnant.reduce((sum, i) => sum + i.stockNum * i.costNum, 0);

  const prepAlertItems = enriched.filter(
    (i) => i.productionRecipeId != null && (i.status === "critical" || i.status === "low_stock"),
  );

  const orderItems = enriched
    .filter((i) => parseFloat(i.parLevel) > 0 && i.stockNum < parseFloat(i.parLevel))
    .map((item) => {
      const suggestedQty = Math.max(0, parseFloat(item.parLevel) - item.stockNum);
      return {
        itemName: item.name,
        suggestedQty: Math.round(suggestedQty * 1000) / 1000,
        unit: item.unit,
        supplierName: item.supplierId ? supplierMap.get(item.supplierId) ?? null : null,
        estimatedCost: suggestedQty * item.costNum,
      };
    })
    .sort((a, b) => b.estimatedCost - a.estimatedCost);

  const orderGrandTotal = orderItems.reduce((sum, item) => sum + item.estimatedCost, 0);

  const supplierCutoffs = suppliers
    .filter((s) => s.orderCutoffTime && s.deliveryDays)
    .map((s) => {
      const [hours, minutes] = (s.orderCutoffTime as string).split(":").map(Number);
      const cutoffToday = new Date();
      cutoffToday.setHours(hours!, minutes!, 0, 0);
      const minutesUntilCutoff = Math.floor((cutoffToday.getTime() - Date.now()) / 60_000);
      return {
        supplierName: s.name,
        minutesUntilCutoff,
        isUrgent: minutesUntilCutoff >= 0 && minutesUntilCutoff <= 120,
      };
    })
    .filter((c) => c.isUrgent);

  const openPrepTasks = targetPrepTasks.filter((t) => t.status !== "done");
  const urgentPrepTasks = openPrepTasks.filter((t) => t.priority === "high" || t.isCritical);
  const tomorrowOpenTasks = tomorrowPrepTasks.filter((t) => t.status !== "done");

  const cleaningOverdueCount = cleaningTasks.filter((t) => isCleaningOverdue(t)).length;
  const unresolvedTemperatureFails = targetTemperatureLogs.filter((l) => l.status === "fail" && l.isResolved !== true).length;
  const lastLogByEquipment = new Map<number, typeof temperatureLogsTable.$inferSelect>();
  for (const log of targetTemperatureLogs) {
    if (log.equipmentId && (!lastLogByEquipment.has(log.equipmentId) || log.checkedAt > lastLogByEquipment.get(log.equipmentId)!.checkedAt)) {
      lastLogByEquipment.set(log.equipmentId, log);
    }
  }
  const temperatureOverdueCount = temperatureEquipment.filter((e) => {
    const lastLog = lastLogByEquipment.get(e.id);
    if (!lastLog) return true;
    if (!e.checkIntervalHours) return false;
    return (Date.now() - lastLog.checkedAt.getTime()) / 36e5 > e.checkIntervalHours;
  }).length;
  const complianceIssueCount = pendingComplianceTasks.length + cleaningOverdueCount + unresolvedTemperatureFails + temperatureOverdueCount;

  const covers = options.covers ?? venue.avgCoversPerService ?? 0;
  let suggestedPrepTasks: KitchenAssistantContext["prep"]["suggestedTasks"] = [];
  if (covers > 0) {
    const plan = await calculatePrepPlan(venueId, {
      menuId: activeMenu[0]?.id,
      prepDate: tomorrowDate,
      servicePeriods: [{ label: "Service", covers }],
    });
    suggestedPrepTasks = plan.suggestedPrepTasks.slice(0, 8).map((task) => ({
      title: task.libraryTask?.title ?? task.title,
      recipeName: task.recipeName,
      gapQuantity: task.quantity,
      unit: task.unit,
    }));
  }

  const prepGapCount = prepAlertItems.length + suggestedPrepTasks.length;

  const now = Date.now();
  const oneDayMs = 86_400_000;
  const activeRecipes = recipes.filter((r) => r.status === "active");
  const staleReviewCount = activeRecipes.filter((r) => {
    if (!r.lastReviewedAt) return true;
    return (now - r.lastReviewedAt.getTime()) / oneDayMs > 60;
  }).length;
  const staleCostCount = activeRecipes.filter((r) => {
    if (!r.lastCostUpdateAt) return true;
    return (now - r.lastCostUpdateAt.getTime()) / oneDayMs > 30;
  }).length;

  const lastStocktake = stocktakes[0];
  const daysSinceLastStocktake = lastStocktake
    ? Math.floor((now - lastStocktake.conductedAt.getTime()) / oneDayMs)
    : null;

  const latestBySupplier = new Map<number, Date>();
  for (const inv of invoices) {
    if (!inv.supplierId) continue;
    const d = new Date(`${inv.invoiceDate}T00:00:00Z`);
    const prev = latestBySupplier.get(inv.supplierId);
    if (!prev || d > prev) latestBySupplier.set(inv.supplierId, d);
  }
  const trackedSuppliers = suppliers.filter((s) => s.expectedInvoiceFrequencyDays && s.expectedInvoiceFrequencyDays > 0);
  let suppliersWithGap = 0;
  for (const s of trackedSuppliers) {
    const latest = latestBySupplier.get(s.id);
    if (!latest) { suppliersWithGap++; continue; }
    const days = Math.floor((now - latest.getTime()) / oneDayMs);
    if (days > (s.expectedInvoiceFrequencyDays as number) * 1.5) suppliersWithGap++;
  }

  const priceSpikes: Array<{ supplierName: string; itemName: string; changePercent: number }> = [];
  for (const supplier of suppliers) {
    const history = await db.select().from(priceHistoryTable).where(eq(priceHistoryTable.supplierId, supplier.id));
    for (const h of history.filter((entry) => entry.changePercent && parseFloat(entry.changePercent) >= 10)) {
      priceSpikes.push({
        supplierName: supplier.name,
        itemName: h.itemName,
        changePercent: parseFloat(h.changePercent as string),
      });
    }
  }
  priceSpikes.sort((a, b) => b.changePercent - a.changePercent);

  const itemsWithPar = enriched.filter((i) => parseFloat(i.parLevel ?? "0") > 0);
  let parDriftItems = 0;
  for (const i of itemsWithPar) {
    const par = parseFloat(i.parLevel);
    if (i.stockNum < par * 0.5 || i.stockNum > par * 2) parDriftItems++;
  }

  const foodCostDrivers: KitchenAssistantContext["foodCost"]["drivers"] = [];
  if (priceSpikes.length > 0) {
    const top = priceSpikes[0]!;
    foodCostDrivers.push({
      type: "price_spike",
      label: "Supplier price increases",
      detail: `${top.itemName} from ${top.supplierName} up ${top.changePercent.toFixed(0)}%`,
      impact: top.changePercent >= 20 ? "high" : "medium",
    });
  }
  if (staleReviewCount > 0) {
    foodCostDrivers.push({
      type: "stale_recipes",
      label: "Recipe costs not reviewed",
      detail: `${staleReviewCount} active recipe${staleReviewCount === 1 ? "" : "s"} not reviewed in 60+ days`,
      impact: staleReviewCount >= 5 ? "high" : "medium",
    });
  }
  if (suppliersWithGap > 0) {
    foodCostDrivers.push({
      type: "invoice_gap",
      label: "Missing supplier invoices",
      detail: `${suppliersWithGap} supplier${suppliersWithGap === 1 ? "" : "s"} overdue on expected invoice cadence`,
      impact: "medium",
    });
  }
  if (parDriftItems > 0) {
    foodCostDrivers.push({
      type: "par_drift",
      label: "Stock levels drifting from par",
      detail: `${parDriftItems} item${parDriftItems === 1 ? "" : "s"} repeatedly outside par bands`,
      impact: "low",
    });
  }
  if (daysSinceLastStocktake !== null && daysSinceLastStocktake > 30) {
    foodCostDrivers.push({
      type: "stale_stocktake",
      label: "Stocktake data is stale",
      detail: `Last stocktake was ${daysSinceLastStocktake} days ago`,
      impact: "medium",
    });
  }

  const foodCostScore = activeRecipes.length === 0
    ? 100
    : clampScore(100 - ((staleReviewCount + staleCostCount) / (activeRecipes.length * 2)) * 100);
  const foodCostLevel = foodCostScore >= 80 ? "strong" : foodCostScore >= 55 ? "fair" : "weak";
  const foodCostTrend = priceSpikes.length > 0 || suppliersWithGap > 0 ? "rising" : foodCostLevel === "weak" ? "uncertain" : "stable";

  const recentWaste = wasteLogs.filter((w) => w.loggedAt >= sevenDaysAgo && w.loggedAt < targetStart);
  const periodWaste = wasteLogs.filter((w) => w.loggedAt >= thirtyDaysAgo);
  const wasteToday = wasteLogs
    .filter((w) => w.loggedAt >= targetStart)
    .reduce((sum, w) => sum + parseFloat(w.costImpact), 0);
  const sevenDayAverageWaste = recentWaste.reduce((sum, w) => sum + parseFloat(w.costImpact), 0) / 7;
  const wasteElevated = wasteToday > 0 && wasteToday > Math.max(25, sevenDayAverageWaste * 1.5);
  const totalWasteCost = periodWaste.reduce((sum, w) => sum + parseFloat(w.costImpact), 0);

  const wasteByItem = new Map<string, { totalCost: number; count: number; reasons: Map<string, number> }>();
  for (const log of periodWaste) {
    const entry = wasteByItem.get(log.itemName) ?? { totalCost: 0, count: 0, reasons: new Map<string, number>() };
    entry.totalCost += parseFloat(log.costImpact);
    entry.count += 1;
    entry.reasons.set(log.reason, (entry.reasons.get(log.reason) ?? 0) + 1);
    wasteByItem.set(log.itemName, entry);
  }
  const topWasteItems = [...wasteByItem.entries()]
    .map(([itemName, data]) => {
      const topReason = [...data.reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
      return {
        itemName,
        totalCost: Math.round(data.totalCost * 100) / 100,
        count: data.count,
        topReason,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 6);

  const blockers: KitchenAssistantContext["readiness"]["blockers"] = [];
  if (critical.length > 0) {
    blockers.push({
      category: "stock",
      title: `${critical.length} critical stock item${critical.length === 1 ? "" : "s"}`,
      detail: `${critical[0]!.name} is at ${critical[0]!.stockNum} ${critical[0]!.unit}.`,
      severity: "critical",
      href: "/inventory?status=critical",
    });
  }
  if (urgentPrepTasks.length > 0 || prepAlertItems.length > 0) {
    blockers.push({
      category: "prep",
      title: urgentPrepTasks.length > 0
        ? `${urgentPrepTasks.length} urgent prep task${urgentPrepTasks.length === 1 ? "" : "s"} open`
        : `${prepAlertItems.length} prep item${prepAlertItems.length === 1 ? "" : "s"} below par`,
      detail: urgentPrepTasks[0]?.title ?? `${prepAlertItems[0]?.name ?? "Prep"} needs attention before service.`,
      severity: "high",
      href: "/prep-board",
    });
  }
  if (complianceIssueCount > 0) {
    blockers.push({
      category: "compliance",
      title: `${complianceIssueCount} compliance issue${complianceIssueCount === 1 ? "" : "s"}`,
      detail: unresolvedTemperatureFails > 0 ? "Temperature failure needs resolving." : "Checks or documents are overdue.",
      severity: unresolvedTemperatureFails > 0 ? "critical" : "high",
      href: unresolvedTemperatureFails > 0 ? "/temperature" : "/compliance",
    });
  }
  if (orderItems.length > 0) {
    blockers.push({
      category: "order",
      title: `${orderItems.length} item${orderItems.length === 1 ? "" : "s"} below par`,
      detail: supplierCutoffs.length > 0 ? "Supplier cutoff is close." : "Ordering gaps remain before service.",
      severity: supplierCutoffs.length > 0 ? "high" : "medium",
      href: "/orders",
    });
  }
  if (foodCostLevel === "weak") {
    blockers.push({
      category: "food_cost",
      title: "Food cost confidence is weak",
      detail: "Recipe costs need review before trusting margin.",
      severity: "high",
      href: "/recipes",
    });
  }

  const readinessPenalty =
    critical.length * 20 +
    urgentPrepTasks.length * 10 +
    prepAlertItems.length * 8 +
    complianceIssueCount * 8 +
    (supplierCutoffs.length > 0 ? 10 : 0) +
    (foodCostLevel === "weak" ? 10 : 0);
  const readinessScore = clampScore(100 - Math.min(100, readinessPenalty));
  const readinessStatus: ReadinessStatus =
    blockers.some((b) => b.severity === "critical") || readinessScore < 50
      ? "not_ready"
      : blockers.length > 0 || readinessScore < 80
        ? "watch"
        : "ready";

  const readinessHeadline =
    readinessStatus === "ready"
      ? `Kitchen looks ready for ${formatDateLabel(targetDate)} service`
      : readinessStatus === "watch"
        ? `${blockers.length} area${blockers.length === 1 ? "" : "s"} need attention before ${formatDateLabel(targetDate)}`
        : `Not ready for ${formatDateLabel(targetDate)} — resolve blockers first`;

  const prepHeadline = suggestedPrepTasks.length > 0
    ? `${suggestedPrepTasks.length} prep task${suggestedPrepTasks.length === 1 ? "" : "s"} suggested for ${formatDateLabel(tomorrowDate)}`
    : tomorrowOpenTasks.length > 0
      ? `${tomorrowOpenTasks.length} prep task${tomorrowOpenTasks.length === 1 ? "" : "s"} already on the board for tomorrow`
      : prepAlertItems.length > 0
        ? `${prepAlertItems.length} in-house prep item${prepAlertItems.length === 1 ? "" : "s"} below par now`
        : "Prep board looks clear for tomorrow";

  const orderingHeadline = orderItems.length === 0
    ? "Stock levels meet par — no urgent ordering gaps"
    : supplierCutoffs.length > 0
      ? `${orderItems.length} item${orderItems.length === 1 ? "" : "s"} to order — supplier cutoff soon`
      : `${orderItems.length} item${orderItems.length === 1 ? "" : "s"} below par`;

  const wasteHeadline = topWasteItems.length === 0
    ? "No significant waste logged in the last 30 days"
    : wasteElevated
      ? `Waste is elevated today — top loss is ${topWasteItems[0]!.itemName}`
      : `${topWasteItems[0]!.itemName} is the biggest waste driver this month`;

  const foodCostHeadline = foodCostTrend === "rising"
    ? "Food cost pressure is building — review price and recipe changes"
    : foodCostLevel === "weak"
      ? "Food cost confidence is weak — costs may not reflect reality"
      : "Food cost signals look stable";

  const briefing: AssistantBriefingAnswer[] = [
    {
      id: "service-readiness",
      question: `Are we ready for ${formatDateLabel(targetDate)} service?`,
      answer: readinessHeadline,
      status: readinessStatus === "ready" ? "ready" : readinessStatus === "watch" ? "watch" : "action_required",
      confidence: confidenceFromScore(readinessScore),
      evidence: blockers.slice(0, 4).map((blocker) => ({
        label: blocker.title,
        value: blocker.detail,
        href: blocker.href,
      })),
      href: "/dashboard",
    },
    {
      id: "food-cost-trend",
      question: "Why is food cost increasing?",
      answer: foodCostHeadline,
      status: foodCostTrend === "stable" ? "ready" : foodCostTrend === "rising" ? "action_required" : "watch",
      confidence: foodCostLevel === "strong" ? "high" : foodCostLevel === "fair" ? "medium" : "low",
      evidence: foodCostDrivers.slice(0, 4).map((driver) => ({
        label: driver.label,
        value: driver.detail,
        href: driver.type === "price_spike" ? "/analytics" : driver.type === "stale_recipes" ? "/recipes" : "/invoices",
      })),
      href: "/analytics",
    },
    {
      id: "prep-tomorrow",
      question: "What should I prep tomorrow?",
      answer: prepHeadline,
      status: suggestedPrepTasks.length > 0 || prepAlertItems.length > 0 ? "watch" : "ready",
      confidence: covers > 0 ? "high" : "medium",
      evidence: [
        ...suggestedPrepTasks.slice(0, 3).map((task) => ({
          label: task.title,
          value: `${task.gapQuantity} ${task.unit} gap for ${task.recipeName}`,
          href: "/prep-board",
        })),
        ...prepAlertItems.slice(0, 2).map((item) => ({
          label: item.name,
          value: `${item.stockNum} ${item.unit} on hand — below par`,
          href: "/prep-board",
        })),
      ],
      href: "/prep-board",
    },
    {
      id: "ordering-needs",
      question: "What do I need to order?",
      answer: orderingHeadline,
      status: orderItems.length === 0 ? "ready" : supplierCutoffs.length > 0 ? "action_required" : "watch",
      confidence: "high",
      evidence: orderItems.slice(0, 4).map((item) => ({
        label: item.itemName,
        value: `Order ~${item.suggestedQty} ${item.unit}${item.supplierName ? ` from ${item.supplierName}` : ""}`,
        href: "/orders",
      })),
      href: "/orders",
    },
    {
      id: "waste-loss",
      question: "Where are we wasting money?",
      answer: wasteHeadline,
      status: wasteElevated || topWasteItems.length > 0 ? "watch" : "info",
      confidence: periodWaste.length >= 5 ? "high" : periodWaste.length > 0 ? "medium" : "low",
      evidence: [
        ...topWasteItems.slice(0, 3).map((item) => ({
          label: item.itemName,
          value: `$${item.totalCost.toFixed(2)} wasted (${item.count} log${item.count === 1 ? "" : "s"}, mostly ${item.topReason.replace(/_/g, " ")})`,
          href: "/waste",
        })),
        ...(stagnantValue > 0 ? [{
          label: "Stagnant stock value",
          value: `$${Math.round(stagnantValue).toLocaleString()} tied up in slow-moving stock`,
          href: "/inventory?status=stagnant",
        }] : []),
      ],
      href: "/waste",
    },
  ];

  return {
    meta: {
      venueId,
      venueName: venue.name,
      generatedAt: new Date().toISOString(),
      targetDate,
      tomorrowDate,
      timezone: venue.timezone ?? "UTC",
      avgCoversPerService: venue.avgCoversPerService ?? null,
    },
    readiness: {
      status: readinessStatus,
      score: readinessScore,
      headline: readinessHeadline,
      blockers,
    },
    foodCost: {
      trend: foodCostTrend,
      confidenceScore: foodCostScore,
      confidenceLevel: foodCostLevel,
      headline: foodCostHeadline,
      drivers: foodCostDrivers,
    },
    prep: {
      targetDate: tomorrowDate,
      openTaskCount: tomorrowOpenTasks.length,
      urgentTaskCount: tomorrowOpenTasks.filter((t) => t.priority === "high" || t.isCritical).length,
      prepGapCount,
      suggestedTasks: suggestedPrepTasks,
      headline: prepHeadline,
    },
    ordering: {
      itemCount: orderItems.length,
      estimatedTotal: Math.round(orderGrandTotal * 100) / 100,
      urgentCutoffCount: supplierCutoffs.length,
      topItems: orderItems.slice(0, 8).map(({ itemName, suggestedQty, unit, supplierName }) => ({
        itemName,
        suggestedQty,
        unit,
        supplierName,
      })),
      headline: orderingHeadline,
    },
    waste: {
      periodDays: 30,
      totalCost: Math.round(totalWasteCost * 100) / 100,
      todayCost: Math.round(wasteToday * 100) / 100,
      isElevatedToday: wasteElevated,
      topItems: topWasteItems,
      stagnantValue: Math.round(stagnantValue * 100) / 100,
      headline: wasteHeadline,
    },
    briefing,
  };
}
