import { useState, useMemo } from "react";
import { Redirect } from "wouter";
import { useApprenticeStore } from "@/stores/apprenticeModeStore";
import { TECHNIQUES, type TechniqueEntry } from "@/components/TechniqueExplainer";
import { GLOSSARY } from "@/components/GlossaryTooltip";
import {
  FlaskConical, BookOpen, Search, ChevronDown, ChevronUp,
  GraduationCap, FlameKindling, Waves, Scissors, CookingPot, Leaf,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Category config ────────────────────────────────────────────────────────────

type CategoryId = "all" | "heat" | "sauce" | "prep" | "pastry" | "preservation";

const CATEGORIES: { id: CategoryId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all",          label: "All",              icon: GraduationCap },
  { id: "heat",         label: "Heat Methods",     icon: FlameKindling },
  { id: "sauce",        label: "Sauces & Liquids", icon: Waves },
  { id: "prep",         label: "Prep & Finishing", icon: Scissors },
  { id: "pastry",       label: "Pastry & Bread",   icon: CookingPot },
  { id: "preservation", label: "Preservation",     icon: Leaf },
];

const TECHNIQUE_CATEGORY: Record<string, CategoryId> = {
  // Heat Methods
  searing: "heat", braising: "heat", poaching: "heat", steaming: "heat",
  confit: "heat", roasting: "heat", deep_frying: "heat", stir_frying: "heat",
  sous_vide: "heat", en_papillote: "heat", sauteing: "heat", grilling: "heat",
  // Sauces & Liquids
  reducing: "sauce", deglazing: "sauce", emulsifying: "sauce", caramelising: "sauce",
  glazing_food: "sauce", roux: "sauce", flambeing: "sauce", mounting_butter: "sauce",
  setting_gelatin: "sauce", liaison: "sauce", clarifying_butter: "sauce",
  // Prep & Finishing
  resting: "prep", rendering: "prep", blanching: "prep", sweating: "prep",
  basting: "prep", scoring: "prep", blooming: "prep", trussing: "prep",
  blowtorching: "prep", velveting: "prep", crumbing: "prep",
  // Pastry & Bread
  tempering: "pastry", folding: "pastry", gluten_rest: "pastry", proving: "pastry",
  laminating: "pastry", whipping: "pastry", kneading: "pastry",
  // Preservation
  marinating: "preservation", smoking: "preservation", salting_early: "preservation",
  pickling: "preservation", curing: "preservation",
};

const CATEGORY_STYLE: Record<CategoryId, { pill: string; icon: string; bar: string }> = {
  all:          { pill: "bg-primary/10 text-primary border-primary/25",                                         icon: "text-primary",        bar: "bg-primary" },
  heat:         { pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",           icon: "text-orange-500",     bar: "bg-orange-500" },
  sauce:        { pill: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",                       icon: "text-sky-500",        bar: "bg-sky-500" },
  prep:         { pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",       icon: "text-emerald-500",    bar: "bg-emerald-500" },
  pastry:       { pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",               icon: "text-amber-500",      bar: "bg-amber-500" },
  preservation: { pill: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",          icon: "text-purple-500",     bar: "bg-purple-500" },
};

// ── TechniqueCard ──────────────────────────────────────────────────────────────

function TechniqueCard({ technique }: { technique: TechniqueEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const cat: CategoryId = TECHNIQUE_CATEGORY[technique.id] ?? "prep";
  const style = CATEGORY_STYLE[cat];
  const catLabel = CATEGORIES.find(c => c.id === cat)?.label ?? cat;

  return (
    <div className={cn(
      "bg-card border rounded-2xl overflow-hidden transition-all duration-150",
      expanded ? "border-border/70 shadow-sm" : "border-border hover:border-border/70"
    )}>
      <button
        type="button"
        onClick={() => { setExpanded(v => !v); if (!expanded) setTipOpen(false); }}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
          `bg-${cat === "all" ? "primary" : cat}-500/10 border-${cat === "all" ? "primary" : cat}-500/20`
        )}>
          <FlaskConical className={cn("w-4 h-4", style.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug">{technique.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-snug">{technique.what}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            style.pill
          )}>
            {catLabel}
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          <div className={cn("h-0.5 w-full", style.bar)} />
          <div className="px-5 py-5 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1.5">What it is</p>
              <p className="text-sm font-semibold text-foreground leading-relaxed">{technique.what}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1.5">What's happening</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{technique.why}</p>
            </div>
            {technique.tip && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setTipOpen(v => !v); }}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Chef tip {tipOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {tipOpen && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed italic bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
                    {technique.tip}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── GlossaryCard ───────────────────────────────────────────────────────────────

function GlossaryCard({ term, entry }: { term: string; entry: { short: string; detail?: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 transition-colors",
        entry.detail ? "hover:border-border/70 cursor-pointer" : "border-border"
      )}
      onClick={() => entry.detail && setExpanded(v => !v)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-bold text-primary leading-snug">{term}</p>
        {entry.detail && (
          <span className="text-muted-foreground shrink-0 mt-0.5">
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>
      <p className="text-xs text-foreground/75 leading-relaxed">{entry.short}</p>
      {expanded && entry.detail && (
        <p className="mt-2.5 pt-2.5 border-t border-border text-xs text-muted-foreground leading-relaxed">
          {entry.detail}
        </p>
      )}
    </div>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold", color)}>
      <span className="font-black">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ApprenticeLibraryPage() {
  const { apprenticeMode } = useApprenticeStore();
  const [tab, setTab] = useState<"techniques" | "glossary">("techniques");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");

  if (!apprenticeMode) return <Redirect to="/dashboard" />;

  const techniqueCount = TECHNIQUES.length;
  const glossaryCount = Object.keys(GLOSSARY).length;

  const filteredTechniques = useMemo(() => {
    const q = search.toLowerCase();
    return TECHNIQUES.filter(t => {
      const matchesSearch = !q ||
        t.label.toLowerCase().includes(q) ||
        t.what.toLowerCase().includes(q) ||
        t.why.toLowerCase().includes(q);
      const matchesCat = category === "all" || (TECHNIQUE_CATEGORY[t.id] ?? "prep") === category;
      return matchesSearch && matchesCat;
    });
  }, [search, category]);

  const filteredGlossary = useMemo(() => {
    const q = search.toLowerCase();
    return Object.entries(GLOSSARY)
      .filter(([term, entry]) =>
        !q || term.toLowerCase().includes(q) || entry.short.toLowerCase().includes(q)
      )
      .sort(([a], [b]) => a.localeCompare(b));
  }, [search]);

  const catCounts = useMemo(() =>
    Object.fromEntries(
      CATEGORIES.filter(c => c.id !== "all").map(c => [
        c.id,
        TECHNIQUES.filter(t => TECHNIQUE_CATEGORY[t.id] === c.id).length,
      ])
    ), []);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0d9488]/15 border border-[#0d9488]/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-[#0d9488]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground leading-tight">Kitchen Reference Library</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Techniques and terminology — the how and why behind every method</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <StatPill label="techniques" value={techniqueCount} color="bg-primary/8 text-primary border-primary/20" />
          <StatPill label="terms" value={glossaryCount} color="bg-[#0d9488]/10 text-[#0d9488] border-[#0d9488]/25" />
        </div>
      </div>

      {/* ── Tab switcher + search ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-xl border border-border overflow-hidden shrink-0 self-start">
          {(["techniques", "glossary"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setSearch(""); setCategory("all"); }}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t === "techniques"
                ? `Techniques (${techniqueCount})`
                : `Glossary (${glossaryCount})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={tab === "techniques" ? "Search techniques — searing, braising, sous vide..." : "Search terms — GP%, nappe, liaison..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Category filter (techniques only) ── */}
      {tab === "techniques" && (
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const count = cat.id === "all" ? techniqueCount : (catCounts[cat.id] ?? 0);
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
                <span className={cn("opacity-55", active && "opacity-70")}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Techniques ── */}
      {tab === "techniques" && (
        <>
          {filteredTechniques.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No techniques match "{search}".
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTechniques.map(t => (
                <TechniqueCard key={t.id} technique={t} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Glossary ── */}
      {tab === "glossary" && (
        <>
          {filteredGlossary.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No terms match "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGlossary.map(([term, entry]) => (
                <GlossaryCard key={term} term={term} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/45 pt-4 border-t border-border">
        <BookOpen className="w-3.5 h-3.5 shrink-0" />
        <span>
          This library is only visible while Apprentice Mode is on. Disable it in Settings
          at any time — your role and permissions are unaffected.
        </span>
      </div>
    </div>
  );
}
