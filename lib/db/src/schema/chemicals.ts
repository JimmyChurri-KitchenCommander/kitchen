import { pgTable, serial, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { cleaningTasksTable } from "./cleaning";

// ── Chemicals / Cleaning Products ─────────────────────────────────────────────
export const chemicalsTable = pgTable("chemicals", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // sanitiser | degreaser | disinfectant | detergent | bleach | acid | other
  type: text("type").notNull().default("other"),
  dilutionRatio: text("dilution_ratio"),        // e.g. "1:100"
  contactTimeSeconds: integer("contact_time_seconds"), // e.g. 60
  ppeRequired: text("ppe_required"),             // comma-separated: "gloves,goggles,apron"
  sopInstructions: text("sop_instructions"),     // step-by-step text
  msdsUrl: text("msds_url"),                     // link to MSDS/SDS document
  msdsExpiryDate: date("msds_expiry_date"),
  msdsVersion: text("msds_version"),
  // current | expiring_soon | expired | missing
  complianceStatus: text("compliance_status").notNull().default("missing"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// ── Cleaning Task ↔ Chemical Links ────────────────────────────────────────────
export const cleaningTaskChemicalsTable = pgTable("cleaning_task_chemicals", {
  id: serial("id").primaryKey(),
  cleaningTaskId: integer("cleaning_task_id").notNull().references(() => cleaningTasksTable.id, { onDelete: "cascade" }),
  chemicalId: integer("chemical_id").notNull().references(() => chemicalsTable.id, { onDelete: "cascade" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Compliance Action Tasks ───────────────────────────────────────────────────
// Auto-created when a chemical is added without MSDS, or MSDS expires.
export const complianceTasksTable = pgTable("compliance_tasks", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  chemicalId: integer("chemical_id").references(() => chemicalsTable.id, { onDelete: "set null" }),
  // attach_msds | renew_msds | general
  type: text("type").notNull().default("attach_msds"),
  title: text("title").notNull(),
  description: text("description"),
  // pending | resolved
  status: text("status").notNull().default("pending"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertChemicalSchema = createInsertSchema(chemicalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChemical = z.infer<typeof insertChemicalSchema>;
export type Chemical = typeof chemicalsTable.$inferSelect;

export const insertCleaningTaskChemicalSchema = createInsertSchema(cleaningTaskChemicalsTable).omit({ id: true, createdAt: true });
export type InsertCleaningTaskChemical = z.infer<typeof insertCleaningTaskChemicalSchema>;
export type CleaningTaskChemical = typeof cleaningTaskChemicalsTable.$inferSelect;

export const insertComplianceTaskSchema = createInsertSchema(complianceTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceTask = z.infer<typeof insertComplianceTaskSchema>;
export type ComplianceTask = typeof complianceTasksTable.$inferSelect;
