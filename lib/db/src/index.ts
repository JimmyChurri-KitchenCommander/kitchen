import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Support both SUPABASE_DB_CONN (scheme-free, for Replit secrets compatibility)
// and DATABASE_URL (full URL, for local dev / Replit native DB).
function getConnectionString(): string {
  if (process.env.SUPABASE_DB_CONN) {
    return `postgresql://${process.env.SUPABASE_DB_CONN}`;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  throw new Error(
    "No database connection configured. Set SUPABASE_DB_CONN or DATABASE_URL.",
  );
}

const connectionString = getConnectionString();

const sslConfig = connectionString.includes("supabase.com")
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool({ connectionString, ssl: sslConfig });
export const db = drizzle(pool, { schema });

export * from "./schema";
