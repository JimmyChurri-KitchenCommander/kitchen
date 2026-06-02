import { Router } from "express";
import { db } from "@workspace/db";
import { prepTaskLibraryTable, venueBookingNotesTable, recipesTable, inventoryItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";

const router = Router();

function parseLibraryTask(
  t: typeof prepTaskLibraryTable.$inferSelect,
  recipeName?: string | null,
) {
  return {
    id: t.id,
    venueId: t.venueId,
    recipeId: t.recipeId ?? null,
    recipeName: recipeName ?? null,
    inventoryItemId: t.inventoryItemId ?? null,
    title: t.title,
    description: t.description ?? null,
    category: t.category,
    section: t.section,
    shift: t.shift,
    priority: t.priority,
    quantity: t.quantity !== null ? parseFloat(t.quantity) : null,
    unit: t.unit ?? null,
    batchSize: t.batchSize ?? null,
    notes: t.notes ?? null,
    estimatedMinutes: t.estimatedMinutes ?? null,
    quickInstructions: t.quickInstructions ?? null,
    imageUrl: t.imageUrl ?? null,
    trainingTags: t.trainingTags ?? null,
    status: t.status,
    createdBy: t.createdBy ?? null,
    approvedBy: t.approvedBy ?? null,
    approvedUntil: t.approvedUntil ? t.approvedUntil.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt ? t.updatedAt.toISOString() : null,
  };
}

async function enrichLibraryTask(t: typeof prepTaskLibraryTable.$inferSelect) {
  let recipeName: string | null = null;
  if (t.recipeId) {
    const [r] = await db.select({ name: recipesTable.name }).from(recipesTable).where(eq(recipesTable.id, t.recipeId));
    if (r) recipeName = r.name;
  }
  return parseLibraryTask(t, recipeName);
}

// List library tasks — optional ?status= / ?section= / ?search= filters
router.get("/venues/:venueId/prep-library", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const statusFilter = req.query["status"] as string | undefined;
    const sectionFilter = req.query["section"] as string | undefined;
    const searchQuery = (req.query["search"] as string | undefined)?.toLowerCase();

    // Fetch all tasks for this venue, then filter in JS (so ?status=archived works)
    let tasks = await db
      .select()
      .from(prepTaskLibraryTable)
      .where(eq(prepTaskLibraryTable.venueId, venueId));

    if (statusFilter) {
      tasks = tasks.filter(t => t.status === statusFilter);
    } else {
      // Default: exclude archived unless explicitly requested
      tasks = tasks.filter(t => t.status !== "archived");
    }
    if (sectionFilter) tasks = tasks.filter(t => t.section === sectionFilter);
    if (searchQuery) {
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery) ||
        (t.description?.toLowerCase().includes(searchQuery) ?? false)
      );
    }

    const recipeIds = [...new Set(tasks.map(t => t.recipeId).filter(Boolean))] as number[];
    const recipeMap = new Map<number, string>();
    if (recipeIds.length > 0) {
      const recs = await Promise.all(
        recipeIds.map(id => db.select({ id: recipesTable.id, name: recipesTable.name }).from(recipesTable).where(eq(recipesTable.id, id)).then(r => r[0]))
      );
      recs.forEach(r => { if (r) recipeMap.set(r.id, r.name); });
    }

    res.json(tasks.map(t => parseLibraryTask(t, t.recipeId ? recipeMap.get(t.recipeId) ?? null : null)));
  } catch (err) {
    req.log.error({ err }, "Failed to list prep library tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: list pending tasks (waiting_approval) — must come before /:libraryTaskId route
router.get("/venues/:venueId/prep-library/pending", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const tasks = await db
      .select()
      .from(prepTaskLibraryTable)
      .where(and(eq(prepTaskLibraryTable.venueId, venueId), eq(prepTaskLibraryTable.status, "waiting_approval")));

    const recipeIds = [...new Set(tasks.map(t => t.recipeId).filter(Boolean))] as number[];
    const recipeMap = new Map<number, string>();
    if (recipeIds.length > 0) {
      const recs = await Promise.all(recipeIds.map(id => db.select({ id: recipesTable.id, name: recipesTable.name }).from(recipesTable).where(eq(recipesTable.id, id)).then(r => r[0])));
      recs.forEach(r => { if (r) recipeMap.set(r.id, r.name); });
    }
    res.json(tasks.map(t => parseLibraryTask(t, t.recipeId ? recipeMap.get(t.recipeId) ?? null : null)));
  } catch (err) {
    req.log.error({ err }, "Failed to list pending prep library tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create library task — admins create as "active", others as "waiting_approval"
router.post("/venues/:venueId/prep-library", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const isAdmin = await assertVenueAdmin(venueId, req.userId!);
    const { title, description, category, section, shift, priority, quantity, unit, batchSize, notes, estimatedMinutes, recipeId, inventoryItemId, quickInstructions, imageUrl, trainingTags } = req.body as Record<string, unknown>;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const [task] = await db.insert(prepTaskLibraryTable).values({
      venueId,
      title: title as string,
      quickInstructions: quickInstructions as string | undefined,
      imageUrl: imageUrl as string | undefined,
      trainingTags: trainingTags as string | undefined,
      description: description as string | undefined,
      category: (category as string) ?? "other",
      section: (section as string) ?? "other",
      shift: (shift as string) ?? "all_day",
      priority: (priority as string) ?? "medium",
      quantity: quantity !== undefined ? String(quantity) : null,
      unit: unit as string | undefined,
      batchSize: batchSize as string | undefined,
      notes: notes as string | undefined,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      recipeId: recipeId ? Number(recipeId) : undefined,
      inventoryItemId: inventoryItemId ? Number(inventoryItemId) : undefined,
      status: isAdmin ? "active" : "waiting_approval",
      createdBy: req.userId!,
    }).returning();

    res.status(201).json(await enrichLibraryTask(task!));
  } catch (err) {
    req.log.error({ err }, "Failed to create prep library task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reactivation checklist — must be registered BEFORE /:libraryTaskId PATCH
router.get("/venues/:venueId/prep-library/:libraryTaskId/reactivation-checklist", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const libraryTaskId = parseInt(req.params["libraryTaskId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [task] = await db.select().from(prepTaskLibraryTable)
      .where(and(eq(prepTaskLibraryTable.id, libraryTaskId), eq(prepTaskLibraryTable.venueId, venueId)));
    if (!task) { res.status(404).json({ error: "Library task not found" }); return; }

    let linkedRecipe: { id: number; name: string; status: string; recipeType: string | null } | null = null;
    if (task.recipeId) {
      const [r] = await db.select({
        id: recipesTable.id,
        name: recipesTable.name,
        status: recipesTable.status,
        recipeType: recipesTable.recipeType,
      }).from(recipesTable).where(eq(recipesTable.id, task.recipeId));
      if (r) linkedRecipe = { id: r.id!, name: r.name ?? "", status: r.status, recipeType: r.recipeType ?? null };
    }

    let linkedInventoryItem: { id: number; name: string; currentStock: number; parLevel: number } | null = null;
    let suggestedQuantityUpdate = false;
    if (task.inventoryItemId) {
      const [inv] = await db.select({
        id: inventoryItemsTable.id,
        name: inventoryItemsTable.name,
        currentStock: inventoryItemsTable.currentStock,
        parLevel: inventoryItemsTable.parLevel,
      }).from(inventoryItemsTable).where(eq(inventoryItemsTable.id, task.inventoryItemId));
      if (inv) {
        linkedInventoryItem = {
          id: inv.id!,
          name: inv.name,
          currentStock: parseFloat(inv.currentStock),
          parLevel: parseFloat(inv.parLevel),
        };
        suggestedQuantityUpdate = parseFloat(inv.currentStock) < parseFloat(inv.parLevel);
      }
    }

    res.json({
      libraryTask: parseLibraryTask(task),
      linkedRecipe,
      linkedInventoryItem,
      suggestedQuantityUpdate,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get reactivation checklist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update library task — admin OR creator only; admin can also change status
router.patch("/venues/:venueId/prep-library/:libraryTaskId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const libraryTaskId = parseInt(req.params["libraryTaskId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    // Verify task exists and check ownership
    const [existingTask] = await db.select()
      .from(prepTaskLibraryTable)
      .where(and(eq(prepTaskLibraryTable.id, libraryTaskId), eq(prepTaskLibraryTable.venueId, venueId)));
    if (!existingTask) { res.status(404).json({ error: "Library task not found" }); return; }

    const isAdmin = await assertVenueAdmin(venueId, req.userId!);

    if (!isAdmin) {
      // Non-admins can only edit their own waiting_approval tasks (not approved library content)
      const isCreator = existingTask.createdBy === req.userId;
      const isPending = existingTask.status === "waiting_approval";
      if (!isCreator || !isPending) {
        res.status(403).json({ error: "Only admins can edit approved library tasks" }); return;
      }
    }

    const { title, description, category, section, shift, priority, quantity, unit, batchSize, notes, estimatedMinutes, recipeId, inventoryItemId, status, quickInstructions, imageUrl, trainingTags } = req.body as Record<string, unknown>;
    const updates: Partial<typeof prepTaskLibraryTable.$inferInsert> = { updatedAt: new Date() };

    if (title !== undefined) updates.title = title as string;
    if (quickInstructions !== undefined) updates.quickInstructions = quickInstructions as string | null;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl as string | null;
    if (trainingTags !== undefined) updates.trainingTags = trainingTags as string | null;
    if (description !== undefined) updates.description = description as string;
    if (category !== undefined) updates.category = category as string;
    if (section !== undefined) updates.section = section as string;
    if (shift !== undefined) updates.shift = shift as string;
    if (priority !== undefined) updates.priority = priority as string;
    if (quantity !== undefined) updates.quantity = quantity !== null ? String(quantity) : null;
    if (unit !== undefined) updates.unit = unit as string;
    if (batchSize !== undefined) updates.batchSize = batchSize as string;
    if (notes !== undefined) updates.notes = notes as string;
    if (estimatedMinutes !== undefined) updates.estimatedMinutes = estimatedMinutes ? Number(estimatedMinutes) : null;
    if (recipeId !== undefined) updates.recipeId = recipeId ? Number(recipeId) : null;
    if (inventoryItemId !== undefined) updates.inventoryItemId = inventoryItemId ? Number(inventoryItemId) : null;
    // Only admins can change status
    if (status !== undefined && isAdmin) updates.status = status as string;

    const [updated] = await db.update(prepTaskLibraryTable)
      .set(updates)
      .where(and(eq(prepTaskLibraryTable.id, libraryTaskId), eq(prepTaskLibraryTable.venueId, venueId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Library task not found" }); return; }

    res.json(await enrichLibraryTask(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update prep library task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Archive (soft-delete) a library task — admin only
router.delete("/venues/:venueId/prep-library/:libraryTaskId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const libraryTaskId = parseInt(req.params["libraryTaskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [updated] = await db.update(prepTaskLibraryTable)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(prepTaskLibraryTable.id, libraryTaskId), eq(prepTaskLibraryTable.venueId, venueId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Library task not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to archive prep library task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve a pending library task — admin only; optional `days` for temporary approval
router.post("/venues/:venueId/prep-library/:libraryTaskId/approve", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const libraryTaskId = parseInt(req.params["libraryTaskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { days } = (req.body ?? {}) as { days?: number };
    const approvedUntil = days && days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

    const [updated] = await db.update(prepTaskLibraryTable)
      .set({
        status: "active",
        approvedBy: req.userId!,
        approvedUntil: approvedUntil,
        updatedAt: new Date(),
      })
      .where(and(eq(prepTaskLibraryTable.id, libraryTaskId), eq(prepTaskLibraryTable.venueId, venueId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Library task not found" }); return; }
    res.json(await enrichLibraryTask(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to approve prep library task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reject a pending library task — admin only (archives it)
router.post("/venues/:venueId/prep-library/:libraryTaskId/reject", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const libraryTaskId = parseInt(req.params["libraryTaskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [existing] = await db.select().from(prepTaskLibraryTable)
      .where(and(eq(prepTaskLibraryTable.id, libraryTaskId), eq(prepTaskLibraryTable.venueId, venueId)));
    if (!existing) { res.status(404).json({ error: "Library task not found" }); return; }
    await db.update(prepTaskLibraryTable)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(prepTaskLibraryTable.id, libraryTaskId), eq(prepTaskLibraryTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to reject prep library task");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { parseLibraryTask };
export default router;
