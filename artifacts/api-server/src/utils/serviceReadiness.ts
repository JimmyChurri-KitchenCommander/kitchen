import type { ServiceReadiness } from "../types/commandCentre.js";
import type { ComplianceSnapshot } from "./complianceSnapshot.js";
import type { DishRiskItem } from "../types/commandCentre.js";
import type { EnrichedInventoryItem } from "./inventoryStatus.js";
import type { PrepPlanResult } from "./prepPlan.js";

export type ServiceReadinessInput = {
  plan: PrepPlanResult | null;
  openPrepTasks: Array<{ status: string }>;
  donePrepTasks: Array<{ status: string }>;
  suggestedPrepCount: number;
  enrichedInventory: EnrichedInventoryItem[];
  compliance: ComplianceSnapshot;
  dishesAtRisk: DishRiskItem[];
  demandOrderGapCount: number;
  urgentCutoffCount: number;
  criticalStockCount: number;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeServiceReadiness(input: ServiceReadinessInput): ServiceReadiness {
  const totalTasks = input.openPrepTasks.length + input.donePrepTasks.length;
  let prepScore = 100;
  if (totalTasks > 0) {
    prepScore = clampScore((input.donePrepTasks.length / totalTasks) * 100);
  }
  if (input.plan && input.suggestedPrepCount > 0) {
    prepScore = clampScore(prepScore - Math.min(40, input.suggestedPrepCount * 8));
  }

  let inventoryScore = 100;
  const ingredientRequirements = input.plan?.ingredientRequirements ?? [];
  if (input.plan && input.plan.totalCovers > 0 && ingredientRequirements.length > 0) {
    const satisfied = ingredientRequirements.filter((req) => req.gapQuantity <= 0).length;
    inventoryScore = clampScore((satisfied / ingredientRequirements.length) * 100);
  } else if (input.enrichedInventory.length > 0) {
    const healthy = input.enrichedInventory.filter((item) => item.status !== "critical" && item.status !== "low_stock").length;
    inventoryScore = clampScore((healthy / input.enrichedInventory.length) * 100);
  }

  let orderingScore = 100;
  if (input.plan) {
    orderingScore = input.demandOrderGapCount === 0
      ? 100
      : clampScore(100 - Math.min(100, input.demandOrderGapCount * 10));
    if (input.urgentCutoffCount > 0 && input.demandOrderGapCount > 0) {
      orderingScore = clampScore(orderingScore - 15);
    }
  } else {
    const parGaps = input.enrichedInventory.filter((item) => item.parLevel > 0 && item.stockNum < item.parLevel).length;
    orderingScore = parGaps === 0 ? 100 : clampScore(100 - Math.min(100, parGaps * 8));
  }

  const complianceScore = input.compliance.score;

  const criticalStockScore = clampScore(100 - Math.min(100, input.criticalStockCount * 15));

  let menuScore = 100;
  if (input.dishesAtRisk.length > 0) {
    const readyCount = input.dishesAtRisk.filter((d) => d.status === "ready").length;
    menuScore = clampScore((readyCount / input.dishesAtRisk.length) * 100);
  }

  const factors = [
    { key: "prep_completion", label: "Prep completion", score: prepScore, weight: 25, message: prepScore >= 80 ? "Prep on track" : "Prep gaps remain for service" },
    { key: "inventory_availability", label: "Inventory availability", score: inventoryScore, weight: 25, message: inventoryScore >= 80 ? "Stock covers service demand" : "Ingredient gaps detected" },
    { key: "ordering_status", label: "Ordering status", score: orderingScore, weight: 15, message: orderingScore >= 80 ? "Ordering gaps under control" : "Items still need ordering" },
    { key: "compliance_completion", label: "Compliance completion", score: complianceScore, weight: 20, message: complianceScore >= 80 ? "Compliance checks current" : "Compliance tasks overdue" },
    { key: "critical_stock", label: "Critical stock risks", score: criticalStockScore, weight: 10, message: criticalStockScore >= 80 ? "No critical stock alerts" : "Critical stock needs action" },
    { key: "menu_availability", label: "Menu availability", score: menuScore, weight: 5, message: menuScore >= 80 ? "Menu dishes look producible" : "Some dishes are at risk" },
  ];

  const score = clampScore(factors.reduce((sum, factor) => sum + (factor.score * factor.weight) / 100, 0));

  const hasCriticalDish = input.dishesAtRisk.some((d) => d.status === "cannot_produce");
  const unresolvedTemp = input.compliance.temperatureUnresolvedFails > 0;

  let colour: ServiceReadiness["colour"] = "green";
  let label: ServiceReadiness["label"] = "ready";
  if (score < 60 || hasCriticalDish) {
    colour = "red";
    label = "high_risk";
  } else if (score < 85 || unresolvedTemp || input.dishesAtRisk.some((d) => d.status === "may_run_out")) {
    colour = "amber";
    label = "attention_required";
  }

  if (unresolvedTemp && colour === "green") {
    colour = "amber";
    label = "attention_required";
  }

  const headline = label === "ready"
    ? "Kitchen looks ready for service"
    : label === "attention_required"
      ? `${input.dishesAtRisk.filter((d) => d.status !== "ready").length || input.compliance.totalIssues || input.suggestedPrepCount} area${(input.dishesAtRisk.filter((d) => d.status !== "ready").length || 1) === 1 ? "" : "s"} need attention before service`
      : "High service risk — resolve blockers before service";

  return {
    score,
    colour,
    label,
    headline,
    factors,
    coversRequiredForAccuracy: !input.plan || input.plan.totalCovers <= 0,
  };
}
