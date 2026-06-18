import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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
  // raw = purchased ingredient, prep = in-house mise/prep, finished = ready-to-sell stock.
  stockType: text("stock_type").notNull().default("raw"),
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

export const inventoryLayersTable = pgTable("inventory_layers", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  sourceId: integer("source_id"),
  quantityReceived: numeric("quantity_received", { precision: 12, scale: 4 }).notNull(),
  quantityRemaining: numeric("quantity_remaining", { precision: 12, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 4 }).notNull().default("0"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("inventory_layers_venue_idx").on(t.venueId),
  index("inventory_layers_item_idx").on(t.inventoryItemId),
  index("inventory_layers_item_received_idx").on(t.inventoryItemId, t.receivedAt),
]);

export const inventoryLedgerEntriesTable = pgTable("inventory_ledger_entries", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  layerId: integer("layer_id").references(() => inventoryLayersTable.id, { onDelete: "set null" }),
  transactionType: text("transaction_type").notNull(),
  quantityDelta: numeric("quantity_delta", { precision: 12, scale: 4 }).notNull(),
  resultingStock: numeric("resulting_stock", { precision: 12, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 4 }).notNull().default("0"),
  costImpact: numeric("cost_impact", { precision: 12, scale: 4 }).notNull().default("0"),
  reason: text("reason").notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  idempotencyKey: text("idempotency_key"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("inventory_ledger_entries_venue_idx").on(t.venueId),
  index("inventory_ledger_entries_item_created_idx").on(t.inventoryItemId, t.createdAt),
  index("inventory_ledger_entries_type_idx").on(t.transactionType),
  uniqueIndex("inventory_ledger_entries_idempotency_key_unique").on(t.idempotencyKey),
]);

export const insertInventoryLayerSchema = createInsertSchema(inventoryLayersTable).omit({ id: true, createdAt: true });
export const insertInventoryLedgerEntrySchema = createInsertSchema(inventoryLedgerEntriesTable).omit({ id: true, createdAt: true });

export type InsertInventoryLayer = z.infer<typeof insertInventoryLayerSchema>;
export type InventoryLayer = typeof inventoryLayersTable.$inferSelect;
export type InsertInventoryLedgerEntry = z.infer<typeof insertInventoryLedgerEntrySchema>;
export type InventoryLedgerEntry = typeof inventoryLedgerEntriesTable.$inferSelect;
