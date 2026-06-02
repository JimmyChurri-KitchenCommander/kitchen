import { useVenueStore } from "@/stores/venueStore";
import {
  useGetDashboard, useGetVenue, useListPrepTasks, useUpdatePrepTask, useUpdateVenue,
  useGetTemperatureSummary, useListInvoices, useGetFoodCostConfidence, useGetSetupProgress,
  getGetDashboardQueryKey, getGetVenueQueryKey, getListPrepTasksQueryKey, getGetTemperatureSummaryQueryKey, getListInvoicesQueryKey, getGetFoodCostConfidenceQueryKey, getGetSetupProgressQueryKey,
} from "@workspace/api-client-react";
import type { PrepTask } from "@workspace/api-client-react";
import { useServicePressure } from "@/hooks/useServicePressure";
import type { ServicePressureResult } from "@/hooks/useServicePressure";
import { useServiceIntelligence } from "@/hooks/useServiceIntelligence";
import type { ServiceIntelligenceResult } from "@/hooks/useServiceIntelligence";
import { useIntelligenceStage } from "@/hooks/useIntelligenceStage";
import { IntelligenceUnlockBanner } from "@/components/IntelligenceUnlockBanner";
import { useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  DollarSign,
  PackageMinus,
  ArrowRight,
  Plus,
  ChefHat,
  ClipboardList,
  CheckCircle2,
  Circle,
  User,
  Thermometer,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Timer,
  Activity,
  Zap,
  Gauge,
  Lock,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const TODAY = new Date().toISOString().split("T")[0];

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const SECTION_LABELS: Record<string, string> = {
  mise_en_place: "Mise en Place",
  stocks_sauces: "Stocks & Sauces",
  pastry: "Pastry",
  butchery: "Butchery",
  veg_prep: "Veg Prep",
  cleaning: "Cleaning",
  other: "Other",
};

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 pt-1">
      {children}
    </p>
  );
}

// ─── S1: Temperature quick-action card ───────────────────────────────────────

function TemperatureActionCard({ venueId }: { venueId: number }) {
  const { data: summary, isLoading } = useGetTemperatureSummary(venueId, {
    query: { enabled: !!venueId, queryKey: getGetTemperatureSummaryQueryKey(venueId) },
  });

  if (isLoading) {
    return <Skeleton className="h-20 bg-secondary rounded-xl" />;
  }

  const failItem = summary?.equipmentStatus.find(e => e.lastStatus === "fail");
  const hasFail = (summary?.unresolvedFails ?? 0) > 0;
  const hasOverdue = (summary?.overdueCount ?? 0) > 0;
  const noEquipment = !summary || summary.equipmentCount === 0;

  const urgent = hasFail;
  const warning = !urgent && hasOverdue;

  return (
    <Link href="/temperature" className="col-span-2">
      <div className={cn(
        "rounded-xl p-4 transition-all active:scale-[0.99] cursor-pointer",
        urgent ? "bg-red-50 border-2 border-red-400" :
        warning ? "bg-amber-50 border-2 border-amber-400" :
        "bg-green-50 border border-green-200"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              urgent ? "bg-red-100" : warning ? "bg-amber-100" : "bg-green-100"
            )}>
              <Thermometer className={cn(
                "w-5 h-5",
                urgent ? "text-red-600" : warning ? "text-amber-600" : "text-green-600"
              )} />
            </div>
            <div>
              <p className={cn(
                "text-sm font-bold",
                urgent ? "text-red-800" : warning ? "text-amber-800" : "text-green-800"
              )}>
                Temperature Checks
              </p>
              {urgent && failItem && (
                <p className="text-xs text-red-600 font-medium mt-0.5">
                  {failItem.name} outside safe range
                </p>
              )}
              {urgent && !failItem && (
                <p className="text-xs text-red-600 font-medium mt-0.5">
                  {summary!.unresolvedFails} unresolved {summary!.unresolvedFails === 1 ? "fail" : "fails"} today
                </p>
              )}
              {warning && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  {summary!.overdueCount} {summary!.overdueCount === 1 ? "check" : "checks"} overdue
                </p>
              )}
              {!urgent && !warning && !noEquipment && (
                <p className="text-xs text-green-600 mt-0.5">All checks up to date</p>
              )}
              {noEquipment && (
                <p className="text-xs text-muted-foreground mt-0.5">No equipment configured</p>
              )}
            </div>
          </div>
          <div className={cn(
            "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap",
            urgent ? "bg-red-600 text-white" :
            warning ? "bg-amber-500 text-white" :
            "bg-green-600 text-white"
          )}>
            {urgent ? "Recheck Now" : "Log Check"}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── S1: Waste quick-action card ─────────────────────────────────────────────

function WasteActionCard({ wasteToday }: { wasteToday: number }) {
  return (
    <Link href="/waste">
      <div className="bg-card border border-border rounded-xl p-4 transition-all active:scale-[0.99] cursor-pointer hover:border-primary/30">
        <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center mb-3">
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground">Log Waste</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Today: <span className="font-semibold text-status-critical">${wasteToday.toFixed(2)}</span>
        </p>
        <div className="mt-3 text-xs font-semibold text-center py-1.5 bg-secondary text-muted-foreground rounded-lg">
          Log Now
        </div>
      </div>
    </Link>
  );
}

// ─── Service: Waste tile (full-width, service mode) ──────────────────────────

function WasteServiceTile({ wasteToday }: { wasteToday: number }) {
  const hasWaste = wasteToday > 0;
  return (
    <Link href="/waste">
      <div className={cn(
        "rounded-xl p-4 transition-all active:scale-[0.99] cursor-pointer",
        hasWaste ? "bg-amber-50 border-2 border-amber-400" : "bg-card border border-border hover:border-primary/30"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              hasWaste ? "bg-amber-100" : "bg-secondary"
            )}>
              <Trash2 className={cn("w-5 h-5", hasWaste ? "text-amber-600" : "text-muted-foreground")} />
            </div>
            <div>
              <p className={cn("text-sm font-bold", hasWaste ? "text-amber-800" : "text-foreground")}>
                Food Waste Log
              </p>
              <p className={cn("text-xs mt-0.5", hasWaste ? "text-amber-600 font-medium" : "text-muted-foreground")}>
                {hasWaste ? `$${wasteToday.toFixed(2)} logged today` : "Nothing logged yet today"}
              </p>
            </div>
          </div>
          <div className={cn(
            "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap",
            hasWaste ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
          )}>
            Log Waste
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── S1: Critical items quick-action card ────────────────────────────────────

function CriticalItemsCard({
  criticalItems,
  lowStockCount,
}: {
  criticalItems: Array<{ id: number; name: string; currentStock: number; unit: string }>;
  lowStockCount: number;
}) {
  const hasCritical = criticalItems.length > 0;

  return (
    <Link href={hasCritical ? "/inventory?status=critical" : "/inventory?status=low_stock"}>
      <div className={cn(
        "rounded-xl p-4 transition-all active:scale-[0.99] cursor-pointer",
        hasCritical ? "bg-red-50 border border-red-200 hover:border-red-300" : "bg-card border border-border hover:border-primary/30"
      )}>
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
          hasCritical ? "bg-red-100" : "bg-secondary"
        )}>
          <AlertTriangle className={cn("w-4 h-4", hasCritical ? "text-red-600" : "text-muted-foreground")} />
        </div>
        <p className="text-sm font-bold text-foreground">
          {hasCritical ? "Critical Items" : "Low Stock"}
        </p>
        {hasCritical ? (
          <>
            <p className="text-xs text-red-600 font-medium mt-0.5">{criticalItems.length} need action</p>
            <div className="mt-1.5 space-y-0.5">
              {criticalItems.slice(0, 2).map(item => (
                <p key={item.id} className="text-xs text-red-700 truncate">{item.name}</p>
              ))}
              {criticalItems.length > 2 && (
                <p className="text-xs text-red-500">+{criticalItems.length - 2} more</p>
              )}
            </div>
          </>
        ) : (
          <p className={cn("text-xs mt-0.5", lowStockCount > 0 ? "text-status-risk font-medium" : "text-muted-foreground")}>
            {lowStockCount > 0 ? `${lowStockCount} items low` : "All levels healthy"}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── S2: Order Cutoffs ────────────────────────────────────────────────────────

const CUTOFF_DISMISSED_KEY = "dashboard_cutoff_dismissed";

function OrderCutoffsCard({
  cutoffs,
}: {
  cutoffs: Array<{
    supplierId: number;
    supplierName: string;
    cutoffTime: string;
    deliveryDay: string;
    minutesUntilCutoff: number | null;
    isUrgent: boolean;
    message?: string;
  }>;
}) {
  const [, setLocation] = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  // ── Dismissed suppliers — persisted to localStorage keyed by date ──────────
  const [dismissed, setDismissed] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(CUTOFF_DISMISSED_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as Record<string, number[]>;
      return new Set(parsed[today] ?? []);
    } catch {
      return new Set();
    }
  });

  const dismissSupplier = (supplierId: number) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(supplierId);
      try {
        localStorage.setItem(CUTOFF_DISMISSED_KEY, JSON.stringify({ [today]: [...next] }));
      } catch {}
      return next;
    });
  };

  // ── Swipe tracking ─────────────────────────────────────────────────────────
  const touchStartX = useRef<Record<number, number>>({});
  const [swipeOffsets, setSwipeOffsets] = useState<Record<number, number>>({});

  const formatTime = (minutes: number | null) => {
    if (minutes === null || minutes < 0) return "Passed";
    if (minutes < 60) return `${minutes}m left`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  // Only show upcoming (not yet passed) and not dismissed for today
  const visible = cutoffs.filter(
    c => c.minutesUntilCutoff !== null && c.minutesUntilCutoff > 0 && !dismissed.has(c.supplierId)
  );

  if (visible.length === 0) return null;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Order Cutoffs
          </CardTitle>
          <Link href="/suppliers">
            <span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              All suppliers <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {visible.map((c) => {
            const offset = swipeOffsets[c.supplierId] ?? 0;
            const isActivelySwiping = touchStartX.current[c.supplierId] !== undefined;
            const showDismiss = offset < -40;

            return (
              <div key={c.supplierId} className="relative overflow-hidden">
                {/* Swipe-reveal dismiss layer */}
                <div
                  className="absolute inset-y-0 right-0 flex items-center justify-center bg-status-critical/15 transition-opacity"
                  style={{ width: 80, opacity: showDismiss ? 1 : 0 }}
                >
                  <span className="text-xs font-bold text-status-critical">Dismiss</span>
                </div>

                {/* Swipeable + tappable row */}
                <div
                  style={{
                    transform: `translateX(${Math.min(0, offset)}px)`,
                    transition: isActivelySwiping ? "none" : "transform 0.2s ease-out",
                  }}
                  onClick={() => setLocation(`/suppliers/${c.supplierId}`)}
                  onTouchStart={(e) => {
                    touchStartX.current[c.supplierId] = e.touches[0].clientX;
                  }}
                  onTouchMove={(e) => {
                    const startX = touchStartX.current[c.supplierId];
                    if (startX === undefined) return;
                    const delta = e.touches[0].clientX - startX;
                    if (delta < 0) {
                      setSwipeOffsets(prev => ({ ...prev, [c.supplierId]: delta }));
                    }
                  }}
                  onTouchEnd={() => {
                    const currentOffset = swipeOffsets[c.supplierId] ?? 0;
                    delete touchStartX.current[c.supplierId];
                    if (currentOffset < -80) {
                      dismissSupplier(c.supplierId);
                    }
                    setSwipeOffsets(prev => ({ ...prev, [c.supplierId]: 0 }));
                  }}
                  className={cn(
                    "px-4 py-3 flex items-center justify-between cursor-pointer select-none touch-manipulation",
                    c.isUrgent ? "bg-status-critical/5 dark:bg-status-critical/10" : "bg-card",
                  )}
                >
                  <div>
                    <p className={cn("text-sm font-semibold", c.isUrgent ? "text-status-critical" : "text-foreground")}>
                      {c.supplierName}
                    </p>
                    <p className={cn("text-xs mt-0.5", c.isUrgent ? "text-status-critical/70" : "text-muted-foreground")}>
                      {c.message || `Delivery ${c.deliveryDay}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={cn("text-sm font-bold", c.isUrgent ? "text-status-critical" : "text-foreground")}>
                      {c.cutoffTime}
                    </p>
                    <p className={cn("text-xs font-medium", c.isUrgent ? "text-status-critical/70" : "text-muted-foreground")}>
                      {formatTime(c.minutesUntilCutoff)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground/40 text-center tracking-wide">
            Swipe left to dismiss · Tap to view supplier
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── S2: Priority Actions condensed ──────────────────────────────────────────

function PriorityActionsCard({
  critical,
  lowStock,
  prepAlerts,
  invoiceNotes,
}: {
  critical: Array<{ id: number; name: string; currentStock: number; unit: string }>;
  lowStock: Array<{ id: number; name: string; currentStock: number; unit: string; parLevel: number }>;
  prepAlerts: Array<{ itemId: number; itemName: string; currentStock: number; parLevel: number; unit: string; productionRecipeName: string }>;
  invoiceNotes: Array<{ id: number; supplierName: string; notes: string }>;
}) {
  const hasCritical = critical.length > 0;
  const [expanded, setExpanded] = useState(hasCritical);

  const allItems = [
    ...critical.map(i => ({ id: i.id, level: "critical" as const, text: `${i.name} — ${i.currentStock} ${i.unit} left`, href: `/inventory/${i.id}` })),
    ...prepAlerts.map(i => ({ id: i.itemId, level: "high" as const, text: `Prep ${i.itemName} — below par`, href: "/prep-board" })),
    ...invoiceNotes.map(i => ({ id: i.id, level: "high" as const, text: `${i.supplierName} invoice — ${i.notes}`, href: "/invoices" })),
    ...lowStock.map(i => ({ id: i.id, level: "medium" as const, text: `${i.name} running low`, href: `/inventory/${i.id}` })),
  ];

  if (allItems.length === 0) return null;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-foreground">Priority Actions</span>
          <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
            {allItems.length}
          </span>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {!expanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-x-3 gap-y-1">
          {allItems.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={cn(
                "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                item.level === "critical" ? "bg-red-500" :
                item.level === "high" ? "bg-orange-400" : "bg-amber-400"
              )} />
              <span className="text-xs text-foreground">{item.text.split(" — ")[0]}</span>
            </div>
          ))}
          {allItems.length > 4 && (
            <span className="text-xs text-muted-foreground">+{allItems.length - 4} more</span>
          )}
        </div>
      )}

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {allItems.map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="px-4 py-3 flex items-start gap-3 hover:bg-secondary/40 transition-colors">
                <span className={cn(
                  "inline-block w-2 h-2 rounded-full shrink-0 mt-1.5",
                  item.level === "critical" ? "bg-red-500" :
                  item.level === "high" ? "bg-orange-400" : "bg-amber-400"
                )} />
                <p className="text-sm text-foreground flex-1">{item.text}</p>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
          <div className="px-4 py-3">
            <Link href="/inventory">
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                View full inventory <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── S3: Prep station section (collapsible) ───────────────────────────────────

type PrepSectionProps = {
  sectionKey: string;
  tasks: PrepTask[];
  myName: string;
  onToggle: (task: PrepTask) => void;
  defaultExpanded?: boolean;
};

function PrepStationSection({ sectionKey, tasks, myName, onToggle, defaultExpanded = false }: PrepSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const remaining = tasks.filter(t => t.status !== "done").length;
  const allDone = remaining === 0;
  const label = SECTION_LABELS[sectionKey] ?? sectionKey;

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden",
      allDone ? "border-green-200 bg-green-50/40" : "border-border bg-card"
    )}>
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
      >
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
          allDone ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
        )}>
          {allDone ? <CheckCircle className="w-5 h-5" /> : remaining}
        </div>
        <span className={cn(
          "text-sm font-semibold flex-1 text-left",
          allDone ? "text-green-700" : "text-foreground"
        )}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground mr-1">
          {allDone ? "Done" : `${remaining} left`}
        </span>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {tasks.map(task => {
            const isDone = task.status === "done";
            const isUrgent = task.priority === "high";
            const isMe = myName && task.assignedTo?.toLowerCase().includes(myName.toLowerCase());

            return (
              <button
                key={task.id}
                className={cn(
                  "w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-secondary/40 active:bg-secondary transition-colors",
                  isDone && "opacity-50"
                )}
                onClick={() => onToggle(task)}
              >
                {isDone
                  ? <CheckCircle2 className="w-5 h-5 text-status-healthy shrink-0 mt-0.5" />
                  : <Circle className={cn("w-5 h-5 shrink-0 mt-0.5", isUrgent ? "text-status-critical" : "text-muted-foreground/50")} />}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-foreground leading-snug", isDone && "line-through")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.assignedTo && (
                      <span className={cn("text-xs", isMe ? "text-primary font-medium" : "text-muted-foreground")}>
                        {task.assignedTo}
                      </span>
                    )}
                    {task.shift && task.shift !== "all_day" && (
                      <span className="text-xs text-muted-foreground capitalize">{task.shift.replace("_", " ")}</span>
                    )}
                    {task.priority === "high" && !isDone && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0 rounded">HIGH</span>
                    )}
                    {task.recipeName && (
                      <span className="text-xs text-primary">{task.recipeName}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type PrepFilter = "all" | "mine" | "urgent" | "done";

function PrepTodayWidget({ venueId }: { venueId: number }) {
  const qc = useQueryClient();
  const { user } = useUser();
  const storageKey = user?.id ? `prepMyName_${user.id}` : "prepMyName";
  const clerkFirstName = user?.firstName ?? "";
  const [myName, setMyName] = useState<string>(() => localStorage.getItem(storageKey) ?? clerkFirstName);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(myName);
  const [filter, setFilter] = useState<PrepFilter>("all");

  useEffect(() => {
    // Seed from Clerk firstName once on first login if nothing stored yet
    if (!localStorage.getItem(storageKey) && clerkFirstName) {
      setMyName(clerkFirstName);
      setNameInput(clerkFirstName);
    }
  }, [storageKey, clerkFirstName]);

  useEffect(() => {
    localStorage.setItem(storageKey, myName);
  }, [storageKey, myName]);

  const todayKey = getListPrepTasksQueryKey(venueId, { date: TODAY });
  const { data: allTasks = [], isLoading } = useListPrepTasks(venueId, { date: TODAY }, {
    query: { queryKey: todayKey },
  });

  const updateTask = useUpdatePrepTask();

  const handleToggleDone = (task: PrepTask) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTask.mutate({
      venueId,
      taskId: task.id,
      data: {
        title: task.title,
        category: task.category,
        section: task.section,
        shift: task.shift,
        priority: task.priority,
        status: newStatus,
        prepDate: task.prepDate,
      },
    }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: todayKey }),
    });
  };

  const activeTasks = allTasks.filter(t => !t.isArchived);
  const doneTodayCount = activeTasks.filter(t => t.status === "done").length;
  const openTasks = activeTasks.filter(t => t.status !== "done");
  const totalOpen = openTasks.length;

  const FILTERS: { key: PrepFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "mine", label: myName ? `${myName}'s` : "Mine" },
    { key: "urgent", label: "Urgent" },
    { key: "done", label: "Completed" },
  ];

  const filteredTasks = activeTasks.filter(t => {
    if (filter === "mine") return myName && t.assignedTo?.toLowerCase().includes(myName.toLowerCase());
    if (filter === "urgent") return t.priority === "high";
    if (filter === "done") return t.status === "done";
    return t.status !== "done";
  });

  const sorted = [...filteredTasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 9;
    const pb = PRIORITY_ORDER[b.priority] ?? 9;
    return pa - pb;
  });

  const bySection = new Map<string, PrepTask[]>();
  for (const task of sorted) {
    const s = task.section ?? "other";
    if (!bySection.has(s)) bySection.set(s, []);
    bySection.get(s)!.push(task);
  }

  const sections = Array.from(bySection.entries());
  const hasUrgent = activeTasks.some(t => t.priority === "high" && t.status !== "done");

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Today&apos;s Prep
            {totalOpen > 0 && (
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                hasUrgent ? "bg-orange-100 text-orange-700" : "bg-primary/10 text-primary"
              )}>
                {totalOpen} left
              </span>
            )}
            {doneTodayCount > 0 && totalOpen === 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                All done
              </span>
            )}
          </CardTitle>
          <Link href="/prep-board">
            <span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              Full board <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

        {/* Name filter chip */}
        <div className="mt-2 flex items-center gap-1.5">
          <User className="w-3 h-3 text-muted-foreground shrink-0" />
          {editingName ? (
            <form
              onSubmit={e => { e.preventDefault(); setMyName(nameInput.trim()); setEditingName(false); }}
              className="flex gap-2 flex-1"
            >
              <Input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Your name"
                className="h-7 text-xs bg-background border-border"
              />
              <Button type="submit" size="sm" className="h-7 text-xs px-2">Save</Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setEditingName(false)}>Cancel</Button>
            </form>
          ) : (
            <button
              onClick={() => { setNameInput(myName); setEditingName(true); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {myName
                ? <><span className="font-medium text-foreground">{myName}</span>&apos;s tasks — <span className="underline">change</span></>
                : <span className="underline">Set your name to filter your tasks</span>}
            </button>
          )}
        </div>
      </CardHeader>

      {/* Filter tabs */}
      <div className="flex px-3 py-2 gap-1.5 border-b border-border overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <CardContent className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 bg-secondary rounded-xl" />)}
          </div>
        ) : sections.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            {filter === "mine" && myName
              ? `No open tasks assigned to ${myName} today.`
              : filter === "urgent"
              ? "No urgent tasks right now."
              : filter === "done"
              ? "No completed tasks yet today."
              : "No open prep tasks for today."}
            <div className="mt-2">
              <Link href="/prep-board">
                <Button variant="outline" size="sm" className="text-xs">Open prep board</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map(([section, tasks], i) => (
              <PrepStationSection
                key={section}
                sectionKey={section}
                tasks={tasks}
                myName={myName}
                onToggle={handleToggleDone}
                defaultExpanded={i === 0}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Service: Urgent prep tile ────────────────────────────────────────────────

function UrgentPrepTile({ venueId }: { venueId: number }) {
  const qc = useQueryClient();
  const todayKey = getListPrepTasksQueryKey(venueId, { date: TODAY });
  const { data: allTasks = [], isLoading } = useListPrepTasks(venueId, { date: TODAY }, {
    query: { queryKey: todayKey },
  });
  const updateTask = useUpdatePrepTask();

  const urgentTasks = allTasks.filter(
    t => !t.isArchived && t.priority === "high" && t.status !== "done"
  );

  const handleDone = (task: PrepTask) => {
    updateTask.mutate({
      venueId,
      taskId: task.id,
      data: {
        title: task.title,
        category: task.category,
        section: task.section,
        shift: task.shift,
        priority: task.priority,
        status: "done",
        prepDate: task.prepDate,
      },
    }, { onSuccess: () => qc.invalidateQueries({ queryKey: todayKey }) });
  };

  if (isLoading) return <Skeleton className="h-28 bg-secondary rounded-xl" />;

  const allClear = urgentTasks.length === 0;

  return (
    <div className={cn(
      "rounded-xl overflow-hidden border-2",
      allClear ? "border-green-200 bg-green-50" : "border-orange-400"
    )}>
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        allClear ? "border-b border-green-100" : "bg-orange-50 border-b border-orange-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            allClear ? "bg-green-100" : "bg-orange-100"
          )}>
            <ClipboardList className={cn("w-5 h-5", allClear ? "text-green-600" : "text-orange-600")} />
          </div>
          <div>
            <p className={cn("text-sm font-bold", allClear ? "text-green-800" : "text-orange-900")}>
              Urgent Prep Tasks
            </p>
            <p className={cn("text-xs mt-0.5 font-medium", allClear ? "text-green-600" : "text-orange-600")}>
              {allClear ? "All clear" : `${urgentTasks.length} need action`}
            </p>
          </div>
        </div>
        <Link href="/prep-board">
          <span className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap",
            allClear ? "bg-green-600 text-white" : "bg-orange-500 text-white"
          )}>
            {allClear ? "View Board" : "Prep Board"}
          </span>
        </Link>
      </div>
      {!allClear && (
        <div className="bg-orange-50 divide-y divide-orange-200/60">
          {urgentTasks.map(task => (
            <button
              key={task.id}
              onClick={() => handleDone(task)}
              className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-100/60 active:bg-orange-100 transition-colors"
            >
              <Circle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-orange-900 leading-snug">{task.title}</p>
                {(task.assignedTo || task.section) && (
                  <p className="text-xs text-orange-600 mt-0.5">
                    {[task.assignedTo, task.section ? (SECTION_LABELS[task.section] ?? task.section) : null]
                      .filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <CheckCircle2 className="w-4 h-4 text-orange-300 shrink-0 mt-0.5 opacity-50" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── S4: Stagnant stock condensed ─────────────────────────────────────────────

function StagnantWidget({
  suggestions,
}: {
  suggestions: Array<{
    itemId: number;
    itemName: string;
    stagnantDays: number;
    currentStock: number;
    unit: string;
    suggestion: string;
    urgency?: string;
  }>;
}) {
  const [expanded, setExpanded] = useState(false);

  if (suggestions.length === 0) return null;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <PackageMinus className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">Stagnant Stock</span>
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            {suggestions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {suggestions.map((s, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{s.itemName}</p>
                <span className="text-xs text-amber-600 font-medium">{s.stagnantDays}d stagnant</span>
              </div>
              <p className="text-xs text-primary mt-0.5 flex items-start gap-1">
                <ArrowRight className="w-3 h-3 shrink-0 mt-0.5" />
                {s.suggestion}
              </p>
            </div>
          ))}
          <div className="px-4 py-3">
            <Link href="/inventory?status=stagnant">
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                View full playbook <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── S4: Setup Progress (First-Week Command Center) ──────────────────────────

function SetupProgressWidget({ venueId }: { venueId: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const { data } = useGetSetupProgress(venueId, {
    query: { enabled: !!venueId, queryKey: getGetSetupProgressQueryKey(venueId) },
  });

  if (!data || data.allComplete) return null;

  const { steps, stepsComplete, totalSteps, percentComplete, nextStep } = data;

  return (
    <Card className="border-primary/40 bg-primary/5 overflow-hidden">
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Flame className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-bold text-foreground">First week</span>
          <span className="text-xs font-semibold text-muted-foreground">
            {stepsComplete}/{totalSteps} steps complete
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          {collapsed
            ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-primary/20 divide-y divide-border">
          {steps.map(step => (
            <div key={step.id} className="px-4 py-3 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {step.completed
                  ? <CheckCircle2 className="w-4 h-4 text-status-healthy" />
                  : <Circle className="w-4 h-4 text-muted-foreground/40" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm font-semibold leading-snug",
                  step.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {step.label}
                </p>
                {!step.completed && (
                  <>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Lock className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0" />
                      <p className="text-[11px] text-muted-foreground/70 leading-snug">Unlocks: {step.unlocks}</p>
                    </div>
                  </>
                )}
              </div>
              {!step.completed && (
                <Link
                  href={step.href}
                  className="shrink-0 text-xs font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap mt-0.5"
                >
                  {step.action}
                </Link>
              )}
            </div>
          ))}

          {nextStep && (
            <div className="px-4 py-3 bg-primary/5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">Up next</p>
              <p className="text-sm font-bold text-foreground">{nextStep.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{nextStep.unlocks}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── S4: Food Cost Confidence ────────────────────────────────────────────────

function FoodCostConfidenceWidget({ venueId }: { venueId: number }) {
  const [expanded, setExpanded] = useState(false);
  const { data } = useGetFoodCostConfidence(venueId, {
    query: { enabled: !!venueId, queryKey: getGetFoodCostConfidenceQueryKey(venueId) },
  });
  if (!data) return null;
  const score = data.score ?? 0;
  const isActivating = score <= 25;
  const level = data.level ?? (score >= 80 ? "strong" : score >= 60 ? "fair" : "weak");
  const tone = isActivating
    ? { text: "text-muted-foreground", label: "Activating" }
    : level === "strong"
    ? { text: "text-status-healthy", label: "Strong" }
    : level === "fair"
    ? { text: "text-amber-500", label: "Fair" }
    : { text: "text-status-critical", label: "Weak" };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gauge className={cn("w-4 h-4", tone.text)} />
          <span className="text-sm font-semibold text-muted-foreground">Food Cost Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          {!expanded && (
            <span className={cn("text-xs font-semibold uppercase tracking-wider", tone.text)}>
              {tone.label}
            </span>
          )}
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          {isActivating ? (
            <>
              <p className="text-sm font-bold text-foreground">This is still warming up.</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Food Cost Confidence scores how much you can trust your food cost data. It gets accurate as you log more.
              </p>
              <div className="space-y-2 pt-1">
                {[
                  { action: "Add recipes", href: "/recipes/new", unlocks: "Live food cost % per dish" },
                  { action: "Run a stocktake", href: "/stocktake", unlocks: "Stagnant stock and inventory value" },
                  { action: "Log waste", href: "/waste", unlocks: "Daily waste cost totals" },
                ].map(item => (
                  <Link
                    key={item.action}
                    href={item.href}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.action}</p>
                      <p className="text-[11px] text-muted-foreground">{item.unlocks}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-3">
                <p className={cn("text-3xl font-bold", tone.text)}>{score}%</p>
                <p className={cn("text-sm font-semibold uppercase tracking-wider", tone.text)}>{tone.label}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                How much you can trust your food cost numbers right now.
              </p>
              <div className="space-y-2 pt-1">
                {(data.factors ?? []).map((f, i) => {
                  const factorTone = f.score >= 80 ? "text-status-healthy" : f.score >= 60 ? "text-amber-500" : "text-status-critical";
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-foreground">{f.label}</span>
                        <span className={cn("font-bold", factorTone)}>{f.score}%</span>
                      </div>
                      {f.message && (
                        <p className="text-[11px] text-muted-foreground leading-snug">{f.message}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── S4: Inventory value condensed ───────────────────────────────────────────

function InventoryValueWidget({ value }: { value: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground">Inventory Value</span>
        </div>
        <div className="flex items-center gap-2">
          {!expanded && (
            <span className="text-sm font-bold text-foreground">${value.toFixed(2)}</span>
          )}
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <p className="text-2xl font-bold text-foreground">${value.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total capital tied up in stock</p>
          <Link href="/inventory">
            <span className="mt-3 text-xs font-semibold text-primary flex items-center gap-1 inline-flex">
              Full inventory <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      )}
    </Card>
  );
}

// ─── Service Countdown Bar (always visible when windows set, no v2 required) ──

const STRIP_BG: Record<string, string> = {
  PRE_SERVICE:   "bg-blue-600/8 border-blue-500/20 dark:bg-blue-950/20",
  RAMPING_UP:    "bg-blue-600/8 border-blue-500/20 dark:bg-blue-950/20",
  CRITICAL_PREP: "bg-amber-500/8 border-amber-500/20 dark:bg-amber-950/20",
  IN_SERVICE:    "bg-green-600/8 border-green-500/20 dark:bg-green-950/20",
  POST_SERVICE:  "bg-slate-500/8 border-slate-400/20 dark:bg-slate-800/20",
};

const STRIP_DOT: Record<string, string> = {
  PRE_SERVICE:   "bg-blue-500",
  RAMPING_UP:    "bg-blue-500",
  CRITICAL_PREP: "bg-amber-500 animate-pulse",
  IN_SERVICE:    "bg-green-500 animate-pulse",
  POST_SERVICE:  "bg-slate-400",
};

function ServiceCountdownBar({ phase, phaseLabel, countdownText }: {
  phase: string;
  phaseLabel: string;
  countdownText: string | null | undefined;
}) {
  if (phase === "NO_SERVICE_DEFINED") return null;
  return (
    <div className={cn(
      "rounded-xl border px-4 py-2.5 flex items-center gap-2.5",
      STRIP_BG[phase] ?? "bg-slate-500/8 border-slate-400/20"
    )}>
      <span className={cn("w-2 h-2 rounded-full shrink-0", STRIP_DOT[phase] ?? "bg-slate-400")} />
      <span className="text-[11px] font-black uppercase tracking-widest text-foreground/60 shrink-0">
        {phaseLabel}
      </span>
      {countdownText && (
        <span className="text-sm font-semibold text-foreground ml-0.5">{countdownText}</span>
      )}
    </div>
  );
}

// ─── Service Pressure Widget ─────────────────────────────────────────────────

const PHASE_BADGE_CLS: Record<string, string> = {
  PRE_SERVICE:   "bg-slate-500",
  RAMPING_UP:    "bg-blue-600",
  CRITICAL_PREP: "bg-red-600 animate-pulse",
  IN_SERVICE:    "bg-green-600",
  POST_SERVICE:  "bg-slate-400",
};

function ServicePressureWidget({ pressure }: { pressure: ServicePressureResult }) {
  if (pressure.phase === "NO_SERVICE_DEFINED") return null;

  const pressureCls =
    pressure.pressureLevel === "high"     ? "bg-red-500"   :
    pressure.pressureLevel === "building" ? "bg-amber-400" : "bg-green-500";

  const pressureTextCls =
    pressure.pressureLevel === "high"     ? "text-red-600 dark:text-red-400"     :
    pressure.pressureLevel === "building" ? "text-amber-600 dark:text-amber-400" :
    "text-green-600 dark:text-green-400";

  const pressureLevelLabel =
    pressure.pressureLevel === "high" ? "High" :
    pressure.pressureLevel === "building" ? "Building" : "On track";

  const borderCls =
    pressure.pressureLevel === "high"     ? "border-red-300 dark:border-red-800"    :
    pressure.pressureLevel === "building" ? "border-amber-300 dark:border-amber-800":
    pressure.phase === "IN_SERVICE"       ? "border-green-300 dark:border-green-800": "border-border";

  const activeSections = pressure.stationLoads.filter(s => s.total > 0);

  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-3", borderCls)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0",
              PHASE_BADGE_CLS[pressure.phase] ?? "bg-slate-500"
            )}>
              {pressure.phaseLabel.toUpperCase()}
            </span>
            {pressure.countdownText && (
              <p className="text-sm font-semibold text-foreground">{pressure.countdownText}</p>
            )}
          </div>
          {pressure.subText && (
            <p className="text-xs text-muted-foreground">{pressure.subText}</p>
          )}
        </div>
        <Activity className={cn(
          "w-5 h-5 shrink-0",
          pressure.pressureLevel === "high" ? "text-red-500" :
          pressure.pressureLevel === "building" ? "text-amber-500" : "text-green-500"
        )} />
      </div>

      {pressure.phase !== "POST_SERVICE" && pressure.pressureScore >= 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Timer className="w-3 h-3" />Pressure
            </span>
            <span className={cn("text-xs font-bold", pressureTextCls)}>
              {pressureLevelLabel} ({pressure.pressureScore}/100)
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", pressureCls)}
              style={{ width: `${pressure.pressureScore}%` }}
            />
          </div>
        </div>
      )}

      {activeSections.length > 0 && pressure.phase !== "POST_SERVICE" && (
        <div className="flex flex-wrap gap-1.5">
          {activeSections.map(s => (
            <div
              key={s.section}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border",
                s.isBehind
                  ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                  : s.loadLevel === "heavy"
                  ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800"
                  : "bg-secondary text-foreground border-transparent"
              )}
            >
              {s.label}
              {s.incomplete > 0 && <span className="font-bold">{s.incomplete}</span>}
              {s.isBehind && <AlertTriangle className="w-3 h-3 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RealityCheckBanner({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <p className="text-sm font-semibold text-red-800 dark:text-red-200">{text}</p>
    </div>
  );
}

// ─── Service Intelligence Panel (v3) ──────────────────────────────────────────

function ServiceIntelligencePanel({ intelligence }: { intelligence: ServiceIntelligenceResult }) {
  const { focusQueue, bottlenecks, stopDoing, staffLoads, chefMode, setChefMode } = intelligence;

  const hasFocus      = focusQueue.length > 0;
  const hasBottleneck = bottlenecks.length > 0;
  const hasStopDoing  = stopDoing.length > 0;
  const hasStaff      = staffLoads.length > 0;

  if (!hasFocus && !hasBottleneck && !hasStopDoing && !hasStaff) return null;

  const MODES = ["assist", "directive", "silent"] as const;

  return (
    <div className="rounded-xl border border-red-300/30 dark:border-red-800/30 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-sm font-bold text-foreground">Intelligence</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-red-500">v3</span>
        </div>
        <div className="flex items-center gap-0.5 p-0.5 bg-secondary rounded-md">
          {MODES.map(m => (
            <button
              key={m}
              onClick={() => setChefMode(m)}
              className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded transition-colors capitalize",
                chefMode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {chefMode === "silent" ? (
        <p className="text-xs text-muted-foreground">Intelligence panel hidden in Silent mode.</p>
      ) : (
        <div className="space-y-4">
          {hasFocus && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Focus Queue</p>
              <div className="space-y-1.5">
                {focusQueue.map((task, i) => (
                  <div key={task.id} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
                    <span className={cn(
                      "flex-1 font-medium truncate",
                      task.isCritical || task.priority === "high" ? "text-foreground" : "text-foreground/80"
                    )}>
                      {task.title}
                    </span>
                    {task.isCritical && (
                      <span className="text-[9px] font-black text-red-500 shrink-0">CRIT</span>
                    )}
                    {task.estimatedDurationMinutes && (
                      <span className="text-muted-foreground shrink-0">{task.estimatedDurationMinutes}m</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasBottleneck && chefMode === "assist" && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Behind Schedule</p>
              <div className="space-y-1.5">
                {bottlenecks.map(b => (
                  <div key={b.section} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground flex-1 truncate">{b.label}</span>
                    <span className="text-orange-500 font-bold shrink-0">
                      {b.estimatedMinutes >= 60
                        ? `${Math.floor(b.estimatedMinutes / 60)}h ${b.estimatedMinutes % 60}m`
                        : `${b.estimatedMinutes}m`} of prep
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasStopDoing && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Drop For Now</p>
              <div className="space-y-1">
                {stopDoing.map(task => (
                  <div key={task.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0 mt-0.5" />
                    <span className="truncate">{task.title}</span>
                    {task.estimatedDurationMinutes && (
                      <span className="shrink-0">({task.estimatedDurationMinutes}m)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasStaff && chefMode === "assist" && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Staff Load</p>
              <div className="space-y-1.5">
                {staffLoads.map(s => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "flex-1 font-medium truncate",
                      s.isOverloaded ? "text-red-500" : "text-foreground"
                    )}>
                      {s.name}
                    </span>
                    <span className={cn(
                      "font-bold shrink-0",
                      s.isOverloaded ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {s.incomplete} task{s.incomplete !== 1 ? "s" : ""}
                    </span>
                    {s.isOverloaded && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quick Log FAB ────────────────────────────────────────────────────────────

function QuickLogFAB() {
  const [open, setOpen] = useState(false);

  const ACTIONS = [
    { label: "Log Waste", icon: Trash2, href: "/waste" },
    { label: "Temperature Check", icon: Thermometer, href: "/temperature" },
    { label: "Prep Board", icon: ClipboardList, href: "/prep-board" },
  ];

  return (
    <div className="fixed bottom-6 right-4 flex flex-col items-end gap-2 z-50">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1">
          {ACTIONS.map((a, i) => (
            <Link key={i} href={a.href} onClick={() => setOpen(false)}>
              <div className="flex items-center gap-2 bg-card border border-border shadow-lg rounded-full pl-3 pr-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-all whitespace-nowrap">
                <a.icon className="w-4 h-4 text-primary" />
                {a.label}
              </div>
            </Link>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-200",
          open ? "bg-slate-700 rotate-45" : "bg-primary"
        )}
        aria-label="Quick actions"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { activeVenueId } = useVenueStore();
  const queryClient = useQueryClient();
  const [isServiceMode, setIsServiceMode] = useState(() =>
    localStorage.getItem("dashMode") !== "planning"
  );

  const toggleMode = () => {
    const next = !isServiceMode;
    setIsServiceMode(next);
    localStorage.setItem("dashMode", next ? "service" : "planning");
  };

  const { data: venue, isLoading: isLoadingVenue } = useGetVenue(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getGetVenueQueryKey(activeVenueId as number) } }
  );

  const { data: dashboard, isLoading: isLoadingDashboard } = useGetDashboard(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getGetDashboardQueryKey(activeVenueId as number) } }
  );

  const { data: invoiceList = [] } = useListInvoices(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListInvoicesQueryKey(activeVenueId as number) } }
  );

  const todayTasks = useListPrepTasks(
    activeVenueId as number,
    { date: TODAY },
    { query: { enabled: !!activeVenueId, queryKey: getListPrepTasksQueryKey(activeVenueId as number, { date: TODAY }) } }
  ).data ?? [];

  const pressure = useServicePressure(todayTasks, venue?.serviceWindows);
  const v2 = !!(venue?.serviceModeConfig as { v2Enabled?: boolean } | null | undefined)?.v2Enabled;
  const v3 = !!(venue?.serviceModeConfig as { v2Enabled?: boolean; v3Enabled?: boolean } | null | undefined)?.v3Enabled;
  const intelligence = useServiceIntelligence(todayTasks, pressure.minutesUntilService);

  // ── Progressive intelligence unlock ────────────────────────────────────────
  const updateVenueMut = useUpdateVenue();
  const [isEnablingIntel, setIsEnablingIntel] = useState(false);
  const taskCount      = todayTasks.length;
  const completedCount = todayTasks.filter(t => t.status === "done").length;
  const intelStage = useIntelligenceStage({
    venueId: activeVenueId,
    taskCount,
    completedCount,
    v2Enabled: v2,
    v3Enabled: v3,
  });

  const enableV2 = async () => {
    if (!activeVenueId) return;
    setIsEnablingIntel(true);
    try {
      const current = (venue?.serviceModeConfig as { v2Enabled?: boolean; v3Enabled?: boolean } | null) ?? {};
      await updateVenueMut.mutateAsync({
        venueId: activeVenueId,
        data: { serviceModeConfig: { v2Enabled: true, v3Enabled: current.v3Enabled ?? false } },
      });
      await queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(activeVenueId) });
    } finally { setIsEnablingIntel(false); }
  };

  const enableV3 = async () => {
    if (!activeVenueId) return;
    setIsEnablingIntel(true);
    try {
      const current = (venue?.serviceModeConfig as { v2Enabled?: boolean; v3Enabled?: boolean } | null) ?? {};
      await updateVenueMut.mutateAsync({
        venueId: activeVenueId,
        data: { serviceModeConfig: { v2Enabled: current.v2Enabled ?? false, v3Enabled: true } },
      });
      await queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(activeVenueId) });
    } finally { setIsEnablingIntel(false); }
  };

  const unresolvedInvoiceNotes = invoiceList.filter(
    i => i.notes?.trim() && !i.noteResolvedAt
  ).map(i => ({ id: i.id, supplierName: i.supplierName, notes: i.notes! }));

  if (!activeVenueId) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
          <ChefHat className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No kitchen selected</h2>
        <p className="text-muted-foreground mb-8">
          Create a venue or load the demo kitchen to get started.
        </p>
        <Button size="lg" asChild>
          <Link href="/venues">Set up a kitchen</Link>
        </Button>
      </div>
    );
  }

  if (isLoadingVenue || isLoadingDashboard) {
    return (
      <div className="space-y-5 pb-20">
        <Skeleton className="h-10 w-48 bg-secondary" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 col-span-2 bg-secondary rounded-xl" />
          <Skeleton className="h-28 bg-secondary rounded-xl" />
          <Skeleton className="h-28 bg-secondary rounded-xl" />
        </div>
        <Skeleton className="h-40 bg-secondary rounded-xl" />
        <Skeleton className="h-40 bg-secondary rounded-xl" />
        <Skeleton className="h-64 bg-secondary rounded-xl" />
      </div>
    );
  }

  if (!dashboard) return null;

  const isSetup = dashboard.inventoryValue > 0 || dashboard.supplierCutoffs.length > 0;

  // ── Shared header ──────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isServiceMode ? "Service Mode" : "Dashboard"}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{venue?.name}</p>
      </div>
      <button
        onClick={toggleMode}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all mt-1 shrink-0",
          isServiceMode
            ? "bg-red-500 border-red-500 text-white"
            : "bg-background border-border text-muted-foreground hover:border-primary hover:text-primary"
        )}
        aria-label="Toggle service mode"
      >
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          isServiceMode ? "bg-white animate-pulse" : "bg-muted-foreground"
        )} />
        {isServiceMode ? "Service Mode" : "Planning"}
      </button>
    </div>
  );

  // ── Service Mode: phase-adaptive layout ────────────────────────────────────
  const isCriticalPhase = pressure.phase === "CRITICAL_PREP";
  const isRampingUp = pressure.phase === "RAMPING_UP";

  if (isServiceMode) {
    return (
      <div className="space-y-4 pb-28">
        {header}
        {(isCriticalPhase || isRampingUp) && (
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">
              {isCriticalPhase
                ? "Critical prep — focus on what matters now"
                : "Ramping up — service pressure building"}
            </p>
          </div>
        )}
        <ServiceCountdownBar phase={pressure.phase} phaseLabel={pressure.phaseLabel} countdownText={pressure.countdownText} />
        {v2 && <ServicePressureWidget pressure={pressure} />}
        {v2 && <RealityCheckBanner text={pressure.realityCheckText} />}
        {v3 && <ServiceIntelligencePanel intelligence={intelligence} />}
        <UrgentPrepTile venueId={activeVenueId} />
        {!isCriticalPhase && <TemperatureActionCard venueId={activeVenueId} />}
        {!isCriticalPhase && <WasteServiceTile wasteToday={dashboard.wasteToday} />}
        <QuickLogFAB />
      </div>
    );
  }

  // ── Planning Mode: full dashboard ─────────────────────────────────────────
  return (
    <div className="space-y-5 pb-28">
      {header}
      <ServiceCountdownBar phase={pressure.phase} phaseLabel={pressure.phaseLabel} countdownText={pressure.countdownText} />
      {!v2 && intelStage.showV2Offer && (
        <IntelligenceUnlockBanner
          variant="v2"
          onEnable={() => void enableV2()}
          onDismiss={intelStage.dismissV2}
          enabling={isEnablingIntel}
        />
      )}
      {v2 && !v3 && intelStage.showV3Offer && (
        <IntelligenceUnlockBanner
          variant="v3"
          onEnable={() => void enableV3()}
          onDismiss={intelStage.dismissV3}
          enabling={isEnablingIntel}
        />
      )}
      {v2 && <ServicePressureWidget pressure={pressure} />}
      {v2 && <RealityCheckBanner text={pressure.realityCheckText} />}
      {v3 && <ServiceIntelligencePanel intelligence={intelligence} />}

      <SetupProgressWidget venueId={activeVenueId} />

      {/* ── SECTION 1: Immediate Actions ── */}
      <div className="space-y-3">
        <SectionLabel>Immediate Actions</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <TemperatureActionCard venueId={activeVenueId} />
          <WasteActionCard wasteToday={dashboard.wasteToday} />
          <CriticalItemsCard
            criticalItems={dashboard.alerts.critical}
            lowStockCount={dashboard.lowStockCount ?? 0}
          />
        </div>
      </div>

      {/* ── SECTION 2: Time Sensitive ── */}
      {(dashboard.supplierCutoffs.length > 0 || dashboard.alerts.critical.length > 0 || dashboard.lowStockCount || unresolvedInvoiceNotes.length > 0) && (
        <div className="space-y-3">
          <SectionLabel>Time Sensitive</SectionLabel>
          {dashboard.supplierCutoffs.length > 0 && (
            <OrderCutoffsCard cutoffs={dashboard.supplierCutoffs} />
          )}
          <PriorityActionsCard
            critical={dashboard.alerts.critical}
            lowStock={dashboard.alerts.lowStock}
            prepAlerts={dashboard.prepAlerts ?? []}
            invoiceNotes={unresolvedInvoiceNotes}
          />
        </div>
      )}

      {/* ── SECTION 3: Prep Execution ── */}
      <div className="space-y-3">
        <SectionLabel>Prep Execution</SectionLabel>
        <PrepTodayWidget venueId={activeVenueId} />
      </div>

      {/* ── SECTION 4: Operational Insights ── */}
      <div className="space-y-3">
        <SectionLabel>Operational Insights</SectionLabel>
        <FoodCostConfidenceWidget venueId={activeVenueId} />
        {dashboard.suggestions.length > 0 && (
          <StagnantWidget suggestions={dashboard.suggestions} />
        )}
        {dashboard.inventoryValue > 0 && (
          <InventoryValueWidget value={dashboard.inventoryValue} />
        )}
      </div>

      {/* FAB */}
      <QuickLogFAB />
    </div>
  );
}
