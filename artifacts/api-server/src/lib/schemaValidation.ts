import { logger } from "./logger.js";

/**
 * Columns that must exist in `inventory_items` for the application to function
 * correctly. The `stock_type` column was added in migration
 * 0001_inventory_ledger_phase1.sql. If it is absent the command-centre view
 * query (and several inventory routes) will fail with:
 *   column "stock_type" does not exist
 */
export const REQUIRED_INVENTORY_ITEMS_COLUMNS = [
  "id",
  "venue_id",
  "name",
  "unit",
  "current_stock",
  "average_cost",
  "par_level",
  "stock_type",
  "is_active",
  "created_at",
] as const;

export type MissingColumnReport = {
  table: string;
  missingColumns: string[];
};

/**
 * Queries `information_schema.columns` for `inventory_items` and returns the
 * names of any columns from REQUIRED_INVENTORY_ITEMS_COLUMNS that are absent.
 *
 * Accepts an injectable `queryFn` so that unit tests can supply a mock without
 * a real database connection.
 */
export async function checkInventoryItemsColumns(
  queryFn: (sql: string) => Promise<Array<{ column_name: string }>>,
): Promise<MissingColumnReport> {
  const rows = await queryFn(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'inventory_items'`,
  );
  const existing = new Set(rows.map((r) => r.column_name));
  const missingColumns = REQUIRED_INVENTORY_ITEMS_COLUMNS.filter(
    (col) => !existing.has(col),
  );
  return { table: "inventory_items", missingColumns };
}

/** Minimal interface for the pg Pool methods used by validateDbSchema. */
interface PoolLike {
  connect(): Promise<{
    query<T extends Record<string, unknown>>(sql: string): Promise<{ rows: T[] }>;
    release(): void;
  }>;
}

/**
 * Runs schema validation using the application's pg Pool.  Logs a warning for
 * every missing column and throws if any are found so that startup fails fast
 * rather than serving broken queries.
 */
export async function validateDbSchema(pool: PoolLike): Promise<void> {
  const client = await pool.connect();
  try {
    const queryFn = async (sql: string) => {
      const result = await client.query<{ column_name: string }>(sql);
      return result.rows;
    };
    const report = await checkInventoryItemsColumns(queryFn);
    if (report.missingColumns.length > 0) {
      const msg =
        `Schema drift detected: ${report.table} is missing column(s): ` +
        `${report.missingColumns.join(", ")}. ` +
        `Apply pending migrations in lib/db/migrations/ to fix this.`;
      logger.error({ missingColumns: report.missingColumns }, msg);
      throw new Error(msg);
    }
    logger.info("Schema validation passed: all required columns present");
  } finally {
    client.release();
  }
}
