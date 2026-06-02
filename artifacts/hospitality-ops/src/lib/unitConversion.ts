export type UnitMode = "listed" | "kg" | "L" | "100g";

// Normalise a raw unit string to a canonical category and a multiplier to base unit
// Weight base: kg.  Volume base: L.
const WEIGHT_MAP: Record<string, number> = {
  kg: 1, kilo: 1, kilogram: 1, kilograms: 1,
  g: 0.001, gram: 0.001, grams: 0.001,
  lb: 0.453592, lbs: 0.453592, pound: 0.453592, pounds: 0.453592,
  oz: 0.028350, ounce: 0.028350, ounces: 0.028350,
};

const VOLUME_MAP: Record<string, number> = {
  l: 1, L: 1, litre: 1, liter: 1, litres: 1, liters: 1,
  ml: 0.001, milliliter: 0.001, millilitre: 0.001, milliliters: 0.001, millilitres: 0.001,
  "fl oz": 0.029574, floz: 0.029574,
  cup: 0.236588, cups: 0.236588,
  pt: 0.473176, pint: 0.473176, pints: 0.473176,
  qt: 0.946353, quart: 0.946353, quarts: 0.946353,
};

export type UnitCategory = "weight" | "volume" | "each";

export interface UnitInfo {
  category: UnitCategory;
  /** how many base units (kg or L) per 1 of this unit. null for "each" */
  toBaseMultiplier: number | null;
}

export function parseUnit(unit: string): UnitInfo {
  const key = unit.trim().toLowerCase();
  if (WEIGHT_MAP[key] !== undefined) return { category: "weight", toBaseMultiplier: WEIGHT_MAP[key] };
  if (VOLUME_MAP[key] !== undefined || VOLUME_MAP[unit.trim()] !== undefined) {
    const mult = VOLUME_MAP[key] ?? VOLUME_MAP[unit.trim()];
    return { category: "volume", toBaseMultiplier: mult };
  }
  return { category: "each", toBaseMultiplier: null };
}

/**
 * Convert a cost-per-unit value to the requested display mode.
 * Returns null if conversion is not possible (e.g. weight item → per L).
 */
export function convertCost(
  cost: number,
  unit: string,
  mode: UnitMode
): number | null {
  if (mode === "listed") return cost;

  const info = parseUnit(unit);
  if (info.category === "each" || info.toBaseMultiplier === null) return null;

  if (mode === "kg" || mode === "100g") {
    if (info.category !== "weight") return null;
    const costPerKg = cost / info.toBaseMultiplier;
    return mode === "100g" ? costPerKg / 10 : costPerKg;
  }

  if (mode === "L") {
    if (info.category !== "volume") return null;
    return cost / info.toBaseMultiplier;
  }

  return null;
}

export function modeLabel(mode: UnitMode): string {
  switch (mode) {
    case "listed": return "as listed";
    case "kg": return "/ kg";
    case "L": return "/ L";
    case "100g": return "/ 100g";
  }
}

export function modeSuffix(mode: UnitMode): string {
  switch (mode) {
    case "listed": return "";
    case "kg": return "/kg";
    case "L": return "/L";
    case "100g": return "/100g";
  }
}
