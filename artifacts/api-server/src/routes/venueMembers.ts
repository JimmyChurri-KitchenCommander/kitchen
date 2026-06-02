import { Router } from "express";
import { db } from "@workspace/db";
import { venuesTable, venueMembersTable, userProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { requireAuth } from "../middlewares/auth";
import { getVenueRole, assertVenueAdmin } from "../middlewares/venueAuth";
import { ne } from "drizzle-orm";
import { clerkClient } from "@clerk/express";

const router = Router();

function formatMember(
  m: typeof venueMembersTable.$inferSelect,
  displayName?: string | null,
) {
  return {
    id: m.id,
    venueId: m.venueId,
    clerkUserId: m.clerkUserId ?? null,
    displayName: displayName ?? null,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt?.toISOString() ?? null,
    removedAt: m.removedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/venues/:venueId/my-role", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const role = await getVenueRole(venueId, req.userId!);
    res.json({
      role,
      isOwner: role === "owner",
      isAdmin: role === "owner" || role === "admin",
      isUser: role === "user",
      canManage: role === "owner" || role === "admin",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get venue role");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/members", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const members = await db
      .select()
      .from(venueMembersTable)
      .where(eq(venueMembersTable.venueId, venueId));

    // Batch-fetch Clerk user names for members with a clerkUserId
    const clerkIds = members.map((m) => m.clerkUserId).filter((id): id is string => !!id);
    const nameMap = new Map<string, string>();
    if (clerkIds.length > 0) {
      try {
        const clerkUsers = await clerkClient.users.getUserList({ userId: clerkIds, limit: 100 });
        for (const u of clerkUsers.data) {
          const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
          nameMap.set(u.id, full || (u.emailAddresses[0]?.emailAddress ?? u.id));
        }
      } catch {
        // Non-fatal — fall back to no display name
      }
    }

    res.json(members.map((m) => formatMember(m, m.clerkUserId ? nameMap.get(m.clerkUserId) : null)));
  } catch (err) {
    req.log.error({ err }, "Failed to list venue members");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /venues/:venueId/members/:memberId/name — admin updates a team member's name
router.patch("/venues/:venueId/members/:memberId/name", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const memberId = parseInt(req.params["memberId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }

    const { firstName, lastName } = req.body as { firstName?: string; lastName?: string };
    if (!firstName?.trim()) {
      res.status(400).json({ error: "First name is required" }); return;
    }

    const [member] = await db
      .select()
      .from(venueMembersTable)
      .where(and(eq(venueMembersTable.id, memberId), eq(venueMembersTable.venueId, venueId)));
    if (!member) { res.status(404).json({ error: "Member not found" }); return; }
    if (!member.clerkUserId) { res.status(400).json({ error: "Member has no linked account" }); return; }

    const updated = await clerkClient.users.updateUser(member.clerkUserId, {
      firstName: firstName.trim(),
      lastName: lastName?.trim() ?? "",
    });

    // Upsert the user profile to mark name as admin-set (no count restriction applies)
    await db
      .insert(userProfilesTable)
      .values({ clerkUserId: member.clerkUserId, nameChangeCount: 1 })
      .onConflictDoUpdate({
        target: userProfilesTable.clerkUserId,
        set: { nameChangeCount: 1, updatedAt: new Date() },
      });

    res.json({
      displayName: [updated.firstName, updated.lastName].filter(Boolean).join(" "),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update member name");
    res.status(500).json({ error: "Could not update name" });
  }
});

router.post("/venues/:venueId/invite", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(venueMembersTable).values({
      venueId,
      role: "member",
      status: "invited",
      inviteToken: token,
      inviteExpiresAt: expiresAt,
    });
    res.json({ token, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to generate invite");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/join", requireAuth, async (req, res): Promise<void> => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) { res.status(400).json({ error: "token is required" }); return; }

    const [invite] = await db
      .select()
      .from(venueMembersTable)
      .where(eq(venueMembersTable.inviteToken, token));

    if (!invite) { res.status(404).json({ error: "Invite not found or already used" }); return; }
    if (invite.status !== "invited") { res.status(400).json({ error: "Invite has already been used" }); return; }
    if (invite.inviteExpiresAt && invite.inviteExpiresAt < new Date()) {
      res.status(400).json({ error: "Invite link has expired" }); return;
    }

    // Check if already an active member
    const [existing] = await db
      .select()
      .from(venueMembersTable)
      .where(and(eq(venueMembersTable.venueId, invite.venueId), eq(venueMembersTable.clerkUserId, req.userId!)));
    if (existing && existing.status === "active") {
      const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, invite.venueId));
      res.json({ venueId: invite.venueId, venueName: venue?.name ?? "Unknown" }); return;
    }

    const [member] = await db
      .update(venueMembersTable)
      .set({ clerkUserId: req.userId!, status: "active", joinedAt: new Date(), inviteToken: null, inviteExpiresAt: null })
      .where(eq(venueMembersTable.id, invite.id))
      .returning();
    const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, member.venueId));

    // Venue-invited users bypass the early-access gate — grant inviteVerified automatically
    try {
      await clerkClient.users.updateUserMetadata(req.userId!, {
        publicMetadata: { inviteVerified: true },
      });
    } catch (metaErr) {
      req.log.warn({ err: metaErr }, "Failed to set inviteVerified for venue-join user — non-fatal");
    }

    res.json({ venueId: member.venueId, venueName: venue?.name ?? "Unknown" });
  } catch (err) {
    req.log.error({ err }, "Failed to join venue");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/venues/:venueId/members/:memberId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const memberId = parseInt(req.params["memberId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const { role } = req.body as { role?: string };
    if (role && role !== "admin" && role !== "member") {
      res.status(400).json({ error: "role must be admin or member" }); return;
    }
    const updates: Record<string, unknown> = {};
    if (role) updates["role"] = role;
    const [member] = await db
      .update(venueMembersTable)
      .set(updates)
      .where(and(eq(venueMembersTable.id, memberId), eq(venueMembersTable.venueId, venueId)))
      .returning();
    if (!member) { res.status(404).json({ error: "Member not found" }); return; }
    res.json(formatMember(member));
  } catch (err) {
    req.log.error({ err }, "Failed to update venue member");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/venues/:venueId/members/:memberId", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const memberId = parseInt(req.params["memberId"] as string);
    if (!(await assertVenueAdmin(venueId, req.userId!))) {
      res.status(403).json({ error: "Admin access required" }); return;
    }
    const [member] = await db
      .update(venueMembersTable)
      .set({ status: "removed", removedAt: new Date() })
      .where(and(eq(venueMembersTable.id, memberId), eq(venueMembersTable.venueId, venueId)))
      .returning();
    if (!member) { res.status(404).json({ error: "Member not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to remove venue member");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── TRANSFER OWNERSHIP ───────────────────────────────────────────────────────

router.post("/venues/:venueId/transfer-ownership", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);

    // Only the owner can transfer ownership
    const currentRole = await getVenueRole(venueId, req.userId!);
    if (currentRole !== "owner") {
      res.status(403).json({ error: "Only the venue owner can transfer ownership" }); return;
    }

    const { newOwnerMemberId } = req.body as { newOwnerMemberId?: number };
    if (!newOwnerMemberId) {
      res.status(400).json({ error: "newOwnerMemberId is required" }); return;
    }

    // Fetch the target member
    const [target] = await db
      .select()
      .from(venueMembersTable)
      .where(and(
        eq(venueMembersTable.id, newOwnerMemberId),
        eq(venueMembersTable.venueId, venueId),
      ));

    if (!target || target.status !== "active") {
      res.status(404).json({ error: "Member not found or not active" }); return;
    }
    if (!target.clerkUserId) {
      res.status(400).json({ error: "Target member has no linked user account" }); return;
    }
    if (target.clerkUserId === req.userId!) {
      res.status(400).json({ error: "You are already the owner" }); return;
    }

    // 1. Update venue owner to the new user
    await db.update(venuesTable)
      .set({ userId: target.clerkUserId })
      .where(eq(venuesTable.id, venueId));

    // 2. Promote new owner's member row to admin (they're now tracked as owner via venuesTable.userId)
    await db.update(venueMembersTable)
      .set({ role: "admin" })
      .where(eq(venueMembersTable.id, newOwnerMemberId));

    // 3. Ensure the old owner has a member row so they keep access as admin
    const [existingOldOwnerRow] = await db
      .select()
      .from(venueMembersTable)
      .where(and(
        eq(venueMembersTable.venueId, venueId),
        eq(venueMembersTable.clerkUserId, req.userId!),
      ));

    if (existingOldOwnerRow) {
      // Restore if removed, set to admin
      await db.update(venueMembersTable)
        .set({ role: "admin", status: "active", removedAt: null })
        .where(eq(venueMembersTable.id, existingOldOwnerRow.id));
    } else {
      // Create a new member row for the old owner
      await db.insert(venueMembersTable).values({
        venueId,
        clerkUserId: req.userId!,
        role: "admin",
        status: "active",
        joinedAt: new Date(),
      });
    }

    req.log.info({ venueId, newOwnerClerkId: target.clerkUserId }, "Venue ownership transferred");
    res.json({ success: true, newOwnerClerkUserId: target.clerkUserId });
  } catch (err) {
    req.log.error({ err }, "Failed to transfer venue ownership");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
