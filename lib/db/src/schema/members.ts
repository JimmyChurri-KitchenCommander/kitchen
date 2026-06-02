import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { venuesTable } from "./venues";

export const venueMembersTable = pgTable("venue_members", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id"),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("invited"),
  inviteToken: text("invite_token").unique(),
  inviteExpiresAt: timestamp("invite_expires_at"),
  joinedAt: timestamp("joined_at"),
  removedAt: timestamp("removed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VenueMember = typeof venueMembersTable.$inferSelect;
