/** Shared inventory status helpers — canonical source for par/stock classification. */

const HIGH_RISK_SPOILAGE_CATEGORIES = new Set(["Meat", "Seafood", "Dairy"]);
const HIGH_RISK_IDLE_DAYS = 5;

export function computeStagnantDays(lastRestocked: Date | null): number {
  if (!lastRestocked) return 0;
  return Math.floor((Date.now() - new Date(lastRestocked).getTime()) / 86_400_000);
}

export function computeInventoryStatus(
  currentStock: string | number,
  parLevel: string | number,
  shelfLifeDays: number | null,
  stagnantDays: number,
  expiresAt: Date | null = null,
  category: string | null = null,
): string {
  const stock = typeof currentStock === "number" ? currentStock : parseFloat(currentStock);
  const par = typeof parLevel === "number" ? parLevel : parseFloat(parLevel);
  if (stock === 0) return "critical";
  if (expiresAt) {
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
    if (daysUntilExpiry <= 3) return "expiry_risk";
  }
  if (category && HIGH_RISK_SPOILAGE_CATEGORIES.has(category)) {
    if (shelfLifeDays && stagnantDays >= shelfLifeDays * 0.8) return "expiry_risk";
    if (stagnantDays >= HIGH_RISK_IDLE_DAYS) return "expiry_risk";
  }
  if (par > 0 && stagnantDays >= 7) return "stagnant";
  if (par > 0 && stock < par * 0.25) return "critical";
  if (par > 0 && stock < par * 0.5) return "low_stock";
  return "healthy";
}

export type EnrichedInventoryItem = {
  id: number;
  name: string;
  unit: string;
  supplierId: number | null;
  productionRecipeId: number | null;
  stockNum: number;
  costNum: number;
  parLevel: number;
  stagnantDays: number;
  status: string;
};

export function enrichInventoryItem(
  item: {
    id: number;
    name: string;
    unit: string;
    supplierId: number | null;
    productionRecipeId: number | null;
    currentStock: string;
    averageCost: string;
    parLevel: string;
    shelfLifeDays: number | null;
    lastRestocked: Date | null;
    expiresAt?: Date | null;
    category?: string | null;
  },
): EnrichedInventoryItem {
  const stagnantDays = computeStagnantDays(item.lastRestocked);
  const status = computeInventoryStatus(
    item.currentStock,
    item.parLevel,
    item.shelfLifeDays,
    stagnantDays,
    item.expiresAt ?? null,
    item.category ?? null,
  );
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    supplierId: item.supplierId,
    productionRecipeId: item.productionRecipeId,
    stockNum: parseFloat(item.currentStock),
    costNum: parseFloat(item.averageCost),
    parLevel: parseFloat(item.parLevel),
    stagnantDays,
    status,
  };
}
