import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://localhost:5432/postgres";
const { computePurchaseOrderReceivingTotals } = await import("../purchaseOrderReceiving.js");

describe("purchase order receiving totals", () => {
  it("supports partial receives without completing the order", () => {
    const result = computePurchaseOrderReceivingTotals({
      orderItems: [{ id: 101, quantity: "10.000" }],
      existingReceivedByItem: new Map([[101, 0]]),
      incomingItems: [{ purchaseOrderItemId: 101, quantityReceived: 4 }],
    });

    assert.equal(result.receivedByItem.get(101), 4);
    assert.equal(result.fullyReceived, false);
  });

  it("marks order fully received when all quantities are covered", () => {
    const result = computePurchaseOrderReceivingTotals({
      orderItems: [{ id: 101, quantity: "10.000" }],
      existingReceivedByItem: new Map([[101, 4]]),
      incomingItems: [{ purchaseOrderItemId: 101, quantityReceived: 6 }],
    });

    assert.equal(result.receivedByItem.get(101), 10);
    assert.equal(result.fullyReceived, true);
  });

  it("rejects over-receiving", () => {
    assert.throws(() => computePurchaseOrderReceivingTotals({
      orderItems: [{ id: 101, quantity: "10.000" }],
      existingReceivedByItem: new Map([[101, 9.5]]),
      incomingItems: [{ purchaseOrderItemId: 101, quantityReceived: 1 }],
    }), /Cannot receive more than ordered quantity/);
  });
});
