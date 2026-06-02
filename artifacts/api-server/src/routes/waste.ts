import { Router } from "express";
import { db } from "@workspace/db";
import { wasteLogsTable, inventoryItemsTable, prepTaskLibraryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";

const router = Router();

function parseWasteLog(w: typeof wasteLogsTable.$inferSelect) {
  return {
    id: w.id, venueId: w.venueId, inventoryItemId: w.inventoryItemId,
    itemName: w.itemName, quantity: parseFloat(w.quantity), unit: w.unit,
    costImpact: parseFloat(w.costImpact), reason: w.reason, notes: w.notes,
    loggedAt: w.loggedAt.toISOString(),
  };
}

router.get("/venues/:venueId/waste", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await db.select().from(wasteLogsTable).where(eq(wasteLogsTable.venueId, venueId));
    res.json(logs.filter((l) => l.loggedAt >= thirtyDaysAgo).map(parseWasteLog));
  } catch (err) {
    req.log.error({ err }, "Failed to list waste logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/waste", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { inventoryItemId, itemName, quantity, unit, costImpact, reason, notes } = req.body as Record<string, unknown>;
    if (!itemName || !quantity || !unit || !reason) {
      res.status(400).json({ error: "itemName, quantity, unit, and reason are required" }); return;
    }
    const [log] = await db.insert(wasteLogsTable).values({
      venueId, inventoryItemId: inventoryItemId ? Number(inventoryItemId) : null,
      itemName: itemName as string, quantity: String(quantity), unit: unit as string,
      costImpact: String(costImpact ?? 0), reason: reason as string,
      notes: notes as string | undefined,
    }).returning();

    // ─── Prep suggestion: check if projected stock drops below par ────────────
    let prepSuggestion: {
      itemName: string;
      libraryTaskId: number | null;
      libraryTaskTitle: string | null;
      currentStock: number;
      parLevel: number;
    } | null = null;

    if (inventoryItemId) {
      const invId = Number(inventoryItemId);
      const [item] = await db.select({
        name: inventoryItemsTable.name,
        currentStock: inventoryItemsTable.currentStock,
        parLevel: inventoryItemsTable.parLevel,
      }).from(inventoryItemsTable)
        .where(and(eq(inventoryItemsTable.id, invId), eq(inventoryItemsTable.venueId, venueId)));

      if (item) {
        const projectedStock = parseFloat(item.currentStock) - Number(quantity);
        const parLevelVal = parseFloat(item.parLevel);
        if (projectedStock < parLevelVal) {
          const [libraryTask] = await db.select({
            id: prepTaskLibraryTable.id,
            title: prepTaskLibraryTable.title,
          }).from(prepTaskLibraryTable)
            .where(and(
              eq(prepTaskLibraryTable.venueId, venueId),
              eq(prepTaskLibraryTable.inventoryItemId, invId),
              eq(prepTaskLibraryTable.status, "active"),
            ))
            .limit(1);
          prepSuggestion = {
            itemName: item.name,
            libraryTaskId: libraryTask?.id ?? null,
            libraryTaskTitle: libraryTask?.title ?? null,
            currentStock: projectedStock,
            parLevel: parLevelVal,
          };
        }
      }
    }

    res.status(201).json({ ...parseWasteLog(log), prepSuggestion });
  } catch (err) {
    req.log.error({ err }, "Failed to create waste log");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/waste/:logId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const logId = parseInt(req.params["logId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    await db.delete(wasteLogsTable).where(and(eq(wasteLogsTable.id, logId), eq(wasteLogsTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete waste log");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
