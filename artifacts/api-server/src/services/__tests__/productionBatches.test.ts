import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://localhost:5432/postgres";
const {
  assertSufficientInventory,
  buildProductionLedgerMovements,
} = await import("../productionBatches.js");
type CompleteProductionBatchInput = import("../productionBatches.js").CompleteProductionBatchInput;

const completeInput: CompleteProductionBatchInput = {
  venueId: 1,
  batchId: 25,
  actualPortions: 20,
  inputs: [
    { inventoryItemId: 10, actualQuantity: 4, unitCost: 2.5 },
  ],
  outputs: [
    { inventoryItemId: 20, quantityProduced: 2, unitCost: 6.2 },
  ],
};

describe("production batch helpers", () => {
  it("builds production input/output ledger movements", () => {
    const movements = buildProductionLedgerMovements(completeInput);

    assert.equal(movements.inputMovements[0]?.transactionType, "PRODUCTION_INPUT");
    assert.equal(movements.inputMovements[0]?.quantityDelta, -4);
    assert.equal(movements.outputMovements[0]?.transactionType, "PRODUCTION_OUTPUT");
    assert.equal(movements.outputMovements[0]?.quantityDelta, 2);
    assert.equal(movements.outputMovements[0]?.createLayer, true);
  });

  it("rejects completion when inventory is insufficient", () => {
    assert.throws(() => assertSufficientInventory(completeInput.inputs, [
      { inventoryItemId: 10, currentStock: 3.9 },
    ]), /Insufficient inventory/);
  });

  it("supports completion when inventory is sufficient", () => {
    assert.doesNotThrow(() => assertSufficientInventory(completeInput.inputs, [
      { inventoryItemId: 10, currentStock: 4 },
    ]));
  });

  it("rolls back transaction state on failure", async () => {
    type TxState = { writes: string[] };

    const runTransaction = async <T>(work: (state: TxState) => Promise<T>): Promise<T> => {
      const state: TxState = { writes: [] };
      const snapshot = [...state.writes];
      try {
        const result = await work(state);
        return result;
      } catch (error) {
        state.writes = snapshot;
        throw error;
      }
    };

    await assert.rejects(async () => runTransaction(async (state) => {
      state.writes.push("input-row");
      throw new Error("forced failure");
    }), /forced failure/);
  });
});
