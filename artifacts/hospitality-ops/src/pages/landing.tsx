import { SignInButton, SignUpButton, useAuth } from "@clerk/react";
import {
  ArrowRight, ChefHat, ClipboardList, Package, TrendingDown,
  Clock, ScanLine, ShieldCheck, Thermometer, Users, BarChart3,
  CheckCircle2, Loader2, Zap, Activity, Database, Lock,
  FileDown, AlertTriangle, Circle, CheckCircle, Sun, Moon,
  Download, FlaskConical, GraduationCap, Smartphone, Monitor,
  BookOpen, Scissors,
} from "lucide-react";
import { Redirect, Link } from "wouter";
import { useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { AppIcon } from "@/components/AppIcon";

// ── Trust signals ─────────────────────────────────────────────────────────────
const TRUST = [
  { icon: FileDown,    label: "Data exports",        desc: "CSV exports of all operational data on demand" },
  { icon: ShieldCheck, label: "Audit history",        desc: "Full compliance log history for food safety audits" },
  { icon: Lock,        label: "Role permissions",     desc: "Owner, admin, and staff access levels per venue" },
  { icon: Database,    label: "Automatic backups",    desc: "All data stored securely with full retention history" },
  { icon: Users,       label: "Multi-venue support",  desc: "Manage multiple sites from one account" },
  { icon: Activity,    label: "Always-on reliability",desc: "Built for live service — fast, stable, always available" },
];

// ── Inline dashboard mockup ───────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none" aria-hidden>
      <div className="absolute inset-0 bg-[#1464D8]/20 blur-3xl rounded-3xl scale-90 translate-y-4 pointer-events-none" />
      <div className="relative bg-[#1e2d45] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#152030]">
          <div className="flex items-center gap-2">
            <AppIcon className="w-5 h-5" />
            <span className="text-white/90 text-xs font-bold tracking-tight">Kitchen Command</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-[10px] font-bold">Service Mode ON</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Today's Prep</span>
              <span className="text-[10px] text-white/40">4 / 7 done</span>
            </div>
            <div className="space-y-2">
              {[
                { done: true,  task: "Blanch broccolini × 3kg",    who: "Chef M", color: "bg-emerald-500" },
                { done: true,  task: "Portion salmon 120g × 24",    who: "Chef L", color: "bg-emerald-500" },
                { done: true,  task: "Reduce demi-glace 8L → 2L",   who: "Chef M", color: "bg-emerald-500" },
                { done: true,  task: "Whip cream cheese filling",    who: "Chef K", color: "bg-emerald-500" },
                { done: false, task: "Prep sauce base × 6L",         who: "—",     color: "bg-white/10" },
                { done: false, task: "Dress cold larder section",     who: "—",     color: "bg-white/10" },
                { done: false, task: "Check fridge temps & log",     who: "—",     color: "bg-amber-500" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center ${r.color}`}>
                    {r.done && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-[11px] flex-1 leading-tight ${r.done ? "line-through text-white/30" : "text-white/80"}`}>{r.task}</span>
                  {r.who !== "—" && <span className="text-[10px] text-white/40 shrink-0">{r.who}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <span className="text-white/50 text-[10px] font-black uppercase tracking-widest block mb-2.5">Stock Alerts</span>
              <div className="space-y-2">
                {[
                  { item: "Salmon filet", status: "LOW",      color: "text-orange-400", bar: "w-2/5" },
                  { item: "Rocket 500g",  status: "LOW",      color: "text-orange-400", bar: "w-1/3" },
                  { item: "Cream 2L",     status: "OK",        color: "text-emerald-400", bar: "w-4/5" },
                  { item: "Butter block", status: "CRITICAL",  color: "text-red-400",    bar: "w-1/6" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white/60 text-[10px] leading-none">{s.item}</span>
                      <span className={`text-[9px] font-bold ${s.color}`}>{s.status}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full">
                      <div className={`h-1 rounded-full ${s.color.replace("text-", "bg-")} ${s.bar}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <span className="text-white/50 text-[10px] font-black uppercase tracking-widest block mb-2.5">Waste Today</span>
              <div className="space-y-2">
                {[
                  { item: "Trim loss",       cost: "$12.40", color: "text-amber-400" },
                  { item: "Overproduction",  cost: "$34.20", color: "text-orange-400" },
                  { item: "Spoilage",        cost: "$8.10",  color: "text-red-400" },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-white/60 text-[10px]">{w.item}</span>
                    <span className={`text-[10px] font-bold ${w.color}`}>{w.cost}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                  <span className="text-white/40 text-[10px]">Total</span>
                  <span className="text-white/90 text-[11px] font-black">$54.70</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <span className="text-white/50 text-[10px] font-black uppercase tracking-widest block mb-2">Food Cost</span>
              <div className="text-2xl font-black text-emerald-400 leading-none mb-0.5">68.4%</div>
              <div className="text-[10px] text-white/40">GP this week</div>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
              <span className="text-white/50 text-[10px] font-black uppercase tracking-widest block mb-2">Orders Due</span>
              <div className="space-y-1.5">
                {[
                  { supplier: "Mainland Produce", time: "2h 14m", urgent: true },
                  { supplier: "Premium Seafood",  time: "4h 30m", urgent: false },
                ].map((o, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-white/60 text-[10px] truncate pr-1">{o.supplier}</span>
                    <span className={`text-[10px] font-bold shrink-0 ${o.urgent ? "text-red-400" : "text-white/50"}`}>{o.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Service mode mockup ───────────────────────────────────────────────────────
function ServiceMockup() {
  return (
    <div className="relative w-full max-w-[340px] mx-auto select-none" aria-hidden>
      <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-3xl pointer-events-none" />
      <div className="relative bg-[#1e2d45] border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-xs font-black tracking-wide">SERVICE MODE</span>
          </div>
          <span className="text-white/40 text-[10px]">Dinner — 18:00</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Quick Actions</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Log Temp",       icon: Thermometer,  color: "bg-sky-500/20 border-sky-500/30 text-sky-300" },
              { label: "Record Waste",   icon: TrendingDown, color: "bg-orange-500/20 border-orange-500/30 text-orange-300" },
              { label: "Mark Task Done", icon: CheckCircle2, color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" },
              { label: "Update Stock",   icon: Package,      color: "bg-violet-500/20 border-violet-500/30 text-violet-300" },
            ].map((a, i) => (
              <button key={i} className={`flex flex-col items-center justify-center gap-1.5 border rounded-xl p-3 ${a.color}`}>
                <a.icon className="w-4 h-4" />
                <span className="text-[10px] font-bold text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-white/8 pt-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Pending This Shift</div>
            {[
              { task: "Check walk-in fridge (2°C)", urgent: true },
              { task: "Dress cold larder section",  urgent: false },
              { task: "Log end-of-service waste",   urgent: false },
            ].map((t, i) => (
              <div key={i} className={`flex items-center gap-2 py-1.5 ${i < 2 ? "border-b border-white/5" : ""}`}>
                <Circle className={`w-3.5 h-3.5 shrink-0 ${t.urgent ? "text-amber-400" : "text-white/20"}`} />
                <span className="text-white/70 text-[11px]">{t.task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Apprentice Mode mockup ────────────────────────────────────────────────────
function ApprenticeMockup() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none" aria-hidden>
      <div className="absolute inset-0 bg-[#0d9488]/15 blur-3xl rounded-3xl scale-90 translate-y-4 pointer-events-none" />
      <div className="relative bg-[#1e2d45] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#152030]">
          <div className="flex items-center gap-2">
            <AppIcon className="w-5 h-5" />
            <span className="text-white/90 text-xs font-bold tracking-tight">Lamb Rump — Method</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0d9488]/20 border border-[#0d9488]/30 rounded-full px-2.5 py-1">
            <GraduationCap className="w-3 h-3 text-[#2dd4bf]" />
            <span className="text-[#2dd4bf] text-[10px] font-bold">Apprentice Mode</span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3 opacity-40">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center">1</span>
            <p className="text-[11px] text-white/50 line-through pt-0.5 leading-snug">Season lamb rumps, leave at room temperature for 30 min.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1464D8]/20 text-[#60a5fa] text-[11px] font-bold flex items-center justify-center">2</span>
            <div className="flex-1">
              <p className="text-[11px] text-white/90 font-medium leading-snug">Sear fat-side down in a hot oven-proof pan until golden.</p>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#0d9488]/50 text-[#2dd4bf] bg-[#0d9488]/15">
                  <FlaskConical className="w-2.5 h-2.5" />Why? Searing
                </span>
              </div>
              <div className="mt-2 bg-[#0d9488]/10 border border-[#0d9488]/25 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <FlaskConical className="w-3 h-3 text-[#2dd4bf]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#2dd4bf]">Searing</span>
                </div>
                <p className="text-[11px] font-bold text-white/85 leading-snug">High dry heat creates a flavour crust on the surface.</p>
                <p className="text-[10px] text-white/50 leading-relaxed">Amino acids and sugars react above 140°C — the Maillard reaction. That crust only forms on a dry surface; moisture steams the meat instead of browning it.</p>
                <p className="text-[10px] text-[#2dd4bf] italic font-medium pt-0.5">Pat the protein completely dry before it hits the pan.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 opacity-55">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/8 text-white/35 text-[11px] font-bold flex items-center justify-center">3</span>
            <div className="flex-1">
              <p className="text-[11px] text-white/55 leading-snug">Finish in oven at 180°C for 8 min. Rest the lamb for 4 minutes before slicing.</p>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-white/15 text-white/30 bg-white/5">
                  <FlaskConical className="w-2.5 h-2.5" />Why? Resting meat
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-white/4 border border-white/8 px-3 py-2.5 flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0" />
            <p className="text-[10px] text-white/50 leading-snug">
              <span className="text-white/70 font-semibold">Cost per Portion: $4.80</span>
              <span className="mx-1.5 text-white/20">·</span>
              <span className="text-[#2dd4bf]">GP% 73.4%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme, setTheme } = useTheme();
  const [demoLoading, setDemoLoading] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const { canInstall, method, install } = usePWAInstall();

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

      {/* ── Sticky nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppIcon className="w-10 h-10 shrink-0" />
            <span className="font-bold text-[15px] tracking-tight text-foreground">Kitchen Command</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-foreground/60">
            <Link href="/modules"      className="hover:text-foreground transition-colors">Modules</Link>
            <Link href="/intelligence" className="hover:text-foreground transition-colors">Intelligence</Link>
            <Link href="/apprentice"   className="inline-flex items-center gap-1.5 border border-[#0d9488]/50 bg-[#0d9488]/10 text-[#0d9488] dark:text-[#2dd4bf] rounded-full px-3.5 py-1 text-xs font-bold hover:bg-[#0d9488]/20 transition-colors">
              <ChefHat className="w-3 h-3" />
              Apprentice
            </Link>
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
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-[#1464D8]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#1464D8]/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#1464D8]/15 border border-[#1464D8]/30 rounded-full px-4 py-1.5 text-sm text-[#1464D8] font-semibold mb-8">
                <ChefHat className="w-3.5 h-3.5" />
                A kitchen operating system for modern hospitality
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-black tracking-tight leading-[1.05] text-foreground mb-6">
                Don't just run your kitchen.{" "}
                <span className="text-[#1464D8]">Command it.</span>
              </h1>
              <p className="text-base md:text-lg text-foreground/65 leading-relaxed mb-4 max-w-xl">
                Kitchen Command gives modern kitchens operational clarity, prep intelligence, compliance systems, yield visibility, and real-time execution support — built for the realities of service.
              </p>
              <p className="text-sm font-semibold text-foreground/45 mb-10 max-w-xl">
                Operational modules. Live intelligence. One system.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <SignUpButton mode="modal">
                  <button className="h-13 px-8 text-base font-bold rounded-xl bg-[#1464D8] text-white hover:bg-[#1255b8] flex items-center justify-center gap-2 transition-colors group">
                    Get started free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </SignUpButton>
                <button
                  onClick={handleTryDemo}
                  disabled={demoLoading}
                  className="h-13 px-8 text-base font-semibold rounded-xl border border-border text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#1464D8]" />}
                  Open Demo Kitchen
                </button>
              </div>

              {canInstall && (
                <div className="mb-8">
                  <button
                    onClick={async () => {
                      if (method === "native") {
                        await install();
                      } else {
                        setShowInstallHint(h => !h);
                      }
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-[#1464D8] border border-[#1464D8]/40 rounded-xl px-5 py-2.5 hover:bg-[#1464D8]/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Install Kitchen Command HQ
                  </button>
                  {showInstallHint && method === "ios" && (
                    <p className="mt-3 text-sm text-foreground/55 leading-relaxed max-w-xs">
                      In Safari, tap the Share button at the bottom, then choose "Add to Home Screen".
                    </p>
                  )}
                  {showInstallHint && method === "samsung" && (
                    <p className="mt-3 text-sm text-foreground/55 leading-relaxed max-w-xs">
                      In Samsung Internet, tap the menu (three lines) at the bottom, then "Add page to" → Home screen.
                    </p>
                  )}
                  {showInstallHint && method === "manual" && (
                    <p className="mt-3 text-sm text-foreground/55 leading-relaxed max-w-xs">
                      Open your browser menu and look for "Add to Home Screen" or "Install app".
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/40">
                {["No credit card needed", "Set up in minutes", "Free to start"].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border">
          {[
            { value: "Live GP%",    label: "Updates the moment prices change" },
            { value: "Real-time",   label: "Operational visibility during service" },
            { value: "Any device",  label: "Tablet, phone, or wall screen" },
            { value: "From day one",label: "No ramp-up. No training session." },
          ].map((s, i) => (
            <div key={i} className="text-center px-6 py-2">
              <p className="text-xl font-black text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── The problem: 45 minutes before service ──────────────────────────── */}
      <section id="problem" className="py-20 px-5 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-3">The daily reality</p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">
              45 minutes before dinner service.
            </h2>
            <p className="text-muted-foreground text-base">
              This is when every kitchen finds out where the gaps are.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-red-500/20 rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-black uppercase tracking-widest text-red-500">Without Kitchen Command</span>
              </div>
              <div className="space-y-3.5">
                {[
                  "No one knows exactly what prep is done and what isn't",
                  "Station 3 is overloaded — no one's seen it yet",
                  "Three dishes can't be plated — stock wasn't checked",
                  "Head chef is reacting instead of directing",
                  "Service starts late. Covers are already waiting.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-red-500 text-[10px] font-black leading-none">×</span>
                    </div>
                    <p className="text-sm text-foreground/70 leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-emerald-500/30 rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">With Kitchen Command</span>
              </div>
              <div className="space-y-3.5">
                {[
                  "Prep board shows exactly what's done, what's outstanding, and who owns it",
                  "Pressure score flags station 3 — head chef redistributes before service",
                  "Stock checked at mise en place — no surprises at the pass",
                  "Focus Queue shows the 5 tasks that actually matter right now",
                  "Service starts on time. Every team member knows where to be.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/70 leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-3">Operational architecture</p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">
              Built in three operational layers.<br className="hidden sm:block" />
              You control how deep you go.
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Layer 1 works from day one. Layers 2 and 3 unlock when you're ready.
              No forced complexity — just more intelligence as your kitchen data grows.
            </p>
          </div>

          <div className="space-y-4">
            {/* Layer 1 */}
            <div className="rounded-2xl border border-[#1464D8]/25 bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1464D8]/15 bg-[#1464D8]/5 flex flex-wrap items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1464D8] shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest text-[#1464D8]">Layer 1 — Operational Foundation</span>
                <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-0.5">Core — Always Included</span>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-3">Know what needs to happen.</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Live prep board, real-time stock levels, recipe costing, waste logging, compliance records, and invoice scanning — on any device, from day one.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { Icon: ClipboardList, text: "Prep Board — station assignment and completion tracking" },
                    { Icon: Package,       text: "Live inventory — par levels, stagnant stock, expiry risk" },
                    { Icon: ChefHat,       text: "Recipe costing with live GP% — updates when prices change" },
                    { Icon: ShieldCheck,   text: "HACCP-ready temperature logs and compliance records" },
                    { Icon: TrendingDown,  text: "Waste logging with cost impact and reason tagging" },
                    { Icon: ScanLine,      text: "Invoice scanning with auto inventory and cost updates" },
                  ] as const).map(({ Icon, text }, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40">
                      <Icon className="w-3.5 h-3.5 text-[#1464D8] shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground/75 leading-snug">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="rounded-2xl border border-amber-500/30 bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-500/20 bg-amber-500/5 flex flex-wrap items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Layer 2 — Service Pressure Intelligence</span>
                <span className="ml-auto text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-2.5 py-0.5">Opt-in</span>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-3">Know when service is slipping.</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    A live Pressure Score, station load balancing, and task feasibility warnings — surfaced before service breaks down, not after it already has.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { Icon: Activity,      text: "Live Pressure Score — 0 to 100 in real time" },
                    { Icon: Clock,         text: "Service countdown with PRE / IN / POST phases" },
                    { Icon: Users,         text: "Station workload — who's overloaded before it's too late" },
                    { Icon: AlertTriangle, text: "Task feasibility warnings when time is running out" },
                    { Icon: Zap,           text: "Reality check banner when service is at risk" },
                    { Icon: ClipboardList, text: "Service Priority Mode on the prep board" },
                  ] as const).map(({ Icon, text }, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40">
                      <Icon className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground/75 leading-snug">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Layer 3 */}
            <div className="rounded-2xl border border-[#1464D8]/20 bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1464D8]/15 bg-[#1464D8]/5 flex flex-wrap items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1464D8] shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest text-[#1464D8]">Layer 3 — Operational Intelligence</span>
                <span className="ml-auto text-xs font-bold text-[#1464D8] bg-[#1464D8]/10 border border-[#1464D8]/25 rounded-full px-2.5 py-0.5">Opt-in — requires Layer 2</span>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-3">Know what matters right now.</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Focus Queue, bottleneck detection, and staffing imbalance — not overriding chef decisions, but surfacing what the data already shows, in time to act on it.
                  </p>
                  <p className="text-xs text-muted-foreground/50 italic mt-3">Kitchen Command assists. The chef commands.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { Icon: Zap,           text: "Focus Queue — top priorities ranked in real time" },
                    { Icon: AlertTriangle, text: "Bottleneck detection — what's blocking service" },
                    { Icon: CheckCircle2,  text: "Drop-for-now list — what to safely defer under pressure" },
                    { Icon: Users,         text: "Staffing imbalance — who needs redistributing" },
                    { Icon: Activity,      text: "Chef Mode: Assist / Directive / Silent" },
                    { Icon: BarChart3,     text: "Operational risk patterns detected over time" },
                  ] as const).map(({ Icon, text }, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40">
                      <Icon className="w-3.5 h-3.5 text-[#1464D8] shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground/75 leading-snug">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Service Mode ─────────────────────────────────────────────────────── */}
      <section id="service-mode" className="py-24 px-5 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border border-border rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 rounded-full px-3 py-1.5 text-xs font-bold text-amber-500 mb-7 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Active during live service
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4 leading-snug">
                  Service Mode.<br />
                  <span className="text-amber-500">Minimal taps. Maximum speed.</span>
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md">
                  Open Service Mode on any kitchen tablet or phone. The whole team sees the prep list,
                  logs temperatures, records waste, and completes tasks — without touching the admin panel.
                  Built for high-speed service environments where every second counts.
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Staff name on every action",                desc: "Full accountability without the admin overhead" },
                    { label: "One-tap temperature logging",                desc: "HACCP-ready in seconds, not minutes" },
                    { label: "Quick waste at the point it happens",        desc: "Log it while it's fresh, not at end of shift" },
                    { label: "Auto-refreshes every 20 seconds",            desc: "Always current, always accurate" },
                    { label: "Handover notes across shifts",               desc: "Pin priorities for the incoming team, by shift" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground/85 text-sm font-semibold leading-tight">{item.label}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center p-10 md:p-14 bg-muted/20 border-t lg:border-t-0 lg:border-l border-border">
                <ServiceMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── For the Next Generation of Chefs ────────────────────────────────── */}
      <section id="apprentice" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-card border border-[#0d9488]/30 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d9488]/6 via-transparent to-[#1464D8]/4 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[350px] h-[250px] bg-[#0d9488]/8 rounded-full blur-[90px] pointer-events-none" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#0d9488] mb-5">Kitchen Command</p>
                <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-4">
                  For the Next<br />Generation of Chefs.
                </h2>
                <p className="text-[#2dd4bf]/90 text-sm font-semibold mb-3 leading-snug">
                  Helping apprentices sharpen their craft every shift.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-md">
                  A dedicated operational support layer for developing chefs — contextual prep guidance, butchery references, knife skills intelligence, and real-time cost metrics built into every moment of kitchen work.
                </p>
                <div className="space-y-2.5 mb-8">
                  {[
                    { icon: FlaskConical, label: "The why behind every technique", color: "#0d9488" },
                    { icon: Scissors,     label: "Butchery breakdowns and yield guides", color: "#d97706" },
                    { icon: BookOpen,     label: "Knife skills reference library", color: "#1464D8" },
                  ].map(({ icon: Icon, label, color }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-sm text-foreground/75 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/apprentice">
                  <button className="group inline-flex items-center gap-2 bg-[#0d9488]/15 border border-[#0d9488]/40 hover:bg-[#0d9488]/25 text-[#2dd4bf] rounded-xl px-6 py-3 text-sm font-bold transition-colors w-fit">
                    Explore Apprentice Mode
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
              <div className="flex items-center justify-center p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-[#0d9488]/15" style={{ background: "rgba(13,148,136,0.03)" }}>
                <ApprenticeMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust signals ────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-3">Built to be relied on</p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Operational reliability.<br className="hidden sm:block" /> Not optional extras.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TRUST.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <item.icon className="w-5 h-5 text-[#1464D8] mb-3" />
                <p className="text-foreground/90 text-sm font-bold mb-1">{item.label}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Get the App ──────────────────────────────────────────────────────── */}
      <section id="download" className="py-20 px-5 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-[#1464D8] mb-3">Available everywhere</p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Get Kitchen Command<br className="hidden sm:block" /> on every device
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Mobile app tile */}
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
              <div className="w-14 h-14 bg-[#1464D8]/10 border border-[#1464D8]/20 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-7 h-7 text-[#1464D8]" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#1464D8] mb-2">Mobile Speed App</p>
              <h3 className="text-2xl font-black text-foreground tracking-tight mb-3">Kitchen Command</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                Claim prep tasks, log waste, check temperatures, and run the floor — from your phone.
                Built for the pace of live service.
              </p>
              <div className="space-y-2.5">
                <a
                  href="#"
                  className="w-full flex items-center justify-center gap-3 bg-foreground text-background rounded-xl px-5 py-3.5 text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Download on the App Store
                </a>
                <a
                  href="#"
                  className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-xl px-5 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden>
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199a1.01 1.01 0 01.302.692 1.01 1.01 0 01-.302.692l-2.43 2.43L12.97 10.12l4.728-2.612zM5.864 3.658L16.8 9.99l-2.302 2.302-8.635-8.635z" />
                  </svg>
                  Get it on Google Play
                </a>
              </div>
            </div>

            {/* Web app tile */}
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
              <div className="w-14 h-14 bg-[#1464D8]/10 border border-[#1464D8]/20 rounded-2xl flex items-center justify-center mb-6">
                <Monitor className="w-7 h-7 text-[#1464D8]" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#1464D8] mb-2">Full Operations Platform</p>
              <h3 className="text-2xl font-black text-foreground tracking-tight mb-3">Kitchen Command HQ</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                The complete command centre. Inventory, recipes, suppliers, analytics, and waste tracking —
                with live costing and real-time visibility across every shift.
              </p>
              <div className="space-y-2.5">
                {canInstall ? (
                  <>
                    <button
                      onClick={async () => {
                        if (method === "native") {
                          await install();
                        } else {
                          setShowInstallHint(h => !h);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#1464D8] text-white rounded-xl px-5 py-3.5 text-sm font-bold hover:bg-[#1255b8] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Install Kitchen Command HQ
                    </button>
                    {showInstallHint && method === "ios" && (
                      <p className="text-sm text-foreground/55 leading-relaxed pt-1">
                        In Safari, tap the Share button then choose "Add to Home Screen".
                      </p>
                    )}
                    {showInstallHint && method === "samsung" && (
                      <p className="text-sm text-foreground/55 leading-relaxed pt-1">
                        In Samsung Internet, tap the menu then "Add page to" → Home screen.
                      </p>
                    )}
                    {showInstallHint && method === "manual" && (
                      <p className="text-sm text-foreground/55 leading-relaxed pt-1">
                        Open your browser menu and look for "Add to Home Screen" or "Install app".
                      </p>
                    )}
                  </>
                ) : (
                  <SignUpButton mode="modal">
                    <button className="w-full flex items-center justify-center gap-2 bg-[#1464D8] text-white rounded-xl px-5 py-3.5 text-sm font-bold hover:bg-[#1255b8] transition-colors">
                      Get started free
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </SignUpButton>
                )}
                <SignInButton mode="modal">
                  <button className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                    Sign in to your account
                  </button>
                </SignInButton>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#1464D8]/12 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <AppIcon className="w-12 h-12 mx-auto mb-7" />
          <blockquote className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-snug mb-5">
            "Don't just run your kitchen.
            <br />
            <span className="text-[#1464D8]">Command it."</span>
          </blockquote>
          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-lg mx-auto">
            Set up in minutes. No spreadsheets. No clipboards.
            Live operational intelligence — built around how your team actually works.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
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
              Open Demo Kitchen
            </button>
          </div>
          <p className="text-foreground/30 text-xs mb-2">No account needed for the demo. Real kitchen data. No changes saved.</p>
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

      {/* ── Supporting the Future of Hospitality ────────────────────────────── */}
      <section className="py-16 px-5 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2dd4bf] mb-4">Supporting the Future of Hospitality</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight mb-4">
                Operational repetition<br className="hidden sm:block" /> creates mastery.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Kitchen Command Apprentice Mode is designed to support apprentices alongside real-world kitchen experience and existing training providers — reinforcing skills, confidence, and operational understanding every shift.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: Scissors,
                  label: "Butchery Guides",
                  desc: "Primal breakdowns, yield percentages, and trim recovery — on demand.",
                  color: "#d97706",
                },
                {
                  icon: BookOpen,
                  label: "Knife Skills",
                  desc: "Every standard cut, dimensions, and real kitchen applications.",
                  color: "#1464D8",
                },
                {
                  icon: Zap,
                  label: "Shift Learning",
                  desc: "Contextual knowledge delivered at the moment it matters most.",
                  color: "#0d9488",
                },
              ].map(({ icon: Icon, label, desc, color }, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground mb-1">{label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <Link href="/modules"      className="hover:text-foreground/70 transition-colors">Modules</Link>
            <Link href="/intelligence" className="hover:text-foreground/70 transition-colors">Intelligence</Link>
            <Link href="/apprentice"   className="hover:text-foreground/70 transition-colors">Apprentice</Link>
            <p className="text-foreground/25">&copy; {new Date().getFullYear()} Kitchen Command</p>
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
