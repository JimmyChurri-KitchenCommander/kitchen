import { pgTable, serial, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";
import { invoicesTable } from "./invoices";

export const temperatureEquipmentTable = pgTable("temperature_equipment", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("fridge"),
  minTemp: numeric("min_temp", { precision: 5, scale: 1 }).notNull().default("1.0"),
  maxTemp: numeric("max_temp", { precision: 5, scale: 1 }).notNull().default("5.0"),
  checkIntervalHours: integer("check_interval_hours"),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const temperatureLogsTable = pgTable("temperature_logs", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  equipmentId: integer("equipment_id").references(() => temperatureEquipmentTable.id, { onDelete: "set null" }),
  invoiceId: integer("invoice_id").references(() => invoicesTable.id, { onDelete: "set null" }),
  logType: text("log_type").notNull().default("equipment_check"),
  itemName: text("item_name"),
  recordedTemp: numeric("recorded_temp", { precision: 5, scale: 1 }).notNull(),
  status: text("status").notNull().default("pass"),
  notes: text("notes"),
  correctiveAction: text("corrective_action"),
  recheckTemp: numeric("recheck_temp", { precision: 5, scale: 1 }),
  isResolved: boolean("is_resolved"),
  checkedBy: text("checked_by").notNull(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export type TemperatureEquipment = typeof temperatureEquipmentTable.$inferSelect;
export type TemperatureLog = typeof temperatureLogsTable.$inferSelect;
