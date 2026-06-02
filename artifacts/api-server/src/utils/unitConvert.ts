const weightToKg: Record<string, number> = {
  kg: 1, g: 0.001, gram: 0.001, grams: 0.001,
  lb: 0.453592, lbs: 0.453592, pound: 0.453592, pounds: 0.453592,
  oz: 0.028349, ounce: 0.028349, ounces: 0.028349,
};

const volumeToMl: Record<string, number> = {
  ml: 1, millilitre: 1, milliliter: 1, millilitres: 1, milliliters: 1,
  l: 1000, litre: 1000, liter: 1000, litres: 1000, liters: 1000,
  "fl oz": 29.5735, floz: 29.5735,
  cup: 240, cups: 240,
  tbsp: 15, tablespoon: 15, tablespoons: 15,
  tsp: 5, teaspoon: 5, teaspoons: 5,
  pint: 473.176, pints: 473.176, pt: 473.176,
  quart: 946.353, quarts: 946.353, qt: 946.353,
  gallon: 3785.41, gallons: 3785.41, gal: 3785.41,
};

const countUnits = new Set([
  "each", "piece", "pieces", "pc", "pcs", "whole", "no.", "#",
  "count", "unit", "units", "head", "bunch", "sprig", "sprigs",
  "leaf", "leaves", "slice", "slices", "rasher", "rashers",
  "fillet", "fillets", "stalk", "stalks", "clove", "cloves",
  "portion", "portions", "can", "tin", "bag", "sachet", "packet",
  "pod", "pods", "floret", "florets", "spear", "spears",
  "strip", "strips", "sheet", "roll",
]);

const pieceWeightG: Record<string, number> = {
  tomato: 150, "cherry tomato": 20, "plum tomato": 120, "beef tomato": 250,
  "heritage tomato": 150, "vine tomato": 140,
  egg: 60, "whole egg": 60,
  lemon: 100, lime: 80, orange: 180, grapefruit: 350,
  "garlic clove": 5, clove: 5,
  onion: 200, "red onion": 200, "white onion": 200, "brown onion": 200,
  shallot: 30, "banana shallot": 60,
  potato: 150, "baby potato": 40, "new potato": 40, "king edward": 250,
  carrot: 120, "baby carrot": 20,
  courgette: 200, zucchini: 200, "baby courgette": 60,
  avocado: 200,
  "bell pepper": 180, capsicum: 180, pepper: 160,
  chilli: 15, "red chilli": 15, "green chilli": 10, "birds eye chilli": 5,
  corn: 280, "corn cob": 280,
  artichoke: 300, "globe artichoke": 300,
  fennel: 300,
  aubergine: 350, eggplant: 350,
  "butternut squash": 1000,
  apple: 180, pear: 180, fig: 50,
  scallop: 40, "hand-dived scallop": 40, "king scallop": 60, "queen scallop": 20,
  oyster: 80,
  prawn: 15, "king prawn": 25, "tiger prawn": 20,
  anchovy: 5, "anchovy fillet": 5,
  sardine: 80, mussel: 20, clam: 15,
  rasher: 30, slice: 25,
  sprig: 3, leaf: 2, "bay leaf": 1,
  bunch: 100, head: 400, "head of garlic": 60, "head of lettuce": 350,
  stalk: 15, "celery stalk": 50,
  "spring onion": 15, scallion: 15,
  "portion": 150,
};

function getUnitCategory(unit: string): "weight" | "volume" | "count" | "other" {
  const u = unit.toLowerCase().trim();
  if (weightToKg[u] !== undefined) return "weight";
  if (volumeToMl[u] !== undefined) return "volume";
  if (countUnits.has(u)) return "count";
  return "other";
}

function findPieceWeightG(itemName: string, unit: string): number | null {
  const unitLower = unit.toLowerCase().trim();
  if (pieceWeightG[unitLower] !== undefined) return pieceWeightG[unitLower];

  const lower = itemName.toLowerCase();
  if (pieceWeightG[lower] !== undefined) return pieceWeightG[lower];

  let bestKey = "";
  let bestWeight = 0;
  for (const [key, weight] of Object.entries(pieceWeightG)) {
    if (lower.includes(key) && key.length > bestKey.length) {
      bestKey = key;
      bestWeight = weight;
    }
  }
  return bestKey ? bestWeight : null;
}

export function convertUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  itemName?: string,
): number | null {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  if (from === to) return quantity;

  const fromCat = getUnitCategory(from);
  const toCat = getUnitCategory(to);

  if (fromCat === "weight" && toCat === "weight") {
    return (quantity * weightToKg[from]!) / weightToKg[to]!;
  }
  if (fromCat === "volume" && toCat === "volume") {
    return (quantity * volumeToMl[from]!) / volumeToMl[to]!;
  }
  if (fromCat === "count" && toCat === "weight" && itemName) {
    const gPerPiece = findPieceWeightG(itemName, from);
    if (gPerPiece !== null) {
      return (quantity * gPerPiece * 0.001) / weightToKg[to]!;
    }
  }
  if (fromCat === "count" && toCat === "volume" && itemName) {
    const gPerPiece = findPieceWeightG(itemName, from);
    if (gPerPiece !== null) {
      const mlEquiv = gPerPiece;
      return (quantity * mlEquiv) / volumeToMl[to]!;
    }
  }
  return null;
}

export function computeGrossQtyForCost(
  netQty: number,
  recipeUnit: string,
  yieldFactor: number,
  inventoryUnit: string,
  itemName: string,
): { grossQtyForCost: number; converted: boolean; conversionNote?: string } {
  const grossInRecipeUnit = yieldFactor > 0 ? netQty / yieldFactor : netQty;

  if (recipeUnit.toLowerCase().trim() === inventoryUnit.toLowerCase().trim()) {
    return { grossQtyForCost: grossInRecipeUnit, converted: false };
  }

  const converted = convertUnits(grossInRecipeUnit, recipeUnit, inventoryUnit, itemName);
  if (converted !== null) {
    return {
      grossQtyForCost: converted,
      converted: true,
      conversionNote: `${grossInRecipeUnit.toFixed(3)} ${recipeUnit} → ${converted.toFixed(4)} ${inventoryUnit}`,
    };
  }

  return {
    grossQtyForCost: grossInRecipeUnit,
    converted: false,
    conversionNote: `Unit mismatch (${recipeUnit} / ${inventoryUnit}) — using raw quantity`,
  };
}
