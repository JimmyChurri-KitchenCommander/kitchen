import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDishesAtRisk } from "../dishesAtRisk.js";
import type { PrepPlanResult } from "../prepPlan.js";

const samplePlan = {
  venueId: 1,
  prepDate: "2026-06-18",
  menuId: 1,
  menuName: "Main",
  totalCovers: 400,
  servicePeriods: [{ label: "Lunch", covers: 150 }, { label: "Dinner", covers: 250 }],
  menuProduction: [
    { recipeId: 10, recipeName: "Beef Burger", category: "Mains", portionsRequired: 80, batches: 8, yieldQuantity: 10, yieldUnit: "portions", serviceBreakdown: [] },
    { recipeId: 11, recipeName: "Caesar Salad", category: "Starters", portionsRequired: 60, batches: 6, yieldQuantity: 10, yieldUnit: "portions", serviceBreakdown: [] },
  ],
  prepRequirements: [],
  ingredientRequirements: [
    {
      inventoryItemId: 1,
      itemName: "Beef mince",
      requiredQuantity: 10,
      currentStock: 0,
      parLevel: 5,
      gapQuantity: 10,
      parGapQuantity: 0,
      unit: "kg",
      supplierId: 1,
      sources: ["Beef Burger"],
    },
    {
      inventoryItemId: 2,
      itemName: "Cos lettuce",
      requiredQuantity: 4,
      currentStock: 3,
      parLevel: 2,
      gapQuantity: 1,
      parGapQuantity: 0,
      unit: "kg",
      supplierId: 2,
      sources: ["Caesar Salad"],
    },
  ],
  orderingRequirements: [],
  suggestedPrepTasks: [],
  warnings: [],
  assumptions: [],
} satisfies PrepPlanResult;

describe("computeDishesAtRisk", () => {
  it("returns empty array when plan is null", () => {
    assert.deepEqual(computeDishesAtRisk(null), []);
  });

  it("marks dish as cannot_produce when a required ingredient has zero stock", () => {
    const risks = computeDishesAtRisk(samplePlan);
    const burger = risks.find((item) => item.recipeName === "Beef Burger");
    assert.ok(burger);
    assert.equal(burger!.status, "cannot_produce");
    assert.equal(burger!.portionsAtRisk, 80);
    assert.equal(burger!.blockingItems[0]?.name, "Beef mince");
  });

  it("marks dish as ingredient_shortage when partial stock remains", () => {
    const risks = computeDishesAtRisk(samplePlan);
    const salad = risks.find((item) => item.recipeName === "Caesar Salad");
    assert.ok(salad);
    assert.equal(salad!.status, "ingredient_shortage");
    assert.ok(salad!.portionsAtRisk > 0);
  });

  it("sorts cannot_produce dishes first", () => {
    const risks = computeDishesAtRisk(samplePlan);
    assert.equal(risks[0]?.status, "cannot_produce");
  });
});
