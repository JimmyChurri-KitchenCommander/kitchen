import { Router } from "express";
import { db } from "@workspace/db";
import {
  chemicalsTable, complianceTasksTable, venuesTable, cleaningTaskChemicalsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function assertVenueOwner(venueId: number, userId: string): Promise<boolean> {
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  return !!(venue && venue.userId === userId);
}

// ── Compliance status computation ─────────────────────────────────────────────
// Primary states: VALID | EXPIRING_SOON | EXPIRED | MISSING_MSDS
// Derived: BLOCKED = (status === EXPIRED || status === MISSING_MSDS)
//
// Storage column `complianceStatus` is kept for backward-compatibility but the
// API always recomputes fresh from msdsUrl + msdsExpiryDate on every read.
type ComplianceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "MISSING_MSDS";
const EXPIRING_SOON_DAYS = 30;

function computeStatus(
  msdsUrl: string | null | undefined,
  msdsExpiryDate: string | null | undefined,
): { status: ComplianceStatus; reason: string | null; daysUntilExpiry: number | null; isBlocked: boolean } {
  if (!msdsUrl || msdsUrl.trim() === "") {
    return { status: "MISSING_MSDS", reason: "Missing MSDS — Safety Data Sheet not attached", daysUntilExpiry: null, isBlocked: true };
  }
  if (!msdsExpiryDate) {
    return { status: "VALID", reason: null, daysUntilExpiry: null, isBlocked: false };
  }
  const expiry = new Date(msdsExpiryDate + "T00:00:00Z");
  const now = new Date();
  const days = Math.floor((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) {
    return { status: "EXPIRED", reason: `MSDS expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`, daysUntilExpiry: days, isBlocked: true };
  }
  if (days <= EXPIRING_SOON_DAYS) {
    return { status: "EXPIRING_SOON", reason: `MSDS expires in ${days} day${days === 1 ? "" : "s"}`, daysUntilExpiry: days, isBlocked: false };
  }
  return { status: "VALID", reason: null, daysUntilExpiry: days, isBlocked: false };
}

function parseChemical(c: typeof chemicalsTable.$inferSelect) {
  const computed = computeStatus(c.msdsUrl, c.msdsExpiryDate);
  // Auto-enforce: BLOCKED chemicals cannot remain active.
  const effectiveActive = computed.isBlocked ? false : c.isActive;
  return {
    id: c.id,
    venueId: c.venueId,
    name: c.name,
    type: c.type,
    dilutionRatio: c.dilutionRatio ?? null,
    contactTimeSeconds: c.contactTimeSeconds ?? null,
    ppeRequired: c.ppeRequired ?? null,
    sopInstructions: c.sopInstructions ?? null,
    msdsUrl: c.msdsUrl ?? null,
    msdsExpiryDate: c.msdsExpiryDate ?? null,
    msdsVersion: c.msdsVersion ?? null,
    complianceStatus: computed.status,
    complianceReason: computed.reason,
    daysUntilExpiry: computed.daysUntilExpiry,
    isActive: effectiveActive,
    notes: c.notes ?? null,
    createdBy: c.createdBy ?? null,
    updatedBy: c.updatedBy ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
  };
}

function parseComplianceTask(t: typeof complianceTasksTable.$inferSelect) {
  return {
    id: t.id,
    venueId: t.venueId,
    chemicalId: t.chemicalId ?? null,
    type: t.type,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
    resolvedBy: t.resolvedBy ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt ? t.updatedAt.toISOString() : null,
  };
}

type ChemicalInput = {
  name?: string;
  type?: string;
  dilutionRatio?: string | null;
  contactTimeSeconds?: number | null;
  ppeRequired?: string | null;
  sopInstructions?: string | null;
  msdsUrl?: string | null;
  msdsExpiryDate?: string | null;
  msdsVersion?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

// ── GET /venues/:venueId/chemicals ────────────────────────────────────────────
router.get("/venues/:venueId/chemicals", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  const rows = await db.select().from(chemicalsTable)
    .where(eq(chemicalsTable.venueId, venueId))
    .orderBy(chemicalsTable.name);

  res.json(rows.map(parseChemical));
});

// ── POST /venues/:venueId/chemicals ───────────────────────────────────────────
router.post("/venues/:venueId/chemicals", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  const data = req.body as ChemicalInput;
  if (!data.name?.trim()) { res.status(400).json({ error: "name is required" }); return; }
  const computed = computeStatus(data.msdsUrl ?? null, data.msdsExpiryDate ?? null);

  const [chemical] = await db.insert(chemicalsTable).values({
    venueId,
    name: data.name,
    type: data.type,
    dilutionRatio: data.dilutionRatio ?? null,
    contactTimeSeconds: data.contactTimeSeconds ?? null,
    ppeRequired: data.ppeRequired ?? null,
    sopInstructions: data.sopInstructions ?? null,
    msdsUrl: data.msdsUrl ?? null,
    msdsExpiryDate: data.msdsExpiryDate ?? null,
    msdsVersion: data.msdsVersion ?? null,
    complianceStatus: computed.status,
    notes: data.notes ?? null,
    createdBy: req.userId!,
    // BLOCKED chemicals cannot be active — enforced server-side.
    isActive: computed.isBlocked ? false : (data.isActive ?? true),
  }).returning();

  // Auto-create compliance task for any blocking or expiring condition.
  if (computed.status === "MISSING_MSDS") {
    await db.insert(complianceTasksTable).values({
      venueId,
      chemicalId: chemical!.id,
      type: "attach_msds",
      title: `Attach MSDS for ${data.name}`,
      description: "A Safety Data Sheet (MSDS/SDS) is required for all chemicals used in the kitchen.",
      status: "pending",
    });
  } else if (computed.status === "EXPIRED") {
    await db.insert(complianceTasksTable).values({
      venueId, chemicalId: chemical!.id, type: "renew_msds",
      title: `Renew expired MSDS for ${data.name}`, status: "pending",
    });
  } else if (computed.status === "EXPIRING_SOON") {
    await db.insert(complianceTasksTable).values({
      venueId, chemicalId: chemical!.id, type: "renew_msds",
      title: `MSDS expiring soon — renew for ${data.name}`, status: "pending",
    });
  }

  res.status(201).json(parseChemical(chemical!));
});

// ── PATCH /venues/:venueId/chemicals/:chemicalId ──────────────────────────────
router.patch("/venues/:venueId/chemicals/:chemicalId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  const chemicalId = parseInt(req.params["chemicalId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  const [existing] = await db.select().from(chemicalsTable)
    .where(and(eq(chemicalsTable.id, chemicalId), eq(chemicalsTable.venueId, venueId)));
  if (!existing) { res.status(404).json({ error: "Chemical not found" }); return; }

  const data = req.body as ChemicalInput;
  const newMsdsUrl = "msdsUrl" in data ? (data.msdsUrl ?? null) : existing.msdsUrl;
  const newMsdsExpiry = "msdsExpiryDate" in data ? (data.msdsExpiryDate ?? null) : existing.msdsExpiryDate;
  const computed = computeStatus(newMsdsUrl, newMsdsExpiry);

  // Enforcement: a BLOCKED chemical can never be marked active.
  const requestedActive = "isActive" in data ? data.isActive : existing.isActive;
  const effectiveActive = computed.isBlocked ? false : (requestedActive ?? true);

  const [updated] = await db.update(chemicalsTable).set({
    ...data,
    isActive: effectiveActive,
    complianceStatus: computed.status,
    updatedBy: req.userId!,
    updatedAt: new Date(),
  }).where(and(eq(chemicalsTable.id, chemicalId), eq(chemicalsTable.venueId, venueId))).returning();

  // Resolve any pending compliance tasks if chemical is now VALID
  if (computed.status === "VALID" && existing.complianceStatus !== "VALID") {
    await db.update(complianceTasksTable).set({
      status: "resolved", resolvedAt: new Date(), resolvedBy: req.userId!,
    }).where(and(
      eq(complianceTasksTable.chemicalId, chemicalId),
      eq(complianceTasksTable.status, "pending"),
    ));
  }

  res.json(parseChemical(updated!));
});

// ── DELETE /venues/:venueId/chemicals/:chemicalId ─────────────────────────────
router.delete("/venues/:venueId/chemicals/:chemicalId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  const chemicalId = parseInt(req.params["chemicalId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(chemicalsTable).set({ isActive: false, updatedAt: new Date(), updatedBy: req.userId! })
    .where(and(eq(chemicalsTable.id, chemicalId), eq(chemicalsTable.venueId, venueId)));

  res.status(204).send();
});

// ── GET /venues/:venueId/compliance/summary ───────────────────────────────────
router.get("/venues/:venueId/compliance/summary", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  const rows = await db.select().from(chemicalsTable)
    .where(eq(chemicalsTable.venueId, venueId));

  // We score only chemicals the venue actually wants to use. A chemical that
  // a user explicitly deactivated (isActive=false AND not BLOCKED) is excluded.
  const tracked = rows.filter((c) => {
    const status = computeStatus(c.msdsUrl, c.msdsExpiryDate);
    return c.isActive || status.isBlocked;
  });

  let validCount = 0, expiringSoonCount = 0, expiredCount = 0, missingMsdsCount = 0;
  type ExpiryEntry = { chemicalId: number; name: string; daysUntilExpiry: number; status: ComplianceStatus };
  const expiries: ExpiryEntry[] = [];

  for (const c of tracked) {
    const s = computeStatus(c.msdsUrl, c.msdsExpiryDate);
    if (s.status === "VALID") validCount++;
    else if (s.status === "EXPIRING_SOON") expiringSoonCount++;
    else if (s.status === "EXPIRED") expiredCount++;
    else missingMsdsCount++;
    if (s.daysUntilExpiry !== null) {
      expiries.push({ chemicalId: c.id, name: c.name, daysUntilExpiry: s.daysUntilExpiry, status: s.status });
    }
  }

  const totalActive = tracked.length;
  const blockedCount = expiredCount + missingMsdsCount;
  const score = totalActive === 0 ? 100 : Math.round((validCount / totalActive) * 100);

  const upcomingExpiries = expiries
    .filter((e) => e.daysUntilExpiry <= EXPIRING_SOON_DAYS)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, 5);

  res.json({
    score, totalActive, validCount, expiringSoonCount, expiredCount,
    missingMsdsCount, blockedCount, upcomingExpiries,
  });
});

// ── GET /venues/:venueId/compliance-tasks ─────────────────────────────────────
router.get("/venues/:venueId/compliance-tasks", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  const rows = await db.select().from(complianceTasksTable)
    .where(eq(complianceTasksTable.venueId, venueId))
    .orderBy(desc(complianceTasksTable.createdAt));

  res.json(rows.map(parseComplianceTask));
});

// ── POST /venues/:venueId/compliance-tasks/:taskId/resolve ────────────────────
router.post("/venues/:venueId/compliance-tasks/:taskId/resolve", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  const taskId = parseInt(req.params["taskId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db.update(complianceTasksTable).set({
    status: "resolved",
    resolvedAt: new Date(),
    resolvedBy: req.userId!,
    updatedAt: new Date(),
  }).where(and(
    eq(complianceTasksTable.id, taskId),
    eq(complianceTasksTable.venueId, venueId),
  )).returning();

  if (!updated) { res.status(404).json({ error: "Task not found" }); return; }

  res.json(parseComplianceTask(updated));
});

// ── GET /venues/:venueId/chemicals/:chemicalId/alternatives ──────────────────
// Returns active chemicals of the same type with VALID compliance — suitable
// drop-in replacements when the requested chemical is blocked.
router.get("/venues/:venueId/chemicals/:chemicalId/alternatives", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  const chemicalId = parseInt(req.params["chemicalId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  const [target] = await db.select().from(chemicalsTable)
    .where(and(eq(chemicalsTable.id, chemicalId), eq(chemicalsTable.venueId, venueId)));
  if (!target) { res.status(404).json({ error: "Chemical not found" }); return; }

  const candidates = await db.select().from(chemicalsTable)
    .where(and(eq(chemicalsTable.venueId, venueId), eq(chemicalsTable.type, target.type), eq(chemicalsTable.isActive, true)));

  const alternatives = candidates
    .filter(c => c.id !== chemicalId)
    .map(parseChemical)
    .filter(c => c.complianceStatus === "VALID");

  res.json(alternatives);
});

// ── POST /venues/:venueId/chemicals/:chemicalId/cleaning-links ────────────────
router.post("/venues/:venueId/chemicals/:chemicalId/cleaning-links", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseInt(req.params["venueId"] as string);
  const chemicalId = parseInt(req.params["chemicalId"] as string);
  if (!await assertVenueOwner(venueId, req.userId!)) { res.status(403).json({ error: "Forbidden" }); return; }

  // BLOCKED chemicals cannot be linked into approved workflows — suggest alternatives.
  const [chem] = await db.select().from(chemicalsTable)
    .where(and(eq(chemicalsTable.id, chemicalId), eq(chemicalsTable.venueId, venueId)));
  if (!chem) { res.status(404).json({ error: "Chemical not found" }); return; }
  const computed = computeStatus(chem.msdsUrl, chem.msdsExpiryDate);
  if (computed.isBlocked) {
    const candidates = await db.select().from(chemicalsTable)
      .where(and(eq(chemicalsTable.venueId, venueId), eq(chemicalsTable.type, chem.type), eq(chemicalsTable.isActive, true)));
    const alternatives = candidates
      .filter(c => c.id !== chemicalId)
      .map(parseChemical)
      .filter(c => c.complianceStatus === "VALID");
    res.status(409).json({
      error: "Chemical is blocked from approved workflows",
      reason: computed.reason,
      complianceStatus: computed.status,
      alternatives,
    });
    return;
  }

  const { cleaningTaskId, notes } = req.body as { cleaningTaskId: number; notes?: string };
  if (!cleaningTaskId) { res.status(400).json({ error: "cleaningTaskId required" }); return; }

  const [link] = await db.insert(cleaningTaskChemicalsTable).values({
    cleaningTaskId,
    chemicalId,
    notes: notes ?? null,
  }).returning();

  res.status(201).json(link);
});

export default router;
