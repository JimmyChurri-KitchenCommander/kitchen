import { SignInButton, SignUpButton, useAuth } from "@clerk/react";
import {
  ArrowRight, ChefHat, ClipboardList, Package, TrendingDown,
  ShieldCheck, Activity, Trash2, Zap, Sun, Moon, CheckCircle2,
  Loader2, BarChart3, Database, Clock, AlertTriangle,
} from "lucide-react";
import { Redirect, Link, useLocation } from "wouter";
import { useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { AppIcon } from "@/components/AppIcon";
import { KitchenSystemGraph } from "@/components/KitchenSystemGraph";

// ── Module definitions ────────────────────────────────────────────────────────
const MODULES = [
  {
    id: "inventory",
    icon: Package,
    accentColor: "#1464D8",
    glowColor: "rgba(20,100,216,0.18)",
    borderColor: "rgba(20,100,216,0.35)",
    label: "Inventory Intelligence",
    truth: "Live stock, not spreadsheet stock.",
    replaces: "Manual stocktakes, static par levels, end-of-week counts",
    tracks: [
      "Usage from recipes and prep completions",
      "Adjustments from supplier invoices",
      "Deductions from logged waste",
      "Live par-level status per item",
    ],
    punchline: "You don't count stock anymore. The system does.",
    status: "Always updating",
  },
  {
    id: "prep",
    icon: ClipboardList,
    accentColor: "#d97706",
    glowColor: "rgba(217,119,6,0.18)",
    borderColor: "rgba(217,119,6,0.35)",
    label: "Prep System",
    truth: "Every prep task tied to real demand.",
    replaces: "Prep lists on whiteboards, handwritten task sheets",
    tracks: [
      "Component workflows by station and priority",
      "Yield-aware production quantities",
      "Task completion with staff attribution",
      "Handover notes across shifts",
    ],
    punchline: "Prep becomes production intelligence, not guesswork.",
    status: "Live during service",
  },
  {
    id: "cost",
    icon: TrendingDown,
    accentColor: "#059669",
    glowColor: "rgba(5,150,105,0.18)",
    borderColor: "rgba(5,150,105,0.35)",
    label: "Cost Engine",
    truth: "Know your margin while you cook, not after service.",
    replaces: "End-of-week costing spreadsheets, manual GP calculations",
    tracks: [
      "Ingredient usage per dish from live inventory",
      "Supplier price changes from scanned invoices",
      "Yield loss and wastage deductions",
      "Live GP% per recipe, updated on every change",
    ],
    punchline: "Every dish has a live margin, not a historical one.",
    status: "Always updating",
  },
  {
    id: "compliance",
    icon: ShieldCheck,
    accentColor: "#0e7490",
    glowColor: "rgba(14,116,144,0.18)",
    borderColor: "rgba(14,116,144,0.35)",
    label: "Compliance Layer",
    truth: "Proof of compliance, generated as you operate.",
    replaces: "Retrospective HACCP logs, paper temperature sheets",
    tracks: [
      "Temperature checks with pass/fail thresholds",
      "Storage event logs with timestamps",
      "Cleaning task completion by staff",
      "Chemical SOP access and safety events",
    ],
    punchline: "Compliance becomes automatic, not admin.",
    status: "Running in parallel",
  },
  {
    id: "waste",
    icon: Trash2,
    accentColor: "#dc2626",
    glowColor: "rgba(220,38,38,0.18)",
    borderColor: "rgba(220,38,38,0.35)",
    label: "Wastage Intelligence",
    truth: "Waste is no longer invisible.",
    replaces: "Rough estimates of loss, end-of-service guesses",
    tracks: [
      "Prep trim waste at the point it happens",
      "Service overproduction by dish and shift",
      "Spoilage with reason tagging and cost impact",
      "Recurring patterns surfaced automatically",
    ],
    punchline: "You don't reduce waste later. You see it happen.",
    status: "Live during service",
  },
  {
    id: "intelligence",
    icon: Activity,
    accentColor: "#7c3aed",
    glowColor: "rgba(124,58,237,0.25)",
    borderColor: "rgba(124,58,237,0.45)",
    label: "Operational Intelligence",
    truth: "Your kitchen, as a live system.",
    replaces: "End-of-service reporting, after-the-fact analysis",
    tracks: [
      "Combined view across all five modules in real time",
      "Live Pressure Score during service (0–100)",
      "Focus Queue — top priorities ranked by urgency",
      "Waste trends, GP drift, and price spike alerts",
    ],
    punchline: "Not reporting. Awareness while it happens.",
    status: "Flagship — always on",
    flagship: true,
  },
];

// ── Data flow connections ─────────────────────────────────────────────────────
const FLOWS = [
  { from: "Prep completions",     to: "Inventory deductions",   color: "#1464D8" },
  { from: "Stock levels",         to: "Live food cost",          color: "#059669" },
  { from: "Wastage logged",       to: "GP% recalculated",        color: "#dc2626" },
  { from: "Invoice scanned",      to: "Prices updated instantly",color: "#d97706" },
  { from: "Compliance logged",    to: "Audit trail updated",     color: "#0e7490" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function ModulesPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme, setTheme } = useTheme();
  const [demoLoading, setDemoLoading] = useState(false);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [awakening, setAwakening] = useState(false);
  const [, navigate] = useLocation();

  const handleIntelligenceNav = () => {
    if (awakening) return;
    setAwakening(true);
    sessionStorage.setItem("kc_zoom", "1");
    setTimeout(() => navigate("/intelligence"), 680);
  };

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
            <Link href="/" className="hover:text-foreground transition-colors">Overview</Link>
            <span className="text-foreground font-semibold">Modules</span>
            <button onClick={handleIntelligenceNav} className="hover:text-foreground transition-colors">Intelligence</button>
            <Link href="/apprentice" className="hover:text-foreground transition-colors">Apprentice</Link>
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
              <button className="text-foreground/60 hover:text-foreground text-sm font-medium transition-colors px-3 py-1.5">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-[#1464D8] hover:bg-[#1255b8] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                Get started free
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#1464D8]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 pt-20 pb-16 md:pt-24 md:pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1464D8]/15 border border-[#1464D8]/30 rounded-full px-4 py-1.5 text-sm text-[#1464D8] font-semibold mb-8">
            <ChefHat className="w-3.5 h-3.5" />
            Six modules. One system of truth.
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.02] text-foreground mb-6">
            The operating system<br className="hidden sm:block" />
            <span className="text-[#1464D8]"> of your kitchen.</span>
          </h1>
          <p className="text-base md:text-lg text-foreground/60 leading-relaxed max-w-2xl mx-auto mb-3">
            Every module runs in real time — feeding one system of truth across prep, stock, cost, and compliance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm font-semibold text-foreground/40 mb-10">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              No silos.
            </span>
            <span className="hidden sm:block text-foreground/20">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              No end-of-service reconciliation.
            </span>
            <span className="hidden sm:block text-foreground/20">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              No missing data.
            </span>
          </div>
          <div className="inline-block bg-muted/50 border border-border rounded-xl px-5 py-3">
            <p className="text-sm text-foreground/50 italic">
              If it doesn't update in service, it doesn't belong in your kitchen system.
            </p>
          </div>
        </div>
      </section>

      {/* ── Module grid ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-1.5">System components</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                Six modules. Zero silos.
              </h2>
            </div>
            <p className="hidden md:block text-xs text-muted-foreground max-w-xs text-right leading-relaxed">
              Hover a module to see what it replaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isHovered = hoveredModule === mod.id;

              return (
                <div
                  key={mod.id}
                  onMouseEnter={() => setHoveredModule(mod.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  className="group relative rounded-2xl border bg-card overflow-hidden cursor-default transition-all duration-300"
                  style={{
                    borderColor: isHovered ? mod.borderColor : "var(--border)",
                    boxShadow: isHovered ? `0 0 40px ${mod.glowColor}` : "none",
                  }}
                >
                  {/* Glow blob behind the card */}
                  <div
                    className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at top left, ${mod.glowColor}, transparent 70%)`,
                      opacity: isHovered ? 1 : 0,
                    }}
                  />

                  <div className="relative p-6 flex flex-col h-full min-h-[260px]">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${mod.accentColor}22`, border: `1px solid ${mod.accentColor}44` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: mod.accentColor }} />
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[10px] font-bold"
                        style={{
                          background: `${mod.accentColor}15`,
                          borderColor: `${mod.accentColor}40`,
                          color: mod.accentColor,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                          style={{ background: mod.accentColor }}
                        />
                        {mod.status}
                      </div>
                    </div>

                    {/* Label + truth */}
                    <p
                      className="text-[10px] font-black uppercase tracking-widest mb-1.5"
                      style={{ color: mod.accentColor }}
                    >
                      {mod.label}
                      {mod.flagship && (
                        <span className="ml-2 text-[9px] font-bold bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#a78bfa] rounded-full px-2 py-0.5 normal-case tracking-normal align-middle">
                          Flagship
                        </span>
                      )}
                    </p>
                    <h3 className="text-base font-black text-foreground leading-snug mb-3">
                      {mod.truth}
                    </h3>

                    {/* What it tracks — always visible */}
                    <div className="space-y-1.5 flex-1">
                      {mod.tracks.map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                            style={{ background: mod.accentColor }}
                          />
                          <span className="text-[11px] text-foreground/60 leading-snug">{t}</span>
                        </div>
                      ))}
                    </div>

                    {/* Replaces — revealed on hover */}
                    <div
                      className="mt-4 pt-4 border-t transition-all duration-300 overflow-hidden"
                      style={{
                        borderColor: `${mod.accentColor}30`,
                        maxHeight: isHovered ? "80px" : "0px",
                        opacity: isHovered ? 1 : 0,
                        paddingTop: isHovered ? "1rem" : "0",
                        marginTop: isHovered ? "1rem" : "0",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: mod.accentColor }}>
                        Replaces
                      </p>
                      <p className="text-[11px] text-foreground/55 leading-snug">{mod.replaces}</p>
                    </div>

                    {/* Punchline */}
                    <div
                      className="mt-4 rounded-xl px-3 py-2.5 transition-all duration-300"
                      style={{
                        background: `${mod.accentColor}10`,
                        border: `1px solid ${mod.accentColor}25`,
                      }}
                    >
                      <p className="text-[11px] font-semibold italic" style={{ color: mod.accentColor }}>
                        {mod.punchline}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Intelligence strip: data flow ───────────────────────────────────── */}
      <section className="py-20 px-5 border-y border-border bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-4">Data architecture</p>
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-6 leading-tight">
                Everything feeds<br />one system of truth.
              </h2>
              <div className="space-y-4 text-foreground/65 text-base leading-relaxed">
                <p>Modules don't operate independently. They continuously update each other.</p>
                <div className="space-y-2.5 border-l-2 border-[#1464D8]/30 pl-5">
                  <p>A change in prep affects stock.</p>
                  <p>Stock affects cost.</p>
                  <p>Wastage affects forecasting.</p>
                  <p>Compliance runs in parallel to everything.</p>
                </div>
              </div>
              <p className="mt-6 text-sm font-bold text-[#1464D8]">
                This is what real-time actually means.
              </p>
            </div>

            {/* Live data flow panel */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-foreground/50">Live data flows</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Now</span>
              </div>
              <div className="p-5 space-y-3">
                {FLOWS.map((flow, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="flex items-center gap-2 flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2"
                    >
                      <span className="text-[11px] text-foreground/70 font-medium">{flow.from}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: flow.color }} />
                    <div
                      className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2"
                      style={{ background: `${flow.color}12`, border: `1px solid ${flow.color}30` }}
                    >
                      <span className="text-[11px] font-semibold" style={{ color: flow.color }}>{flow.to}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="bg-[#1464D8]/8 border border-[#1464D8]/20 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-foreground/50">
                    Every event in one module immediately propagates to all connected modules.
                    <br />No manual reconciliation. No batch processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why this exists ─────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-4">Why this exists</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight">
                Most kitchens don't fail from lack of effort.
              </h2>
              <p className="text-xl font-black text-foreground/40 mt-2 leading-tight">
                They fail from delayed information.
              </p>
            </div>

            <div className="lg:col-span-3 space-y-5">
              <div className="bg-card border border-red-500/20 rounded-2xl p-6">
                <p className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  By the time most kitchens know what went wrong:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Service is already over",
                    "Stock records are wrong",
                    "Costs are already locked in",
                    "Waste has already happened",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                        <span className="text-red-500 text-[9px] font-black">×</span>
                      </span>
                      <span className="text-sm text-foreground/65">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-[#1464D8]/25 rounded-2xl p-6">
                <p className="text-sm font-bold text-[#1464D8] mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Kitchen Command removes the delay between:
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {["What happens", "What you know", "What you fix"].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="bg-[#1464D8]/10 border border-[#1464D8]/25 rounded-lg px-4 py-2">
                        <span className="text-sm font-bold text-[#1464D8]">{step}</span>
                      </div>
                      {i < 2 && <ArrowRight className="w-4 h-4 text-[#1464D8]/50 shrink-0" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-foreground/45 mt-4 leading-relaxed">
                  Each module closes the gap in one part of your operation. Together, they collapse the delay to near-zero.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Module capability summary ────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-3">System at a glance</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              What each module delivers
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Package,      color: "#1464D8", label: "Inventory",    delivers: "Live stock position, par alerts, usage tracking" },
              { icon: ClipboardList,color: "#d97706", label: "Prep",         delivers: "Task board by station, completion with attribution" },
              { icon: TrendingDown, color: "#059669", label: "Cost Engine",  delivers: "Live GP% per recipe, instant price-change propagation" },
              { icon: ShieldCheck,  color: "#0e7490", label: "Compliance",   delivers: "HACCP-ready logs, temp checks, cleaning records" },
              { icon: Trash2,       color: "#dc2626", label: "Waste",        delivers: "Point-of-waste logging, cost impact, pattern detection" },
              { icon: Activity,     color: "#7c3aed", label: "Intelligence", delivers: "Cross-module operational view, pressure score, focus queue" },
            ].map(({ icon: Icon, color, label, delivers }, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:border-border/80 transition-colors">
                <div
                  className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}35` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground/50 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-xs text-foreground/70 leading-snug">{delivers}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Intelligence live graph preview — the same system, dormant ─────── */}
      <section className="bg-[#080e18] border-y border-white/8">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-full px-3 py-1.5 text-xs font-bold text-[#a78bfa] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse" />
              Operational Intelligence — Flagship module
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3 leading-tight">
              The same graph. Zoomed into its consciousness.
            </h2>
            <p className="text-white/35 text-sm max-w-md mx-auto leading-relaxed">
              This is the structure of your kitchen system. Click below to enter Intelligence mode
              and watch it come alive — same nodes, same connections, live behaviour.
            </p>
          </div>

          <div
            className="transition-transform duration-700 ease-in-out"
            style={{ transform: awakening ? "scale(1.04)" : "scale(1)" }}
          >
            <KitchenSystemGraph mode={awakening ? "awakening" : "structure"} />
          </div>

          <div className="text-center mt-8 flex flex-col items-center gap-3">
            <button
              onClick={handleIntelligenceNav}
              disabled={awakening}
              className="inline-flex items-center gap-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all duration-200 group"
            >
              Enter Intelligence View
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-white/20 text-[11px] tracking-[2px] uppercase">
              Same system. Deeper view.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 border-t border-border relative overflow-hidden bg-muted/20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-[#1464D8]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-5">Ready to run on real-time intelligence</p>
          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-5">
            Build your kitchen on<br />real-time intelligence.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-lg mx-auto">
            Set up in minutes. All six modules active from day one.
            No spreadsheets. No clipboards. No delayed information.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <SignUpButton mode="modal">
              <button className="w-full sm:w-auto h-13 px-10 text-base font-bold rounded-xl bg-[#1464D8] text-white hover:bg-[#1255b8] flex items-center justify-center gap-2 transition-colors group">
                Get started free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto h-13 px-10 text-base font-semibold rounded-xl border border-border text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#1464D8]" />}
              View live demo kitchen
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
            <Link href="/" className="hover:text-foreground/70 transition-colors">Overview</Link>
            <span className="text-foreground/70 font-medium">Modules</span>
            <button onClick={handleIntelligenceNav} className="hover:text-foreground/70 transition-colors">Intelligence</button>
            <Link href="/apprentice" className="hover:text-foreground/70 transition-colors">Apprentice</Link>
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
