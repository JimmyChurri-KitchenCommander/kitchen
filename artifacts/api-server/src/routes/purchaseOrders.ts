import { Router } from "express";
import { db } from "@workspace/db";
import {
  purchaseOrdersTable,
  purchaseOrderItemsTable,
  suppliersTable,
  inventoryItemsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function parseId(raw: string): number | null {
  const n = parseInt(raw);
  return isNaN(n) ? null : n;
}

// ── List purchase orders ───────────────────────────────────────────────────────
router.get("/venues/:venueId/purchase-orders", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const orders = await db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.venueId, venueId))
      .orderBy(desc(purchaseOrdersTable.createdAt))
      .limit(100);
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Failed to list purchase orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get a purchase order with items ───────────────────────────────────────────
router.get("/venues/:venueId/purchase-orders/:orderId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const orderId = parseId(req.params["orderId"] as string);
  if (!venueId || !orderId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [order] = await db
      .select()
      .from(purchaseOrdersTable)
      .where(and(eq(purchaseOrdersTable.id, orderId), eq(purchaseOrdersTable.venueId, venueId)));
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const items = await db
      .select()
      .from(purchaseOrderItemsTable)
      .where(eq(purchaseOrderItemsTable.orderId, orderId));

    res.json({ ...order, items });
  } catch (err) {
    req.log.error({ err }, "Failed to get purchase order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Create a purchase order (optionally with items) ───────────────────────────
router.post("/venues/:venueId/purchase-orders", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  if (!venueId) { res.status(400).json({ error: "Invalid venue ID" }); return; }
  try {
    const { supplierId, supplierName, notes, items } = req.body as {
      supplierId?: number;
      supplierName?: string;
      notes?: string;
      items?: Array<{
        inventoryItemId?: number;
        itemName: string;
        quantity: number;
        unit: string;
        estimatedUnitCost?: number;
        notes?: string;
      }>;
    };

    // Resolve supplier name if only supplierId given
    let resolvedName = supplierName ?? "Unknown Supplier";
    if (supplierId && !supplierName) {
      const [supplier] = await db
        .select({ name: suppliersTable.name })
        .from(suppliersTable)
        .where(and(eq(suppliersTable.id, supplierId), eq(suppliersTable.venueId, venueId)));
      if (supplier) resolvedName = supplier.name;
    }

    const totalEstimatedCost = (items ?? []).reduce((sum, item) => {
      return sum + (item.quantity * (item.estimatedUnitCost ?? 0));
    }, 0).toFixed(2);

    const [order] = await db.insert(purchaseOrdersTable).values({
      venueId,
      supplierId: supplierId ?? null,
      supplierName: resolvedName,
      notes: notes ?? null,
      totalEstimatedCost,
      createdBy: req.userId ?? null,
    }).returning();

    let insertedItems: typeof purchaseOrderItemsTable.$inferSelect[] = [];
    if (items && items.length > 0) {
      insertedItems = await db.insert(purchaseOrderItemsTable).values(
        items.map((item) => ({
          orderId: order.id,
          inventoryItemId: item.inventoryItemId ?? null,
          itemName: item.itemName,
          quantity: String(item.quantity),
          unit: item.unit,
          estimatedUnitCost: String(item.estimatedUnitCost ?? 0),
          notes: item.notes ?? null,
        }))
      ).returning();
    }

    res.status(201).json({ ...order, items: insertedItems });
  } catch (err) {
    req.log.error({ err }, "Failed to create purchase order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update a purchase order (status, notes) ───────────────────────────────────
router.patch("/venues/:venueId/purchase-orders/:orderId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const orderId = parseId(req.params["orderId"] as string);
  if (!venueId || !orderId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { status, notes, supplierName } = req.body as {
      status?: string;
      notes?: string;
      supplierName?: string;
    };

    const [existing] = await db
      .select({ id: purchaseOrdersTable.id })
      .from(purchaseOrdersTable)
      .where(and(eq(purchaseOrdersTable.id, orderId), eq(purchaseOrdersTable.venueId, venueId)));
    if (!existing) { res.status(404).json({ error: "Order not found" }); return; }

    const now = new Date();
    const updates: Partial<typeof purchaseOrdersTable.$inferInsert> = { updatedAt: now };
    if (notes !== undefined) updates.notes = notes;
    if (supplierName !== undefined) updates.supplierName = supplierName;
    if (status) {
      updates.status = status;
      if (status === "sent") updates.sentAt = now;
      if (status === "received") updates.receivedAt = now;
    }

    const [updated] = await db
      .update(purchaseOrdersTable)
      .set(updates)
      .where(and(eq(purchaseOrdersTable.id, orderId), eq(purchaseOrdersTable.venueId, venueId)))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update purchase order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete a purchase order ────────────────────────────────────────────────────
router.delete("/venues/:venueId/purchase-orders/:orderId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const orderId = parseId(req.params["orderId"] as string);
  if (!venueId || !orderId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [deleted] = await db
      .delete(purchaseOrdersTable)
      .where(and(eq(purchaseOrdersTable.id, orderId), eq(purchaseOrdersTable.venueId, venueId)))
      .returning({ id: purchaseOrdersTable.id });
    if (!deleted) { res.status(404).json({ error: "Order not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete purchase order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Add an item to a purchase order ───────────────────────────────────────────
router.post("/venues/:venueId/purchase-orders/:orderId/items", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const orderId = parseId(req.params["orderId"] as string);
  if (!venueId || !orderId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { inventoryItemId, itemName, quantity, unit, estimatedUnitCost, notes } = req.body as {
      inventoryItemId?: number;
      itemName?: string;
      quantity?: number;
      unit?: string;
      estimatedUnitCost?: number;
      notes?: string;
    };
    if (!itemName || quantity == null || !unit) {
      res.status(400).json({ error: "itemName, quantity and unit are required" }); return;
    }

    const [order] = await db
      .select({ id: purchaseOrdersTable.id })
      .from(purchaseOrdersTable)
      .where(and(eq(purchaseOrdersTable.id, orderId), eq(purchaseOrdersTable.venueId, venueId)));
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    // Resolve estimatedUnitCost from inventory if not provided
    let resolvedCost = estimatedUnitCost ?? 0;
    if (!resolvedCost && inventoryItemId) {
      const [inv] = await db
        .select({ averageCost: inventoryItemsTable.averageCost })
        .from(inventoryItemsTable)
        .where(and(eq(inventoryItemsTable.id, inventoryItemId), eq(inventoryItemsTable.venueId, venueId)));
      if (inv?.averageCost) resolvedCost = parseFloat(inv.averageCost);
    }

    const [item] = await db.insert(purchaseOrderItemsTable).values({
      orderId,
      inventoryItemId: inventoryItemId ?? null,
      itemName,
      quantity: String(quantity),
      unit,
      estimatedUnitCost: String(resolvedCost),
      notes: notes ?? null,
    }).returning();

    // Recompute order total
    const allItems = await db
      .select({ qty: purchaseOrderItemsTable.quantity, cost: purchaseOrderItemsTable.estimatedUnitCost })
      .from(purchaseOrderItemsTable)
      .where(eq(purchaseOrderItemsTable.orderId, orderId));
    const newTotal = allItems.reduce((s, i) => s + parseFloat(i.qty) * parseFloat(i.cost), 0).toFixed(2);
    await db.update(purchaseOrdersTable)
      .set({ totalEstimatedCost: newTotal, updatedAt: new Date() })
      .where(eq(purchaseOrdersTable.id, orderId));

    res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to add PO item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update a purchase order item ───────────────────────────────────────────────
router.patch("/venues/:venueId/purchase-orders/:orderId/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const orderId = parseId(req.params["orderId"] as string);
  const itemId = parseId(req.params["itemId"] as string);
  if (!venueId || !orderId || !itemId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { quantity, estimatedUnitCost, notes } = req.body as {
      quantity?: number;
      estimatedUnitCost?: number;
      notes?: string;
    };

    const [order] = await db
      .select({ id: purchaseOrdersTable.id })
      .from(purchaseOrdersTable)
      .where(and(eq(purchaseOrdersTable.id, orderId), eq(purchaseOrdersTable.venueId, venueId)));
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const updates: Partial<typeof purchaseOrderItemsTable.$inferInsert> = {};
    if (quantity !== undefined) updates.quantity = String(quantity);
    if (estimatedUnitCost !== undefined) updates.estimatedUnitCost = String(estimatedUnitCost);
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(purchaseOrderItemsTable)
      .set(updates)
      .where(and(eq(purchaseOrderItemsTable.id, itemId), eq(purchaseOrderItemsTable.orderId, orderId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Item not found" }); return; }

    // Recompute order total
    const allItems = await db
      .select({ qty: purchaseOrderItemsTable.quantity, cost: purchaseOrderItemsTable.estimatedUnitCost })
      .from(purchaseOrderItemsTable)
      .where(eq(purchaseOrderItemsTable.orderId, orderId));
    const newTotal = allItems.reduce((s, i) => s + parseFloat(i.qty) * parseFloat(i.cost), 0).toFixed(2);
    await db.update(purchaseOrdersTable)
      .set({ totalEstimatedCost: newTotal, updatedAt: new Date() })
      .where(eq(purchaseOrdersTable.id, orderId));

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update PO item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete a purchase order item ───────────────────────────────────────────────
router.delete("/venues/:venueId/purchase-orders/:orderId/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const venueId = parseId(req.params["venueId"] as string);
  const orderId = parseId(req.params["orderId"] as string);
  const itemId = parseId(req.params["itemId"] as string);
  if (!venueId || !orderId || !itemId) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [order] = await db
      .select({ id: purchaseOrdersTable.id })
      .from(purchaseOrdersTable)
      .where(and(eq(purchaseOrdersTable.id, orderId), eq(purchaseOrdersTable.venueId, venueId)));
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const [deleted] = await db
      .delete(purchaseOrderItemsTable)
      .where(and(eq(purchaseOrderItemsTable.id, itemId), eq(purchaseOrderItemsTable.orderId, orderId)))
      .returning({ id: purchaseOrderItemsTable.id });
    if (!deleted) { res.status(404).json({ error: "Item not found" }); return; }

    // Recompute order total
    const allItems = await db
      .select({ qty: purchaseOrderItemsTable.quantity, cost: purchaseOrderItemsTable.estimatedUnitCost })
      .from(purchaseOrderItemsTable)
      .where(eq(purchaseOrderItemsTable.orderId, orderId));
    const newTotal = allItems.reduce((s, i) => s + parseFloat(i.qty) * parseFloat(i.cost), 0).toFixed(2);
    await db.update(purchaseOrdersTable)
      .set({ totalEstimatedCost: newTotal, updatedAt: new Date() })
      .where(eq(purchaseOrdersTable.id, orderId));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete PO item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
