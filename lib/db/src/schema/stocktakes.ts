import { pgTable, serial, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { inventoryItemsTable } from "./inventory";

export const stocktakesTable = pgTable("stocktakes", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  conductedAt: timestamp("conducted_at").defaultNow().notNull(),
  status: text("status").notNull().default("draft"), // draft | submitted
  notes: text("notes"),
  createdBy: text("created_by"),
  completedBy: text("completed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stocktakeItemsTable = pgTable("stocktake_items", {
  id: serial("id").primaryKey(),
  stocktakeId: integer("stocktake_id").notNull().references(() => stocktakesTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  unit: text("unit").notNull(),
  expectedStock: numeric("expected_stock", { precision: 10, scale: 3 }).notNull().default("0"),
  actualStock: numeric("actual_stock", { precision: 10, scale: 3 }).notNull().default("0"),
  variance: numeric("variance", { precision: 10, scale: 3 }).notNull().default("0"),
  unitCost: numeric("unit_cost", { precision: 10, scale: 4 }).notNull().default("0"),
  // Storage section for cycle counts (e.g. "Dry Store", "Fridges") — null = full stocktake
  section: text("section"),
  isCounted: boolean("is_counted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStocktakeSchema = createInsertSchema(stocktakesTable).omit({ id: true, createdAt: true, conductedAt: true });
export const insertStocktakeItemSchema = createInsertSchema(stocktakeItemsTable).omit({ id: true, createdAt: true });

export type InsertStocktake = z.infer<typeof insertStocktakeSchema>;
export type Stocktake = typeof stocktakesTable.$inferSelect;
export type StocktakeItem = typeof stocktakeItemsTable.$inferSelect;
