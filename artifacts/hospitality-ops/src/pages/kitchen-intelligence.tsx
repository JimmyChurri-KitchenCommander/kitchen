import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ChevronRight, Search, Share2, BookMarked,
  Users, Zap, ChefHat, RefreshCw, Eye, Palette, Database, Layers,
  Beef, Fish, Salad, Sandwich, Croissant, CookingPot,
  FlaskConical, ShieldAlert, Snowflake, UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

// ─── Module definitions ──────────────────────────────────────────────────────

type ModuleStatus = "live" | "coming-soon";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  stats: string;
  accent: string;           // Tailwind color token
  hex: string;              // Raw hex for SVG fills
  icon: LucideIcon;         // Lucide icon (sidebar-style)
  status: ModuleStatus;
  href?: string;
}

const MODULES: Module[] = [
  {
    id: "butchery",
    title: "Butchery",
    subtitle: "Board",
    description: "Primal cut intelligence for terrestrial proteins — subprimal breakdown, fabrication pathways, chef decisions, and doneness guidance.",
    stats: "4 Species · 40+ Primals",
    accent: "text-red-400",
    hex: "#f87171",
    icon: Beef,
    status: "live",
    href: "/kitchen-reference",
  },
  {
    id: "seafood",
    title: "Seafood",
    subtitle: "Fabrication",
    description: "Fish and shellfish breakdowns, yields and fabrication guides.",
    stats: "18 Species · 120+ Cuts",
    accent: "text-blue-400",
    hex: "#60a5fa",
    icon: Fish,
    status: "coming-soon",
  },
  {
    id: "produce",
    title: "Produce",
    subtitle: "Cuts",
    description: "Visual cut guides, applications and consistency standards.",
    stats: "50+ Ingredients",
    accent: "text-green-400",
    hex: "#4ade80",
    icon: Salad,
    status: "coming-soon",
  },
  {
    id: "charcuterie",
    title: "Charcuterie",
    subtitle: "",
    description: "Curing, salumi, pates and terrines with process intelligence.",
    stats: "25+ Guides",
    accent: "text-amber-400",
    hex: "#fbbf24",
    icon: Sandwich,
    status: "coming-soon",
  },
  {
    id: "pastry",
    title: "Pastry",
    subtitle: "Techniques",
    description: "Techniques, doughs, bakes and pastry science.",
    stats: "40+ Techniques",
    accent: "text-yellow-300",
    hex: "#fde047",
    icon: Croissant,
    status: "coming-soon",
  },
  {
    id: "sauce",
    title: "Sauce",
    subtitle: "Systems",
    description: "Mother sauces, derivatives, ratios and service applications.",
    stats: "10 Mothers · 60+ Sauces",
    accent: "text-orange-400",
    hex: "#fb923c",
    icon: CookingPot,
    status: "coming-soon",
  },
  {
    id: "fermentation",
    title: "Fermentation",
    subtitle: "",
    description: "Fermentation guides, tracking, safety and flavour development.",
    stats: "30+ Projects",
    accent: "text-purple-400",
    hex: "#c084fc",
    icon: FlaskConical,
    status: "coming-soon",
  },
  {
    id: "allergen",
    title: "Allergen",
    subtitle: "Intelligence",
    description: "Allergen data, cross contact, substitutes and compliance.",
    stats: "14 Allergens",
    accent: "text-orange-300",
    hex: "#fdba74",
    icon: ShieldAlert,
    status: "coming-soon",
  },
  {
    id: "preservation",
    title: "Preservation",
    subtitle: "Methods",
    description: "Preservation techniques, yields, safety and shelf life.",
    stats: "20+ Methods",
    accent: "text-teal-400",
    hex: "#2dd4bf",
    icon: Snowflake,
    status: "coming-soon",
  },
  {
    id: "plating",
    title: "Plating",
    subtitle: "Styles",
    description: "Plating patterns, ratios, balance and visual composition.",
    stats: "25+ Styles",
    accent: "text-indigo-400",
    hex: "#818cf8",
    icon: UtensilsCrossed,
    status: "coming-soon",
  },
];

// ─── Module tile ─────────────────────────────────────────────────────────────

function ModuleTile({ mod }: { mod: Module }) {
  const Icon = mod.icon;
  const isLive = mod.status === "live";

  const inner = (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200",
        isLive
          ? "border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
          : "border-white/6 opacity-70"
      )}
      style={{ borderTopColor: `${mod.hex}30` }}
    >
      {/* Accent top bar */}
      <div className="h-0.5 w-full" style={{ background: mod.hex }} />

      {/* Icon — matches sidebar style: colored square with Lucide line icon */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-start">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center border"
          style={{
            background: `${mod.hex}14`,
            borderColor: `${mod.hex}30`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: mod.hex }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 flex flex-col gap-1.5 flex-1">
        <div>
          <p className={cn("text-sm font-bold leading-tight uppercase tracking-wide", mod.accent)}>
            {mod.title}
          </p>
          {mod.subtitle && (
            <p className={cn("text-sm font-bold leading-tight uppercase tracking-wide", mod.accent)}>
              {mod.subtitle}
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
          {mod.description}
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            {mod.stats}
          </p>
          {isLive ? (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: `${mod.hex}20`, color: mod.hex, border: `1px solid ${mod.hex}40` }}
            >
              Live
            </span>
          ) : (
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
              Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isLive && mod.href) {
    return <Link href={mod.href}>{inner}</Link>;
  }
  return inner;
}

// ─── Mini preview cards ───────────────────────────────────────────────────────

function PreviewCard({ title, accent, hex, children }: {
  title: string;
  accent: string;
  hex: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-shrink-0 w-52 rounded-xl border border-white/8 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6">
        <p className={cn("text-[11px] font-bold uppercase tracking-widest", accent)}>{title}</p>
        <div className="w-1 h-1 rounded-full opacity-60" style={{ background: hex }} />
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function PreviewRow({ label, value, hex }: { label: string; value: string; hex: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/4 last:border-0">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[10px] font-semibold" style={{ color: hex }}>{value}</span>
    </div>
  );
}

function YieldBar({ label, pct, hex }: { label: string; pct: number; hex: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between">
        <span className="text-[9px] text-muted-foreground">{label}</span>
        <span className="text-[9px] font-semibold" style={{ color: hex }}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/6">
        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: hex }} />
      </div>
    </div>
  );
}

function BeefPreview() {
  const hex = "#f87171";
  const rows: [string, string][] = [
    ["Chuck Roll", "Shoulder"],
    ["Ribeye", "Rib"],
    ["Short Loin", "Loin"],
    ["Brisket", "Breast"],
  ];
  return (
    <PreviewCard title="Butchery Board" accent="text-red-400" hex={hex}>
      <div className="space-y-1 mb-2.5">
        {rows.map(([cut, primal]) => (
          <div key={cut} className="flex items-center justify-between py-0.5 border-b border-white/4 last:border-0">
            <span className="text-[10px] text-foreground/80">{cut}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded leading-none"
              style={{ background: `${hex}15`, color: `${hex}cc` }}>
              {primal}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 pt-1">
        {["Beef", "Pork", "Lamb", "Poultry"].map(s => (
          <span key={s} className="text-[8px] px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.40)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {s}
          </span>
        ))}
      </div>
    </PreviewCard>
  );
}

function SalmonPreview() {
  const hex = "#60a5fa";
  return (
    <PreviewCard title="Salmon" accent="text-blue-400" hex={hex}>
      <div className="space-y-1.5 mb-2">
        {[["Loins", "65–70%"], ["Belly", "8–10%"], ["Collar", "4–5%"], ["Cheeks", "1–2%"]].map(([z, y]) => (
          <div key={z} className="flex items-center justify-between">
            <span className="text-[10px] text-foreground/80">{z}</span>
            <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/30" />
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-white/6 space-y-1.5">
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Yield Guide</p>
        <YieldBar label="Fillet Yield" pct={67} hex={hex} />
        <YieldBar label="Trim Loss" pct={12} hex={hex} />
        <YieldBar label="Pin Bone Yield" pct={6} hex={hex} />
      </div>
    </PreviewCard>
  );
}

function OnionPreview() {
  const hex = "#4ade80";
  const cuts = [
    { name: "Brunoise", dim: "3mm" },
    { name: "Dice", dim: "8mm" },
    { name: "Julienne", dim: "5×1mm" },
    { name: "Rough Chop", dim: "20mm" },
  ];
  return (
    <PreviewCard title="Onion" accent="text-green-400" hex={hex}>
      <div className="grid grid-cols-2 gap-1.5">
        {cuts.map(c => (
          <div key={c.name} className="flex flex-col gap-0.5 bg-white/4 rounded-lg p-1.5">
            <div className="w-4 h-4 rounded" style={{ background: `${hex}30`, border: `1px solid ${hex}60` }} />
            <p className="text-[9px] font-semibold text-foreground/80">{c.name}</p>
            <p className="text-[8px] text-muted-foreground">{c.dim}</p>
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

function CoppaPreview() {
  const hex = "#fbbf24";
  return (
    <PreviewCard title="Coppa" accent="text-amber-400" hex={hex}>
      <div className="space-y-0">
        <PreviewRow label="Stage" value="Drying" hex={hex} />
        <PreviewRow label="Weight Loss" value="28%" hex={hex} />
        <PreviewRow label="Time" value="35 Days" hex={hex} />
        <PreviewRow label="Temp" value="13–14°C" hex={hex} />
        <PreviewRow label="Humidity" value="75–80%" hex={hex} />
      </div>
      <div className="mt-2 pt-2 border-t border-white/6">
        <div className="flex justify-between mb-1">
          <span className="text-[9px] text-muted-foreground">Progress</span>
          <span className="text-[9px] font-semibold" style={{ color: hex }}>Day 24/35</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/6">
          <div className="h-1.5 rounded-full" style={{ width: "69%", background: hex }} />
        </div>
      </div>
    </PreviewCard>
  );
}

function CroissantPreview() {
  const hex = "#fde047";
  const steps = ["Lamination", "Shaping", "Proofing", "Baking"];
  return (
    <PreviewCard title="Croissant" accent="text-yellow-300" hex={hex}>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={s} className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg",
            i === 0 ? "bg-white/8" : "bg-transparent"
          )}>
            <span className="text-[9px] font-bold w-3" style={{ color: `${hex}80` }}>{i + 1}</span>
            <span className={cn("text-[10px]", i === 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>{s}</span>
            {i === 0 && (
              <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                style={{ background: `${hex}20`, color: hex }}>
                Active
              </span>
            )}
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

function BechamelPreview() {
  const hex = "#fb923c";
  const derivatives = ["Mornay", "Nantua", "Soubise", "Supreme"];
  return (
    <PreviewCard title="Bechamel" accent="text-orange-400" hex={hex}>
      <div className="flex flex-col items-center gap-1.5">
        <div className="text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
          style={{ background: `${hex}20`, color: hex, border: `1px solid ${hex}40` }}>
          Mother
        </div>
        <div className="w-px h-2 bg-white/15" />
        <div className="grid grid-cols-2 gap-1 w-full">
          {derivatives.map(d => (
            <div key={d}
              className="text-[9px] text-center py-1.5 rounded-lg text-foreground/70"
              style={{ background: `${hex}10`, border: `1px solid ${hex}20` }}>
              {d}
            </div>
          ))}
        </div>
      </div>
    </PreviewCard>
  );
}

function KimchiPreview() {
  const hex = "#c084fc";
  return (
    <PreviewCard title="Kimchi" accent="text-purple-400" hex={hex}>
      <div className="space-y-0 mb-2">
        <PreviewRow label="Phase" value="Active" hex={hex} />
        <PreviewRow label="Day" value="5 / 14" hex={hex} />
        <PreviewRow label="Temp" value="18–20°C" hex={hex} />
        <PreviewRow label="pH" value="4.1" hex={hex} />
      </div>
      <div className="pt-2 border-t border-white/6">
        <div className="flex justify-between mb-1">
          <span className="text-[9px] text-muted-foreground">Fermentation</span>
          <span className="text-[9px]" style={{ color: hex }}>Day 5/14</span>
        </div>
        <div className="flex gap-px">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 h-3 rounded-sm"
              style={{ background: i < 5 ? hex : `${hex}20` }} />
          ))}
        </div>
      </div>
    </PreviewCard>
  );
}

function CaesarPreview() {
  const hex = "#fdba74";
  const allergens = [
    { name: "Egg", present: true },
    { name: "Fish (Anchovy)", present: true },
    { name: "Dairy", present: true },
  ];
  return (
    <PreviewCard title="Caesar Dressing" accent="text-orange-300" hex={hex}>
      <div className="space-y-1 mb-2">
        {allergens.map(a => (
          <div key={a.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: hex }} />
            <span className="text-[9px] text-foreground/80">{a.name}</span>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-white/6">
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1">Substitutions</p>
        {["Vegan Caesar", "Fish-free Anchovy", "Dairy-free"].map(s => (
          <div key={s} className="text-[9px] text-muted-foreground py-0.5">— {s}</div>
        ))}
      </div>
    </PreviewCard>
  );
}

function PickledOnionPreview() {
  const hex = "#2dd4bf";
  return (
    <PreviewCard title="Pickled Onions" accent="text-teal-400" hex={hex}>
      <div className="space-y-0 mb-2">
        <PreviewRow label="Acidity" value="2.5%" hex={hex} />
        <PreviewRow label="Ratio" value="1 : 1.5" hex={hex} />
        <PreviewRow label="Shelf Life" value="4–6 Weeks" hex={hex} />
      </div>
      <div className="pt-2 border-t border-white/6 space-y-1.5">
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Acidity Range</p>
        <div className="h-2 rounded-full bg-white/6 relative overflow-hidden">
          <div className="absolute h-full rounded-full" style={{ left: "20%", width: "35%", background: hex }} />
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground">
          <span>0%</span>
          <span style={{ color: hex }}>2.5% Safe</span>
          <span>5%</span>
        </div>
      </div>
    </PreviewCard>
  );
}

function PlatingPreview() {
  const hex = "#818cf8";
  const elements = [
    { name: "Protein Anchor", color: "#f87171" },
    { name: "Sauce", color: "#fb923c" },
    { name: "Garnish", color: "#4ade80" },
    { name: "Acid / Brightness", color: "#fde047" },
    { name: "Texture", color: "#60a5fa" },
    { name: "Negative Space", color: "#94a3b8" },
  ];
  return (
    <PreviewCard title="Modern Fine Dining" accent="text-indigo-400" hex={hex}>
      <div className="space-y-1">
        {elements.map(e => (
          <div key={e.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-[9px] text-foreground/70">{e.name}</span>
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

const PREVIEW_CARDS = [
  BeefPreview,
  SalmonPreview,
  OnionPreview,
  CoppaPreview,
  CroissantPreview,
  BechamelPreview,
  KimchiPreview,
  CaesarPreview,
  PickledOnionPreview,
  PlatingPreview,
];

// ─── Design system foundations ────────────────────────────────────────────────

const FOUNDATIONS = [
  {
    icon: Eye,
    title: "Visual Language",
    desc: "Dark, premium and chef-centric across every module.",
  },
  {
    icon: Layers,
    title: "Consistent Structure",
    desc: "Anatomy, breakdown and intelligence in every module.",
  },
  {
    icon: Palette,
    title: "Smart Colour System",
    desc: "Category colours for immediate recognition.",
  },
  {
    icon: Database,
    title: "Data + Intelligence Layer",
    desc: "Operational intelligence embedded in every module.",
  },
  {
    icon: RefreshCw,
    title: "Interactive & Scalable",
    desc: "SVG maps, overlays and responsive components.",
  },
];

const UNIFIED = [
  { icon: Search, title: "Search Anything", desc: "Find any cut, ingredient, technique or process." },
  { icon: Share2, title: "Cross Module Links", desc: "Connected intelligence across disciplines." },
  { icon: BookMarked, title: "Save & Reference", desc: "Build your own chef library." },
  { icon: Users, title: "Share Standards", desc: "Consistent across your brigade." },
];

const BUILT_FOR = [
  { icon: Zap, title: "Operational First", desc: "Designed for real kitchen workflows." },
  { icon: ChefHat, title: "Chef Built", desc: "By chefs, for chefs." },
  { icon: RefreshCw, title: "Evolving Intelligence", desc: "Continuously updated with real world data." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KitchenIntelligencePage() {
  return (
    <div className="space-y-10 pb-12">

      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">
              Kitchen Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium italic">
              One visual language. Every kitchen discipline.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            Live
          </span>
          <span className="text-[10px] text-muted-foreground/60">Butchery module available now. More disciplines coming.</span>
        </div>
      </div>

      {/* Module grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Kitchen Intelligence Modules
          </h2>
          <Link href="/kitchen-reference">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
              Open Butchery
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {MODULES.map(mod => (
            <ModuleTile key={mod.id} mod={mod} />
          ))}
        </div>
      </section>

      {/* Preview examples */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Module Preview Examples
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {PREVIEW_CARDS.map((Preview, i) => (
            <Preview key={i} />
          ))}
        </div>
      </section>

      {/* Design system foundations */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Design System Foundations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Visual foundations */}
          <div className="rounded-xl border border-white/8 bg-card p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Visual Foundations
            </p>
            {FOUNDATIONS.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">{f.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Unified UX */}
          <div className="rounded-xl border border-white/8 bg-card p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Unified User Experience
            </p>
            {UNIFIED.map(u => (
              <div key={u.title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <u.icon className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">{u.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Built for kitchens */}
          <div className="rounded-xl border border-white/8 bg-card p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Built for Kitchens
            </p>
            {BUILT_FOR.map(b => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <b.icon className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{b.desc}</p>
                </div>
              </div>
            ))}

            {/* Universal structure reminder */}
            <div className="pt-2 border-t border-white/6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
                Universal Structure
              </p>
              {[
                "Visual Reference",
                "Anatomy & Breakdown",
                "Operational Intelligence",
                "Yield & Consistency",
                "Recovery & Waste Reduction",
                "Chef Notes",
                "Service Impact",
              ].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {i < arr.length - 1 && <div className="w-px h-3 bg-white/8" />}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
