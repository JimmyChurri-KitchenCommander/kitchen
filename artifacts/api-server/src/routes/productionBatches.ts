import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import {
  completeProductionBatch,
  createProductionBatch,
  getProductionBatch,
  listProductionBatches,
} from "../services/productionBatches";
import { isServiceError } from "../services/errors";

const router = Router();

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

router.post("/venues/:venueId/production-batches", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) {
    res.status(400).json({ error: "Invalid venue ID" });
    return;
  }

  try {
    const { recipeId, prepTaskId, plannedPortions, plannedQuantity, status, notes } = req.body as {
      recipeId?: number;
      prepTaskId?: number;
      plannedPortions?: number;
      plannedQuantity?: number;
      status?: "planned" | "in_progress";
      notes?: string;
    };

    const batch = await createProductionBatch({
      venueId,
      recipeId,
      prepTaskId,
      plannedPortions: plannedPortions ?? plannedQuantity,
      status,
      notes,
      createdBy: req.userId ?? undefined,
    });

    res.status(201).json(batch);
  } catch (err) {
    req.log.error({ err }, "Failed to create production batch");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/venues/:venueId/production-batches/:batchId/complete", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const batchId = parseId(req.params["batchId"] as string);
  if (!venueId || !batchId) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const { actualPortions, actualQuantityProduced, inputs, outputs, notes } = req.body as {
      actualPortions?: number;
      actualQuantityProduced?: number;
      notes?: string;
      inputs?: Array<{
        inventoryItemId?: number;
        actualQuantity?: number;
        plannedQuantity?: number;
        unitCost?: number;
      }>;
      outputs?: Array<{
        inventoryItemId?: number;
        quantityProduced?: number;
        unitCost?: number;
        expiresAt?: string;
      }>;
    };

    const result = await completeProductionBatch({
      venueId,
      batchId,
      actualPortions: actualPortions ?? actualQuantityProduced ?? 0,
      completedBy: req.userId ?? undefined,
      notes,
      inputs: (inputs ?? []).map((item) => ({
        inventoryItemId: item.inventoryItemId ?? 0,
        actualQuantity: item.actualQuantity ?? 0,
        plannedQuantity: item.plannedQuantity,
        unitCost: item.unitCost,
      })),
      outputs: (outputs ?? []).map((item) => ({
        inventoryItemId: item.inventoryItemId ?? 0,
        quantityProduced: item.quantityProduced ?? 0,
        unitCost: item.unitCost,
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
      })),
    });

    res.json(result);
  } catch (err) {
    if (isServiceError(err)) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    req.log.error({ err }, "Failed to complete production batch");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/production-batches", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) {
    res.status(400).json({ error: "Invalid venue ID" });
    return;
  }

  try {
    const batches = await listProductionBatches(venueId);
    res.json(batches);
  } catch (err) {
    req.log.error({ err }, "Failed to list production batches");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/venues/:venueId/production-batches/:batchId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const batchId = parseId(req.params["batchId"] as string);
  if (!venueId || !batchId) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const batch = await getProductionBatch(venueId, batchId);
    if (!batch) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }
    res.json(batch);
  } catch (err) {
    req.log.error({ err }, "Failed to get production batch");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
