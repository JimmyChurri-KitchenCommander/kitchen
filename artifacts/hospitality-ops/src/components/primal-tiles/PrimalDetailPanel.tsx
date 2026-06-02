import { useState } from "react";
import { ZONE_COLORS, type Zone } from "../../engine/primal-engine";
import type { AnimalId } from "../../engine/primal-engine";
import { getZoneIntelligence } from "../../engine/primal-zone-intelligence";
import { getCanonicalCut } from "../../engine/primal-ontology";
import { getChefDecision } from "../../decision/chef-decision-engine";
import { getSubprimalIntelligence } from "../../intelligence/primal-subprimal-intelligence";

const TEXTURE_COLOR: Record<string, string> = {
  tender: "#4ade80",
  medium: "#facc15",
  tough:  "#fb923c",
};

const RISK_COLOR: Record<string, string> = {
  low:    "#4ade80",
  medium: "#facc15",
  high:   "#fb923c",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/22 mb-2.5">{title}</p>
      {children}
    </div>
  );
}

export function PrimalDetailPanel({
  animalId,
  zone,
  onClose,
}: {
  animalId: AnimalId;
  zone:     Zone;
  onClose:  () => void;
}) {
  const intel     = getZoneIntelligence(animalId, zone.id);
  const canonical = getCanonicalCut(animalId, zone.id);
  const decision  = getChefDecision(animalId, zone.id);
  const subprimal = getSubprimalIntelligence(animalId, zone.id);
  const [showFull, setShowFull] = useState(false);

  const zoneColor    = ZONE_COLORS[zone.colorToken];
  const textureColor = intel ? (TEXTURE_COLOR[intel.textureProfile] ?? "#ffffff") : "#ffffff";

  return (
    <aside
      className="w-80 shrink-0 flex flex-col border-l overflow-y-auto"
      style={{
        background:   "#070b14",
        borderColor:  "rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3.5 flex items-start justify-between gap-3 sticky top-0 z-10"
        style={{
          background:   "#070b14",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          borderLeft:   `3px solid ${zoneColor}`,
        }}
      >
        <div className="min-w-0">
          <p
            className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: zoneColor }}
          >
            {zone.label}
          </p>
          <h2 className="text-[15px] font-bold leading-tight text-white">
            {intel?.primalName ?? zone.label}
          </h2>
          {intel && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{
                  background: `${textureColor}15`,
                  color:      textureColor,
                  border:     `1px solid ${textureColor}28`,
                }}
              >
                {intel.textureProfile}
              </span>
              <span className="text-[9px] text-white/30 font-mono">Yield {intel.yieldRange}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-white/70 hover:bg-white/8 transition-all shrink-0 text-[18px] leading-none"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Canonical ontology */}
      {canonical && (
        <Section title="Canonical Concept">
          <div
            className="rounded-lg px-3 py-2.5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border:     "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <p className="text-[12px] font-semibold text-white">{canonical.label}</p>
              <p
                className="text-[9px] font-bold uppercase tracking-widest shrink-0"
                style={{ color: zoneColor, opacity: 0.7 }}
              >
                {canonical.id}
              </p>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed">{canonical.description}</p>
          </div>
        </Section>
      )}

      {/* Zone intelligence */}
      {intel && (
        <Section title="Zone Intelligence">
          <div className="space-y-3">
            {/* Fat distribution */}
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-0.5">Fat Distribution</p>
              <p className="text-[10px] text-white/55 leading-relaxed">{intel.fatDistribution}</p>
            </div>

            {/* Cooking methods */}
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1.5">Cooking Methods</p>
              <div className="flex flex-wrap gap-1">
                {intel.cookingMethods.map((m, i) => (
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

            {/* Fabrication notes */}
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Fabrication Notes</p>
              <p className={`text-[10px] text-white/55 leading-relaxed ${showFull ? "" : "line-clamp-4"}`}>
                {intel.fabricationNotes}
              </p>
              {intel.fabricationNotes.length > 200 && (
                <button
                  onClick={() => setShowFull(f => !f)}
                  className="text-[9px] mt-1 font-medium transition-colors"
                  style={{ color: zoneColor }}
                >
                  {showFull ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            {/* Failure risks */}
            {intel.failureRisks.length > 0 && (
              <div>
                <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1.5">Failure Risks</p>
                <ul className="space-y-1.5">
                  {intel.failureRisks.map((r, i) => (
                    <li
                      key={i}
                      className="text-[10px] text-white/50 leading-snug flex items-start gap-2"
                    >
                      <span className="text-[#fb923c] shrink-0 mt-0.5">!</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Chef decision */}
      {decision && (
        <Section title="Chef Decision">
          <div className="space-y-3">
            {/* Primary intent + risk + score */}
            <div
              className="rounded-lg px-3 py-2.5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border:     "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p className="text-[11px] font-semibold text-white/80 leading-snug mb-2">
                {decision.primaryIntent}
              </p>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[7px] uppercase tracking-widest text-white/20">Service Fit</p>
                  <p className="text-[13px] font-bold font-mono" style={{ color: zoneColor }}>
                    {decision.serviceFitScore}
                    <span className="text-[9px] text-white/30">/100</span>
                  </p>
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-widest text-white/20">Risk</p>
                  <p
                    className="text-[11px] font-bold uppercase"
                    style={{ color: RISK_COLOR[decision.riskProfile] ?? "#facc15" }}
                  >
                    {decision.riskProfile}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[7px] uppercase tracking-widest text-white/20">Yield</p>
                  <p className="text-[10px] text-white/55 font-mono">{decision.yieldOptimization.midpointYield}%</p>
                </div>
              </div>
            </div>

            {/* Ranked applications */}
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1.5">Ranked Applications</p>
              <div className="space-y-1.5">
                {decision.rankedApplications.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className="text-[8px] font-bold font-mono shrink-0 mt-0.5 w-5 text-center rounded"
                      style={{
                        background: i === 0 ? `${zoneColor}20` : "rgba(255,255,255,0.05)",
                        color:      i === 0 ? zoneColor         : "rgba(255,255,255,0.25)",
                        padding:    "1px 2px",
                      }}
                    >
                      {a.score}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-white/70">{a.method}</p>
                      <p className="text-[9px] text-white/35 leading-snug">{a.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision flags */}
            {decision.decisionFlags.length > 0 && (
              <div>
                <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1.5">Flags</p>
                <div className="flex flex-wrap gap-1">
                  {decision.decisionFlags.map((f, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(96,165,250,0.10)",
                        color:      "#60a5fa",
                        border:     "1px solid rgba(96,165,250,0.20)",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid methods */}
            {decision.avoidMethods.length > 0 && (
              <div>
                <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1.5">Avoid</p>
                <div className="flex flex-wrap gap-1">
                  {decision.avoidMethods.map((m, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(251,146,60,0.10)",
                        color:      "#fb923c",
                        border:     "1px solid rgba(251,146,60,0.20)",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Yield advisory */}
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Yield Advisory</p>
              <p className="text-[10px] text-white/45 leading-relaxed">{decision.yieldOptimization.advisory}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Subprimal breakdown */}
      {subprimal && (
        <Section title="Structural Breakdown">
          <div className="space-y-3">
            {subprimal.structuralBreakdown.map((b, i) => (
              <div
                key={i}
                className="rounded-lg px-3 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border:     "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-[10px] font-semibold text-white/75 mb-0.5">{b.name}</p>
                <p className="text-[9px] text-white/40 leading-relaxed mb-1">{b.description}</p>
                <p className="text-[8px] text-white/25 leading-relaxed italic">
                  Separation: {b.separationMethod}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tissue logic */}
      {subprimal && (
        <Section title="Tissue Behaviour">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-[9px] text-white/30 w-20 shrink-0">Collagen</p>
              <p className="text-[10px] font-semibold text-white/65 capitalize">{subprimal.tissueLogic.collagenDensity}</p>
            </div>
            <div className="flex items-start gap-3">
              <p className="text-[9px] text-white/30 w-20 shrink-0">Fat</p>
              <p className="text-[10px] text-white/55 leading-relaxed">{subprimal.tissueLogic.fatDistribution}</p>
            </div>
            <div className="flex items-start gap-3">
              <p className="text-[9px] text-white/30 w-20 shrink-0">Muscle</p>
              <p className="text-[10px] text-white/55 leading-relaxed">{subprimal.tissueLogic.muscleType}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Fabrication pathways */}
      {subprimal && subprimal.fabricationPathways.length > 0 && (
        <Section title="Fabrication Pathways">
          <div className="space-y-3">
            {subprimal.fabricationPathways.map((p, i) => (
              <div key={i}>
                <p className="text-[10px] font-semibold text-white/70 mb-0.5">{p.derivedCut}</p>
                <p className="text-[9px] text-white/38 leading-relaxed mb-0.5">{p.technique}</p>
                <p className="text-[9px] text-white/28 italic leading-relaxed">{p.outcome}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Cooking implications */}
      {subprimal && subprimal.cookingImplications.length > 0 && (
        <Section title="Cooking Principles">
          <div className="space-y-3">
            {subprimal.cookingImplications.map((c, i) => (
              <div key={i}>
                <p className="text-[10px] font-semibold text-white/65 mb-0.5">{c.principle}</p>
                <p className="text-[9px] text-white/38 leading-relaxed">{c.explanation}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Menu applications */}
      {subprimal && subprimal.menuApplications.length > 0 && (
        <Section title="Menu Applications">
          <div className="space-y-3">
            {subprimal.menuApplications.map((a, i) => (
              <div key={i}>
                <p className="text-[10px] font-semibold text-white/65 mb-0.5">{a.concept}</p>
                <p className="text-[9px] text-white/38 leading-relaxed">{a.reasoning}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!intel && !subprimal && !decision && (
        <div className="px-4 py-6">
          <p className="text-[11px] text-white/25 italic">No intelligence data for this zone.</p>
        </div>
      )}

      <div className="h-6 shrink-0" />
    </aside>
  );
}
