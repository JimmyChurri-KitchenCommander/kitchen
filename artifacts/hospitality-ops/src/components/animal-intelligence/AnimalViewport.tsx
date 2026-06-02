// ─── AnimalViewport ───────────────────────────────────────────────────────────
// Canonical renderer for all animal silhouette + primal zone views.
//
// CONTRACT:
//   - Uses BezierViewport for every species — explicit bezier bodyPath, NOT
//     derived from anchor/zone geometry.
//   - silhouetteBase is always present (diagram.bodyPath).  If it is empty or
//     the species is unknown, throws immediately — no silent fallback.
//   - PrimalShapeRenderer (vertex polygon mode) is removed.  Both this module
//     and PrimalButcherApp now use explicit SVG path silhouettes as the base.

import { useState } from "react";
import type { AnimalDiagram } from "@/data/animal-diagrams";

const KNOWN_SPECIES = new Set(["beef", "pork", "lamb", "chicken", "fish"]);

interface Props {
  diagram: AnimalDiagram;
  selectedPrimalId: string | null;
  onPrimalSelect: (id: string | null) => void;
}

export function AnimalViewport({ diagram, selectedPrimalId, onPrimalSelect }: Props) {
  if (!KNOWN_SPECIES.has(diagram.id)) {
    throw new Error(
      `[AnimalViewport] Unknown species "${diagram.id}" — no silhouette registered. ` +
      `Add it to KNOWN_SPECIES and supply a bodyPath in animal-diagrams.ts.`
    );
  }

  if (!diagram.bodyPath) {
    throw new Error(
      `[AnimalViewport] diagram.bodyPath is empty for species "${diagram.id}" — ` +
      `silhouetteBase is required. Update animal-diagrams.ts.`
    );
  }

  return (
    <BezierViewport
      diagram={diagram}
      selectedPrimalId={selectedPrimalId}
      onPrimalSelect={onPrimalSelect}
    />
  );
}

// ── Bezier silhouette renderer ────────────────────────────────────────────────
// Renders the explicit bezier bodyPath as the anatomical base layer, then
// overlays primal zone polygons (from diagram.primals) on top.
// clipPath ensures zone fills are masked to the animal silhouette.

function BezierViewport({ diagram, selectedPrimalId, onPrimalSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const clipId = `clip-${diagram.id}`;
  const glowId = `glow-${diagram.id}`;

  const selected = selectedPrimalId
    ? diagram.primals.find(p => p.id === selectedPrimalId) ?? null
    : null;

  return (
    <div
      className="w-full select-none"
      onClick={() => onPrimalSelect(null)}
    >
      <svg
        viewBox={diagram.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto block"
        style={{ maxHeight: 240 }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={diagram.bodyPath} />
            {diagram.legPaths?.map((p, i) => (
              <path key={i} d={p} />
            ))}
          </clipPath>
          <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base silhouette layer — bodyPath is the authoritative shape */}
        <path
          d={diagram.bodyPath}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth={0.8}
        />
        {diagram.legPaths?.map((p, i) => (
          <path
            key={i}
            d={p}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={0.6}
          />
        ))}
        {diagram.accentPaths?.map((p, i) => (
          <path
            key={i}
            d={p}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={0.7}
            strokeLinecap="round"
          />
        ))}

        {/* Primal zone polygons — clipped to silhouette */}
        <g clipPath={`url(#${clipId})`}>
          {diagram.primals.map(primal => {
            const isSelected = primal.id === selectedPrimalId;
            const isHovered = primal.id === hoveredId;
            const dimmed = selectedPrimalId != null && !isSelected;
            return (
              <polygon
                key={primal.id}
                points={primal.points}
                fill={primal.color}
                fillOpacity={isSelected ? 0.55 : isHovered ? 0.18 : 0}
                stroke={primal.color}
                strokeWidth={isSelected ? 1.1 : 0.55}
                strokeDasharray={isSelected ? undefined : "2.5 1.8"}
                strokeOpacity={dimmed ? 0.18 : isHovered ? 1 : 0.82}
                strokeLinejoin="round"
                filter={isSelected ? `url(#${glowId})` : undefined}
                style={{
                  cursor: "pointer",
                  transition: "fill-opacity 180ms ease, stroke-opacity 180ms ease",
                }}
                onClick={e => {
                  e.stopPropagation();
                  onPrimalSelect(isSelected ? null : primal.id);
                }}
                onMouseEnter={() => setHoveredId(primal.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })}
        </g>

        {/* Selected zone label */}
        {selected && (() => {
          const text = (selected.shortLabel ?? selected.label).toUpperCase();
          const charW = 3.6;
          const padX = 5;
          const h = 11;
          const w = text.length * charW + padX * 2;
          const lx = selected.labelX;
          const ly = selected.labelY;
          return (
            <g style={{ pointerEvents: "none" }} filter={`url(#${glowId})`}>
              <rect
                x={lx - w / 2}
                y={ly - h / 2}
                width={w}
                height={h}
                rx={2}
                fill={selected.color}
              />
              <text
                x={lx}
                y={ly + 3.2}
                textAnchor="middle"
                fill="#0a0e1a"
                fontSize={5.5}
                fontWeight="800"
                fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                letterSpacing="0.4"
              >
                {text}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
