import { defineConfig } from "drizzle-kit";
import path from "path";

function getConnectionString(): string {
  if (process.env.SUPABASE_DB_CONN) {
    return `postgresql://${process.env.SUPABASE_DB_CONN}`;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  throw new Error("No database connection configured. Set SUPABASE_DB_CONN or DATABASE_URL.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: getConnectionString(),
    ssl: { rejectUnauthorized: false },
  },
});
