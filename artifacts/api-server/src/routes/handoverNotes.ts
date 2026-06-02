import { Router } from "express";
import { db } from "@workspace/db";
import { handoverNotesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function parseId(raw: string): number | null {
  const n = parseInt(raw);
  return isNaN(n) ? null : n;
}

// ── List handover notes for a venue ───────────────────────────────────────────
router.get("/venues/:venueId/handover-notes", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const limit = req.query["limit"] ? parseInt(req.query["limit"] as string) : 50;
    const notes = await db
      .select()
      .from(handoverNotesTable)
      .where(eq(handoverNotesTable.venueId, venueId))
      .orderBy(desc(handoverNotesTable.isPinned), desc(handoverNotesTable.createdAt))
      .limit(limit);
    res.json(notes);
  } catch (err) {
    req.log.error({ err }, "Failed to list handover notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create a handover note ─────────────────────────────────────────────────────
router.post("/venues/:venueId/handover-notes", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const { content, shift, isPinned, createdBy } = req.body as {
      content?: string;
      shift?: string;
      isPinned?: boolean;
      createdBy?: string;
    };
    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: "content is required" }); return;
    }
    const [note] = await db.insert(handoverNotesTable).values({
      venueId,
      content: content.trim(),
      shift: shift ?? null,
      isPinned: isPinned ?? false,
      createdBy: createdBy ?? req.userId ?? null,
    }).returning();
    res.status(201).json(note);
  } catch (err) {
    req.log.error({ err }, "Failed to create handover note");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update (pin/edit) a handover note ─────────────────────────────────────────
router.patch("/venues/:venueId/handover-notes/:noteId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const noteId = parseId(req.params["noteId"] as string);
  if (!venueId || !noteId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { content, shift, isPinned } = req.body as {
      content?: string;
      shift?: string;
      isPinned?: boolean;
    };
    const [existing] = await db
      .select({ id: handoverNotesTable.id })
      .from(handoverNotesTable)
      .where(and(eq(handoverNotesTable.id, noteId), eq(handoverNotesTable.venueId, venueId)));
    if (!existing) { res.status(404).json({ error: "Note not found" }); return; }

    const updates: Partial<typeof handoverNotesTable.$inferInsert> = {};
    if (content !== undefined) updates.content = content.trim();
    if (shift !== undefined) updates.shift = shift;
    if (isPinned !== undefined) updates.isPinned = isPinned;

    const [updated] = await db
      .update(handoverNotesTable)
      .set(updates)
      .where(and(eq(handoverNotesTable.id, noteId), eq(handoverNotesTable.venueId, venueId)))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update handover note");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete a handover note ─────────────────────────────────────────────────────
router.delete("/venues/:venueId/handover-notes/:noteId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const noteId = parseId(req.params["noteId"] as string);
  if (!venueId || !noteId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [deleted] = await db
      .delete(handoverNotesTable)
      .where(and(eq(handoverNotesTable.id, noteId), eq(handoverNotesTable.venueId, venueId)))
      .returning({ id: handoverNotesTable.id });
    if (!deleted) { res.status(404).json({ error: "Note not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete handover note");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
