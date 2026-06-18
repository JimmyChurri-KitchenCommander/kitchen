import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";
import { buildCommandCentreView, runMorningWorkflow } from "../utils/commandCentre";
import type { MorningRunInput } from "../types/commandCentre";

const router = Router();

function parseServicePeriodsFromQuery(req: { query: Record<string, unknown> }): Array<{ label: string; covers: number }> {
  const periods: Array<{ label: string; covers: number }> = [];
  const lunch = Number(req.query["lunchCovers"]);
  const dinner = Number(req.query["dinnerCovers"]);
  const covers = Number(req.query["covers"]);

  if (Number.isFinite(lunch) && lunch > 0) periods.push({ label: "Lunch", covers: lunch });
  if (Number.isFinite(dinner) && dinner > 0) periods.push({ label: "Dinner", covers: dinner });
  if (periods.length === 0 && Number.isFinite(covers) && covers > 0) {
    periods.push({ label: "Service", covers });
  }
  return periods;
}

router.get("/venues/:venueId/command-centre", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const targetDate = typeof req.query["targetDate"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query["targetDate"])
      ? req.query["targetDate"]
      : undefined;
    const servicePeriods = parseServicePeriodsFromQuery(req);

    const view = await buildCommandCentreView(venueId, {
      targetDate,
      servicePeriods: servicePeriods.length > 0 ? servicePeriods : undefined,
    });
    res.json(view);
  } catch (err) {
    req.log.error({ err }, "Failed to build command centre view");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/command-centre/morning-run", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const body = req.body as MorningRunInput;
    if (!Array.isArray(body.servicePeriods) || body.servicePeriods.every((period) => !period.covers)) {
      res.status(400).json({ error: "servicePeriods with covers is required" }); return;
    }

    const view = await runMorningWorkflow(venueId, body);
    res.json(view);
  } catch (err) {
    req.log.error({ err }, "Failed to run morning workflow");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
