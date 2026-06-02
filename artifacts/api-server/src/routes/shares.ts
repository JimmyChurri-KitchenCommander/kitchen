import { Router } from "express";
import { db } from "@workspace/db";
import {
  sharesTable,
  shareGroupsTable,
  shareGroupItemsTable,
  inventoryItemsTable,
  recipesTable,
  venuesTable,
  recipeIngredientsTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function assertVenueOwner(venueId: number, userId: string) {
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  return venue && venue.userId === userId;
}

// ─── SHARE GROUPS ──────────────────────────────────────────────────────────

router.get("/venues/:venueId/share-groups", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    const groups = await db.select().from(shareGroupsTable).where(eq(shareGroupsTable.venueId, venueId));
    const enriched = await Promise.all(groups.map(async (g) => {
      const items = await db.select().from(shareGroupItemsTable).where(eq(shareGroupItemsTable.groupId, g.id));
      return { ...g, createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt?.toISOString() ?? null, itemCount: items.length, items };
    }));
    res.json(enriched);
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.post("/venues/:venueId/share-groups", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    const { name, description, type = "mixed" } = req.body as { name: string; description?: string; type?: string };
    if (!name) { res.status(400).json({ error: "Name is required" }); return; }

    const [group] = await db.insert(shareGroupsTable).values({ venueId, name, description, type }).returning();
    res.status(201).json({ ...group!, createdAt: group!.createdAt.toISOString(), updatedAt: null, itemCount: 0, items: [] });
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.patch("/venues/:venueId/share-groups/:groupId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const groupId = parseInt(req.params["groupId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    const { name, description, type } = req.body as { name?: string; description?: string; type?: string };
    const [group] = await db.update(shareGroupsTable)
      .set({ ...(name && { name }), ...(description !== undefined && { description }), ...(type && { type }), updatedAt: new Date() })
      .where(and(eq(shareGroupsTable.id, groupId), eq(shareGroupsTable.venueId, venueId)))
      .returning();

    if (!group) { res.status(404).json({ error: "Not found" }); return; }
    const items = await db.select().from(shareGroupItemsTable).where(eq(shareGroupItemsTable.groupId, group.id));
    res.json({ ...group, createdAt: group.createdAt.toISOString(), updatedAt: group.updatedAt?.toISOString() ?? null, itemCount: items.length, items });
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.delete("/venues/:venueId/share-groups/:groupId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const groupId = parseInt(req.params["groupId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.delete(shareGroupsTable).where(and(eq(shareGroupsTable.id, groupId), eq(shareGroupsTable.venueId, venueId)));
    res.status(204).send(); return;
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.post("/venues/:venueId/share-groups/:groupId/items", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const groupId = parseInt(req.params["groupId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    const [group] = await db.select().from(shareGroupsTable).where(and(eq(shareGroupsTable.id, groupId), eq(shareGroupsTable.venueId, venueId)));
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const { itemType, itemId } = req.body as { itemType: "inventory_item" | "recipe"; itemId: number };
    if (!itemType || !itemId) { res.status(400).json({ error: "itemType and itemId are required" }); return; }

    const [item] = await db.insert(shareGroupItemsTable).values({
      groupId,
      itemType,
      inventoryItemId: itemType === "inventory_item" ? itemId : null,
      recipeId: itemType === "recipe" ? itemId : null,
    }).returning();
    res.status(201).json({ ...item!, addedAt: item!.addedAt.toISOString() });
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.delete("/venues/:venueId/share-groups/:groupId/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const groupId = parseInt(req.params["groupId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.delete(shareGroupItemsTable).where(and(eq(shareGroupItemsTable.id, itemId), eq(shareGroupItemsTable.groupId, groupId)));
    res.status(204).send(); return;
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

// ─── SHARES ────────────────────────────────────────────────────────────────

router.get("/venues/:venueId/shares", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    const shares = await db.select().from(sharesTable).where(eq(sharesTable.venueId, venueId));
    res.json(shares.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt?.toISOString() ?? null,
    })));
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.post("/venues/:venueId/shares", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    const { shareType, inventoryItemId, recipeId, shareGroupId, label, allowCopy = true, expiresAt } = req.body as {
      shareType: string; inventoryItemId?: number; recipeId?: number; shareGroupId?: number;
      label?: string; allowCopy?: boolean; expiresAt?: string;
    };
    if (!shareType) { res.status(400).json({ error: "shareType is required" }); return; }

    const [share] = await db.insert(sharesTable).values({
      venueId, createdByUserId: req.userId!, shareType,
      inventoryItemId: inventoryItemId ?? null, recipeId: recipeId ?? null,
      shareGroupId: shareGroupId ?? null, label: label ?? null,
      allowCopy, expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();

    res.status(201).json({ ...share!, createdAt: share!.createdAt.toISOString(), expiresAt: share!.expiresAt?.toISOString() ?? null });
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.delete("/venues/:venueId/shares/:shareId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const shareId = parseInt(req.params["shareId"] as string);
    if (!(await assertVenueOwner(venueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.delete(sharesTable).where(and(eq(sharesTable.id, shareId), eq(sharesTable.venueId, venueId)));
    res.status(204).send(); return;
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

// ─── PUBLIC SHARED VIEW (no auth) ──────────────────────────────────────────

router.get("/shared/:token", async (req, res): Promise<void> => {
  try {
    const token = req.params["token"] as string;
    const [share] = await db.select().from(sharesTable).where(eq(sharesTable.shareToken, token));
    if (!share) { res.status(404).json({ error: "Share not found" }); return; }
    if (share.expiresAt && share.expiresAt < new Date()) { res.status(410).json({ error: "Share has expired" }); return; }

    await db.update(sharesTable).set({ accessCount: share.accessCount + 1 }).where(eq(sharesTable.id, share.id));

    let payload: object = {};

    if (share.shareType === "inventory_item" && share.inventoryItemId) {
      const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, share.inventoryItemId));
      payload = { type: "inventory_item", item: item ? { ...item, createdAt: item.createdAt?.toISOString() ?? null, lastRestocked: item.lastRestocked?.toISOString() ?? null } : null };
    } else if (share.shareType === "recipe" && share.recipeId) {
      const [recipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, share.recipeId));
      const ingredients = recipe ? await db
        .select({ id: recipeIngredientsTable.id, recipeId: recipeIngredientsTable.recipeId, inventoryItemId: recipeIngredientsTable.inventoryItemId, quantity: recipeIngredientsTable.quantity, unit: recipeIngredientsTable.unit, itemName: inventoryItemsTable.name })
        .from(recipeIngredientsTable)
        .leftJoin(inventoryItemsTable, eq(recipeIngredientsTable.inventoryItemId, inventoryItemsTable.id))
        .where(eq(recipeIngredientsTable.recipeId, recipe.id)) : [];
      payload = { type: "recipe", recipe: recipe ? { ...recipe, createdAt: recipe.createdAt?.toISOString() ?? null } : null, ingredients };
    } else if (share.shareType === "group" && share.shareGroupId) {
      const [group] = await db.select().from(shareGroupsTable).where(eq(shareGroupsTable.id, share.shareGroupId));
      const groupItems = await db.select().from(shareGroupItemsTable).where(eq(shareGroupItemsTable.groupId, share.shareGroupId));

      const invIds = groupItems.filter(i => i.itemType === "inventory_item" && i.inventoryItemId).map(i => i.inventoryItemId!);
      const recipeIds = groupItems.filter(i => i.itemType === "recipe" && i.recipeId).map(i => i.recipeId!);

      const invItems = invIds.length ? await db.select().from(inventoryItemsTable).where(inArray(inventoryItemsTable.id, invIds)) : [];
      const recipes = recipeIds.length ? await db.select().from(recipesTable).where(inArray(recipesTable.id, recipeIds)) : [];

      payload = {
        type: "group",
        group: group ? { ...group, createdAt: group.createdAt.toISOString() } : null,
        inventoryItems: invItems.map(i => ({ ...i, createdAt: i.createdAt?.toISOString() ?? null, lastRestocked: i.lastRestocked?.toISOString() ?? null })),
        recipes: recipes.map(r => ({ ...r, createdAt: r.createdAt?.toISOString() ?? null })),
      };
    }

    res.json({ share: { ...share, createdAt: share.createdAt.toISOString(), expiresAt: share.expiresAt?.toISOString() ?? null }, ...payload });
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

// ─── COPY TO MY VENUE (requires auth) ──────────────────────────────────────

router.post("/shared/:token/copy", requireAuth, async (req, res): Promise<void> => {
  try {
    const token = req.params["token"] as string;
    const { targetVenueId } = req.body as { targetVenueId: number };

    const [share] = await db.select().from(sharesTable).where(eq(sharesTable.shareToken, token));
    if (!share) { res.status(404).json({ error: "Share not found" }); return; }
    if (!share.allowCopy) { res.status(403).json({ error: "Copy not permitted for this share" }); return; }
    if (share.expiresAt && share.expiresAt < new Date()) { res.status(410).json({ error: "Share has expired" }); return; }
    if (!(await assertVenueOwner(targetVenueId, req.userId!))) { res.status(403).json({ error: "Forbidden" }); return; }

    const copied: { inventoryItems: number[]; recipes: number[] } = { inventoryItems: [], recipes: [] };

    const copyInventoryItem = async (itemId: number) => {
      const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, itemId));
      if (!item) return null;
      const [newItem] = await db.insert(inventoryItemsTable).values({
        venueId: targetVenueId,
        name: item.name,
        unit: item.unit,
        currentStock: "0",
        parLevel: item.parLevel,
        averageCost: item.averageCost,
        supplierId: null,
        shelfLifeDays: item.shelfLifeDays,
      }).returning();
      return newItem?.id ?? null;
    };

    const copyRecipe = async (recipeId: number) => {
      const [recipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, recipeId));
      if (!recipe) return null;
      const [newRecipe] = await db.insert(recipesTable).values({
        venueId: targetVenueId,
        name: recipe.name,
        category: recipe.category,
        description: recipe.description,
        method: recipe.method,
        yield: recipe.yield,
        yieldUnit: recipe.yieldUnit,
        portionSize: recipe.portionSize,
        portionUnit: recipe.portionUnit,
        sellingPrice: recipe.sellingPrice,
        platingNotes: recipe.platingNotes,
        imageUrl: recipe.imageUrl,
      }).returning();
      return newRecipe?.id ?? null;
    };

    if (share.shareType === "inventory_item" && share.inventoryItemId) {
      const id = await copyInventoryItem(share.inventoryItemId);
      if (id) copied.inventoryItems.push(id);
    } else if (share.shareType === "recipe" && share.recipeId) {
      const id = await copyRecipe(share.recipeId);
      if (id) copied.recipes.push(id);
    } else if (share.shareType === "group" && share.shareGroupId) {
      const groupItems = await db.select().from(shareGroupItemsTable).where(eq(shareGroupItemsTable.groupId, share.shareGroupId));
      for (const gi of groupItems) {
        if (gi.itemType === "inventory_item" && gi.inventoryItemId) {
          const id = await copyInventoryItem(gi.inventoryItemId);
          if (id) copied.inventoryItems.push(id);
        } else if (gi.itemType === "recipe" && gi.recipeId) {
          const id = await copyRecipe(gi.recipeId);
          if (id) copied.recipes.push(id);
        }
      }
    }

    res.json({ success: true, copied });
  } catch (e) {
    req.log.error(e); res.status(500).json({ error: "Internal server error" }); return;
  }
});

export default router;
