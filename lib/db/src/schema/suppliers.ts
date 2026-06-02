import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  deliveryDays: text("delivery_days"),
  orderCutoffTime: text("order_cutoff_time"),
  minimumOrderValue: numeric("minimum_order_value", { precision: 10, scale: 2 }),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }),
  notes: text("notes"),
  website: text("website"),
  category: text("category"),
  reliabilityRating: integer("reliability_rating"),
  // Typical days between invoices from this supplier — used to detect silent pricing drift
  expectedInvoiceFrequencyDays: integer("expected_invoice_frequency_days"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertSupplierSchema = createInsertSchema(suppliersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliersTable.$inferSelect;
