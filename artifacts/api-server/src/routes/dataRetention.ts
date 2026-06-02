import { Router } from "express";
import { db } from "@workspace/db";
import {
  venuesTable, exportSettingsTable, exportLogsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueOwner, assertVenueAdmin, assertVenueAccess, getVenueRole } from "../middlewares/venueAuth";
import { generateExport, type ExportType } from "../lib/exportGenerators";
import { sendExportEmail, isEmailConfigured } from "../lib/emailService";
import { clerkClient } from "@clerk/express";

const router = Router();

const VALID_TYPES: ExportType[] = ["waste", "food-cost", "stocktake", "inventory", "temperature", "suppliers"];
const VALID_FREQUENCIES = ["off", "weekly", "monthly", "quarterly"];

// ── Shared recipient type ──────────────────────────────────────────────────────
interface RecipientEntry {
  email: string;
  name?: string;
  optedIn: boolean;
}

/** Coerce legacy string[] entries to RecipientEntry objects */
function normaliseRecipients(raw: unknown[]): RecipientEntry[] {
  return raw.map(item => {
    if (typeof item === "string") return { email: item, optedIn: true };
    const r = item as Partial<RecipientEntry>;
    return { email: r.email ?? "", name: r.name, optedIn: r.optedIn !== false };
  }).filter(r => r.email.includes("@"));
}

function computeNextRun(frequency: string, from: Date = new Date()): Date | null {
  switch (frequency) {
    case "weekly": { const d = new Date(from); d.setDate(d.getDate() + 7); d.setHours(6, 0, 0, 0); return d; }
    case "monthly": { const d = new Date(from); d.setMonth(d.getMonth() + 1, 1); d.setHours(6, 0, 0, 0); return d; }
    case "quarterly": { const d = new Date(from); d.setMonth(d.getMonth() + 3, 1); d.setHours(6, 0, 0, 0); return d; }
    default: return null;
  }
}

function periodForFrequency(frequency: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  switch (frequency) {
    case "weekly": from.setDate(from.getDate() - 7); break;
    case "monthly": from.setMonth(from.getMonth() - 1); break;
    case "quarterly": from.setMonth(from.getMonth() - 3); break;
    default: from.setDate(from.getDate() - 30);
  }
  return { from, to };
}

/** Fetch owner display name + email from Clerk */
async function getOwnerInfo(userId: string): Promise<{ name: string; email: string }> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const firstName = user.firstName ?? "";
    const lastName = user.lastName ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || user.username || "The Owner";
    const email = user.emailAddresses[0]?.emailAddress ?? "";
    return { name, email };
  } catch {
    return { name: "The Owner", email: "" };
  }
}

// ─── GET /venues/:venueId/export-settings ─────────────────────────────────────
router.get("/venues/:venueId/export-settings", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const canAccess = await assertVenueAccess(venueId, req.userId!);
    if (!canAccess) { res.status(403).json({ error: "Forbidden" }); return; }

    const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
    const [settings] = await db.select().from(exportSettingsTable).where(eq(exportSettingsTable.venueId, venueId));
    const role = await getVenueRole(venueId, req.userId!);
    const ownerInfo = await getOwnerInfo(venue.userId);
    const emailConfigured = isEmailConfigured();

    if (!settings) {
      res.json({
        venueId,
        frequency: "off",
        exportTypes: ["waste", "food-cost", "stocktake"],
        additionalRecipients: [],
        ownerOptedIn: true,
        ownerName: ownerInfo.name,
        ownerEmail: ownerInfo.email,
        nextRunAt: null,
        lastRunAt: null,
        emailConfigured,
        role,
      });
      return;
    }

    const normalised = normaliseRecipients((settings.additionalRecipients as unknown[]) ?? []);
    res.json({
      ...settings,
      additionalRecipients: normalised,
      ownerOptedIn: settings.ownerOptedIn ?? true,
      ownerName: ownerInfo.name,
      ownerEmail: ownerInfo.email,
      emailConfigured,
      role,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get export settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /venues/:venueId/export-settings ─────────────────────────────────────
router.put("/venues/:venueId/export-settings", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const role = await getVenueRole(venueId, req.userId!);
    const isAdmin = role === "owner" || role === "admin";
    const isOwner = role === "owner";

    if (!isAdmin) { res.status(403).json({ error: "Admin or owner access required" }); return; }

    const { frequency, exportTypes, additionalRecipients, ownerOptedIn } = req.body as {
      frequency?: string;
      exportTypes?: string[];
      additionalRecipients?: RecipientEntry[];
      ownerOptedIn?: boolean;
    };

    if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
      res.status(400).json({ error: "Invalid frequency" }); return;
    }
    if (exportTypes !== undefined && (!Array.isArray(exportTypes) || exportTypes.some(t => !VALID_TYPES.includes(t as ExportType)))) {
      res.status(400).json({ error: "Invalid export types" }); return;
    }

    // Only the venue owner may modify the recipient list or owner opted-in flag
    if (!isOwner && (additionalRecipients !== undefined || ownerOptedIn !== undefined)) {
      res.status(403).json({ error: "Only the venue owner can manage email recipients" }); return;
    }

    const [existing] = await db.select().from(exportSettingsTable).where(eq(exportSettingsTable.venueId, venueId));
    const currentAdditional = normaliseRecipients((existing?.additionalRecipients as unknown[]) ?? []);
    const currentOwnerOptedIn = existing?.ownerOptedIn ?? true;

    const nextFrequency = frequency ?? existing?.frequency ?? "off";
    const nextRunAt = computeNextRun(nextFrequency);
    const updatePayload = {
      frequency: nextFrequency,
      exportTypes: exportTypes ?? (existing?.exportTypes as string[] ?? ["waste", "food-cost", "stocktake"]),
      additionalRecipients: isOwner && additionalRecipients !== undefined
        ? additionalRecipients.filter(r => r.email?.includes("@"))
        : currentAdditional,
      ownerOptedIn: isOwner && ownerOptedIn !== undefined ? ownerOptedIn : currentOwnerOptedIn,
      nextRunAt,
      updatedAt: new Date(),
    };

    let updated;
    if (existing) {
      [updated] = await db.update(exportSettingsTable).set(updatePayload).where(eq(exportSettingsTable.venueId, venueId)).returning();
    } else {
      [updated] = await db.insert(exportSettingsTable).values({ venueId, ...updatePayload }).returning();
    }

    const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
    const ownerInfo = await getOwnerInfo(venue.userId);
    const normalised = normaliseRecipients((updated.additionalRecipients as unknown[]) ?? []);
    res.json({ ...updated, additionalRecipients: normalised, ownerName: ownerInfo.name, ownerEmail: ownerInfo.email, emailConfigured: isEmailConfigured(), role });
  } catch (err) {
    req.log.error({ err }, "Failed to update export settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /venues/:venueId/exports/trigger ────────────────────────────────────
router.post("/venues/:venueId/exports/trigger", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const isAdmin = await assertVenueAdmin(venueId, req.userId!);
    if (!isAdmin) { res.status(403).json({ error: "Admin or owner access required" }); return; }

    const { type, from, to } = req.body as { type: string; from?: string; to?: string };
    if (!type || !VALID_TYPES.includes(type as ExportType)) {
      res.status(400).json({ error: "Invalid export type" }); return;
    }

    const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; })();
    const toDate = to ? new Date(to + "T23:59:59") : new Date();

    let exported;
    try {
      exported = await generateExport(venueId, type as ExportType, fromDate, toDate);
    } catch (genErr) {
      const errMsg = genErr instanceof Error ? genErr.message : String(genErr);
      const [log] = await db.insert(exportLogsTable).values({
        venueId, exportType: type, triggeredBy: req.userId!,
        status: "failed", errorMessage: errMsg,
        dateFrom: fromDate.toISOString().split("T")[0],
        dateTo: toDate.toISOString().split("T")[0],
        emailedTo: [],
      }).returning();
      res.status(500).json({ error: "Export generation failed", log }); return;
    }

    const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
    const [settings] = await db.select().from(exportSettingsTable).where(eq(exportSettingsTable.venueId, venueId));
    const ownerInfo = await getOwnerInfo(venue.userId);

    // Build opted-in recipients
    const recipients: string[] = [];
    if (settings?.ownerOptedIn !== false && ownerInfo.email) recipients.push(ownerInfo.email);
    const extra = normaliseRecipients((settings?.additionalRecipients as unknown[]) ?? []);
    for (const r of extra) {
      if (r.optedIn && r.email) recipients.push(r.email);
    }
    const uniqueRecipients = [...new Set(recipients)];

    let emailedTo: string[] = [];
    if (uniqueRecipients.length > 0) {
      const result = await sendExportEmail({
        to: uniqueRecipients,
        venueName: venue.name,
        ownerName: ownerInfo.name,
        ownerEmail: ownerInfo.email,
        exportType: type,
        fileName: exported.fileName,
        csvContent: exported.csv,
        periodLabel: `${fromDate.toLocaleDateString("en-AU")} – ${toDate.toLocaleDateString("en-AU")}`,
        recordCount: exported.recordCount,
      });
      if (result.sent) emailedTo = uniqueRecipients;
    }

    const [log] = await db.insert(exportLogsTable).values({
      venueId, exportType: type, triggeredBy: req.userId!,
      status: "success",
      fileName: exported.fileName, recordCount: exported.recordCount,
      dateFrom: fromDate.toISOString().split("T")[0],
      dateTo: toDate.toISOString().split("T")[0],
      emailedTo,
    }).returning();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${exported.fileName}"`);
    res.setHeader("X-Export-Log-Id", String(log.id));
    res.setHeader("X-Emailed-To", emailedTo.join(", "));
    res.send(exported.csv);
  } catch (err) {
    req.log.error({ err }, "Failed to trigger export");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /venues/:venueId/export-logs ─────────────────────────────────────────
router.get("/venues/:venueId/export-logs", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const canAccess = await assertVenueAccess(venueId, req.userId!);
    if (!canAccess) { res.status(403).json({ error: "Forbidden" }); return; }

    const logs = await db.select().from(exportLogsTable)
      .where(eq(exportLogsTable.venueId, venueId))
      .orderBy(desc(exportLogsTable.generatedAt))
      .limit(100);

    res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Failed to list export logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Scheduler helper ─────────────────────────────────────────────────────────
export async function runScheduledExports(): Promise<void> {
  const allSettings = await db.select().from(exportSettingsTable);
  const now = new Date();
  const due = allSettings.filter(s => s.frequency !== "off" && s.nextRunAt && s.nextRunAt <= now);

  for (const settings of due) {
    try {
      const { from, to } = periodForFrequency(settings.frequency);
      const types = (settings.exportTypes as string[]) ?? ["waste", "food-cost", "stocktake"];
      const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, settings.venueId));
      if (!venue) continue;

      const ownerInfo = await getOwnerInfo(venue.userId);
      const recipients: string[] = [];
      if (settings.ownerOptedIn !== false && ownerInfo.email) recipients.push(ownerInfo.email);
      const extra = normaliseRecipients((settings.additionalRecipients as unknown[]) ?? []);
      for (const r of extra) { if (r.optedIn && r.email) recipients.push(r.email); }
      const uniqueRecipients = [...new Set(recipients)];

      for (const type of types) {
        if (!VALID_TYPES.includes(type as ExportType)) continue;
        try {
          const exported = await generateExport(settings.venueId, type as ExportType, from, to);
          let emailedTo: string[] = [];
          if (uniqueRecipients.length > 0) {
            const result = await sendExportEmail({
              to: uniqueRecipients,
              venueName: venue.name,
              ownerName: ownerInfo.name,
              ownerEmail: ownerInfo.email,
              exportType: type,
              fileName: exported.fileName,
              csvContent: exported.csv,
              periodLabel: `${from.toLocaleDateString("en-AU")} – ${to.toLocaleDateString("en-AU")}`,
              recordCount: exported.recordCount,
            });
            if (result.sent) emailedTo = uniqueRecipients;
          }
          await db.insert(exportLogsTable).values({
            venueId: settings.venueId, exportType: type, triggeredBy: "scheduler",
            status: "success",
            fileName: exported.fileName, recordCount: exported.recordCount,
            dateFrom: from.toISOString().split("T")[0],
            dateTo: to.toISOString().split("T")[0],
            emailedTo,
          });
        } catch (typeErr) {
          await db.insert(exportLogsTable).values({
            venueId: settings.venueId, exportType: type, triggeredBy: "scheduler",
            status: "failed", errorMessage: typeErr instanceof Error ? typeErr.message : String(typeErr),
            dateFrom: from.toISOString().split("T")[0],
            dateTo: to.toISOString().split("T")[0],
            emailedTo: [],
          });
        }
      }

      // Advance next run
      const nextRunAt = computeNextRun(settings.frequency);
      await db.update(exportSettingsTable).set({ lastRunAt: now, nextRunAt, updatedAt: now }).where(eq(exportSettingsTable.venueId, settings.venueId));
    } catch (err) {
      console.error("Scheduled export failed for venue", settings.venueId, err);
    }
  }
}

export default router;
