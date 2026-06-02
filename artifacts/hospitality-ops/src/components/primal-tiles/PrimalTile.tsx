import { useMemo } from "react";
import { ZONE_COLORS, type Zone } from "../../engine/primal-engine";
import type { AnimalId } from "../../engine/primal-engine";
import { getZoneIntelligence } from "../../engine/primal-zone-intelligence";
import { getSubprimalIntelligence } from "../../intelligence/primal-subprimal-intelligence";
import { getChefDecision } from "../../decision/chef-decision-engine";

const TEXTURE_COLOR: Record<string, string> = {
  tender: "#4ade80",
  medium: "#facc15",
  tough:  "#fb923c",
};

const TEXTURE_LABEL: Record<string, string> = {
  tender: "Tender",
  medium: "Medium",
  tough:  "Tough",
};

type DonenessLevel = "Yes" | "No" | "Cond" | "Optional" | "Required";

const DONENESS_FROM_COLLAGEN: Record<string, { rare: DonenessLevel; medium: DonenessLevel; wellDone: DonenessLevel }> = {
  low:    { rare: "Yes",  medium: "Yes",     wellDone: "Optional"  },
  medium: { rare: "Cond", medium: "Yes",     wellDone: "Yes"       },
  high:   { rare: "No",   medium: "No",      wellDone: "Required"  },
};

function donenessColor(v: DonenessLevel): string {
  if (v === "Yes" || v === "Required") return "#4ade80";
  if (v === "Cond" || v === "Optional") return "#facc15";
  return "#fb923c";
}
function donenessBg(v: DonenessLevel): string {
  if (v === "Yes" || v === "Required") return "rgba(74,222,128,0.10)";
  if (v === "Cond" || v === "Optional") return "rgba(250,204,21,0.10)";
  return "rgba(251,146,60,0.10)";
}

export function PrimalTile({
  zone,
  animalId,
  isSelected,
  onSelect,
}: {
  zone:       Zone;
  animalId:   AnimalId;
  isSelected: boolean;
  onSelect:   () => void;
}) {
  const intel     = useMemo(() => getZoneIntelligence(animalId, zone.id), [animalId, zone.id]);
  const subprimal = useMemo(() => getSubprimalIntelligence(animalId, zone.id), [animalId, zone.id]);
  const decision  = useMemo(() => getChefDecision(animalId, zone.id), [animalId, zone.id]);

  const zoneColor    = ZONE_COLORS[zone.colorToken];
  const textureColor = intel ? (TEXTURE_COLOR[intel.textureProfile] ?? "rgba(255,255,255,0.35)") : "rgba(255,255,255,0.35)";

  const collagenDensity = subprimal?.tissueLogic.collagenDensity ?? null;
  const doneness        = collagenDensity ? DONENESS_FROM_COLLAGEN[collagenDensity] : null;

  const methods  = (decision?.rankedApplications.slice(0, 4).map(a => a.method)
                  ?? intel?.cookingMethods.slice(0, 4)
                  ?? []);
  const subNames = subprimal?.structuralBreakdown.slice(0, 3).map(b => b.name) ?? [];
  const secCuts  = subprimal?.fabricationPathways.slice(0, 3).map(p => p.derivedCut) ?? [];
  const menuTags = subprimal?.menuApplications.slice(0, 3).map(a => {
    const words = a.concept.split(/\s+/);
    return words.length > 5 ? words.slice(0, 5).join(" ") + "…" : a.concept;
  }) ?? [];

  return (
    <button
      onClick={onSelect}
      className="text-left w-full rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
      style={{
        background: isSelected ? `${zoneColor}10` : "rgba(255,255,255,0.025)",
        border:     `1px solid ${isSelected ? `${zoneColor}45` : "rgba(255,255,255,0.07)"}`,
        boxShadow:  isSelected ? `0 0 0 1px ${zoneColor}25, 0 4px 24px rgba(0,0,0,0.35)` : "none",
      }}
    >
      <div
        style={{
          height:      3,
          background:  zoneColor,
          opacity:     isSelected ? 1 : 0.65,
          borderRadius: "10px 10px 0 0",
        }}
      />

      <div className="px-4 pt-3.5 pb-5 space-y-3.5">

        {/* 1 — Primary identifier */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p
              className="text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5"
              style={{ color: zoneColor }}
            >
              {zone.label}
            </p>
            {intel && (
              <span
                className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: `${textureColor}15`,
                  color:      textureColor,
                  border:     `1px solid ${textureColor}28`,
                }}
              >
                {TEXTURE_LABEL[intel.textureProfile] ?? intel.textureProfile}
              </span>
            )}
          </div>
          <h3 className="text-[13px] font-bold leading-snug text-white mt-1">
            {intel?.primalName ?? zone.label}
          </h3>
          {intel && (
            <p className="text-[9px] text-white/28 mt-0.5 font-mono tracking-wide">
              Yield {intel.yieldRange}
            </p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

        {/* 2 — Subprimal structure */}
        {subNames.length > 0 && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1.5">
              Structure
            </p>
            <ul className="space-y-0.5">
              {subNames.map((name, i) => (
                <li
                  key={i}
                  className="text-[10px] text-white/50 leading-snug flex items-start gap-1.5"
                >
                  <span style={{ color: zoneColor, opacity: 0.5, flexShrink: 0 }}>—</span>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3 — Secondary / derived cuts */}
        {secCuts.length > 0 && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1.5">
              Derived Cuts
            </p>
            <ul className="space-y-0.5">
              {secCuts.map((cut, i) => (
                <li
                  key={i}
                  className="text-[10px] text-white/50 leading-snug flex items-start gap-1.5"
                >
                  <span style={{ color: zoneColor, opacity: 0.5, flexShrink: 0 }}>—</span>
                  {cut}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4 — Cooking method profile */}
        {methods.length > 0 && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1.5">
              Cooking Methods
            </p>
            <div className="flex flex-wrap gap-1">
              {methods.map((m, i) => (
                <span
                  key={i}
                  className="text-[9px] px-2 py-0.5 rounded font-medium"
                  style={{
                    background: i === 0 ? `${zoneColor}22` : "rgba(255,255,255,0.05)",
                    color:      i === 0 ? zoneColor         : "rgba(255,255,255,0.40)",
                    border:     i === 0 ? `1px solid ${zoneColor}35` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5 — Degree of doneness + thermal response */}
        {doneness && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1.5">
              Doneness
            </p>
            <div className="flex gap-1.5">
              {(
                [
                  { label: "Rare",   value: doneness.rare      },
                  { label: "Medium", value: doneness.medium    },
                  { label: "Well",   value: doneness.wellDone  },
                ] as const
              ).map(({ label, value }) => (
                <div
                  key={label}
                  className="flex-1 text-center rounded py-1"
                  style={{ background: donenessBg(value) }}
                >
                  <p className="text-[7px] uppercase tracking-wide text-white/28 leading-none mb-0.5">
                    {label}
                  </p>
                  <p
                    className="text-[9px] font-bold leading-none"
                    style={{ color: donenessColor(value) }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
            {collagenDensity && (
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-[9px] text-white/28">
                  Collagen: <span className="text-white/50 font-medium">{collagenDensity}</span>
                </p>
                {subprimal?.tissueLogic.fatDistribution && (
                  <p className="text-[9px] text-white/28 truncate min-w-0">
                    Fat: <span className="text-white/50 font-medium">
                      {subprimal.tissueLogic.fatDistribution.split(/[;,—–]/)[0]?.trim().slice(0, 28)}…
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6 — Texture profile */}
        {subprimal && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1">
              Texture
            </p>
            <p className="text-[10px] leading-relaxed text-white/38 line-clamp-3">
              {subprimal.tissueLogic.muscleType}
            </p>
          </div>
        )}

        {/* 7 — Menu application tags */}
        {menuTags.length > 0 && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-1.5">
              Menu Applications
            </p>
            <div className="flex flex-wrap gap-1">
              {menuTags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[8px] px-1.5 py-0.5 rounded text-white/35 leading-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border:     "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {!intel && !subprimal && (
          <p className="text-[10px] text-white/20 italic">No intelligence data for this zone.</p>
        )}
      </div>
    </button>
  );
}
