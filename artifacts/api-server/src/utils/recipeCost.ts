import { db } from "@workspace/db";
import { recipeIngredientsTable, inventoryItemsTable, recipesTable, recipeComponentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { computeGrossQtyForCost } from "./unitConvert.js";

// Sum of cost contributions from linked prep recipes (menu → prep components).
// visited guards against circular links (e.g. A → B → A).
async function computeComponentsCost(recipeId: number, depth: number, visited: Set<number>): Promise<number> {
  if (depth > 5) return 0;
  const components = await db
    .select({
      qty: recipeComponentsTable.quantity,
      unit: recipeComponentsTable.unit,
      yf: recipeComponentsTable.yieldFactor,
      prepRecipeId: recipeComponentsTable.prepRecipeId,
    })
    .from(recipeComponentsTable)
    .where(eq(recipeComponentsTable.menuRecipeId, recipeId));
  let total = 0;
  for (const c of components) {
    if (visited.has(c.prepRecipeId)) continue; // cycle — skip
    const [prep] = await db.select().from(recipesTable).where(eq(recipesTable.id, c.prepRecipeId));
    if (!prep) continue;
    const subTotal = await computeRecipeTotalCostInternal(c.prepRecipeId, depth + 1, new Set(visited));
    const subYield = parseFloat(prep.yield);
    if (subYield <= 0) continue;
    const unitCost = subTotal / subYield;
    const netQty = parseFloat(c.qty);
    const yf = parseFloat(c.yf ?? "1");
    const { grossQtyForCost } = computeGrossQtyForCost(
      netQty,
      c.unit ?? "",
      yf,
      prep.yieldUnit ?? c.unit ?? "",
      prep.name,
    );
    total += unitCost * grossQtyForCost;
  }
  return total;
}

async function computeRecipeTotalCostInternal(recipeId: number, depth: number, visited: Set<number>): Promise<number> {
  if (depth > 5) return 0;
  if (visited.has(recipeId)) return 0; // cycle guard
  visited.add(recipeId);

  const ingredients = await db
    .select({
      qty: recipeIngredientsTable.quantity,
      unit: recipeIngredientsTable.unit,
      yf: recipeIngredientsTable.yieldFactor,
      avgCost: inventoryItemsTable.averageCost,
      invUnit: inventoryItemsTable.unit,
      itemName: inventoryItemsTable.name,
      productionRecipeId: inventoryItemsTable.productionRecipeId,
    })
    .from(recipeIngredientsTable)
    .leftJoin(inventoryItemsTable, eq(recipeIngredientsTable.inventoryItemId, inventoryItemsTable.id))
    .where(eq(recipeIngredientsTable.recipeId, recipeId));

  let totalCost = 0;
  for (const ing of ingredients) {
    const netQty = parseFloat(ing.qty);
    const yf = parseFloat(ing.yf ?? "1");
    let unitCost: number;
    if (ing.productionRecipeId && !visited.has(ing.productionRecipeId) && depth < 5) {
      const [subRecipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, ing.productionRecipeId));
      if (subRecipe) {
        const subTotal = await computeRecipeTotalCostInternal(ing.productionRecipeId, depth + 1, new Set(visited));
        const subYield = parseFloat(subRecipe.yield);
        unitCost = subYield > 0 ? subTotal / subYield : 0;
      } else {
        unitCost = ing.avgCost ? parseFloat(ing.avgCost) : 0;
      }
    } else {
      unitCost = ing.avgCost ? parseFloat(ing.avgCost) : 0;
    }
    const { grossQtyForCost } = computeGrossQtyForCost(
      netQty,
      ing.unit ?? "",
      yf,
      ing.invUnit ?? ing.unit ?? "",
      ing.itemName ?? "",
    );
    totalCost += unitCost * grossQtyForCost;
  }
  totalCost += await computeComponentsCost(recipeId, depth, visited);
  return totalCost;
}

export async function computeRecipeTotalCost(recipeId: number, depth = 0): Promise<number> {
  return computeRecipeTotalCostInternal(recipeId, depth, new Set<number>());
}

export type EnrichedComponent = {
  id: number;
  menuRecipeId: number;
  prepRecipeId: number;
  prepRecipeName: string;
  quantity: number;
  unit: string;
  yieldFactor: number;
  grossQuantity: number;
  prepYield: number;
  prepYieldUnit: string | null;
  prepPortionCost: number;
  totalCost: number;
  unitConverted: boolean;
  conversionNote: string | null;
};

export async function computeRecipeComponents(recipeId: number, depth = 0): Promise<EnrichedComponent[]> {
  if (depth > 5) return [];
  const visited = new Set<number>([recipeId]);
  const rows = await db
    .select({ comp: recipeComponentsTable, prep: recipesTable })
    .from(recipeComponentsTable)
    .leftJoin(recipesTable, eq(recipeComponentsTable.prepRecipeId, recipesTable.id))
    .where(eq(recipeComponentsTable.menuRecipeId, recipeId));
  const out: EnrichedComponent[] = [];
  for (const r of rows) {
    if (!r.prep) continue;
    if (visited.has(r.prep.id)) continue; // cycle guard
    const subTotal = await computeRecipeTotalCostInternal(r.prep.id, depth + 1, new Set(visited));
    const subYield = parseFloat(r.prep.yield);
    const prepPortionCost = subYield > 0 ? subTotal / subYield : 0;
    const netQty = parseFloat(r.comp.quantity);
    const yf = parseFloat(r.comp.yieldFactor ?? "1");
    const grossQty = yf > 0 ? netQty / yf : netQty;
    const { grossQtyForCost, converted, conversionNote } = computeGrossQtyForCost(
      netQty,
      r.comp.unit,
      yf,
      r.prep.yieldUnit ?? r.comp.unit,
      r.prep.name,
    );
    out.push({
      id: r.comp.id,
      menuRecipeId: r.comp.menuRecipeId,
      prepRecipeId: r.prep.id,
      prepRecipeName: r.prep.name,
      quantity: netQty,
      unit: r.comp.unit,
      yieldFactor: yf,
      grossQuantity: grossQty,
      prepYield: subYield,
      prepYieldUnit: r.prep.yieldUnit,
      prepPortionCost,
      totalCost: prepPortionCost * grossQtyForCost,
      unitConverted: converted,
      conversionNote: conversionNote ?? null,
    });
  }
  return out;
}

export async function computeRecipeCosts(recipeId: number, depth = 0) {
  const visited = new Set<number>([recipeId]);
  const ingredients = await db
    .select({
      id: recipeIngredientsTable.id,
      recipeId: recipeIngredientsTable.recipeId,
      inventoryItemId: recipeIngredientsTable.inventoryItemId,
      quantity: recipeIngredientsTable.quantity,
      unit: recipeIngredientsTable.unit,
      yieldFactor: recipeIngredientsTable.yieldFactor,
      itemName: inventoryItemsTable.name,
      averageCost: inventoryItemsTable.averageCost,
      invUnit: inventoryItemsTable.unit,
      productionRecipeId: inventoryItemsTable.productionRecipeId,
    })
    .from(recipeIngredientsTable)
    .leftJoin(inventoryItemsTable, eq(recipeIngredientsTable.inventoryItemId, inventoryItemsTable.id))
    .where(eq(recipeIngredientsTable.recipeId, recipeId));

  const enrichedIngredients = await Promise.all(
    ingredients.map(async (i) => {
      const netQty = parseFloat(i.quantity);
      const yieldFactor = i.yieldFactor ? parseFloat(i.yieldFactor) : 1;
      const grossQty = yieldFactor > 0 ? netQty / yieldFactor : netQty;
      const itemName = i.itemName ?? "Unknown";
      const invUnit = i.invUnit ?? i.unit ?? "";

      let unitCost: number;
      let isInHousePrepped = false;
      let productionRecipeName: string | null = null;

      if (i.productionRecipeId && !visited.has(i.productionRecipeId) && depth < 5) {
        const [subRecipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, i.productionRecipeId));
        if (subRecipe) {
          isInHousePrepped = true;
          productionRecipeName = subRecipe.name;
          const subTotal = await computeRecipeTotalCostInternal(i.productionRecipeId, depth + 1, new Set(visited));
          const subYield = parseFloat(subRecipe.yield);
          unitCost = subYield > 0 ? subTotal / subYield : 0;
        } else {
          unitCost = i.averageCost ? parseFloat(i.averageCost) : 0;
        }
      } else {
        unitCost = i.averageCost ? parseFloat(i.averageCost) : 0;
      }

      const { grossQtyForCost, converted, conversionNote } = computeGrossQtyForCost(
        netQty,
        i.unit ?? "",
        yieldFactor,
        invUnit,
        itemName,
      );

      return {
        id: i.id, recipeId: i.recipeId, inventoryItemId: i.inventoryItemId,
        itemName,
        isInHousePrepped, productionRecipeName,
        quantity: netQty,
        grossQuantity: grossQty,
        unit: i.unit,
        invUnit,
        yieldFactor, unitCost,
        totalCost: unitCost * grossQtyForCost,
        unitConverted: converted,
        conversionNote: conversionNote ?? null,
      };
    })
  );

  const ingredientCost = enrichedIngredients.reduce((sum, i) => sum + i.totalCost, 0);
  const enrichedComponents = await computeRecipeComponents(recipeId, depth);
  const componentCost = enrichedComponents.reduce((sum, c) => sum + c.totalCost, 0);
  const totalCost = ingredientCost + componentCost;
  return { enrichedIngredients, enrichedComponents, totalCost };
}
