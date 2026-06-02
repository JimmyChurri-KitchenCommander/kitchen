import { pgTable, serial, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { inventoryItemsTable } from "./inventory";
import { recipesTable } from "./recipes";

export const shareGroupsTable = pgTable("share_groups", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("mixed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const shareGroupItemsTable = pgTable("share_group_items", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => shareGroupsTable.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").references(() => recipesTable.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const sharesTable = pgTable("shares", {
  id: serial("id").primaryKey(),
  shareToken: uuid("share_token").notNull().unique().defaultRandom(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id").notNull(),
  shareType: text("share_type").notNull(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").references(() => recipesTable.id, { onDelete: "cascade" }),
  shareGroupId: integer("share_group_id").references(() => shareGroupsTable.id, { onDelete: "cascade" }),
  label: text("label"),
  allowCopy: boolean("allow_copy").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  accessCount: integer("access_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShareGroupSchema = createInsertSchema(shareGroupsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertShareSchema = createInsertSchema(sharesTable).omit({ id: true, shareToken: true, accessCount: true, createdAt: true });
export type InsertShareGroup = z.infer<typeof insertShareGroupSchema>;
export type InsertShare = z.infer<typeof insertShareSchema>;
export type ShareGroup = typeof shareGroupsTable.$inferSelect;
export type ShareGroupItem = typeof shareGroupItemsTable.$inferSelect;
export type Share = typeof sharesTable.$inferSelect;
