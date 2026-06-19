import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  purchaseOrderItemsTable,
  purchaseOrdersTable,
  purchaseOrderReceivingTable,
} from "@workspace/db";
import { applyInventoryMovementsInTx } from "./inventoryLedger";
import { ServiceError } from "./errors";

const RECEIVING_EPSILON = 0.0001;

type ReceiveItemInput = {
  purchaseOrderItemId: number;
  quantityReceived: number;
  receivedUnitCost?: number;
  notes?: string;
  expiryDate?: Date | null;
};

export type ReceivePurchaseOrderInput = {
  venueId: number;
  orderId: number;
  items: ReceiveItemInput[];
  receivedBy?: string;
  receivedAt?: Date;
};

export type ReceivedPurchaseOrderItem = typeof purchaseOrderItemsTable.$inferSelect & {
  receivedQuantity: number;
};

export type ReceivePurchaseOrderResult = {
  order: typeof purchaseOrdersTable.$inferSelect;
  items: ReceivedPurchaseOrderItem[];
};

export type PurchaseOrderReceivingTotalsInput = {
  orderItems: Array<{ id: number; quantity: string }>;
  existingReceivedByItem: Map<number, number>;
  incomingItems: ReceiveItemInput[];
};

function parseNumeric(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(value);
}

function sumByItem(rows: Array<{ purchaseOrderItemId: number; totalReceived: string }>): Map<number, number> {
  const totals = new Map<number, number>();
  for (const row of rows) {
    totals.set(row.purchaseOrderItemId, parseNumeric(row.totalReceived));
  }
  return totals;
}

export function computePurchaseOrderReceivingTotals(input: PurchaseOrderReceivingTotalsInput): {
  receivedByItem: Map<number, number>;
  fullyReceived: boolean;
} {
  const orderItemById = new Map(input.orderItems.map((item) => [item.id, item]));
  const receivedByItem = new Map(input.existingReceivedByItem);

  for (const incoming of input.incomingItems) {
    const orderItem = orderItemById.get(incoming.purchaseOrderItemId);
    if (!orderItem) {
      throw new ServiceError(400, "PURCHASE_ORDER_ITEM_NOT_FOUND", `Purchase order item ${incoming.purchaseOrderItemId} not found`);
    }

    const orderedQty = parseNumeric(orderItem.quantity);
    const alreadyReceivedQty = receivedByItem.get(incoming.purchaseOrderItemId) ?? 0;
    const nextReceivedQty = alreadyReceivedQty + incoming.quantityReceived;

    if (nextReceivedQty - orderedQty > RECEIVING_EPSILON) {
      throw new ServiceError(
        400,
        "PURCHASE_ORDER_OVER_RECEIVE",
        `Cannot receive more than ordered quantity for item ${incoming.purchaseOrderItemId}`,
      );
    }

    receivedByItem.set(incoming.purchaseOrderItemId, nextReceivedQty);
  }

  const fullyReceived = input.orderItems.length > 0 && input.orderItems.every((item) => {
    const orderedQty = parseNumeric(item.quantity);
    const receivedQty = receivedByItem.get(item.id) ?? 0;
    return orderedQty - receivedQty <= RECEIVING_EPSILON;
  });

  return { receivedByItem, fullyReceived };
}

export async function receivePurchaseOrder(input: ReceivePurchaseOrderInput): Promise<ReceivePurchaseOrderResult> {
  if (input.items.length === 0) {
    throw new ServiceError(400, "PURCHASE_ORDER_RECEIVE_ITEMS_REQUIRED", "At least one purchase order item is required");
  }

  for (const item of input.items) {
    if (item.quantityReceived <= 0) {
      throw new ServiceError(
        400,
        "PURCHASE_ORDER_RECEIVE_INVALID_QUANTITY",
        `Received quantity must be positive for item ${item.purchaseOrderItemId}`,
      );
    }
  }

  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(purchaseOrdersTable)
      .where(and(
        eq(purchaseOrdersTable.id, input.orderId),
        eq(purchaseOrdersTable.venueId, input.venueId),
      ));

    if (!order) {
      throw new ServiceError(404, "PURCHASE_ORDER_NOT_FOUND", "Purchase order not found");
    }

    const itemIds = [...new Set(input.items.map((item) => item.purchaseOrderItemId))];
    const orderItems = await tx
      .select()
      .from(purchaseOrderItemsTable)
      .where(and(
        eq(purchaseOrderItemsTable.orderId, input.orderId),
        inArray(purchaseOrderItemsTable.id, itemIds),
      ));

    if (orderItems.length !== itemIds.length) {
      throw new ServiceError(400, "PURCHASE_ORDER_ITEMS_INVALID", "One or more purchase order items do not belong to this order");
    }

    const existingReceivedRows = await tx
      .select({
        purchaseOrderItemId: purchaseOrderReceivingTable.purchaseOrderItemId,
        totalReceived: sql<string>`coalesce(sum(${purchaseOrderReceivingTable.receivedQuantity}), '0')`,
      })
      .from(purchaseOrderReceivingTable)
      .where(inArray(purchaseOrderReceivingTable.purchaseOrderItemId, itemIds))
      .groupBy(purchaseOrderReceivingTable.purchaseOrderItemId);

    const existingReceivedByItem = sumByItem(existingReceivedRows);
    const { receivedByItem: projectedReceivedByItem } = computePurchaseOrderReceivingTotals({
      orderItems: orderItems.map((item) => ({ id: item.id, quantity: item.quantity })),
      existingReceivedByItem,
      incomingItems: input.items,
    });

    const orderItemById = new Map(orderItems.map((item) => [item.id, item]));

    const now = input.receivedAt ?? new Date();

    await tx
      .insert(purchaseOrderReceivingTable)
      .values(input.items.map((item) => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        receivedQuantity: item.quantityReceived.toFixed(3),
        receivedUnitCost: item.receivedUnitCost?.toFixed(4),
        receivedAt: now,
        receivedBy: input.receivedBy ?? null,
        notes: item.notes ?? null,
        expiryDate: item.expiryDate ?? null,
      })));

    const ledgerMovements = input.items
      .map((item) => {
        const orderItem = orderItemById.get(item.purchaseOrderItemId);
        if (!orderItem?.inventoryItemId) return null;

        const unitCost = item.receivedUnitCost ?? parseNumeric(orderItem.estimatedUnitCost);
        return {
          venueId: input.venueId,
          inventoryItemId: orderItem.inventoryItemId,
          transactionType: "PURCHASE_RECEIPT" as const,
          quantityDelta: item.quantityReceived,
          unitCost,
          reason: `Purchase order #${input.orderId} receipt`,
          referenceType: "PURCHASE_ORDER_ITEM",
          referenceId: orderItem.id,
          createdBy: input.receivedBy,
          createLayer: true,
          expiresAt: item.expiryDate ?? null,
          updateAverageCost: true,
        };
      })
      .filter((movement): movement is NonNullable<typeof movement> => movement !== null);

    if (ledgerMovements.length > 0) {
      await applyInventoryMovementsInTx(tx, ledgerMovements);
    }

    const allOrderItems = await tx
      .select()
      .from(purchaseOrderItemsTable)
      .where(eq(purchaseOrderItemsTable.orderId, input.orderId));

    const allOrderItemIds = allOrderItems.map((item) => item.id);

    const allReceivedRows = allOrderItemIds.length === 0
      ? []
      : await tx
        .select({
          purchaseOrderItemId: purchaseOrderReceivingTable.purchaseOrderItemId,
          totalReceived: sql<string>`coalesce(sum(${purchaseOrderReceivingTable.receivedQuantity}), '0')`,
        })
        .from(purchaseOrderReceivingTable)
        .where(inArray(purchaseOrderReceivingTable.purchaseOrderItemId, allOrderItemIds))
        .groupBy(purchaseOrderReceivingTable.purchaseOrderItemId);

    const allReceivedByItem = sumByItem(allReceivedRows);
    const { fullyReceived } = computePurchaseOrderReceivingTotals({
      orderItems: allOrderItems.map((item) => ({ id: item.id, quantity: item.quantity })),
      existingReceivedByItem: new Map(),
      incomingItems: allOrderItems.map((item) => ({
        purchaseOrderItemId: item.id,
        quantityReceived: allReceivedByItem.get(item.id) ?? projectedReceivedByItem.get(item.id) ?? 0,
      })),
    });

    const [updatedOrder] = await tx
      .update(purchaseOrdersTable)
      .set({
        status: fullyReceived ? "received" : order.status,
        receivedAt: fullyReceived ? now : order.receivedAt,
        updatedAt: now,
      })
      .where(eq(purchaseOrdersTable.id, input.orderId))
      .returning();

    if (!updatedOrder) {
      throw new ServiceError(500, "PURCHASE_ORDER_UPDATE_FAILED", "Failed to update purchase order");
    }

    const itemsWithReceived: ReceivedPurchaseOrderItem[] = allOrderItems.map((item) => ({
      ...item,
      receivedQuantity: allReceivedByItem.get(item.id) ?? 0,
    }));

    return { order: updatedOrder, items: itemsWithReceived };
  });
}
