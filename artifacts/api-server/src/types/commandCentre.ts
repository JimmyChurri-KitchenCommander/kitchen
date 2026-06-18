import type { PrepPlanResult } from "../utils/prepPlan.js";

export type ReadinessColour = "green" | "amber" | "red";
export type ReadinessLabel = "ready" | "attention_required" | "high_risk";

export type CommandCentreAttentionItem = {
  id: string;
  category: "prep" | "stock" | "order" | "compliance" | "food_cost" | "waste" | "menu";
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
  href: string;
};

export type DishRiskStatus = "ready" | "ingredient_shortage" | "may_run_out" | "cannot_produce";

export type DishRiskItem = {
  recipeId: number;
  recipeName: string;
  portionsRequired: number;
  portionsAtRisk: number;
  status: DishRiskStatus;
  blockingItems: Array<{
    name: string;
    gapQuantity: number;
    unit: string;
    stockType: "raw" | "prep";
  }>;
  href: string;
};

export type MergedOrderItem = {
  inventoryItemId: number;
  itemName: string;
  suggestedQty: number;
  unit: string;
  supplierId: number | null;
  supplierName: string | null;
  estimatedCost: number;
  reason: "demand_gap" | "par_gap" | "demand_and_par";
  demandGapQuantity: number;
  parGapQuantity: number;
};

export type ServiceReadiness = {
  score: number;
  colour: ReadinessColour;
  label: ReadinessLabel;
  headline: string;
  factors: Array<{
    key: string;
    label: string;
    score: number;
    weight: number;
    message: string;
  }>;
  coversRequiredForAccuracy: boolean;
};

export type CommandCentrePrepTask = {
  id: number;
  title: string;
  status: string;
  priority: string;
  isCritical: boolean;
  recipeId: number | null;
  quantity: number | null;
  unit: string | null;
};

export type CommandCentreSuggestedPrep = {
  recipeId: number;
  recipeName: string;
  title: string;
  quantity: number;
  unit: string;
  priority: string;
  reason: string;
  onBoard: boolean;
};

export type CommandCentreView = {
  meta: {
    venueId: number;
    venueName: string;
    generatedAt: string;
    targetDate: string;
    totalCovers: number | null;
    servicePeriods: Array<{ label: string; covers: number }>;
    planApplied: boolean;
    menuId: number | null;
    menuName: string | null;
  };
  serviceReadiness: ServiceReadiness;
  attention: {
    count: number;
    headline: string;
    items: CommandCentreAttentionItem[];
  };
  dishesAtRisk: DishRiskItem[];
  prepToday: {
    openTaskCount: number;
    urgentTaskCount: number;
    doneTaskCount: number;
    boardTasks: CommandCentrePrepTask[];
    suggestedTasks: CommandCentreSuggestedPrep[];
    headline: string;
  };
  orderToday: {
    itemCount: number;
    estimatedTotal: number;
    urgentCutoffCount: number;
    items: MergedOrderItem[];
    headline: string;
    source: "demand_and_par" | "par_only";
  };
  compliance: {
    score: number;
    status: "ready" | "watch" | "action_required";
    totalIssues: number;
    headline: string;
    temperatureUnresolvedFails: number;
    cleaningOverdueCount: number;
    pendingTaskCount: number;
  };
  foodCost: {
    score: number;
    level: "strong" | "watch" | "weak";
    headline: string;
    staleReviewCount: number;
    drivers: Array<{ label: string; detail: string; href: string }>;
  };
  waste: {
    todayCost: number;
    sevenDayAverage: number;
    isElevated: boolean;
    headline: string;
    topItems: Array<{ itemName: string; totalCost: number; count: number }>;
  };
  plan: PrepPlanResult | null;
  morningRun?: {
    prepTasksCreated: number;
  };
};

export type MorningRunInput = {
  targetDate?: string;
  servicePeriods: Array<{ label: string; covers: number }>;
  createPrepTasks?: boolean;
  prepTaskSelection?: "all" | "gaps_only";
};
