import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  inventoryItemsTable,
  productionBatchInputsTable,
  productionBatchOutputsTable,
  productionBatchesTable,
} from "@workspace/db";
import { applyInventoryMovementInTx } from "./inventoryLedger";
import { ServiceError } from "./errors";

function parseNumeric(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(value);
}

export type CreateProductionBatchInput = {
  venueId: number;
  recipeId?: number;
  prepTaskId?: number;
  plannedPortions?: number;
  status?: "planned" | "in_progress";
  notes?: string;
  createdBy?: string;
};

export type CompleteProductionBatchInput = {
  venueId: number;
  batchId: number;
  actualPortions: number;
  completedBy?: string;
  notes?: string;
  inputs: Array<{
    inventoryItemId: number;
    actualQuantity: number;
    plannedQuantity?: number;
    unitCost?: number;
  }>;
  outputs: Array<{
    inventoryItemId: number;
    quantityProduced: number;
    unitCost?: number;
    expiresAt?: Date | null;
  }>;
};

export type ProductionBatchDetails = {
  batch: typeof productionBatchesTable.$inferSelect;
  inputs: typeof productionBatchInputsTable.$inferSelect[];
  outputs: typeof productionBatchOutputsTable.$inferSelect[];
};

export type InventoryStockSnapshot = {
  inventoryItemId: number;
  currentStock: number;
};

export function assertSufficientInventory(
  inputs: CompleteProductionBatchInput["inputs"],
  inventory: InventoryStockSnapshot[],
): void {
  const inventoryById = new Map(inventory.map((item) => [item.inventoryItemId, item.currentStock]));

  for (const consumed of inputs) {
    const currentStock = inventoryById.get(consumed.inventoryItemId);
    if (currentStock == null) {
      throw new ServiceError(404, "PRODUCTION_INPUT_ITEM_NOT_FOUND", `Inventory item ${consumed.inventoryItemId} not found`);
    }
    if (currentStock + 0.0001 < consumed.actualQuantity) {
      throw new ServiceError(400, "PRODUCTION_INSUFFICIENT_INVENTORY", `Insufficient inventory for item ${consumed.inventoryItemId}`);
    }
  }
}

export function buildProductionLedgerMovements(input: CompleteProductionBatchInput): {
  inputMovements: Array<{
    inventoryItemId: number;
    quantityDelta: number;
    unitCost?: number;
    transactionType: "PRODUCTION_INPUT";
  }>;
  outputMovements: Array<{
    inventoryItemId: number;
    quantityDelta: number;
    unitCost?: number;
    transactionType: "PRODUCTION_OUTPUT";
    createLayer: true;
    expiresAt?: Date | null;
  }>;
} {
  return {
    inputMovements: input.inputs.map((consumed) => ({
      inventoryItemId: consumed.inventoryItemId,
      quantityDelta: -consumed.actualQuantity,
      unitCost: consumed.unitCost,
      transactionType: "PRODUCTION_INPUT",
    })),
    outputMovements: input.outputs.map((produced) => ({
      inventoryItemId: produced.inventoryItemId,
      quantityDelta: produced.quantityProduced,
      unitCost: produced.unitCost,
      transactionType: "PRODUCTION_OUTPUT",
      createLayer: true,
      expiresAt: produced.expiresAt,
    })),
  };
}

export async function createProductionBatch(input: CreateProductionBatchInput): Promise<typeof productionBatchesTable.$inferSelect> {
  const [batch] = await db
    .insert(productionBatchesTable)
    .values({
      venueId: input.venueId,
      recipeId: input.recipeId ?? null,
      prepTaskId: input.prepTaskId ?? null,
      plannedPortions: input.plannedPortions?.toFixed(3),
      status: input.status ?? "in_progress",
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  if (!batch) {
    throw new ServiceError(500, "PRODUCTION_BATCH_CREATE_FAILED", "Failed to create production batch");
  }

  return batch;
}

export async function listProductionBatches(venueId: number): Promise<Array<typeof productionBatchesTable.$inferSelect>> {
  return db
    .select()
    .from(productionBatchesTable)
    .where(eq(productionBatchesTable.venueId, venueId))
    .orderBy(desc(productionBatchesTable.startedAt), desc(productionBatchesTable.id))
    .limit(200);
}

export async function getProductionBatch(venueId: number, batchId: number): Promise<ProductionBatchDetails | null> {
  const [batch] = await db
    .select()
    .from(productionBatchesTable)
    .where(and(
      eq(productionBatchesTable.id, batchId),
      eq(productionBatchesTable.venueId, venueId),
    ));

  if (!batch) {
    return null;
  }

  const [inputs, outputs] = await Promise.all([
    db.select().from(productionBatchInputsTable).where(eq(productionBatchInputsTable.batchId, batchId)),
    db.select().from(productionBatchOutputsTable).where(eq(productionBatchOutputsTable.batchId, batchId)),
  ]);

  return { batch, inputs, outputs };
}

export async function completeProductionBatch(input: CompleteProductionBatchInput): Promise<ProductionBatchDetails> {
  if (input.inputs.length === 0) {
    throw new ServiceError(400, "PRODUCTION_INPUTS_REQUIRED", "At least one production input is required");
  }
  if (input.outputs.length === 0) {
    throw new ServiceError(400, "PRODUCTION_OUTPUTS_REQUIRED", "At least one production output is required");
  }

  for (const item of input.inputs) {
    if (item.actualQuantity <= 0) {
      throw new ServiceError(400, "PRODUCTION_INPUT_INVALID_QUANTITY", `Input quantity must be positive for inventory item ${item.inventoryItemId}`);
    }
  }
  for (const item of input.outputs) {
    if (item.quantityProduced <= 0) {
      throw new ServiceError(400, "PRODUCTION_OUTPUT_INVALID_QUANTITY", `Output quantity must be positive for inventory item ${item.inventoryItemId}`);
    }
  }

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .select()
      .from(productionBatchesTable)
      .where(and(
        eq(productionBatchesTable.id, input.batchId),
        eq(productionBatchesTable.venueId, input.venueId),
      ));

    if (!batch) {
      throw new ServiceError(404, "PRODUCTION_BATCH_NOT_FOUND", "Production batch not found");
    }
    if (batch.status === "completed" || batch.completedAt) {
      throw new ServiceError(400, "PRODUCTION_BATCH_ALREADY_COMPLETED", "Production batch is already completed");
    }

    const inputItemIds = [...new Set(input.inputs.map((item) => item.inventoryItemId))];
    const inventoryItems = await tx
      .select()
      .from(inventoryItemsTable)
      .where(and(
        eq(inventoryItemsTable.venueId, input.venueId),
        inArray(inventoryItemsTable.id, inputItemIds),
      ));

    if (inventoryItems.length !== inputItemIds.length) {
      throw new ServiceError(404, "PRODUCTION_INPUT_ITEMS_NOT_FOUND", "One or more production input items were not found");
    }

    assertSufficientInventory(
      input.inputs,
      inventoryItems.map((item) => ({
        inventoryItemId: item.id,
        currentStock: parseNumeric(item.currentStock),
      })),
    );

    const now = new Date();

    const insertedInputs = await tx
      .insert(productionBatchInputsTable)
      .values(input.inputs.map((item) => ({
        batchId: input.batchId,
        inventoryItemId: item.inventoryItemId,
        plannedQuantity: (item.plannedQuantity ?? item.actualQuantity).toFixed(3),
        actualQuantity: item.actualQuantity.toFixed(3),
        unitCost: item.unitCost?.toFixed(4),
        consumedAt: now,
      })))
      .returning();

    const { inputMovements, outputMovements } = buildProductionLedgerMovements(input);

    for (const consumed of inputMovements) {
      await applyInventoryMovementInTx(tx, {
        venueId: input.venueId,
        inventoryItemId: consumed.inventoryItemId,
        transactionType: consumed.transactionType,
        quantityDelta: consumed.quantityDelta,
        unitCost: consumed.unitCost,
        reason: `Production batch #${input.batchId} input`,
        referenceType: "PRODUCTION_BATCH",
        referenceId: input.batchId,
        createdBy: input.completedBy,
        createLayer: false,
        allowNegativeStock: false,
      });
    }

    const insertedOutputs: typeof productionBatchOutputsTable.$inferSelect[] = [];
    for (const produced of outputMovements) {
      const movement = await applyInventoryMovementInTx(tx, {
        venueId: input.venueId,
        inventoryItemId: produced.inventoryItemId,
        transactionType: produced.transactionType,
        quantityDelta: produced.quantityDelta,
        unitCost: produced.unitCost,
        reason: `Production batch #${input.batchId} output`,
        referenceType: "PRODUCTION_BATCH",
        referenceId: input.batchId,
        createdBy: input.completedBy,
        createLayer: produced.createLayer,
        expiresAt: produced.expiresAt ?? null,
        updateAverageCost: produced.unitCost !== undefined,
      });

      const [insertedOutput] = await tx
        .insert(productionBatchOutputsTable)
        .values({
          batchId: input.batchId,
          inventoryItemId: produced.inventoryItemId,
          quantityProduced: produced.quantityDelta.toFixed(3),
          unitCost: produced.unitCost?.toFixed(4),
          layerId: movement.entry.layerId,
          producedAt: now,
        })
        .returning();

      if (!insertedOutput) {
        throw new ServiceError(500, "PRODUCTION_OUTPUT_INSERT_FAILED", "Failed to insert production batch output");
      }

      insertedOutputs.push(insertedOutput);
    }

    const plannedPortions = parseNumeric(batch.plannedPortions);
    const yieldVariance = plannedPortions === 0 ? null : (input.actualPortions - plannedPortions).toFixed(3);

    const [updatedBatch] = await tx
      .update(productionBatchesTable)
      .set({
        status: "completed",
        actualPortions: input.actualPortions.toFixed(3),
        yieldVariance,
        completedAt: now,
        completedBy: input.completedBy ?? null,
        notes: input.notes ?? batch.notes,
      })
      .where(eq(productionBatchesTable.id, input.batchId))
      .returning();

    if (!updatedBatch) {
      throw new ServiceError(500, "PRODUCTION_BATCH_UPDATE_FAILED", "Failed to update production batch");
    }

    return {
      batch: updatedBatch,
      inputs: insertedInputs,
      outputs: insertedOutputs,
    };
  });
}
