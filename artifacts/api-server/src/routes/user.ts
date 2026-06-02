import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { userProfilesTable, venueMembersTable, venuesTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

async function isAdminOrOwnerOfAnyVenue(clerkUserId: string): Promise<boolean> {
  const [ownerVenue] = await db
    .select({ id: venuesTable.id })
    .from(venuesTable)
    .where(eq(venuesTable.userId, clerkUserId))
    .limit(1);
  if (ownerVenue) return true;

  const [adminRow] = await db
    .select({ id: venueMembersTable.id })
    .from(venueMembersTable)
    .where(
      and(
        eq(venueMembersTable.clerkUserId, clerkUserId),
        inArray(venueMembersTable.role, ["admin", "owner"]),
        eq(venueMembersTable.status, "active"),
      ),
    )
    .limit(1);
  return !!adminRow;
}

async function getOrCreateProfile(clerkUserId: string) {
  const [existing] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.clerkUserId, clerkUserId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(userProfilesTable)
    .values({ clerkUserId, nameChangeCount: 0 })
    .returning();
  return created!;
}

// GET /user/profile — return name change count and whether the user is an admin/owner
router.get("/user/profile", requireAuth, async (req, res): Promise<void> => {
  try {
    const [profile, admin] = await Promise.all([
      getOrCreateProfile(req.userId!),
      isAdminOrOwnerOfAnyVenue(req.userId!),
    ]);
    res.json({ nameChangeCount: profile.nameChangeCount, isAdmin: admin });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /user/profile — update own name (once for regular users; unlimited for admins/owners)
router.patch("/user/profile", requireAuth, async (req, res): Promise<void> => {
  try {
    const { firstName, lastName } = req.body as { firstName?: string; lastName?: string };
    if (!firstName?.trim()) {
      res.status(400).json({ error: "First name is required" }); return;
    }

    const [profile, admin] = await Promise.all([
      getOrCreateProfile(req.userId!),
      isAdminOrOwnerOfAnyVenue(req.userId!),
    ]);

    if (!admin && profile.nameChangeCount >= 1) {
      res.status(403).json({ error: "You can only set your name once. Ask an admin to update it for you." }); return;
    }

    const updated = await clerkClient.users.updateUser(req.userId!, {
      firstName: firstName.trim(),
      lastName: lastName?.trim() ?? "",
    });

    await db
      .update(userProfilesTable)
      .set({ nameChangeCount: profile.nameChangeCount + 1, updatedAt: new Date() })
      .where(eq(userProfilesTable.clerkUserId, req.userId!));

    res.json({
      firstName: updated.firstName,
      lastName: updated.lastName,
      fullName: [updated.firstName, updated.lastName].filter(Boolean).join(" "),
      nameChangeCount: profile.nameChangeCount + 1,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update user profile");
    res.status(500).json({ error: "Could not update name" });
  }
});

export default router;
