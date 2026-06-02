import { Router } from "express";
import { db } from "@workspace/db";
import { suppliersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";

const router = Router();

// ── CSV parsing ───────────────────────────────────────────────────────────────

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let cell = "";
    for (const c of line) {
      if (c === '"') { inQuotes = !inQuotes; }
      else if (c === "," && !inQuotes) { row.push(cell.trim()); cell = ""; }
      else { cell += c; }
    }
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

type SupplierColumn =
  | "name" | "category" | "contactName" | "email" | "phone"
  | "website" | "deliveryDays" | "orderCutoffTime" | "notes";

const COLUMN_PATTERNS: Record<SupplierColumn, RegExp> = {
  name: /^(name|supplier|vendor|company|business)$/i,
  category: /^(category|type|cat)$/i,
  contactName: /^(contact|contact.?name|rep|person)$/i,
  email: /^(email|e-mail|mail)$/i,
  phone: /^(phone|tel|mobile|number|ph)$/i,
  website: /^(website|url|web|site)$/i,
  deliveryDays: /^(delivery.?days?|days?|schedule)$/i,
  orderCutoffTime: /^(cutoff|cut.?off|order.?cutoff|order.?time)$/i,
  notes: /^(notes?|comments?|info|remarks)$/i,
};

interface ParsedSupplier {
  name: string;
  category?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  deliveryDays?: string;
  orderCutoffTime?: string;
  notes?: string;
  rowNumber: number;
}

function detectColumnMap(header: string[]): Partial<Record<SupplierColumn, number>> {
  const map: Partial<Record<SupplierColumn, number>> = {};
  for (let i = 0; i < header.length; i++) {
    const h = header[i] ?? "";
    for (const [key, pattern] of Object.entries(COLUMN_PATTERNS)) {
      if (pattern.test(h.trim())) {
        map[key as SupplierColumn] = i;
        break;
      }
    }
  }
  return map;
}

function parseSuppliersCsv(csv: string): { suppliers: ParsedSupplier[]; errors: string[] } {
  const rows = parseCsvRows(csv);
  const errors: string[] = [];
  if (rows.length < 2) {
    return { suppliers: [], errors: ["CSV needs a header row and at least one data row."] };
  }
  const header = rows[0]!;
  const map = detectColumnMap(header);

  if (map.name === undefined) {
    // Fall back to first column as name
    map.name = 0;
    errors.push("No 'name' column detected — used the first column as supplier name. Add a 'Name' header to be explicit.");
  }

  const suppliers: ParsedSupplier[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const get = (col: SupplierColumn): string | undefined => {
      const idx = map[col];
      if (idx === undefined) return undefined;
      const v = row[idx]?.trim();
      return v && v.length > 0 ? v : undefined;
    };
    const name = get("name");
    if (!name) continue;
    suppliers.push({
      name,
      category: get("category"),
      contactName: get("contactName"),
      email: get("email"),
      phone: get("phone"),
      website: get("website"),
      deliveryDays: get("deliveryDays"),
      orderCutoffTime: get("orderCutoffTime"),
      notes: get("notes"),
      rowNumber: r + 1,
    });
  }

  return { suppliers, errors };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Preview: parse CSV and return what would be imported. No DB writes.
router.post("/venues/:venueId/suppliers/preview-csv", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { csv } = req.body as { csv?: string };
    if (!csv?.trim()) {
      res.status(400).json({ error: "csv content is required" }); return;
    }
    const { suppliers, errors } = parseSuppliersCsv(csv);
    res.json({ suppliers, warnings: errors, total: suppliers.length });
  } catch (err) {
    req.log.error({ err }, "Failed to preview supplier CSV");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Commit: parse CSV and bulk insert.
router.post("/venues/:venueId/suppliers/import-csv", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }
    const { csv } = req.body as { csv?: string };
    if (!csv?.trim()) {
      res.status(400).json({ error: "csv content is required" }); return;
    }
    const { suppliers, errors } = parseSuppliersCsv(csv);
    if (suppliers.length === 0) {
      res.status(422).json({ error: "No supplier rows found in CSV.", warnings: errors }); return;
    }

    let created = 0;
    for (const s of suppliers) {
      try {
        await db.insert(suppliersTable).values({
          venueId,
          name: s.name,
          category: s.category ?? null,
          contactName: s.contactName ?? null,
          email: s.email ?? null,
          phone: s.phone ?? null,
          website: s.website ?? null,
          deliveryDays: s.deliveryDays ?? null,
          orderCutoffTime: s.orderCutoffTime ?? null,
          notes: s.notes ?? null,
        });
        created++;
      } catch (insertErr) {
        req.log.warn({ insertErr, row: s.rowNumber }, "Skipped supplier row");
      }
    }

    req.log.info({ venueId, created, total: suppliers.length }, "Bulk supplier CSV import complete");
    res.json({ created, skipped: suppliers.length - created, total: suppliers.length, warnings: errors });
  } catch (err) {
    req.log.error({ err }, "Failed to import supplier CSV");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
