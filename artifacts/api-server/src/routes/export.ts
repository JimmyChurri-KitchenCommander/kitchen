import { Router } from "express";
import { db } from "@workspace/db";
import {
  venuesTable, wasteLogsTable, recipesTable, recipeIngredientsTable,
  inventoryItemsTable, stocktakesTable, stocktakeItemsTable,
  temperatureLogsTable, temperatureEquipmentTable,
  cleaningLogsTable, cleaningTasksTable,
  chemicalsTable, complianceTasksTable,
} from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

router.get("/venues/:venueId/export", requireAuth, async (req, res): Promise<void> => {
  try {
    const venueId = parseInt(req.params["venueId"] as string);
    const { type, from, to } = req.query as Record<string, string>;

    const [venue] = await db.select().from(venuesTable)
      .where(and(eq(venuesTable.id, venueId), eq(venuesTable.userId, req.userId!)));
    if (!venue) { res.status(404).json({ error: "Venue not found" }); return; }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to + "T23:59:59") : new Date();
    const dateLabel = `${fromDate.toISOString().split("T")[0]}_to_${toDate.toISOString().split("T")[0]}`;

    const exportedAt = new Date();
    const exportedAtStr = exportedAt.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
      + " at " + exportedAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

    function brandedHeader(reportName: string): string[] {
      return [
        "Kitchen Command",
        `Report: ${reportName}`,
        `Venue: ${venue.name}`,
        `Exported: ${exportedAtStr}`,
        "",
      ];
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");

    // ── Waste export ──────────────────────────────────────────────────────────
    if (type === "waste") {
      res.setHeader("Content-Disposition", `attachment; filename="${venue.name.replace(/\s+/g, "-")}-waste-${dateLabel}.csv"`);
      const rows = await db.select().from(wasteLogsTable)
        .where(and(
          eq(wasteLogsTable.venueId, venueId),
          gte(wasteLogsTable.loggedAt, fromDate),
          lte(wasteLogsTable.loggedAt, toDate),
        ));

      const totalCost = rows.reduce((sum, r) => sum + parseFloat(r.costImpact), 0);
      const lines = [
        ...brandedHeader("Waste Log"),
        `Period: ${fromDate.toLocaleDateString("en-AU")} to ${toDate.toLocaleDateString("en-AU")}`,
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
      res.send(lines.join("\n")); return;
    }

    // ── Food cost / recipe export ─────────────────────────────────────────────
    if (type === "food-cost") {
      res.setHeader("Content-Disposition", `attachment; filename="${venue.name.replace(/\s+/g, "-")}-food-cost-${dateLabel}.csv"`);
      const recipes = await db.select().from(recipesTable).where(eq(recipesTable.venueId, venueId));

      const rows: string[] = [];
      for (const recipe of recipes) {
        const ingredients = await db
          .select({
            qty: recipeIngredientsTable.quantity,
            yf: recipeIngredientsTable.yieldFactor,
            unit: recipeIngredientsTable.unit,
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

        const recipeYield = parseFloat(recipe.yield ?? "1");
        const portionSize = parseFloat(recipe.portionSize ?? "1");
        const portionCost = recipeYield > 0 ? (totalCost / recipeYield) * portionSize : totalCost;
        const sellingPrice = recipe.sellingPrice ? parseFloat(recipe.sellingPrice) : null;
        const fcPct = sellingPrice && sellingPrice > 0 ? (portionCost / sellingPrice) * 100 : null;
        const gpPct = sellingPrice && sellingPrice > 0 ? ((sellingPrice - portionCost) / sellingPrice) * 100 : null;

        rows.push([
          csvEscape(recipe.name),
          csvEscape(recipe.category),
          csvEscape(totalCost.toFixed(2)),
          csvEscape(portionCost.toFixed(2)),
          csvEscape(sellingPrice ? sellingPrice.toFixed(2) : ""),
          csvEscape(fcPct != null ? fcPct.toFixed(1) + "%" : ""),
          csvEscape(gpPct != null ? gpPct.toFixed(1) + "%" : ""),
        ].join(","));
      }

      const lines = [
        ...brandedHeader("Food Cost Report"),
        "Recipe,Category,Total Cost ($),Cost per Portion ($),Selling Price ($),Food Cost %,GP %",
        ...rows,
      ];
      res.send(lines.join("\n")); return;
    }

    // ── Stocktake export ──────────────────────────────────────────────────────
    if (type === "stocktake") {
      res.setHeader("Content-Disposition", `attachment; filename="${venue.name.replace(/\s+/g, "-")}-stocktakes-${dateLabel}.csv"`);
      const takes = await db.select().from(stocktakesTable)
        .where(and(
          eq(stocktakesTable.venueId, venueId),
          gte(stocktakesTable.conductedAt, fromDate),
          lte(stocktakesTable.conductedAt, toDate),
        ));

      const lines = [
        ...brandedHeader("Stocktake Report"),
        `Period: ${fromDate.toLocaleDateString("en-AU")} to ${toDate.toLocaleDateString("en-AU")}`,
        "",
        "Stocktake Date,Status,Item,Unit,Expected,Actual,Variance,Unit Cost ($),Variance Value ($)",
      ];

      for (const take of takes) {
        const items = await db.select().from(stocktakeItemsTable)
          .where(eq(stocktakeItemsTable.stocktakeId, take.id));
        for (const item of items) {
          const variance = parseFloat(item.variance);
          const varianceValue = variance * parseFloat(item.unitCost);
          lines.push([
            csvEscape(new Date(take.conductedAt).toLocaleDateString("en-AU")),
            csvEscape(take.status),
            csvEscape(item.itemName),
            csvEscape(item.unit),
            csvEscape(item.expectedStock),
            csvEscape(item.actualStock),
            csvEscape(item.variance),
            csvEscape(parseFloat(item.unitCost).toFixed(4)),
            csvEscape(varianceValue.toFixed(2)),
          ].join(","));
        }
      }
      res.send(lines.join("\n")); return;
    }

    // ── Temperature logs export ───────────────────────────────────────────────
    if (type === "temperature-logs") {
      res.setHeader("Content-Disposition", `attachment; filename="${venue.name.replace(/\s+/g, "-")}-temperature-logs-${dateLabel}.csv"`);
      const logs = await db
        .select({
          logType: temperatureLogsTable.logType,
          itemName: temperatureLogsTable.itemName,
          equipmentName: temperatureEquipmentTable.name,
          minTemp: temperatureEquipmentTable.minTemp,
          maxTemp: temperatureEquipmentTable.maxTemp,
          recordedTemp: temperatureLogsTable.recordedTemp,
          status: temperatureLogsTable.status,
          checkedBy: temperatureLogsTable.checkedBy,
          checkedAt: temperatureLogsTable.checkedAt,
          notes: temperatureLogsTable.notes,
          correctiveAction: temperatureLogsTable.correctiveAction,
          recheckTemp: temperatureLogsTable.recheckTemp,
          isResolved: temperatureLogsTable.isResolved,
        })
        .from(temperatureLogsTable)
        .leftJoin(temperatureEquipmentTable, eq(temperatureLogsTable.equipmentId, temperatureEquipmentTable.id))
        .where(and(
          eq(temperatureLogsTable.venueId, venueId),
          gte(temperatureLogsTable.checkedAt, fromDate),
          lte(temperatureLogsTable.checkedAt, toDate),
        ));

      const passCount = logs.filter(l => l.status === "pass").length;
      const failCount = logs.filter(l => l.status === "fail").length;
      const lines = [
        ...brandedHeader("Temperature Log"),
        `Period: ${fromDate.toLocaleDateString("en-AU")} to ${toDate.toLocaleDateString("en-AU")}`,
        `Total checks: ${logs.length} | Pass: ${passCount} | Fail: ${failCount}`,
        "",
        "Date,Time,Check Type,Equipment / Item,Recorded Temp (°C),Min (°C),Max (°C),Status,Checked By,Notes,Corrective Action,Recheck Temp (°C),Resolved",
        ...logs.map(l => [
          csvEscape(new Date(l.checkedAt).toLocaleDateString("en-AU")),
          csvEscape(new Date(l.checkedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })),
          csvEscape(l.logType === "equipment_check" ? "Equipment Check" : l.logType === "delivery_probe" ? "Delivery Probe" : l.logType),
          csvEscape(l.equipmentName ?? l.itemName),
          csvEscape(l.recordedTemp),
          csvEscape(l.minTemp ?? ""),
          csvEscape(l.maxTemp ?? ""),
          csvEscape(l.status === "pass" ? "PASS" : l.status === "fail" ? "FAIL" : l.status),
          csvEscape(l.checkedBy),
          csvEscape(l.notes),
          csvEscape(l.correctiveAction),
          csvEscape(l.recheckTemp),
          csvEscape(l.isResolved == null ? "" : l.isResolved ? "Yes" : "No"),
        ].join(",")),
      ];
      res.send(lines.join("\n")); return;
    }

    // ── Cleaning log export ───────────────────────────────────────────────────
    if (type === "cleaning-logs") {
      res.setHeader("Content-Disposition", `attachment; filename="${venue.name.replace(/\s+/g, "-")}-cleaning-log-${dateLabel}.csv"`);
      const logs = await db
        .select({
          completedAt: cleaningLogsTable.completedAt,
          completedBy: cleaningLogsTable.completedBy,
          notes: cleaningLogsTable.notes,
          taskTitle: cleaningTasksTable.title,
          area: cleaningTasksTable.area,
          frequency: cleaningTasksTable.frequency,
        })
        .from(cleaningLogsTable)
        .leftJoin(cleaningTasksTable, eq(cleaningLogsTable.taskId, cleaningTasksTable.id))
        .where(and(
          eq(cleaningLogsTable.venueId, venueId),
          gte(cleaningLogsTable.completedAt, fromDate),
          lte(cleaningLogsTable.completedAt, toDate),
        ));

      const lines = [
        ...brandedHeader("Cleaning Log"),
        `Period: ${fromDate.toLocaleDateString("en-AU")} to ${toDate.toLocaleDateString("en-AU")}`,
        `Total completions logged: ${logs.length}`,
        "",
        "Date,Task,Area,Frequency,Completed By,Notes",
        ...logs.map(l => [
          csvEscape(new Date(l.completedAt).toLocaleDateString("en-AU")),
          csvEscape(l.taskTitle),
          csvEscape(l.area),
          csvEscape(l.frequency),
          csvEscape(l.completedBy),
          csvEscape(l.notes),
        ].join(",")),
      ];
      res.send(lines.join("\n")); return;
    }

    // ── Chemical safety register export ───────────────────────────────────────
    if (type === "chemicals") {
      res.setHeader("Content-Disposition", `attachment; filename="${venue.name.replace(/\s+/g, "-")}-chemical-register-${dateLabel}.csv"`);
      const chemicals = await db.select().from(chemicalsTable)
        .where(and(eq(chemicalsTable.venueId, venueId), eq(chemicalsTable.isActive, true)));

      const lines = [
        ...brandedHeader("Chemical Safety Register"),
        `Total chemicals: ${chemicals.length}`,
        "",
        "Name,Type,Dilution Ratio,Contact Time (sec),PPE Required,Compliance Status,MSDS Version,MSDS Expiry,Notes",
        ...chemicals.map(c => [
          csvEscape(c.name),
          csvEscape(c.type),
          csvEscape(c.dilutionRatio),
          csvEscape(c.contactTimeSeconds),
          csvEscape(c.ppeRequired),
          csvEscape(c.complianceStatus),
          csvEscape(c.msdsVersion),
          csvEscape(c.msdsExpiryDate),
          csvEscape(c.notes),
        ].join(",")),
      ];
      res.send(lines.join("\n")); return;
    }

    // ── Compliance actions export ─────────────────────────────────────────────
    if (type === "compliance-actions") {
      res.setHeader("Content-Disposition", `attachment; filename="${venue.name.replace(/\s+/g, "-")}-compliance-actions-${dateLabel}.csv"`);
      const tasks = await db
        .select({
          createdAt: complianceTasksTable.createdAt,
          type: complianceTasksTable.type,
          title: complianceTasksTable.title,
          status: complianceTasksTable.status,
          resolvedBy: complianceTasksTable.resolvedBy,
          resolvedAt: complianceTasksTable.resolvedAt,
          chemicalName: chemicalsTable.name,
        })
        .from(complianceTasksTable)
        .leftJoin(chemicalsTable, eq(complianceTasksTable.chemicalId, chemicalsTable.id))
        .where(and(
          eq(complianceTasksTable.venueId, venueId),
          gte(complianceTasksTable.createdAt, fromDate),
          lte(complianceTasksTable.createdAt, toDate),
        ));

      const pending = tasks.filter(t => t.status === "pending").length;
      const resolved = tasks.filter(t => t.status === "resolved").length;
      const lines = [
        ...brandedHeader("Compliance Actions"),
        `Period: ${fromDate.toLocaleDateString("en-AU")} to ${toDate.toLocaleDateString("en-AU")}`,
        `Total: ${tasks.length} | Pending: ${pending} | Resolved: ${resolved}`,
        "",
        "Created,Type,Title,Chemical,Status,Resolved By,Resolved At",
        ...tasks.map(t => [
          csvEscape(new Date(t.createdAt).toLocaleDateString("en-AU")),
          csvEscape(t.type === "attach_msds" ? "Attach MSDS" : t.type === "renew_msds" ? "Renew MSDS" : "General"),
          csvEscape(t.title),
          csvEscape(t.chemicalName),
          csvEscape(t.status === "pending" ? "Pending" : "Resolved"),
          csvEscape(t.resolvedBy),
          csvEscape(t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString("en-AU") : ""),
        ].join(",")),
      ];
      res.send(lines.join("\n")); return;
    }

    res.status(400).json({ error: "type must be one of: waste, food-cost, stocktake, temperature-logs, cleaning-logs, chemicals, compliance-actions" });
  } catch (err) {
    req.log.error({ err }, "Failed to export data");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
