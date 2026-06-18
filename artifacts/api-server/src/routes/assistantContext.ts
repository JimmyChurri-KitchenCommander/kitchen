import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { assertVenueAccess } from "../middlewares/venueAuth";
import { buildKitchenAssistantContext } from "../utils/assistantContext";

const router = Router();

router.get("/venues/:venueId/assistant/context", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    if (!(await assertVenueAccess(venueId, req.userId!))) {
      res.status(404).json({ error: "Venue not found" }); return;
    }

    const targetDate = typeof req.query["targetDate"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query["targetDate"])
      ? req.query["targetDate"]
      : undefined;
    const covers = req.query["covers"] !== undefined ? Number(req.query["covers"]) : undefined;

    const context = await buildKitchenAssistantContext(venueId, {
      targetDate,
      covers: Number.isFinite(covers) ? covers : undefined,
    });
    res.json(context);
  } catch (err) {
    req.log.error({ err }, "Failed to build assistant context");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
