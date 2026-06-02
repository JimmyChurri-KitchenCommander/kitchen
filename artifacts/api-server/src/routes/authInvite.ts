import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const INVITE_CODE = "kitchen commander";

router.post("/auth/verify-invite", requireAuth, async (req, res): Promise<void> => {
  const { code } = req.body as { code?: string };
  if (!code || code.trim().toLowerCase() !== INVITE_CODE) {
    res.status(400).json({ error: "Invalid access code" }); return;
  }
  try {
    await clerkClient.users.updateUserMetadata(req.userId!, {
      publicMetadata: { inviteVerified: true },
    });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update invite metadata");
    res.status(500).json({ error: "Failed to grant access" });
  }
});

export default router;
