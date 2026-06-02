import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  nameChangeCount: integer("name_change_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
