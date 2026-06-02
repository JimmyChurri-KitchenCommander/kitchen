import { pgTable, serial, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { recipesTable } from "./recipes";

export const menusTable = pgTable("menus", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  archivedAt: timestamp("archived_at"),
  archivedBy: text("archived_by"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const menuItemsTable = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  menuId: integer("menu_id").notNull().references(() => menusTable.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }),
  category: text("category"),
  sortOrder: integer("sort_order").notNull().default(0),
  notes: text("notes"),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: text("archived_by"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMenuSchema = createInsertSchema(menusTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({ id: true, createdAt: true });
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type Menu = typeof menusTable.$inferSelect;
export type MenuItem = typeof menuItemsTable.$inferSelect;
