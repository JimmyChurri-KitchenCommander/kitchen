import { Router } from "express";
import { db } from "@workspace/db";
import { cleaningTasksTable, cleaningLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";

const router = Router();

export function cleaningFrequencyToDays(frequency: string): number {
  switch (frequency) {
    case "daily": return 1;
    case "weekly": return 7;
    case "fortnightly": return 14;
    case "monthly": return 30;
    case "quarterly": return 90;
    default: return 1;
  }
}

function parseTask(t: typeof cleaningTasksTable.$inferSelect) {
  const intervalDays = cleaningFrequencyToDays(t.frequency);
  const nextDueAt = t.lastCompletedAt
    ? new Date(t.lastCompletedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const isOverdue = nextDueAt ? new Date(nextDueAt) < new Date() : true;
  return {
    id: t.id,
    venueId: t.venueId,
    title: t.title,
    area: t.area,
    frequency: t.frequency,
    taskKind: t.taskKind,
    assignedTo: t.assignedTo ?? null,
    notes: t.notes ?? null,
    isActive: t.isActive,
    lastCompletedAt: t.lastCompletedAt ? t.lastCompletedAt.toISOString() : null,
    nextDueAt,
    isOverdue: t.isActive ? isOverdue : false,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt ? t.updatedAt.toISOString() : null,
  };
}

// List cleaning tasks
router.get("/venues/:venueId/cleaning-tasks", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const taskKind = req.query["taskKind"] as string | undefined;
    const conditions = [eq(cleaningTasksTable.venueId, venueId)];
    if (taskKind && taskKind !== "all") conditions.push(eq(cleaningTasksTable.taskKind, taskKind));
    const tasks = await db.select().from(cleaningTasksTable).where(and(...conditions));
    res.json(tasks.map(parseTask));
  } catch (err) {
    req.log.error({ err }, "Failed to list cleaning tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create cleaning task
router.post("/venues/:venueId/cleaning-tasks", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { title, area, frequency, taskKind, assignedTo, notes } = req.body as Record<string, unknown>;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    const [task] = await db.insert(cleaningTasksTable).values({
      venueId,
      title: title as string,
      area: (area as string) ?? "other",
      frequency: (frequency as string) ?? "daily",
      taskKind: (taskKind as string) ?? "cleaning",
      assignedTo: assignedTo as string | undefined,
      notes: notes as string | undefined,
    }).returning();
    res.status(201).json(parseTask(task));
  } catch (err) {
    req.log.error({ err }, "Failed to create cleaning task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update cleaning task
router.put("/venues/:venueId/cleaning-tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { title, area, frequency, taskKind, assignedTo, notes, isActive } = req.body as Record<string, unknown>;
    const [updated] = await db.update(cleaningTasksTable)
      .set({
        ...(title !== undefined && { title: title as string }),
        ...(area !== undefined && { area: area as string }),
        ...(frequency !== undefined && { frequency: frequency as string }),
        ...(taskKind !== undefined && { taskKind: taskKind as string }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo as string }),
        ...(notes !== undefined && { notes: notes as string }),
        ...(isActive !== undefined && { isActive: isActive as boolean }),
        updatedAt: new Date(),
      })
      .where(and(eq(cleaningTasksTable.id, taskId), eq(cleaningTasksTable.venueId, venueId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(parseTask(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update cleaning task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete cleaning task
router.delete("/venues/:venueId/cleaning-tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    await db.delete(cleaningTasksTable).where(and(eq(cleaningTasksTable.id, taskId), eq(cleaningTasksTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete cleaning task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Log a cleaning task completion
router.post("/venues/:venueId/cleaning-tasks/:taskId/complete", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { completedBy, notes } = req.body as Record<string, unknown>;
    if (!completedBy) { res.status(400).json({ error: "completedBy is required" }); return; }

    const now = new Date();
    const [log] = await db.insert(cleaningLogsTable).values({
      taskId, venueId,
      completedBy: completedBy as string,
      notes: notes as string | undefined,
      completedAt: now,
    }).returning();

    await db.update(cleaningTasksTable)
      .set({ lastCompletedAt: now, updatedAt: now })
      .where(and(eq(cleaningTasksTable.id, taskId), eq(cleaningTasksTable.venueId, venueId)));

    res.status(201).json({
      id: log.id, taskId: log.taskId, venueId: log.venueId,
      completedBy: log.completedBy, notes: log.notes ?? null,
      completedAt: log.completedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to log cleaning completion");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List cleaning logs for a venue
router.get("/venues/:venueId/cleaning-logs", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const logs = await db.select().from(cleaningLogsTable)
      .where(eq(cleaningLogsTable.venueId, venueId))
      .orderBy(desc(cleaningLogsTable.completedAt))
      .limit(200);
    res.json(logs.map((l) => ({
      id: l.id, taskId: l.taskId, venueId: l.venueId,
      completedBy: l.completedBy, notes: l.notes ?? null,
      completedAt: l.completedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list cleaning logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
