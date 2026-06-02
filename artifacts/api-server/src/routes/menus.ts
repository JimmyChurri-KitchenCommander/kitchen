import { Router } from "express";
import { db } from "@workspace/db";
import { menusTable, menuItemsTable, recipesTable, recipeIngredientsTable, inventoryItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";
import { computeRecipeTotalCost } from "../utils/recipeCost";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

async function enrichMenuItem(item: typeof menuItemsTable.$inferSelect) {
  const [recipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, item.recipeId));
  if (!recipe) return null;
  const totalRecipeCost = await computeRecipeTotalCost(recipe.id);
  const recipeYield = parseFloat(recipe.yield);
  const portionSize = parseFloat(recipe.portionSize);
  const portionCost = recipeYield > 0 ? (totalRecipeCost / recipeYield) * portionSize : totalRecipeCost;
  const sellingPrice = item.sellingPrice ? parseFloat(item.sellingPrice) : recipe.sellingPrice ? parseFloat(recipe.sellingPrice) : null;
  const foodCostPercent = sellingPrice && sellingPrice > 0 ? (portionCost / sellingPrice) * 100 : null;
  const gpPercent = sellingPrice ? ((sellingPrice - portionCost) / sellingPrice) * 100 : null;

  const isSpecial = item.category === "special";

  // Ingredient availability check — always compute so UI can show warnings
  const rawIngredients = await db
    .select({ ingr: recipeIngredientsTable, inv: inventoryItemsTable })
    .from(recipeIngredientsTable)
    .leftJoin(inventoryItemsTable, eq(recipeIngredientsTable.inventoryItemId, inventoryItemsTable.id))
    .where(eq(recipeIngredientsTable.recipeId, recipe.id));

  const ingredientWarnings = rawIngredients
    .filter(r => !r.inv || parseFloat(r.inv.currentStock) <= 0)
    .map(r => ({
      itemName: r.inv?.name ?? "Unknown item",
      inStock: false,
      currentStock: r.inv ? parseFloat(r.inv.currentStock) : 0,
      unit: r.inv?.unit ?? "",
    }));

  return {
    id: item.id, menuId: item.menuId, recipeId: item.recipeId,
    recipeName: recipe.name, recipeCategory: recipe.category ?? null,
    portionCost: Math.round(portionCost * 10000) / 10000,
    totalRecipeCost: Math.round(totalRecipeCost * 10000) / 10000,
    sellingPrice,
    foodCostPercent: foodCostPercent !== null ? Math.round(foodCostPercent * 100) / 100 : null,
    gpPercent: gpPercent !== null ? Math.round(gpPercent * 100) / 100 : null,
    category: item.category ?? null,
    notes: item.notes ?? null,
    sortOrder: item.sortOrder,
    isSpecial,
    parentRecipeId: recipe.parentRecipeId ?? null,
    adaptationNotes: recipe.adaptationNotes ?? null,
    ingredientWarnings: ingredientWarnings.length > 0 ? ingredientWarnings : null,
  };
}

function parseMenu(m: typeof menusTable.$inferSelect) {
  return {
    id: m.id, venueId: m.venueId, name: m.name,
    description: m.description ?? null, isActive: m.isActive,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/venues/:venueId/menus", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const menus = await db.select().from(menusTable).where(eq(menusTable.venueId, venueId));
    res.json(menus.map(parseMenu));
  } catch (err) {
    req.log.error({ err }, "Failed to list menus");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/menus", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { name, description, isActive } = req.body as Record<string, unknown>;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const [menu] = await db.insert(menusTable).values({
      venueId, name: name as string,
      description: description as string | undefined,
      isActive: isActive !== false,
      createdBy: req.userId!,
    }).returning();
    res.status(201).json(parseMenu(menu!));
  } catch (err) {
    req.log.error({ err }, "Failed to create menu");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/menus/:menuId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuId = parseInt(req.params["menuId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [menu] = await db.select().from(menusTable).where(and(eq(menusTable.id, menuId), eq(menusTable.venueId, venueId)));
    if (!menu) { res.status(404).json({ error: "Menu not found" }); return; }
    const rawItems = await db.select().from(menuItemsTable).where(eq(menuItemsTable.menuId, menuId));
    const items = (await Promise.all(rawItems.map(enrichMenuItem))).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof enrichMenuItem>>>[];
    const itemsWithPrice = items.filter(i => i.sellingPrice !== null);
    const avgFoodCostPercent = itemsWithPrice.length > 0
      ? itemsWithPrice.reduce((sum, i) => sum + (i.foodCostPercent ?? 0), 0) / itemsWithPrice.length : null;
    const avgGpPercent = itemsWithPrice.length > 0
      ? itemsWithPrice.reduce((sum, i) => sum + (i.gpPercent ?? 0), 0) / itemsWithPrice.length : null;
    const totalRevenuePotential = itemsWithPrice.reduce((sum, i) => sum + (i.sellingPrice ?? 0), 0);
    res.json({
      ...parseMenu(menu), items,
      avgFoodCostPercent: avgFoodCostPercent !== null ? Math.round(avgFoodCostPercent * 100) / 100 : null,
      avgGpPercent: avgGpPercent !== null ? Math.round(avgGpPercent * 100) / 100 : null,
      totalRevenuePotential,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get menu");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/menus/:menuId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuId = parseInt(req.params["menuId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body["name"] !== undefined) updates["name"] = body["name"];
    if (body["description"] !== undefined) updates["description"] = body["description"];
    if (body["isActive"] !== undefined) updates["isActive"] = body["isActive"];
    const [menu] = await db.update(menusTable).set(updates)
      .where(and(eq(menusTable.id, menuId), eq(menusTable.venueId, venueId))).returning();
    if (!menu) { res.status(404).json({ error: "Menu not found" }); return; }
    res.json(parseMenu(menu));
  } catch (err) {
    req.log.error({ err }, "Failed to update menu");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/menus/:menuId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuId = parseInt(req.params["menuId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    await db.delete(menusTable).where(and(eq(menusTable.id, menuId), eq(menusTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete menu");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/menus/:menuId/items", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuId = parseInt(req.params["menuId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { recipeId, sellingPrice, category, notes, sortOrder } = req.body as Record<string, unknown>;
    if (!recipeId) { res.status(400).json({ error: "recipeId is required" }); return; }
    const [item] = await db.insert(menuItemsTable).values({
      menuId, recipeId: Number(recipeId),
      sellingPrice: sellingPrice ? String(sellingPrice) : null,
      category: category as string | undefined,
      notes: notes as string | undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      createdBy: req.userId!,
    }).returning();
    const enriched = await enrichMenuItem(item!);
    if (!enriched) { res.status(500).json({ error: "Recipe not found" }); return; }
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to add menu item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Quick-add a special: creates a recipe AND adds it as a special to the menu
router.post("/venues/:venueId/menus/:menuId/items/quick-special", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const menuId = parseInt(req.params["menuId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const body = req.body as Record<string, unknown>;
    const { name, description, method, sellingPrice, ingredients } = body as {
      name: string;
      description?: string;
      method?: string;
      sellingPrice?: number;
      ingredients?: Array<{ inventoryItemId: number; quantity: number; unit: string; yieldFactor?: number }>;
    };
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const [recipe] = await db.insert(recipesTable).values({
      venueId,
      name,
      category: "Special",
      description,
      method,
      yield: "1",
      yieldUnit: "portion",
      portionSize: "1",
      portionUnit: "portion",
      sellingPrice: sellingPrice ? String(sellingPrice) : null,
    }).returning();

    if (!recipe) { res.status(500).json({ error: "Failed to create recipe" }); return; }

    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await db.insert(recipeIngredientsTable).values({
          recipeId: recipe.id,
          inventoryItemId: ing.inventoryItemId,
          quantity: String(ing.quantity),
          unit: ing.unit,
          yieldFactor: String(ing.yieldFactor ?? 1),
        });
      }
    }

    const [menuItem] = await db.insert(menuItemsTable).values({
      menuId,
      recipeId: recipe.id,
      sellingPrice: sellingPrice ? String(sellingPrice) : null,
      category: "special",
      sortOrder: 0,
    }).returning();

    const enriched = await enrichMenuItem(menuItem!);
    if (!enriched) { res.status(500).json({ error: "Failed to enrich menu item" }); return; }

    req.log.info({ venueId, menuId, recipeId: recipe.id }, "Quick special created");
    res.status(201).json({ recipe: { id: recipe.id, name: recipe.name }, menuItem: enriched });
  } catch (err) {
    req.log.error({ err }, "Failed to create quick special");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/menus/:menuId/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  try {
    const menuId = parseInt(req.params["menuId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (body["sellingPrice"] !== undefined) updates["sellingPrice"] = body["sellingPrice"] === null ? null : String(body["sellingPrice"]);
    if (body["category"] !== undefined) updates["category"] = body["category"];
    if (body["notes"] !== undefined) updates["notes"] = body["notes"];
    if (body["sortOrder"] !== undefined) updates["sortOrder"] = Number(body["sortOrder"]);
    const [item] = await db.update(menuItemsTable).set(updates)
      .where(and(eq(menuItemsTable.id, itemId), eq(menuItemsTable.menuId, menuId))).returning();
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    const enriched = await enrichMenuItem(item);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to update menu item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/menus/:menuId/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  try {
    const menuId = parseInt(req.params["menuId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    await db.delete(menuItemsTable).where(and(eq(menuItemsTable.id, itemId), eq(menuItemsTable.menuId, menuId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete menu item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── IMPORT MENU FROM PHOTO ───────────────────────────────────────────────────

router.post("/venues/:venueId/menus/import-photo", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };
    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" }); return;
    }

    const recipes = await db
      .select({ id: recipesTable.id, name: recipesTable.name, category: recipesTable.category })
      .from(recipesTable)
      .where(eq(recipesTable.venueId, venueId));

    const recipeList = recipes.length > 0
      ? recipes.map(r => `ID ${r.id}: ${r.name}${r.category ? ` (${r.category})` : ""}`).join("\n")
      : "No recipes in library yet.";

    const prompt = `You are a chef's assistant. Extract all dishes from this menu image.

Existing recipe library:
${recipeList}

Return valid JSON only — no markdown, no explanation:
{
  "menuName": "suggest a menu name based on the content",
  "items": [
    {
      "name": "dish name exactly as shown",
      "section": "one of: starter|main|dessert|side|special|other",
      "price": 18.50,
      "description": "brief description or null",
      "matchedRecipeId": 3
    }
  ]
}

For matchedRecipeId: pick the best matching recipe ID from the library above. Use null if no good match.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}` },
          },
          { type: "text", text: prompt },
        ],
      }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI" }); return;
    }

    const parsed = JSON.parse(content) as {
      menuName?: string;
      items?: Array<{
        name: string;
        section: string;
        price: number | null;
        description: string | null;
        matchedRecipeId: number | null;
      }>;
    };

    const items = (parsed.items ?? []).map(item => ({
      name: item.name,
      section: item.section ?? "other",
      price: typeof item.price === "number" ? item.price : null,
      description: item.description ?? null,
      matchedRecipeId: item.matchedRecipeId ?? null,
      matchedRecipeName: item.matchedRecipeId
        ? recipes.find(r => r.id === item.matchedRecipeId)?.name ?? null
        : null,
    }));

    req.log.info({ venueId, itemCount: items.length }, "Menu import photo processed");
    res.json({ menuName: parsed.menuName ?? "Imported Menu", items });
  } catch (err) {
    req.log.error({ err }, "Failed to import menu from photo");
    res.status(500).json({ error: "Failed to process menu image" });
  }
});

export default router;
