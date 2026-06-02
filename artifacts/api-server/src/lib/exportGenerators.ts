import { db } from "@workspace/db";
import {
  venuesTable, wasteLogsTable, recipesTable, recipeIngredientsTable,
  inventoryItemsTable, stocktakesTable, stocktakeItemsTable,
  suppliersTable, priceHistoryTable, temperatureLogsTable, temperatureEquipmentTable,
} from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export type ExportType = "waste" | "food-cost" | "stocktake" | "inventory" | "temperature" | "suppliers";

export interface GeneratedExport {
  fileName: string;
  csv: string;
  recordCount: number;
}

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function slug(name: string) {
  return name.replace(/\s+/g, "-").toLowerCase();
}

export async function generateExport(
  venueId: number,
  type: ExportType,
  fromDate: Date,
  toDate: Date,
): Promise<GeneratedExport> {
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue) throw new Error("Venue not found");

  const dateLabel = `${fromDate.toISOString().split("T")[0]}_to_${toDate.toISOString().split("T")[0]}`;

  switch (type) {
    case "waste": return generateWaste(venue.name, venueId, fromDate, toDate, dateLabel);
    case "food-cost": return generateFoodCost(venue.name, venueId, dateLabel);
    case "stocktake": return generateStocktake(venue.name, venueId, fromDate, toDate, dateLabel);
    case "inventory": return generateInventory(venue.name, venueId, dateLabel);
    case "temperature": return generateTemperature(venue.name, venueId, fromDate, toDate, dateLabel);
    case "suppliers": return generateSuppliers(venue.name, venueId, fromDate, toDate, dateLabel);
    default: throw new Error(`Unknown export type: ${type}`);
  }
}

async function generateWaste(venueName: string, venueId: number, from: Date, to: Date, dateLabel: string): Promise<GeneratedExport> {
  const rows = await db.select().from(wasteLogsTable).where(and(
    eq(wasteLogsTable.venueId, venueId),
    gte(wasteLogsTable.loggedAt, from),
    lte(wasteLogsTable.loggedAt, to),
  ));
  const totalCost = rows.reduce((sum, r) => sum + parseFloat(r.costImpact), 0);
  const lines = [
    `Waste Log — ${venueName}`,
    `Period: ${from.toLocaleDateString("en-AU")} to ${to.toLocaleDateString("en-AU")}`,
    `Total waste cost: $${totalCost.toFixed(2)}`,
    "",
    "Date,Item,Quantity,Unit,Cost ($),Reason,Notes",
    ...rows.map(r => [
      csvEscape(new Date(r.loggedAt).toLocaleDateString("en-AU")),
      csvEscape(r.itemName),
      csvEscape(r.quantity),
      csvEscape(r.unit),
      csvEscape(parseFloat(r.costImpact).toFixed(2)),
      csvEscape(r.reason),
      csvEscape(r.notes),
    ].join(",")),
  ];
  return { fileName: `${slug(venueName)}-waste-${dateLabel}.csv`, csv: lines.join("\n"), recordCount: rows.length };
}

async function generateFoodCost(venueName: string, venueId: number, dateLabel: string): Promise<GeneratedExport> {
  const recipes = await db.select().from(recipesTable).where(eq(recipesTable.venueId, venueId));
  const rows: string[] = [];
  for (const recipe of recipes) {
    const ingredients = await db
      .select({
        qty: recipeIngredientsTable.quantity,
        yf: recipeIngredientsTable.yieldFactor,
        itemName: inventoryItemsTable.name,
        avgCost: inventoryItemsTable.averageCost,
      })
      .from(recipeIngredientsTable)
      .leftJoin(inventoryItemsTable, eq(recipeIngredientsTable.inventoryItemId, inventoryItemsTable.id))
      .where(eq(recipeIngredientsTable.recipeId, recipe.id));

    const totalCost = ingredients.reduce((sum, i) => {
      const netQty = parseFloat(i.qty);
      const yf = parseFloat(i.yf ?? "1");
      const grossQty = yf > 0 ? netQty / yf : netQty;
      return sum + (i.avgCost ? parseFloat(i.avgCost) * grossQty : 0);
    }, 0);
    const recipeYield = parseFloat(recipe.yield);
    const portionSize = parseFloat(recipe.portionSize);
    const portionCost = recipeYield > 0 ? (totalCost / recipeYield) * portionSize : totalCost;
    const sellingPrice = recipe.sellingPrice ? parseFloat(recipe.sellingPrice) : null;
    const fcPct = sellingPrice && sellingPrice > 0 ? (portionCost / sellingPrice) * 100 : null;
    const gpPct = sellingPrice ? ((sellingPrice - portionCost) / sellingPrice) * 100 : null;
    rows.push([
      csvEscape(recipe.name), csvEscape(recipe.category),
      csvEscape(totalCost.toFixed(2)), csvEscape(portionCost.toFixed(2)),
      csvEscape(sellingPrice?.toFixed(2) ?? ""),
      csvEscape(fcPct ? fcPct.toFixed(1) + "%" : ""),
      csvEscape(gpPct ? gpPct.toFixed(1) + "%" : ""),
    ].join(","));
  }
  const lines = [
    `Food Cost Report — ${venueName}`, `Generated: ${new Date().toLocaleDateString("en-AU")}`, "",
    "Recipe,Category,Total Cost ($),Cost per Portion ($),Selling Price ($),Food Cost %,GP %",
    ...rows,
  ];
  return { fileName: `${slug(venueName)}-food-cost-${dateLabel}.csv`, csv: lines.join("\n"), recordCount: recipes.length };
}

async function generateStocktake(venueName: string, venueId: number, from: Date, to: Date, dateLabel: string): Promise<GeneratedExport> {
  const takes = await db.select().from(stocktakesTable).where(and(
    eq(stocktakesTable.venueId, venueId),
    gte(stocktakesTable.conductedAt, from),
    lte(stocktakesTable.conductedAt, to),
  ));
  const lines = [
    `Stocktake Report — ${venueName}`,
    `Period: ${from.toLocaleDateString("en-AU")} to ${to.toLocaleDateString("en-AU")}`, "",
    "Stocktake Date,Status,Item,Unit,Expected,Actual,Variance,Unit Cost ($),Variance Value ($)",
  ];
  let rowCount = 0;
  for (const take of takes) {
    const items = await db.select().from(stocktakeItemsTable).where(eq(stocktakeItemsTable.stocktakeId, take.id));
    for (const item of items) {
      const variance = parseFloat(item.variance);
      lines.push([
        csvEscape(new Date(take.conductedAt).toLocaleDateString("en-AU")),
        csvEscape(take.status), csvEscape(item.itemName), csvEscape(item.unit),
        csvEscape(item.expectedStock), csvEscape(item.actualStock), csvEscape(item.variance),
        csvEscape(parseFloat(item.unitCost).toFixed(4)),
        csvEscape((variance * parseFloat(item.unitCost)).toFixed(2)),
      ].join(","));
      rowCount++;
    }
  }
  return { fileName: `${slug(venueName)}-stocktake-${dateLabel}.csv`, csv: lines.join("\n"), recordCount: rowCount };
}

async function generateInventory(venueName: string, venueId: number, dateLabel: string): Promise<GeneratedExport> {
  const items = await db.select().from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.venueId, venueId));
  const lines = [
    `Inventory Snapshot — ${venueName}`, `Generated: ${new Date().toLocaleDateString("en-AU")}`, "",
    "Item,Unit,Current Stock,Par Level,Average Cost ($),Total Value ($),Status",
    ...items.map(i => {
      const stock = parseFloat(i.currentStock);
      const cost = i.averageCost ? parseFloat(i.averageCost) : 0;
      const par = i.parLevel ? parseFloat(i.parLevel) : 0;
      const stockStatus = stock <= 0 ? "out" : par > 0 && stock < par ? "low" : "ok";
      return [
        csvEscape(i.name), csvEscape(i.unit),
        csvEscape(stock.toFixed(3)),
        csvEscape(par > 0 ? par.toFixed(3) : ""),
        csvEscape(cost.toFixed(4)), csvEscape((stock * cost).toFixed(2)),
        csvEscape(stockStatus),
      ].join(",");
    }),
  ];
  return { fileName: `${slug(venueName)}-inventory-${dateLabel}.csv`, csv: lines.join("\n"), recordCount: items.length };
}

async function generateTemperature(venueName: string, venueId: number, from: Date, to: Date, dateLabel: string): Promise<GeneratedExport> {
  const logs = await db
    .select({
      checkedAt: temperatureLogsTable.checkedAt,
      recordedTemp: temperatureLogsTable.recordedTemp,
      status: temperatureLogsTable.status,
      notes: temperatureLogsTable.notes,
      checkedBy: temperatureLogsTable.checkedBy,
      equipmentName: temperatureEquipmentTable.name,
      equipmentType: temperatureEquipmentTable.type,
    })
    .from(temperatureLogsTable)
    .leftJoin(temperatureEquipmentTable, eq(temperatureLogsTable.equipmentId, temperatureEquipmentTable.id))
    .where(and(
      eq(temperatureLogsTable.venueId, venueId),
      gte(temperatureLogsTable.checkedAt, from),
      lte(temperatureLogsTable.checkedAt, to),
    ))
    .orderBy(desc(temperatureLogsTable.checkedAt));

  const lines = [
    `Temperature Log — ${venueName}`,
    `Period: ${from.toLocaleDateString("en-AU")} to ${to.toLocaleDateString("en-AU")}`, "",
    "Date,Time,Equipment,Type,Temperature (°C),Status,Checked By,Notes",
    ...logs.map(l => [
      csvEscape(new Date(l.checkedAt).toLocaleDateString("en-AU")),
      csvEscape(new Date(l.checkedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })),
      csvEscape(l.equipmentName), csvEscape(l.equipmentType),
      csvEscape(parseFloat(l.recordedTemp).toFixed(1)),
      csvEscape(l.status), csvEscape(l.checkedBy), csvEscape(l.notes),
    ].join(",")),
  ];
  return { fileName: `${slug(venueName)}-temperature-${dateLabel}.csv`, csv: lines.join("\n"), recordCount: logs.length };
}

async function generateSuppliers(venueName: string, venueId: number, from: Date, to: Date, dateLabel: string): Promise<GeneratedExport> {
  const suppliers = await db.select().from(suppliersTable).where(eq(suppliersTable.venueId, venueId));
  const priceRows = await db.select({
    supplierName: suppliersTable.name,
    itemName: priceHistoryTable.itemName,
    newPrice: priceHistoryTable.newPrice,
    oldPrice: priceHistoryTable.oldPrice,
    recordedAt: priceHistoryTable.recordedAt,
  })
    .from(priceHistoryTable)
    .leftJoin(suppliersTable, eq(priceHistoryTable.supplierId, suppliersTable.id))
    .leftJoin(inventoryItemsTable, eq(priceHistoryTable.inventoryItemId, inventoryItemsTable.id))
    .where(and(
      eq(suppliersTable.venueId, venueId),
      gte(priceHistoryTable.recordedAt, from),
      lte(priceHistoryTable.recordedAt, to),
    ))
    .orderBy(desc(priceHistoryTable.recordedAt));

  const lines = [
    `Supplier Price History — ${venueName}`,
    `Period: ${from.toLocaleDateString("en-AU")} to ${to.toLocaleDateString("en-AU")}`,
    `Suppliers tracked: ${suppliers.length}`, "",
    "Date,Supplier,Item,New Price ($),Old Price ($),Change",
    ...priceRows.map(r => {
      const newP = parseFloat(r.newPrice);
      const oldP = r.oldPrice ? parseFloat(r.oldPrice) : null;
      const change = oldP ? (((newP - oldP) / oldP) * 100).toFixed(1) + "%" : "";
      return [
        csvEscape(new Date(r.recordedAt).toLocaleDateString("en-AU")),
        csvEscape(r.supplierName), csvEscape(r.itemName),
        csvEscape(newP.toFixed(4)), csvEscape(oldP ? oldP.toFixed(4) : ""),
        csvEscape(change),
      ].join(",");
    }),
  ];
  return { fileName: `${slug(venueName)}-suppliers-${dateLabel}.csv`, csv: lines.join("\n"), recordCount: priceRows.length };
}
