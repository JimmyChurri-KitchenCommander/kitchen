import { Router } from "express";
import { db } from "@workspace/db";
import {
  chemicalsTable,
  cleaningLogsTable,
  cleaningTasksTable,
  complianceTasksTable,
  recipesTable,
  temperatureEquipmentTable,
  temperatureLogsTable,
} from "@workspace/db";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";
import { cleaningFrequencyToDays } from "./cleaning";

const router = Router();

function isCleaningOverdue(task: typeof cleaningTasksTable.$inferSelect, now = new Date()): boolean {
  if (!task.isActive) return false;
  if (!task.lastCompletedAt) return true;
  const elapsedDays = (now.getTime() - task.lastCompletedAt.getTime()) / 86_400_000;
  return elapsedDays >= cleaningFrequencyToDays(task.frequency);
}

function auditEntry(input: {
  id: string;
  type: "temperature" | "cleaning" | "compliance";
  title: string;
  detail: string | null;
  actor: string | null;
  occurredAt: Date;
  status: "pass" | "fail" | "completed" | "pending" | "resolved";
}) {
  return {
    ...input,
    occurredAt: input.occurredAt.toISOString(),
  };
}

router.get("/venues/:venueId/compliance/overview", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      cleaningTasks,
      temperatureEquipment,
      todayTemperatureLogs,
      complianceTasks,
      chemicals,
      recipes,
    ] = await Promise.all([
      db.select().from(cleaningTasksTable).where(eq(cleaningTasksTable.venueId, venueId)),
      db.select().from(temperatureEquipmentTable).where(and(eq(temperatureEquipmentTable.venueId, venueId), ne(temperatureEquipmentTable.isArchived, true))),
      db.select().from(temperatureLogsTable).where(and(eq(temperatureLogsTable.venueId, venueId), gte(temperatureLogsTable.checkedAt, todayStart))),
      db.select().from(complianceTasksTable).where(eq(complianceTasksTable.venueId, venueId)),
      db.select().from(chemicalsTable).where(eq(chemicalsTable.venueId, venueId)),
      db.select().from(recipesTable).where(and(eq(recipesTable.venueId, venueId), ne(recipesTable.isArchived, true))),
    ]);

    const activeCleaningTasks = cleaningTasks.filter(t => t.isActive);
    const overdueCleaning = activeCleaningTasks.filter(t => isCleaningOverdue(t));
    const taskKindCounts = activeCleaningTasks.reduce<Record<string, { total: number; overdue: number }>>((acc, task) => {
      const kind = task.taskKind ?? "cleaning";
      acc[kind] ??= { total: 0, overdue: 0 };
      acc[kind].total++;
      if (isCleaningOverdue(task)) acc[kind].overdue++;
      return acc;
    }, {});

    const unresolvedFails = todayTemperatureLogs.filter(log => log.status === "fail" && log.isResolved !== true).length;
    const temperatureOverdueCount = temperatureEquipment.filter(equipment => {
      if (!equipment.checkIntervalHours) return false;
      const latest = todayTemperatureLogs
        .filter(log => log.equipmentId === equipment.id)
        .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())[0];
      if (!latest) return true;
      return (Date.now() - latest.checkedAt.getTime()) / 36e5 > equipment.checkIntervalHours;
    }).length;

    const pendingComplianceTasks = complianceTasks.filter(task => task.status === "pending");
    const activeChemicals = chemicals.filter(chemical => chemical.isActive || chemical.complianceStatus === "missing" || chemical.complianceStatus === "expired");
    const blockedChemicals = activeChemicals.filter(chemical =>
      chemical.complianceStatus === "missing" ||
      chemical.complianceStatus === "expired" ||
      chemical.complianceStatus === "MISSING_MSDS" ||
      chemical.complianceStatus === "EXPIRED"
    );
    const validChemicals = activeChemicals.length - blockedChemicals.length;
    const chemicalScore = activeChemicals.length === 0 ? 100 : Math.round((validChemicals / activeChemicals.length) * 100);

    const recipesWithAllergens = recipes.filter(recipe => Array.isArray(recipe.allergens) && recipe.allergens.length > 0).length;
    const allergenCoveragePercent = recipes.length === 0 ? 100 : Math.round((recipesWithAllergens / recipes.length) * 100);

    const totalIssues = overdueCleaning.length + unresolvedFails + temperatureOverdueCount + pendingComplianceTasks.length + blockedChemicals.length;
    const score = Math.max(0, Math.round(100 - Math.min(100, totalIssues * 8)));

    res.json({
      score,
      status: totalIssues === 0 ? "ready" : totalIssues <= 3 ? "watch" : "action_required",
      totalIssues,
      temperature: {
        equipmentCount: temperatureEquipment.length,
        checksToday: todayTemperatureLogs.length,
        unresolvedFails,
        overdueCount: temperatureOverdueCount,
      },
      checklists: {
        total: activeCleaningTasks.length,
        overdue: overdueCleaning.length,
        byKind: taskKindCounts,
      },
      chemicals: {
        totalActive: activeChemicals.length,
        blockedCount: blockedChemicals.length,
        pendingTaskCount: pendingComplianceTasks.length,
        score: chemicalScore,
      },
      allergens: {
        recipeCount: recipes.length,
        recipesWithAllergens,
        coveragePercent: allergenCoveragePercent,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get compliance overview");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/compliance/audit-trail", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const limit = Math.min(100, Math.max(10, Number(req.query["limit"] ?? 40)));
    const from = req.query["from"] ? new Date(String(req.query["from"])) : new Date(Date.now() - 30 * 86_400_000);

    const [temperatureLogs, cleaningLogs, complianceTasks] = await Promise.all([
      db
        .select({ log: temperatureLogsTable, equipmentName: temperatureEquipmentTable.name })
        .from(temperatureLogsTable)
        .leftJoin(temperatureEquipmentTable, eq(temperatureLogsTable.equipmentId, temperatureEquipmentTable.id))
        .where(and(eq(temperatureLogsTable.venueId, venueId), gte(temperatureLogsTable.checkedAt, from)))
        .orderBy(desc(temperatureLogsTable.checkedAt))
        .limit(limit),
      db
        .select({ log: cleaningLogsTable, taskTitle: cleaningTasksTable.title, taskKind: cleaningTasksTable.taskKind })
        .from(cleaningLogsTable)
        .leftJoin(cleaningTasksTable, eq(cleaningLogsTable.taskId, cleaningTasksTable.id))
        .where(and(eq(cleaningLogsTable.venueId, venueId), gte(cleaningLogsTable.completedAt, from)))
        .orderBy(desc(cleaningLogsTable.completedAt))
        .limit(limit),
      db
        .select()
        .from(complianceTasksTable)
        .where(and(eq(complianceTasksTable.venueId, venueId), sql`${complianceTasksTable.createdAt} >= ${from}`))
        .orderBy(desc(complianceTasksTable.createdAt))
        .limit(limit),
    ]);

    const entries = [
      ...temperatureLogs.map(({ log, equipmentName }) => auditEntry({
        id: `temp-${log.id}`,
        type: "temperature" as const,
        title: log.status === "fail" ? "Temperature check failed" : "Temperature check logged",
        detail: `${equipmentName ?? log.itemName ?? "Temperature"}: ${parseFloat(log.recordedTemp).toFixed(1)}C`,
        actor: log.checkedBy,
        occurredAt: log.checkedAt,
        status: log.status === "fail" ? "fail" : "pass",
      })),
      ...cleaningLogs.map(({ log, taskTitle, taskKind }) => auditEntry({
        id: `clean-${log.id}`,
        type: "cleaning" as const,
        title: `${taskKind === "opening" ? "Opening" : taskKind === "closing" ? "Closing" : taskKind === "equipment" ? "Equipment" : "Cleaning"} task completed`,
        detail: taskTitle ?? `Task #${log.taskId}`,
        actor: log.completedBy,
        occurredAt: log.completedAt,
        status: "completed",
      })),
      ...complianceTasks.map(task => auditEntry({
        id: `compliance-${task.id}`,
        type: "compliance" as const,
        title: task.title,
        detail: task.description ?? null,
        actor: task.status === "resolved" ? task.resolvedBy ?? null : null,
        occurredAt: task.resolvedAt ?? task.createdAt,
        status: task.status === "resolved" ? "resolved" : "pending",
      })),
    ]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, limit);

    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to get compliance audit trail");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
