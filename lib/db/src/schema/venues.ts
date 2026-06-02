import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ServiceWindow = {
  label: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

export type ServiceModeConfig = {
  v2Enabled: boolean;
  v3Enabled: boolean;
};

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  timezone: text("timezone").default("UTC"),
  currency: text("currency").default("AUD"),
  venueType: text("venue_type"),
  teamSize: integer("team_size"),
  avgCoversPerService: integer("avg_covers_per_service"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  enabledModules: jsonb("enabled_modules").$type<string[]>(),
  kitchenAreas: jsonb("kitchen_areas").$type<string[]>(),
  staffRole: text("staff_role"),
  serviceWindows: jsonb("service_windows").$type<ServiceWindow[]>(),
  serviceModeConfig: jsonb("service_mode_config").$type<ServiceModeConfig>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertVenueSchema = createInsertSchema(venuesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venuesTable.$inferSelect;
