import { useMemo } from "react";
import { useServiceCountdown } from "./useServiceCountdown";
import type { ServiceCountdownResult, ServiceWindow } from "./useServiceCountdown";
import type { PrepTask } from "@workspace/api-client-react";

export type ServiceModePhase =
  | "NO_SERVICE_DEFINED"
  | "PRE_SERVICE"
  | "RAMPING_UP"
  | "CRITICAL_PREP"
  | "IN_SERVICE"
  | "POST_SERVICE";

export type PressureLevel = "low" | "building" | "high";

export type StationLoad = {
  section: string;
  label: string;
  total: number;
  incomplete: number;
  isBehind: boolean;
  loadLevel: "heavy" | "normal" | "light" | "empty";
};

export type ServicePressureResult = {
  phase: ServiceModePhase;
  phaseLabel: string;
  pressureScore: number;
  pressureLevel: PressureLevel;
  stationLoads: StationLoad[];
  realityCheckText: string | null;
  countdownText: string;
  subText: string | null;
  minutesUntilService: number | null;
  minutesRemaining: number | null;
  activeWindow: ServiceWindow | null;
  nextWindow: ServiceWindow | null;
};

const STATION_LABELS: Record<string, string> = {
  hot_cook:     "Hot / Cook",
  make:         "Make",
  cut:          "Cut",
  garde_manger: "Garde Manger",
  pastry:       "Pastry",
  butchery:     "Butchery",
  seafood:      "Seafood",
  other:        "Other",
};

const STATIONS = Object.keys(STATION_LABELS);

const PHASE_LABELS: Record<ServiceModePhase, string> = {
  NO_SERVICE_DEFINED: "",
  PRE_SERVICE:   "Pre-Service",
  RAMPING_UP:    "Ramping Up",
  CRITICAL_PREP: "Critical Prep",
  IN_SERVICE:    "In Service",
  POST_SERVICE:  "Post-Service",
};

function extendPhase(countdown: ServiceCountdownResult): ServiceModePhase {
  switch (countdown.phase) {
    case "NO_SERVICE_DEFINED": return "NO_SERVICE_DEFINED";
    case "IN_SERVICE":         return "IN_SERVICE";
    case "POST_SERVICE":       return "POST_SERVICE";
    default: {
      const min = countdown.minutesUntilService;
      if (min === null) return "PRE_SERVICE";
      if (min <= 30)    return "CRITICAL_PREP";
      if (min <= 60)    return "RAMPING_UP";
      return "PRE_SERVICE";
    }
  }
}

function computePressureScore(
  tasks: PrepTask[],
  phase: ServiceModePhase,
  countdown: ServiceCountdownResult,
): number {
  if (tasks.length === 0) return 0;
  if (phase === "POST_SERVICE" || phase === "NO_SERVICE_DEFINED") return 0;

  const incomplete = tasks.filter((t) => t.status !== "done");
  const highOrCritical = tasks.filter((t) => t.priority === "high" || t.isCritical);
  const highOrCriticalIncomplete = incomplete.filter((t) => t.priority === "high" || t.isCritical);

  const incompleteScore = (incomplete.length / tasks.length) * 100;
  const highScore = highOrCritical.length > 0
    ? (highOrCriticalIncomplete.length / highOrCritical.length) * 100
    : 0;

  const min = countdown.minutesUntilService ?? (countdown.minutesRemaining != null ? 0 : 120);
  const timeScore =
    min <= 10 ? 95 :
    min <= 20 ? 80 :
    min <= 30 ? 65 :
    min <= 60 ? 40 :
    min <= 90 ? 20 : 5;

  return Math.min(100, Math.round(incompleteScore * 0.30 + highScore * 0.45 + timeScore * 0.25));
}

function computeStationLoads(
  tasks: PrepTask[],
  minutesUntilService: number | null,
): StationLoad[] {
  return STATIONS.map((section) => {
    const sectionTasks = tasks.filter((t) => t.section === section);
    const incomplete = sectionTasks.filter((t) => t.status !== "done");
    const total = sectionTasks.length;
    const incompleteRatio = total > 0 ? incomplete.length / total : 0;

    const estRequired = incomplete.reduce(
      (sum, t) => sum + (t.estimatedDurationMinutes ?? 15),
      0
    );
    const isBehind =
      incompleteRatio > 0.3 &&
      minutesUntilService !== null &&
      estRequired > minutesUntilService;

    const loadLevel: StationLoad["loadLevel"] =
      total === 0 ? "empty" :
      incomplete.length > 5 || (total > 2 && incompleteRatio >= 0.7) ? "heavy" :
      incompleteRatio < 0.25 ? "light" : "normal";

    return {
      section,
      label: STATION_LABELS[section] ?? section,
      total,
      incomplete: incomplete.length,
      isBehind,
      loadLevel,
    };
  });
}

function derivePressureLevel(score: number): PressureLevel {
  if (score <= 30) return "low";
  if (score <= 70) return "building";
  return "high";
}

function buildResult(
  countdown: ServiceCountdownResult,
  tasks: PrepTask[],
): ServicePressureResult {
  const phase = extendPhase(countdown);
  const pressureScore = computePressureScore(tasks, phase, countdown);
  const stationLoads = computeStationLoads(tasks, countdown.minutesUntilService);

  let realityCheckText: string | null = null;
  if (phase === "CRITICAL_PREP" && tasks.length > 0) {
    const incomplete = tasks.filter((t) => t.status !== "done");
    const pct = Math.round((incomplete.length / tasks.length) * 100);
    if (pct > 0) {
      realityCheckText = `At current pace, ${pct}% of prep will remain incomplete before service`;
    }
  }

  return {
    phase,
    phaseLabel: PHASE_LABELS[phase],
    pressureScore,
    pressureLevel: derivePressureLevel(pressureScore),
    stationLoads,
    realityCheckText,
    countdownText: countdown.countdownText,
    subText: countdown.subText,
    minutesUntilService: countdown.minutesUntilService,
    minutesRemaining: countdown.minutesRemaining,
    activeWindow: countdown.activeWindow,
    nextWindow: countdown.nextWindow,
  };
}

export function useServicePressure(
  tasks: PrepTask[],
  serviceWindows: ServiceWindow[] | null | undefined,
): ServicePressureResult {
  const countdown = useServiceCountdown(serviceWindows);

  return useMemo(
    () => buildResult(countdown, tasks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countdown, tasks],
  );
}
