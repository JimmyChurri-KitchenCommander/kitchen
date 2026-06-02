import { SignInButton, SignUpButton, useAuth } from "@clerk/react";
import {
  ArrowRight, GraduationCap, Sun, Moon, Loader2, CheckCircle2,
  Zap, BookOpen, FlaskConical, Scissors, Layers, ChefHat,
  MessageSquare, TrendingUp, Shield, Users,
} from "lucide-react";
import { Redirect, Link } from "wouter";
import { useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { AppIcon } from "@/components/AppIcon";

const TEAL = "#0d9488";
const TEAL_BRIGHT = "#2dd4bf";

// ── Contextual prep mockup ─────────────────────────────────────────────────
function PrepContextMockup() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none" aria-hidden>
      <div
        className="absolute inset-0 rounded-3xl scale-90 translate-y-4 blur-3xl pointer-events-none"
        style={{ background: `${TEAL}20` }}
      />
      <div className="relative bg-[#1e2d45] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#152030]">
          <div className="flex items-center gap-2">
            <AppIcon className="w-5 h-5" />
            <span className="text-white/90 text-xs font-bold tracking-tight">Lamb Rump — Method</span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
            style={{ background: `${TEAL}20`, borderColor: `${TEAL}40` }}
          >
            <GraduationCap className="w-3 h-3" style={{ color: TEAL_BRIGHT }} />
            <span className="text-[10px] font-bold" style={{ color: TEAL_BRIGHT }}>Apprentice Mode</span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3 opacity-40">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center">1</span>
            <p className="text-[11px] text-white/50 line-through pt-0.5 leading-snug">Season lamb rumps, leave at room temperature for 30 min.</p>
          </div>
          <div className="flex gap-3">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center"
              style={{ background: "#1464D820", color: "#60a5fa" }}
            >2</span>
            <div className="flex-1">
              <p className="text-[11px] text-white/90 font-medium leading-snug">Sear fat-side down in a hot oven-proof pan until golden.</p>
              <div className="mt-1.5">
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                  style={{ borderColor: `${TEAL}50`, color: TEAL_BRIGHT, background: `${TEAL}15` }}
                >
                  <FlaskConical className="w-2.5 h-2.5" />Why? Searing
                </span>
              </div>
              <div
                className="mt-2 rounded-xl p-3 space-y-1.5 border"
                style={{ background: `${TEAL}10`, borderColor: `${TEAL}25` }}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <FlaskConical className="w-3 h-3" style={{ color: TEAL_BRIGHT }} />
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: TEAL_BRIGHT }}>Searing</span>
                </div>
                <p className="text-[11px] font-bold text-white/85 leading-snug">High dry heat creates a flavour crust on the surface.</p>
                <p className="text-[10px] text-white/50 leading-relaxed">Amino acids and sugars react above 140°C — the Maillard reaction. That crust only forms on a dry surface; moisture steams instead of browning.</p>
                <p className="text-[10px] italic font-medium pt-0.5" style={{ color: TEAL_BRIGHT }}>Pat the protein completely dry before it hits the pan.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 opacity-55">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/8 text-white/35 text-[11px] font-bold flex items-center justify-center">3</span>
            <div className="flex-1">
              <p className="text-[11px] text-white/55 leading-snug">Finish in oven at 180°C for 8 min. Rest for 4 minutes before slicing.</p>
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
            <GraduationCap className="w-3.5 h-3.5 shrink-0" style={{ color: TEAL_BRIGHT }} />
            <p className="text-[10px] text-white/50 leading-snug">
              <span className="text-white/70 font-semibold">Cost per Portion: $4.80</span>
              <span className="mx-1.5 text-white/20">·</span>
              <span style={{ color: TEAL_BRIGHT }}>GP% 73.4%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Butchery mockup ────────────────────────────────────────────────────────
function ButcheryMockup() {
  return (
    <div className="relative w-full max-w-[400px] mx-auto select-none" aria-hidden>
      <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-3xl scale-90 translate-y-4 pointer-events-none" />
      <div className="relative bg-[#1e2d45] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 border-b border-white/8 bg-[#152030] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span className="text-white/90 text-xs font-bold tracking-tight">Butchery — Lamb Shoulder</span>
          </div>
          <span
            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ color: TEAL_BRIGHT, background: `${TEAL}20` }}
          >Reference</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white/5 border border-white/8 rounded-xl p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Primal Breakdown</p>
            <div className="space-y-2">
              {[
                { cut: "Blade",          yield: "68%", use: "Slow braise / shoulder roll", color: "text-emerald-400" },
                { cut: "Neck",           yield: "72%", use: "Mince / ragu",                color: "text-emerald-400" },
                { cut: "Foreshank",      yield: "61%", use: "Braised shank",               color: "text-amber-400" },
                { cut: "Trim / Sinew",   yield: "—",   use: "Stock reduction",             color: "text-white/30" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/70 w-20 shrink-0">{r.cut}</span>
                  <span className={`text-[10px] font-bold w-8 shrink-0 ${r.color}`}>{r.yield}</span>
                  <span className="text-[10px] text-white/35 truncate">{r.use}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-xl p-3 border"
            style={{ background: `${TEAL}10`, borderColor: `${TEAL}25` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3 h-3" style={{ color: TEAL_BRIGHT }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: TEAL_BRIGHT }}>Trim Recovery</span>
            </div>
            <p className="text-[11px] text-white/75 leading-snug">Sinew and neck trim → reduce for jus or mince blend. Avoid discarding blade fat — renders for basting.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-2.5 text-center">
              <p className="text-[18px] font-black text-amber-400">3.2kg</p>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mt-0.5">Bone-in weight</p>
            </div>
            <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-2.5 text-center">
              <p className="text-[18px] font-black text-emerald-400">68%</p>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mt-0.5">Usable yield</p>
            </div>
            <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-2.5 text-center">
              <p className="text-[18px] font-black text-white/70">2.2kg</p>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mt-0.5">Net portioned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Knife skills mockup ────────────────────────────────────────────────────
function KnifeSkillsMockup() {
  return (
    <div className="relative w-full max-w-[380px] mx-auto select-none" aria-hidden>
      <div className="absolute inset-0 bg-[#1464D8]/12 blur-3xl rounded-3xl scale-90 translate-y-4 pointer-events-none" />
      <div className="relative bg-[#1e2d45] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 border-b border-white/8 bg-[#152030] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#60a5fa]" />
            <span className="text-white/90 text-xs font-bold tracking-tight">Knife Skills Library</span>
          </div>
          <span className="text-[9px] text-white/35 uppercase tracking-wider">6 techniques</span>
        </div>
        <div className="p-4 space-y-2.5">
          {[
            {
              name: "Brunoise",
              size: "2mm × 2mm × 2mm",
              desc: "Fine dice. Used for consommé garnish, refined sauces.",
              color: "#1464D8",
              difficulty: "Advanced",
            },
            {
              name: "Julienne",
              size: "3mm × 3mm × 5cm",
              desc: "Matchstick cut. Salads, stir-fry, garnish work.",
              color: "#059669",
              difficulty: "Intermediate",
            },
            {
              name: "Chiffonade",
              size: "Ribbon — 1–3mm wide",
              desc: "Stack, roll, slice. Herbs, leafy greens, basil.",
              color: "#d97706",
              difficulty: "Foundational",
            },
            {
              name: "Batonnet",
              size: "6mm × 6mm × 6cm",
              desc: "Thick matchstick. Ratatouille, crudité, root veg.",
              color: "#7c3aed",
              difficulty: "Foundational",
            },
          ].map((cut, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl p-2.5 border border-white/6 bg-white/4"
            >
              <div
                className="w-1.5 rounded-full shrink-0 mt-1 self-stretch"
                style={{ background: cut.color, minHeight: "28px" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold text-white/90">{cut.name}</span>
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">{cut.difficulty}</span>
                </div>
                <p className="text-[10px] text-white/45 mb-0.5">{cut.size}</p>
                <p className="text-[10px] text-white/55 leading-snug">{cut.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ApprenticePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme, setTheme } = useTheme();
  const [demoLoading, setDemoLoading] = useState(false);

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
            <Link href="/"            className="hover:text-foreground transition-colors">Overview</Link>
            <Link href="/modules"     className="hover:text-foreground transition-colors">Modules</Link>
            <Link href="/intelligence" className="hover:text-foreground transition-colors">Intelligence</Link>
            <span className="text-foreground font-semibold">Apprentice</span>
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
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: `${TEAL}18` }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-5 pt-20 pb-16 md:pt-24 md:pb-20 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 border"
            style={{ background: `${TEAL}15`, borderColor: `${TEAL}30`, color: TEAL }}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Built for Real Kitchens. Built for Every Shift.
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.04] text-foreground mb-6">
            Sharpen your craft
            <br className="hidden sm:block" />
            <span style={{ color: TEAL }}> every shift.</span>
          </h1>
          <p className="text-base md:text-lg text-foreground/60 leading-relaxed max-w-2xl mx-auto mb-4">
            Apprentice Mode is a shift companion for developing chefs — operational support, prep guidance, butchery references, and knife skills intelligence, delivered at the exact moment you need them.
          </p>
          <p
            className="text-sm font-semibold mb-10 max-w-xl mx-auto"
            style={{ color: `${TEAL}99` }}
          >
            Operational repetition creates mastery. Built by chefs, for the next generation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SignUpButton mode="modal">
              <button
                className="w-full sm:w-auto h-13 px-10 text-base font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-colors group"
                style={{ background: TEAL }}
              >
                Get started free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto h-13 px-10 text-base font-semibold rounded-xl border border-border text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" style={{ color: TEAL }} />}
              Open Demo Kitchen
            </button>
          </div>
        </div>
      </section>

      {/* ── Positioning pillars ──────────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-muted/20 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                label: "A shift companion",
                desc: "Operational support during real prep and live service — contextual guidance at the exact moment it's needed, on the station you're working.",
                color: TEAL,
              },
              {
                icon: TrendingUp,
                label: "Confidence through context",
                desc: "Less guessing. Less asking twice. Apprentices move faster, make fewer mistakes, and build independence without needing to pause the kitchen.",
                color: "#1464D8",
              },
              {
                icon: Shield,
                label: "Learn through service",
                desc: "Every shift is a repetition. Apprentice Mode reinforces technique, cost awareness, and operational standards through the work itself — not after it.",
                color: "#d97706",
              },
            ].map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}
                >
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <h3 className="font-black text-foreground text-base mb-2">{p.label}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature: Contextual Prep Guidance ───────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold mb-6 border"
                style={{ background: `${TEAL}15`, borderColor: `${TEAL}30`, color: TEAL }}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Contextual Prep Guidance
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-5">
                The kitchen explains the why<br className="hidden sm:block" /> while the work gets done.
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
                Every recipe step has a "Why?" button. Tap it and Kitchen Command explains the science in plain chef language — the Maillard reaction, why proteins rest, why blanching locks colour. No textbooks. No interrupting the pass.
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "Technique science on every step",
                    desc: "Contextual explanations at the exact moment the apprentice is executing, not reviewed later.",
                  },
                  {
                    label: "Chef language, not textbook language",
                    desc: "Written for someone standing at a stove, not sitting in a lecture hall.",
                  },
                  {
                    label: "Invisible to the rest of the kitchen",
                    desc: "Senior chefs see no difference. Apprentice Mode is per-user — it changes nothing for anyone else.",
                  },
                  {
                    label: "Cost metrics explained in context",
                    desc: "Food cost %, GP%, yield, portion cost — what they mean and why they matter, on every dish.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                      style={{ background: `${TEAL}15`, borderColor: `${TEAL}30` }}
                    >
                      <CheckCircle2 className="w-3 h-3" style={{ color: TEAL }} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">{item.label}</span>
                      <span className="text-sm text-muted-foreground"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <PrepContextMockup />
          </div>
        </div>
      </section>

      {/* ── Feature: Butchery Support ────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <ButcheryMockup />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 rounded-full px-3 py-1.5 text-xs font-bold text-amber-500 mb-6">
                <Scissors className="w-3.5 h-3.5" />
                Butchery Support
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-5">
                Primal knowledge on demand.<br className="hidden sm:block" /> No waiting for a senior chef.
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
                Butchery is one of the most intimidating skills in a kitchen. Kitchen Command gives apprentices instant access to primal and sub-primal breakdowns, yield guides, and trim recovery suggestions — so they can work with confidence before they've built years of experience.
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "Primal and sub-primal breakdowns",
                    desc: "Lamb, beef, pork, and poultry — where cuts come from and what they're best used for.",
                  },
                  {
                    label: "Yield guidance per cut",
                    desc: "Expected usable yield percentages so apprentices can portion with accuracy, not guesswork.",
                  },
                  {
                    label: "Trim recovery suggestions",
                    desc: "How to maximise value from every part of the animal — sinew, fat, bone, and trim.",
                  },
                  {
                    label: "Portioning assistance",
                    desc: "Linked to recipe portion targets so the apprentice knows exactly what weight to hit.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-amber-500/15 border border-amber-500/30">
                      <CheckCircle2 className="w-3 h-3 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">{item.label}</span>
                      <span className="text-sm text-muted-foreground"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: Knife Skills Library ────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#1464D8]/15 border border-[#1464D8]/30 rounded-full px-3 py-1.5 text-xs font-bold text-[#1464D8] mb-6">
                <BookOpen className="w-3.5 h-3.5" />
                Knife Skills Library
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight mb-5">
                Every standard cut.<br className="hidden sm:block" /> Dimensions. Application. Context.
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
                The knife skills library gives apprentices a quick reference for every standard cut — size, technique, application, and difficulty level. It's not a video tutorial. It's the reference they reach for in the middle of prep when no one's free to demonstrate.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { cut: "Brunoise",   size: "2mm fine dice",      use: "Consommé, refined sauces" },
                  { cut: "Julienne",   size: "3mm matchstick",     use: "Stir-fry, salads, garnish" },
                  { cut: "Chiffonade", size: "Ribbon, 1–3mm",      use: "Herbs, basil, leafy greens" },
                  { cut: "Batonnet",   size: "6mm thick stick",    use: "Crudité, ratatouille" },
                  { cut: "Paysanne",   size: "12mm thin slices",   use: "Rustic soups, braises" },
                  { cut: "Macédoine",  size: "5mm medium dice",    use: "Salads, garnish plates" },
                ].map((c, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-3">
                    <p className="text-sm font-bold text-foreground mb-1">{c.cut}</p>
                    <p className="text-xs text-[#1464D8] font-semibold mb-0.5">{c.size}</p>
                    <p className="text-xs text-muted-foreground">{c.use}</p>
                  </div>
                ))}
              </div>
            </div>
            <KnifeSkillsMockup />
          </div>
        </div>
      </section>

      {/* ── Confidence through consistency ───────────────────────────────────── */}
      <section className="py-24 px-5 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-black uppercase tracking-widest mb-3"
              style={{ color: TEAL }}
            >
              Confidence through consistency
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">
              Less guessing. Less asking twice.<br className="hidden sm:block" /> More getting it right.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto">
              The biggest barrier for apprentices isn't skill — it's confidence. Kitchen Command reduces ambiguity so apprentices can act independently, maintain standards, and develop faster inside real kitchen environments.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Shield,
                label: "Reduces ambiguity",
                desc: "Clear prep instructions with contextual support remove the guesswork from every task.",
                color: TEAL,
              },
              {
                icon: CheckCircle2,
                label: "Reinforces standards",
                desc: "Consistent references reinforce correct technique every time — not just when a senior is watching.",
                color: "#1464D8",
              },
              {
                icon: Users,
                label: "Supports independence",
                desc: "Apprentices work with confidence rather than pausing to find someone to ask.",
                color: "#d97706",
              },
              {
                icon: MessageSquare,
                label: "Bridges communication",
                desc: "Senior chefs set the standards in the system. Apprentices access them without interrupting service.",
                color: "#7c3aed",
              },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="font-black text-foreground text-sm mb-2">{item.label}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A future chef development layer ──────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-card border border-border rounded-3xl p-10 md:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d9488]/5 via-transparent to-[#1464D8]/5 pointer-events-none" />
            <div className="relative z-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mx-auto border"
                style={{ background: `${TEAL}15`, borderColor: `${TEAL}30` }}
              >
                <ChefHat className="w-7 h-7" style={{ color: TEAL }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: TEAL }}>Apprentice Mode</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-4">
                A professional kitchen operating system<br className="hidden md:block" /> with a chef development layer built in.
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl mx-auto">
                Apprentice Mode isn't a product on its own — it's a layer inside the same system senior chefs use every service. Apprentices work in the same operational environment, see the same recipes, and execute the same prep — just with the science and context switched on behind every step.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  {
                    label: "Station-ready from day one",
                    desc: "Prep instructions, technique context, and cost metrics available without interrupting senior chefs.",
                    color: TEAL,
                  },
                  {
                    label: "Invisible to the rest of the team",
                    desc: "Per-user toggle. Senior chefs see no difference. The kitchen operates at full pace regardless.",
                    color: "#1464D8",
                  },
                  {
                    label: "Reinforces every repetition",
                    desc: "Technique science, butchery guides, and knife skills are available shift after shift — not just in training.",
                    color: "#d97706",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-muted/30 border border-border rounded-2xl p-5">
                    <div className="w-1.5 h-6 rounded-full mb-3" style={{ background: item.color }} />
                    <p className="text-sm font-black text-foreground mb-2">{item.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-5 border-t border-border relative overflow-hidden bg-muted/20">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: `${TEAL}15` }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <AppIcon className="w-12 h-12 mx-auto mb-7" />
          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-snug mb-5">
            Every shift is a lesson.<br />
            <span style={{ color: TEAL }}>Make every one count.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-lg mx-auto">
            Operational support that builds real confidence. Technique context that reinforces every repetition. A shift companion built by chefs, for the next generation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <SignUpButton mode="modal">
              <button
                className="w-full sm:w-auto h-13 px-10 text-base font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-colors group"
                style={{ background: TEAL }}
              >
                Get started free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto h-13 px-10 text-base font-semibold rounded-xl border border-border text-foreground/80 hover:bg-muted hover:text-foreground flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" style={{ color: TEAL }} />}
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
            <Link href="/intelligence" className="hover:text-foreground/70 transition-colors">Intelligence</Link>
            <span className="text-foreground/70 font-medium">Apprentice</span>
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
