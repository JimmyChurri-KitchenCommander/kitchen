import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";
import { calculatePrepPlan, type PrepPlanInput } from "../utils/prepPlan";

const router = Router();

router.post("/venues/:venueId/prep-plan/calculate", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const body = req.body as PrepPlanInput;
    if (!Array.isArray(body.servicePeriods)) {
      res.status(400).json({ error: "servicePeriods is required" }); return;
    }

    const plan = await calculatePrepPlan(venueId, body);
    res.json(plan);
  } catch (err) {
    req.log.error({ err }, "Failed to calculate prep plan");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
