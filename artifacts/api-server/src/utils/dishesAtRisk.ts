import type { DishRiskItem, DishRiskStatus } from "../types/commandCentre.js";
import type { PrepPlanResult } from "./prepPlan.js";
import { sourceMatchesDish } from "./operationalAttention.js";

type ShortageLine = {
  name: string;
  gapQuantity: number;
  requiredQuantity: number;
  unit: string;
  stockType: "raw" | "prep";
};

function collectShortagesForDish(plan: PrepPlanResult, recipeName: string): ShortageLine[] {
  const shortages: ShortageLine[] = [];

  for (const req of plan.ingredientRequirements) {
    if (req.gapQuantity <= 0) continue;
    if (!req.sources.some((source) => sourceMatchesDish(source, recipeName))) continue;
    shortages.push({
      name: req.itemName,
      gapQuantity: req.gapQuantity,
      requiredQuantity: req.requiredQuantity,
      unit: req.unit,
      stockType: "raw",
    });
  }

  for (const req of plan.prepRequirements) {
    if (req.gapQuantity <= 0) continue;
    if (!req.sources.some((source) => sourceMatchesDish(source, recipeName))) continue;
    shortages.push({
      name: req.recipeName,
      gapQuantity: req.gapQuantity,
      requiredQuantity: req.requiredQuantity,
      unit: req.unit,
      stockType: "prep",
    });
  }

  return shortages.sort((a, b) => b.gapQuantity - a.gapQuantity);
}

function classifyDishRisk(
  portionsRequired: number,
  shortages: ShortageLine[],
): { status: DishRiskStatus; portionsAtRisk: number } {
  if (shortages.length === 0) {
    return { status: "ready", portionsAtRisk: 0 };
  }

  let worstCoverage = 1;
  for (const shortage of shortages) {
    if (shortage.requiredQuantity <= 0) continue;
    const available = Math.max(0, shortage.requiredQuantity - shortage.gapQuantity);
    worstCoverage = Math.min(worstCoverage, available / shortage.requiredQuantity);
  }

  const portionsAtRisk = Math.round(portionsRequired * (1 - worstCoverage) * 10) / 10;

  if (worstCoverage <= 0) {
    return { status: "cannot_produce", portionsAtRisk: portionsRequired };
  }
  if (worstCoverage < 0.5) {
    return { status: "may_run_out", portionsAtRisk };
  }
  return { status: "ingredient_shortage", portionsAtRisk };
}

export function computeDishesAtRisk(plan: PrepPlanResult | null): DishRiskItem[] {
  if (!plan || plan.menuProduction.length === 0) return [];

  return plan.menuProduction.map((dish) => {
    const shortages = collectShortagesForDish(plan, dish.recipeName);
    const { status, portionsAtRisk } = classifyDishRisk(dish.portionsRequired, shortages);

    return {
      recipeId: dish.recipeId,
      recipeName: dish.recipeName,
      portionsRequired: dish.portionsRequired,
      portionsAtRisk,
      status,
      blockingItems: shortages.slice(0, 3).map((s) => ({
        name: s.name,
        gapQuantity: s.gapQuantity,
        unit: s.unit,
        stockType: s.stockType,
      })),
      href: `/recipes/${dish.recipeId}`,
    };
  }).sort((a, b) => {
    const rank: Record<DishRiskStatus, number> = {
      cannot_produce: 0,
      may_run_out: 1,
      ingredient_shortage: 2,
      ready: 3,
    };
    return rank[a.status] - rank[b.status] || b.portionsAtRisk - a.portionsAtRisk;
  });
}
