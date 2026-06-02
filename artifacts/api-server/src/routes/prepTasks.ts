import { Router } from "express";
import { db } from "@workspace/db";
import { prepTasksTable, prepTaskLibraryTable, venueStaffTable, venuesTable, recipesTable, inventoryItemsTable, wasteLogsTable } from "@workspace/db";
import { eq, and, ne, gte } from "drizzle-orm";
import { parseLibraryTask } from "./prepLibrary";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

function parseTask(t: typeof prepTasksTable.$inferSelect, recipeName?: string | null, recipeMethod?: string | null) {
  return {
    id: t.id,
    venueId: t.venueId,
    recipeId: t.recipeId ?? null,
    recipeName: recipeName ?? null,
    recipeMethod: recipeMethod ?? null,
    libraryTaskId: t.libraryTaskId ?? null,
    title: t.title,
    description: t.description ?? null,
    category: t.category,
    section: t.section,
    shift: t.shift,
    assignedTo: t.assignedTo ?? null,
    claimedBy: t.claimedBy ?? null,
    priority: t.priority,
    status: t.status,
    quantity: t.quantity !== null ? parseFloat(t.quantity) : null,
    unit: t.unit ?? null,
    batchSize: t.batchSize ?? null,
    notes: t.notes ?? null,
    prepDate: t.prepDate,
    deferredFrom: t.deferredFrom ?? null,
    estimatedDurationMinutes: t.estimatedDurationMinutes ?? null,
    isCritical: t.isCritical,
    quickInstructions: t.quickInstructions ?? null,
    imageUrl: t.imageUrl ?? null,
    trainingTags: t.trainingTags ?? null,
    isArchived: t.isArchived,
    archivedAt: t.archivedAt ? t.archivedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt ? t.updatedAt.toISOString() : null,
  };
}

async function enrichTasks(tasks: typeof prepTasksTable.$inferSelect[]) {
  const recipeIds = [...new Set(tasks.map(t => t.recipeId).filter(Boolean))] as number[];
  let recipeMap = new Map<number, { name: string; method: string | null }>();
  if (recipeIds.length > 0) {
    const allRecipes = await Promise.all(recipeIds.map(id => db.select().from(recipesTable).where(eq(recipesTable.id, id)).then(r => r[0])));
    allRecipes.forEach(r => { if (r) recipeMap.set(r.id, { name: r.name, method: r.method ?? null }); });
  }
  return tasks.map(t => {
    const rec = t.recipeId ? recipeMap.get(t.recipeId) : undefined;
    return parseTask(t, rec?.name ?? null, rec?.method ?? null);
  });
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Public read-only endpoint — no auth required (kitchen display screens)
router.get("/venues/:venueId/prep-tasks/public", async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (isNaN(venueId)) { res.status(400).json({ error: "Invalid venue ID" }); return; }
    const date = (req.query["date"] as string | undefined) ?? new Date().toISOString().slice(0, 10);
    const tasks = await db.select().from(prepTasksTable).where(
      and(eq(prepTasksTable.venueId, venueId), eq(prepTasksTable.prepDate, date), ne(prepTasksTable.isArchived, true))
    );
    res.json(await enrichTasks(tasks));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch public prep tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/prep-tasks", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const date = req.query["date"] as string | undefined;
    const tasks = date
      ? await db.select().from(prepTasksTable).where(and(eq(prepTasksTable.venueId, venueId), eq(prepTasksTable.prepDate, date), ne(prepTasksTable.isArchived, true)))
      : await db.select().from(prepTasksTable).where(and(eq(prepTasksTable.venueId, venueId), ne(prepTasksTable.isArchived, true)));
    res.json(await enrichTasks(tasks));
  } catch (err) {
    req.log.error({ err }, "Failed to list prep tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/prep-tasks", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { title, description, category, section, shift, assignedTo, claimedBy, priority, status, notes, prepDate, recipeId, libraryTaskId, quantity, unit, batchSize, estimatedDurationMinutes, isCritical, quickInstructions, imageUrl, trainingTags } = req.body as Record<string, unknown>;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    const today = new Date().toISOString().slice(0, 10);
    const [task] = await db.insert(prepTasksTable).values({
      venueId, title: title as string,
      quickInstructions: quickInstructions as string | undefined,
      imageUrl: imageUrl as string | undefined,
      trainingTags: trainingTags as string | undefined,
      recipeId: recipeId ? Number(recipeId) : null,
      libraryTaskId: libraryTaskId ? Number(libraryTaskId) : null,
      description: description as string | undefined,
      category: (category as string) ?? "other",
      section: (section as string) ?? "other",
      shift: (shift as string) ?? "all_day",
      assignedTo: assignedTo as string | undefined,
      claimedBy: claimedBy as string | undefined,
      priority: (priority as string) ?? "medium",
      status: (status as string) ?? "todo",
      quantity: quantity !== undefined && quantity !== null ? String(quantity) : null,
      unit: unit as string | undefined,
      batchSize: batchSize as string | undefined,
      notes: notes as string | undefined,
      prepDate: (prepDate as string) ?? today,
      estimatedDurationMinutes: estimatedDurationMinutes !== undefined && estimatedDurationMinutes !== null ? Number(estimatedDurationMinutes) : null,
      isCritical: isCritical === true || isCritical === "true",
    }).returning();
    let recipeName: string | null = null, recipeMethod: string | null = null;
    if (task!.recipeId) {
      const [r] = await db.select().from(recipesTable).where(eq(recipesTable.id, task!.recipeId));
      if (r) { recipeName = r.name; recipeMethod = r.method ?? null; }
    }
    res.status(201).json(parseTask(task!, recipeName, recipeMethod));
  } catch (err) {
    req.log.error({ err }, "Failed to create prep task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/venues/:venueId/prep-tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { title, description, category, section, shift, assignedTo, claimedBy, priority, status, notes, prepDate, recipeId, libraryTaskId, quantity, unit, batchSize, estimatedDurationMinutes, isCritical, quickInstructions, imageUrl, trainingTags } = req.body as Record<string, unknown>;
    const [updated] = await db.update(prepTasksTable)
      .set({
        ...(title !== undefined && { title: title as string }),
        ...(quickInstructions !== undefined && { quickInstructions: quickInstructions as string | null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl as string | null }),
        ...(trainingTags !== undefined && { trainingTags: trainingTags as string | null }),
        ...(description !== undefined && { description: description as string }),
        ...(category !== undefined && { category: category as string }),
        ...(section !== undefined && { section: section as string }),
        ...(shift !== undefined && { shift: shift as string }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo as string }),
        ...(claimedBy !== undefined && { claimedBy: claimedBy as string | null }),
        ...(priority !== undefined && { priority: priority as string }),
        ...(status !== undefined && { status: status as string }),
        ...(notes !== undefined && { notes: notes as string }),
        ...(prepDate !== undefined && { prepDate: prepDate as string }),
        ...(recipeId !== undefined && { recipeId: recipeId ? Number(recipeId) : null }),
        ...(libraryTaskId !== undefined && { libraryTaskId: libraryTaskId ? Number(libraryTaskId) : null }),
        ...(quantity !== undefined && { quantity: quantity !== null ? String(quantity) : null }),
        ...(unit !== undefined && { unit: unit as string | null }),
        ...(batchSize !== undefined && { batchSize: batchSize as string | null }),
        ...(estimatedDurationMinutes !== undefined && { estimatedDurationMinutes: estimatedDurationMinutes !== null ? Number(estimatedDurationMinutes) : null }),
        ...(isCritical !== undefined && { isCritical: Boolean(isCritical) }),
        updatedAt: new Date(),
      })
      .where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Task not found" }); return; }
    let recipeName: string | null = null, recipeMethod: string | null = null;
    if (updated.recipeId) {
      const [r] = await db.select().from(recipesTable).where(eq(recipesTable.id, updated.recipeId));
      if (r) { recipeName = r.name; recipeMethod = r.method ?? null; }
    }
    res.json(parseTask(updated, recipeName, recipeMethod));
  } catch (err) {
    req.log.error({ err }, "Failed to update prep task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/prep-tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    await db.delete(prepTasksTable).where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete prep task");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/prep-tasks/archived", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const tasks = await db.select().from(prepTasksTable).where(and(eq(prepTasksTable.venueId, venueId), eq(prepTasksTable.isArchived, true)));
    res.json(await enrichTasks(tasks)); return;
  } catch (err) {
    req.log.error({ err }, "Failed to list archived prep tasks");
    res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.post("/venues/:venueId/prep-tasks/:taskId/archive", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [task] = await db.update(prepTasksTable)
      .set({ isArchived: true, archivedAt: new Date(), archivedBy: req.userId!, updatedAt: new Date() })
      .where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)))
      .returning();
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(parseTask(task)); return;
  } catch (err) {
    req.log.error({ err }, "Failed to archive prep task");
    res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.post("/venues/:venueId/prep-tasks/:taskId/restore", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [task] = await db.update(prepTasksTable)
      .set({ isArchived: false, archivedAt: null, archivedBy: null, updatedAt: new Date() })
      .where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)))
      .returning();
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(parseTask(task)); return;
  } catch (err) {
    req.log.error({ err }, "Failed to restore prep task");
    res.status(500).json({ error: "Internal server error" }); return;
  }
});

router.post("/venues/:venueId/prep-tasks/:taskId/defer", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [existing] = await db.select().from(prepTasksTable).where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)));
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }
    const { targetDate } = (req.body ?? {}) as { targetDate?: string };
    const deferTo = targetDate ?? nextDay(existing.prepDate);
    const [updated] = await db.update(prepTasksTable)
      .set({ prepDate: deferTo, deferredFrom: existing.prepDate, status: "todo", updatedAt: new Date() })
      .where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)))
      .returning();
    res.json(parseTask(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to defer prep task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Build suggestions — returns A/B/C sections for the Build Prep List dialog
router.get("/venues/:venueId/prep-tasks/build-suggestions", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    // Section A: Critical — inventory items below par level, with recent waste activity
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [inventoryItems, recentWaste, libraryAll] = await Promise.all([
      db.select().from(inventoryItemsTable).where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true))),
      db.select().from(wasteLogsTable).where(and(eq(wasteLogsTable.venueId, venueId), gte(wasteLogsTable.loggedAt, sevenDaysAgo))),
      db.select().from(prepTaskLibraryTable).where(and(eq(prepTaskLibraryTable.venueId, venueId), ne(prepTaskLibraryTable.status, "archived"))),
    ]);

    // Build a set of inventory item IDs that had recent waste
    const wastedItemIds = new Set(recentWaste.map(w => w.inventoryItemId).filter(Boolean) as number[]);

    const criticalItems = inventoryItems
      .filter(item => {
        const current = parseFloat(item.currentStock ?? "0");
        const par = parseFloat(item.parLevel ?? "0");
        return current < par || wastedItemIds.has(item.id);
      })
      .map(item => {
        const current = parseFloat(item.currentStock ?? "0");
        const par = parseFloat(item.parLevel ?? "0");
        const hasWaste = wastedItemIds.has(item.id);
        // Find a matching library task by inventoryItemId FK or title similarity
        const matchedTask = libraryAll.find(t =>
          t.inventoryItemId === item.id ||
          t.title.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(t.title.toLowerCase().replace(/^(prep|portion|cut|make|cook|trim|clean)\s+/i, ""))
        );
        return {
          type: current === 0 ? "zero_stock" : hasWaste ? "recent_waste" : "low_stock",
          itemId: item.id,
          itemName: item.name,
          currentStock: current,
          parLevel: par,
          unit: item.unit ?? null,
          stockStatus: current === 0 ? "zero" : "low",
          hasRecentWaste: hasWaste,
          suggestedTask: matchedTask ? parseLibraryTask(matchedTask) : null,
        };
      });

    // Section B: Active library tasks (pre-selected by default)
    const standard = libraryAll
      .filter(t => t.status === "active")
      .map(t => parseLibraryTask(t));

    // Section C: Full searchable library — all non-archived tasks for ad-hoc additions
    const browse = libraryAll.map(t => parseLibraryTask(t));

    res.json({ critical: criticalItems, standard, browse });
  } catch (err) {
    req.log.error({ err }, "Failed to get build suggestions");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Quick-add — creates a daily task immediately AND queues a library entry for admin approval
router.post("/venues/:venueId/prep-tasks/quick-add", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const isAdmin = await assertVenueAdmin(venueId, req.userId!);
    const { title, description, category, section, shift, priority, quantity, unit, batchSize, prepDate, addToLibrary = true } = req.body as Record<string, unknown>;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const taskDate = (prepDate as string | undefined) ?? new Date().toISOString().slice(0, 10);

    // Create the daily task immediately
    const [task] = await db.insert(prepTasksTable).values({
      venueId,
      title: title as string,
      description: description as string | undefined,
      category: (category as string) ?? "other",
      section: (section as string) ?? "other",
      shift: (shift as string) ?? "all_day",
      priority: (priority as string) ?? "medium",
      status: "todo",
      quantity: quantity !== undefined ? String(quantity) : null,
      unit: unit as string | undefined,
      batchSize: batchSize as string | undefined,
      prepDate: taskDate,
      createdBy: req.userId!,
    }).returning();

    // Queue for library approval (admins go straight to active)
    let libraryTask = null;
    if (addToLibrary) {
      const [lib] = await db.insert(prepTaskLibraryTable).values({
        venueId,
        title: title as string,
        description: description as string | undefined,
        category: (category as string) ?? "other",
        section: (section as string) ?? "other",
        shift: (shift as string) ?? "all_day",
        priority: (priority as string) ?? "medium",
        quantity: quantity !== undefined ? String(quantity) : null,
        unit: unit as string | undefined,
        batchSize: batchSize as string | undefined,
        status: isAdmin ? "active" : "waiting_approval",
        createdBy: req.userId!,
      }).returning();
      if (lib) {
        // Link the daily task back to the library entry
        await db.update(prepTasksTable).set({ libraryTaskId: lib.id }).where(eq(prepTasksTable.id, task!.id));
        task!.libraryTaskId = lib.id;
        libraryTask = parseLibraryTask(lib);
      }
    }

    res.status(201).json({
      task: parseTask(task!),
      pendingLibraryApproval: addToLibrary && !isAdmin,
      libraryTaskId: libraryTask?.id ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to quick-add prep task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Claim or unclaim a task
router.post("/venues/:venueId/prep-tasks/:taskId/claim", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const taskId = parseInt(req.params["taskId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { claimedBy } = req.body as { claimedBy: string | null };
    const [updated] = await db.update(prepTasksTable)
      .set({ claimedBy: claimedBy ?? null, updatedAt: new Date() })
      .where(and(eq(prepTasksTable.id, taskId), eq(prepTasksTable.venueId, venueId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(parseTask(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to claim prep task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Build prep list from library — bulk create tasks from selected library entries
router.post("/venues/:venueId/prep-tasks/build-list", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { prepDate, items } = req.body as {
      prepDate: string;
      items: Array<{
        libraryTaskId: number;
        quantity?: number | null;
        unit?: string | null;
        batchSize?: string | null;
      }>;
    };
    if (!prepDate || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "prepDate and items are required" }); return;
    }

    // Load library tasks
    const libraryIds = items.map(i => i.libraryTaskId);
    const libraryTasks = await Promise.all(
      libraryIds.map(id =>
        db.select().from(prepTaskLibraryTable)
          .where(and(eq(prepTaskLibraryTable.id, id), eq(prepTaskLibraryTable.venueId, venueId)))
          .then(r => r[0])
      )
    );

    const created = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const lib = libraryTasks[i];
      if (!lib) continue;

      const [task] = await db.insert(prepTasksTable).values({
        venueId,
        title: lib.title,
        description: lib.description ?? undefined,
        category: lib.category,
        section: lib.section,
        shift: lib.shift,
        priority: lib.priority,
        status: "todo",
        quantity: item.quantity !== undefined && item.quantity !== null
          ? String(item.quantity)
          : lib.quantity ?? null,
        unit: item.unit ?? lib.unit ?? undefined,
        batchSize: item.batchSize ?? lib.batchSize ?? undefined,
        notes: lib.notes ?? undefined,
        recipeId: lib.recipeId ?? undefined,
        libraryTaskId: lib.id,
        prepDate,
      }).returning();
      if (task) created.push(task);
    }

    res.json(await enrichTasks(created));
  } catch (err) {
    req.log.error({ err }, "Failed to build prep list from library");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/prep-tasks/scan", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { imageBase64, mimeType = "image/jpeg" } = req.body as { imageBase64: string; mimeType?: string };
    if (!imageBase64) { res.status(400).json({ error: "imageBase64 is required" }); return; }

    const recipes = await db.select({ id: recipesTable.id, name: recipesTable.name })
      .from(recipesTable).where(eq(recipesTable.venueId, venueId));
    const recipeContext = recipes.length > 0
      ? `\n\nAvailable recipes in this kitchen (use their IDs for matchedRecipeId):\n${JSON.stringify(recipes)}\n- matchedRecipeId: integer ID of the best-matching recipe from the list above, or null if no clear match\n- matchedRecipeName: name of the matched recipe, or null`
      : "\n- matchedRecipeId: null\n- matchedRecipeName: null";

    const inventory = await db.select({ id: inventoryItemsTable.id, name: inventoryItemsTable.name, supplierId: inventoryItemsTable.supplierId })
      .from(inventoryItemsTable).where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true)));

    const response = await openai.chat.completions.create({
      model: "gpt-4o", max_completion_tokens: 3000,
      messages: [{ role: "user", content: [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" } },
        { type: "text", text: `You are an expert at reading professional kitchen prep lists — including handwritten whiteboards, chalkboards, and printed sheets.

Read EVERY word in this image, even if the handwriting is messy or at an angle. Extract ALL prep tasks and ALL notes.

IMPORTANT RULES:
1. Be aggressive — extract every item that looks like a kitchen task. If you can partially read it, include it.
2. Separate TASKS (things to cook/prep/portion/clean) from NOTES (stock counts, reminders, info like "we have X left" or "no more Y").
3. For AMBIGUOUS items (e.g. a dish name like "Paella" or "Risotto" with no action verb), mark them as needing clarification — they could mean "cook", "portion", "prep mise en place", etc.
4. For NOTES that mention a low quantity or stock issue (e.g. "9 pork belly left", "only 6 duck legs", "no more salmon"), set type to "stock_alert" and extract the item name and quantity.

Return JSON in this exact format:
{
  "tasks": [
    {
      "title": "short action-oriented task name (add action verb: Cook, Portion, Prep, Make, Cut, Clean, Trim, etc.)",
      "description": "extra detail if visible, omit if none",
      "category": one of: "meat"|"fish"|"veg"|"sauce"|"pastry"|"bakery"|"garnish"|"other",
      "section": one of: "hot_cook"|"make"|"cut"|"garde_manger"|"pastry"|"butchery"|"seafood"|"other",
      "shift": one of: "morning"|"afternoon"|"evening"|"all_day",
      "priority": one of: "low"|"medium"|"high"${recipeContext}
    }
  ],
  "notes": [
    {
      "text": "exact text of the note",
      "type": "stock_alert" or "info",
      "itemName": "inventory item name if identifiable, else null",
      "quantity": number if mentioned else null
    }
  ],
  "clarifications": [
    {
      "taskIndex": index of the ambiguous task in the tasks array,
      "text": "the raw ambiguous text",
      "options": ["Cook [item]", "Portion [item]", "Prep [item] mise en place", "Make [item] from scratch"]
    }
  ]
}

Return ONLY the JSON object. No markdown, no explanation.` },
      ]}],
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    let parsed: { tasks: unknown[]; notes?: unknown[]; clarifications?: unknown[] } = { tasks: [] };
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned) as { tasks: unknown[]; notes?: unknown[]; clarifications?: unknown[] };
    } catch { req.log.warn({ content }, "AI returned non-JSON for scan"); }
    res.json({ tasks: parsed.tasks ?? [], notes: parsed.notes ?? [], clarifications: parsed.clarifications ?? [] });
  } catch (err) {
    req.log.error({ err }, "Failed to scan prep list image");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/prep-tasks/suggest-instructions", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) { res.status(404).json({ error: "Venue not found" }); return; }
    const { title, category, quantity, unit } = req.body as { title?: string; category?: string; quantity?: number; unit?: string };
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const quantityContext = quantity && unit ? `Quantity: ${quantity} ${unit}. ` : quantity ? `Quantity: ${quantity}. ` : "";
    const categoryContext = category && category !== "other" ? `Category: ${category}. ` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 500,
      messages: [{
        role: "user",
        content: `You are an experienced senior chef writing concise, practical prep instructions for a professional kitchen.

Task: "${title}"
${quantityContext}${categoryContext}
Write 4-6 clear, action-oriented prep steps for this kitchen task. Each step should be a single, precise instruction.

Rules:
- Use imperative form: "Wash", "Slice", "Store" — no sentences
- Be specific about method, temperature, and storage where relevant
- Include food safety considerations where relevant
- Write for a professional kitchen (not a home cook)
- No numbering — just the steps, one per line
- No markdown, no headings — plain text lines only

Return only the steps, one per line.`,
      }],
    });

    const content = response.choices[0]?.message?.content ?? "";
    const steps = content
      .split("\n")
      .map((s: string) => s.replace(/^\d+\.\s*/, "").replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);

    res.json({ instructions: steps.join("\n") });
  } catch (err) {
    req.log.error({ err }, "Failed to suggest prep instructions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/staff", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) { res.status(404).json({ error: "Venue not found" }); return; }
    const staff = await db.select().from(venueStaffTable).where(eq(venueStaffTable.venueId, venueId));
    res.json(staff.map((s) => ({ id: s.id, venueId: s.venueId, name: s.name, role: s.role ?? null, createdAt: s.createdAt.toISOString() })));
  } catch (err) { req.log.error({ err }, "Failed to list venue staff"); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/venues/:venueId/staff", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) { res.status(403).json({ error: "Admin access required" }); return; }
    const { name, role } = req.body as Record<string, unknown>;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const [member] = await db.insert(venueStaffTable).values({ venueId, name: name as string, role: role as string | undefined }).returning();
    res.status(201).json({ id: member!.id, venueId: member!.venueId, name: member!.name, role: member!.role ?? null, createdAt: member!.createdAt.toISOString() });
  } catch (err) { req.log.error({ err }, "Failed to add staff member"); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/venues/:venueId/staff/:staffId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const staffId = parseInt(req.params["staffId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) { res.status(403).json({ error: "Admin access required" }); return; }
    await db.delete(venueStaffTable).where(and(eq(venueStaffTable.id, staffId), eq(venueStaffTable.venueId, venueId)));
    res.status(204).send();
  } catch (err) { req.log.error({ err }, "Failed to delete staff member"); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
