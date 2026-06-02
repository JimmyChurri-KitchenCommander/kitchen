import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { suppliersTable } from "./suppliers";
import { inventoryItemsTable } from "./inventory";

export const purchaseOrdersTable = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").references(() => suppliersTable.id, { onDelete: "set null" }),
  supplierName: text("supplier_name").notNull(),
  status: text("status").notNull().default("draft"), // draft | sent | received | cancelled
  notes: text("notes"),
  totalEstimatedCost: numeric("total_estimated_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const purchaseOrderItemsTable = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => purchaseOrdersTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItemsTable.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  estimatedUnitCost: numeric("estimated_unit_cost", { precision: 10, scale: 4 }).notNull().default("0"),
  notes: text("notes"),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrdersTable).omit({ id: true, createdAt: true });
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItemsTable).omit({ id: true });

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrdersTable.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItemsTable.$inferSelect;
