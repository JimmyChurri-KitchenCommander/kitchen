import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { suppliersTable } from "./suppliers";
import { inventoryItemsTable } from "./inventory";

export const priceHistoryTable = pgTable("price_history", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliersTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItemsTable.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  oldPrice: numeric("old_price", { precision: 10, scale: 4 }),
  newPrice: numeric("new_price", { precision: 10, scale: 4 }).notNull(),
  changePercent: numeric("change_percent", { precision: 8, scale: 2 }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistoryTable).omit({ id: true, recordedAt: true });
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistoryTable.$inferSelect;
