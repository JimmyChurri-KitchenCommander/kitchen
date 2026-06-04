import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { venuesTable } from "./venues";
import { suppliersTable } from "./suppliers";
import { inventoryItemsTable } from "./inventory";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),

  venueId: integer("venue_id")
    .notNull()
    .references(() => venuesTable.id, {
      onDelete: "cascade",
    }),

  supplierId: integer("supplier_id")
    .references(() => suppliersTable.id, {
      onDelete: "set null",
    }),

  supplierName: text("supplier_name").notNull(),

  invoiceNumber: text("invoice_number"),

  invoiceDate: date("invoice_date").notNull(),

  totalAmount: numeric("total_amount", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("0"),

  status: text("status")
    .notNull()
    .default("pending"),

  imageUrl: text("image_url"),

  notes: text("notes"),

  noteResolvedAt: timestamp("note_resolved_at"),

  // Receiving fields
  receivedAt: timestamp("received_at"),

  receivedBy: text("received_by"),

  receivingCompleted: boolean("receiving_completed")
    .default(false),

  createdBy: text("created_by"),

  processedBy: text("processed_by"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at"),
});

export const invoiceItemsTable = pgTable("invoice_items", {
  id: serial("id").primaryKey(),

  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoicesTable.id, {
      onDelete: "cascade",
    }),

  inventoryItemId: integer("inventory_item_id")
    .references(() => inventoryItemsTable.id, {
      onDelete: "set null",
    }),

  description: text("description").notNull(),

  quantity: numeric("quantity", {
    precision: 10,
    scale: 3,
  }).notNull(),

  unit: text("unit").notNull(),

  unitPrice: numeric("unit_price", {
    precision: 10,
    scale: 4,
  }).notNull(),

  totalPrice: numeric("total_price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  // Receiving fields

  receivedQuantity: numeric("received_quantity", {
    precision: 10,
    scale: 3,
  }),

  receivedStatus: text("received_status")
    .notNull()
    .default("pending"),

  receivingNotes: text("receiving_notes"),

  receivedAt: timestamp("received_at"),

  receivedBy: text("received_by"),

  varianceQuantity: numeric("variance_quantity", {
    precision: 10,
    scale: 3,
  }),
});

export const insertInvoiceSchema = createInsertSchema(
  invoicesTable
).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(
  invoiceItemsTable
).omit({
  id: true,
});

export type InsertInvoice =
  z.infer<typeof insertInvoiceSchema>;

export type InsertInvoiceItem =
  z.infer<typeof insertInvoiceItemSchema>;

export type Invoice =
  typeof invoicesTable.$inferSelect;

export type InvoiceItem =
  typeof invoiceItemsTable.$inferSelect;


