import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Thermometer, Trash2, AlertTriangle, TrendingDown, Clock,
  ChevronDown, ChevronRight, CheckCircle2, Circle, ArrowRight,
  PackageMinus, DollarSign, ChefHat, XCircle, CheckCircle,
  Plus,
} from "lucide-react";

// ─── Static demo data ────────────────────────────────────────────────────────

const TEMP_DATA = {
  overdueCount: 2,
  failCount: 1,
  failEquipment: "Coolroom 2",
  overdueEquipment: ["Walk-in Fridge", "Prep Fridge"],
};

const WASTE_TODAY = 47.80;

const CRITICAL_ITEMS = [
  { id: 1, name: "Courgette", stock: "0.3", unit: "kg", days: "0d" },
  { id: 2, name: "Duck Leg", stock: "2", unit: "portions", days: "1d" },
];

const LOW_STOCK_COUNT = 5;

const CUTOFFS = [
  { supplier: "Prime Produce", cutoffTime: "10:00", minutesLeft: 18, isUrgent: true, delivery: "Tomorrow" },
  { supplier: "Pacific Seafood", cutoffTime: "12:00", minutesLeft: 138, isUrgent: false, delivery: "Tomorrow" },
  { supplier: "Oakridge Dairy", cutoffTime: "15:30", minutesLeft: 270, isUrgent: false, delivery: "Thu" },
];

const PRIORITY_ACTIONS = [
  { level: "urgent", icon: "critical", text: "Buy Courgette — out of stock" },
  { level: "high", icon: "low", text: "Duck Leg — 2 portions left" },
  { level: "medium", icon: "medium", text: "Review Fish Special — par at risk" },
];

type PrepFilter = "all" | "mine" | "urgent" | "done";
const PREP_SECTIONS = [
  {
    key: "hot",
    label: "Hot Section",
    remaining: 2,
    tasks: [
      { id: 1, title: "Confit Shallots", assignee: "Marco", priority: "high", done: false },
      { id: 2, title: "Onion Chutney", assignee: "Marco", priority: "medium", done: false },
      { id: 3, title: "Jus Reduction 2L", assignee: null, priority: "medium", done: true },
    ],
  },
  {
    key: "larder",
    label: "Larder",
    remaining: 1,
    tasks: [
      { id: 4, title: "Cured Salmon Portion x8", assignee: "Sophie", priority: "high", done: false },
      { id: 5, title: "Dressing — Sherry Vinegar", assignee: "Sophie", priority: "low", done: true },
    ],
  },
  {
    key: "pastry",
    label: "Pastry",
    remaining: 3,
    tasks: [
      { id: 6, title: "Tart Shells x12", assignee: "Aiden", priority: "urgent", done: false },
      { id: 7, title: "Crème Brûlée x20", assignee: "Aiden", priority: "high", done: false },
      { id: 8, title: "Sorbet Quenelles", assignee: null, priority: "medium", done: false },
      { id: 9, title: "Vanilla Tuille", assignee: "Aiden", priority: "low", done: true },
    ],
  },
];

const STAGNANT = [
  { name: "Duck Leg", days: 14, value: "$34.00" },
  { name: "Ricotta", days: 10, value: "$12.50" },
  { name: "Smoked Salmon Trim", days: 8, value: "$8.20" },
  { name: "Beetroot", days: 7, value: "$6.40" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function urgencyDot(level: string) {
  return (
    <span className={cn(
      "inline-block w-2 h-2 rounded-full shrink-0 mt-1.5",
      level === "urgent" || level === "critical" ? "bg-red-500" :
      level === "high" || level === "low" ? "bg-orange-400" :
      "bg-amber-400"
    )} />
  );
}

// ─── Section 1: Quick Action Grid ─────────────────────────────────────────────

function QuickActions({ onTempClick }: { onTempClick: () => void }) {
  const tempUrgent = TEMP_DATA.failCount > 0;
  const tempWarning = TEMP_DATA.overdueCount > 0 && !tempUrgent;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Temperature */}
      <button
        onClick={onTempClick}
        className={cn(
          "relative col-span-2 rounded-xl p-4 text-left transition-all active:scale-[0.99]",
          tempUrgent
            ? "bg-red-50 border-2 border-red-400"
            : tempWarning
            ? "bg-amber-50 border-2 border-amber-400"
            : "bg-green-50 border border-green-300"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              tempUrgent ? "bg-red-100" : tempWarning ? "bg-amber-100" : "bg-green-100"
            )}>
              <Thermometer className={cn(
                "w-5 h-5",
                tempUrgent ? "text-red-600" : tempWarning ? "text-amber-600" : "text-green-600"
              )} />
            </div>
            <div>
              <p className={cn(
                "text-sm font-bold",
                tempUrgent ? "text-red-800" : tempWarning ? "text-amber-800" : "text-green-800"
              )}>
                Temperature Checks
              </p>
              {tempUrgent && (
                <p className="text-xs text-red-600 font-medium mt-0.5">
                  {TEMP_DATA.failEquipment} outside safe range
                </p>
              )}
              {tempWarning && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  {TEMP_DATA.overdueCount} checks overdue
                </p>
              )}
              {!tempUrgent && !tempWarning && (
                <p className="text-xs text-green-600 mt-0.5">All checks up to date</p>
              )}
            </div>
          </div>
          <div className={cn(
            "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg",
            tempUrgent ? "bg-red-600 text-white" : tempWarning ? "bg-amber-500 text-white" : "bg-green-600 text-white"
          )}>
            {tempUrgent ? "Recheck Now" : "Log Check"}
          </div>
        </div>
      </button>

      {/* Log Waste */}
      <button className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left active:scale-[0.99] transition-all">
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
          <Trash2 className="w-4 h-4 text-slate-500" />
        </div>
        <p className="text-sm font-bold text-foreground">Log Waste</p>
        <p className="text-xs text-muted-foreground mt-0.5">Today: <span className="font-semibold text-red-600">${WASTE_TODAY.toFixed(2)}</span></p>
        <div className="mt-3 text-xs font-semibold text-slate-600 bg-slate-200 rounded-md px-2 py-1 text-center">
          Log Now
        </div>
      </button>

      {/* Critical Items */}
      <button className={cn(
        "rounded-xl p-4 text-left active:scale-[0.99] transition-all",
        CRITICAL_ITEMS.length > 0 ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"
      )}>
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
          CRITICAL_ITEMS.length > 0 ? "bg-red-100" : "bg-slate-100"
        )}>
          <AlertTriangle className={cn("w-4 h-4", CRITICAL_ITEMS.length > 0 ? "text-red-600" : "text-slate-400")} />
        </div>
        <p className="text-sm font-bold text-foreground">Critical Items</p>
        <p className={cn(
          "text-xs mt-0.5 font-medium",
          CRITICAL_ITEMS.length > 0 ? "text-red-600" : "text-muted-foreground"
        )}>
          {CRITICAL_ITEMS.length > 0 ? `${CRITICAL_ITEMS.length} need action` : "All clear"}
        </p>
        {CRITICAL_ITEMS.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {CRITICAL_ITEMS.slice(0, 2).map(item => (
              <p key={item.id} className="text-xs text-red-700 truncate">{item.name}</p>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Section 2: Order Cutoffs ────────────────────────────────────────────────

function OrderCutoffs() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Order Cutoffs</span>
        </div>
        <span className="text-xs text-muted-foreground">Today</span>
      </div>
      <div className="divide-y divide-border">
        {CUTOFFS.map((c, i) => (
          <div key={i} className={cn(
            "px-4 py-3 flex items-center justify-between",
            c.isUrgent && "bg-red-50"
          )}>
            <div>
              <p className={cn("text-sm font-semibold", c.isUrgent ? "text-red-800" : "text-foreground")}>
                {c.supplier}
              </p>
              <p className={cn("text-xs mt-0.5", c.isUrgent ? "text-red-600" : "text-muted-foreground")}>
                Delivery {c.delivery}
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-sm font-bold",
                c.isUrgent ? "text-red-600" : "text-foreground"
              )}>
                {c.cutoffTime}
              </p>
              <p className={cn(
                "text-xs font-medium",
                c.isUrgent ? "text-red-500" : "text-muted-foreground"
              )}>
                {c.isUrgent ? `${c.minutesLeft}m left` : `${Math.floor(c.minutesLeft / 60)}h ${c.minutesLeft % 60}m`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section 2: Priority Actions condensed ───────────────────────────────────

function PriorityActionsSummary() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-border hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-foreground">Priority Actions</span>
          <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
            {PRIORITY_ACTIONS.length}
          </span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded ? (
        <div className="divide-y divide-border">
          {PRIORITY_ACTIONS.map((a, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              {urgencyDot(a.level)}
              <p className="text-sm text-foreground flex-1">{a.text}</p>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
            </div>
          ))}
          <div className="px-4 py-3">
            <button className="text-xs font-semibold text-primary flex items-center gap-1">
              View all in Inventory <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
          {PRIORITY_ACTIONS.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {urgencyDot(a.level)}
              <span className="text-xs text-foreground">{a.text.split(" — ")[0]}</span>
              {i < PRIORITY_ACTIONS.length - 1 && <span className="text-muted-foreground/30 ml-0.5">·</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section 3: Prep List ────────────────────────────────────────────────────

function PrepSection({ section, myName }: {
  section: typeof PREP_SECTIONS[0],
  myName: string,
}) {
  const [expanded, setExpanded] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<number>>(
    new Set(section.tasks.filter(t => t.done).map(t => t.id))
  );

  const remaining = section.tasks.filter(t => !doneIds.has(t.id)).length;
  const allDone = remaining === 0;

  const toggle = (id: number) => {
    setDoneIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden",
      allDone ? "border-green-200 bg-green-50/30" : "border-border bg-card"
    )}>
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
      >
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
          allDone ? "bg-green-500" : "bg-muted"
        )}>
          {allDone
            ? <CheckCircle className="w-5 h-5 text-white" />
            : <span className="text-xs font-bold text-muted-foreground">{remaining}</span>}
        </div>
        <span className={cn(
          "text-sm font-semibold flex-1 text-left",
          allDone ? "text-green-700" : "text-foreground"
        )}>
          {section.label}
        </span>
        <span className="text-xs text-muted-foreground mr-1">
          {allDone ? "All done" : `${remaining} left`}
        </span>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {section.tasks.map(task => {
            const done = doneIds.has(task.id);
            const isUrgent = task.priority === "urgent" || task.priority === "high";
            const isMe = myName && task.assignee?.toLowerCase().includes(myName.toLowerCase());
            return (
              <button
                key={task.id}
                onClick={() => toggle(task.id)}
                className={cn(
                  "w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-secondary/40 active:bg-secondary transition-colors",
                  done && "opacity-50"
                )}
              >
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  : <Circle className={cn("w-5 h-5 shrink-0 mt-0.5", isUrgent ? "text-red-400" : "text-muted-foreground/50")} />}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-foreground leading-snug", done && "line-through")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.assignee && (
                      <span className={cn("text-xs", isMe ? "text-primary font-medium" : "text-muted-foreground")}>
                        {task.assignee}
                      </span>
                    )}
                    {(task.priority === "urgent") && !done && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0 rounded">
                        URGENT
                      </span>
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

type PrepFilterKey = "all" | "mine" | "urgent" | "done";
const PREP_FILTERS: { key: PrepFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "My Section" },
  { key: "urgent", label: "Urgent" },
  { key: "done", label: "Completed" },
];

function PrepWidget() {
  const [filter, setFilter] = useState<PrepFilterKey>("all");
  const [myName] = useState("Marco");

  const filteredSections = PREP_SECTIONS.filter(section => {
    if (filter === "urgent") return section.tasks.some(t => t.priority === "urgent" || t.priority === "high");
    if (filter === "mine") return section.tasks.some(t => t.assignee?.toLowerCase().includes(myName.toLowerCase()));
    if (filter === "done") return section.tasks.every(t => t.done);
    return true;
  });

  const totalRemaining = PREP_SECTIONS.reduce((sum, s) => sum + s.tasks.filter(t => !t.done).length, 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Today's Prep</span>
          {totalRemaining > 0 && (
            <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
              {totalRemaining} left
            </span>
          )}
        </div>
        <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          Full board <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex px-3 py-2 gap-1.5 border-b border-border overflow-x-auto">
        {PREP_FILTERS.map(f => (
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

      <div className="p-3 space-y-2">
        {filteredSections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks in this view.</p>
        ) : (
          filteredSections.map(section => (
            <PrepSection key={section.key} section={section} myName={myName} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Section 4: Stagnant Stock condensed ────────────────────────────────────

function StagnantWidget() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <PackageMinus className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-foreground">Stagnant Stock</span>
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            {STAGNANT.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">$61.10 tied up</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {STAGNANT.map((s, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-amber-600">{s.days}d stagnant</p>
              </div>
              <p className="text-sm font-semibold text-muted-foreground">{s.value}</p>
            </div>
          ))}
          <div className="px-4 py-3">
            <button className="text-xs font-semibold text-primary flex items-center gap-1">
              View playbook <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryValueWidget() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground">Inventory Value</span>
        </div>
        <div className="flex items-center gap-2">
          {expanded && <span className="text-sm font-bold text-foreground">$4,830.20</span>}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-2xl font-bold text-foreground">$4,830.20</p>
          <p className="text-xs text-muted-foreground mt-1">Total capital tied up in stock</p>
          <button className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
            View full inventory <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Quick Log FAB ────────────────────────────────────────────────────────────

function QuickLogFAB() {
  const [open, setOpen] = useState(false);
  const ACTIONS = [
    { label: "Log Waste", icon: Trash2 },
    { label: "Temperature Check", icon: Thermometer },
    { label: "Mark Prep Done", icon: CheckCircle2 },
  ];

  return (
    <div className="fixed bottom-6 right-4 flex flex-col items-end gap-2 z-50">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1">
          {ACTIONS.map((a, i) => (
            <button
              key={i}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 bg-white border border-border shadow-lg rounded-full pl-3 pr-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-all"
            >
              <a.icon className="w-4 h-4 text-primary" />
              {a.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all",
          open ? "bg-slate-700 rotate-45" : "bg-primary"
        )}
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
      {children}
    </p>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ServiceModeDashboard() {
  const [tempHighlighted, setTempHighlighted] = useState(false);

  return (
    <div className="min-h-screen bg-background relative" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-12 pb-4 sticky top-0 z-40">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">Service Mode</h1>
            <p className="text-xs text-muted-foreground mt-1">The Larder Kitchen · Tue 22 May</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service</p>
            <p className="text-lg font-bold text-foreground">18:42</p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="px-4 py-4 space-y-5 pb-32">

        {/* S1 — Immediate Actions */}
        <div className="space-y-3">
          <SectionLabel>Immediate Actions</SectionLabel>
          <QuickActions onTempClick={() => setTempHighlighted(p => !p)} />
        </div>

        {/* S2 — Time Sensitive */}
        <div className="space-y-3">
          <SectionLabel>Time Sensitive</SectionLabel>
          <OrderCutoffs />
          <PriorityActionsSummary />
        </div>

        {/* S3 — Prep Execution */}
        <div className="space-y-3">
          <SectionLabel>Prep Execution</SectionLabel>
          <PrepWidget />
        </div>

        {/* S4 — Operational Insights */}
        <div className="space-y-3">
          <SectionLabel>Operational Insights</SectionLabel>
          <StagnantWidget />
          <InventoryValueWidget />
        </div>

      </div>

      {/* FAB */}
      <QuickLogFAB />
    </div>
  );
}
