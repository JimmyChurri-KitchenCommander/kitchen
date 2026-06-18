import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  inventoryItemsTable,
  inventoryLayersTable,
  inventoryLedgerEntriesTable,
} from "@workspace/db";

export type InventoryTransactionType =
  | "PURCHASE"
  | "PRODUCTION_INPUT"
  | "PRODUCTION_OUTPUT"
  | "SALE"
  | "WASTE"
  | "STOCKTAKE";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type InventoryMovementInput = {
  venueId: number;
  inventoryItemId: number;
  transactionType: InventoryTransactionType;
  quantityDelta: number;
  unitCost?: number;
  reason: string;
  referenceType?: string;
  referenceId?: number;
  createdBy?: string;
  createLayer?: boolean;
  expiresAt?: Date | null;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  allowNegativeStock?: boolean;
  updateAverageCost?: boolean;
};

type InventoryMovementResult = {
  item: typeof inventoryItemsTable.$inferSelect;
  entry: typeof inventoryLedgerEntriesTable.$inferSelect;
};

function formatQuantity(value: number): string {
  return value.toFixed(4);
}

function formatCost(value: number): string {
  return value.toFixed(4);
}

function movementRefreshesRestockDate(input: InventoryMovementInput, quantityDelta: number): boolean {
  if (input.transactionType === "PRODUCTION_INPUT" || input.transactionType === "SALE" || input.transactionType === "WASTE") {
    return false;
  }
  return input.transactionType === "STOCKTAKE" || quantityDelta > 0;
}

async function consumeInventoryLayers(
  tx: DbTransaction,
  inventoryItemId: number,
  quantityNeeded: number,
): Promise<Array<{ layerId: number; quantity: number }>> {
  if (quantityNeeded <= 0) return [];

  const layers = await tx
    .select()
    .from(inventoryLayersTable)
    .where(and(
      eq(inventoryLayersTable.inventoryItemId, inventoryItemId),
      gt(inventoryLayersTable.quantityRemaining, "0"),
    ))
    .orderBy(asc(inventoryLayersTable.receivedAt), asc(inventoryLayersTable.id));

  const consumed: Array<{ layerId: number; quantity: number }> = [];
  let remaining = quantityNeeded;

  for (const layer of layers) {
    if (remaining <= 0) break;

    const available = parseFloat(layer.quantityRemaining);
    const used = Math.min(available, remaining);
    if (used <= 0) continue;

    await tx
      .update(inventoryLayersTable)
      .set({ quantityRemaining: formatQuantity(available - used) })
      .where(eq(inventoryLayersTable.id, layer.id));

    consumed.push({ layerId: layer.id, quantity: used });
    remaining -= used;
  }

  return consumed;
}

async function applyInventoryMovementInTx(
  tx: DbTransaction,
  input: InventoryMovementInput,
): Promise<InventoryMovementResult> {
  const [existing] = await tx
    .select()
    .from(inventoryItemsTable)
    .where(and(
      eq(inventoryItemsTable.id, input.inventoryItemId),
      eq(inventoryItemsTable.venueId, input.venueId),
    ));

  if (!existing) {
    throw new Error(`Inventory item ${input.inventoryItemId} not found for venue ${input.venueId}`);
  }

  const previousStock = parseFloat(existing.currentStock);
  const requestedDelta = input.quantityDelta;
  const effectiveDelta = !input.allowNegativeStock && previousStock + requestedDelta < 0
    ? -previousStock
    : requestedDelta;
  const resultingStock = previousStock + effectiveDelta;
  const unitCost = input.unitCost ?? parseFloat(existing.averageCost ?? "0");
  const costImpact = effectiveDelta * unitCost;

  let layerId: number | null = null;
  let consumedLayers: Array<{ layerId: number; quantity: number }> = [];
  const now = new Date();

  if (effectiveDelta > 0 && input.createLayer) {
    const [layer] = await tx
      .insert(inventoryLayersTable)
      .values({
        venueId: input.venueId,
        inventoryItemId: input.inventoryItemId,
        sourceType: input.referenceType ?? input.transactionType,
        sourceId: input.referenceId ?? null,
        quantityReceived: formatQuantity(effectiveDelta),
        quantityRemaining: formatQuantity(effectiveDelta),
        unitCost: formatCost(unitCost),
        receivedAt: now,
        expiresAt: input.expiresAt ?? null,
        createdBy: input.createdBy,
      })
      .returning();
    layerId = layer?.id ?? null;
  } else if (effectiveDelta < 0) {
    consumedLayers = await consumeInventoryLayers(tx, input.inventoryItemId, Math.abs(effectiveDelta));
  }

  const itemUpdates: Partial<typeof inventoryItemsTable.$inferInsert> = {
    currentStock: formatQuantity(resultingStock),
    updatedAt: now,
  };

  if (movementRefreshesRestockDate(input, effectiveDelta)) {
    itemUpdates.lastRestocked = now;
  }
  if (input.updateAverageCost && input.unitCost !== undefined) {
    itemUpdates.averageCost = formatCost(input.unitCost);
  }

  const [updatedItem] = await tx
    .update(inventoryItemsTable)
    .set(itemUpdates)
    .where(and(
      eq(inventoryItemsTable.id, input.inventoryItemId),
      eq(inventoryItemsTable.venueId, input.venueId),
    ))
    .returning();

  const [entry] = await tx
    .insert(inventoryLedgerEntriesTable)
    .values({
      venueId: input.venueId,
      inventoryItemId: input.inventoryItemId,
      layerId,
      transactionType: input.transactionType,
      quantityDelta: formatQuantity(effectiveDelta),
      resultingStock: formatQuantity(resultingStock),
      unitCost: formatCost(unitCost),
      costImpact: formatCost(costImpact),
      reason: input.reason,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      idempotencyKey: input.idempotencyKey,
      metadata: {
        ...(input.metadata ?? {}),
        previousStock,
        requestedQuantityDelta: requestedDelta,
        clampedQuantityDelta: effectiveDelta,
        consumedLayers,
      },
      createdBy: input.createdBy,
    })
    .returning();

  if (!updatedItem || !entry) {
    throw new Error("Failed to write inventory movement");
  }

  return { item: updatedItem, entry };
}

export async function applyInventoryMovement(input: InventoryMovementInput): Promise<InventoryMovementResult> {
  return db.transaction(async (tx) => applyInventoryMovementInTx(tx, input));
}

export async function applyInventoryMovements(inputs: InventoryMovementInput[]): Promise<InventoryMovementResult[]> {
  if (inputs.length === 0) return [];
  return db.transaction(async (tx) => {
    const results: InventoryMovementResult[] = [];
    for (const input of inputs) {
      results.push(await applyInventoryMovementInTx(tx, input));
    }
    return results;
  });
}

export async function reconcileInventoryStock(input: Omit<InventoryMovementInput, "quantityDelta" | "transactionType"> & {
  actualStock: number;
}): Promise<InventoryMovementResult> {
  const [existing] = await db
    .select()
    .from(inventoryItemsTable)
    .where(and(
      eq(inventoryItemsTable.id, input.inventoryItemId),
      eq(inventoryItemsTable.venueId, input.venueId),
    ));

  if (!existing) {
    throw new Error(`Inventory item ${input.inventoryItemId} not found for venue ${input.venueId}`);
  }

  return applyInventoryMovement({
    ...input,
    transactionType: "STOCKTAKE",
    quantityDelta: input.actualStock - parseFloat(existing.currentStock),
    createLayer: input.actualStock > parseFloat(existing.currentStock),
  });
}
