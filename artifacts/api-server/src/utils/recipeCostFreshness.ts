import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  inventoryItemsTable,
  recipeComponentsTable,
  recipeIngredientsTable,
  recipesTable,
} from "@workspace/db";

const MAX_DEPENDENCY_DEPTH = 6;

async function expandDependentRecipeIds(venueId: number, seedRecipeIds: number[]): Promise<number[]> {
  const seen = new Set(seedRecipeIds);
  let frontier = [...seen];

  for (let depth = 0; depth < MAX_DEPENDENCY_DEPTH && frontier.length > 0; depth++) {
    const next = new Set<number>();

    const componentParents = await db
      .select({ id: recipeComponentsTable.menuRecipeId })
      .from(recipeComponentsTable)
      .innerJoin(recipesTable, eq(recipeComponentsTable.menuRecipeId, recipesTable.id))
      .where(and(
        eq(recipesTable.venueId, venueId),
        inArray(recipeComponentsTable.prepRecipeId, frontier),
      ));

    for (const row of componentParents) {
      if (!seen.has(row.id)) next.add(row.id);
    }

    const producedItems = await db
      .select({ id: inventoryItemsTable.id })
      .from(inventoryItemsTable)
      .where(and(
        eq(inventoryItemsTable.venueId, venueId),
        inArray(inventoryItemsTable.productionRecipeId, frontier),
      ));

    if (producedItems.length > 0) {
      const itemIds = producedItems.map((item) => item.id);
      const ingredientConsumers = await db
        .select({ id: recipeIngredientsTable.recipeId })
        .from(recipeIngredientsTable)
        .innerJoin(recipesTable, eq(recipeIngredientsTable.recipeId, recipesTable.id))
        .where(and(
          eq(recipesTable.venueId, venueId),
          inArray(recipeIngredientsTable.inventoryItemId, itemIds),
        ));

      for (const row of ingredientConsumers) {
        if (!seen.has(row.id)) next.add(row.id);
      }
    }

    for (const id of next) seen.add(id);
    frontier = [...next];
  }

  return [...seen];
}

export async function markRecipeCostsUpdatedForRecipes(
  venueId: number,
  recipeIds: number[],
  changedAt = new Date(),
): Promise<number[]> {
  const affectedRecipeIds = await expandDependentRecipeIds(venueId, [...new Set(recipeIds)]);
  if (affectedRecipeIds.length === 0) return [];

  await db
    .update(recipesTable)
    .set({ lastCostUpdateAt: changedAt, updatedAt: changedAt })
    .where(and(
      eq(recipesTable.venueId, venueId),
      inArray(recipesTable.id, affectedRecipeIds),
    ));

  return affectedRecipeIds;
}

export async function markRecipeCostsUpdatedForInventoryItems(
  venueId: number,
  inventoryItemIds: number[],
  changedAt = new Date(),
): Promise<number[]> {
  const itemIds = [...new Set(inventoryItemIds)].filter((id) => Number.isFinite(id));
  if (itemIds.length === 0) return [];

  const directRecipes = await db
    .select({ id: recipeIngredientsTable.recipeId })
    .from(recipeIngredientsTable)
    .innerJoin(recipesTable, eq(recipeIngredientsTable.recipeId, recipesTable.id))
    .where(and(
      eq(recipesTable.venueId, venueId),
      inArray(recipeIngredientsTable.inventoryItemId, itemIds),
    ));

  const producedByChangedItems = await db
    .select({ productionRecipeId: inventoryItemsTable.productionRecipeId })
    .from(inventoryItemsTable)
    .where(and(
      eq(inventoryItemsTable.venueId, venueId),
      inArray(inventoryItemsTable.id, itemIds),
    ));

  const recipeIds = [
    ...directRecipes.map((recipe) => recipe.id),
    ...producedByChangedItems
      .map((item) => item.productionRecipeId)
      .filter((id): id is number => id !== null && id !== undefined),
  ];

  return markRecipeCostsUpdatedForRecipes(venueId, recipeIds, changedAt);
}

export async function bumpRecipeVersion(
  venueId: number,
  recipeId: number,
  changedAt = new Date(),
): Promise<void> {
  await db
    .update(recipesTable)
    .set({
      recipeVersion: sql`${recipesTable.recipeVersion} + 1`,
      updatedAt: changedAt,
      lastReviewedAt: null,
      lastCostUpdateAt: changedAt,
    })
    .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)));
}
