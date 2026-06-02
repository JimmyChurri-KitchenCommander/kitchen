import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryItemsTable, priceHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

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

interface ParsedProduct {
  name: string;
  price: number;
  unit: string;
  confidence: "high" | "low";
}

async function extractWithAI(text: string): Promise<ParsedProduct[]> {
  const truncated = text.slice(0, 14000);
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 4096,
    messages: [{
      role: "user",
      content: `You are extracting a supplier product catalog or price list for a professional kitchen.

From the text below, extract all products with their unit prices and return ONLY valid JSON — no markdown, no explanation:
{"products":[{"name":"string","price":number,"unit":"string","confidence":"high"|"low"}]}

Rules:
- name: clean product name (skip codes, pack labels, allergen notes)
- price: cost per unit as a plain number (no symbols)
- unit: kg / g / litre / ml / each / case / box / dozen / bunch / bag / tray / piece (use "each" if unclear)
- confidence: "high" if name AND price are clearly legible, "low" if uncertain
- Skip headers, subtotals, delivery fees, GST/VAT lines, and any row with no clear numeric price

TEXT:
${truncated}`,
    }],
  });

  const raw = response.choices[0]?.message.content ?? "{}";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.products) ? parsed.products
      : Array.isArray(parsed.items) ? parsed.items
      : [];
    return (arr as Record<string, unknown>[])
      .filter(p => typeof p.name === "string" && typeof p.price === "number" && (p.price as number) > 0)
      .map(p => ({
        name: String(p.name).trim(),
        price: Number(p.price),
        unit: String(p.unit ?? "each").trim() || "each",
        confidence: p.confidence === "low" ? "low" : "high",
      }));
  } catch {
    return [];
  }
}

// Extract products from an image (photo of an order sheet, price list, supplier
// fax/printout). Uses Anthropic Claude vision because it handles messy
// handwriting and printed tables better than GPT-4o for this use case.
async function extractFromImage(base64: string, mediaType: string): Promise<ParsedProduct[]> {
  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!supportedTypes.includes(mediaType)) {
    throw new Error(`Unsupported image type. Use JPEG, PNG, WebP, or GIF.`);
  }
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 },
        },
        {
          type: "text",
          text: `You are reading a printed or handwritten supplier order sheet / price list for a professional kitchen.

Extract every product line item with its unit price. Return ONLY valid JSON (no markdown, no explanation):
{"products":[{"name":"string","price":number,"unit":"string","confidence":"high"|"low"}]}

Rules:
- name: clean product name (skip codes, pack sizes baked into name, allergen notes)
- price: unit price as a plain number (no $, no commas)
- unit: kg / g / litre / ml / each / case / box / dozen / bunch / bag / tray / piece (use "each" if unclear)
- confidence: "high" if name AND price are clearly legible; "low" if uncertain or partially obscured
- Skip headers, totals, GST/VAT lines, delivery fees, and any row without a clear numeric price
- If the page is unreadable or contains no products, return {"products":[]}`,
        },
      ],
    }],
  });

  const block = response.content[0];
  const raw = block && block.type === "text" ? block.text : "{}";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const arr = Array.isArray(parsed.products) ? parsed.products : [];
    return (arr as Record<string, unknown>[])
      .filter(p => typeof p.name === "string" && typeof p.price === "number" && (p.price as number) > 0)
      .map(p => ({
        name: String(p.name).trim(),
        price: Number(p.price),
        unit: String(p.unit ?? "each").trim() || "each",
        confidence: p.confidence === "low" ? "low" : "high",
      }));
  } catch {
    return [];
  }
}

function parseCsvProducts(csvText: string): ParsedProduct[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];
  const header = rows[0]!.map(h => h.toLowerCase());
  const nameCol = header.findIndex(h => /name|product|description|item|title/i.test(h));
  const priceCol = header.findIndex(h => /price|cost|rate|amount|unit.?price|each/i.test(h));
  const unitCol = header.findIndex(h => /^unit$|uom|measure|per$/i.test(h));

  const data = rows.slice(1).filter(r => r.some(c => c.trim()));

  if (nameCol === -1 || priceCol === -1) {
    // Auto-detect: first text column = name, first money-like column = price
    return data.flatMap(row => {
      const name = row[0]?.trim() ?? "";
      const priceStr = row.slice(1).find(c => /^\$?[\d,]+\.?\d*$/.test(c.trim())) ?? "";
      const price = parseFloat(priceStr.replace(/[$,£€]/g, ""));
      if (!name || isNaN(price) || price <= 0) return [];
      return [{ name, price, unit: "each", confidence: "low" as const }];
    });
  }

  return data.flatMap(row => {
    const name = (nameCol >= 0 ? row[nameCol] : row[0])?.trim() ?? "";
    const priceRaw = (priceCol >= 0 ? row[priceCol] : "")?.trim() ?? "";
    const price = parseFloat(priceRaw.replace(/[$,£€]/g, ""));
    const unit = (unitCol >= 0 ? row[unitCol] : "")?.trim() || "each";
    if (!name || isNaN(price) || price <= 0) return [];
    return [{ name, price, unit, confidence: "high" as const }];
  });
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.post("/venues/:venueId/suppliers/:supplierId/parse-prices", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const supplierId = parseInt(req.params["supplierId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const { type, content, mediaType } = req.body as { type: "url" | "text" | "csv" | "image"; content: string; mediaType?: string };
    if (!type || !content?.trim()) {
      res.status(400).json({ error: "type and content are required" }); return;
    }

    let products: ParsedProduct[] = [];

    if (type === "csv") {
      products = parseCsvProducts(content);
    } else if (type === "text") {
      products = await extractWithAI(content);
    } else if (type === "image") {
      try {
        products = await extractFromImage(content, mediaType ?? "image/jpeg");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Image processing failed";
        res.status(422).json({ error: msg }); return;
      }
    } else {
      // URL fetch
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        const resp = await fetch(content.trim(), {
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; KitchenOps/1.0)" },
        });
        clearTimeout(timer);

        if (!resp.ok) {
          res.status(422).json({ error: `URL returned HTTP ${resp.status}. Try pasting the text instead.` }); return;
        }
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("text/html") && !ct.includes("text/plain")) {
          res.status(422).json({ error: "That URL returned an unsupported format. For PDFs or spreadsheets, download the file and upload it directly." }); return;
        }
        const raw = await resp.text();
        const text = ct.includes("html") ? stripHtml(raw) : raw;
        if (text.length < 30) {
          res.status(422).json({ error: "The page appears empty or requires a login. Try pasting the content manually." }); return;
        }
        products = await extractWithAI(text);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("abort") || msg.toLowerCase().includes("timeout")) {
          res.status(422).json({ error: "The URL timed out (15s). Try pasting the page content instead." }); return;
        }
        res.status(422).json({ error: "Could not fetch that URL — it may require a login or block automated access. Try pasting the text." }); return;
      }
    }

    if (products.length === 0) {
      res.status(422).json({ error: "No products with prices could be found. Check the format and try again." }); return;
    }

    // Load all active inventory items for name-matching
    const existing = await db
      .select({ id: inventoryItemsTable.id, name: inventoryItemsTable.name, averageCost: inventoryItemsTable.averageCost, unit: inventoryItemsTable.unit })
      .from(inventoryItemsTable)
      .where(and(eq(inventoryItemsTable.venueId, venueId), eq(inventoryItemsTable.isActive, true)));

    const matched = products.map(p => {
      const n = normalize(p.name);
      const match =
        existing.find(e => normalize(e.name) === n) ??
        existing.find(e => normalize(e.name).includes(n) || n.includes(normalize(e.name)));
      return {
        ...p,
        matchedInventoryItemId: match?.id ?? null,
        matchedInventoryItemName: match?.name ?? null,
        currentCost: match ? parseFloat(match.averageCost) : null,
      };
    });

    res.json({ products: matched });
  } catch (err) {
    req.log.error({ err }, "Failed to parse prices");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/suppliers/:supplierId/apply-prices", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const supplierId = parseInt(req.params["supplierId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const { items } = req.body as {
      items: Array<{ inventoryItemId: number; name: string; newPrice: number }>;
    };
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "items array required" }); return;
    }

    const now = new Date();
    let updated = 0;

    for (const item of items) {
      const [inv] = await db
        .select({ id: inventoryItemsTable.id, averageCost: inventoryItemsTable.averageCost })
        .from(inventoryItemsTable)
        .where(and(eq(inventoryItemsTable.id, item.inventoryItemId), eq(inventoryItemsTable.venueId, venueId)));
      if (!inv) continue;

      const oldPrice = parseFloat(inv.averageCost);
      const newPrice = item.newPrice;
      if (newPrice <= 0) continue;

      await db.update(inventoryItemsTable)
        .set({ averageCost: String(newPrice), updatedAt: now })
        .where(eq(inventoryItemsTable.id, item.inventoryItemId));

      const changePct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : null;
      await db.insert(priceHistoryTable).values({
        supplierId,
        inventoryItemId: item.inventoryItemId,
        itemName: item.name,
        oldPrice: oldPrice > 0 ? String(oldPrice) : null,
        newPrice: String(newPrice),
        changePercent: changePct !== null ? String(changePct.toFixed(2)) : null,
        recordedAt: now,
      });

      updated++;
    }

    res.json({ updated });
  } catch (err) {
    req.log.error({ err }, "Failed to apply prices");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
