import { pgTable, serial, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { suppliersTable } from "./suppliers";

export const inventoryItemsTable = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").references(() => suppliersTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  currentStock: numeric("current_stock", { precision: 10, scale: 3 }).notNull().default("0"),
  averageCost: numeric("average_cost", { precision: 10, scale: 4 }).notNull().default("0"),
  parLevel: numeric("par_level", { precision: 10, scale: 3 }).notNull().default("0"),
  shelfLifeDays: integer("shelf_life_days"),
  expiresAt: timestamp("expires_at"),
  lastRestocked: timestamp("last_restocked"),
  productionRecipeId: integer("production_recipe_id"),
  storageLocation: text("storage_location"),
  category: text("category"),
  isActive: boolean("is_active").notNull().default(true),
  archivedAt: timestamp("archived_at"),
  archivedBy: text("archived_by"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
