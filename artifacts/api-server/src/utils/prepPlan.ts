import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  inventoryItemsTable,
  menuItemsTable,
  menusTable,
  prepTaskLibraryTable,
  recipeComponentsTable,
  recipeIngredientsTable,
  recipesTable,
} from "@workspace/db";
import { computeGrossQtyForCost } from "./unitConvert.js";

type PrepPlanServicePeriodInput = {
  label: string;
  covers: number;
};

export type PrepPlanInput = {
  menuId?: number;
  prepDate?: string;
  servicePeriods: PrepPlanServicePeriodInput[];
  mixOverrides?: Record<string, number>;
};

type RequirementAccumulator = {
  id: number;
  name: string;
  unit: string;
  requiredQuantity: number;
  currentStock: number;
  parLevel: number;
  supplierId: number | null;
  sources: Set<string>;
};

type PrepAccumulator = {
  recipeId: number;
  recipeName: string;
  inventoryItemId: number | null;
  unit: string;
  requiredQuantity: number;
  currentStock: number;
  parLevel: number;
  sources: Set<string>;
};

type LibraryTaskSummary = {
  id: number;
  title: string;
  category: string;
  section: string;
  shift: string;
  priority: string;
  quantity: number | null;
  unit: string | null;
};

function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function mapShift(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("breakfast") || l.includes("morning")) return "morning";
  if (l.includes("lunch")) return "morning";
  if (l.includes("dinner") || l.includes("evening")) return "afternoon";
  return "all_day";
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function addWarning(warnings: string[], message: string): void {
  if (!warnings.includes(message)) warnings.push(message);
}

function addRequirement(
  map: Map<number, RequirementAccumulator>,
  item: typeof inventoryItemsTable.$inferSelect,
  requiredQuantity: number,
  source: string,
): void {
  const existing = map.get(item.id);
  if (existing) {
    existing.requiredQuantity += requiredQuantity;
    existing.sources.add(source);
    return;
  }
  map.set(item.id, {
    id: item.id,
    name: item.name,
    unit: item.unit,
    requiredQuantity,
    currentStock: parseFloat(item.currentStock),
    parLevel: parseFloat(item.parLevel),
    supplierId: item.supplierId ?? null,
    sources: new Set([source]),
  });
}

function addPrepRequirement(
  map: Map<number, PrepAccumulator>,
  input: {
    recipeId: number;
    recipeName: string;
    inventoryItem: typeof inventoryItemsTable.$inferSelect | null;
    unit: string;
    requiredQuantity: number;
    source: string;
  },
): void {
  const existing = map.get(input.recipeId);
  if (existing) {
    existing.requiredQuantity += input.requiredQuantity;
    existing.sources.add(input.source);
    return;
  }
  map.set(input.recipeId, {
    recipeId: input.recipeId,
    recipeName: input.recipeName,
    inventoryItemId: input.inventoryItem?.id ?? null,
    unit: input.inventoryItem?.unit ?? input.unit,
    requiredQuantity: input.requiredQuantity,
    currentStock: input.inventoryItem ? parseFloat(input.inventoryItem.currentStock) : 0,
    parLevel: input.inventoryItem ? parseFloat(input.inventoryItem.parLevel) : 0,
    sources: new Set([input.source]),
  });
}

export async function calculatePrepPlan(venueId: number, input: PrepPlanInput) {
  const warnings: string[] = [];
  const servicePeriods = input.servicePeriods
    .map((period) => ({ label: period.label.trim() || "Service", covers: Math.max(0, Number(period.covers) || 0) }))
    .filter((period) => period.covers > 0);
  const totalCovers = servicePeriods.reduce((sum, period) => sum + period.covers, 0);

  if (totalCovers <= 0) {
    return {
      venueId,
      prepDate: input.prepDate ?? new Date().toISOString().slice(0, 10),
      menuId: input.menuId ?? null,
      menuName: null,
      totalCovers: 0,
      servicePeriods,
      menuProduction: [],
      prepRequirements: [],
      ingredientRequirements: [],
      orderingRequirements: [],
      suggestedPrepTasks: [],
      warnings: ["Add expected covers before calculating prep."],
      assumptions: [],
    };
  }

  const [menu] = input.menuId
    ? await db.select().from(menusTable).where(and(eq(menusTable.id, input.menuId), eq(menusTable.venueId, venueId)))
    : await db.select().from(menusTable).where(and(eq(menusTable.venueId, venueId), eq(menusTable.isActive, true))).limit(1);

  if (!menu) {
    return {
      venueId,
      prepDate: input.prepDate ?? new Date().toISOString().slice(0, 10),
      menuId: input.menuId ?? null,
      menuName: null,
      totalCovers,
      servicePeriods,
      menuProduction: [],
      prepRequirements: [],
      ingredientRequirements: [],
      orderingRequirements: [],
      suggestedPrepTasks: [],
      warnings: ["No active menu found. Create or select a menu before planning prep."],
      assumptions: [],
    };
  }

  const menuItems = await db
    .select({ menuItem: menuItemsTable, recipe: recipesTable })
    .from(menuItemsTable)
    .innerJoin(recipesTable, eq(menuItemsTable.recipeId, recipesTable.id))
    .where(and(
      eq(menuItemsTable.menuId, menu.id),
      ne(menuItemsTable.isArchived, true),
      eq(recipesTable.venueId, venueId),
    ));

  if (menuItems.length === 0) {
    return {
      venueId,
      prepDate: input.prepDate ?? new Date().toISOString().slice(0, 10),
      menuId: menu.id,
      menuName: menu.name,
      totalCovers,
      servicePeriods,
      menuProduction: [],
      prepRequirements: [],
      ingredientRequirements: [],
      orderingRequirements: [],
      suggestedPrepTasks: [],
      warnings: [`${menu.name} has no linked recipes yet.`],
      assumptions: [],
    };
  }

  const inventory = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId));
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const prepStockByRecipeId = new Map<number, typeof inventoryItemsTable.$inferSelect>();
  for (const item of inventory) {
    if (item.productionRecipeId) prepStockByRecipeId.set(item.productionRecipeId, item);
  }

  const libraryTasks = await db
    .select()
    .from(prepTaskLibraryTable)
    .where(and(eq(prepTaskLibraryTable.venueId, venueId), eq(prepTaskLibraryTable.status, "active")));
  const libraryByRecipeId = new Map<number, typeof prepTaskLibraryTable.$inferSelect>();
  const libraryByInventoryId = new Map<number, typeof prepTaskLibraryTable.$inferSelect>();
  for (const task of libraryTasks) {
    if (task.recipeId && !libraryByRecipeId.has(task.recipeId)) libraryByRecipeId.set(task.recipeId, task);
    if (task.inventoryItemId && !libraryByInventoryId.has(task.inventoryItemId)) libraryByInventoryId.set(task.inventoryItemId, task);
  }

  const ingredientRequirements = new Map<number, RequirementAccumulator>();
  const prepRequirements = new Map<number, PrepAccumulator>();
  const menuProduction: Array<{
    recipeId: number;
    recipeName: string;
    category: string | null;
    portionsRequired: number;
    batches: number;
    yieldQuantity: number;
    yieldUnit: string | null;
    serviceBreakdown: Array<{ label: string; covers: number; portions: number }>;
  }> = [];

  const rawOverrides = input.mixOverrides ?? {};
  const overrideTotal = Object.values(rawOverrides).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  const assumptions = [
    overrideTotal > 0
      ? "Menu mix uses the provided percentage overrides."
      : "Menu mix is split evenly across active menu items because no sales mix was provided.",
    "This is a read-only plan: stock is not deducted until prep is explicitly logged.",
    "Ordering suggestions use max(demand gap, par gap) to avoid double-ordering.",
  ];

  async function addRecipeIngredientDemand(recipeId: number, batches: number, source: string, depth = 0): Promise<void> {
    if (depth > 5 || batches <= 0) return;

    const ingredients = await db
      .select({ ingredient: recipeIngredientsTable, item: inventoryItemsTable })
      .from(recipeIngredientsTable)
      .innerJoin(inventoryItemsTable, eq(recipeIngredientsTable.inventoryItemId, inventoryItemsTable.id))
      .where(and(eq(recipeIngredientsTable.recipeId, recipeId), eq(inventoryItemsTable.venueId, venueId)));

    for (const row of ingredients) {
      const item = row.item;
      const netQty = parseFloat(row.ingredient.quantity);
      const yieldFactor = parseFloat(row.ingredient.yieldFactor ?? "1");
      const conversion = computeGrossQtyForCost(netQty, row.ingredient.unit, yieldFactor, item.unit, item.name);
      if (conversion.conversionNote) addWarning(warnings, `${item.name}: ${conversion.conversionNote}`);
      const requiredQty = conversion.grossQtyForCost * batches;

      if (item.productionRecipeId) {
        const [prepRecipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, item.productionRecipeId));
        if (prepRecipe) {
          addPrepRequirement(prepRequirements, {
            recipeId: prepRecipe.id,
            recipeName: prepRecipe.name,
            inventoryItem: item,
            unit: item.unit,
            requiredQuantity: requiredQty,
            source,
          });
          const prepYield = parseFloat(prepRecipe.yield);
          const nestedBatches = prepYield > 0 ? requiredQty / prepYield : 0;
          await addRecipeIngredientDemand(prepRecipe.id, nestedBatches, `${source} → ${prepRecipe.name}`, depth + 1);
          continue;
        }
      }

      addRequirement(ingredientRequirements, item, requiredQty, source);
    }
  }

  async function addComponentDemand(recipeId: number, menuBatches: number, source: string): Promise<void> {
    const components = await db
      .select({ component: recipeComponentsTable, prep: recipesTable })
      .from(recipeComponentsTable)
      .innerJoin(recipesTable, eq(recipeComponentsTable.prepRecipeId, recipesTable.id))
      .where(eq(recipeComponentsTable.menuRecipeId, recipeId));

    for (const row of components) {
      const prep = row.prep;
      const prepItem = prepStockByRecipeId.get(prep.id) ?? null;
      if (!prepItem) addWarning(warnings, `${prep.name} is linked as prep but has no inventory prep stock item yet.`);

      const netQty = parseFloat(row.component.quantity);
      const yieldFactor = parseFloat(row.component.yieldFactor ?? "1");
      const targetUnit = prepItem?.unit ?? prep.yieldUnit ?? row.component.unit;
      const conversion = computeGrossQtyForCost(netQty, row.component.unit, yieldFactor, targetUnit, prep.name);
      if (conversion.conversionNote) addWarning(warnings, `${prep.name}: ${conversion.conversionNote}`);
      const requiredQty = conversion.grossQtyForCost * menuBatches;

      addPrepRequirement(prepRequirements, {
        recipeId: prep.id,
        recipeName: prep.name,
        inventoryItem: prepItem,
        unit: targetUnit,
        requiredQuantity: requiredQty,
        source,
      });

      const prepYield = parseFloat(prep.yield);
      const prepBatches = prepYield > 0 ? requiredQty / prepYield : 0;
      await addRecipeIngredientDemand(prep.id, prepBatches, `${source} → ${prep.name}`);
    }
  }

  for (const row of menuItems) {
    const recipe = row.recipe;
    const override = rawOverrides[String(recipe.id)] ?? rawOverrides[recipe.id];
    const mixShare = overrideTotal > 0
      ? Math.max(0, Number(override) || 0) / overrideTotal
      : 1 / menuItems.length;
    const portionsRequired = totalCovers * mixShare;
    const recipeYield = parseFloat(recipe.yield);
    const batches = recipeYield > 0 ? portionsRequired / recipeYield : portionsRequired;
    const serviceBreakdown = servicePeriods.map((period) => ({
      label: period.label,
      covers: period.covers,
      portions: roundQty(period.covers * mixShare),
    }));

    menuProduction.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      category: row.menuItem.category ?? recipe.category ?? null,
      portionsRequired: roundQty(portionsRequired),
      batches: roundQty(batches),
      yieldQuantity: roundQty(recipeYield),
      yieldUnit: recipe.yieldUnit ?? recipe.portionUnit,
      serviceBreakdown,
    });

    await addRecipeIngredientDemand(recipe.id, batches, recipe.name);
    await addComponentDemand(recipe.id, batches, recipe.name);
  }

  const prepRequirementRows = [...prepRequirements.values()]
    .map((req) => {
      const gap = Math.max(0, req.requiredQuantity - req.currentStock);
      const parGap = Math.max(0, req.parLevel - req.currentStock);
      return {
        recipeId: req.recipeId,
        recipeName: req.recipeName,
        inventoryItemId: req.inventoryItemId,
        requiredQuantity: roundQty(req.requiredQuantity),
        currentStock: roundQty(req.currentStock),
        parLevel: roundQty(req.parLevel),
        gapQuantity: roundQty(gap),
        parGapQuantity: roundQty(parGap),
        unit: req.unit,
        sources: [...req.sources],
      };
    })
    .sort((a, b) => b.gapQuantity - a.gapQuantity);

  const ingredientRequirementRows = [...ingredientRequirements.values()]
    .map((req) => {
      const gap = Math.max(0, req.requiredQuantity - req.currentStock);
      const parGap = Math.max(0, req.parLevel - req.currentStock);
      return {
        inventoryItemId: req.id,
        itemName: req.name,
        requiredQuantity: roundQty(req.requiredQuantity),
        currentStock: roundQty(req.currentStock),
        parLevel: roundQty(req.parLevel),
        gapQuantity: roundQty(gap),
        parGapQuantity: roundQty(parGap),
        unit: req.unit,
        supplierId: req.supplierId,
        sources: [...req.sources],
      };
    })
    .sort((a, b) => b.gapQuantity - a.gapQuantity);

  const orderingRequirements = ingredientRequirementRows
    .map((req) => {
      const suggestedOrderQuantity = Math.max(req.gapQuantity, req.parGapQuantity);
      return {
        inventoryItemId: req.inventoryItemId,
        itemName: req.itemName,
        suggestedOrderQuantity: roundQty(suggestedOrderQuantity),
        unit: req.unit,
        demandGapQuantity: req.gapQuantity,
        parGapQuantity: req.parGapQuantity,
        supplierId: req.supplierId,
        reason: req.gapQuantity > 0 && req.parGapQuantity > 0
          ? "Demand and par gap"
          : req.gapQuantity > 0
          ? "Demand gap"
          : "Par gap",
        sources: req.sources,
      };
    })
    .filter((req) => req.suggestedOrderQuantity > 0)
    .sort((a, b) => b.suggestedOrderQuantity - a.suggestedOrderQuantity);

  const suggestedPrepTasks = prepRequirementRows
    .filter((req) => req.gapQuantity > 0)
    .map((req) => {
      const libraryTask = libraryByRecipeId.get(req.recipeId)
        ?? (req.inventoryItemId ? libraryByInventoryId.get(req.inventoryItemId) : undefined)
        ?? null;
      const summary: LibraryTaskSummary | null = libraryTask ? {
        id: libraryTask.id,
        title: libraryTask.title,
        category: libraryTask.category,
        section: libraryTask.section,
        shift: libraryTask.shift,
        priority: libraryTask.priority,
        quantity: libraryTask.quantity !== null ? parseFloat(libraryTask.quantity) : null,
        unit: libraryTask.unit ?? null,
      } : null;
      if (!summary) addWarning(warnings, `No active prep-library task is linked to ${req.recipeName}.`);
      return {
        recipeId: req.recipeId,
        recipeName: req.recipeName,
        inventoryItemId: req.inventoryItemId,
        title: summary?.title ?? `Produce ${req.recipeName}`,
        quantity: req.gapQuantity,
        unit: req.unit,
        priority: req.gapQuantity > 0 ? "high" : "medium",
        shift: servicePeriods.length === 1 ? mapShift(servicePeriods[0]!.label) : "all_day",
        libraryTask: summary,
        reason: `${req.recipeName} needs ${req.requiredQuantity} ${req.unit}; ${req.currentStock} ${req.unit} on hand.`,
        sources: req.sources,
      };
    });

  return {
    venueId,
    prepDate: input.prepDate ?? new Date().toISOString().slice(0, 10),
    menuId: menu.id,
    menuName: menu.name,
    totalCovers,
    servicePeriods,
    menuProduction,
    prepRequirements: prepRequirementRows,
    ingredientRequirements: ingredientRequirementRows,
    orderingRequirements,
    suggestedPrepTasks,
    warnings,
    assumptions,
  };
}
