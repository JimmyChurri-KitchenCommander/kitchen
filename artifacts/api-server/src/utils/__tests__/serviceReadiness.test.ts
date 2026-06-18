import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeServiceReadiness } from "../serviceReadiness.js";
import type { PrepPlanResult } from "../prepPlan.js";

const baseCompliance = {
  score: 90,
  status: "ready" as const,
  totalIssues: 0,
  temperatureUnresolvedFails: 0,
  temperatureOverdueCount: 0,
  cleaningOverdueCount: 0,
  pendingTaskCount: 0,
  blockedChemicalCount: 0,
  headline: "Compliance checks are up to date",
};

describe("computeServiceReadiness", () => {
  it("returns green ready state for healthy inputs", () => {
    const result = computeServiceReadiness({
      plan: null,
      openPrepTasks: [{ status: "todo" }],
      donePrepTasks: [{ status: "done" }, { status: "done" }],
      suggestedPrepCount: 0,
      enrichedInventory: [{ id: 1, name: "Flour", unit: "kg", supplierId: null, productionRecipeId: null, stockNum: 10, costNum: 2, parLevel: 5, stagnantDays: 0, status: "healthy" }],
      compliance: baseCompliance,
      dishesAtRisk: [],
      demandOrderGapCount: 0,
      urgentCutoffCount: 0,
      criticalStockCount: 0,
    });
    assert.equal(result.colour, "green");
    assert.equal(result.label, "ready");
    assert.ok(result.score >= 85);
  });

  it("forces amber when temperature failure is unresolved", () => {
    const result = computeServiceReadiness({
      plan: null,
      openPrepTasks: [],
      donePrepTasks: [],
      suggestedPrepCount: 0,
      enrichedInventory: [],
      compliance: { ...baseCompliance, temperatureUnresolvedFails: 1, totalIssues: 1, score: 70, status: "watch" },
      dishesAtRisk: [],
      demandOrderGapCount: 0,
      urgentCutoffCount: 0,
      criticalStockCount: 0,
    });
    assert.equal(result.colour, "amber");
    assert.equal(result.label, "attention_required");
  });

  it("returns red high risk when a dish cannot be produced", () => {
    const plan = {
      totalCovers: 100,
      ingredientRequirements: [{ gapQuantity: 5 }],
      suggestedPrepTasks: [{ title: "Prep sauce" }],
    } as PrepPlanResult;

    const result = computeServiceReadiness({
      plan,
      openPrepTasks: [],
      donePrepTasks: [],
      suggestedPrepCount: 1,
      enrichedInventory: [],
      compliance: baseCompliance,
      dishesAtRisk: [{
        recipeId: 1,
        recipeName: "Burger",
        portionsRequired: 50,
        portionsAtRisk: 50,
        status: "cannot_produce",
        blockingItems: [],
        href: "/recipes/1",
      }],
      demandOrderGapCount: 2,
      urgentCutoffCount: 0,
      criticalStockCount: 1,
    });
    assert.equal(result.colour, "red");
    assert.equal(result.label, "high_risk");
    assert.ok(result.score < 85);
  });
});
