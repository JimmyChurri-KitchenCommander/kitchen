import { SignInButton, SignUpButton, useAuth } from "@clerk/react";
import {
  ArrowRight, Zap, Sun, Moon, Loader2, CheckCircle2,
  Activity, BarChart3, AlertTriangle, Clock, Database,
} from "lucide-react";
import { Redirect, Link } from "wouter";
import { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { AppIcon } from "@/components/AppIcon";
import { KitchenSystemGraph } from "@/components/KitchenSystemGraph";

// ── Signals ───────────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "healthy";

interface Signal {
  id: string;
  severity: Severity;
  label: string;
  module: string;
  moduleColor: string;
  affectedNodes: string[];
  summary: string;
  chain: Array<{ text: string; color: string }>;
}

const SIGNALS: Signal[] = [
  {
    id: "dairy-depletion",
    severity: "critical",
    label: "Stock depletion — dairy line",
    module: "Inventory",
    moduleColor: "#1464D8",
    affectedNodes: ["inventory", "prep", "intelligence"],
    summary: "Butter and cream depleting faster than restock schedule. Service risk.",
    chain: [
      { text: "Butter: critical — 200g remaining", color: "#dc2626" },
      { text: "Cream 2L: below par, 3 portions at risk", color: "#d97706" },
      { text: "2 prep tasks requiring dairy now blocked", color: "#d97706" },
      { text: "Intelligence escalating to focus queue", color: "#7c3aed" },
    ],
  },
  {
    id: "cost-drift",
    severity: "warning",
    label: "Cost drift — beef category",
    module: "Cost Engine",
    moduleColor: "#059669",
    affectedNodes: ["cost", "intelligence", "inventory"],
    summary: "Beef supplier invoiced +14% above last recorded price.",
    chain: [
      { text: "Beef supplier price +14% on latest invoice", color: "#1464D8" },
      { text: "4 beef dishes recalculating live GP%", color: "#059669" },
      { text: "Avg margin on mains drifting toward 32%", color: "#d97706" },
      { text: "Intelligence flagging drift before service", color: "#7c3aed" },
    ],
  },
  {
    id: "overproduction",
    severity: "warning",
    label: "Prep overproduction — peak service",
    module: "Prep System",
    moduleColor: "#d97706",
    affectedNodes: ["prep", "waste", "intelligence"],
    summary: "Batch sizes running 40% above forecast during peak service window.",
    chain: [
      { text: "Sauce batch prepped 40% above forecast", color: "#d97706" },
      { text: "Over-prep signal flowing to Waste module", color: "#dc2626" },
      { text: "Inventory deduction ahead of actual usage", color: "#1464D8" },
      { text: "Intelligence flagging recurring Tuesday pattern", color: "#7c3aed" },
    ],
  },
  {
    id: "waste-spike",
    severity: "warning",
    label: "Waste spike — prep stage this morning",
    module: "Wastage",
    moduleColor: "#dc2626",
    affectedNodes: ["waste", "cost", "intelligence"],
    summary: "Trim loss and overproduction waste up 20% vs last Tuesday.",
    chain: [
      { text: "Trim waste $18.40 logged before 10am", color: "#dc2626" },
      { text: "Overproduction: 3 portions discarded", color: "#dc2626" },
      { text: "Cost Engine recalculating affected dish margins", color: "#059669" },
      { text: "Intelligence: Tuesday pattern confirmed", color: "#7c3aed" },
    ],
  },
  {
    id: "gp-healthy",
    severity: "healthy",
    label: "GP% up +1.2% vs last week",
    module: "Cost Engine",
    moduleColor: "#059669",
    affectedNodes: ["cost", "intelligence"],
    summary: "Margin improving — supplier renegotiation and reduced trim waste both contributing.",
    chain: [
      { text: "Lamb rump GP% improved to 73.4%", color: "#059669" },
      { text: "3 recipes updated via last invoice scan", color: "#059669" },
      { text: "Trim waste down 8% vs last week", color: "#059669" },
      { text: "Intelligence: strong margin week confirmed", color: "#7c3aed" },
    ],
  },
];

const SEVERITY: Record<Severity, { dot: string; border: string; bg: string; activeBg: string; activeBorder: string; label: string }> = {
  critical: {
    dot: "#dc2626",
    border: "rgba(220,38,38,0.18)",
    bg: "rgba(220,38,38,0.04)",
    activeBg: "rgba(220,38,38,0.12)",
    activeBorder: "rgba(220,38,38,0.45)",
    label: "Critical",
  },
  warning: {
    dot: "#f59e0b",
    border: "rgba(245,158,11,0.18)",
    bg: "rgba(245,158,11,0.04)",
    activeBg: "rgba(245,158,11,0.12)",
    activeBorder: "rgba(245,158,11,0.45)",
    label: "Warning",
  },
  healthy: {
    dot: "#10b981",
    border: "rgba(16,185,129,0.18)",
    bg: "rgba(16,185,129,0.04)",
    activeBg: "rgba(16,185,129,0.12)",
    activeBorder: "rgba(16,185,129,0.45)",
    label: "Healthy",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme, setTheme } = useTheme();
  const [demoLoading, setDemoLoading] = useState(false);
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("kc_zoom") !== "1") return;
    sessionStorage.removeItem("kc_zoom");
    setActivating(true);
    const t = setTimeout(() => setActivating(false), 80);
    return () => clearTimeout(t);
  }, []);

  const activeSignal = SIGNALS.find(s => s.id === activeSignalId) ?? null;

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/demo-link");
      if (!res.ok) throw new Error("Failed");
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      setDemoLoading(false);
    }
  };

  const toggleSignal = (id: string) =>
    setActiveSignalId(prev => (prev === id ? null : id));

  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <AppIcon className="w-10 h-10 shrink-0" />
            <span className="font-bold text-[15px] tracking-tight text-foreground">Kitchen Command</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-foreground/60">
            <Link href="/"             className="hover:text-foreground transition-colors">Overview</Link>
            <Link href="/modules"      className="hover:text-foreground transition-colors">Modules</Link>
            <span className="text-foreground font-semibold">Intelligence</span>
            <Link href="/apprentice"   className="hover:text-foreground transition-colors">Apprentice</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle light/dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <SignInButton mode="modal">
              <button className="text-foreground/60 hover:text-foreground text-sm font-medium transition-colors px-3 py-1.5">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-[#1464D8] hover:bg-[#1255b8] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">Get started free</button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#080e18] border-b border-white/8">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#7c3aed]/10 rounded-full blur-[120px] pointer-events-none" />

        <div
          className="relative z-10 max-w-4xl mx-auto px-5 pt-16 pb-14 text-center"
          style={{
            opacity: activating ? 0 : 1,
            transform: activating ? "translateY(-10px)" : "translateY(0)",
            transition: "all 0.9s 0.15s ease-out",
          }}
        >
          <div className="inline-flex items-center gap-2 bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-full px-4 py-1.5 text-sm text-[#a78bfa] font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse" />
            System consciousness — live
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[3.25rem] font-black tracking-tight leading-[1.04] text-white mb-5">
            Kitchen intelligence,<br className="hidden sm:block" />
            <span className="text-[#a78bfa]"> in real time.</span>
          </h1>
          <p className="text-base md:text-lg text-white/45 leading-relaxed max-w-2xl mx-auto mb-8">
            Not a dashboard of numbers collected after the fact.
            A live network where every module feeds signals into a single system of truth —
            surfacing what matters before it becomes a problem.
          </p>
          {/* Bridge line */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-6 py-3">
            <span className="text-sm font-bold text-white/50">Modules run the kitchen.</span>
            <span className="w-px h-4 bg-white/15 shrink-0" />
            <span className="text-sm font-bold text-[#a78bfa]">Intelligence understands it.</span>
          </div>
        </div>
      </section>

      {/* ── Live system — signals + graph + causal ───────────────────────────── */}
      <section className="bg-[#080e18] border-b border-white/8">
        <div className="max-w-[1320px] mx-auto px-5 py-10">

          {/* Column headers */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 mb-4">
            <p className="text-[10px] font-black uppercase tracking-[2.5px] text-white/30">Live Kitchen Signals</p>
            <p className="hidden lg:block text-[10px] font-black uppercase tracking-[2.5px] text-white/30 text-center">Live System Graph</p>
            <p className="hidden lg:block text-[10px] font-black uppercase tracking-[2.5px] text-white/30">Why this is happening</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 items-start">

            {/* ── Left: Signals ── */}
            <div
              className="space-y-2 order-2 lg:order-1"
              style={{
                opacity: activating ? 0 : 1,
                transform: activating ? "translateX(-28px)" : "translateX(0)",
                transition: "all 0.9s 0.4s ease-out",
              }}
            >
              {SIGNALS.map(signal => {
                const sev = SEVERITY[signal.severity];
                const isActive = activeSignalId === signal.id;
                return (
                  <button
                    key={signal.id}
                    onClick={() => toggleSignal(signal.id)}
                    className="w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200 group"
                    style={{
                      background: isActive ? sev.activeBg : sev.bg,
                      borderColor: isActive ? sev.activeBorder : sev.border,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 mt-1"
                        style={{ background: sev.dot, boxShadow: isActive ? `0 0 6px ${sev.dot}` : "none" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white/80 leading-snug mb-1">{signal.label}</p>
                        <p className="text-[10px] text-white/35 leading-snug">{signal.module}</p>
                      </div>
                      <span
                        className="text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5"
                        style={{ color: sev.dot }}
                      >
                        {sev.label}
                      </span>
                    </div>
                  </button>
                );
              })}
              <p className="text-[9px] text-white/20 text-center pt-2 tracking-wider uppercase">
                Select a signal to trace its cause
              </p>
            </div>

            {/* ── Centre: Graph ── */}
            <div
              className="order-1 lg:order-2"
              style={{
                transform: activating ? "scale(1.07)" : "scale(1)",
                transition: "transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)",
              }}
            >
              <KitchenSystemGraph
                highlightedNodes={activeSignal?.affectedNodes}
                mode={activating ? "awakening" : "live"}
              />
            </div>

            {/* ── Right: Causal intelligence ── */}
            <div
              className="order-3"
              style={{
                opacity: activating ? 0 : 1,
                transform: activating ? "translateX(28px)" : "translateX(0)",
                transition: "all 0.9s 0.6s ease-out",
              }}
            >
              {activeSignal ? (
                <div
                  className="rounded-xl border p-5 h-full"
                  style={{
                    background: SEVERITY[activeSignal.severity].activeBg,
                    borderColor: SEVERITY[activeSignal.severity].activeBorder,
                  }}
                >
                  <p className="text-[9px] font-black uppercase tracking-[2px] text-white/30 mb-1">Why this is happening</p>
                  <p
                    className="text-xs font-black mb-1"
                    style={{ color: activeSignal.moduleColor }}
                  >
                    {activeSignal.label}
                  </p>
                  <p className="text-[11px] text-white/45 leading-relaxed mb-5">{activeSignal.summary}</p>

                  <p className="text-[9px] font-black uppercase tracking-[2px] text-white/25 mb-3">Causal chain</p>
                  <div className="space-y-0">
                    {activeSignal.chain.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5 pb-3">
                        <div className="flex flex-col items-center shrink-0">
                          <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: step.color }} />
                          {i < activeSignal.chain.length - 1 && (
                            <span className="w-px flex-1 mt-1" style={{ background: `${step.color}30`, minHeight: "12px" }} />
                          )}
                        </div>
                        <p className="text-[11px] text-white/60 leading-snug pt-0">{step.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/8">
                    <p className="text-[9px] font-black uppercase tracking-[2px] text-white/25 mb-2">Modules affected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSignal.affectedNodes.map((nodeId) => {
                        const colors: Record<string, string> = {
                          intelligence: "#7c3aed",
                          inventory: "#1464D8",
                          prep: "#d97706",
                          cost: "#059669",
                          waste: "#dc2626",
                          compliance: "#0e7490",
                        };
                        const labels: Record<string, string> = {
                          intelligence: "Intelligence",
                          inventory: "Inventory",
                          prep: "Prep",
                          cost: "Cost Engine",
                          waste: "Wastage",
                          compliance: "Compliance",
                        };
                        const c = colors[nodeId] ?? "#ffffff";
                        return (
                          <span
                            key={nodeId}
                            className="text-[9px] font-bold rounded-md px-2 py-1"
                            style={{ background: `${c}18`, border: `1px solid ${c}35`, color: c }}
                          >
                            {labels[nodeId] ?? nodeId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/6 bg-white/[0.02] p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <div className="w-8 h-8 rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/25 flex items-center justify-center mb-3">
                    <Activity className="w-4 h-4 text-[#7c3aed]/60" />
                  </div>
                  <p className="text-[11px] font-bold text-white/30 mb-1">Causal Intelligence</p>
                  <p className="text-[10px] text-white/18 leading-relaxed">
                    Select a signal on the left to see why it is happening — cause, chain, and affected modules.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── Same system, different depth ────────────────────────────────────── */}
      <section className="py-20 px-5 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-[#7c3aed] mb-3">One system. Two views.</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-4 leading-tight">
              You're not switching pages.<br className="hidden sm:block" />
              You're changing how deeply you're looking.
            </h2>
            <p className="text-foreground/50 text-base max-w-xl mx-auto leading-relaxed">
              Modules and Intelligence share the same underlying system.
              Same nodes. Same data flows. Different depth of view.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-7">
              <Link href="/modules" className="group inline-block mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1464D8]/10 border border-[#1464D8]/20 flex items-center justify-center">
                    <Database className="w-4 h-4 text-[#1464D8]" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] group-hover:underline">Modules</p>
                </div>
              </Link>
              <p className="text-lg font-black text-foreground mb-3">What exists</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Structured system components. Static relationships. The five modules that run every part of your kitchen — inventory, prep, cost, compliance, waste.
              </p>
              <div className="space-y-2">
                {["Inventory tracks every item in real time", "Prep board manages every task and completion", "Cost Engine calculates live GP% per dish", "Compliance logs every temperature check and cleaning event", "Waste captures every loss at the point it happens"].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#1464D8] shrink-0 mt-1.5" />
                    <p className="text-xs text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#080e18] border border-[#7c3aed]/30 rounded-2xl p-7">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-[#a78bfa]">Intelligence</p>
              </div>
              <p className="text-lg font-black text-white mb-3">What is happening</p>
              <p className="text-sm text-white/45 leading-relaxed mb-5">
                Live behaviour of those components. Dynamic cause-effect chains. The system watching itself — surfacing what matters, before you need to go looking for it.
              </p>
              <div className="space-y-2">
                {["Signals flow from all five modules into a single view", "Anomalies are traced to their cause automatically", "The system explains itself — cause, chain, impact", "Nothing is static. Everything is in motion.", "Real-time awareness at every level of service"].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#7c3aed] shrink-0 mt-1.5" />
                    <p className="text-xs text-white/45">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intelligence capabilities ─────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-muted/20 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-[#7c3aed] mb-3">The system brain</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-4">
              Operational Intelligence is not a module.<br className="hidden sm:block" />
              It is the live state of your kitchen.
            </h2>
            <p className="text-foreground/55 text-base max-w-xl mx-auto leading-relaxed">
              It doesn't analyse. It surfaces — in real time — what every other module already knows, combined into a single operational view.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Activity,       color: "#7c3aed", label: "Live Pressure Score",      desc: "0–100 operational pressure index. Combines prep completion rate, station load, outstanding tasks, and time remaining to service. Updated every 20 seconds." },
              { icon: Zap,            color: "#d97706", label: "Focus Queue",               desc: "The 5 tasks that will have the most impact right now, ranked by urgency, feasibility, and operational risk. Not a to-do list — a decision surface." },
              { icon: BarChart3,      color: "#059669", label: "GP% Drift Detection",       desc: "Watches for live margin changes caused by supplier price movements, yield loss, or recipe-to-actual variance. Alerts before the P&L catches it." },
              { icon: AlertTriangle,  color: "#dc2626", label: "Waste Pattern Alerts",      desc: "Identifies recurring waste across shifts and services. When a pattern crosses a threshold, it surfaces as an anomaly — not a month-end surprise." },
              { icon: Clock,          color: "#0e7490", label: "Service Phase Engine",      desc: "Five service states: Pre-Prep, Final Prep, Pre-Service, Live Service, and Post-Service. Each phase adjusts what the system surfaces and how urgently." },
              { icon: Database,       color: "#1464D8", label: "Operational History",       desc: "Every event — prep completion, waste log, temp check, invoice scan — is stored with a timestamp. The longer you run Kitchen Command, the richer the intelligence." },
            ].map(({ icon: Icon, color, label, desc }, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-xs font-black text-foreground mb-1.5">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / after ───────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-red-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-black uppercase tracking-widest text-red-500">How most kitchens operate</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Prep visibility",    value: "Paper list rubbed out during service" },
                  { label: "Stock position",     value: "Checked once, wrong by service time" },
                  { label: "Food cost",          value: "Calculated at end of week, too late to act" },
                  { label: "Waste tracking",     value: "Estimated at shift end, if at all" },
                  { label: "Compliance records", value: "Written up retrospectively" },
                  { label: "Intelligence",       value: "P&L arrives 30 days after the event" },
                ].map((row, i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <span className="text-xs font-semibold text-foreground/50 shrink-0">{row.label}</span>
                    <span className="text-xs text-red-400/80 text-right leading-snug">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-[#7c3aed]/30 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-[#a78bfa]">With Operational Intelligence</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Prep visibility",    value: "Live board — who owns each task, what's done" },
                  { label: "Stock position",     value: "Updated on every prep completion and invoice scan" },
                  { label: "Food cost",          value: "Live GP% per dish — recalculates on every price change" },
                  { label: "Waste tracking",     value: "Logged at the point it happens, cost impact instant" },
                  { label: "Compliance records", value: "Generated as you operate, always audit-ready" },
                  { label: "Intelligence",       value: "Surfaced during service, in time to act on it" },
                ].map((row, i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <span className="text-xs font-semibold text-foreground/50 shrink-0">{row.label}</span>
                    <span className="text-xs text-[#a78bfa] text-right leading-snug">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-muted/20 border-b border-border relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#7c3aed]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest text-[#7c3aed] mb-5">One kitchen. One system. Real-time awareness at every level.</p>
          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-5">
            Stop reporting on your kitchen.<br />Start commanding it.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-lg mx-auto">
            Set up in minutes. The system goes live the moment your first data flows in. No spreadsheets. No delayed information. No surprises.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <SignUpButton mode="modal">
              <button className="w-full sm:w-auto h-13 px-10 text-base font-bold rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] flex items-center justify-center gap-2 transition-colors group">
                Get started free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto h-13 px-10 text-base font-semibold rounded-xl border border-border text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#7c3aed]" />}
              Open Demo Kitchen
            </button>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/35">
            {["No credit card needed", "Set up in minutes", "Free to start"].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AppIcon className="w-7 h-7" />
            <span className="font-bold text-sm text-foreground/70">Kitchen Command</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-foreground/40">
            <Link href="/"             className="hover:text-foreground/70 transition-colors">Overview</Link>
            <Link href="/modules"      className="hover:text-foreground/70 transition-colors">Modules</Link>
            <span className="text-foreground/70 font-medium">Intelligence</span>
            <Link href="/apprentice"   className="hover:text-foreground/70 transition-colors">Apprentice</Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <SignInButton mode="modal">
              <button className="text-foreground/35 hover:text-foreground/70 transition-colors">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-[#1464D8] font-semibold hover:underline">Get started</button>
            </SignUpButton>
          </div>
        </div>
      </footer>
    </div>
  );
}
