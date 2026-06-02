import { Router } from "express";
import { db } from "@workspace/db";
import { venuesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/demo-init
 * Public endpoint — no Clerk auth required.
 * Validates the demo access token and returns the demo venue ID.
 */
router.get("/demo-init", async (req, res): Promise<void> => {
  const { key } = req.query as { key?: string };
  const token = process.env.DEMO_ACCESS_TOKEN;

  if (!token) {
    res.status(503).json({ error: "Demo mode is not configured on this server." });
    return;
  }

  if (!key || key !== token) {
    res.status(401).json({ error: "Invalid demo access key." });
    return;
  }

  const [venue] = await db
    .select({ id: venuesTable.id, name: venuesTable.name })
    .from(venuesTable)
    .where(eq(venuesTable.name, "The Black Apron"))
    .limit(1);

  if (!venue) {
    res.status(404).json({
      error: "Demo kitchen not seeded yet. An admin must load 'The Black Apron' first.",
    });
    return;
  }

  res.json({ venueId: venue.id, venueName: venue.name });
});

/**
 * GET /api/demo-link
 * Authenticated — returns the full shareable demo link for the admin to copy.
 */
router.get("/demo-link", (req, res): void => {
  const token = process.env.DEMO_ACCESS_TOKEN;

  if (!token) {
    res.status(503).json({ error: "DEMO_ACCESS_TOKEN is not configured." });
    return;
  }

  const host = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "") as string;
  const proto = (req.headers["x-forwarded-proto"] ?? "https") as string;
  const base = `${proto}://${host}`;

  res.json({ url: `${base}/demo-kitchen?key=${token}` });
});

export default router;
