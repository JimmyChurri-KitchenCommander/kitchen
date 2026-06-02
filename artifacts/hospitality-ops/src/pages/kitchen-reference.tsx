import { useState, useMemo } from "react";
import { Search, X, Scale, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUTCHERY_REFERENCE, type CutEntry, type LabourIntensity } from "@/data/butchery-reference";
import { KNIFE_SKILLS, type KnifeSkillCategory, type KnifeSkill } from "@/data/knife-skills";
import { ANIMAL_DIAGRAMS } from "@/data/animal-diagrams";
import { AnimalSilhouette } from "@/components/AnimalSilhouette";
import { AnimalViewport, AnimalInfoPanel } from "@/components/animal-intelligence";

// Feature flag: new SVG-native fabrication engine (SVG clipPath, no PNG/CSS mask)
const USE_NEW_ANIMAL_ENGINE = true;

type Tab = "butchery" | "knife-skills" | "yield";

function getDiagramId(categoryId: string): string {
  if (categoryId === "fish-round") return "fish";
  return categoryId;
}

const ANIMAL_TILES = [
  { id: "beef",       label: "Beef",    accentColor: "#e8763a" },
  { id: "pork",       label: "Pork",    accentColor: "#e8c03a" },
  { id: "lamb",       label: "Lamb",    accentColor: "#c4d43a" },
  { id: "chicken",    label: "Poultry", accentColor: "#7ad43a" },
  { id: "fish-round", label: "Fish",    accentColor: "#3ab4d4" },
  { id: "seafood",    label: "Seafood", accentColor: "#9a4ad4" },
];

// ─── Knife illustrations — engineering blueprints with dimension callouts ────
//
// Each diagram uses a 120×80 viewBox. Cuts with depth (cubes, sticks, discs,
// flat tiles) show a top view + a side view inset, both with dimension arrows.
// Single-view cuts (chiffonade, mince, supreme, concasse, rough-chop, tourné,
// oblique) get one full-canvas view with size callouts.

const SK  = "#3b82f6";                  // blue-500 — main shape stroke
const SKL = "#60a5fa";                  // blue-400 — accents
const SF  = "rgba(59,130,246,0.10)";    // light fill
const SFE = "rgba(59,130,246,0.22)";    // emphasised fill (lead shape)
const SG  = "rgba(96,165,250,0.06)";    // grid lines
const LBL = "rgba(147,197,253,0.9)";    // dimension label colour
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function GridBg() {
  const lines: React.ReactNode[] = [];
  for (let x = 10; x < 120; x += 10) {
    lines.push(<line key={`vx${x}`} x1={x} y1={0} x2={x} y2={80} stroke={SG} strokeWidth={0.25} />);
  }
  for (let y = 10; y < 80; y += 10) {
    lines.push(<line key={`hy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={SG} strokeWidth={0.25} />);
  }
  return <g>{lines}</g>;
}

function DimH({ x1, x2, y, label, above = true }: { x1: number; x2: number; y: number; label: string; above?: boolean }) {
  const ty = above ? y - 2 : y + 5;
  return (
    <g>
      <line x1={x1} y1={y - 1.6} x2={x1} y2={y + 1.6} stroke={SKL} strokeWidth={0.5} />
      <line x1={x2} y1={y - 1.6} x2={x2} y2={y + 1.6} stroke={SKL} strokeWidth={0.5} />
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={SKL} strokeWidth={0.4} strokeDasharray="0.6,0.6" />
      <text x={(x1 + x2) / 2} y={ty} fontSize="3.6" textAnchor="middle" fill={LBL} fontFamily={MONO}>{label}</text>
    </g>
  );
}

function DimV({ y1, y2, x, label, right = true }: { y1: number; y2: number; x: number; label: string; right?: boolean }) {
  const tx = right ? x + 2 : x - 2;
  const anchor = right ? "start" : "end";
  return (
    <g>
      <line x1={x - 1.6} y1={y1} x2={x + 1.6} y2={y1} stroke={SKL} strokeWidth={0.5} />
      <line x1={x - 1.6} y1={y2} x2={x + 1.6} y2={y2} stroke={SKL} strokeWidth={0.5} />
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={SKL} strokeWidth={0.4} strokeDasharray="0.6,0.6" />
      <text x={tx} y={(y1 + y2) / 2 + 1.3} fontSize="3.6" textAnchor={anchor} fill={LBL} fontFamily={MONO}>{label}</text>
    </g>
  );
}

function ViewTag({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} fontSize="3.2" fill="rgba(96,165,250,0.55)" fontFamily={MONO} letterSpacing="0.4">
      {text}
    </text>
  );
}

function Bp({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <GridBg />
      {children}
    </svg>
  );
}

// Repeated grid of cubes (top view) + single cube (side view) for cube cuts.
function CubeBlueprint({ cols, rows, edge, gap, label }: { cols: number; rows: number; edge: number; gap: number; label: string }) {
  const startX = 12;
  const startY = 18;
  const cells: React.ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const lead = c === 0 && r === 0;
      cells.push(
        <rect key={`${c}-${r}`}
          x={startX + c * (edge + gap)} y={startY + r * (edge + gap)}
          width={edge} height={edge}
          fill={lead ? SFE : SF} stroke={SK} strokeWidth={lead ? 0.7 : 0.5} opacity={lead ? 1 : 0.85} />
      );
    }
  }
  // Side view: one cube on the right
  const sideEdge = Math.min(edge * 1.4, 22);
  const sideX = 92;
  const sideY = 40 - sideEdge / 2;
  return (
    <Bp>
      {cells}
      <DimH x1={startX} x2={startX + edge} y={startY - 4} label={label} />
      <ViewTag x={12} y={74} text="TOP" />
      <rect x={sideX} y={sideY} width={sideEdge} height={sideEdge} fill={SFE} stroke={SK} strokeWidth={0.7} />
      <DimV y1={sideY} y2={sideY + sideEdge} x={sideX + sideEdge + 2} label={label} />
      <ViewTag x={sideX} y={74} text="SIDE" />
    </Bp>
  );
}

// Sticks/batons: parallel vertical strips (top) + square cross-section (right).
function StickBlueprint({ widthLabel, lengthLabel, stripW, gap, count }: {
  widthLabel: string; lengthLabel: string; stripW: number; gap: number; count: number;
}) {
  const startX = 14;
  const y1 = 14;
  const y2 = 64;
  const strips: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const lead = i === 0;
    strips.push(
      <rect key={i}
        x={startX + i * (stripW + gap)} y={y1}
        width={stripW} height={y2 - y1}
        fill={lead ? SFE : SF} stroke={SK} strokeWidth={lead ? 0.7 : 0.5} opacity={lead ? 1 : 0.85} />
    );
  }
  // Cross-section square on right
  const csEdge = Math.max(stripW * 1.4, 8);
  const csX = 96;
  const csY = 40 - csEdge / 2;
  return (
    <Bp>
      {strips}
      <DimH x1={startX} x2={startX + stripW} y={y1 - 4} label={widthLabel} />
      <DimV y1={y1} y2={y2} x={startX - 3} label={lengthLabel} right={false} />
      <ViewTag x={14} y={74} text="TOP" />
      <rect x={csX} y={csY} width={csEdge} height={csEdge} fill={SFE} stroke={SK} strokeWidth={0.7} />
      <DimH x1={csX} x2={csX + csEdge} y={csY - 3} label={widthLabel} />
      <ViewTag x={csX - 2} y={74} text="CROSS-SECTION" />
    </Bp>
  );
}

function KnifeIllustration({ skillId }: { skillId: string }) {
  switch (skillId) {
    // ─── Cubes ───────────────────────────────────────────────────────────────
    case "fine-brunoise":
      return <CubeBlueprint cols={6} rows={3} edge={8}  gap={1.5} label="1.5mm" />;
    case "brunoise":
      return <CubeBlueprint cols={4} rows={3} edge={11} gap={1.5} label="3mm"   />;
    case "macedoine":
      return <CubeBlueprint cols={3} rows={2} edge={16} gap={2}   label="6mm"   />;
    case "large-dice":
      return <CubeBlueprint cols={2} rows={2} edge={22} gap={3}   label="20mm"  />;

    // ─── Sticks ──────────────────────────────────────────────────────────────
    case "allumette":
      return <StickBlueprint widthLabel="2mm" lengthLabel="5–6cm" stripW={3}  gap={2.5} count={9} />;
    case "julienne":
      return <StickBlueprint widthLabel="3mm" lengthLabel="5–6cm" stripW={5}  gap={3}   count={7} />;
    case "batonnet":
      return <StickBlueprint widthLabel="6mm" lengthLabel="5–6cm" stripW={10} gap={4}   count={4} />;

    // ─── Flat tile (paysanne) ────────────────────────────────────────────────
    case "paysanne": {
      const cells: React.ReactNode[] = [];
      for (let c = 0; c < 3; c++) {
        for (let r = 0; r < 3; r++) {
          const lead = c === 0 && r === 0;
          cells.push(
            <rect key={`${c}-${r}`}
              x={12 + c * 18} y={16 + r * 14} width={15} height={11}
              fill={lead ? SFE : SF} stroke={SK} strokeWidth={lead ? 0.7 : 0.5} opacity={lead ? 1 : 0.85} />
          );
        }
      }
      return (
        <Bp>
          {cells}
          <DimH x1={12} x2={27} y={12} label="12mm" />
          <ViewTag x={12} y={74} text="TOP" />
          {/* Side view: thin flat rectangle showing 3mm thickness */}
          <rect x={86} y={37} width={26} height={4} fill={SFE} stroke={SK} strokeWidth={0.7} />
          <DimH x1={86} x2={112} y={33} label="12mm" />
          <DimV y1={37} y2={41} x={114} label="3mm" />
          <ViewTag x={86} y={74} text="SIDE" />
        </Bp>
      );
    }

    // ─── Rondelle (discs) ────────────────────────────────────────────────────
    case "rondelle":
      return (
        <Bp>
          {/* Top: row of discs (circles) */}
          {[20, 38, 56, 74].map((cx, i) => (
            <circle key={cx} cx={cx} cy={28} r={8}
              fill={i === 0 ? SFE : SF} stroke={SK} strokeWidth={i === 0 ? 0.7 : 0.5} opacity={i === 0 ? 1 : 0.85} />
          ))}
          <DimH x1={12} x2={28} y={16} label="Ø" />
          <ViewTag x={14} y={44} text="TOP" />
          {/* Side: stacked thin discs (rectangles) showing thickness range */}
          <rect x={92} y={48} width={20} height={3}  fill={SFE} stroke={SK} strokeWidth={0.6} />
          <rect x={92} y={54} width={20} height={6}  fill={SF}  stroke={SK} strokeWidth={0.6} />
          <rect x={92} y={63} width={20} height={10} fill={SF}  stroke={SK} strokeWidth={0.6} />
          <DimV y1={48} y2={73} x={89} label="3–10mm" right={false} />
          <ViewTag x={92} y={46} text="SIDE" />
        </Bp>
      );

    // ─── Oblique / roll cut ──────────────────────────────────────────────────
    case "oblique":
      return (
        <Bp>
          {/* Cylinder outline with diagonal cut lines */}
          <rect x={10} y={28} width={100} height={24} rx={12} fill={SF} stroke={SK} strokeWidth={0.6} opacity={0.5} />
          {/* Diagonal cut faces — angled ellipses cutting through cylinder */}
          {[0, 1, 2, 3].map(i => {
            const cx = 22 + i * 24;
            const angle = i % 2 === 0 ? -24 : 24;
            return (
              <g key={i}>
                <ellipse cx={cx} cy={40} rx={5} ry={13} fill={SFE} stroke={SK} strokeWidth={0.7}
                  transform={`rotate(${angle} ${cx} 40)`} />
              </g>
            );
          })}
          <DimH x1={22} x2={46} y={20} label="3–4cm" />
          <ViewTag x={10} y={74} text="CYLINDER — ALTERNATING ANGLED CUTS" />
        </Bp>
      );

    // ─── Tourné (7-sided barrel) ─────────────────────────────────────────────
    case "tourné":
      return (
        <Bp>
          {/* Side view: football/barrel outline */}
          <path d="M 32,18 C 50,18 64,28 64,40 C 64,52 50,62 32,62 C 14,62 4,52 4,40 C 4,28 14,18 32,18 Z"
            fill={SFE} stroke={SK} strokeWidth={0.9} />
          {/* Subtle facet ridge lines (7 sides — show 5 visible) */}
          {[-14, -7, 0, 7, 14].map((off, i) => (
            <path key={i}
              d={`M ${10 + Math.abs(off) * 0.3},${40 + off} Q 34,${40 + off * 1.05} ${58 - Math.abs(off) * 0.3},${40 + off}`}
              stroke={SKL} strokeWidth={0.4} fill="none" opacity={0.4} />
          ))}
          <DimH x1={4} x2={64} y={14} label="4–5cm" />
          <ViewTag x={4} y={74} text="SIDE" />
          {/* End-on view: heptagon (7 sides) */}
          <g transform="translate(94 40)">
            {(() => {
              const pts: string[] = [];
              for (let i = 0; i < 7; i++) {
                const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
                pts.push(`${(Math.cos(a) * 14).toFixed(1)},${(Math.sin(a) * 14).toFixed(1)}`);
              }
              return <polygon points={pts.join(" ")} fill={SFE} stroke={SK} strokeWidth={0.8} />;
            })()}
          </g>
          <text x={94} y={20} fontSize="3.2" textAnchor="middle" fill={LBL} fontFamily={MONO}>7 SIDES</text>
          <ViewTag x={80} y={74} text="END-ON" />
        </Bp>
      );

    // ─── Chiffonade (rolled ribbons) ─────────────────────────────────────────
    case "chiffonade":
      return (
        <Bp>
          {/* Stacked thin ribbons (side view of cut chiffonade) */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <path key={i}
              d={`M 8,${18 + i * 8} Q 30,${14 + i * 8} 60,${20 + i * 8} Q 90,${26 + i * 8} 112,${18 + i * 8}`}
              stroke={i === 0 ? SK : SKL} strokeWidth={i === 0 ? 2.8 : 2}
              fill="none" opacity={i === 0 ? 1 : 0.7 - i * 0.08} />
          ))}
          <DimV y1={16} y2={22} x={4} label="1–2mm" right={false} />
          <ViewTag x={8} y={74} text="RIBBON SHREDS" />
        </Bp>
      );

    // ─── Concasse (rough tomato dice) ────────────────────────────────────────
    case "concasse":
      return (
        <Bp>
          {[
            "M 8,18 L 28,14 L 32,32 L 12,36 Z",
            "M 36,16 L 58,18 L 56,34 L 34,32 Z",
            "M 62,14 L 84,20 L 80,36 L 60,32 Z",
            "M 88,16 L 110,18 L 108,34 L 86,32 Z",
            "M 10,42 L 30,40 L 34,60 L 12,62 Z",
            "M 38,40 L 60,38 L 64,58 L 40,60 Z",
            "M 66,40 L 88,42 L 86,60 L 64,58 Z",
            "M 92,40 L 112,42 L 110,62 L 90,60 Z",
          ].map((d, i) => (
            <path key={i} d={d} fill={i === 0 ? SFE : SF} stroke={SK} strokeWidth={i === 0 ? 0.7 : 0.5} opacity={i === 0 ? 1 : 0.85} />
          ))}
          <DimH x1={8} x2={28} y={10} label="5–10mm" />
          <ViewTag x={8} y={74} text="PEELED · SEEDED · DICED" />
        </Bp>
      );

    // ─── Suprême (citrus segments) ───────────────────────────────────────────
    case "supreme": {
      const cx = 60, cy = 40, r = 26;
      const segs = 8;
      const wedges: React.ReactNode[] = [];
      for (let i = 0; i < segs; i++) {
        const a1 = (i * (360 / segs) - 90) * Math.PI / 180;
        const a2 = ((i + 1) * (360 / segs) - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(a1);
        const y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2);
        const y2 = cy + r * Math.sin(a2);
        wedges.push(
          <path key={i}
            d={`M ${cx},${cy} L ${x1.toFixed(1)},${y1.toFixed(1)} A ${r},${r} 0 0,1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`}
            fill={i === 0 ? SFE : SF} stroke={SK} strokeWidth={i === 0 ? 0.7 : 0.5} opacity={i === 0 ? 1 : 0.85} />
        );
      }
      return (
        <Bp>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={SKL} strokeWidth={0.5} opacity={0.35} />
          {wedges}
          <line x1={cx} y1={cy - r - 1} x2={cx} y2={cy - r - 4} stroke={SKL} strokeWidth={0.5} />
          <line x1={cx + r + 1} y1={cy} x2={cx + r + 4} y2={cy} stroke={SKL} strokeWidth={0.5} />
          <text x={cx + r + 5} y={cy + 1.3} fontSize="3.4" textAnchor="start" fill={LBL} fontFamily={MONO}>radius</text>
          <ViewTag x={8} y={74} text="MEMBRANE-FREE WEDGES" />
        </Bp>
      );
    }

    // ─── Rough chop ──────────────────────────────────────────────────────────
    case "rough-chop":
      return (
        <Bp>
          {[
            "M 8,18 L 38,14 L 42,38 L 12,42 Z",
            "M 46,16 L 78,20 L 74,40 L 44,38 Z",
            "M 82,14 L 112,18 L 110,40 L 78,40 Z",
            "M 10,46 L 42,44 L 46,68 L 14,70 Z",
            "M 50,44 L 80,46 L 78,68 L 48,68 Z",
            "M 84,44 L 112,46 L 110,68 L 82,68 Z",
          ].map((d, i) => (
            <path key={i} d={d} fill={i === 0 ? SFE : SF} stroke={SK} strokeWidth={i === 0 ? 0.7 : 0.6} opacity={i === 0 ? 1 : 0.85} />
          ))}
          <DimH x1={8} x2={38} y={10} label="10–20mm" />
          <ViewTag x={8} y={74} text="RUSTIC IRREGULAR PIECES" />
        </Bp>
      );

    // ─── Mince (paste-fine) ──────────────────────────────────────────────────
    case "mince": {
      const dots: React.ReactNode[] = [];
      for (let i = 0; i < 90; i++) {
        const jx = ((i * 11) % 13) - 6;
        const jy = ((i * 17) % 11) - 5;
        const cx = 14 + (i % 10) * 10 + jx;
        const cy = 16 + Math.floor(i / 10) * 6 + jy;
        if (cx < 8 || cx > 100 || cy < 12 || cy > 60) continue;
        dots.push(
          <circle key={i} cx={cx} cy={cy} r={0.8 + (i % 3) * 0.35}
            fill={SK} opacity={0.4 + (i % 5) * 0.08} />
        );
      }
      return (
        <Bp>
          {dots}
          {/* Scale bar showing <2mm */}
          <line x1={102} y1={20} x2={114} y2={20} stroke={SKL} strokeWidth={0.5} />
          <line x1={102} y1={18.5} x2={102} y2={21.5} stroke={SKL} strokeWidth={0.5} />
          <line x1={114} y1={18.5} x2={114} y2={21.5} stroke={SKL} strokeWidth={0.5} />
          <text x={108} y={16.5} fontSize="3.4" textAnchor="middle" fill={LBL} fontFamily={MONO}>&lt;2mm</text>
          <ViewTag x={8} y={74} text="PASTE-FINE TEXTURE" />
        </Bp>
      );
    }

    default:
      return (
        <Bp>
          <rect x={20} y={20} width={80} height={40} rx={2} fill={SF} stroke={SK} strokeWidth={0.7} />
        </Bp>
      );
  }
}

// ─── Labour badge ──────────────────────────────────────────────────────────────

function LabourBadge({ level }: { level: LabourIntensity }) {
  const map: Record<LabourIntensity, { label: string; className: string }> = {
    low:         { label: "Low labour",       className: "text-green-400/75 border-green-500/25 bg-green-500/8" },
    medium:      { label: "Med labour",       className: "text-amber-400/75 border-amber-500/25 bg-amber-500/8" },
    high:        { label: "High labour",      className: "text-red-400/75 border-red-500/25 bg-red-500/8" },
    "very-high": { label: "Very high labour", className: "text-red-300/80 border-red-400/30 bg-red-400/10" },
  };
  const { label, className } = map[level];
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider", className)}>
      {label}
    </span>
  );
}

// ─── Detail section ────────────────────────────────────────────────────────────

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">{title}</div>
      {children}
    </div>
  );
}

// ─── Cut card (full detail, expandable) ───────────────────────────────────────

function CutCard({ cut }: { cut: CutEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-colors duration-150",
      open ? "border-white/15 bg-white/4" : "border-white/8 bg-white/2"
    )}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{cut.name}</span>
            {cut.labourIntensity && <LabourBadge level={cut.labourIntensity} />}
          </div>
          {cut.aka && cut.aka.length > 0 && (
            <div className="text-[10px] text-white/32 mt-0.5 truncate">
              {cut.aka.slice(0, 2).join(" · ")}
            </div>
          )}
          <div className="flex gap-3 mt-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-blue-300/65">{cut.expectedYieldPercent}</span>
            <span className="text-[11px] text-white/38">{cut.typicalPortionGrams}</span>
            <span className="text-[10px] text-white/30 italic">{cut.primal}</span>
          </div>
          {!open && (
            <p className="text-xs text-white/40 mt-1.5 leading-relaxed line-clamp-2">{cut.description}</p>
          )}
        </div>
        <div className="w-4 h-4 flex items-center justify-center text-white/25 mt-0.5 flex-none">
          {open ? "−" : "+"}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-5 border-t border-white/8 pt-4">
          <p className="text-sm text-white/68 leading-relaxed">{cut.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DetailSection title="Trim Instructions">
              <ol className="space-y-1.5">
                {cut.trimInstructions.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-white/62">
                    <span className="text-blue-400/50 font-mono text-[10px] mt-0.5 flex-none w-4">{i + 1}.</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ol>
            </DetailSection>

            <DetailSection title="Knife Tips">
              <ul className="space-y-1.5">
                {cut.knifeTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-white/62">
                    <span className="text-amber-400/55 mt-0.5 flex-none">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DetailSection title="Common Mistakes">
              <ul className="space-y-1.5">
                {cut.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-xs text-white/62">
                    <span className="text-red-400/55 mt-0.5 flex-none">•</span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection title="Cooking Applications">
              <ul className="space-y-1">
                {cut.cookingApplications.map((app, i) => (
                  <li key={i} className="text-xs text-white/62 flex gap-2">
                    <span className="text-green-400/55 mt-0.5 flex-none">•</span>
                    <span>{app}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          </div>

          {cut.trimRecovery && cut.trimRecovery.length > 0 && (
            <DetailSection title="Trim Recovery">
              <div className="space-y-2">
                {cut.trimRecovery.map((r, i) => (
                  <div key={i} className="bg-white/3 border border-white/8 rounded-lg px-3 py-2">
                    <div className="text-xs font-semibold text-white/72">{r.use}</div>
                    <div className="text-[11px] text-white/42 mt-0.5 leading-relaxed">{r.notes}</div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cut thumbnail card (horizontal carousel) ─────────────────────────────────

function CutThumbnailCard({
  cut,
  isSelected,
  onSelect,
}: {
  cut: CutEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex-none w-32 rounded-xl border overflow-hidden transition-all duration-150 text-left",
        isSelected
          ? "border-blue-500/40 bg-blue-500/8"
          : "border-white/10 bg-white/3 hover:border-white/18 hover:bg-white/5"
      )}
    >
      <div className={cn(
        "w-full h-10 flex items-end px-2.5 py-2 border-b",
        isSelected ? "bg-blue-500/10 border-blue-500/20" : "bg-white/4 border-white/8"
      )}>
        <div className="text-[9px] font-bold uppercase tracking-wider text-white/45">
          {cut.primal}
        </div>
      </div>
      <div className="px-2.5 py-2.5">
        <div className="text-xs font-semibold text-white/88 leading-tight">{cut.name}</div>
        <div className="text-[10px] text-white/38 mt-0.5 leading-tight">{cut.typicalPortionGrams}</div>
        <div className="text-[10px] font-mono text-blue-400/65 mt-0.5">{cut.expectedYieldPercent}</div>
      </div>
    </button>
  );
}

// ─── Knife skill tile (horizontal carousel) ───────────────────────────────────

function KnifeSkillTile({
  skill,
  isSelected,
  onSelect,
}: {
  skill: KnifeSkill;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex-none w-40 rounded-xl border overflow-hidden transition-all duration-150 text-left",
        isSelected
          ? "border-blue-500/55 bg-blue-500/10"
          : "border-white/10 bg-white/3 hover:border-white/18 hover:bg-white/5"
      )}
    >
      <div className={cn(
        "w-full h-28 flex items-center justify-center p-2.5",
        isSelected ? "bg-blue-500/6" : "bg-white/3"
      )}>
        <KnifeIllustration skillId={skill.id} />
      </div>
      <div className="px-2.5 py-2 border-t border-white/8">
        <div className={cn(
          "text-xs font-semibold leading-tight",
          isSelected ? "text-blue-300" : "text-white/85"
        )}>
          {skill.label}
        </div>
        <div className="text-[10px] font-mono text-white/35 mt-0.5 leading-tight truncate">
          {skill.dimensions}
        </div>
        <div className="text-[10px] text-white/30 mt-0.5 leading-tight truncate">
          {skill.shape}
        </div>
      </div>
    </button>
  );
}

// ─── Knife skill detail panel ─────────────────────────────────────────────────

function KnifeSkillDetailPanel({ skill }: { skill: KnifeSkill }) {
  return (
    <div className="mx-4 mt-1 rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-white">{skill.label}</div>
            {skill.frenchName && skill.frenchName !== skill.label && (
              <div className="text-[11px] text-white/35 italic mt-0.5">{skill.frenchName}</div>
            )}
            <div className="text-xs font-mono text-blue-300/80 mt-1">{skill.dimensions}</div>
          </div>
          <div className="flex-none w-20 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/8 p-1.5">
            <KnifeIllustration skillId={skill.id} />
          </div>
        </div>
        <p className="text-xs text-white/55 mt-2.5 leading-relaxed">{skill.description}</p>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/8">
        {/* Specifications */}
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/28 mb-3">Specifications</div>
          <div className="space-y-2.5">
            <div>
              <div className="text-[9px] text-white/28 uppercase tracking-wider mb-0.5">Shape</div>
              <div className="text-xs text-white/72">{skill.shape}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/28 uppercase tracking-wider mb-0.5">Starting From</div>
              <div className="text-xs text-white/72">{skill.startingFrom}</div>
            </div>
            {skill.tool && (
              <div>
                <div className="text-[9px] text-white/28 uppercase tracking-wider mb-0.5">Knife</div>
                <div className="text-xs text-white/72">{skill.tool}</div>
              </div>
            )}
            {skill.consistency && (
              <div>
                <div className="text-[9px] text-white/28 uppercase tracking-wider mb-0.5">Consistency</div>
                <div className="text-xs text-white/72">{skill.consistency}</div>
              </div>
            )}
          </div>
        </div>

        {/* Applications */}
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/28 mb-3">Applications</div>
          <ul className="space-y-1.5">
            {skill.applications.slice(0, 5).map((app, i) => (
              <li key={i} className="text-xs text-white/62 flex gap-2">
                <span className="text-blue-400/55 mt-0.5 flex-none">•</span>
                <span className="leading-relaxed">{app}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Chef Notes */}
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/28 mb-3">Chef Notes</div>
          <ul className="space-y-2">
            {skill.tips.slice(0, 3).map((tip, i) => (
              <li key={i} className="text-xs text-white/62 flex gap-2">
                <span className="text-amber-400/55 mt-0.5 flex-none">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
          {skill.relatedCuts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/8">
              <div className="text-[9px] text-white/28 uppercase tracking-wider mb-1.5">Related Cuts</div>
              <div className="flex flex-wrap gap-1">
                {skill.relatedCuts.map(id => {
                  const rel = KNIFE_SKILLS.find(s => s.id === id);
                  if (!rel) return null;
                  return (
                    <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/42 border border-white/8">
                      {rel.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Yield calculator ──────────────────────────────────────────────────────────

function YieldCalculatorPanel() {
  const [rawKg, setRawKg] = useState("");
  const [yieldPct, setYieldPct] = useState("80");
  const [rawCostPerKg, setRawCostPerKg] = useState("");
  const [portionG, setPortionG] = useState("180");

  const raw = parseFloat(rawKg);
  const yp = parseFloat(yieldPct) / 100;
  const costPKg = parseFloat(rawCostPerKg);
  const portG = parseFloat(portionG);

  const usable = isNaN(raw) || isNaN(yp) || yp <= 0 ? null : raw * yp;
  const waste = usable == null ? null : raw - usable;
  const trueCostPerKg = usable == null || usable <= 0 || isNaN(costPKg) || costPKg <= 0 ? null : (raw * costPKg) / usable;
  const costPerPortion = trueCostPerKg == null || isNaN(portG) || portG <= 0 ? null : (trueCostPerKg * portG) / 1000;

  const field = "w-full bg-white/5 border border-white/12 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50";

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Yield Calculator</div>
        <p className="text-xs text-white/42 leading-relaxed">
          True cost per kg after trimming — the only number that matters when setting menu prices.
        </p>
      </div>

      <div className="space-y-3">
        {[
          { label: "Raw weight (kg)",     state: rawKg,        set: setRawKg,        step: "0.1",  placeholder: "e.g. 5.0" },
          { label: "Expected yield (%)",  state: yieldPct,     set: setYieldPct,     step: "0.5",  placeholder: "e.g. 80" },
          { label: "Raw cost per kg ($)", state: rawCostPerKg, set: setRawCostPerKg, step: "0.01", placeholder: "e.g. 28.00" },
          { label: "Portion size (g)",    state: portionG,     set: setPortionG,     step: "5",    placeholder: "e.g. 180" },
        ].map(({ label, state, set, step, placeholder }) => (
          <div key={label}>
            <label className="block text-[11px] uppercase tracking-widest text-white/38 mb-1.5">{label}</label>
            <input className={field} type="number" min="0" step={step} placeholder={placeholder}
              value={state} onChange={e => set(e.target.value)} />
          </div>
        ))}
      </div>

      {usable !== null && (
        <div className="space-y-3">
          <div className="h-px bg-white/8" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Results</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Usable Yield",   value: `${usable.toFixed(2)} kg`,                                          accent: "text-green-400" },
              { label: "Waste / Trim",   value: waste != null ? `${waste.toFixed(2)} kg` : "—",                     accent: "text-orange-400" },
              { label: "True Cost / kg", value: trueCostPerKg != null ? `$${trueCostPerKg.toFixed(2)}` : "—",       accent: "text-white/85" },
              { label: "Cost / Portion", value: costPerPortion != null ? `$${costPerPortion.toFixed(2)}` : "—",     accent: "text-blue-300" },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-white/4 border border-white/8 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{label}</div>
                <div className={cn("text-lg font-bold", accent)}>{value}</div>
              </div>
            ))}
          </div>
          {trueCostPerKg != null && (
            <div className="text-xs text-white/38 leading-relaxed bg-white/3 border border-white/8 rounded-lg p-3">
              <Scale className="inline w-3 h-3 mr-1.5 text-white/28" />
              Raw ${rawCostPerKg}/kg becomes{" "}
              <strong className="text-white/70">${trueCostPerKg.toFixed(2)}/kg usable</strong> after {yieldPct}% yield —{" "}
              a <strong className="text-orange-400/90">{(((1 / yp) - 1) * 100).toFixed(0)}% cost uplift</strong> to factor into GP.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function KitchenReferencePage() {
  const [tab, setTab] = useState<Tab>("butchery");
  const [search, setSearch] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState(() => {
    if (typeof window === "undefined") return "beef";
    const a = new URLSearchParams(window.location.search).get("animal");
    return a && ["beef","pork","lamb","chicken","fish"].includes(a) ? a : "beef";
  });
  const [selectedPrimal, setSelectedPrimal] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("primal");
  });
  const [selectedCutId, setSelectedCutId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skillCategory, setSkillCategory] = useState<KnifeSkillCategory | "all">("all");

  const currentCategory = useMemo(
    () => BUTCHERY_REFERENCE.find(c => c.id === selectedAnimal),
    [selectedAnimal]
  );
  const currentDiagram = useMemo(
    () => ANIMAL_DIAGRAMS.find(d => d.id === getDiagramId(selectedAnimal)),
    [selectedAnimal]
  );
  const selectedPrimalData = useMemo(() => {
    if (!selectedPrimal || !currentDiagram) return null;
    return currentDiagram.primals.find(p => p.id === selectedPrimal) ?? null;
  }, [selectedPrimal, currentDiagram]);

  const currentTile = ANIMAL_TILES.find(t => t.id === selectedAnimal);

  // Cross-animal search
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return BUTCHERY_REFERENCE.map(cat => ({
      category: cat,
      cuts: cat.cuts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.aka?.some(a => a.toLowerCase().includes(q)) ?? false) ||
        c.description.toLowerCase().includes(q) ||
        c.primal.toLowerCase().includes(q)
      ),
    })).filter(r => r.cuts.length > 0);
  }, [search]);

  // Cuts for the carousel (filtered by primal if one is selected)
  const carouselCuts = useMemo(() => {
    if (!currentCategory) return [];
    if (selectedPrimalData) {
      return currentCategory.cuts.filter(c => selectedPrimalData.cutIds.includes(c.id));
    }
    return currentCategory.cuts;
  }, [currentCategory, selectedPrimalData]);

  const selectedCut = useMemo(
    () => carouselCuts.find(c => c.id === selectedCutId) ?? null,
    [carouselCuts, selectedCutId]
  );

  // Knife skills
  const visibleSkills = useMemo(() => {
    if (skillCategory === "all") return KNIFE_SKILLS;
    return KNIFE_SKILLS.filter(s => s.category === skillCategory);
  }, [skillCategory]);

  const selectedSkill = useMemo(
    () => KNIFE_SKILLS.find(s => s.id === selectedSkillId) ?? null,
    [selectedSkillId]
  );

  const handleAnimalSelect = (id: string) => {
    setSelectedAnimal(id);
    setSelectedPrimal(null);
    setSelectedCutId(null);
    setSearch("");
  };

  const handlePrimalSelect = (id: string | null) => {
    setSelectedPrimal(id);
    setSelectedCutId(null);
  };

  const handleSkillSelect = (id: string) => {
    setSelectedSkillId(prev => prev === id ? null : id);
  };

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "butchery",     label: "Butchery" },
    { id: "knife-skills", label: "Knife Skills" },
    { id: "yield",        label: "Yield Calc" },
  ];

  const SKILL_CATEGORIES: Array<{ id: KnifeSkillCategory | "all"; label: string }> = [
    { id: "all",       label: "All" },
    { id: "precision", label: "Precision" },
    { id: "specialty", label: "Specialty" },
    { id: "rough",     label: "Rough" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Page header */}
      <div className="px-4 pt-6 pb-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400/55 mb-1">Kitchen Reference</div>
        <h1 className="text-xl font-bold text-white leading-tight">Butchery &amp; Knife Intelligence</h1>
        <p className="text-xs text-white/38 mt-1">Operational butchery &amp; knife skills intelligence</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 px-4 border-b border-white/8 mt-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "border-blue-500 text-white"
                : "border-transparent text-white/38 hover:text-white/62"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Butchery ──────────────────────────────────────────────────────────── */}
      {tab === "butchery" && (
        <div>
          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/28" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cuts, primals, animals..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/22 focus:outline-none focus:border-blue-500/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/55"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {searchResults !== null ? (
            /* ── Search results ── */
            <div className="px-4 space-y-6">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-white/28 text-sm">
                  No cuts found for &ldquo;{search}&rdquo;
                </div>
              ) : (
                searchResults.map(({ category, cuts }) => {
                  const tile = ANIMAL_TILES.find(t => t.id === category.id);
                  return (
                    <div key={category.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1" style={{ background: tile?.accentColor ?? "#888", opacity: 0.35 }} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">{category.label}</span>
                        <div className="h-px flex-1" style={{ background: tile?.accentColor ?? "#888", opacity: 0.35 }} />
                      </div>
                      <div className="space-y-2">
                        {cuts.map(cut => <CutCard key={cut.id} cut={cut} />)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ── Animal view ── */
            <div>
              {/* Animal selector tiles */}
              <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-1" style={{ scrollbarWidth: "none" }}>
                {ANIMAL_TILES.map(tile => {
                  const catCuts = BUTCHERY_REFERENCE.find(c => c.id === tile.id)?.cuts.length ?? 0;
                  const diag = ANIMAL_DIAGRAMS.find(d => d.id === getDiagramId(tile.id));
                  const primalCount = diag?.primals.length ?? 0;
                  const isSelected = selectedAnimal === tile.id;
                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleAnimalSelect(tile.id)}
                      className={cn(
                        "flex-none relative flex flex-col items-start p-3 rounded-xl border transition-all duration-150 overflow-hidden text-left min-w-[90px]",
                        isSelected
                          ? "border-white/18 bg-white/8"
                          : "border-white/8 bg-white/3 hover:border-white/13 hover:bg-white/5"
                      )}
                    >
                      <div className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: tile.accentColor, opacity: isSelected ? 1 : 0.35 }} />
                      <div className="text-[11px] font-bold tracking-wide text-white/90 mt-0.5">{tile.label}</div>
                      {primalCount > 0 && (
                        <div className="text-[9px] text-white/35 mt-0.5">{primalCount} Primals</div>
                      )}
                      <div className="text-[9px] text-white/35">{catCuts} Cuts</div>
                      {isSelected && (
                        <div className="absolute bottom-1 right-2 w-1 h-1 rounded-full"
                          style={{ background: tile.accentColor }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: currentTile?.accentColor ?? "white" }}>
                    {currentCategory?.label}
                  </span>
                  {selectedPrimalData && (
                    <>
                      <span className="text-white/20">›</span>
                      <span className="text-xs text-white/55 font-semibold">{selectedPrimalData.label}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedPrimal && (
                    <button
                      onClick={() => { setSelectedPrimal(null); setSelectedCutId(null); }}
                      className="text-[10px] text-white/35 hover:text-white/60 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                  <span className="text-[10px] text-white/28 flex items-center gap-1">
                    <List className="w-3 h-3" />
                    {carouselCuts.length} cuts
                  </span>
                </div>
              </div>

              {/* Primal pill grid + info panel */}
              {currentDiagram && (
                <div className="px-4 pb-3">
                  <div className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr]">
                      {/* Primal cuts as silhouette + color-coded pills */}
                      <div className="p-3 border-b sm:border-b-0 sm:border-r border-white/8">
                        <div className="mb-3 rounded-lg bg-black/20 border border-white/5 p-2">
                          {USE_NEW_ANIMAL_ENGINE ? (
                            <AnimalViewport
                              diagram={currentDiagram}
                              selectedPrimalId={selectedPrimal}
                              onPrimalSelect={handlePrimalSelect}
                            />
                          ) : (
                            <AnimalSilhouette
                              diagram={currentDiagram}
                              selectedPrimalId={selectedPrimal}
                              onPrimalSelect={handlePrimalSelect}
                            />
                          )}
                        </div>
                        <div className="text-[9px] text-white/28 uppercase tracking-widest mb-2.5 px-1">
                          {currentDiagram.label} Primals · tap to filter
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {currentDiagram.primals.map(primal => {
                            const isSelected = selectedPrimal === primal.id;
                            const cutCount = primal.cutIds.length;
                            return (
                              <button
                                key={primal.id}
                                onClick={() => handlePrimalSelect(isSelected ? null : primal.id)}
                                className={cn(
                                  "group relative flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all duration-150",
                                  isSelected
                                    ? "bg-white/8 shadow-sm"
                                    : "bg-white/2 hover:bg-white/5 border-white/8"
                                )}
                                style={isSelected ? {
                                  borderColor: `${primal.color}80`,
                                  boxShadow: `inset 0 0 0 1px ${primal.color}40`,
                                } : undefined}
                              >
                                <span
                                  className="w-1 h-7 rounded-full flex-none"
                                  style={{ background: primal.color, opacity: isSelected ? 1 : 0.7 }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className={cn(
                                    "text-[11px] font-bold leading-tight truncate",
                                    isSelected ? "text-white" : "text-white/85"
                                  )}>
                                    {primal.label}
                                  </div>
                                  <div className="text-[9px] text-white/40 leading-tight mt-0.5">
                                    {cutCount > 0 ? `${cutCount} cut${cutCount !== 1 ? "s" : ""}` : "Reference"}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Primal info panel */}
                      <div className="p-4">
                        {selectedPrimalData ? (
                          <div>
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <div
                                className="w-1.5 h-5 rounded-full flex-none"
                                style={{ background: selectedPrimalData.color }}
                              />
                              <div className="text-sm font-bold text-white leading-tight">
                                {selectedPrimalData.label}
                              </div>
                              {carouselCuts.length > 0 && (
                                <span className="ml-auto text-[10px] text-white/30 font-mono shrink-0">
                                  {carouselCuts.length} cut{carouselCuts.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            {USE_NEW_ANIMAL_ENGINE ? (
                              <AnimalInfoPanel primal={selectedPrimalData} />
                            ) : (
                              <>
                                {selectedPrimalData.description && (
                                  <p className="text-[11px] text-white/48 leading-relaxed mb-3">
                                    {selectedPrimalData.description}
                                  </p>
                                )}
                                {selectedPrimalData.subprimals && selectedPrimalData.subprimals.length > 0 && (
                                  <div>
                                    <div className="text-[9px] text-white/28 uppercase tracking-widest mb-1.5">Subprimals</div>
                                    <div className="space-y-1">
                                      {selectedPrimalData.subprimals.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                          <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-none" />
                                          <span className="text-white/65">{s}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-semibold text-white/60 mb-1">{currentDiagram.label}</div>
                            <div className="text-[10px] text-white/35 mb-3">{currentDiagram.totalCutsLabel}</div>
                            <div className="space-y-1.5">
                              {currentDiagram.primals.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => handlePrimalSelect(p.id)}
                                  className="w-full flex items-center gap-2 text-left hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
                                >
                                  <div className="w-2 h-2 rounded-sm flex-none" style={{ background: p.color }} />
                                  <span className="text-xs text-white/65 flex-1">{p.label}</span>
                                  {p.cutIds.length > 0 && (
                                    <span className="text-[10px] text-white/28 font-mono">{p.cutIds.length}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational note */}
                    {currentDiagram.operationalNote && (
                      <div className="px-4 py-2.5 border-t border-white/6">
                        <p className="text-[10px] text-white/25 leading-relaxed italic">{currentDiagram.operationalNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Secondary cuts carousel */}
              {carouselCuts.length > 0 && (
                <div className="pb-3">
                  <div className="px-4 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">
                      {selectedPrimalData ? `Cuts from ${selectedPrimalData.label}` : "All Cuts"}
                    </span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
                    {carouselCuts.map(cut => (
                      <CutThumbnailCard
                        key={cut.id}
                        cut={cut}
                        isSelected={selectedCutId === cut.id}
                        onSelect={() => setSelectedCutId(prev => prev === cut.id ? null : cut.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Selected cut detail */}
              {selectedCut && (
                <div className="px-4 pb-2">
                  <CutCard cut={selectedCut} />
                </div>
              )}

              {/* Empty state for no diagram */}
              {!currentDiagram && (
                <div className="px-4 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/28 mb-2">
                    {currentCategory?.label ?? ""} — {carouselCuts.length} cuts
                  </div>
                  {carouselCuts.length === 0 ? (
                    <div className="py-10 text-center text-white/28 text-sm">No cuts in this category.</div>
                  ) : (
                    carouselCuts.map(cut => <CutCard key={cut.id} cut={cut} />)
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Knife Skills ───────────────────────────────────────────────────────── */}
      {tab === "knife-skills" && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div>
              <div className="text-xs font-bold text-white/75">Knife Skills</div>
              <div className="text-[10px] text-white/35 mt-0.5">Click a cut style to view details and applications</div>
            </div>
            <span className="text-[10px] text-white/28 font-mono">{visibleSkills.length} techniques</span>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 px-4 pt-1 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SKILL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSkillCategory(cat.id);
                  setSelectedSkillId(null);
                }}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex-none",
                  skillCategory === cat.id
                    ? "bg-blue-600/28 border-blue-500/55 text-blue-300"
                    : "border-white/10 text-white/38 hover:text-white/62 hover:border-white/18"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Skill carousel */}
          <div className="flex gap-2.5 overflow-x-auto px-4 pb-3 pt-1" style={{ scrollbarWidth: "none" }}>
            {visibleSkills.map(skill => (
              <KnifeSkillTile
                key={skill.id}
                skill={skill}
                isSelected={selectedSkillId === skill.id}
                onSelect={() => handleSkillSelect(skill.id)}
              />
            ))}
          </div>

          {/* Skill detail panel */}
          {selectedSkill && (
            <div className="pb-4">
              <KnifeSkillDetailPanel skill={selectedSkill} />
            </div>
          )}

          {/* Empty prompt when no skill selected */}
          {!selectedSkill && visibleSkills.length > 0 && (
            <div className="px-4 py-6 text-center text-white/22 text-xs">
              Select a cut style above to view specifications, applications and chef notes
            </div>
          )}
        </div>
      )}

      {/* ─── Yield Calculator ──────────────────────────────────────────────────── */}
      {tab === "yield" && <YieldCalculatorPanel />}
    </div>
  );
}
