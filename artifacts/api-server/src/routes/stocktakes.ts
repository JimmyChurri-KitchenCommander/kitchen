import { Router } from "express";
import { db } from "@workspace/db";
import { stocktakesTable, stocktakeItemsTable, inventoryItemsTable, recipesTable } from "@workspace/db";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAdmin } from "../middlewares/venueAuth";

const router = Router();

function enrichStocktakeItem(
  item: typeof stocktakeItemsTable.$inferSelect,
  invItem: typeof inventoryItemsTable.$inferSelect | null = null,
  productionRecipeName: string | null = null
) {
  const expected = parseFloat(item.expectedStock);
  const actual = parseFloat(item.actualStock);
  const variance = parseFloat(item.variance);
  const unitCost = parseFloat(item.unitCost);
  return {
    id: item.id,
    stocktakeId: item.stocktakeId,
    inventoryItemId: item.inventoryItemId,
    itemName: item.itemName,
    unit: item.unit,
    expectedStock: expected,
    actualStock: actual,
    variance,
    unitCost,
    varianceValue: Math.round(variance * unitCost * 100) / 100,
    isInHousePrepped: !!(invItem?.productionRecipeId),
    productionRecipeName,
    storageLocation: invItem?.storageLocation ?? null,
  };
}

async function buildInvLookups(inventoryItemIds: number[]) {
  if (inventoryItemIds.length === 0) return { invById: new Map<number, typeof inventoryItemsTable.$inferSelect>(), recipeById: new Map<number, string>() };
  const invItems = await db.select().from(inventoryItemsTable).where(inArray(inventoryItemsTable.id, inventoryItemIds));
  const recipeIds = invItems.filter(i => i.productionRecipeId).map(i => i.productionRecipeId!);
  const recipeById = new Map<number, string>();
  if (recipeIds.length > 0) {
    const recipes = await db.select({ id: recipesTable.id, name: recipesTable.name }).from(recipesTable).where(inArray(recipesTable.id, recipeIds));
    for (const r of recipes) recipeById.set(r.id, r.name);
  }
  return {
    invById: new Map(invItems.map(i => [i.id, i])),
    recipeById,
  };
}

router.get("/venues/:venueId/stocktakes", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const stocktakes = await db
      .select()
      .from(stocktakesTable)
      .where(eq(stocktakesTable.venueId, venueId));

    const result = await Promise.all(
      stocktakes.map(async (st) => {
        const items = await db
          .select()
          .from(stocktakeItemsTable)
          .where(eq(stocktakeItemsTable.stocktakeId, st.id));
        const { invById, recipeById } = await buildInvLookups(items.map(i => i.inventoryItemId));
        const enriched = items.map(item => {
          const inv = invById.get(item.inventoryItemId) ?? null;
          const recipeName = inv?.productionRecipeId ? (recipeById.get(inv.productionRecipeId) ?? null) : null;
          return enrichStocktakeItem(item, inv, recipeName);
        });
        const totalVarianceValue = enriched.reduce((sum, i) => sum + i.varianceValue, 0);
        return {
          id: st.id,
          venueId: st.venueId,
          conductedAt: st.conductedAt.toISOString(),
          status: st.status,
          notes: st.notes ?? null,
          itemCount: items.length,
          totalVarianceValue: Math.round(totalVarianceValue * 100) / 100,
          createdAt: st.createdAt.toISOString(),
        };
      })
    );
    res.json(result.sort((a, b) => new Date(b.conductedAt).getTime() - new Date(a.conductedAt).getTime()));
  } catch (err) {
    req.log.error({ err }, "Failed to list stocktakes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/stocktakes", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { notes } = req.body as Record<string, unknown>;
    const [stocktake] = await db
      .insert(stocktakesTable)
      .values({ venueId, status: "draft", notes: notes ? String(notes) : null, createdBy: req.userId! })
      .returning();

    const inventoryItems = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.venueId, venueId), isNull(inventoryItemsTable.archivedAt)));

    if (inventoryItems.length > 0) {
      await db.insert(stocktakeItemsTable).values(
        inventoryItems.map((inv) => ({
          stocktakeId: stocktake!.id,
          inventoryItemId: inv.id,
          itemName: inv.name,
          unit: inv.unit,
          expectedStock: inv.currentStock,
          actualStock: inv.currentStock,
          variance: "0",
          unitCost: inv.averageCost,
        }))
      );
    }

    const items = await db
      .select()
      .from(stocktakeItemsTable)
      .where(eq(stocktakeItemsTable.stocktakeId, stocktake!.id));

    const { invById, recipeById } = await buildInvLookups(items.map(i => i.inventoryItemId));

    res.status(201).json({
      id: stocktake!.id,
      venueId: stocktake!.venueId,
      conductedAt: stocktake!.conductedAt.toISOString(),
      status: stocktake!.status,
      notes: stocktake!.notes ?? null,
      totalVarianceValue: 0,
      createdAt: stocktake!.createdAt.toISOString(),
      items: items.map(item => {
        const inv = invById.get(item.inventoryItemId) ?? null;
        const recipeName = inv?.productionRecipeId ? (recipeById.get(inv.productionRecipeId) ?? null) : null;
        return enrichStocktakeItem(item, inv, recipeName);
      }),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create stocktake");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/stocktakes/:stocktakeId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const stocktakeId = parseInt(req.params["stocktakeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [stocktake] = await db
      .select()
      .from(stocktakesTable)
      .where(and(eq(stocktakesTable.id, stocktakeId), eq(stocktakesTable.venueId, venueId)));
    if (!stocktake) { res.status(404).json({ error: "Stocktake not found" }); return; }

    const items = await db
      .select()
      .from(stocktakeItemsTable)
      .where(eq(stocktakeItemsTable.stocktakeId, stocktakeId));

    const { invById, recipeById } = await buildInvLookups(items.map(i => i.inventoryItemId));
    const enriched = items.map(item => {
      const inv = invById.get(item.inventoryItemId) ?? null;
      const recipeName = inv?.productionRecipeId ? (recipeById.get(inv.productionRecipeId) ?? null) : null;
      return enrichStocktakeItem(item, inv, recipeName);
    });
    const totalVarianceValue = enriched.reduce((sum, i) => sum + i.varianceValue, 0);

    res.json({
      id: stocktake.id,
      venueId: stocktake.venueId,
      conductedAt: stocktake.conductedAt.toISOString(),
      status: stocktake.status,
      notes: stocktake.notes ?? null,
      totalVarianceValue: Math.round(totalVarianceValue * 100) / 100,
      createdAt: stocktake.createdAt.toISOString(),
      items: enriched,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stocktake");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/stocktakes/:stocktakeId/submit", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const stocktakeId = parseInt(req.params["stocktakeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [stocktake] = await db
      .select()
      .from(stocktakesTable)
      .where(and(eq(stocktakesTable.id, stocktakeId), eq(stocktakesTable.venueId, venueId)));
    if (!stocktake) { res.status(404).json({ error: "Stocktake not found" }); return; }
    if (stocktake.status === "submitted") { res.status(400).json({ error: "Already submitted" }); return; }

    const { notes, items } = req.body as { notes?: string; items: Array<{ id: number; actualStock: number }> };

    for (const row of items) {
      const [existing] = await db
        .select()
        .from(stocktakeItemsTable)
        .where(and(eq(stocktakeItemsTable.id, row.id), eq(stocktakeItemsTable.stocktakeId, stocktakeId)));
      if (!existing) continue;
      const variance = row.actualStock - parseFloat(existing.expectedStock);
      await db
        .update(stocktakeItemsTable)
        .set({ actualStock: String(row.actualStock), variance: String(variance) })
        .where(eq(stocktakeItemsTable.id, row.id));
      await db
        .update(inventoryItemsTable)
        .set({ currentStock: String(row.actualStock), lastRestocked: new Date(), updatedAt: new Date() })
        .where(eq(inventoryItemsTable.id, existing.inventoryItemId));
    }

    const [updated] = await db
      .update(stocktakesTable)
      .set({ status: "submitted", notes: notes ?? stocktake.notes, conductedAt: new Date(), completedBy: req.userId! })
      .where(eq(stocktakesTable.id, stocktakeId))
      .returning();

    const finalItems = await db.select().from(stocktakeItemsTable).where(eq(stocktakeItemsTable.stocktakeId, stocktakeId));
    const { invById, recipeById } = await buildInvLookups(finalItems.map(i => i.inventoryItemId));
    const enriched = finalItems.map(item => {
      const inv = invById.get(item.inventoryItemId) ?? null;
      const recipeName = inv?.productionRecipeId ? (recipeById.get(inv.productionRecipeId) ?? null) : null;
      return enrichStocktakeItem(item, inv, recipeName);
    });
    const totalVarianceValue = enriched.reduce((sum, i) => sum + i.varianceValue, 0);

    res.json({
      id: updated!.id,
      venueId: updated!.venueId,
      conductedAt: updated!.conductedAt.toISOString(),
      status: updated!.status,
      notes: updated!.notes ?? null,
      totalVarianceValue: Math.round(totalVarianceValue * 100) / 100,
      createdAt: updated!.createdAt.toISOString(),
      items: enriched,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit stocktake");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/stocktakes/:stocktakeId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const stocktakeId = parseInt(req.params["stocktakeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [stocktake] = await db.select().from(stocktakesTable)
      .where(and(eq(stocktakesTable.id, stocktakeId), eq(stocktakesTable.venueId, venueId)));
    if (!stocktake) { res.status(404).json({ error: "Stocktake not found" }); return; }
    await db.delete(stocktakeItemsTable).where(eq(stocktakeItemsTable.stocktakeId, stocktakeId));
    await db.delete(stocktakesTable).where(eq(stocktakesTable.id, stocktakeId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete stocktake");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Save section counts (cycle count — no submission) ─────────────────────────
// Saves actualStock for items in one named section without locking the stocktake.
// Lets teams count section-by-section and submit when all sections are done.
router.patch("/venues/:venueId/stocktakes/:stocktakeId/items/section", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const stocktakeId = parseInt(req.params["stocktakeId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [stocktake] = await db
      .select()
      .from(stocktakesTable)
      .where(and(eq(stocktakesTable.id, stocktakeId), eq(stocktakesTable.venueId, venueId)));
    if (!stocktake) { res.status(404).json({ error: "Stocktake not found" }); return; }
    if (stocktake.status === "submitted") { res.status(400).json({ error: "Stocktake already submitted" }); return; }

    const { section, items } = req.body as {
      section: string;
      items: Array<{ id: number; actualStock: number }>;
    };
    if (!section || !Array.isArray(items)) {
      res.status(400).json({ error: "section and items are required" }); return;
    }

    let saved = 0;
    for (const row of items) {
      const [existing] = await db
        .select()
        .from(stocktakeItemsTable)
        .where(and(eq(stocktakeItemsTable.id, row.id), eq(stocktakeItemsTable.stocktakeId, stocktakeId)));
      if (!existing) continue;
      const variance = row.actualStock - parseFloat(existing.expectedStock);
      await db
        .update(stocktakeItemsTable)
        .set({ actualStock: String(row.actualStock), variance: String(variance), isCounted: true })
        .where(eq(stocktakeItemsTable.id, row.id));
      saved++;
    }

    res.json({ section, itemsSaved: saved });
  } catch (err) {
    req.log.error({ err }, "Failed to save stocktake section");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
