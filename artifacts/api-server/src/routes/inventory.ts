import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryItemsTable, venuesTable, priceHistoryTable, recipesTable, inventoryLedgerEntriesTable } from "@workspace/db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { reconcileInventoryStock } from "../services/inventoryLedger";
import { markRecipeCostsUpdatedForInventoryItems } from "../utils/recipeCostFreshness";

const router = Router();

function computeStagnantDays(lastRestocked: Date | null): number {
  if (!lastRestocked) return 0;
  return Math.floor((Date.now() - new Date(lastRestocked).getTime()) / (1000 * 60 * 60 * 24));
}

// Categories where fresh stock will visibly spoil if it sits idle.
// Frozen / dry / canned / preserved items don't get auto-flagged as expiry risk —
// only an explicit expiresAt date will trigger that for them.
const HIGH_RISK_SPOILAGE_CATEGORIES = new Set(["Meat", "Seafood", "Dairy"]);
const HIGH_RISK_IDLE_DAYS = 5;
const STOCK_TYPES = new Set(["raw", "prep", "finished"]);

function normaliseStockType(value: unknown, productionRecipeId?: number | null): string {
  if (typeof value === "string" && STOCK_TYPES.has(value)) return value;
  return productionRecipeId ? "prep" : "raw";
}

function computeStatus(
  currentStock: string,
  parLevel: string,
  shelfLifeDays: number | null,
  stagnantDays: number,
  expiresAt: Date | null,
  category: string | null,
) {
  const stock = parseFloat(currentStock);
  const par = parseFloat(parLevel);
  if (stock === 0) return "critical";
  // Explicit expiry date wins for any category — if a chef logged a real
  // expiry, respect it regardless of food type.
  if (expiresAt) {
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 3) return "expiry_risk";
  }
  // Auto-flag expiry risk ONLY for high-spoilage categories (Meat / Seafood / Dairy)
  // once they've been sitting idle past either their shelf life threshold
  // or the universal idle-days floor. Avoids false positives on dry goods,
  // frozen stock, herbs & spices, oils, etc.
  if (category && HIGH_RISK_SPOILAGE_CATEGORIES.has(category)) {
    if (shelfLifeDays && stagnantDays >= shelfLifeDays * 0.8) return "expiry_risk";
    if (stagnantDays >= HIGH_RISK_IDLE_DAYS) return "expiry_risk";
  }
  // Only flag stagnant when a par level is set — avoids false positives on intentionally slow-moving items
  if (par > 0 && stagnantDays >= 7) return "stagnant";
  if (par > 0 && stock < par * 0.25) return "critical";
  if (par > 0 && stock < par * 0.5) return "low_stock";
  return "healthy";
}

function enrichItem(
  item: typeof inventoryItemsTable.$inferSelect,
  recipeNameMap: Map<number, string> = new Map()
) {
  const stagnantDays = computeStagnantDays(item.lastRestocked);
  const status = computeStatus(item.currentStock, item.parLevel, item.shelfLifeDays, stagnantDays, item.expiresAt ?? null, item.category ?? null);
  const isInHousePrepped = item.productionRecipeId !== null && item.productionRecipeId !== undefined;
  return {
    id: item.id,
    venueId: item.venueId,
    supplierId: item.supplierId,
    supplierName: null as string | null,
    name: item.name,
    unit: item.unit,
    currentStock: parseFloat(item.currentStock),
    averageCost: parseFloat(item.averageCost),
    parLevel: parseFloat(item.parLevel),
    shelfLifeDays: item.shelfLifeDays,
    expiresAt: item.expiresAt?.toISOString() ?? null,
    stagnantDays,
    status,
    productionRecipeId: item.productionRecipeId ?? null,
    productionRecipeName: item.productionRecipeId ? (recipeNameMap.get(item.productionRecipeId) ?? null) : null,
    isInHousePrepped,
    stockType: item.stockType,
    storageLocation: item.storageLocation ?? null,
    category: item.category ?? null,
    isActive: item.isActive,
    lastRestocked: item.lastRestocked?.toISOString() ?? null,
    archivedAt: item.archivedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/venues/:venueId/inventory", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const rawItems = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true)));
    const productionRecipeIds = [...new Set(rawItems.map(i => i.productionRecipeId).filter(Boolean))] as number[];
    const recipeNameMap = new Map<number, string>();
    if (productionRecipeIds.length > 0) {
      const recipes = await Promise.all(productionRecipeIds.map(id => db.select().from(recipesTable).where(eq(recipesTable.id, id)).then(r => r[0])));
      recipes.filter(Boolean).forEach(r => { if (r) recipeNameMap.set(r.id, r.name); });
    }
    res.json(rawItems.map(i => enrichItem(i, recipeNameMap)));
  } catch (err) {
    req.log.error({ err }, "Failed to list inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/inventory/archived", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const rawItems = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, false)));
    res.json(rawItems.map(i => enrichItem(i)));
  } catch (err) {
    req.log.error({ err }, "Failed to list archived inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/inventory", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { name, unit, currentStock, averageCost, parLevel, supplierId, shelfLifeDays, expiresAt, productionRecipeId, stockType, storageLocation, category } = req.body as Record<string, unknown>;
    if (!name || !unit) { res.status(400).json({ error: "name and unit are required" }); return; }
    const initialStock = Number(currentStock ?? 0);
    const unitCost = Number(averageCost ?? 0);
    const linkedProductionRecipeId = productionRecipeId ? Number(productionRecipeId) : null;
    const [raw] = await db
      .insert(inventoryItemsTable)
      .values({
        venueId,
        name: name as string,
        unit: unit as string,
        currentStock: "0",
        averageCost: String(unitCost),
        parLevel: String(parLevel ?? 0),
        supplierId: supplierId ? Number(supplierId) : null,
        shelfLifeDays: shelfLifeDays ? Number(shelfLifeDays) : null,
        expiresAt: expiresAt ? new Date(expiresAt as string) : null,
        productionRecipeId: linkedProductionRecipeId,
        stockType: normaliseStockType(stockType, linkedProductionRecipeId),
        storageLocation: storageLocation ? String(storageLocation) : null,
        category: category ? String(category) : null,
        lastRestocked: new Date(),
        createdBy: req.userId!,
      })
      .returning();
    if (!raw) { res.status(500).json({ error: "Internal server error" }); return; }

    if (initialStock > 0) {
      const movement = await reconcileInventoryStock({
        venueId,
        inventoryItemId: raw.id,
        actualStock: initialStock,
        unitCost,
        reason: "Initial inventory count",
        referenceType: "inventory_item",
        referenceId: raw.id,
        createdBy: req.userId!,
        expiresAt: expiresAt ? new Date(expiresAt as string) : null,
        metadata: { source: "inventory_create" },
      });
      res.status(201).json(enrichItem(movement.item));
      return;
    }

    res.status(201).json(enrichItem(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to create inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/inventory/alerts", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const rawItems = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId));
    const items = rawItems.map(i => enrichItem(i));
    res.json({
      critical: items.filter((i) => i.status === "critical"),
      lowStock: items.filter((i) => i.status === "low_stock"),
      stagnant: items.filter((i) => i.status === "stagnant"),
      expiryRisk: items.filter((i) => i.status === "expiry_risk"),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory alerts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/inventory/suggestions", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const rawItems = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId));
    const items = rawItems.map(i => enrichItem(i));
    const stagnantItems = items.filter((i) => i.status === "stagnant" || i.status === "expiry_risk");
    const suggestions = stagnantItems.map((item) => {
      const days = item.stagnantDays;
      let action: "run_special" | "reduce_prep" | "family_meal" | "freeze_preserve" | "discount" = "run_special";
      let suggestion = `${item.currentStock}${item.unit} ${item.name} stagnant for ${days} days — run as a special`;
      let urgency: "low" | "medium" | "high" | "critical" = "low";
      if (days >= 14) { urgency = "critical"; action = "freeze_preserve"; suggestion = `${item.name} has been sitting ${days} days — freeze or use in family meal today`; }
      else if (days >= 10) { urgency = "high"; action = "family_meal"; suggestion = `Use ${item.currentStock}${item.unit} ${item.name} in family meal — ${days} days stagnant`; }
      else if (days >= 7) { urgency = "medium"; action = "run_special"; suggestion = `Put ${item.name} on tonight's special — ${days} days without movement`; }
      else if (item.status === "expiry_risk") { urgency = "high"; action = "reduce_prep"; suggestion = `${item.name} approaching shelf life — cut prep order and use today`; }
      return { itemId: item.id, itemName: item.name, stagnantDays: days, currentStock: item.currentStock, unit: item.unit, suggestion, action, urgency };
    });
    res.json(suggestions);
  } catch (err) {
    req.log.error({ err }, "Failed to get suggestions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/inventory/suggest", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { name } = req.body as { name?: string };
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const validLocations = ["Cool Room", "Dry Store", "Freezer", "Service Fridge", "Dairy", "Meat", "Veg / Produce", "Fish", "Pastry", "Bakery"];
    const validCategories = ["Fruit & Veg", "Meat", "Seafood", "Dairy", "Dry Goods", "Herbs & Spices", "Oils & Condiments", "Beverages", "Bakery & Pastry", "Frozen", "Other"];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 200,
      messages: [{
        role: "user",
        content: `You are a professional kitchen inventory assistant. Given the ingredient name "${name}", return a JSON object with:
- storageLocation: the most appropriate storage location from this list: ${JSON.stringify(validLocations)}
- category: the most appropriate ingredient category from this list: ${JSON.stringify(validCategories)}

Return ONLY valid JSON: {"storageLocation": "...", "category": "..."}`,
      }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let suggestion: { storageLocation?: string; category?: string } = {};
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      suggestion = JSON.parse(cleaned) as { storageLocation?: string; category?: string };
    } catch { req.log.warn({ content }, "AI returned non-JSON for inventory suggest"); }

    res.json({
      storageLocation: validLocations.includes(suggestion.storageLocation ?? "") ? suggestion.storageLocation : null,
      category: validCategories.includes(suggestion.category ?? "") ? suggestion.category : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory AI suggestion");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/inventory/:itemId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [raw] = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)));
    if (!raw) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(enrichItem(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/inventory/:itemId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const updates: Record<string, unknown> = {};
    const { name, unit, currentStock, averageCost, parLevel, supplierId, shelfLifeDays, expiresAt, productionRecipeId, stockType, storageLocation, category } = req.body as Record<string, unknown>;
    if (name !== undefined) updates["name"] = name;
    if (unit !== undefined) updates["unit"] = unit;
    if (averageCost !== undefined) updates["averageCost"] = String(averageCost);
    if (parLevel !== undefined) updates["parLevel"] = String(parLevel);
    if (supplierId !== undefined) updates["supplierId"] = supplierId ? Number(supplierId) : null;
    if (shelfLifeDays !== undefined) updates["shelfLifeDays"] = shelfLifeDays ? Number(shelfLifeDays) : null;
    if (expiresAt !== undefined) updates["expiresAt"] = expiresAt ? new Date(expiresAt as string) : null;
    if (productionRecipeId !== undefined) updates["productionRecipeId"] = productionRecipeId ? Number(productionRecipeId) : null;
    if (stockType !== undefined) updates["stockType"] = normaliseStockType(stockType, productionRecipeId !== undefined ? (productionRecipeId ? Number(productionRecipeId) : null) : undefined);
    if (storageLocation !== undefined) updates["storageLocation"] = storageLocation ? String(storageLocation) : null;
    if (category !== undefined) updates["category"] = category ? String(category) : null;
    updates["updatedAt"] = new Date();
    const [raw] = await db
      .update(inventoryItemsTable)
      .set(updates)
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)))
      .returning();
    if (!raw) { res.status(404).json({ error: "Item not found" }); return; }
    if (currentStock !== undefined) {
      const movement = await reconcileInventoryStock({
        venueId,
        inventoryItemId: itemId,
        actualStock: Number(currentStock),
        unitCost: averageCost !== undefined ? Number(averageCost) : parseFloat(raw.averageCost),
        reason: "Manual stock correction",
        referenceType: "inventory_item",
        referenceId: itemId,
        createdBy: req.userId!,
        expiresAt: raw.expiresAt ?? null,
        metadata: { source: "inventory_update" },
      });
      if (averageCost !== undefined) {
        await markRecipeCostsUpdatedForInventoryItems(venueId, [itemId]);
      }
      res.json(enrichItem(movement.item));
      return;
    }
    if (averageCost !== undefined) {
      await markRecipeCostsUpdatedForInventoryItems(venueId, [itemId]);
    }
    res.json(enrichItem(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to update inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/inventory/:itemId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    await db
      .delete(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/inventory/inactive", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const rawItems = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(
        eq(inventoryItemsTable.venueId, venueId),
        eq(inventoryItemsTable.isActive, false),
        isNull(inventoryItemsTable.archivedAt)
      ));
    res.json(rawItems.map(i => enrichItem(i)));
  } catch (err) {
    req.log.error({ err }, "Failed to list inactive inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/inventory/:itemId/deactivate", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [raw] = await db
      .update(inventoryItemsTable)
      .set({ isActive: false, archivedAt: null, updatedAt: new Date() })
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)))
      .returning();
    if (!raw) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(enrichItem(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to deactivate inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/inventory/:itemId/reactivate", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [raw] = await db
      .update(inventoryItemsTable)
      .set({ isActive: true, archivedAt: null, updatedAt: new Date() })
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)))
      .returning();
    if (!raw) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(enrichItem(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to reactivate inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/inventory/:itemId/archive", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [raw] = await db
      .update(inventoryItemsTable)
      .set({ isActive: false, archivedAt: new Date(), archivedBy: req.userId!, updatedAt: new Date() })
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)))
      .returning();
    if (!raw) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(enrichItem(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to archive inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/inventory/:itemId/restore", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [raw] = await db
      .update(inventoryItemsTable)
      .set({ isActive: true, archivedAt: null, archivedBy: null, updatedAt: new Date() })
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)))
      .returning();
    if (!raw) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(enrichItem(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to restore inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/inventory/:itemId/price-history", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [item] = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)));
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    const history = await db
      .select()
      .from(priceHistoryTable)
      .where(eq(priceHistoryTable.inventoryItemId, itemId));
    res.json(
      history.map((h) => ({
        id: h.id,
        oldPrice: h.oldPrice ? parseFloat(h.oldPrice) : null,
        newPrice: parseFloat(h.newPrice),
        changePercent: h.changePercent ? parseFloat(h.changePercent) : null,
        recordedAt: h.recordedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get price history");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/inventory/:itemId/ledger", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const itemId = parseInt(req.params["itemId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [item] = await db
      .select()
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.id, itemId), eq(inventoryItemsTable.venueId, venueId)));
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }

    const entries = await db
      .select()
      .from(inventoryLedgerEntriesTable)
      .where(and(
        eq(inventoryLedgerEntriesTable.venueId, venueId),
        eq(inventoryLedgerEntriesTable.inventoryItemId, itemId),
      ))
      .orderBy(desc(inventoryLedgerEntriesTable.createdAt), desc(inventoryLedgerEntriesTable.id));

    res.json(entries.map((entry) => ({
      id: entry.id,
      venueId: entry.venueId,
      inventoryItemId: entry.inventoryItemId,
      layerId: entry.layerId ?? null,
      transactionType: entry.transactionType,
      quantityDelta: parseFloat(entry.quantityDelta),
      resultingStock: parseFloat(entry.resultingStock),
      unitCost: parseFloat(entry.unitCost),
      costImpact: parseFloat(entry.costImpact),
      reason: entry.reason,
      referenceType: entry.referenceType ?? null,
      referenceId: entry.referenceId ?? null,
      createdBy: entry.createdBy ?? null,
      createdAt: entry.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory ledger");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
