import type { MergedOrderItem } from "../types/commandCentre.js";
import type { EnrichedInventoryItem } from "./inventoryStatus.js";
import type { PrepPlanResult } from "./prepPlan.js";

export function buildParBasedOrderItems(
  enriched: EnrichedInventoryItem[],
  supplierNames: Map<number, string>,
): MergedOrderItem[] {
  return enriched
    .filter((item) => item.parLevel > 0 && item.stockNum < item.parLevel)
    .map((item) => {
      const parGap = Math.max(0, item.parLevel - item.stockNum);
      return {
        inventoryItemId: item.id,
        itemName: item.name,
        suggestedQty: Math.round(parGap * 1000) / 1000,
        unit: item.unit,
        supplierId: item.supplierId,
        supplierName: item.supplierId ? supplierNames.get(item.supplierId) ?? null : null,
        estimatedCost: Math.round(parGap * item.costNum * 100) / 100,
        reason: "par_gap" as const,
        demandGapQuantity: 0,
        parGapQuantity: Math.round(parGap * 1000) / 1000,
      };
    })
    .sort((a, b) => b.estimatedCost - a.estimatedCost);
}

export function mergeDemandAndParOrdering(
  plan: PrepPlanResult | null,
  enriched: EnrichedInventoryItem[],
  supplierNames: Map<number, string>,
): { items: MergedOrderItem[]; source: "demand_and_par" | "par_only"; demandOrderGapCount: number } {
  if (!plan || plan.totalCovers <= 0) {
    const items = buildParBasedOrderItems(enriched, supplierNames);
    return { items, source: "par_only", demandOrderGapCount: 0 };
  }

  const enrichedById = new Map(enriched.map((item) => [item.id, item]));
  const merged = new Map<number, MergedOrderItem>();

  for (const req of plan.orderingRequirements) {
    const item = enrichedById.get(req.inventoryItemId);
    const estimatedCost = item
      ? Math.round(req.suggestedOrderQuantity * item.costNum * 100) / 100
      : 0;
    merged.set(req.inventoryItemId, {
      inventoryItemId: req.inventoryItemId,
      itemName: req.itemName,
      suggestedQty: req.suggestedOrderQuantity,
      unit: req.unit,
      supplierId: req.supplierId,
      supplierName: req.supplierId ? supplierNames.get(req.supplierId) ?? null : null,
      estimatedCost,
      reason: req.reason === "Demand and par gap"
        ? "demand_and_par"
        : req.reason === "Demand gap"
          ? "demand_gap"
          : "par_gap",
      demandGapQuantity: req.demandGapQuantity,
      parGapQuantity: req.parGapQuantity,
    });
  }

  for (const parItem of buildParBasedOrderItems(enriched, supplierNames)) {
    const existing = merged.get(parItem.inventoryItemId);
    if (!existing) {
      merged.set(parItem.inventoryItemId, parItem);
      continue;
    }
    if (parItem.suggestedQty > existing.suggestedQty) {
      merged.set(parItem.inventoryItemId, {
        ...existing,
        suggestedQty: parItem.suggestedQty,
        estimatedCost: Math.max(existing.estimatedCost, parItem.estimatedCost),
        reason: existing.demandGapQuantity > 0 ? "demand_and_par" : "par_gap",
        parGapQuantity: parItem.parGapQuantity,
      });
    }
  }

  const items = [...merged.values()]
    .filter((item) => item.suggestedQty > 0)
    .sort((a, b) => b.estimatedCost - a.estimatedCost);

  const demandOrderGapCount = plan.orderingRequirements.filter((req) => req.demandGapQuantity > 0).length;
  return { items, source: "demand_and_par", demandOrderGapCount };
}

export function orderTodayHeadline(itemCount: number, urgentCutoffCount: number, source: "demand_and_par" | "par_only"): string {
  if (itemCount === 0) return "Stock levels meet requirements — no urgent ordering gaps";
  if (urgentCutoffCount > 0) return `${itemCount} item${itemCount === 1 ? "" : "s"} to order — supplier cutoff soon`;
  return source === "demand_and_par"
    ? `${itemCount} item${itemCount === 1 ? "" : "s"} to order for today's service`
    : `${itemCount} item${itemCount === 1 ? "" : "s"} below par`;
}
