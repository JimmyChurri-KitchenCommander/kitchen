import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  chemicalsTable,
  cleaningTasksTable,
  complianceTasksTable,
  inventoryItemsTable,
  prepTasksTable,
  recipesTable,
  suppliersTable,
  temperatureEquipmentTable,
  temperatureLogsTable,
  venuesTable,
  wasteLogsTable,
} from "@workspace/db";
import type { CommandCentreView, MorningRunInput } from "../types/commandCentre.js";
import { buildComplianceSnapshot } from "./complianceSnapshot.js";
import { computeDishesAtRisk } from "./dishesAtRisk.js";
import { enrichInventoryItem } from "./inventoryStatus.js";
import { mergeDemandAndParOrdering, orderTodayHeadline } from "./mergeOrdering.js";
import { buildOperationalAttention } from "./operationalAttention.js";
import { calculatePrepPlan, type PrepPlanInput } from "./prepPlan.js";
import { computeServiceReadiness } from "./serviceReadiness.js";
import { computeSupplierCutoffs } from "./supplierCutoffs.js";

export type BuildCommandCentreOptions = {
  targetDate?: string;
  servicePeriods?: Array<{ label: string; covers: number }>;
  createPrepTasks?: boolean;
  prepTaskSelection?: "all" | "gaps_only";
};

function defaultServicePeriods(
  venue: typeof venuesTable.$inferSelect,
): Array<{ label: string; covers: number }> {
  const windows = venue.serviceWindows ?? [];
  const avg = venue.avgCoversPerService ?? 0;
  if (windows.length >= 2 && avg > 0) {
    return [
      { label: windows[0]!.label || "Lunch", covers: Math.round(avg * 0.4) },
      { label: windows[1]!.label || "Dinner", covers: Math.round(avg * 0.6) },
    ];
  }
  if (windows.length === 1 && avg > 0) {
    return [{ label: windows[0]!.label || "Service", covers: avg }];
  }
  return [];
}

async function createPrepTasksFromPlan(
  venueId: number,
  targetDate: string,
  plan: NonNullable<CommandCentreView["plan"]>,
  selection: "all" | "gaps_only",
): Promise<number> {
  const tasks = selection === "gaps_only"
    ? plan.suggestedPrepTasks.filter((task) => task.quantity > 0)
    : plan.suggestedPrepTasks;

  let created = 0;
  for (const task of tasks) {
    const [existing] = await db.select().from(prepTasksTable).where(and(
      eq(prepTasksTable.venueId, venueId),
      eq(prepTasksTable.prepDate, targetDate),
      eq(prepTasksTable.recipeId, task.recipeId),
      ne(prepTasksTable.isArchived, true),
      ne(prepTasksTable.status, "done"),
    )).limit(1);
    if (existing) continue;

    await db.insert(prepTasksTable).values({
      venueId,
      title: task.title,
      description: task.reason,
      category: task.libraryTask?.category ?? "sauce",
      section: task.libraryTask?.section ?? "make",
      shift: task.libraryTask?.shift ?? task.shift,
      priority: task.libraryTask?.priority ?? task.priority,
      status: "todo",
      quantity: String(task.quantity),
      unit: task.unit,
      recipeId: task.recipeId,
      libraryTaskId: task.libraryTask?.id ?? null,
      prepDate: targetDate,
      isCritical: task.priority === "high",
    });
    created += 1;
  }
  return created;
}

export async function buildCommandCentreView(
  venueId: number,
  options: BuildCommandCentreOptions = {},
): Promise<CommandCentreView> {
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue) throw new Error("Venue not found");

  const targetDate = options.targetDate ?? new Date().toISOString().slice(0, 10);
  const servicePeriods = (options.servicePeriods ?? [])
    .map((period) => ({ label: period.label.trim() || "Service", covers: Math.max(0, Number(period.covers) || 0) }))
    .filter((period) => period.covers > 0);
  const totalCovers = servicePeriods.reduce((sum, period) => sum + period.covers, 0);

  const todayStart = new Date(`${targetDate}T00:00:00`);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [
    rawItems,
    suppliers,
    wasteLogs,
    todayPrepTasksInitial,
    cleaningTasks,
    complianceTasks,
    temperatureEquipment,
    todayTemperatureLogs,
    recipesForConfidence,
    chemicals,
  ] = await Promise.all([
    db.select().from(inventoryItemsTable).where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true))),
    db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
    db.select().from(wasteLogsTable).where(eq(wasteLogsTable.venueId, venueId)),
    db.select().from(prepTasksTable).where(and(
      eq(prepTasksTable.venueId, venueId),
      eq(prepTasksTable.prepDate, targetDate),
      ne(prepTasksTable.isArchived, true),
    )),
    db.select().from(cleaningTasksTable).where(eq(cleaningTasksTable.venueId, venueId)),
    db.select().from(complianceTasksTable).where(eq(complianceTasksTable.venueId, venueId)),
    db.select().from(temperatureEquipmentTable).where(and(eq(temperatureEquipmentTable.venueId, venueId), ne(temperatureEquipmentTable.isArchived, true))),
    db.select().from(temperatureLogsTable).where(and(eq(temperatureLogsTable.venueId, venueId), sql`${temperatureLogsTable.checkedAt} >= ${todayStart}`)),
    db.select().from(recipesTable).where(and(eq(recipesTable.venueId, venueId), ne(recipesTable.isArchived, true))),
    db.select().from(chemicalsTable).where(eq(chemicalsTable.venueId, venueId)),
  ]);

  let todayPrepTasks = todayPrepTasksInitial;

  let plan: Awaited<ReturnType<typeof calculatePrepPlan>> | null = null;
  if (totalCovers > 0) {
    const prepInput: PrepPlanInput = {
      prepDate: targetDate,
      servicePeriods,
    };
    plan = await calculatePrepPlan(venueId, prepInput);
  }

  let prepTasksCreated = 0;
  if (options.createPrepTasks && plan && plan.suggestedPrepTasks.length > 0) {
    prepTasksCreated = await createPrepTasksFromPlan(
      venueId,
      targetDate,
      plan,
      options.prepTaskSelection ?? "gaps_only",
    );
    if (prepTasksCreated > 0) {
      todayPrepTasks = await db.select().from(prepTasksTable).where(and(
        eq(prepTasksTable.venueId, venueId),
        eq(prepTasksTable.prepDate, targetDate),
        ne(prepTasksTable.isArchived, true),
      ));
    }
  }

  const supplierNames = new Map(suppliers.map((s) => [s.id, s.name]));
  const enriched = rawItems.map((item) => enrichInventoryItem(item));
  const criticalStock = enriched.filter((item) => item.status === "critical");
  const lowStock = enriched.filter((item) => item.status === "low_stock");

  const prepAlertItems = enriched.filter(
    (item) => item.productionRecipeId != null && (item.status === "critical" || item.status === "low_stock"),
  );
  const prepAlerts = prepAlertItems.map((item) => ({ itemName: item.name }));

  const supplierCutoffs = computeSupplierCutoffs(suppliers);
  const urgentCutoffCount = supplierCutoffs.filter((cutoff) => cutoff.isUrgent).length;

  const compliance = buildComplianceSnapshot({
    cleaningTasks,
    temperatureEquipment,
    todayTemperatureLogs,
    complianceTasks,
    chemicals,
  });

  const staleReviewCount = recipesForConfidence.filter((recipe) => {
    if (recipe.status !== "active") return false;
    if (!recipe.lastReviewedAt) return true;
    return (Date.now() - recipe.lastReviewedAt.getTime()) / 86_400_000 > 60;
  }).length;
  const staleCostCount = recipesForConfidence.filter((recipe) => {
    if (recipe.status !== "active") return false;
    if (!recipe.lastCostUpdateAt) return true;
    return (Date.now() - recipe.lastCostUpdateAt.getTime()) / 86_400_000 > 30;
  }).length;
  const activeRecipeCount = recipesForConfidence.filter((recipe) => recipe.status === "active").length;
  const foodCostScore = activeRecipeCount === 0
    ? 100
    : Math.max(0, Math.round(100 - ((staleReviewCount + staleCostCount) / (activeRecipeCount * 2)) * 100));
  const foodCostLevel = foodCostScore >= 80 ? "strong" : foodCostScore >= 55 ? "watch" : "weak";

  const wasteToday = wasteLogs
    .filter((log) => log.loggedAt >= todayStart)
    .reduce((sum, log) => sum + parseFloat(log.costImpact), 0);
  const recentWaste = wasteLogs.filter((log) => log.loggedAt >= sevenDaysAgo && log.loggedAt < todayStart);
  const sevenDayAverageWaste = recentWaste.reduce((sum, log) => sum + parseFloat(log.costImpact), 0) / 7;
  const wasteElevated = wasteToday > 0 && wasteToday > Math.max(25, sevenDayAverageWaste * 1.5);

  const wasteByItem = new Map<string, { totalCost: number; count: number }>();
  for (const log of wasteLogs.filter((entry) => entry.loggedAt >= thirtyDaysAgo)) {
    const existing = wasteByItem.get(log.itemName) ?? { totalCost: 0, count: 0 };
    existing.totalCost += parseFloat(log.costImpact);
    existing.count += 1;
    wasteByItem.set(log.itemName, existing);
  }
  const topWasteItems = [...wasteByItem.entries()]
    .map(([itemName, data]) => ({
      itemName,
      totalCost: Math.round(data.totalCost * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);

  const dishesAtRisk = computeDishesAtRisk(plan);
  const { items: orderItems, source, demandOrderGapCount } = mergeDemandAndParOrdering(plan, enriched, supplierNames);
  const orderGrandTotal = orderItems.reduce((sum, item) => sum + item.estimatedCost, 0);

  const openPrepTasks = todayPrepTasks.filter((task) => task.status !== "done");
  const donePrepTasks = todayPrepTasks.filter((task) => task.status === "done");
  const urgentPrepCount = openPrepTasks.filter((task) => task.priority === "high" || task.isCritical).length;

  const boardRecipeIds = new Set(openPrepTasks.map((task) => task.recipeId).filter(Boolean));
  const suggestedTasks = (plan?.suggestedPrepTasks ?? []).map((task) => ({
    recipeId: task.recipeId,
    recipeName: task.recipeName,
    title: task.title,
    quantity: task.quantity,
    unit: task.unit,
    priority: task.priority,
    reason: task.reason,
    onBoard: boardRecipeIds.has(task.recipeId),
  }));

  const serviceReadiness = computeServiceReadiness({
    plan,
    openPrepTasks,
    donePrepTasks,
    suggestedPrepCount: plan?.suggestedPrepTasks.length ?? 0,
    enrichedInventory: enriched,
    compliance,
    dishesAtRisk,
    demandOrderGapCount,
    urgentCutoffCount,
    criticalStockCount: criticalStock.length,
  });

  const attention = buildOperationalAttention({
    openPrepTasks,
    urgentPrepCount,
    prepAlerts,
    criticalStock,
    lowStock,
    orderItemCount: orderItems.length,
    urgentCutoffCount,
    demandOrderGapCount,
    compliance,
    foodCostLevel,
    staleReviewCount,
    wasteElevated,
    wasteToday,
    sevenDayAverageWaste,
    dishesAtRisk,
    plan,
  });

  const prepHeadline = suggestedTasks.filter((task) => !task.onBoard).length > 0
    ? `${suggestedTasks.filter((task) => !task.onBoard).length} prep task${suggestedTasks.filter((task) => !task.onBoard).length === 1 ? "" : "s"} still needed for today's covers`
    : openPrepTasks.length > 0
      ? `${openPrepTasks.length} open prep task${openPrepTasks.length === 1 ? "" : "s"} on today's board`
      : "Prep board looks clear for today";

  const foodCostDrivers = [];
  if (staleReviewCount > 0) {
    foodCostDrivers.push({
      label: "Recipe reviews overdue",
      detail: `${staleReviewCount} active recipe${staleReviewCount === 1 ? "" : "s"} not reviewed in 60+ days`,
      href: "/recipes",
    });
  }
  if (foodCostLevel === "weak") {
    foodCostDrivers.push({
      label: "Food cost confidence weak",
      detail: "Recipe costing needs review before trusting margin.",
      href: "/recipes",
    });
  }

  return {
    meta: {
      venueId,
      venueName: venue.name,
      generatedAt: new Date().toISOString(),
      targetDate,
      totalCovers: totalCovers > 0 ? totalCovers : null,
      servicePeriods: totalCovers > 0 ? servicePeriods : defaultServicePeriods(venue),
      planApplied: totalCovers > 0 && !!plan?.menuId,
      menuId: plan?.menuId ?? null,
      menuName: plan?.menuName ?? null,
    },
    serviceReadiness,
    attention,
    dishesAtRisk,
    prepToday: {
      openTaskCount: openPrepTasks.length,
      urgentTaskCount: urgentPrepCount,
      doneTaskCount: donePrepTasks.length,
      boardTasks: todayPrepTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        isCritical: task.isCritical,
        recipeId: task.recipeId ?? null,
        quantity: task.quantity !== null ? parseFloat(task.quantity) : null,
        unit: task.unit ?? null,
      })),
      suggestedTasks,
      headline: prepHeadline,
    },
    orderToday: {
      itemCount: orderItems.length,
      estimatedTotal: Math.round(orderGrandTotal * 100) / 100,
      urgentCutoffCount,
      items: orderItems.slice(0, 20),
      headline: orderTodayHeadline(orderItems.length, urgentCutoffCount, source),
      source,
    },
    compliance: {
      score: compliance.score,
      status: compliance.status,
      totalIssues: compliance.totalIssues,
      headline: compliance.headline,
      temperatureUnresolvedFails: compliance.temperatureUnresolvedFails,
      cleaningOverdueCount: compliance.cleaningOverdueCount,
      pendingTaskCount: compliance.pendingTaskCount,
    },
    foodCost: {
      score: foodCostScore,
      level: foodCostLevel,
      headline: foodCostLevel === "strong"
        ? "Recipe costing is in good shape"
        : foodCostLevel === "watch"
          ? "Recipe costing needs a check"
          : "Recipe costing needs attention",
      staleReviewCount,
      drivers: foodCostDrivers,
    },
    waste: {
      todayCost: Math.round(wasteToday * 100) / 100,
      sevenDayAverage: Math.round(sevenDayAverageWaste * 100) / 100,
      isElevated: wasteElevated,
      headline: wasteElevated
        ? `Waste elevated today — $${wasteToday.toFixed(2)} logged`
        : topWasteItems[0]
          ? `Top waste this month: ${topWasteItems[0].itemName}`
          : "No significant waste logged recently",
      topItems: topWasteItems,
    },
    plan,
    ...(prepTasksCreated > 0 ? { morningRun: { prepTasksCreated } } : {}),
  };
}

export async function runMorningWorkflow(
  venueId: number,
  input: MorningRunInput,
): Promise<CommandCentreView> {
  return buildCommandCentreView(venueId, {
    targetDate: input.targetDate,
    servicePeriods: input.servicePeriods,
    createPrepTasks: input.createPrepTasks ?? true,
    prepTaskSelection: input.prepTaskSelection ?? "gaps_only",
  });
}
