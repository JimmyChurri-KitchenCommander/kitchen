import { Router } from "express";
import { db } from "@workspace/db";
import { temperatureEquipmentTable, temperatureLogsTable } from "@workspace/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

type EquipmentRow = typeof temperatureEquipmentTable.$inferSelect;
type LogRow = typeof temperatureLogsTable.$inferSelect;

function isOverdue(eq: EquipmentRow, lastLog: LogRow | undefined): boolean {
  if (!eq.checkIntervalHours) return false;
  if (!lastLog) return true;
  const diffMs = Date.now() - lastLog.checkedAt.getTime();
  return diffMs > eq.checkIntervalHours * 3_600_000;
}

function nextDueMs(eq: EquipmentRow, lastLog: LogRow | undefined): number | null {
  if (!eq.checkIntervalHours) return null;
  const lastCheckedMs = lastLog ? lastLog.checkedAt.getTime() : 0;
  return lastCheckedMs + eq.checkIntervalHours * 3_600_000;
}

function fmtEquipmentWithStatus(
  e: EquipmentRow,
  lastLog?: LogRow
) {
  const overdue = isOverdue(e, lastLog);
  const due = nextDueMs(e, lastLog);
  return {
    id: e.id,
    venueId: e.venueId,
    name: e.name,
    type: e.type,
    minTemp: parseFloat(e.minTemp),
    maxTemp: parseFloat(e.maxTemp),
    checkIntervalHours: e.checkIntervalHours ?? null,
    isArchived: e.isArchived,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    lastChecked: lastLog ? lastLog.checkedAt.toISOString() : null,
    lastTemp: lastLog ? parseFloat(lastLog.recordedTemp) : null,
    lastStatus: lastLog ? lastLog.status : null,
    isOverdue: overdue,
    nextDueAt: due ? new Date(due).toISOString() : null,
  };
}

function fmtLog(l: LogRow) {
  return {
    id: l.id,
    venueId: l.venueId,
    equipmentId: l.equipmentId ?? null,
    invoiceId: l.invoiceId ?? null,
    logType: l.logType,
    itemName: l.itemName ?? null,
    recordedTemp: parseFloat(l.recordedTemp),
    status: l.status,
    notes: l.notes ?? null,
    correctiveAction: l.correctiveAction ?? null,
    recheckTemp: l.recheckTemp ? parseFloat(l.recheckTemp) : null,
    isResolved: l.isResolved ?? null,
    checkedBy: l.checkedBy,
    checkedAt: l.checkedAt.toISOString(),
  };
}

// Build a map of equipmentId → most recent log from a list of logs
function buildLastLogMap(logs: LogRow[]): Map<number, LogRow> {
  const m = new Map<number, LogRow>();
  for (const l of logs) {
    if (l.equipmentId !== null && !m.has(l.equipmentId)) {
      m.set(l.equipmentId, l);
    }
  }
  return m;
}

// ─── Equipment CRUD ───────────────────────────────────────────────────────────

router.get("/venues/:venueId/temperature/equipment", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const equipment = await db
      .select()
      .from(temperatureEquipmentTable)
      .where(and(eq(temperatureEquipmentTable.venueId, venueId), eq(temperatureEquipmentTable.isArchived, false)))
      .orderBy(temperatureEquipmentTable.name);

    // Fetch all recent logs for this venue in one query, ordered desc
    const recentLogs = await db
      .select()
      .from(temperatureLogsTable)
      .where(and(eq(temperatureLogsTable.venueId, venueId), eq(temperatureLogsTable.logType, "equipment_check")))
      .orderBy(desc(temperatureLogsTable.checkedAt))
      .limit(500);

    const lastLogMap = buildLastLogMap(recentLogs);
    res.json(equipment.map((e) => fmtEquipmentWithStatus(e, lastLogMap.get(e.id))));
  } catch (err) {
    req.log.error({ err }, "Failed to list temperature equipment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/temperature/equipment", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { name, type, minTemp, maxTemp, checkIntervalHours } = req.body as Record<string, unknown>;
    if (!name || typeof name !== "string") { res.status(400).json({ error: "name is required" }); return; }
    const [equipment] = await db
      .insert(temperatureEquipmentTable)
      .values({
        venueId,
        name,
        type: (type as string) || "fridge",
        minTemp: String(minTemp ?? "1.0"),
        maxTemp: String(maxTemp ?? "5.0"),
        checkIntervalHours: checkIntervalHours != null ? parseInt(String(checkIntervalHours)) : null,
      })
      .returning();
    res.status(201).json(fmtEquipmentWithStatus(equipment));
  } catch (err) {
    req.log.error({ err }, "Failed to create temperature equipment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/temperature/equipment/:equipmentId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const equipmentId = parseInt(req.params["equipmentId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { name, type, minTemp, maxTemp, checkIntervalHours } = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name) updates["name"] = name;
    if (type) updates["type"] = type;
    if (minTemp !== undefined) updates["minTemp"] = String(minTemp);
    if (maxTemp !== undefined) updates["maxTemp"] = String(maxTemp);
    if (checkIntervalHours !== undefined) {
      updates["checkIntervalHours"] = checkIntervalHours != null ? parseInt(String(checkIntervalHours)) : null;
    }
    const [equipment] = await db
      .update(temperatureEquipmentTable)
      .set(updates)
      .where(and(eq(temperatureEquipmentTable.id, equipmentId), eq(temperatureEquipmentTable.venueId, venueId)))
      .returning();
    if (!equipment) { res.status(404).json({ error: "Equipment not found" }); return; }
    res.json(fmtEquipmentWithStatus(equipment));
  } catch (err) {
    req.log.error({ err }, "Failed to update temperature equipment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/temperature/equipment/:equipmentId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const equipmentId = parseInt(req.params["equipmentId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [equipment] = await db
      .update(temperatureEquipmentTable)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(temperatureEquipmentTable.id, equipmentId), eq(temperatureEquipmentTable.venueId, venueId)))
      .returning();
    if (!equipment) { res.status(404).json({ error: "Equipment not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to archive temperature equipment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Temperature Logs ─────────────────────────────────────────────────────────

router.get("/venues/:venueId/temperature/logs", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { from, to, equipmentId, logType, failedOnly } = req.query as Record<string, string>;
    const conditions = [eq(temperatureLogsTable.venueId, venueId)];
    if (from) conditions.push(gte(temperatureLogsTable.checkedAt, new Date(from)));
    if (to) conditions.push(lte(temperatureLogsTable.checkedAt, new Date(to)));
    if (equipmentId) conditions.push(eq(temperatureLogsTable.equipmentId, parseInt(equipmentId)));
    if (logType) conditions.push(eq(temperatureLogsTable.logType, logType));
    if (failedOnly === "true") conditions.push(eq(temperatureLogsTable.status, "fail"));
    const logs = await db
      .select()
      .from(temperatureLogsTable)
      .where(and(...conditions))
      .orderBy(desc(temperatureLogsTable.checkedAt))
      .limit(200);
    res.json(logs.map(fmtLog));
  } catch (err) {
    req.log.error({ err }, "Failed to list temperature logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/temperature/logs", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { equipmentId, invoiceId, logType, itemName, recordedTemp, notes, checkedBy, correctiveAction } =
      req.body as Record<string, unknown>;
    if (recordedTemp === undefined || recordedTemp === null) {
      res.status(400).json({ error: "recordedTemp is required" }); return;
    }
    if (!checkedBy || typeof checkedBy !== "string") {
      res.status(400).json({ error: "checkedBy is required" }); return;
    }

    let status = "pass";
    if (equipmentId && typeof equipmentId === "number") {
      const [eq_] = await db
        .select()
        .from(temperatureEquipmentTable)
        .where(and(eq(temperatureEquipmentTable.id, equipmentId), eq(temperatureEquipmentTable.venueId, venueId)));
      if (eq_) {
        const temp = parseFloat(String(recordedTemp));
        if (temp < parseFloat(eq_.minTemp) || temp > parseFloat(eq_.maxTemp)) status = "fail";
      }
    }

    if (logType === "delivery_check" && !equipmentId) {
      const temp = parseFloat(String(recordedTemp));
      if (temp > 5) status = "fail";
    }

    const [log] = await db
      .insert(temperatureLogsTable)
      .values({
        venueId,
        equipmentId: typeof equipmentId === "number" ? equipmentId : null,
        invoiceId: typeof invoiceId === "number" ? invoiceId : null,
        logType: (logType as string) || "equipment_check",
        itemName: itemName ? String(itemName) : null,
        recordedTemp: String(recordedTemp),
        status,
        notes: notes ? String(notes) : null,
        correctiveAction: correctiveAction ? String(correctiveAction) : null,
        checkedBy: String(checkedBy),
      })
      .returning();
    res.status(201).json(fmtLog(log));
  } catch (err) {
    req.log.error({ err }, "Failed to create temperature log");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/temperature/logs/:logId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const logId = parseInt(req.params["logId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { correctiveAction, recheckTemp, isResolved, notes } = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (correctiveAction !== undefined) updates["correctiveAction"] = correctiveAction;
    if (recheckTemp !== undefined) updates["recheckTemp"] = recheckTemp !== null ? String(recheckTemp) : null;
    if (isResolved !== undefined) updates["isResolved"] = Boolean(isResolved);
    if (notes !== undefined) updates["notes"] = notes;
    const [log] = await db
      .update(temperatureLogsTable)
      .set(updates)
      .where(and(eq(temperatureLogsTable.id, logId), eq(temperatureLogsTable.venueId, venueId)))
      .returning();
    if (!log) { res.status(404).json({ error: "Log not found" }); return; }
    res.json(fmtLog(log));
  } catch (err) {
    req.log.error({ err }, "Failed to update temperature log");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Summary (dashboard widget) ───────────────────────────────────────────────

router.get("/venues/:venueId/temperature/summary", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [equipment, recentLogs, allLastLogs] = await Promise.all([
      db.select().from(temperatureEquipmentTable)
        .where(and(eq(temperatureEquipmentTable.venueId, venueId), eq(temperatureEquipmentTable.isArchived, false))),
      db.select().from(temperatureLogsTable)
        .where(and(eq(temperatureLogsTable.venueId, venueId), gte(temperatureLogsTable.checkedAt, todayStart)))
        .orderBy(desc(temperatureLogsTable.checkedAt))
        .limit(200),
      db.select().from(temperatureLogsTable)
        .where(and(eq(temperatureLogsTable.venueId, venueId), eq(temperatureLogsTable.logType, "equipment_check")))
        .orderBy(desc(temperatureLogsTable.checkedAt))
        .limit(500),
    ]);

    const lastLogMap = buildLastLogMap(allLastLogs);

    const failedToday = recentLogs.filter((l) => l.status === "fail").length;
    const unresolvedFails = recentLogs.filter((l) => l.status === "fail" && l.isResolved !== true).length;
    const checksToday = recentLogs.length;

    const equipmentStatus = equipment.map((e) => {
      const last = lastLogMap.get(e.id);
      const overdue = isOverdue(e, last);
      return {
        id: e.id,
        name: e.name,
        type: e.type,
        minTemp: parseFloat(e.minTemp),
        maxTemp: parseFloat(e.maxTemp),
        checkIntervalHours: e.checkIntervalHours ?? null,
        lastChecked: last ? last.checkedAt.toISOString() : null,
        lastTemp: last ? parseFloat(last.recordedTemp) : null,
        lastStatus: last ? last.status : null,
        isOverdue: overdue,
        nextDueAt: nextDueMs(e, last) ? new Date(nextDueMs(e, last)!).toISOString() : null,
      };
    });

    const overdueCount = equipmentStatus.filter((e) => e.isOverdue).length;

    res.json({
      failedToday,
      unresolvedFails,
      checksToday,
      equipmentCount: equipment.length,
      overdueCount,
      equipmentStatus,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get temperature summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── CSV Export ───────────────────────────────────────────────────────────────

router.get("/venues/:venueId/temperature/logs/export", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { from, to, equipmentId, logType, failedOnly } = req.query as Record<string, string>;
    const conditions = [eq(temperatureLogsTable.venueId, venueId)];
    if (from) conditions.push(gte(temperatureLogsTable.checkedAt, new Date(from)));
    if (to) conditions.push(lte(temperatureLogsTable.checkedAt, new Date(to)));
    if (equipmentId) conditions.push(eq(temperatureLogsTable.equipmentId, parseInt(equipmentId)));
    if (logType) conditions.push(eq(temperatureLogsTable.logType, logType));
    if (failedOnly === "true") conditions.push(eq(temperatureLogsTable.status, "fail"));

    const logs = await db
      .select({ log: temperatureLogsTable, equipment: temperatureEquipmentTable })
      .from(temperatureLogsTable)
      .leftJoin(temperatureEquipmentTable, eq(temperatureLogsTable.equipmentId, temperatureEquipmentTable.id))
      .where(and(...conditions))
      .orderBy(desc(temperatureLogsTable.checkedAt));

    const headers = [
      "Date/Time", "Type", "Equipment", "Item", "Temperature (°C)", "Status",
      "Checked By", "Notes", "Corrective Action", "Recheck Temp (°C)", "Resolved", "Invoice ID",
    ];
    const rows = logs.map(({ log, equipment: eq_ }) => [
      log.checkedAt.toISOString(),
      log.logType === "delivery_check" ? "Delivery Check" : "Equipment Check",
      eq_?.name ?? "",
      log.itemName ?? "",
      parseFloat(log.recordedTemp).toFixed(1),
      log.status === "pass" ? "PASS" : "FAIL",
      log.checkedBy,
      (log.notes ?? "").replace(/,/g, ";"),
      (log.correctiveAction ?? "").replace(/,/g, ";"),
      log.recheckTemp ? parseFloat(log.recheckTemp).toFixed(1) : "",
      log.isResolved === true ? "Yes" : log.isResolved === false ? "No" : "",
      log.invoiceId?.toString() ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="temperature-logs-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export temperature logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
