import type {
  chemicalsTable,
  cleaningTasksTable,
  complianceTasksTable,
  recipesTable,
  temperatureEquipmentTable,
  temperatureLogsTable,
} from "@workspace/db";
import { cleaningFrequencyToDays } from "../routes/cleaning.js";

export type ComplianceSnapshot = {
  score: number;
  status: "ready" | "watch" | "action_required";
  totalIssues: number;
  temperatureUnresolvedFails: number;
  temperatureOverdueCount: number;
  cleaningOverdueCount: number;
  pendingTaskCount: number;
  blockedChemicalCount: number;
  headline: string;
};

function isCleaningOverdue(task: typeof cleaningTasksTable.$inferSelect, now = new Date()): boolean {
  if (!task.isActive) return false;
  if (!task.lastCompletedAt) return true;
  const elapsedDays = (now.getTime() - task.lastCompletedAt.getTime()) / 86_400_000;
  return elapsedDays >= cleaningFrequencyToDays(task.frequency);
}

export function buildComplianceSnapshot(input: {
  cleaningTasks: typeof cleaningTasksTable.$inferSelect[];
  temperatureEquipment: typeof temperatureEquipmentTable.$inferSelect[];
  todayTemperatureLogs: typeof temperatureLogsTable.$inferSelect[];
  complianceTasks: typeof complianceTasksTable.$inferSelect[];
  chemicals: typeof chemicalsTable.$inferSelect[];
}): ComplianceSnapshot {
  const activeCleaningTasks = input.cleaningTasks.filter((t) => t.isActive);
  const overdueCleaning = activeCleaningTasks.filter((t) => isCleaningOverdue(t));
  const unresolvedFails = input.todayTemperatureLogs.filter((log) => log.status === "fail" && log.isResolved !== true).length;

  const temperatureOverdueCount = input.temperatureEquipment.filter((equipment) => {
    if (!equipment.checkIntervalHours) return false;
    const latest = input.todayTemperatureLogs
      .filter((log) => log.equipmentId === equipment.id)
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())[0];
    if (!latest) return true;
    return (Date.now() - latest.checkedAt.getTime()) / 36e5 > equipment.checkIntervalHours;
  }).length;

  const pendingComplianceTasks = input.complianceTasks.filter((task) => task.status === "pending");
  const activeChemicals = input.chemicals.filter((chemical) =>
    chemical.isActive || chemical.complianceStatus === "missing" || chemical.complianceStatus === "expired",
  );
  const blockedChemicals = activeChemicals.filter((chemical) =>
    chemical.complianceStatus === "missing"
    || chemical.complianceStatus === "expired"
    || chemical.complianceStatus === "MISSING_MSDS"
    || chemical.complianceStatus === "EXPIRED",
  );

  const totalIssues = overdueCleaning.length + unresolvedFails + temperatureOverdueCount
    + pendingComplianceTasks.length + blockedChemicals.length;
  const score = Math.max(0, Math.round(100 - Math.min(100, totalIssues * 8)));
  const status = totalIssues === 0 ? "ready" : totalIssues <= 3 ? "watch" : "action_required";

  const headline = totalIssues === 0
    ? "Compliance checks are up to date"
    : unresolvedFails > 0
      ? `${unresolvedFails} temperature failure${unresolvedFails === 1 ? "" : "s"} need resolving`
      : `${totalIssues} compliance issue${totalIssues === 1 ? "" : "s"} need attention`;

  return {
    score,
    status,
    totalIssues,
    temperatureUnresolvedFails: unresolvedFails,
    temperatureOverdueCount,
    cleaningOverdueCount: overdueCleaning.length,
    pendingTaskCount: pendingComplianceTasks.length,
    blockedChemicalCount: blockedChemicals.length,
    headline,
  };
}
