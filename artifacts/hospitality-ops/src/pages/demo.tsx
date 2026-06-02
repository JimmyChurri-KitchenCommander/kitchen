import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { SignUpButton } from "@clerk/react";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChefHat, Circle, Clock,
  ClipboardList, Package, TrendingDown, TrendingUp, UtensilsCrossed,
  Flame, Zap, Thermometer, FileText, BarChart2, SprayCan, BookOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Static Demo Data ─────────────────────────────────────────────────────────

const SUPPLIERS = [
  { name: "Sealane Fisheries", cutoffTime: "08:00", deliveryDays: "Mon/Wed/Fri", nextDelivery: "Tomorrow" },
  { name: "Atlas Meats", cutoffTime: "10:30", deliveryDays: "Tue/Thu/Sat", nextDelivery: "Today" },
  { name: "Borough Produce Co.", cutoffTime: "14:00", deliveryDays: "Mon/Wed/Fri", nextDelivery: "Tomorrow" },
  { name: "Continental Dairy", cutoffTime: "12:00", deliveryDays: "Tue/Fri", nextDelivery: "Friday" },
];

const STOCK_ALERTS = [
  { name: "Duck Leg (Confit-ready)", stock: "0.4 kg", par: "2.0 kg", status: "critical" as const, supplier: "Atlas Meats", lastSeen: "11 days ago" },
  { name: "Baby Courgette", stock: "0.8 kg", par: "2.0 kg", status: "low" as const, supplier: "Borough Produce Co.", lastSeen: "2 days ago" },
  { name: "Double Cream", stock: "0.5 L", par: "2.0 L", status: "low" as const, supplier: "Continental Dairy", lastSeen: "2 days ago" },
  { name: "Rocket (Wild)", stock: "1.2 kg", par: "3.0 kg", status: "stagnant" as const, supplier: "Borough Produce Co.", lastSeen: "9 days ago" },
  { name: "Aged Manchego (6mo)", stock: "1.1 kg", par: "1.5 kg", status: "stagnant" as const, supplier: "Continental Dairy", lastSeen: "12 days ago" },
  { name: "Heritage Tomatoes", stock: "4.5 kg", par: "5.0 kg", status: "healthy" as const, supplier: "Borough Produce Co.", lastSeen: "1 day ago" },
  { name: "Sea Bass (Whole)", stock: "2.8 kg", par: "3.0 kg", status: "healthy" as const, supplier: "Sealane Fisheries", lastSeen: "Today" },
];

const STATUS_COLORS = {
  critical: "text-red-600 bg-red-50 border-red-200",
  low: "text-orange-600 bg-orange-50 border-orange-200",
  stagnant: "text-yellow-700 bg-yellow-50 border-yellow-200",
  healthy: "text-green-700 bg-green-50 border-green-200",
};

const STATUS_LABELS = {
  critical: "Critical",
  low: "Low stock",
  stagnant: "Stagnant",
  healthy: "Healthy",
};

const PREP_TASKS_INIT = [
  { id: 1, title: "Scale and portion sea bass", recipe: "Seared Sea Bass", assignedTo: "Sofia R.", status: "done" as const, shift: "AM", priority: "high" },
  { id: 2, title: "Pull confited duck legs from fat", recipe: "Duck Leg Confit", assignedTo: "Tom B.", status: "done" as const, shift: "AM", priority: "high" },
  { id: 3, title: "Prep shallot butter", recipe: "Bavette, Shallot Butter", assignedTo: "Tom B.", status: "done" as const, shift: "AM", priority: "medium" },
  { id: 4, title: "Check scallop count and dry", recipe: "Scallops, Courgette Velouté", assignedTo: "Sofia R.", status: "done" as const, shift: "AM", priority: "high" },
  { id: 5, title: "Prep beurre blanc base", recipe: "Seared Sea Bass", assignedTo: "Priya N.", status: "in_progress" as const, shift: "AM", priority: "medium" },
  { id: 6, title: "Roll and breadcrumb manchego croquetas", recipe: "Duck Leg Confit", assignedTo: "Callum D.", status: "in_progress" as const, shift: "AM", priority: "high" },
  { id: 7, title: "Make courgette velouté", recipe: "Scallops, Courgette Velouté", assignedTo: "Priya N.", status: "in_progress" as const, shift: "AM", priority: "high" },
  { id: 8, title: "Make manchego bechamel", recipe: "Duck Leg Confit", assignedTo: "Riya K.", status: "todo" as const, shift: "All day", priority: "high" },
  { id: 9, title: "Slice heritage tomatoes for garnish", recipe: "Seared Sea Bass", assignedTo: "Callum D.", status: "todo" as const, shift: "PM", priority: "low" },
  { id: 10, title: "Temper bavette steaks", recipe: "Bavette, Shallot Butter", assignedTo: "Tom B.", status: "todo" as const, shift: "PM", priority: "high" },
  { id: 11, title: "Make thyme oil", recipe: "Scallops, Courgette Velouté", assignedTo: "", status: "todo" as const, shift: "AM", priority: "medium" },
];

const RECIPES = [
  { name: "Scallops, Courgette Velouté", category: "Starter", portionCost: 5.18, sellingPrice: 16.00, fc: 32.4 },
  { name: "Seared Sea Bass, Beurre Blanc", category: "Main", portionCost: 5.96, sellingPrice: 28.00, fc: 21.3 },
  { name: "Duck Leg Confit, Manchego Croqueta", category: "Main", portionCost: 7.12, sellingPrice: 24.00, fc: 29.7 },
  { name: "Bavette, Shallot Butter", category: "Main", portionCost: 7.38, sellingPrice: 32.00, fc: 23.1 },
  { name: "Slow Pork Belly, Apple & Thyme", category: "Main", portionCost: 6.40, sellingPrice: 26.00, fc: 24.6 },
  { name: "Vanilla Panna Cotta, Berry Coulis", category: "Dessert", portionCost: 1.12, sellingPrice: 10.00, fc: 11.2 },
];

const WASTE_TODAY = [
  { name: "Duck Leg (Confit-ready)", qty: "0.3 kg", cost: 5.40, reason: "Missed the confit window" },
];

const INVOICES = [
  { id: "BPC-2024-0441", supplier: "Borough Produce Co.", amount: 312.80, date: "17 May", items: 4, note: null, noteResolved: false },
  { id: "ATL-20240-0887", supplier: "Atlas Meats", amount: 498.60, date: "19 May", items: 3, note: "2kg beef short — bringing tomorrow. Credit note requested.", noteResolved: false },
  { id: "SLN-2024-0192", supplier: "Sealane Fisheries", amount: 194.40, date: "21 May", items: 2, note: null, noteResolved: false },
  { id: "CDB-2024-0341", supplier: "Continental Dairy", amount: 156.70, date: "12 May", items: 3, note: "Butter substituted with different brand — spoke to rep, credit applied.", noteResolved: true },
];

const STOCKTAKE = [
  { name: "Beef Bavette", expected: "4.0 kg", counted: "3.2 kg", variance: "-0.8 kg", value: "-$18.00", ok: false },
  { name: "Heritage Tomatoes", expected: "5.0 kg", counted: "4.5 kg", variance: "-0.5 kg", value: "-$1.60", ok: false },
  { name: "Hand-Dived Scallops", expected: "30 pcs", counted: "24 pcs", variance: "-6 pcs", value: "-$16.80", ok: false },
  { name: "Cultured Butter (Normandy)", expected: "1.5 kg", counted: "2.0 kg", variance: "+0.5 kg", value: "+$6.30", ok: true },
  { name: "Fresh Thyme", expected: "6 bunches", counted: "4 bunches", variance: "-2 bunches", value: "-$1.80", ok: false },
  { name: "Garlic (Whole)", expected: "2.0 kg", counted: "2.5 kg", variance: "+0.5 kg", value: "+$1.75", ok: true },
];

const CLEANING_TASKS = [
  { area: "Walk-in Fridge", title: "Deep clean shelves and drainage", frequency: "weekly", assignedTo: "Callum D.", lastDone: "6 days ago", overdue: false },
  { area: "Fryer", title: "Full breakdown and filter change", frequency: "weekly", assignedTo: "Tom B.", lastDone: "8 days ago", overdue: true },
  { area: "Grill", title: "Degrease grates and burners", frequency: "daily", assignedTo: "Tom B.", lastDone: "Yesterday", overdue: false },
  { area: "Prep Area", title: "Sanitise all surfaces and chopping boards", frequency: "daily", assignedTo: "Priya N.", lastDone: "This morning", overdue: false },
  { area: "Dry Store", title: "Rotate stock, check date labels", frequency: "weekly", assignedTo: "Riya K.", lastDone: "5 days ago", overdue: false },
  { area: "Kitchen floors", title: "Deep mop and clean drains", frequency: "daily", assignedTo: "Callum D.", lastDone: "Yesterday", overdue: false },
];

const TEMP_LOGS = [
  { area: "Walk-in Fridge", sensor: "Main Probe", temp: 2.8, limit: "0–5°C", status: "ok" as const, loggedAt: "07:45", by: "James H." },
  { area: "Freezer Unit", sensor: "Chest Freezer", temp: -18.4, limit: "< -18°C", status: "ok" as const, loggedAt: "07:46", by: "James H." },
  { area: "Hot Hold — Soup", sensor: "Bain Marie", temp: 62.1, limit: "> 63°C", status: "warning" as const, loggedAt: "11:30", by: "Priya N." },
  { area: "Walk-in Fridge", sensor: "Main Probe", temp: 3.1, limit: "0–5°C", status: "ok" as const, loggedAt: "13:00", by: "Sofia R." },
  { area: "Delivery Temp — Fish", sensor: "Probe", temp: 4.2, limit: "< 5°C", status: "ok" as const, loggedAt: "08:15", by: "Sofia R." },
];

const WASTE_CHART_DATA = [
  { day: "Mon", waste: 8.40 },
  { day: "Tue", waste: 5.20 },
  { day: "Wed", waste: 12.80 },
  { day: "Thu", waste: 3.60 },
  { day: "Fri", waste: 9.75 },
  { day: "Sat", waste: 14.20 },
  { day: "Today", waste: 5.40 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMinutesUntil(cutoffTime: string): number {
  const now = new Date();
  const [h, m] = cutoffTime.split(":").map(Number);
  const cutoff = new Date(now);
  cutoff.setHours(h!, m!, 0, 0);
  return Math.round((cutoff.getTime() - now.getTime()) / 60000);
}

function formatCountdown(minutes: number): string {
  if (minutes < 0) return "Passed";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fcColor(fc: number): string {
  if (fc > 35) return "text-red-600 font-bold";
  if (fc > 30) return "text-orange-500 font-semibold";
  return "text-green-600 font-semibold";
}

// ─── Section nav tabs ─────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "prep", label: "Prep Board", icon: ClipboardList },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "recipes", label: "Recipes", icon: UtensilsCrossed },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "analytics", label: "Analytics", icon: TrendingDown },
  { id: "cleaning", label: "Cleaning", icon: SprayCan },
  { id: "temperature", label: "Temperature", icon: Thermometer },
];

const RECOMMENDED = [
  { id: "dashboard", label: "Dashboard", desc: "Supplier cutoffs, stock alerts, today's overview" },
  { id: "prep", label: "Prep Board", desc: "Click tasks to check them off — try it now" },
  { id: "recipes", label: "Recipe Costing", desc: "See live food cost % for every dish" },
  { id: "analytics", label: "Waste Analytics", desc: "7-day waste cost chart and breakdown" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [tasks, setTasks] = useState(PREP_TASKS_INIT);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(t);
  }, []);
  void tick;

  const toggleTask = useCallback((id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, status: t.status === "done" ? "todo" : "done" };
    }));
  }, []);

  const doneTasks = tasks.filter(t => t.status === "done").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const wasteCostToday = WASTE_TODAY.reduce((s, w) => s + w.cost, 0);
  const lowStockCount = STOCK_ALERTS.filter(a => a.status === "critical" || a.status === "low").length;
  const stagnantCount = STOCK_ALERTS.filter(a => a.status === "stagnant").length;
  const totalWasteWeek = WASTE_CHART_DATA.reduce((s, d) => s + d.waste, 0);
  const overdueClean = CLEANING_TASKS.filter(t => t.overdue).length;

  const todayStr = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 font-sans">

      {/* ── Demo Mode Banner ── */}
      <div className="bg-primary text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-3 flex-wrap">
        <span className="opacity-90">Demo Kitchen — The Black Apron. Changes reset on refresh.</span>
        <SignUpButton mode="modal">
          <button className="underline font-semibold hover:no-underline whitespace-nowrap">
            Set up your own kitchen free
          </button>
        </SignUpButton>
      </div>

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base sm:text-lg tracking-tight whitespace-nowrap">The Black Apron</span>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs shrink-0">Demo</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hidden sm:flex">Back</Button>
          </Link>
          <SignUpButton mode="modal">
            <Button size="sm" className="bg-primary text-white font-semibold">
              <span className="hidden sm:inline">Start free</span>
              <span className="sm:hidden">Sign up</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </SignUpButton>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Page title ── */}
        <div>
          <p className="text-sm text-slate-500 mb-1">{todayStr}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Good morning, chef. Here's where you are.</h1>
        </div>

        {/* ── Start Here guide ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <p className="text-sm font-semibold text-primary mb-3">Recommended areas to explore first</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RECOMMENDED.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveSection(r.id)}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-all",
                  activeSection === r.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <div>
                  <p className={cn("text-sm font-semibold", activeSection === r.id ? "text-white" : "text-slate-800")}>{r.label}</p>
                  <p className={cn("text-xs mt-0.5", activeSection === r.id ? "text-white/80" : "text-slate-500")}>{r.desc}</p>
                </div>
                <ChevronRight className={cn("w-4 h-4 shrink-0", activeSection === r.id ? "text-white/70" : "text-slate-300")} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Section navigation ── */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-1 min-w-max pb-1">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border",
                    activeSection === s.id
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════ DASHBOARD ══════════════════ */}
        {activeSection === "dashboard" && (
          <div className="space-y-5">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="bg-white border border-red-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs text-red-600 uppercase tracking-wider font-semibold">Low Stock</p>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{lowStockCount}</p>
                  <p className="text-xs text-slate-500 mt-1">items below par — order today</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs text-yellow-700 uppercase tracking-wider font-semibold">Stagnant Stock</p>
                    <Package className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-700">{stagnantCount}</p>
                  <p className="text-xs text-slate-500 mt-1">items tying up cash — use them up</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Waste Today</p>
                    <TrendingDown className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">${wasteCostToday.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">{WASTE_TODAY.length} item{WASTE_TODAY.length !== 1 ? "s" : ""} logged</p>
                </CardContent>
              </Card>
              <Card className={cn("bg-white", overdueClean > 0 ? "border-orange-200" : "border-slate-200")}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className={cn("text-xs uppercase tracking-wider font-semibold", overdueClean > 0 ? "text-orange-600" : "text-slate-500")}>Cleaning</p>
                    <SprayCan className={cn("w-4 h-4", overdueClean > 0 ? "text-orange-500" : "text-slate-400")} />
                  </div>
                  <p className={cn("text-3xl font-bold", overdueClean > 0 ? "text-orange-600" : "text-green-600")}>
                    {overdueClean > 0 ? overdueClean : "All clear"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{overdueClean > 0 ? "tasks overdue" : "cleaning tasks on schedule"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Supplier Cutoffs */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Supplier Cutoffs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {SUPPLIERS.map(supplier => {
                  const mins = getMinutesUntil(supplier.cutoffTime);
                  const passed = mins < 0;
                  const urgent = mins >= 0 && mins < 60;
                  const soonish = mins >= 60 && mins < 180;
                  return (
                    <div key={supplier.name} className={cn(
                      "flex items-center justify-between px-3 sm:px-4 py-3 rounded-lg border",
                      passed ? "bg-slate-50 border-slate-200 opacity-60"
                        : urgent ? "bg-red-50 border-red-200"
                          : soonish ? "bg-amber-50 border-amber-200"
                            : "bg-slate-50 border-slate-200"
                    )}>
                      <div>
                        <p className={cn("font-semibold text-sm", passed ? "text-slate-400" : "text-slate-800")}>{supplier.name}</p>
                        <p className="text-xs text-slate-500">{supplier.deliveryDays} · Next: {supplier.nextDelivery}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold tabular-nums",
                          passed ? "text-slate-400" : urgent ? "text-red-600" : soonish ? "text-amber-700" : "text-slate-700"
                        )}>
                          {formatCountdown(mins)}
                        </p>
                        <p className="text-xs text-slate-500">Cutoff {supplier.cutoffTime}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Waste today */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Waste Logged Today
                  <span className="text-xs font-normal text-slate-500">${wasteCostToday.toFixed(2)} cost impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {WASTE_TODAY.map(w => (
                  <div key={w.name} className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{w.name}</p>
                      <p className="text-xs text-slate-500">{w.qty} — {w.reason}</p>
                    </div>
                    <p className="font-bold text-red-600">${w.cost.toFixed(2)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══════════════════ PREP BOARD ══════════════════ */}
        {activeSection === "prep" && (
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Today's Prep Board
                  <span className="text-xs font-normal text-slate-500">
                    {doneTasks}/{tasks.length} done · {inProgressTasks} in progress
                  </span>
                </CardTitle>
                <Badge variant="outline" className="text-xs font-medium border-slate-200 text-slate-500">
                  Tap tasks to check off
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {tasks.map(task => {
                const isDone = task.status === "done";
                const isInProg = task.status === "in_progress";
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer",
                      isDone ? "bg-slate-50 border-slate-200 opacity-55 hover:opacity-75"
                        : isInProg ? "bg-primary/5 border-primary/25 hover:bg-primary/10"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      : isInProg
                        ? <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        isDone ? "line-through text-slate-400" : "text-slate-800"
                      )}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-slate-400">{task.recipe}</p>
                        {task.assignedTo && (
                          <span className="text-xs text-primary font-medium">{task.assignedTo}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority === "high" && !isDone && (
                        <Flame className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className="text-xs text-slate-400">{task.shift}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ══════════════════ INVENTORY ══════════════════ */}
        {activeSection === "inventory" && (
          <div className="space-y-5">
            {/* Stock alerts */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Stock Alerts
                  </CardTitle>
                  <span className="text-xs text-slate-500">{STOCK_ALERTS.filter(a => a.status !== "healthy").length} items need attention</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs">
                        <th className="py-2 px-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider">In stock</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Par</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {STOCK_ALERTS.map(alert => (
                        <tr key={alert.name} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{alert.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">{alert.stock}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400 hidden sm:table-cell">{alert.par}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[alert.status])}>
                              {STATUS_LABELS[alert.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Stocktake */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Latest Stocktake
                  </CardTitle>
                  <span className="text-xs text-slate-500">Today · 07:30</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs">
                        <th className="py-2 px-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Expected</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Counted</th>
                        <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {STOCKTAKE.map(row => (
                        <tr key={row.name} className={cn("hover:bg-slate-50/50", !row.ok && "bg-orange-50/30")}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{row.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400 hidden sm:table-cell">{row.expected}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">{row.counted}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={cn("text-xs font-semibold", row.ok ? "text-green-600" : "text-red-600")}>
                              {row.variance}
                              <span className="text-slate-500 ml-1 font-normal">({row.value})</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══════════════════ RECIPES ══════════════════ */}
        {activeSection === "recipes" && (
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  Dinner Menu — Food Cost Tracking
                </CardTitle>
                <span className="text-xs text-slate-500">Target: &lt;30% FC</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs">
                      <th className="py-2 px-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Dish</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Course</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Portion cost</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Sell</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500 uppercase tracking-wider">FC%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RECIPES.map(recipe => (
                      <tr key={recipe.name} className={cn("hover:bg-slate-50/50", recipe.fc > 30 && "bg-orange-50/40")}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{recipe.name}</td>
                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">{recipe.category}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 hidden sm:table-cell">${recipe.portionCost.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">${recipe.sellingPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={fcColor(recipe.fc)}>
                            {recipe.fc.toFixed(1)}%
                            {recipe.fc > 30 && <TrendingDown className="w-3 h-3 inline ml-1" />}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════ INVOICES ══════════════════ */}
        {activeSection === "invoices" && (
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Invoices
                <span className="text-xs font-normal text-slate-500">{INVOICES.length} this month</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {INVOICES.map(inv => (
                <div key={inv.id} className="rounded-lg border bg-slate-50 border-slate-200 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{inv.supplier}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{inv.id} · {inv.date} · {inv.items} line items</p>
                    </div>
                    <p className="font-bold text-slate-800 shrink-0">${inv.amount.toFixed(2)}</p>
                  </div>
                  {inv.note && (
                    <div className={cn(
                      "mt-2.5 rounded-md px-3 py-2 flex items-start gap-2 text-xs",
                      inv.noteResolved
                        ? "bg-slate-100 border border-slate-200"
                        : "bg-amber-50 border border-amber-200"
                    )}>
                      <span className={cn("shrink-0 mt-0.5", inv.noteResolved ? "text-slate-400" : "text-amber-600")}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </span>
                      <p className={cn("flex-1 leading-relaxed", inv.noteResolved ? "text-slate-400 line-through" : "text-slate-700")}>
                        {inv.note}
                      </p>
                      {inv.noteResolved && (
                        <span className="text-[10px] font-semibold text-green-600 shrink-0">Resolved</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500">Total this month</span>
                <span className="font-bold text-slate-800">
                  ${INVOICES.reduce((s, i) => s + i.amount, 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════ ANALYTICS ══════════════════ */}
        {activeSection === "analytics" && (
          <div className="space-y-5">
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    Waste Cost — Last 7 Days
                  </CardTitle>
                  <span className="text-xs text-slate-500">
                    Total: <span className="font-bold text-slate-700">${totalWasteWeek.toFixed(2)}</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={WASTE_CHART_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <RechartsTooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Waste cost"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="waste" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top waste items */}
            <Card className="bg-white border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  Top Waste Sources — This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {[
                  { name: "Hand-Dived Scallops", cost: 14.00, reason: "spoilage" },
                  { name: "Beef Bavette", cost: 11.25, reason: "overcooked" },
                  { name: "Sea Bass (Whole)", cost: 9.75, reason: "spoilage" },
                  { name: "Duck Leg (Confit-ready)", cost: 5.40, reason: "spoilage" },
                  { name: "Heritage Pork Belly", cost: 4.44, reason: "overcooked" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-sm font-bold text-red-600 ml-2 shrink-0">${item.cost.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                          <div
                            className="h-full bg-red-400 rounded-full"
                            style={{ width: `${(item.cost / 14) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{item.reason}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══════════════════ CLEANING ══════════════════ */}
        {activeSection === "cleaning" && (
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <SprayCan className="w-4 h-4 text-primary" />
                  Cleaning Roster
                </CardTitle>
                {overdueClean > 0 && (
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    {overdueClean} overdue
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {CLEANING_TASKS.map((task, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-3 px-3 sm:px-4 py-3 rounded-lg border",
                  task.overdue ? "bg-orange-50 border-orange-200" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-slate-800">{task.title}</p>
                      {task.overdue && (
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">Overdue</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">{task.area}</span>
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", {
                        "bg-blue-100 text-blue-700": task.frequency === "daily",
                        "bg-purple-100 text-purple-700": task.frequency === "weekly",
                      })}>
                        {task.frequency}
                      </span>
                      <span className="text-xs text-primary font-medium">{task.assignedTo}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">Last: {task.lastDone}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ══════════════════ TEMPERATURE ══════════════════ */}
        {activeSection === "temperature" && (
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-primary" />
                  Temperature Log — Today
                </CardTitle>
                <span className="text-xs text-slate-500">
                  <span className="text-yellow-700 font-semibold">1 warning</span> · 4 clear
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {TEMP_LOGS.map((log, i) => (
                <div key={i} className={cn(
                  "flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-lg border",
                  log.status === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-green-50/50 border-green-100"
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-slate-800">{log.area}</p>
                      {log.status === "warning" && (
                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">Warning</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{log.sensor} · {log.loggedAt} · {log.by}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-lg font-bold tabular-nums",
                      log.status === "warning" ? "text-yellow-700" : "text-green-600"
                    )}>
                      {log.temp > 0 ? `${log.temp}°C` : `${log.temp}°C`}
                    </p>
                    <p className="text-xs text-slate-400">{log.limit}</p>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                Next scheduled check: <span className="font-medium text-slate-700">14:00 — Tom B.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── CTA ── */}
        <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 md:p-10 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to set up your kitchen?</h2>
          <p className="text-slate-300 mb-6 max-w-md mx-auto text-sm sm:text-base">
            The Black Apron is a demo kitchen. Create a free account and you'll have your own setup in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 rounded-full group w-full sm:w-auto">
                Start for free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SignUpButton>
            <p className="text-sm text-slate-400">No credit card. Takes under 5 minutes.</p>
          </div>
        </div>

        {/* Feature quick-links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { icon: <Package className="w-5 h-5" />, label: "Live inventory", sub: "Color-coded alerts" },
            { icon: <ClipboardList className="w-5 h-5" />, label: "Prep board", sub: "Team task assignment" },
            { icon: <UtensilsCrossed className="w-5 h-5" />, label: "Recipe costing", sub: "Auto food cost %" },
            { icon: <Zap className="w-5 h-5" />, label: "Invoice scanning", sub: "AI line-item extraction" },
          ].map(f => (
            <div key={f.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex justify-center mb-2 text-primary">{f.icon}</div>
              <p className="font-semibold text-sm text-slate-800">{f.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
