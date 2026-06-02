import { pgTable, serial, text, timestamp, integer, date, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { recipesTable } from "./recipes";
import { inventoryItemsTable } from "./inventory";

// ── Prep Task Library (persistent master task list) ───────────────────────────
export const prepTaskLibraryTable = pgTable("prep_task_library", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").references(() => recipesTable.id, { onDelete: "set null" }),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItemsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("other"),
  section: text("section").notNull().default("other"),
  shift: text("shift").notNull().default("all_day"),
  priority: text("priority").notNull().default("medium"),
  quantity: numeric("quantity", { precision: 10, scale: 3 }),
  unit: text("unit"),
  batchSize: text("batch_size"),
  notes: text("notes"),
  // Short actionable guidance shown inline on task cards (no navigation required)
  quickInstructions: text("quick_instructions"),
  // Optional visual reference (plating shot, prep size, cleaning setup)
  imageUrl: text("image_url"),
  // CSV of training tags: training_friendly | senior_required | critical_task
  trainingTags: text("training_tags"),
  estimatedMinutes: integer("estimated_minutes"),
  // status: active | inactive | seasonal | waiting_approval | archived
  status: text("status").notNull().default("active"),
  createdBy: text("created_by"),
  approvedBy: text("approved_by"),
  approvedUntil: timestamp("approved_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// ── Venue Booking Notes (shared notes about upcoming bookings/events) ─────────
export const venueBookingNotesTable = pgTable("venue_booking_notes", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }).unique(),
  notes: text("notes").notNull().default(""),
  eventDate: date("event_date"),
  addedBy: text("added_by"),
  updatedAt: timestamp("updated_at"),
  updatedBy: text("updated_by"),
});

// ── Daily Prep Tasks ──────────────────────────────────────────────────────────
export const prepTasksTable = pgTable("prep_tasks", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").references(() => recipesTable.id, { onDelete: "set null" }),
  libraryTaskId: integer("library_task_id").references(() => prepTaskLibraryTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("other"),
  section: text("section").notNull().default("other"),
  shift: text("shift").notNull().default("all_day"),
  assignedTo: text("assigned_to"),
  claimedBy: text("claimed_by"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("todo"),
  quantity: numeric("quantity", { precision: 10, scale: 3 }),
  unit: text("unit"),
  batchSize: text("batch_size"),
  notes: text("notes"),
  quickInstructions: text("quick_instructions"),
  imageUrl: text("image_url"),
  trainingTags: text("training_tags"),
  prepDate: date("prep_date").defaultNow().notNull(),
  deferredFrom: date("deferred_from"),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: text("archived_by"),
  completedBy: text("completed_by"),
  completedAt: timestamp("completed_at"),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  isCritical: boolean("is_critical").notNull().default(false),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// ── Venue Staff ───────────────────────────────────────────────────────────────
export const venueStaffTable = pgTable("venue_staff", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrepTaskSchema = createInsertSchema(prepTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrepTask = z.infer<typeof insertPrepTaskSchema>;
export type PrepTask = typeof prepTasksTable.$inferSelect;

export const insertVenueStaffSchema = createInsertSchema(venueStaffTable).omit({ id: true, createdAt: true });
export type InsertVenueStaff = z.infer<typeof insertVenueStaffSchema>;
export type VenueStaff = typeof venueStaffTable.$inferSelect;

export const insertPrepTaskLibrarySchema = createInsertSchema(prepTaskLibraryTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrepTaskLibrary = z.infer<typeof insertPrepTaskLibrarySchema>;
export type PrepTaskLibrary = typeof prepTaskLibraryTable.$inferSelect;
