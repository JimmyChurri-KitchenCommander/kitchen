import { Router } from "express";
import { db } from "@workspace/db";
import {
  prepTasksTable,
  venueStaffTable,
  cleaningTasksTable,
  cleaningLogsTable,
  chemicalsTable,
  inventoryItemsTable,
  temperatureEquipmentTable,
  temperatureLogsTable,
  wasteLogsTable,
} from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { applyInventoryMovement } from "../services/inventoryLedger";

const router = Router();

function parseId(raw: string): number | null {
  const n = parseInt(raw);
  return isNaN(n) ? null : n;
}

// ── Bootstrap config — staff, chemicals, inventory, equipment ─────────────────
// Single call for the service mode UI to initialise
router.get("/venues/:venueId/service/config", async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const [staff, chemicals, inventory, equipment] = await Promise.all([
      db.select().from(venueStaffTable).where(eq(venueStaffTable.venueId, venueId)),
      db.select().from(chemicalsTable).where(
        and(eq(chemicalsTable.venueId, venueId), eq(chemicalsTable.isActive, true))
      ),
      db.select({
        id: inventoryItemsTable.id,
        name: inventoryItemsTable.name,
        unit: inventoryItemsTable.unit,
        parLevel: inventoryItemsTable.parLevel,
        currentStock: inventoryItemsTable.currentStock,
        averageCost: inventoryItemsTable.averageCost,
      }).from(inventoryItemsTable).where(eq(inventoryItemsTable.venueId, venueId)),
      db.select().from(temperatureEquipmentTable).where(eq(temperatureEquipmentTable.venueId, venueId)),
    ]);
    res.json({ staff, chemicals, inventory, equipment });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch service config");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Toggle prep task complete / undo ─────────────────────────────────────────
// No auth — relies on venue ID + task ID ownership check only
router.patch("/venues/:venueId/service/prep-tasks/:taskId/complete", async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const taskId = parseId(req.params["taskId"] as string);
  if (!venueId || !taskId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { completedBy, undo } = req.body as { completedBy?: string; undo?: boolean };
    const [existing] = await db.select({ id: prepTasksTable.id })
      .from(prepTasksTable)
      .where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)));
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    const [updated] = await db.update(prepTasksTable)
      .set({
        status: undo ? "todo" : "done",
        completedBy: undo ? null : (completedBy ?? null),
        completedAt: undo ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update prep task status");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Cleaning tasks (public, active only) ──────────────────────────────────────
router.get("/venues/:venueId/service/cleaning-tasks", async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const tasks = await db.select().from(cleaningTasksTable).where(
      and(eq(cleaningTasksTable.venueId, venueId), ne(cleaningTasksTable.isActive, false))
    );
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cleaning tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Complete a cleaning task (public) ─────────────────────────────────────────
router.post("/venues/:venueId/service/cleaning-tasks/:taskId/complete", async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const taskId = parseId(req.params["taskId"] as string);
  if (!venueId || !taskId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { completedBy, notes } = req.body as { completedBy?: string; notes?: string };
    if (!completedBy) { res.status(400).json({ error: "completedBy is required" }); return; }
    const now = new Date();
    const [log] = await db.insert(cleaningLogsTable).values({
      taskId, venueId, completedBy, notes, completedAt: now,
    }).returning();
    await db.update(cleaningTasksTable)
      .set({ lastCompletedAt: now, updatedAt: now })
      .where(and(eq(cleaningTasksTable.id, taskId), eq(cleaningTasksTable.venueId, venueId)));
    res.status(201).json(log);
  } catch (err) {
    req.log.error({ err }, "Failed to complete cleaning task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Quick temperature log (public) ────────────────────────────────────────────
router.post("/venues/:venueId/service/temperature-log", async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const { itemName, temp, equipmentId, checkedBy } = req.body as {
      itemName?: string; temp?: string; equipmentId?: number; checkedBy?: string;
    };
    if (!temp) { res.status(400).json({ error: "temp is required" }); return; }

    let status = "pass";
    if (equipmentId) {
      const [equip] = await db.select().from(temperatureEquipmentTable)
        .where(and(eq(temperatureEquipmentTable.id, equipmentId), eq(temperatureEquipmentTable.venueId, venueId)));
      if (equip) {
        const t = parseFloat(temp);
        if (equip.minTemp && t < parseFloat(equip.minTemp)) status = "fail";
        if (equip.maxTemp && t > parseFloat(equip.maxTemp)) status = "fail";
      }
    }

    const [log] = await db.insert(temperatureLogsTable).values({
      venueId,
      equipmentId: equipmentId ?? null,
      logType: "equipment_check",
      itemName: itemName ?? undefined,
      recordedTemp: temp,
      status,
      checkedBy: checkedBy ?? "Service Mode",
      checkedAt: new Date(),
    }).returning();
    res.status(201).json({ ...log, status });
  } catch (err) {
    req.log.error({ err }, "Failed to log temperature");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Quick waste log (public) — returns par check result ───────────────────────
router.post("/venues/:venueId/service/waste-log", async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const { inventoryItemId, itemName, quantity, unit, reason, notes, loggedBy } = req.body as {
      inventoryItemId?: number;
      itemName?: string;
      quantity?: string;
      unit?: string;
      reason?: string;
      notes?: string;
      loggedBy?: string;
    };
    if (!itemName || !quantity || !unit || !reason) {
      res.status(400).json({ error: "itemName, quantity, unit and reason are required" }); return;
    }

    let costImpact = "0.00";
    let parCheck: { belowPar: boolean; projectedStock: string; parLevel: string; itemName: string } | null = null;
    let inventoryItem: typeof inventoryItemsTable.$inferSelect | null = null;
    const qty = parseFloat(quantity);

    if (inventoryItemId) {
      const [item] = await db.select().from(inventoryItemsTable)
        .where(and(eq(inventoryItemsTable.id, inventoryItemId), eq(inventoryItemsTable.venueId, venueId)));
      if (item) {
        inventoryItem = item;
        const avgCost = parseFloat(item.averageCost ?? "0");
        costImpact = (qty * avgCost).toFixed(2);
      }
    }

    const noteText = [notes, loggedBy ? `Logged by ${loggedBy}` : null].filter(Boolean).join(" — ") || undefined;

    const [wasteLog] = await db.insert(wasteLogsTable).values({
      venueId,
      inventoryItemId: inventoryItemId ?? null,
      itemName,
      quantity,
      unit,
      costImpact,
      reason,
      notes: noteText,
      isQuick: true,
      loggedAt: new Date(),
    }).returning();

    if (inventoryItem && wasteLog) {
      const movement = await applyInventoryMovement({
        venueId,
        inventoryItemId: inventoryItem.id,
        transactionType: "WASTE",
        quantityDelta: -qty,
        unitCost: parseFloat(inventoryItem.averageCost ?? "0"),
        reason,
        referenceType: "waste_log",
        referenceId: wasteLog.id,
        createdBy: loggedBy,
        metadata: { source: "service_mode", itemName, notes: noteText ?? null },
      });

      if (inventoryItem.parLevel) {
        const projected = parseFloat(movement.item.currentStock ?? "0");
        parCheck = {
          belowPar: projected < parseFloat(inventoryItem.parLevel),
          projectedStock: projected.toFixed(2),
          parLevel: inventoryItem.parLevel,
          itemName: inventoryItem.name,
        };
      }
    }

    res.status(201).json({ wasteLog, parCheck });
  } catch (err) {
    req.log.error({ err }, "Failed to log waste");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
