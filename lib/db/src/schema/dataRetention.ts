import { pgTable, serial, text, timestamp, integer, jsonb, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const exportSettingsTable = pgTable("export_settings", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  frequency: text("frequency").notNull().default("off"),
  exportTypes: jsonb("export_types").notNull().default(["waste", "food-cost", "stocktake"]),
  additionalRecipients: jsonb("additional_recipients").notNull().default([]),
  ownerOptedIn: boolean("owner_opted_in").notNull().default(true),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
}, (t) => [unique("export_settings_venue_unique").on(t.venueId)]);

export const exportLogsTable = pgTable("export_logs", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  exportType: text("export_type").notNull(),
  triggeredBy: text("triggered_by").notNull().default("manual"),
  emailedTo: jsonb("emailed_to").notNull().default([]),
  status: text("status").notNull().default("success"),
  fileName: text("file_name"),
  recordCount: integer("record_count"),
  dateFrom: text("date_from"),
  dateTo: text("date_to"),
  errorMessage: text("error_message"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const insertExportSettingsSchema = createInsertSchema(exportSettingsTable).omit({
  id: true, createdAt: true, updatedAt: true, nextRunAt: true, lastRunAt: true,
});
export const insertExportLogSchema = createInsertSchema(exportLogsTable).omit({ id: true, generatedAt: true });

export type ExportSettings = typeof exportSettingsTable.$inferSelect;
export type ExportLog = typeof exportLogsTable.$inferSelect;
export type InsertExportSettings = z.infer<typeof insertExportSettingsSchema>;
export type InsertExportLog = z.infer<typeof insertExportLogSchema>;
