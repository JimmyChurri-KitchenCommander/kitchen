import { Router } from "express";
import { db } from "@workspace/db";
import { recipesTable, recipeIngredientsTable, recipeComponentsTable, inventoryItemsTable, prepTasksTable } from "@workspace/db";
import { eq, and, ne, desc, isNull, inArray, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin, assertVenueAnyRelation } from "../middlewares/venueAuth";
import { computeRecipeCosts, computeRecipeTotalCost, computeRecipeComponents } from "../utils/recipeCost";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const RECIPE_REVIEW_STALE_DAYS = 60;

function parseRecipe(r: typeof recipesTable.$inferSelect, totalCost: number) {
  const portionSize = parseFloat(r.portionSize);
  const yieldVal = parseFloat(r.yield);
  const portionCost = yieldVal > 0 ? (totalCost / yieldVal) * portionSize : totalCost;
  const sellingPrice = r.sellingPrice ? parseFloat(r.sellingPrice) : null;
  const gpPercent = sellingPrice ? ((sellingPrice - portionCost) / sellingPrice) * 100 : null;
  const foodCostPercent = sellingPrice && sellingPrice > 0 ? (portionCost / sellingPrice) * 100 : null;
  const lastReviewedAt = r.lastReviewedAt ? r.lastReviewedAt.toISOString() : null;
  const daysSinceReview = r.lastReviewedAt
    ? Math.floor((Date.now() - r.lastReviewedAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const reviewStale = daysSinceReview === null || daysSinceReview > RECIPE_REVIEW_STALE_DAYS;
  return {
    id: r.id, venueId: r.venueId, name: r.name, category: r.category,
    description: r.description, method: r.method, yield: yieldVal, yieldUnit: r.yieldUnit,
    portionSize, portionUnit: r.portionUnit, sellingPrice, totalCost, portionCost,
    gpPercent: gpPercent !== null ? Math.round(gpPercent * 100) / 100 : null,
    foodCostPercent: foodCostPercent !== null ? Math.round(foodCostPercent * 100) / 100 : null,
    platingNotes: r.platingNotes, imageUrl: r.imageUrl, createdAt: r.createdAt.toISOString(),
    parentRecipeId: r.parentRecipeId ?? null,
    adaptationNotes: r.adaptationNotes ?? null,
    lastReviewedAt,
    lastCostUpdateAt: r.lastCostUpdateAt ? r.lastCostUpdateAt.toISOString() : null,
    recipeVersion: r.recipeVersion ?? 1,
    daysSinceReview,
    reviewStale,
    recipeType: r.recipeType ?? null,
    allergens: (r.allergens as string[] | null) ?? [],
    status: r.status,
  };
}

// Static path — must be registered BEFORE /:recipeId so Express doesn't match
// "unclassified-count" as a recipeId param.
router.get("/venues/:venueId/recipes/unclassified-count", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(recipesTable)
      .where(and(eq(recipesTable.venueId, venueId), isNull(recipesTable.recipeType)));
    res.json({ count: row?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to count unclassified recipes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/recipes", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const typeFilter = req.query["type"] as string | undefined;
    const conditions = [eq(recipesTable.venueId, venueId)];
    if (typeFilter === "menu" || typeFilter === "prep") {
      conditions.push(eq(recipesTable.recipeType, typeFilter));
    } else if (typeFilter === "unclassified") {
      conditions.push(isNull(recipesTable.recipeType));
    }
    const recipes = await db.select().from(recipesTable).where(and(...conditions));
    const result = await Promise.all(recipes.map(async (r) => {
      const totalCost = await computeRecipeTotalCost(r.id);
      return parseRecipe(r, totalCost);
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list recipes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/recipes", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const body = req.body as Record<string, unknown>;
    if (!body["name"]) { res.status(400).json({ error: "name is required" }); return; }
    const reqType = body["recipeType"] as string | undefined;
    const recipeType = reqType === "prep" ? "prep" : "menu";
    const [recipe] = await db.insert(recipesTable).values({
      venueId, name: body["name"] as string,
      recipeType,
      category: body["category"] as string | undefined,
      description: body["description"] as string | undefined,
      method: body["method"] as string | undefined,
      yield: String(body["yield"] ?? 1),
      yieldUnit: body["yieldUnit"] as string | undefined,
      portionSize: String(body["portionSize"] ?? 1),
      portionUnit: (body["portionUnit"] as string | undefined) ?? "portion",
      sellingPrice: body["sellingPrice"] ? String(body["sellingPrice"]) : null,
      platingNotes: body["platingNotes"] as string | undefined,
      imageUrl: body["imageUrl"] as string | undefined,
      createdBy: req.userId!,
    }).returning();
    res.status(201).json(parseRecipe(recipe!, 0));
  } catch (err) {
    req.log.error({ err }, "Failed to create recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/recipes/:recipeId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [recipe] = await db.select().from(recipesTable)
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)));
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }
    const { enrichedIngredients, enrichedComponents, totalCost } = await computeRecipeCosts(recipeId);

    // For prep recipes, find menu recipes that consume this one as a component.
    let usedIn: Array<{ id: number; name: string; recipeType: string | null }> = [];
    if (recipe.recipeType === "prep") {
      const rows = await db
        .select({ id: recipesTable.id, name: recipesTable.name, recipeType: recipesTable.recipeType })
        .from(recipeComponentsTable)
        .leftJoin(recipesTable, eq(recipeComponentsTable.menuRecipeId, recipesTable.id))
        .where(eq(recipeComponentsTable.prepRecipeId, recipeId));
      usedIn = rows
        .filter((r) => r.id !== null)
        .map((r) => ({ id: r.id!, name: r.name ?? "", recipeType: r.recipeType ?? null }));
    }

    // Fetch all adaptations (direct children of this recipe or its original)
    const rootId = recipe.parentRecipeId ?? recipe.id;
    const siblings = await db.select().from(recipesTable)
      .where(and(eq(recipesTable.parentRecipeId, rootId), eq(recipesTable.venueId, venueId)));
    const adaptations = await Promise.all(siblings.map(async (a) => {
      const cost = await computeRecipeTotalCost(a.id);
      return parseRecipe(a, cost);
    }));

    // Ingredient availability check
    const inventory = await db.select().from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.venueId, venueId));
    const invById = new Map(inventory.map(i => [i.id, i]));
    const ingredientAvailability = enrichedIngredients.map(ing => {
      const inv = ing.inventoryItemId ? invById.get(ing.inventoryItemId) : null;
      const inStock = inv ? parseFloat(inv.currentStock) > 0 : false;
      return { itemName: ing.itemName, inStock, currentStock: inv ? parseFloat(inv.currentStock) : 0, unit: ing.unit };
    });

    res.json({
      ...parseRecipe(recipe, totalCost),
      ingredients: enrichedIngredients,
      components: enrichedComponents,
      usedIn,
      adaptations,
      ingredientAvailability,
      isOriginal: !recipe.parentRecipeId,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/recipes/:recipeId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const strFields = ["name", "category", "description", "method", "yieldUnit", "portionUnit", "platingNotes", "imageUrl", "adaptationNotes"];
    for (const f of strFields) { if (body[f] !== undefined) updates[f] = body[f]; }
    if (body["recipeType"] !== undefined) {
      const t = body["recipeType"];
      if (t === "menu" || t === "prep" || t === null) updates["recipeType"] = t;
    }
    if (body["yield"] !== undefined) updates["yield"] = String(body["yield"]);
    if (body["portionSize"] !== undefined) updates["portionSize"] = String(body["portionSize"]);
    if (body["sellingPrice"] !== undefined) updates["sellingPrice"] = String(body["sellingPrice"]);
    if (body["allergens"] !== undefined && Array.isArray(body["allergens"])) {
      updates["allergens"] = body["allergens"];
    }
    const [recipe] = await db.update(recipesTable).set(updates)
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId))).returning();
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }
    const totalCost = await computeRecipeTotalCost(recipeId);
    res.json(parseRecipe(recipe, totalCost));
  } catch (err) {
    req.log.error({ err }, "Failed to update recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /venues/:venueId/recipes/:recipeId/mark-reviewed ─────────────────────
router.post("/venues/:venueId/recipes/:recipeId/mark-reviewed", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [recipe] = await db.update(recipesTable)
      .set({ lastReviewedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)))
      .returning();
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }
    const totalCost = await computeRecipeTotalCost(recipeId);
    res.json(parseRecipe(recipe, totalCost));
  } catch (err) {
    req.log.error({ err }, "Failed to mark recipe reviewed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/recipes/:recipeId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    await db.delete(recipesTable).where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Adapt recipe using AI ─────────────────────────────────────────────────────

router.post("/venues/:venueId/recipes/:recipeId/adapt", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const [recipe] = await db.select().from(recipesTable)
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)));
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }

    const rawIngredients = await db
      .select({ ingr: recipeIngredientsTable, item: inventoryItemsTable })
      .from(recipeIngredientsTable)
      .leftJoin(inventoryItemsTable, eq(recipeIngredientsTable.inventoryItemId, inventoryItemsTable.id))
      .where(eq(recipeIngredientsTable.recipeId, recipeId));

    const inventory = await db.select().from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true)));

    const ingredientsText = rawIngredients.map(r =>
      `- ${r.item?.name ?? "Unknown"}: ${r.ingr.quantity} ${r.ingr.unit} [inventoryItemId: ${r.item?.id ?? "null"}] [inStock: ${r.item ? parseFloat(r.item.currentStock) > 0 ? "YES" : "NO" : "NOT_IN_INVENTORY"}]`
    ).join("\n");

    const inventoryText = inventory
      .filter(i => parseFloat(i.currentStock) > 0)
      .map(i => `- ${i.name} [id: ${i.id}]: ${i.currentStock} ${i.unit} @ $${i.averageCost}/${i.unit}`)
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: `You are a professional chef with deep culinary expertise. You adapt recipes to use available kitchen stock. Only suggest substitutions that make genuine culinary sense — similar flavour profiles, same function in the dish, appropriate texture and fat content. Never suggest nonsensical swaps. Respond with valid JSON only, no markdown.`,
      messages: [{
        role: "user",
        content: `Adapt this recipe to use what is currently in stock at the venue.

Recipe: "${recipe.name}" (${recipe.category ?? "General"})
${recipe.description ? `Description: ${recipe.description}` : ""}

Original ingredients:
${ingredientsText}

Currently in stock (with inventory IDs):
${inventoryText || "Nothing in stock"}

For each ingredient NOT in stock, suggest the best available substitute from the in-stock list — but ONLY if a genuinely sensible culinary substitution exists.

Good substitutions (same function, compatible flavour/texture):
- Caster sugar ↔ brown sugar, granulated sugar
- Double cream ↔ crème fraîche, heavy cream
- Chicken thigh ↔ chicken breast (adjust cooking time)
- Veal stock ↔ chicken stock, beef stock
- Butter ↔ cultured butter, unsalted butter
- Shallots ↔ red onion (finely diced)

Bad substitutions (fundamentally different):
- Cream ↔ water
- Butter ↔ oil for pastry
- Fish ↔ chicken
- Sugar ↔ salt

Respond with JSON ONLY in exactly this format:
{
  "adaptedName": "Brief adapted name (e.g. '${recipe.name} — Adapted')",
  "adaptationNotes": "1-2 sentence summary of what was changed and why",
  "unchangedInventoryItemIds": [list of integer inventoryItemIds kept as-is],
  "substitutions": [
    {
      "originalItemName": "name of original ingredient",
      "originalInventoryItemId": integer or null,
      "substituteInventoryItemId": integer or null,
      "substituteItemName": "name of substitute" or null,
      "quantity": number,
      "unit": "unit string",
      "reason": "brief culinary justification",
      "needsOrdering": boolean
    }
  ]
}`
      }],
    });

    const block = message.content[0];
    if (!block || block.type !== "text") {
      res.status(500).json({ error: "AI did not return a text response" }); return;
    }

    type SubstitutionItem = {
      originalItemName: string;
      originalInventoryItemId: number | null;
      substituteInventoryItemId: number | null;
      substituteItemName: string | null;
      quantity: number;
      unit: string;
      reason: string;
      needsOrdering: boolean;
    };

    let aiResult: {
      adaptedName: string;
      adaptationNotes: string;
      unchangedInventoryItemIds: number[];
      substitutions: SubstitutionItem[];
    };

    try {
      aiResult = JSON.parse(block.text) as typeof aiResult;
    } catch {
      req.log.error({ text: block.text }, "AI returned invalid JSON");
      res.status(500).json({ error: "AI returned invalid JSON" }); return;
    }

    const rootId = recipe.parentRecipeId ?? recipe.id;
    const [adaptedRecipe] = await db.insert(recipesTable).values({
      venueId,
      name: aiResult.adaptedName || `${recipe.name} (Adapted)`,
      category: recipe.category,
      description: recipe.description,
      method: recipe.method,
      yield: recipe.yield,
      yieldUnit: recipe.yieldUnit,
      portionSize: recipe.portionSize,
      portionUnit: recipe.portionUnit,
      sellingPrice: recipe.sellingPrice,
      platingNotes: recipe.platingNotes,
      parentRecipeId: rootId,
      adaptationNotes: aiResult.adaptationNotes,
    }).returning();

    if (!adaptedRecipe) { res.status(500).json({ error: "Failed to create adapted recipe" }); return; }

    const unchangedIngredients = rawIngredients.filter(r =>
      r.item && aiResult.unchangedInventoryItemIds.includes(r.item.id)
    );
    for (const u of unchangedIngredients) {
      await db.insert(recipeIngredientsTable).values({
        recipeId: adaptedRecipe.id,
        inventoryItemId: u.ingr.inventoryItemId,
        quantity: u.ingr.quantity,
        unit: u.ingr.unit,
        yieldFactor: u.ingr.yieldFactor,
      });
    }

    for (const sub of aiResult.substitutions) {
      if (!sub.needsOrdering && sub.substituteInventoryItemId) {
        await db.insert(recipeIngredientsTable).values({
          recipeId: adaptedRecipe.id,
          inventoryItemId: sub.substituteInventoryItemId,
          quantity: String(sub.quantity),
          unit: sub.unit,
          yieldFactor: "1",
        });
      }
    }

    const { enrichedIngredients, totalCost } = await computeRecipeCosts(adaptedRecipe.id);
    const needsOrdering = aiResult.substitutions
      .filter(s => s.needsOrdering)
      .map(s => ({ itemName: s.originalItemName, reason: "Not currently in stock — order from supplier" }));

    req.log.info({ venueId, originalRecipeId: recipeId, adaptedId: adaptedRecipe.id }, "Recipe adapted");
    res.status(201).json({
      ...parseRecipe(adaptedRecipe, totalCost),
      ingredients: enrichedIngredients,
      adaptations: [],
      ingredientAvailability: [],
      isOriginal: false,
      needsOrdering,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to adapt recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Ingredients ───────────────────────────────────────────────────────────────

router.post("/venues/:venueId/recipes/:recipeId/ingredients", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    // Verify the recipe belongs to this venue before mutating its ingredients.
    const [ownedRecipe] = await db.select({ id: recipesTable.id })
      .from(recipesTable)
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)));
    if (!ownedRecipe) { res.status(404).json({ error: "Recipe not found" }); return; }
    const { inventoryItemId, quantity, unit, yieldFactor } = req.body as Record<string, unknown>;
    if (!inventoryItemId || !quantity || !unit) {
      res.status(400).json({ error: "inventoryItemId, quantity, and unit are required" }); return;
    }
    const yf = yieldFactor !== undefined ? String(yieldFactor) : "1";
    const [ingr] = await db.insert(recipeIngredientsTable).values({
      recipeId, inventoryItemId: Number(inventoryItemId), quantity: String(quantity), unit: unit as string, yieldFactor: yf,
    }).returning();
    const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, Number(inventoryItemId)));
    let unitCost = item ? parseFloat(item.averageCost) : 0;
    let isInHousePrepped = false;
    let productionRecipeName: string | null = null;
    if (item?.productionRecipeId) {
      const [subRecipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, item.productionRecipeId));
      if (subRecipe) {
        isInHousePrepped = true; productionRecipeName = subRecipe.name;
        const subTotal = await computeRecipeTotalCost(subRecipe.id);
        const subYield = parseFloat(subRecipe.yield);
        unitCost = subYield > 0 ? subTotal / subYield : 0;
      }
    }
    const netQty = parseFloat(ingr!.quantity);
    const yfParsed = parseFloat(ingr!.yieldFactor ?? "1");
    const grossQty = yfParsed > 0 ? netQty / yfParsed : netQty;
    res.status(201).json({
      id: ingr!.id, recipeId: ingr!.recipeId, inventoryItemId: ingr!.inventoryItemId,
      itemName: item?.name ?? "Unknown", quantity: netQty, grossQuantity: grossQty,
      unit: ingr!.unit, yieldFactor: yfParsed, unitCost, totalCost: unitCost * grossQty,
      isInHousePrepped, productionRecipeName,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add ingredient");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/recipes/:recipeId/ingredients/:ingredientId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    const ingredientId = parseInt(req.params["ingredientId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    // Confirm ingredient + recipe both belong to this venue before mutating.
    const [owned] = await db.select({ id: recipeIngredientsTable.id })
      .from(recipeIngredientsTable)
      .innerJoin(recipesTable, eq(recipeIngredientsTable.recipeId, recipesTable.id))
      .where(and(
        eq(recipeIngredientsTable.id, ingredientId),
        eq(recipeIngredientsTable.recipeId, recipeId),
        eq(recipesTable.venueId, venueId),
      ));
    if (!owned) { res.status(404).json({ error: "Ingredient not found" }); return; }
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (body["quantity"] !== undefined) updates["quantity"] = String(body["quantity"]);
    if (body["unit"] !== undefined) updates["unit"] = body["unit"];
    if (body["yieldFactor"] !== undefined) updates["yieldFactor"] = String(body["yieldFactor"]);
    const [ingr] = await db.update(recipeIngredientsTable).set(updates)
      .where(and(eq(recipeIngredientsTable.id, ingredientId), eq(recipeIngredientsTable.recipeId, recipeId))).returning();
    if (!ingr) { res.status(404).json({ error: "Ingredient not found" }); return; }
    const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, ingr.inventoryItemId));
    let unitCost = item ? parseFloat(item.averageCost) : 0;
    let isInHousePrepped = false; let productionRecipeName: string | null = null;
    if (item?.productionRecipeId) {
      const [subRecipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, item.productionRecipeId));
      if (subRecipe) { isInHousePrepped = true; productionRecipeName = subRecipe.name; const subTotal = await computeRecipeTotalCost(subRecipe.id); const subYield = parseFloat(subRecipe.yield); unitCost = subYield > 0 ? subTotal / subYield : 0; }
    }
    const netQty = parseFloat(ingr.quantity);
    const yf = parseFloat(ingr.yieldFactor ?? "1");
    const grossQty = yf > 0 ? netQty / yf : netQty;
    res.json({ id: ingr.id, recipeId: ingr.recipeId, inventoryItemId: ingr.inventoryItemId, itemName: item?.name ?? "Unknown", quantity: netQty, grossQuantity: grossQty, unit: ingr.unit, yieldFactor: yf, unitCost, totalCost: unitCost * grossQty, isInHousePrepped, productionRecipeName });
  } catch (err) {
    req.log.error({ err }, "Failed to update ingredient");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/recipes/:recipeId/ingredients/:ingredientId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    const ingredientId = parseInt(req.params["ingredientId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    // Confirm ingredient + recipe both belong to this venue before deleting.
    const [owned] = await db.select({ id: recipeIngredientsTable.id })
      .from(recipeIngredientsTable)
      .innerJoin(recipesTable, eq(recipeIngredientsTable.recipeId, recipesTable.id))
      .where(and(
        eq(recipeIngredientsTable.id, ingredientId),
        eq(recipeIngredientsTable.recipeId, recipeId),
        eq(recipesTable.venueId, venueId),
      ));
    if (!owned) { res.status(404).json({ error: "Ingredient not found" }); return; }
    await db.delete(recipeIngredientsTable)
      .where(and(eq(recipeIngredientsTable.id, ingredientId), eq(recipeIngredientsTable.recipeId, recipeId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete ingredient");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/recipes/:recipeId/log-prep", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { portions } = req.body as Record<string, unknown>;
    const portionsNum = Number(portions);
    if (!portions || isNaN(portionsNum) || portionsNum <= 0) {
      res.status(400).json({ error: "portions must be a positive number" }); return;
    }
    const [recipe] = await db.select().from(recipesTable)
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)));
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }

    const recipeYield = parseFloat(recipe.yield);
    const batches = recipeYield > 0 ? portionsNum / recipeYield : 1;
    const { enrichedIngredients } = await computeRecipeCosts(recipeId);

    const deductions = [];
    for (const ing of enrichedIngredients) {
      if (!ing.inventoryItemId) continue;
      const deductAmount = ing.grossQuantity * batches;
      const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, ing.inventoryItemId));
      if (item) {
        const newStock = Math.max(0, parseFloat(item.currentStock) - deductAmount);
        await db.update(inventoryItemsTable).set({ currentStock: newStock.toFixed(4) }).where(eq(inventoryItemsTable.id, item.id));
        deductions.push({ itemName: ing.itemName, deducted: deductAmount, unit: ing.unit, remaining: newStock });
      }
    }

    const outputItems = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId));
    const producedByThis = outputItems.filter(i => i.productionRecipeId === recipeId);
    for (const produced of producedByThis) {
      const addedQty = recipeYield * batches;
      const newStock = parseFloat(produced.currentStock) + addedQty;
      await db.update(inventoryItemsTable)
        .set({ currentStock: newStock.toFixed(4), lastRestocked: new Date() })
        .where(eq(inventoryItemsTable.id, produced.id));
    }

    req.log.info({ venueId, recipeId, portions: portionsNum }, "Prep logged");
    res.json({ portions: portionsNum, deductions });
  } catch (err) {
    req.log.error({ err }, "Failed to log prep");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── RECIPE IMPORT (AI extraction from photo or URL) ─────────────────────────

router.post("/venues/:venueId/recipes/import", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const { source, imageBase64, mimeType, url } = req.body as {
      source: "image" | "url";
      imageBase64?: string;
      mimeType?: string;
      url?: string;
    };

    if (source !== "image" && source !== "url") {
      res.status(400).json({ error: "source must be 'image' or 'url'" }); return;
    }
    if (source === "image" && !imageBase64) {
      res.status(400).json({ error: "imageBase64 is required for image source" }); return;
    }
    if (source === "url" && !url) {
      res.status(400).json({ error: "url is required for url source" }); return;
    }

    // Fetch inventory items so we can fuzzy-match ingredient names
    const inventoryItems = await db.select({ id: inventoryItemsTable.id, name: inventoryItemsTable.name })
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.venueId, venueId));

    const inventoryList = inventoryItems.map(i => `${i.id}: ${i.name}`).join("\n");

    const systemPrompt = `You are a professional chef's assistant. Extract ALL recipe data from the provided source.

IMPORTANT: Some pages contain multiple distinct recipes. You MUST extract every recipe you find.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "recipes": [
    {
      "name": "recipe name",
      "category": "Starters | Mains | Desserts | Sauces | Sides | Pastry | Snacks | Specials | or null",
      "method": "step by step method or null",
      "platingNotes": "plating/serving notes or null",
      "yield": <number: total batch yield quantity>,
      "yieldUnit": "unit for yield e.g. portions, kg, L or null",
      "portionSize": <number: size of one portion>,
      "portionUnit": "unit for portion e.g. ptn, g, ml",
      "sellingPrice": <number or null>,
      "ingredients": [
        {
          "name": "ingredient name",
          "quantity": <number>,
          "unit": "unit",
          "matchedInventoryItemId": <integer id from the inventory list below, or null if no match>
        }
      ]
    }
  ]
}

Rules:
- Always return an array under "recipes", even if only one recipe is found.
- If the page contains multiple recipes (e.g. a collection page, a blog post with several recipes, or a garnishes guide with multiple garnish recipes), extract ALL of them as separate objects in the array.
- For yield/portionSize: if only ingredients listed with no yield info, assume yield=1, portionSize=1, portionUnit="ptn"
- For quantities: convert fractions to decimals (1/2 = 0.5). Use numeric values.
- For units: use standardised units (g, kg, ml, L, ptn, each, tsp, tbsp, cup). If unit is "pts" it means "parts" — use the ratio as quantity with unit "parts".
- Match ingredient names against the inventory list below using fuzzy matching (e.g. "Olive Oil" matches "Extra Virgin Olive Oil"). Only match if confident.
- Preserve the original method text faithfully.

Venue inventory items (id: name):
${inventoryList || "(no inventory items yet)"}`;

    let extractedText = "";

    if (source === "image" && imageBase64) {
      const imgMime = (mimeType || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        max_completion_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${imgMime};base64,${imageBase64}` },
              },
              { type: "text", text: "Extract the recipe from this image and return the JSON." },
            ],
          },
        ],
      });
      extractedText = response.choices[0]?.message?.content ?? "";
    } else if (source === "url" && url) {
      // Fetch URL content
      let pageText = "";
      try {
        const fetchRes = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; RecipeImporter/1.0)" },
          signal: AbortSignal.timeout(10000),
        });
        if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
        const html = await fetchRes.text();
        // Strip tags for a rough plain-text extraction
        pageText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{2,}/g, " ")
          .slice(0, 12000);
      } catch (fetchErr) {
        req.log.warn({ fetchErr, url }, "Failed to fetch recipe URL");
        res.status(400).json({ error: "Could not fetch the URL. Please check it is publicly accessible." }); return;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        max_completion_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Extract the recipe from this web page content and return the JSON.\n\nURL: ${url}\n\nPage content:\n${pageText}`,
          },
        ],
      });
      extractedText = response.choices[0]?.message?.content ?? "";
    }

    // Parse JSON from the response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      req.log.error({ extractedText }, "AI did not return valid JSON for recipe import");
      res.status(500).json({ error: "AI could not extract a recipe from this source." }); return;
    }

    const parsed = JSON.parse(jsonMatch[0]) as { recipes?: unknown[] };
    // Normalise: always return { recipes: [...] }
    const recipes = Array.isArray(parsed.recipes) ? parsed.recipes : [parsed];
    req.log.info({ venueId, source, count: recipes.length }, "Recipe(s) imported via AI");
    res.json({ recipes });
  } catch (err) {
    req.log.error({ err }, "Failed to import recipe");
    res.status(500).json({ error: "Failed to extract recipe. Please try again." });
  }
});

// ─── ALL PREP TASKS FOR A RECIPE ─────────────────────────────────────────────

router.get("/venues/:venueId/recipes/:recipeId/prep-tasks", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const tasks = await db
      .select()
      .from(prepTasksTable)
      .where(and(
        eq(prepTasksTable.venueId, venueId),
        eq(prepTasksTable.recipeId, recipeId),
        ne(prepTasksTable.isArchived, true),
      ))
      .orderBy(desc(prepTasksTable.prepDate), desc(prepTasksTable.createdAt));

    res.json(tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      category: t.category,
      status: t.status,
      shift: t.shift,
      priority: t.priority,
      assignedTo: t.assignedTo ?? null,
      prepDate: t.prepDate,
      createdAt: t.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list recipe prep tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── COMPONENT LINKS (menu recipe → prep recipe) ──────────────────────────────

router.post("/venues/:venueId/recipes/:recipeId/components", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuRecipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const body = req.body as Record<string, unknown>;
    const prepRecipeId = Number(body["prepRecipeId"]);
    const quantity = body["quantity"];
    const unit = body["unit"];
    if (!prepRecipeId || quantity === undefined || !unit) {
      res.status(400).json({ error: "prepRecipeId, quantity, and unit are required" }); return;
    }
    if (prepRecipeId === menuRecipeId) {
      res.status(400).json({ error: "A recipe cannot link to itself" }); return;
    }
    // Verify both recipes belong to this venue
    const both = await db.select().from(recipesTable)
      .where(and(eq(recipesTable.venueId, venueId), inArray(recipesTable.id, [menuRecipeId, prepRecipeId])));
    if (both.length !== 2) { res.status(404).json({ error: "Recipe not found" }); return; }
    const prep = both.find(r => r.id === prepRecipeId);
    const menu = both.find(r => r.id === menuRecipeId);
    if (prep?.recipeType !== "prep") {
      res.status(400).json({ error: "Linked recipe must be a prep recipe" }); return;
    }
    // Allow null (unclassified legacy) so the migration path works, but reject explicit 'prep'.
    if (menu?.recipeType === "prep") {
      res.status(400).json({ error: "Only menu recipes can link prep components" }); return;
    }
    const [component] = await db.insert(recipeComponentsTable).values({
      menuRecipeId, prepRecipeId,
      quantity: String(quantity), unit: unit as string,
      yieldFactor: body["yieldFactor"] !== undefined ? String(body["yieldFactor"]) : "1",
    }).returning();
    const enriched = await computeRecipeComponents(menuRecipeId);
    const created = enriched.find(c => c.id === component!.id) ?? null;
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to add recipe component");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/recipes/:recipeId/components/:componentId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuRecipeId = parseInt(req.params["recipeId"] as string);
    const componentId = parseInt(req.params["componentId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    // Confirm the component + its menu recipe both belong to this venue.
    const [owned] = await db.select({ id: recipeComponentsTable.id })
      .from(recipeComponentsTable)
      .innerJoin(recipesTable, eq(recipeComponentsTable.menuRecipeId, recipesTable.id))
      .where(and(
        eq(recipeComponentsTable.id, componentId),
        eq(recipeComponentsTable.menuRecipeId, menuRecipeId),
        eq(recipesTable.venueId, venueId),
      ));
    if (!owned) { res.status(404).json({ error: "Component not found" }); return; }
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (body["quantity"] !== undefined) updates["quantity"] = String(body["quantity"]);
    if (body["unit"] !== undefined) updates["unit"] = body["unit"];
    if (body["yieldFactor"] !== undefined) updates["yieldFactor"] = String(body["yieldFactor"]);
    const [updated] = await db.update(recipeComponentsTable).set(updates)
      .where(eq(recipeComponentsTable.id, componentId))
      .returning();
    if (!updated) { res.status(404).json({ error: "Component not found" }); return; }
    const enriched = await computeRecipeComponents(menuRecipeId);
    const out = enriched.find(c => c.id === componentId) ?? null;
    res.json(out);
  } catch (err) {
    req.log.error({ err }, "Failed to update recipe component");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/recipes/:recipeId/components/:componentId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuRecipeId = parseInt(req.params["recipeId"] as string);
    const componentId = parseInt(req.params["componentId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [owned] = await db.select({ id: recipeComponentsTable.id })
      .from(recipeComponentsTable)
      .innerJoin(recipesTable, eq(recipeComponentsTable.menuRecipeId, recipesTable.id))
      .where(and(
        eq(recipeComponentsTable.id, componentId),
        eq(recipeComponentsTable.menuRecipeId, menuRecipeId),
        eq(recipesTable.venueId, venueId),
      ));
    if (!owned) { res.status(404).json({ error: "Component not found" }); return; }
    await db.delete(recipeComponentsTable)
      .where(eq(recipeComponentsTable.id, componentId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete recipe component");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ACTIVATE / DEACTIVATE ───────────────────────────────────────────────────

router.post("/venues/:venueId/recipes/:recipeId/activate", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [recipe] = await db.update(recipesTable)
      .set({ status: "active", updatedAt: new Date() })
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)))
      .returning();
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }
    const totalCost = await computeRecipeTotalCost(recipeId);
    res.json(parseRecipe(recipe, totalCost));
  } catch (err) {
    req.log.error({ err }, "Failed to activate recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/recipes/:recipeId/deactivate", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [recipe] = await db.update(recipesTable)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)))
      .returning();
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }
    const totalCost = await computeRecipeTotalCost(recipeId);
    res.json(parseRecipe(recipe, totalCost));
  } catch (err) {
    req.log.error({ err }, "Failed to deactivate recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── CLASSIFY (used by the one-time classification wizard) ────────────────────

router.post("/venues/:venueId/recipes/:recipeId/classify", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const recipeId = parseInt(req.params["recipeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const t = (req.body as Record<string, unknown>)["recipeType"];
    if (t !== "menu" && t !== "prep") {
      res.status(400).json({ error: "recipeType must be 'menu' or 'prep'" }); return;
    }
    const [recipe] = await db.update(recipesTable)
      .set({ recipeType: t, updatedAt: new Date() })
      .where(and(eq(recipesTable.id, recipeId), eq(recipesTable.venueId, venueId)))
      .returning();
    if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }
    const totalCost = await computeRecipeTotalCost(recipeId);
    res.json(parseRecipe(recipe, totalCost));
  } catch (err) {
    req.log.error({ err }, "Failed to classify recipe");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
