import { pgTable, serial, text, timestamp, integer, numeric, boolean, jsonb, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { inventoryItemsTable } from "./inventory";

export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  method: text("method"),
  yield: numeric("yield", { precision: 10, scale: 3 }).notNull().default("1"),
  yieldUnit: text("yield_unit"),
  portionSize: numeric("portion_size", { precision: 10, scale: 3 }).notNull().default("1"),
  portionUnit: text("portion_unit").notNull().default("portion"),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }),
  platingNotes: text("plating_notes"),
  imageUrl: text("image_url"),
  parentRecipeId: integer("parent_recipe_id").references((): AnyPgColumn => recipesTable.id, { onDelete: "set null" }),
  adaptationNotes: text("adaptation_notes"),
  // active | inactive | waiting_approval
  status: text("status").notNull().default("active"),
  // 'menu' (final dish) | 'prep' (component/mise en place) | null (unclassified, pre-split legacy rows)
  recipeType: text("recipe_type"),
  // Recipe integrity tracking — chefs trust data that's been recently reviewed
  lastReviewedAt: timestamp("last_reviewed_at"),
  lastCostUpdateAt: timestamp("last_cost_update_at"),
  recipeVersion: integer("recipe_version").notNull().default(1),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: text("archived_by"),
  // 14 EU allergens stored as string array, e.g. ["gluten","milk","eggs"]
  allergens: jsonb("allergens").$type<string[]>().default([]),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItemsTable.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  yieldFactor: numeric("yield_factor", { precision: 5, scale: 4 }).notNull().default("1"),
});

// Menu recipes link to prep recipes through this join table. Cost rolls up:
// the menu recipe's totalCost includes (qty / prep.yield) * prep.totalCost per component.
export const recipeComponentsTable = pgTable("recipe_components", {
  id: serial("id").primaryKey(),
  menuRecipeId: integer("menu_recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  prepRecipeId: integer("prep_recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  yieldFactor: numeric("yield_factor", { precision: 5, scale: 4 }).notNull().default("1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecipeSchema = createInsertSchema(recipesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredientsTable).omit({ id: true });
export const insertRecipeComponentSchema = createInsertSchema(recipeComponentsTable).omit({ id: true, createdAt: true });
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type InsertRecipeComponent = z.infer<typeof insertRecipeComponentSchema>;
export type Recipe = typeof recipesTable.$inferSelect;
export type RecipeIngredient = typeof recipeIngredientsTable.$inferSelect;
export type RecipeComponent = typeof recipeComponentsTable.$inferSelect;
