import { index, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { inventoryItemsTable, inventoryLayersTable } from "./inventory";
import { prepTasksTable } from "./prepBoard";
import { purchaseOrderItemsTable } from "./purchaseOrders";
import { recipesTable } from "./recipes";
import { venuesTable } from "./venues";

export const purchaseOrderReceivingTable = pgTable("purchase_order_receiving", {
  id: serial("id").primaryKey(),
  purchaseOrderItemId: integer("purchase_order_item_id").notNull().references(() => purchaseOrderItemsTable.id, { onDelete: "cascade" }),
  receivedQuantity: numeric("received_quantity", { precision: 10, scale: 3 }).notNull(),
  receivedUnitCost: numeric("received_unit_cost", { precision: 10, scale: 4 }),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  receivedBy: text("received_by"),
  notes: text("notes"),
  expiryDate: timestamp("expiry_date"),
}, (t) => [
  index("idx_purchase_order_receiving_item_id").on(t.purchaseOrderItemId),
]);

export const productionBatchesTable = pgTable("production_batches", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").references(() => recipesTable.id, { onDelete: "set null" }),
  prepTaskId: integer("prep_task_id").references(() => prepTasksTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("in_progress"),
  plannedPortions: numeric("planned_portions", { precision: 10, scale: 3 }),
  actualPortions: numeric("actual_portions", { precision: 10, scale: 3 }),
  yieldVariance: numeric("yield_variance", { precision: 10, scale: 3 }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdBy: text("created_by"),
  completedBy: text("completed_by"),
  notes: text("notes"),
}, (t) => [
  index("idx_production_batches_venue_id").on(t.venueId),
  index("idx_production_batches_venue_status").on(t.venueId, t.status),
  index("idx_production_batches_recipe_id").on(t.recipeId),
  index("idx_production_batches_prep_task_id").on(t.prepTaskId),
]);

export const productionBatchInputsTable = pgTable("production_batch_inputs", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull().references(() => productionBatchesTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  plannedQuantity: numeric("planned_quantity", { precision: 10, scale: 3 }).notNull(),
  actualQuantity: numeric("actual_quantity", { precision: 10, scale: 3 }),
  unitCost: numeric("unit_cost", { precision: 10, scale: 4 }),
  consumedAt: timestamp("consumed_at"),
}, (t) => [
  index("idx_production_batch_inputs_batch_id").on(t.batchId),
  index("idx_production_batch_inputs_inventory_item_id").on(t.inventoryItemId),
]);

export const productionBatchOutputsTable = pgTable("production_batch_outputs", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull().references(() => productionBatchesTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  quantityProduced: numeric("quantity_produced", { precision: 10, scale: 3 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 4 }),
  layerId: integer("layer_id").references(() => inventoryLayersTable.id, { onDelete: "set null" }),
  producedAt: timestamp("produced_at").defaultNow().notNull(),
}, (t) => [
  index("idx_production_batch_outputs_batch_id").on(t.batchId),
  index("idx_production_batch_outputs_inventory_item_id").on(t.inventoryItemId),
]);

export const insertPurchaseOrderReceivingSchema = createInsertSchema(purchaseOrderReceivingTable).omit({ id: true });
export const insertProductionBatchSchema = createInsertSchema(productionBatchesTable).omit({ id: true, startedAt: true });
export const insertProductionBatchInputSchema = createInsertSchema(productionBatchInputsTable).omit({ id: true });
export const insertProductionBatchOutputSchema = createInsertSchema(productionBatchOutputsTable).omit({ id: true, producedAt: true });

export type InsertPurchaseOrderReceiving = z.infer<typeof insertPurchaseOrderReceivingSchema>;
export type PurchaseOrderReceiving = typeof purchaseOrderReceivingTable.$inferSelect;
export type InsertProductionBatch = z.infer<typeof insertProductionBatchSchema>;
export type ProductionBatch = typeof productionBatchesTable.$inferSelect;
export type InsertProductionBatchInput = z.infer<typeof insertProductionBatchInputSchema>;
export type ProductionBatchInput = typeof productionBatchInputsTable.$inferSelect;
export type InsertProductionBatchOutput = z.infer<typeof insertProductionBatchOutputSchema>;
export type ProductionBatchOutput = typeof productionBatchOutputsTable.$inferSelect;
