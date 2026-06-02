import { pgTable, serial, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { inventoryItemsTable } from "./inventory";

export const wasteLogsTable = pgTable("waste_logs", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItemsTable.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  costImpact: numeric("cost_impact", { precision: 10, scale: 2 }).notNull().default("0"),
  reason: text("reason").notNull().default("other"),
  notes: text("notes"),
  // Quick-capture flag: logged during service as free text, inventory match deferred
  isQuick: boolean("is_quick").notNull().default(false),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export const insertWasteLogSchema = createInsertSchema(wasteLogsTable).omit({ id: true, loggedAt: true });
export type InsertWasteLog = z.infer<typeof insertWasteLogSchema>;
export type WasteLog = typeof wasteLogsTable.$inferSelect;
