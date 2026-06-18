import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeDemandAndParOrdering, orderTodayHeadline } from "../mergeOrdering.js";
import type { PrepPlanResult } from "../prepPlan.js";

const enriched = [
  { id: 1, name: "Beef mince", unit: "kg", supplierId: 10, productionRecipeId: null, stockNum: 2, costNum: 12, parLevel: 10, stagnantDays: 0, status: "low_stock" },
  { id: 2, name: "Flour", unit: "kg", supplierId: 11, productionRecipeId: null, stockNum: 20, costNum: 1, parLevel: 10, stagnantDays: 0, status: "healthy" },
];

const supplierNames = new Map([[10, "Meat Co"], [11, "Dry Store"]]);

describe("mergeDemandAndParOrdering", () => {
  it("falls back to par-only ordering when no plan covers exist", () => {
    const result = mergeDemandAndParOrdering(null, enriched, supplierNames);
    assert.equal(result.source, "par_only");
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.itemName, "Beef mince");
    assert.equal(result.demandOrderGapCount, 0);
  });

  it("merges demand gaps with par gaps using max quantity", () => {
    const plan = {
      totalCovers: 200,
      orderingRequirements: [{
        inventoryItemId: 1,
        itemName: "Beef mince",
        suggestedOrderQuantity: 15,
        unit: "kg",
        demandGapQuantity: 15,
        parGapQuantity: 8,
        supplierId: 10,
        reason: "Demand gap",
        sources: [],
      }],
    } as PrepPlanResult;

    const result = mergeDemandAndParOrdering(plan, enriched, supplierNames);
    assert.equal(result.source, "demand_and_par");
    assert.equal(result.demandOrderGapCount, 1);
    assert.equal(result.items[0]?.suggestedQty, 15);
    assert.equal(result.items[0]?.reason, "demand_gap");
  });
});

describe("orderTodayHeadline", () => {
  it("describes service-based ordering when demand plan exists", () => {
    assert.match(orderTodayHeadline(3, 0, "demand_and_par"), /today's service/);
  });
});
