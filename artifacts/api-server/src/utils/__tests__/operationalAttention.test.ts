import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOperationalAttention } from "../operationalAttention.js";

const baseInput = {
  openPrepTasks: [],
  urgentPrepCount: 0,
  prepAlerts: [],
  criticalStock: [],
  lowStock: [],
  orderItemCount: 0,
  urgentCutoffCount: 0,
  demandOrderGapCount: 0,
  compliance: {
    score: 100,
    status: "ready" as const,
    totalIssues: 0,
    temperatureUnresolvedFails: 0,
    temperatureOverdueCount: 0,
    cleaningOverdueCount: 0,
    pendingTaskCount: 0,
    blockedChemicalCount: 0,
    headline: "All good",
  },
  foodCostLevel: "strong" as const,
  staleReviewCount: 0,
  wasteElevated: false,
  wasteToday: 0,
  sevenDayAverageWaste: 0,
  dishesAtRisk: [],
  plan: null,
};

describe("buildOperationalAttention", () => {
  it("returns all clear when no issues exist", () => {
    const result = buildOperationalAttention(baseInput);
    assert.equal(result.count, 0);
    assert.equal(result.headline, "All clear for now");
  });

  it("prioritises menu risk when dishes cannot be produced", () => {
    const result = buildOperationalAttention({
      ...baseInput,
      dishesAtRisk: [{
        recipeId: 1,
        recipeName: "Burger",
        portionsRequired: 40,
        portionsAtRisk: 40,
        status: "cannot_produce",
        blockingItems: [{ name: "Beef", gapQuantity: 5, unit: "kg", stockType: "raw" }],
        href: "/recipes/1",
      }],
    });
    assert.ok(result.items.some((item) => item.id === "menu-critical"));
    assert.equal(result.items[0]?.category, "menu");
  });

  it("uses demand ordering count when a plan is present", () => {
    const result = buildOperationalAttention({
      ...baseInput,
      demandOrderGapCount: 4,
      plan: { suggestedPrepTasks: [], orderingRequirements: [] } as never,
    });
    assert.ok(result.items.some((item) => item.id === "orders-required" && item.title.includes("4")));
  });
});
