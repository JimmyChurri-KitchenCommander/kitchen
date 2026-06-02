import { Router } from "express";
import { db } from "@workspace/db";
import {
  recipesTable, suppliersTable, invoicesTable, inventoryItemsTable, stocktakesTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAnyRelation } from "../middlewares/venueAuth";

const router = Router();

const RECIPE_REVIEW_STALE_DAYS = 60;
const STOCKTAKE_FRESH_DAYS = 14;
const STOCKTAKE_STALE_DAYS = 30;
const PAR_DRIFT_LOW_RATIO = 0.5;   // current < 50% of par → drift
const PAR_DRIFT_HIGH_RATIO = 2.0;  // current > 200% of par → drift

type ConfidenceLevel = "strong" | "fair" | "weak";

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

router.get("/venues/:venueId/food-cost-confidence", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAnyRelation(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const [recipes, suppliers, invoices, inventory, stocktakes] = await Promise.all([
      db.select().from(recipesTable)
        .where(and(eq(recipesTable.venueId, venueId), eq(recipesTable.status, "active"))),
      db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
      db.select().from(invoicesTable).where(eq(invoicesTable.venueId, venueId)),
      db.select().from(inventoryItemsTable)
        .where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true))),
      db.select().from(stocktakesTable)
        .where(and(eq(stocktakesTable.venueId, venueId), eq(stocktakesTable.status, "submitted")))
        .orderBy(desc(stocktakesTable.conductedAt))
        .limit(1),
    ]);

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // ── Factor 1: stocktake recency ──
    const lastStocktake = stocktakes[0];
    const daysSinceLastStocktake = lastStocktake
      ? Math.floor((now - lastStocktake.conductedAt.getTime()) / oneDayMs)
      : null;
    let stocktakeScore = 0;
    let stocktakeMessage = "No completed stocktake yet — confidence depends on counts.";
    if (daysSinceLastStocktake !== null) {
      if (daysSinceLastStocktake <= STOCKTAKE_FRESH_DAYS) {
        stocktakeScore = 100;
        stocktakeMessage = `Last stocktake ${daysSinceLastStocktake} day${daysSinceLastStocktake === 1 ? "" : "s"} ago — solid count`;
      } else if (daysSinceLastStocktake <= STOCKTAKE_STALE_DAYS) {
        const t = (daysSinceLastStocktake - STOCKTAKE_FRESH_DAYS) / (STOCKTAKE_STALE_DAYS - STOCKTAKE_FRESH_DAYS);
        stocktakeScore = clampScore(100 - t * 60);
        stocktakeMessage = `Last stocktake ${daysSinceLastStocktake} days ago — getting stale`;
      } else {
        stocktakeScore = 0;
        stocktakeMessage = `Last stocktake ${daysSinceLastStocktake} days ago — counts may not reflect reality`;
      }
    }

    // ── Factor 2: recipe review freshness ──
    let staleRecipes = 0;
    for (const r of recipes) {
      if (!r.lastReviewedAt) { staleRecipes++; continue; }
      const days = Math.floor((now - r.lastReviewedAt.getTime()) / oneDayMs);
      if (days > RECIPE_REVIEW_STALE_DAYS) staleRecipes++;
    }
    const recipeScore = recipes.length === 0
      ? 100
      : clampScore(((recipes.length - staleRecipes) / recipes.length) * 100);
    const recipeMessage = recipes.length === 0
      ? "No active recipes to review."
      : staleRecipes === 0
        ? "All active recipes reviewed within the last 60 days"
        : `${staleRecipes} of ${recipes.length} active recipes haven't been reviewed in 60+ days`;

    // ── Factor 3: invoice consistency ──
    // Build a map of supplierId → latest invoice date.
    const latestBySupplier = new Map<number, Date>();
    for (const inv of invoices) {
      if (!inv.supplierId) continue;
      const d = new Date(inv.invoiceDate + "T00:00:00Z");
      const prev = latestBySupplier.get(inv.supplierId);
      if (!prev || d > prev) latestBySupplier.set(inv.supplierId, d);
    }

    const tracked = suppliers.filter((s) => s.expectedInvoiceFrequencyDays && s.expectedInvoiceFrequencyDays > 0);
    let suppliersWithGap = 0;
    for (const s of tracked) {
      const latest = latestBySupplier.get(s.id);
      if (!latest) { suppliersWithGap++; continue; }
      const days = Math.floor((now - latest.getTime()) / oneDayMs);
      // Gap = current days > expected * 1.5
      if (days > (s.expectedInvoiceFrequencyDays as number) * 1.5) suppliersWithGap++;
    }
    const invoiceScore = tracked.length === 0
      ? 100
      : clampScore(((tracked.length - suppliersWithGap) / tracked.length) * 100);
    const invoiceMessage = tracked.length === 0
      ? "Set invoice frequency on suppliers to track gaps."
      : suppliersWithGap === 0
        ? "All tracked suppliers are within their expected invoice cadence"
        : `${suppliersWithGap} supplier${suppliersWithGap === 1 ? "" : "s"} overdue — silent pricing drift risk`;

    // ── Factor 4: par integrity ──
    let parDriftItems = 0;
    const itemsWithPar = inventory.filter((i) => parseFloat(i.parLevel ?? "0") > 0);
    for (const i of itemsWithPar) {
      const par = parseFloat(i.parLevel);
      const current = parseFloat(i.currentStock);
      if (current < par * PAR_DRIFT_LOW_RATIO || current > par * PAR_DRIFT_HIGH_RATIO) {
        parDriftItems++;
      }
    }
    const parScore = itemsWithPar.length === 0
      ? 100
      : clampScore(((itemsWithPar.length - parDriftItems) / itemsWithPar.length) * 100);
    const parMessage = itemsWithPar.length === 0
      ? "Set par levels on inventory items to track drift."
      : parDriftItems === 0
        ? "Stock levels align with par across the board"
        : `${parDriftItems} item${parDriftItems === 1 ? "" : "s"} repeatedly outside par — levels may need updating`;

    // ── Weighted overall ──
    const factors = [
      { key: "stocktake_recency", label: "Stocktake recency", score: stocktakeScore, weight: 25, message: stocktakeMessage },
      { key: "recipe_review_freshness", label: "Recipe review freshness", score: recipeScore, weight: 25, message: recipeMessage },
      { key: "invoice_consistency", label: "Invoice consistency", score: invoiceScore, weight: 25, message: invoiceMessage },
      { key: "par_integrity", label: "Par level integrity", score: parScore, weight: 25, message: parMessage },
    ];
    const score = clampScore(factors.reduce((acc, f) => acc + (f.score * f.weight) / 100, 0));
    const level: ConfidenceLevel = score >= 80 ? "strong" : score >= 60 ? "fair" : "weak";

    res.json({
      score, level, factors,
      signals: { staleRecipes, suppliersWithGap, parDriftItems, daysSinceLastStocktake },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to compute food cost confidence");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
