import type { CommandCentreAttentionItem, DishRiskItem } from "../types/commandCentre.js";
import type { EnrichedInventoryItem } from "./inventoryStatus.js";
import type { SupplierCutoff } from "./supplierCutoffs.js";
import type { ComplianceSnapshot } from "./complianceSnapshot.js";
import type { PrepPlanResult } from "./prepPlan.js";

export type OperationalAttentionInput = {
  openPrepTasks: Array<{ title: string; priority: string; isCritical: boolean }>;
  urgentPrepCount: number;
  prepAlerts: Array<{ itemName: string }>;
  criticalStock: EnrichedInventoryItem[];
  lowStock: EnrichedInventoryItem[];
  orderItemCount: number;
  urgentCutoffCount: number;
  demandOrderGapCount: number;
  compliance: ComplianceSnapshot;
  foodCostLevel: "strong" | "watch" | "weak";
  staleReviewCount: number;
  wasteElevated: boolean;
  wasteToday: number;
  sevenDayAverageWaste: number;
  dishesAtRisk: DishRiskItem[];
  plan: PrepPlanResult | null;
};

export function attentionHeadline(count: number): string {
  if (count === 0) return "All clear for now";
  return `${count} thing${count === 1 ? "" : "s"} need attention today`;
}

function sourceMatchesDish(source: string, recipeName: string): boolean {
  return source === recipeName || source.startsWith(`${recipeName} →`);
}

export function buildOperationalAttention(input: OperationalAttentionInput): {
  count: number;
  headline: string;
  items: CommandCentreAttentionItem[];
} {
  const items: CommandCentreAttentionItem[] = [];

  const criticalDishes = input.dishesAtRisk.filter((d) => d.status === "cannot_produce");
  if (criticalDishes.length > 0) {
    items.push({
      id: "menu-critical",
      category: "menu",
      severity: "critical",
      title: `${criticalDishes.length} dish${criticalDishes.length === 1 ? "" : "es"} cannot be produced`,
      detail: `${criticalDishes[0]!.recipeName} is blocked by ${criticalDishes[0]!.blockingItems[0]?.name ?? "shortages"}.`,
      href: "/command-centre#dishes-at-risk",
    });
  } else {
    const atRiskDishes = input.dishesAtRisk.filter((d) => d.status === "may_run_out" || d.status === "ingredient_shortage");
    if (atRiskDishes.length > 0) {
      items.push({
        id: "menu-at-risk",
        category: "menu",
        severity: "high",
        title: `${atRiskDishes.length} dish${atRiskDishes.length === 1 ? "" : "es"} may run short`,
        detail: `${atRiskDishes[0]!.recipeName} has ingredient pressure for today's covers.`,
        href: "/command-centre#dishes-at-risk",
      });
    }
  }

  if (input.urgentPrepCount > 0) {
    items.push({
      id: "prep-urgent",
      category: "prep",
      severity: "high",
      title: `${input.urgentPrepCount} urgent prep task${input.urgentPrepCount === 1 ? "" : "s"} open`,
      detail: `${input.openPrepTasks.find((t) => t.priority === "high" || t.isCritical)?.title ?? "Prep"} needs attention before service.`,
      href: "/prep-board",
    });
  } else if (input.plan && input.plan.suggestedPrepTasks.length > 0) {
    items.push({
      id: "prep-plan-gaps",
      category: "prep",
      severity: "high",
      title: `${input.plan.suggestedPrepTasks.length} prep gap${input.plan.suggestedPrepTasks.length === 1 ? "" : "s"} for today's covers`,
      detail: `${input.plan.suggestedPrepTasks[0]!.title} still needs production.`,
      href: "/command-centre#prep-today",
    });
  } else if (input.prepAlerts.length > 0) {
    items.push({
      id: "prep-stock",
      category: "prep",
      severity: "high",
      title: `${input.prepAlerts.length} prep item${input.prepAlerts.length === 1 ? "" : "s"} below par`,
      detail: `${input.prepAlerts[0]!.itemName} is below par for service.`,
      href: "/prep-board",
    });
  }

  if (input.criticalStock.length > 0) {
    items.push({
      id: "stock-critical",
      category: "stock",
      severity: "critical",
      title: `${input.criticalStock.length} stock item${input.criticalStock.length === 1 ? "" : "s"} critical`,
      detail: `${input.criticalStock[0]!.name} is at ${input.criticalStock[0]!.stockNum} ${input.criticalStock[0]!.unit}.`,
      href: "/inventory?status=critical",
    });
  } else if (input.lowStock.length >= 3) {
    items.push({
      id: "stock-low",
      category: "stock",
      severity: "medium",
      title: `${input.lowStock.length} stock items running low`,
      detail: "Check low stock before placing orders.",
      href: "/inventory?status=low_stock",
    });
  }

  const orderCount = input.plan ? input.demandOrderGapCount : input.orderItemCount;
  if (orderCount > 0 || input.urgentCutoffCount > 0) {
    items.push({
      id: "orders-required",
      category: "order",
      severity: input.urgentCutoffCount > 0 ? "high" : "medium",
      title: `${orderCount} item${orderCount === 1 ? "" : "s"} to order`,
      detail: input.urgentCutoffCount > 0
        ? "Supplier cutoff is close."
        : input.plan ? "Service demand shows ordering gaps." : "Par levels show ordering gaps.",
      href: "/command-centre#order-today",
    });
  }

  if (input.compliance.totalIssues > 0) {
    items.push({
      id: "compliance-issues",
      category: "compliance",
      severity: input.compliance.temperatureUnresolvedFails > 0 ? "critical" : "high",
      title: `${input.compliance.totalIssues} compliance issue${input.compliance.totalIssues === 1 ? "" : "s"}`,
      detail: input.compliance.temperatureUnresolvedFails > 0
        ? "Temperature failure needs resolving."
        : "Checks or documents are overdue.",
      href: input.compliance.temperatureUnresolvedFails > 0 ? "/temperature" : "/compliance",
    });
  }

  if (input.foodCostLevel === "weak" || input.staleReviewCount > 0) {
    items.push({
      id: "food-cost-confidence",
      category: "food_cost",
      severity: input.foodCostLevel === "weak" ? "high" : "medium",
      title: input.foodCostLevel === "weak" ? "Food cost confidence is weak" : `${input.staleReviewCount} recipe review${input.staleReviewCount === 1 ? "" : "s"} due`,
      detail: input.foodCostLevel === "weak"
        ? "Recipe costs need review before trusting margin."
        : "Review recipes to keep food cost reliable.",
      href: "/recipes",
    });
  }

  if (input.wasteElevated) {
    items.push({
      id: "waste-elevated",
      category: "waste",
      severity: "medium",
      title: "Waste is elevated today",
      detail: `$${input.wasteToday.toFixed(2)} logged today vs $${input.sevenDayAverageWaste.toFixed(2)} average.`,
      href: "/waste",
    });
  }

  return {
    count: items.length,
    headline: attentionHeadline(items.length),
    items: items.slice(0, 6),
  };
}

export { sourceMatchesDish };
