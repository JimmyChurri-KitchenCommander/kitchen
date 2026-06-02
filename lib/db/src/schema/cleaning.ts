import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const cleaningTasksTable = pgTable("cleaning_tasks", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  area: text("area").notNull().default("other"),
  frequency: text("frequency").notNull().default("daily"),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  lastCompletedAt: timestamp("last_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const cleaningLogsTable = pgTable("cleaning_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => cleaningTasksTable.id, { onDelete: "cascade" }),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  completedBy: text("completed_by").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertCleaningTaskSchema = createInsertSchema(cleaningTasksTable).omit({ id: true, createdAt: true, updatedAt: true, lastCompletedAt: true });
export type InsertCleaningTask = z.infer<typeof insertCleaningTaskSchema>;
export type CleaningTask = typeof cleaningTasksTable.$inferSelect;

export const insertCleaningLogSchema = createInsertSchema(cleaningLogsTable).omit({ id: true, completedAt: true });
export type InsertCleaningLog = z.infer<typeof insertCleaningLogSchema>;
export type CleaningLog = typeof cleaningLogsTable.$inferSelect;
