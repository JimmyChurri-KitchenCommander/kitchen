import { useMemo, useState } from "react";
import type { PrepTask } from "@workspace/api-client-react";

export type ChefMode = "assist" | "directive" | "silent";

export type FocusTask = PrepTask & { urgencyScore: number };

export type Bottleneck = {
  section: string;
  label: string;
  incomplete: number;
  estimatedMinutes: number;
};

export type StaffLoad = {
  name: string;
  incomplete: number;
  estimatedMinutes: number;
  isOverloaded: boolean;
};

export type ServiceIntelligenceResult = {
  focusQueue: FocusTask[];
  bottlenecks: Bottleneck[];
  stopDoing: PrepTask[];
  staffLoads: StaffLoad[];
  chefMode: ChefMode;
  setChefMode: (mode: ChefMode) => void;
};

const SECTION_LABELS: Record<string, string> = {
  hot_cook:     "Hot / Cook",
  make:         "Make",
  cut:          "Cut",
  garde_manger: "Garde Manger",
  pastry:       "Pastry",
  butchery:     "Butchery",
  seafood:      "Seafood",
  other:        "Other",
};

function urgencyScore(task: PrepTask): number {
  if (task.status === "done") return -1000;
  let score = 0;
  if (task.isCritical)             score += 50;
  if (task.priority === "high")    score += 30;
  if (task.priority === "medium")  score += 15;
  if (task.status === "in_progress") score += 20;
  if ((task.estimatedDurationMinutes ?? 0) <= 10 && task.estimatedDurationMinutes) score += 10;
  return score;
}

function buildFocusQueue(tasks: PrepTask[]): FocusTask[] {
  return tasks
    .filter(t => t.status !== "done")
    .map(t => ({ ...t, urgencyScore: urgencyScore(t) }))
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 6);
}

function buildBottlenecks(tasks: PrepTask[], minutesUntilService: number | null): Bottleneck[] {
  const threshold = minutesUntilService ?? 60;
  const sections = [...new Set(tasks.map(t => t.section))];
  return sections
    .map(section => {
      const incomplete = tasks.filter(t => t.section === section && t.status !== "done");
      const estMinutes = incomplete.reduce((s, t) => s + (t.estimatedDurationMinutes ?? 15), 0);
      return {
        section,
        label: SECTION_LABELS[section] ?? section,
        incomplete: incomplete.length,
        estimatedMinutes: estMinutes,
      };
    })
    .filter(b => b.incomplete > 0 && b.estimatedMinutes > threshold)
    .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes)
    .slice(0, 4);
}

function buildStopDoing(tasks: PrepTask[]): PrepTask[] {
  return tasks
    .filter(t =>
      t.status === "todo" &&
      !t.isCritical &&
      t.priority === "low" &&
      (t.estimatedDurationMinutes == null || t.estimatedDurationMinutes <= 30)
    )
    .slice(0, 5);
}

function buildStaffLoads(tasks: PrepTask[]): StaffLoad[] {
  const map = new Map<string, { incomplete: number; estimatedMinutes: number }>();
  for (const t of tasks) {
    const name = t.assignedTo?.trim();
    if (!name || t.status === "done") continue;
    const cur = map.get(name) ?? { incomplete: 0, estimatedMinutes: 0 };
    map.set(name, {
      incomplete: cur.incomplete + 1,
      estimatedMinutes: cur.estimatedMinutes + (t.estimatedDurationMinutes ?? 15),
    });
  }
  const loads = Array.from(map.entries()).map(([name, d]) => ({ name, ...d, isOverloaded: false }));
  if (loads.length < 2) return loads;
  const avg = loads.reduce((s, l) => s + l.estimatedMinutes, 0) / loads.length;
  return loads
    .map(l => ({ ...l, isOverloaded: l.estimatedMinutes > avg * 1.5 }))
    .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);
}

export function useServiceIntelligence(
  tasks: PrepTask[],
  minutesUntilService: number | null,
): ServiceIntelligenceResult {
  const [chefMode, setChefMode] = useState<ChefMode>(() => {
    return (localStorage.getItem("chefMode") as ChefMode | null) ?? "assist";
  });

  const handleSetChefMode = (mode: ChefMode) => {
    setChefMode(mode);
    localStorage.setItem("chefMode", mode);
  };

  const focusQueue = useMemo(() => buildFocusQueue(tasks), [tasks]);
  const bottlenecks = useMemo(() => buildBottlenecks(tasks, minutesUntilService), [tasks, minutesUntilService]);
  const stopDoing = useMemo(() => buildStopDoing(tasks), [tasks]);
  const staffLoads = useMemo(() => buildStaffLoads(tasks), [tasks]);

  return { focusQueue, bottlenecks, stopDoing, staffLoads, chefMode, setChefMode: handleSetChefMode };
}
