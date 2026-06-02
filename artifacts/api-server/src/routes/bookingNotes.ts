import { Router } from "express";
import { db } from "@workspace/db";
import { venueBookingNotesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess, assertVenueAdmin } from "../middlewares/venueAuth";

const router = Router();

function parseNote(n: typeof venueBookingNotesTable.$inferSelect) {
  return {
    id: n.id,
    venueId: n.venueId,
    notes: n.notes,
    eventDate: n.eventDate ?? null,
    addedBy: n.addedBy ?? null,
    updatedAt: n.updatedAt ? n.updatedAt.toISOString() : null,
    updatedBy: n.updatedBy ?? null,
  };
}

// Get (or auto-create) booking notes for a venue
router.get("/venues/:venueId/booking-notes", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const [existing] = await db.select().from(venueBookingNotesTable).where(eq(venueBookingNotesTable.venueId, venueId));
    if (existing) {
      res.json(parseNote(existing)); return;
    }
    const [created] = await db.insert(venueBookingNotesTable).values({ venueId, notes: "" }).returning();
    res.json(parseNote(created!));
  } catch (err) {
    req.log.error({ err }, "Failed to get booking notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update booking notes — admin only (shared operational record, not per-member)
router.patch("/venues/:venueId/booking-notes", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Only admins can update booking notes" }); return;
    }
    const { notes, eventDate, addedBy } = req.body as { notes: string; eventDate?: string | null; addedBy?: string | null };
    if (typeof notes !== "string") { res.status(400).json({ error: "notes must be a string" }); return; }

    const updates: Partial<typeof venueBookingNotesTable.$inferInsert> = {
      notes,
      updatedAt: new Date(),
      updatedBy: req.userId!,
    };
    if (eventDate !== undefined) updates.eventDate = eventDate ?? undefined;
    if (addedBy !== undefined) updates.addedBy = addedBy ?? undefined;

    const [existing] = await db.select().from(venueBookingNotesTable).where(eq(venueBookingNotesTable.venueId, venueId));
    if (existing) {
      const [updated] = await db.update(venueBookingNotesTable)
        .set(updates)
        .where(eq(venueBookingNotesTable.venueId, venueId))
        .returning();
      res.json(parseNote(updated!));
    } else {
      const [created] = await db.insert(venueBookingNotesTable)
        .values({ venueId, ...updates })
        .returning();
      res.json(parseNote(created!));
    }
  } catch (err) {
    req.log.error({ err }, "Failed to update booking notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
