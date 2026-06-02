import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import {
  CheckCircle2, Circle, Clock, ChefHat, RefreshCw,
  Thermometer, Trash2, ShieldCheck, X, ChevronDown, ChevronUp,
  AlertTriangle, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  description: string | null;
  notes: string | null;
  section: string;
  category: string;
  shift: string;
  assignedTo: string | null;
  status: string;
  priority: string;
  recipeName: string | null;
  deferredFrom: string | null;
  completedBy: string | null;
  completedAt: string | null;
}

interface CleaningTask {
  id: number;
  title: string;
  area: string;
  frequency: string;
  assignedTo: string | null;
  notes: string | null;
  lastCompletedAt: string | null;
}

interface Chemical {
  id: number;
  name: string;
  type: string;
  dilutionRatio: string | null;
  contactTimeSeconds: number | null;
  ppeRequired: string | null;
  sopInstructions: string | null;
  msdsUrl: string | null;
  complianceStatus: string;
}

interface StaffMember { id: number; name: string; role: string | null; }
interface InventoryItem { id: number; name: string; unit: string; parLevel: string | null; currentStock: string | null; averageCost: string | null; }
interface Equipment { id: number; name: string; type: string; minTemp: string | null; maxTemp: string | null; }

interface ServiceConfig {
  staff: StaffMember[];
  chemicals: Chemical[];
  inventory: InventoryItem[];
  equipment: Equipment[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { value: "hot",      label: "Hot Section",  color: "border-t-red-500" },
  { value: "hot_cook", label: "Hot / Cook",   color: "border-t-red-500" },
  { value: "meat",     label: "Meat",         color: "border-t-rose-600" },
  { value: "cold",     label: "Cold",         color: "border-t-sky-400" },
  { value: "fish",     label: "Fish",         color: "border-t-cyan-500" },
  { value: "seafood",  label: "Seafood",      color: "border-t-cyan-400" },
  { value: "larder",   label: "Larder",       color: "border-t-amber-500" },
  { value: "make",     label: "Make",         color: "border-t-amber-400" },
  { value: "sauce",    label: "Sauces",       color: "border-t-orange-500" },
  { value: "cut",      label: "Cut",          color: "border-t-violet-500" },
  { value: "pastry",   label: "Pastry",       color: "border-t-pink-400" },
  { value: "pass",     label: "Pass",         color: "border-t-slate-500" },
  { value: "other",    label: "Other",        color: "border-t-slate-400" },
];

const WASTE_REASONS = [
  { value: "spoilage",       label: "Spoilage" },
  { value: "overproduction", label: "Overproduction" },
  { value: "overcooked",     label: "Overcooked" },
  { value: "contamination",  label: "Contamination" },
  { value: "other",          label: "Other" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(dt: string | Date | null): string {
  if (!dt) return "";
  return new Date(dt as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ds: string) {
  return new Date(ds + "T00:00:00Z").toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

function fmtContactTime(s: number | null): string {
  if (!s) return "";
  return s < 60 ? `${s}s` : `${Math.round(s / 60)} min`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ServiceModePage() {
  const params = useParams<{ venueId: string }>();
  const venueId = params.venueId;
  const today = new Date().toISOString().slice(0, 10);

  // Staff selection — persisted to localStorage per venue
  const staffKey = `sm_staff_${venueId}`;
  const [activeStaff, setActiveStaff] = useState<string>(() => localStorage.getItem(staffKey) ?? "");
  const [showStaffPicker, setShowStaffPicker] = useState<boolean>(!localStorage.getItem(staffKey));

  // Core data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [config, setConfig] = useState<ServiceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Live clock
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Optimistic task overrides (instant UI before server confirms)
  const [optimistic, setOptimistic] = useState<Map<number, Partial<Task>>>(new Map());

  // "Who completed this?" picker — shown when tapping an incomplete task
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [pendingCompletedBy, setPendingCompletedBy] = useState<string>("");

  // Active bottom sheet
  const [activeSheet, setActiveSheet] = useState<"temp" | "waste" | "compliance" | null>(null);

  // Expanded items: cleaning task SOPs and chemical cards in compliance sheet
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Par-check alert after waste logging
  const [parAlert, setParAlert] = useState<{ item: string; current: string; par: string } | null>(null);

  // Quick forms
  const [tempForm, setTempForm] = useState({ equipmentId: "", itemName: "", temp: "" });
  const [tempBusy, setTempBusy] = useState(false);
  const [tempOk, setTempOk] = useState(false);

  const [wasteForm, setWasteForm] = useState({ inventoryItemId: "", itemName: "", quantity: "", unit: "", reason: "" });
  const [itemSearch, setItemSearch] = useState("");
  const [wasteBusy, setWasteBusy] = useState(false);
  const [wasteOk, setWasteOk] = useState(false);

  const [cleaningBusy, setCleaningBusy] = useState<number | null>(null);

  // Config — fetched once
  const configFetched = useRef(false);
  useEffect(() => {
    if (configFetched.current) return;
    configFetched.current = true;
    fetch(`/api/venues/${venueId}/service/config`)
      .then(r => r.ok ? r.json() as Promise<ServiceConfig> : null)
      .then(d => { if (d) setConfig(d); })
      .catch(() => {});
  }, [venueId]);

  // Tasks + cleaning — polled every 20s
  const fetchData = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/venues/${venueId}/prep-tasks/public?date=${today}`),
        fetch(`/api/venues/${venueId}/service/cleaning-tasks`),
      ]);
      if (tRes.ok) setTasks(await tRes.json() as Task[]);
      if (cRes.ok) setCleaningTasks(await cRes.json() as CleaningTask[]);
      setLastUpdated(new Date());
    } catch { /* retry on next cycle */ } finally {
      setLoading(false);
    }
  }, [venueId, today]);

  useEffect(() => {
    void fetchData();
    const iv = setInterval(() => void fetchData(), 20000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // Merged tasks with optimistic overlay
  const mergedTasks = tasks.map(t => {
    const opt = optimistic.get(t.id);
    return opt ? { ...t, ...opt } : t;
  });

  // Confirm completion with explicit staff selection
  const confirmComplete = useCallback(async (task: Task, staffName: string) => {
    const completing = task.status !== "done";
    const now = new Date().toISOString();
    setCompletingTask(null);
    setOptimistic(prev => {
      const next = new Map(prev);
      next.set(task.id, {
        status: completing ? "done" : "todo",
        completedBy: completing ? (staffName || null) : null,
        completedAt: completing ? now : null,
      });
      return next;
    });
    try {
      await fetch(`/api/venues/${venueId}/service/prep-tasks/${task.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedBy: staffName || null, undo: !completing }),
      });
    } catch { /* revert */ }
    setOptimistic(prev => { const n = new Map(prev); n.delete(task.id); return n; });
    void fetchData();
  }, [venueId, fetchData]);

  // Tap handler: undo immediately if done, show "who completed it?" picker if not
  const handleTaskTap = useCallback((task: Task) => {
    if (task.status === "done") {
      void confirmComplete(task, "");
    } else {
      setPendingCompletedBy(activeStaff || "");
      setCompletingTask(task);
    }
  }, [activeStaff, confirmComplete]);

  // Submit quick temperature log
  const submitTemp = async () => {
    if (!tempForm.temp) return;
    setTempBusy(true);
    try {
      const body: Record<string, unknown> = {
        temp: tempForm.temp,
        checkedBy: activeStaff || null,
      };
      if (tempForm.equipmentId) {
        body.equipmentId = parseInt(tempForm.equipmentId);
        body.itemName = config?.equipment.find(e => e.id === parseInt(tempForm.equipmentId))?.name;
      } else {
        body.itemName = tempForm.itemName || "Manual check";
      }
      const res = await fetch(`/api/venues/${venueId}/service/temperature-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setTempOk(true);
        setTempForm({ equipmentId: "", itemName: "", temp: "" });
        setTimeout(() => { setTempOk(false); setActiveSheet(null); }, 1200);
      }
    } finally { setTempBusy(false); }
  };

  // Submit quick waste log
  const submitWaste = async () => {
    if (!wasteForm.itemName || !wasteForm.quantity || !wasteForm.unit || !wasteForm.reason) return;
    setWasteBusy(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/service/waste-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: wasteForm.inventoryItemId ? parseInt(wasteForm.inventoryItemId) : undefined,
          itemName: wasteForm.itemName,
          quantity: wasteForm.quantity,
          unit: wasteForm.unit,
          reason: wasteForm.reason,
          loggedBy: activeStaff || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { parCheck: { belowPar: boolean; projectedStock: string; parLevel: string; itemName: string } | null };
        setWasteOk(true);
        setWasteForm({ inventoryItemId: "", itemName: "", quantity: "", unit: "", reason: "" });
        setItemSearch("");
        setTimeout(() => { setWasteOk(false); setActiveSheet(null); }, 1200);
        if (data.parCheck?.belowPar) {
          setTimeout(() => setParAlert({
            item: data.parCheck!.itemName,
            current: data.parCheck!.projectedStock,
            par: data.parCheck!.parLevel,
          }), 1500);
        }
      }
    } finally { setWasteBusy(false); }
  };

  // Complete cleaning task
  const completeCleaning = async (taskId: number) => {
    if (!activeStaff) return;
    setCleaningBusy(taskId);
    try {
      await fetch(`/api/venues/${venueId}/service/cleaning-tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedBy: activeStaff }),
      });
      void fetchData();
    } finally { setCleaningBusy(null); }
  };

  const selectStaff = (name: string) => {
    setActiveStaff(name);
    localStorage.setItem(staffKey, name);
    setShowStaffPicker(false);
  };

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const filteredInventory = (config?.inventory ?? []).filter(i =>
    itemSearch.length > 1 && i.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const totalPrep = mergedTasks.length;
  const donePrep = mergedTasks.filter(t => t.status === "done").length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">

      {/* ── Staff picker overlay ─────────────────────────────────────────────── */}
      {showStaffPicker && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Kitchen Command</p>
              <h1 className="text-4xl font-black text-white tracking-tight">Service Mode</h1>
              <p className="text-gray-400 mt-3 text-base">Who are you today?</p>
            </div>
            <div className="space-y-2">
              {config?.staff.map(s => (
                <button
                  key={s.id}
                  onClick={() => selectStaff(s.name)}
                  className="w-full py-4 px-5 rounded-2xl bg-gray-800 border border-gray-700 text-left hover:bg-gray-700 active:scale-[0.98] transition-all touch-manipulation"
                >
                  <span className="text-white font-bold text-lg block leading-tight">{s.name}</span>
                  {s.role && <span className="text-gray-400 text-sm">{s.role}</span>}
                </button>
              ))}
              {!config && (
                <div className="text-center text-gray-600 py-6 text-sm">Loading staff list...</div>
              )}
              <button
                onClick={() => selectStaff("")}
                className="w-full mt-2 py-3 px-5 rounded-2xl border border-gray-800 text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                Continue without name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky header ────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-border shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-black text-foreground tracking-tight leading-none">Service Mode</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">{fmtDate(today)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {totalPrep > 0 && (
              <span className={cn(
                "text-sm font-bold px-2.5 py-1 rounded-full tabular-nums",
                donePrep === totalPrep
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-muted-foreground"
              )}>
                {donePrep}/{totalPrep}
              </span>
            )}
            <div className="text-right">
              <span className="text-sm font-mono font-bold tabular-nums text-foreground block leading-tight">
                {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {clock.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>
            <button
              onClick={() => setShowStaffPicker(true)}
              className="flex items-center gap-1 text-xs border border-border rounded-full px-2.5 py-1.5 text-muted-foreground hover:bg-gray-50 transition-colors touch-manipulation"
            >
              <User className="w-3 h-3" />
              <span className="max-w-[72px] truncate">{activeStaff || "Set name"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main scrollable content ──────────────────────────────────────────── */}
      <div className="flex-1 px-3 py-4 pb-32 space-y-3">

        {loading ? (
          <div className="text-center py-24 text-muted-foreground text-sm">Loading...</div>
        ) : mergedTasks.length === 0 && cleaningTasks.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-bold text-foreground text-lg">No tasks for today</p>
            <p className="text-sm text-muted-foreground mt-1">Check back once the prep list has been built.</p>
          </div>
        ) : (
          <>
            {/* Prep task sections */}
            {SECTIONS.map(section => {
              const st = mergedTasks.filter(t => t.section === section.value);
              if (!st.length) return null;
              const doneCt = st.filter(t => t.status === "done").length;
              return (
                <div key={section.value} className={cn("bg-white rounded-2xl border border-border border-t-[3px] shadow-sm overflow-hidden", section.color)}>
                  {/* Section header */}
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-border">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{section.label}</span>
                    <span className={cn(
                      "text-xs font-bold tabular-nums",
                      doneCt === st.length ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {doneCt}/{st.length}
                    </span>
                  </div>
                  {/* Task rows */}
                  <div className="divide-y divide-border">
                    {st.map(task => {
                      const isDone = task.status === "done";
                      const isInProg = task.status === "in_progress";
                      return (
                        <div key={task.id} className={cn(
                          "flex items-start gap-0 transition-opacity duration-300",
                          isDone && "opacity-40"
                        )}>
                          {/* Tap target — full height button on the left */}
                          <button
                            onClick={() => handleTaskTap(task)}
                            className="shrink-0 flex items-center justify-center w-16 self-stretch active:bg-gray-100 transition-colors touch-manipulation"
                            aria-label={isDone ? "Undo" : "Mark done"}
                          >
                            {isDone
                              ? <CheckCircle2 className="w-7 h-7 text-green-500" />
                              : isInProg
                                ? <Clock className="w-7 h-7 text-primary" />
                                : <Circle className="w-7 h-7 text-gray-200" />}
                          </button>
                          {/* Content */}
                          <div className="flex-1 min-w-0 py-3 pr-4">
                            <p className={cn(
                              "font-semibold text-[15px] leading-snug text-foreground",
                              isDone && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </p>
                            {isDone && task.completedBy ? (
                              <p className="text-xs text-green-700 font-medium mt-0.5">
                                {task.completedBy}{task.completedAt ? ` — ${fmtTime(task.completedAt)}` : ""}
                              </p>
                            ) : (
                              <>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{task.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0 mt-1">
                                  {task.assignedTo && (
                                    <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
                                  )}
                                  {task.recipeName && (
                                    <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                                      <ChefHat className="w-3 h-3" />{task.recipeName}
                                    </span>
                                  )}
                                  {task.deferredFrom && (
                                    <span className="text-xs font-bold text-amber-600">Deferred</span>
                                  )}
                                  {task.priority === "high" && (
                                    <span className="text-xs font-bold text-red-500">Priority</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Cleaning tasks inline section */}
            {cleaningTasks.length > 0 && (
              <div className="bg-white rounded-2xl border border-border border-t-[3px] border-t-emerald-500 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-border">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cleaning & Sanitation</span>
                  <span className="text-xs font-bold text-muted-foreground">{cleaningTasks.length} tasks</span>
                </div>
                <div className="divide-y divide-border">
                  {cleaningTasks.map(task => {
                    const key = `cleaning-${task.id}`;
                    const isExpanded = expandedItems.has(key);
                    return (
                      <div key={task.id} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[15px] text-foreground leading-snug">{task.title}</p>
                            <div className="flex flex-wrap gap-x-3 mt-0.5">
                              {task.assignedTo && (
                                <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
                              )}
                              <span className="text-xs text-muted-foreground capitalize">
                                {task.frequency?.replace(/_/g, " ")}
                              </span>
                              {task.lastCompletedAt && (
                                <span className="text-xs text-emerald-600 font-medium">
                                  Last: {fmtTime(task.lastCompletedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {task.notes && (
                              <button
                                onClick={() => toggleExpanded(key)}
                                className="p-2 rounded-xl text-muted-foreground hover:bg-gray-100 transition-colors touch-manipulation"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => void completeCleaning(task.id)}
                              disabled={cleaningBusy === task.id || !activeStaff}
                              className="py-2 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold active:bg-emerald-700 disabled:opacity-40 transition-colors touch-manipulation"
                            >
                              {cleaningBusy === task.id ? "..." : "Done"}
                            </button>
                          </div>
                        </div>
                        {isExpanded && task.notes && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Notes / SOP</p>
                            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{task.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Auto-refresh note */}
        <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          <span>Live{lastUpdated ? ` — ${fmtTime(lastUpdated)}` : ""}</span>
        </div>
      </div>

      {/* ── Sticky bottom action bar ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border px-4 py-3 flex gap-3 shadow-2xl">
        <button
          onClick={() => { setActiveSheet("temp"); setTempOk(false); }}
          className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-blue-50 border border-blue-100 active:bg-blue-100 transition-colors touch-manipulation"
        >
          <Thermometer className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-black text-blue-700 tracking-wide">TEMP</span>
        </button>
        <button
          onClick={() => { setActiveSheet("waste"); setWasteOk(false); }}
          className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-red-50 border border-red-100 active:bg-red-100 transition-colors touch-manipulation"
        >
          <Trash2 className="w-5 h-5 text-red-600" />
          <span className="text-xs font-black text-red-700 tracking-wide">WASTE</span>
        </button>
        <button
          onClick={() => setActiveSheet("compliance")}
          className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 active:bg-emerald-100 transition-colors touch-manipulation"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-black text-emerald-700 tracking-wide">SAFETY</span>
        </button>
      </div>

      {/* ── "Who completed this?" picker sheet ──────────────────────────────── */}
      {completingTask && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setCompletingTask(null)} />
      )}
      {completingTask && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">Who completed this?</h2>
            <button onClick={() => setCompletingTask(null)} className="p-2 rounded-full hover:bg-gray-100 touch-manipulation">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground -mt-2 pb-1 border-b border-border font-semibold text-foreground">
            {completingTask.title}
          </p>
          {/* Staff list — large tap targets */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(config?.staff ?? []).map(s => (
              <button
                key={s.id}
                onClick={() => void confirmComplete(completingTask, s.name)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-colors touch-manipulation",
                  pendingCompletedBy === s.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0",
                  pendingCompletedBy === s.name ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground"
                )}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground leading-tight">{s.name}</p>
                  {s.role && <p className="text-xs text-muted-foreground">{s.role}</p>}
                </div>
                {pendingCompletedBy === s.name && (
                  <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
                )}
              </button>
            ))}
            <button
              onClick={() => void confirmComplete(completingTask, "")}
              className="w-full text-center py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:bg-gray-50 transition-colors touch-manipulation"
            >
              Mark done without a name
            </button>
          </div>
        </div>
      )}

      {/* ── Sheet backdrop ───────────────────────────────────────────────────── */}
      {activeSheet && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setActiveSheet(null)}
        />
      )}

      {/* ── Temperature quick-log sheet ──────────────────────────────────────── */}
      {activeSheet === "temp" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">Temperature Check</h2>
            <button onClick={() => setActiveSheet(null)} className="p-2 rounded-full hover:bg-gray-100 touch-manipulation">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {tempOk ? (
            <div className="text-center py-10 text-green-600 font-bold text-xl">Logged</div>
          ) : (
            <>
              {(config?.equipment?.length ?? 0) > 0 && (
                <div>
                  <label className="text-sm font-bold text-muted-foreground block mb-1.5">Equipment</label>
                  <select
                    value={tempForm.equipmentId}
                    onChange={e => setTempForm(f => ({ ...f, equipmentId: e.target.value, itemName: "" }))}
                    className="w-full border border-border rounded-2xl px-4 py-3.5 text-base bg-white appearance-none"
                  >
                    <option value="">Select equipment (or leave blank)</option>
                    {config!.equipment.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}{e.minTemp && e.maxTemp ? ` (${e.minTemp}–${e.maxTemp}°C)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!tempForm.equipmentId && (
                <div>
                  <label className="text-sm font-bold text-muted-foreground block mb-1.5">What are you probing?</label>
                  <input
                    type="text"
                    placeholder="e.g. Chicken delivery, Walk-in fridge"
                    value={tempForm.itemName}
                    onChange={e => setTempForm(f => ({ ...f, itemName: e.target.value }))}
                    className="w-full border border-border rounded-2xl px-4 py-3.5 text-base"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-1.5">Temperature (°C)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="0.0"
                  value={tempForm.temp}
                  onChange={e => setTempForm(f => ({ ...f, temp: e.target.value }))}
                  className="w-full border-2 border-border rounded-2xl px-4 py-4 text-4xl font-black text-center tabular-nums focus:border-primary outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={() => void submitTemp()}
                disabled={!tempForm.temp || tempBusy}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-lg active:bg-blue-700 disabled:opacity-40 transition-colors touch-manipulation"
              >
                {tempBusy ? "Logging..." : "Log Temperature"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Waste quick-log sheet ────────────────────────────────────────────── */}
      {activeSheet === "waste" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <h2 className="text-xl font-black text-foreground">Log Waste</h2>
            <button onClick={() => setActiveSheet(null)} className="p-2 rounded-full hover:bg-gray-100 touch-manipulation">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {wasteOk ? (
            <div className="text-center py-12 text-green-600 font-bold text-xl">Logged</div>
          ) : (
            <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-4">
              {/* Item search */}
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-1.5">Item</label>
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={itemSearch}
                  onChange={e => {
                    setItemSearch(e.target.value);
                    if (!e.target.value) {
                      setWasteForm(f => ({ ...f, inventoryItemId: "", itemName: "" }));
                    } else {
                      setWasteForm(f => ({ ...f, itemName: e.target.value, inventoryItemId: "" }));
                    }
                  }}
                  className="w-full border border-border rounded-2xl px-4 py-3.5 text-base"
                  autoFocus
                />
                {filteredInventory.length > 0 && !wasteForm.inventoryItemId && (
                  <div className="mt-1 border border-border rounded-2xl overflow-hidden max-h-44 overflow-y-auto">
                    {filteredInventory.slice(0, 8).map(i => (
                      <button
                        key={i.id}
                        onClick={() => {
                          setWasteForm(f => ({ ...f, inventoryItemId: String(i.id), itemName: i.name, unit: i.unit }));
                          setItemSearch(i.name);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-border last:border-0 active:bg-gray-100 touch-manipulation"
                      >
                        <span className="font-semibold text-foreground">{i.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">({i.unit})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Qty + unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-muted-foreground block mb-1.5">Quantity</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.0"
                    value={wasteForm.quantity}
                    onChange={e => setWasteForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-border rounded-2xl px-4 py-3.5 text-lg font-bold text-center tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground block mb-1.5">Unit</label>
                  <input
                    type="text"
                    placeholder="kg / litre..."
                    value={wasteForm.unit}
                    onChange={e => setWasteForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-border rounded-2xl px-4 py-3.5 text-base"
                  />
                </div>
              </div>

              {/* Reason pills */}
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">Reason</label>
                <div className="flex flex-wrap gap-2">
                  {WASTE_REASONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setWasteForm(f => ({ ...f, reason: r.value }))}
                      className={cn(
                        "py-2.5 px-4 rounded-2xl border text-sm font-bold transition-colors touch-manipulation",
                        wasteForm.reason === r.value
                          ? "bg-red-600 text-white border-red-600"
                          : "border-border text-foreground hover:bg-gray-50"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => void submitWaste()}
                disabled={!wasteForm.itemName || !wasteForm.quantity || !wasteForm.unit || !wasteForm.reason || wasteBusy}
                className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-lg active:bg-red-700 disabled:opacity-40 transition-colors touch-manipulation"
              >
                {wasteBusy ? "Logging..." : "Log Waste"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Compliance / Chemical safety sheet ──────────────────────────────── */}
      {activeSheet === "compliance" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
            <h2 className="text-xl font-black text-foreground">Chemical Safety</h2>
            <button onClick={() => setActiveSheet(null)} className="p-2 rounded-full hover:bg-gray-100 touch-manipulation">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
            {(!config?.chemicals || config.chemicals.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No chemicals registered. Add chemicals in the Chemical Safety page.
              </div>
            ) : (
              config.chemicals.map(chem => {
                const key = `chem-${chem.id}`;
                const isExpanded = expandedItems.has(key);
                return (
                  <div key={chem.id} className="border border-border rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleExpanded(key)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-gray-50 touch-manipulation"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground leading-tight">{chem.name}</p>
                        <div className="flex flex-wrap gap-x-3 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{chem.type}</span>
                          {chem.dilutionRatio && (
                            <span className="text-xs font-semibold text-blue-600">{chem.dilutionRatio}</span>
                          )}
                          {chem.contactTimeSeconds && (
                            <span className="text-xs font-semibold text-amber-600">{fmtContactTime(chem.contactTimeSeconds)}</span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 ml-2" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-4 py-4 space-y-3">
                        {/* Spec grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {chem.dilutionRatio && (
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs font-black text-blue-700 uppercase tracking-wide mb-1">Dilution</p>
                              <p className="text-sm font-bold text-foreground">{chem.dilutionRatio}</p>
                            </div>
                          )}
                          {chem.contactTimeSeconds && (
                            <div className="bg-amber-50 rounded-xl p-3">
                              <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-1">Contact Time</p>
                              <p className="text-sm font-bold text-foreground">{fmtContactTime(chem.contactTimeSeconds)}</p>
                            </div>
                          )}
                          {chem.ppeRequired && (
                            <div className="bg-red-50 rounded-xl p-3 col-span-2">
                              <p className="text-xs font-black text-red-700 uppercase tracking-wide mb-1">PPE Required</p>
                              <p className="text-sm font-bold text-foreground capitalize">
                                {chem.ppeRequired.split(",").map(s => s.trim()).join(" · ")}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* SOP */}
                        {chem.sopInstructions && (
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2">Step-by-step SOP</p>
                            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{chem.sopInstructions}</p>
                          </div>
                        )}

                        {/* MSDS link */}
                        {chem.msdsUrl && (
                          <a
                            href={chem.msdsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-border text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                          >
                            View MSDS / Safety Data Sheet
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Par check alert ──────────────────────────────────────────────────── */}
      {parAlert && (
        <div className="fixed inset-x-3 bottom-28 z-50">
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900">Stock below par</p>
                <p className="text-sm text-amber-800 mt-0.5">
                  {parAlert.item} — {parAlert.current} left, par is {parAlert.par}
                </p>
              </div>
              <button onClick={() => setParAlert(null)} className="p-1 text-amber-500 touch-manipulation">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <a
                href="/prep-board"
                onClick={() => setParAlert(null)}
                className="flex-1 py-3 rounded-xl bg-amber-600 text-white text-sm font-black text-center touch-manipulation"
              >
                Add prep task
              </a>
              <button
                onClick={() => setParAlert(null)}
                className="flex-1 py-3 rounded-xl border-2 border-amber-300 text-amber-900 text-sm font-black touch-manipulation"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
