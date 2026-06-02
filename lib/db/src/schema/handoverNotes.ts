import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const handoverNotesTable = pgTable("handover_notes", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdBy: text("created_by"),
  shift: text("shift"), // morning | afternoon | evening
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHandoverNoteSchema = createInsertSchema(handoverNotesTable).omit({ id: true, createdAt: true });
export type InsertHandoverNote = z.infer<typeof insertHandoverNoteSchema>;
export type HandoverNote = typeof handoverNotesTable.$inferSelect;
