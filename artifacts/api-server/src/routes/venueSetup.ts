import { Router } from "express";
import { db } from "@workspace/db";
import { venuesTable, suppliersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/venues/:venueId/import-suppliers", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const venueId = parseInt(req.params["venueId"] as string);
    const { fromVenueId } = req.body as Record<string, unknown>;

    if (!fromVenueId) {
      res.status(400).json({ error: "fromVenueId is required" }); return;
    }
    const fromId = Number(fromVenueId);

    const [toVenue] = await db.select().from(venuesTable)
      .where(and(eq(venuesTable.id, venueId), eq(venuesTable.userId, userId)));
    const [fromVenue] = await db.select().from(venuesTable)
      .where(and(eq(venuesTable.id, fromId), eq(venuesTable.userId, userId)));

    if (!toVenue || !fromVenue) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const sourceSups = await db.select().from(suppliersTable)
      .where(eq(suppliersTable.venueId, fromId));

    if (sourceSups.length === 0) {
      res.json({ copied: 0, suppliers: [] }); return;
    }

    const inserted = await Promise.all(sourceSups.map(s =>
      db.insert(suppliersTable).values({
        venueId,
        name: s.name,
        contactName: s.contactName,
        email: s.email,
        phone: s.phone,
        website: s.website,
        deliveryDays: s.deliveryDays,
        orderCutoffTime: s.orderCutoffTime,
        minimumOrderValue: s.minimumOrderValue,
        deliveryFee: s.deliveryFee,
        notes: s.notes,
      }).returning().then(r => r[0]!)
    ));

    req.log.info({ venueId, fromId, count: inserted.length }, "Suppliers imported");
    res.json({ copied: inserted.length, suppliers: inserted.map(s => s.name) });
  } catch (err) {
    req.log.error({ err }, "Failed to import suppliers");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
