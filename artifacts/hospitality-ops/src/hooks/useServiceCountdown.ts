import { useState, useEffect } from "react";
import type { ServiceWindow } from "@workspace/api-client-react";

export type { ServiceWindow };

export type ServicePhase = "PRE_SERVICE" | "IN_SERVICE" | "POST_SERVICE" | "NO_SERVICE_DEFINED";

export type ServiceCountdownResult = {
  phase: ServicePhase;
  activeWindow: ServiceWindow | null;
  nextWindow: ServiceWindow | null;
  minutesUntilService: number | null;
  minutesRemaining: number | null;
  countdownText: string;
  subText: string | null;
};

const NO_SERVICE: ServiceCountdownResult = {
  phase: "NO_SERVICE_DEFINED",
  activeWindow: null,
  nextWindow: null,
  minutesUntilService: null,
  minutesRemaining: null,
  countdownText: "",
  subText: null,
};

function parseTimeToday(timeStr: string): Date {
  const parts = timeStr.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function fmt(minutes: number): string {
  if (minutes < 1) return "less than a minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function compute(windows: ServiceWindow[], now: Date): ServiceCountdownResult {
  const enabled = windows.filter((w) => w.enabled);
  if (enabled.length === 0) return NO_SERVICE;

  const sorted = [...enabled].sort(
    (a, b) => parseTimeToday(a.startTime).getTime() - parseTimeToday(b.startTime).getTime()
  );

  const nowMs = now.getTime();

  for (const w of sorted) {
    const start = parseTimeToday(w.startTime);
    const end = parseTimeToday(w.endTime);
    if (nowMs >= start.getTime() && nowMs < end.getTime()) {
      const minutesRemaining = Math.max(0, Math.floor((end.getTime() - nowMs) / 60000));
      return {
        phase: "IN_SERVICE",
        activeWindow: w,
        nextWindow: null,
        minutesUntilService: null,
        minutesRemaining,
        countdownText: `${w.label} active — ${fmt(minutesRemaining)} remaining`,
        subText: `Ends at ${w.endTime}`,
      };
    }
  }

  for (const w of sorted) {
    const start = parseTimeToday(w.startTime);
    if (nowMs < start.getTime()) {
      const minutesUntilService = Math.floor((start.getTime() - nowMs) / 60000);
      return {
        phase: "PRE_SERVICE",
        activeWindow: null,
        nextWindow: w,
        minutesUntilService,
        minutesRemaining: null,
        countdownText: `${w.label} starts in ${fmt(minutesUntilService)}`,
        subText: `Service from ${w.startTime}–${w.endTime}`,
      };
    }
  }

  return {
    phase: "POST_SERVICE",
    activeWindow: null,
    nextWindow: sorted[0] ?? null,
    minutesUntilService: null,
    minutesRemaining: null,
    countdownText: "All services complete for today",
    subText: sorted[0] ? `Next: ${sorted[0].label} at ${sorted[0].startTime} tomorrow` : null,
  };
}

export function useServiceCountdown(
  serviceWindows: ServiceWindow[] | null | undefined
): ServiceCountdownResult {
  const [result, setResult] = useState<ServiceCountdownResult>(() => {
    if (!serviceWindows?.length) return NO_SERVICE;
    return compute(serviceWindows, new Date());
  });

  useEffect(() => {
    if (!serviceWindows?.length) {
      setResult(NO_SERVICE);
      return;
    }
    const update = () => setResult(compute(serviceWindows, new Date()));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [serviceWindows]);

  return result;
}
