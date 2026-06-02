import { Router } from "express";
import { db } from "@workspace/db";
import {
  venuesTable, suppliersTable, inventoryItemsTable, recipesTable,
  wasteLogsTable, stocktakesTable, chemicalsTable,
} from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/venues/:venueId/setup-progress", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const venueId = parseInt(req.params["venueId"] as string);

    const [venue] = await db.select().from(venuesTable)
      .where(and(eq(venuesTable.id, venueId), eq(venuesTable.userId, userId)));

    if (!venue) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    // Query all counts in parallel
    const [
      [supplierCount],
      [inventoryCount],
      [recipeCount],
      [wasteCount],
      [stocktakeCount],
      [chemicalCount],
    ] = await Promise.all([
      db.select({ c: count() }).from(suppliersTable).where(eq(suppliersTable.venueId, venueId)),
      db.select({ c: count() }).from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId)),
      db.select({ c: count() }).from(recipesTable).where(eq(recipesTable.venueId, venueId)),
      db.select({ c: count() }).from(wasteLogsTable).where(eq(wasteLogsTable.venueId, venueId)),
      db.select({ c: count() }).from(stocktakesTable).where(eq(stocktakesTable.venueId, venueId)),
      db.select({ c: count() }).from(chemicalsTable).where(eq(chemicalsTable.venueId, venueId)),
    ]);

    const suppliers = Number(supplierCount?.c ?? 0);
    const inventory = Number(inventoryCount?.c ?? 0);
    const recipes = Number(recipeCount?.c ?? 0);
    const waste = Number(wasteCount?.c ?? 0);
    const stocktakes = Number(stocktakeCount?.c ?? 0);
    const chemicals = Number(chemicalCount?.c ?? 0);

    type Step = {
      id: string;
      label: string;
      description: string;
      completed: boolean;
      count?: number;
      target?: number;
      action: string;
      href: string;
      unlocks: string;
    };

    const steps: Step[] = [
      {
        id: "suppliers",
        label: "Add your key suppliers",
        description: "Who you order from and when.",
        completed: suppliers > 0,
        count: suppliers,
        target: 1,
        action: "Add a supplier",
        href: "/suppliers/new",
        unlocks: "Supplier cutoff countdowns on your dashboard",
      },
      {
        id: "inventory",
        label: "Add your core inventory",
        description: "Your top ingredients with par levels.",
        completed: inventory >= 5,
        count: inventory,
        target: 5,
        action: "Add inventory",
        href: "/inventory/new",
        unlocks: "Low stock alerts, par tracking, and stagnant stock detection",
      },
      {
        id: "recipes",
        label: "Build your first recipe",
        description: "Link ingredients to get live food cost tracking.",
        completed: recipes > 0,
        count: recipes,
        target: 1,
        action: "Add a recipe",
        href: "/recipes/new",
        unlocks: "Live food cost % and GP% on every dish",
      },
      {
        id: "prep_library",
        label: "Set up your prep board",
        description: "Add your daily prep tasks to the board.",
        completed: false, // checked via waste log as proxy for engagement
        count: waste,
        target: 1,
        action: "Open prep board",
        href: "/prep-board",
        unlocks: "Daily task assignment and team visibility",
      },
      {
        id: "first_waste",
        label: "Log your first waste",
        description: "Track what you're throwing away and why.",
        completed: waste > 0,
        count: waste,
        target: 1,
        action: "Log waste",
        href: "/waste",
        unlocks: "Daily waste cost totals and waste trend tracking",
      },
      {
        id: "stocktake",
        label: "Complete a stocktake",
        description: "Count your stock to unlock real cost data.",
        completed: stocktakes > 0,
        count: stocktakes,
        target: 1,
        action: "Run stocktake",
        href: "/stocktake",
        unlocks: "Stagnant stock detection and inventory value tracking",
      },
      {
        id: "compliance",
        label: "Set up compliance basics",
        description: "Add your chemicals and MSDS records.",
        completed: chemicals > 0,
        count: chemicals,
        target: 1,
        action: "Add chemicals",
        href: "/compliance",
        unlocks: "Compliance score, MSDS monitoring, and BLOCKED chemical enforcement",
      },
    ];

    const stepsComplete = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;
    const percentComplete = Math.round((stepsComplete / totalSteps) * 100);
    const allComplete = stepsComplete === totalSteps;
    const nextStep = steps.find(s => !s.completed);

    res.json({
      percentComplete,
      stepsComplete,
      totalSteps,
      allComplete,
      nextStep: nextStep ?? null,
      steps,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get setup progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
