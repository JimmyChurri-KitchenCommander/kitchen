import { Router } from "express";
import { db } from "@workspace/db";
import { venuesTable, venueMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getVenueRole } from "../middlewares/venueAuth";
import { clerkClient } from "@clerk/express";

const ALLOWED_VENUE_CREATORS = [
  "james.garrett2304@gmail.com",
];

async function canCreateVenue(userId: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    // Allow anyone with inviteVerified to create their first venue during onboarding
    const hasInvite = user.publicMetadata?.inviteVerified === true;
    const isAllowed = ALLOWED_VENUE_CREATORS.some((allowed) => emails.includes(allowed.toLowerCase()));
    return isAllowed || hasInvite;
  } catch {
    return false;
  }
}

const router = Router();

router.get("/venues", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const ownedVenues = await db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.userId, userId));

    const memberRows = await db
      .select({ venue: venuesTable })
      .from(venueMembersTable)
      .innerJoin(venuesTable, eq(venueMembersTable.venueId, venuesTable.id))
      .where(and(eq(venueMembersTable.clerkUserId, userId), eq(venueMembersTable.status, "active")));

    const all = [...ownedVenues];
    for (const { venue } of memberRows) {
      if (!all.some((v) => v.id === venue.id)) all.push(venue);
    }
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Failed to list venues");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues", requireAuth, async (req, res): Promise<void> => {
  try {
    if (!(await canCreateVenue(req.userId!))) {
      res.status(403).json({ error: "You do not have permission to create venues." }); return;
    }
    const { name, address, timezone, currency, venueType } = req.body as Record<string, string>;
    const teamSize = req.body.teamSize != null ? parseInt(String(req.body.teamSize)) : undefined;
    const avgCoversPerService = req.body.avgCoversPerService != null ? parseInt(String(req.body.avgCoversPerService)) : undefined;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const [venue] = await db
      .insert(venuesTable)
      .values({ userId: req.userId!, name, address, timezone, currency: currency ?? "AUD", venueType, teamSize, avgCoversPerService })
      .returning();
    res.status(201).json(venue);
  } catch (err) {
    req.log.error({ err }, "Failed to create venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
    if (!venue) { res.status(404).json({ error: "Venue not found" }); return; }
    const role = await getVenueRole(venueId, req.userId!);
    if (role === "none") { res.status(404).json({ error: "Venue not found" }); return; }
    res.json(venue);
  } catch (err) {
    req.log.error({ err }, "Failed to get venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const [existing] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const body = req.body as Record<string, unknown>;
    const updateData: Partial<typeof venuesTable.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (body.name !== undefined) updateData.name = body.name as string;
    if (body.address !== undefined) updateData.address = body.address as string;
    if (body.timezone !== undefined) updateData.timezone = body.timezone as string;
    if (body.currency !== undefined) updateData.currency = body.currency as string;
    if (body.venueType !== undefined) updateData.venueType = body.venueType as string;
    if (body.teamSize !== undefined) updateData.teamSize = parseInt(String(body.teamSize));
    if (body.avgCoversPerService !== undefined) updateData.avgCoversPerService = parseInt(String(body.avgCoversPerService));
    if (body.onboardingCompleted !== undefined) updateData.onboardingCompleted = Boolean(body.onboardingCompleted);
    if (body.enabledModules !== undefined) updateData.enabledModules = body.enabledModules as string[];
    if (body.kitchenAreas !== undefined) updateData.kitchenAreas = body.kitchenAreas as string[];
    if (body.staffRole !== undefined) updateData.staffRole = body.staffRole as string;
    if (body.serviceWindows !== undefined) updateData.serviceWindows = body.serviceWindows as import("@workspace/db").ServiceWindow[] | null;
    if (body.serviceModeConfig !== undefined) updateData.serviceModeConfig = body.serviceModeConfig as import("@workspace/db").ServiceModeConfig | null;

    const [venue] = await db
      .update(venuesTable)
      .set(updateData)
      .where(eq(venuesTable.id, venueId))
      .returning();
    res.json(venue);
  } catch (err) {
    req.log.error({ err }, "Failed to update venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const [existing] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
    if (!existing || existing.userId !== req.userId) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    await db.delete(venuesTable).where(eq(venuesTable.id, venueId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
