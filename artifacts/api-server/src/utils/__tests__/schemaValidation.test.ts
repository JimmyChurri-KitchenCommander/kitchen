import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkInventoryItemsColumns, REQUIRED_INVENTORY_ITEMS_COLUMNS } from "../../lib/schemaValidation.js";

function makeQueryFn(columns: string[]): (sql: string) => Promise<Array<{ column_name: string }>> {
  return async (_sql: string) => columns.map((c) => ({ column_name: c }));
}

const ALL_REQUIRED = [...REQUIRED_INVENTORY_ITEMS_COLUMNS];

describe("checkInventoryItemsColumns", () => {
  it("returns no missing columns when all required columns are present", async () => {
    const report = await checkInventoryItemsColumns(makeQueryFn(ALL_REQUIRED));
    assert.deepEqual(report.missingColumns, []);
    assert.equal(report.table, "inventory_items");
  });

  it("returns no missing columns when the DB has extra columns beyond those required", async () => {
    const extended = [...ALL_REQUIRED, "storage_location", "category", "archived_at"];
    const report = await checkInventoryItemsColumns(makeQueryFn(extended));
    assert.deepEqual(report.missingColumns, []);
  });

  it("reports stock_type as missing when the column is absent", async () => {
    const withoutStockType = ALL_REQUIRED.filter((c) => c !== "stock_type");
    const report = await checkInventoryItemsColumns(makeQueryFn(withoutStockType));
    assert.ok(
      report.missingColumns.includes("stock_type"),
      `expected stock_type in missingColumns, got: ${report.missingColumns.join(", ")}`,
    );
  });

  it("reports all missing columns when the table is empty", async () => {
    const report = await checkInventoryItemsColumns(makeQueryFn([]));
    assert.deepEqual(
      [...report.missingColumns].sort(),
      [...ALL_REQUIRED].sort(),
    );
  });

  it("reports only the subset of columns that are actually missing", async () => {
    const partial = ["id", "venue_id", "name", "unit"];
    const report = await checkInventoryItemsColumns(makeQueryFn(partial));
    const missing = report.missingColumns;
    assert.ok(!missing.includes("id"));
    assert.ok(!missing.includes("name"));
    assert.ok(missing.includes("stock_type"));
    assert.ok(missing.includes("current_stock"));
  });
});
