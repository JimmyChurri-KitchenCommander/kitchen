// ─── Primal Shape Renderer ──────────────────────────────────────────────────────
// Interprets a PrimalShapeObject (vertex-first, normalised 0–1 coords) into SVG.
//
// Rendering contract:
//   - viewBox = "0 0 {viewAspect} 1" — renders normalised x scaled by viewAspect
//   - Container aspect-ratio = viewAspect (CSS), so pixel-per-unit is equal on both axes
//   - primal zones: dashed outline → solid fill + glow on select
//   - structural zones (head/limb): passive fill, no interaction
//   - Wireframe mode: all edges as lines, no fill
//   - Silhouette mode: outer polygon filled
//   - Segmented mode: all zones rendered with primal interactivity

import { useState } from "react";
import type { PrimalShapeObject, PrimalZone, Anchor } from "@/data/animal-shapes/types";

interface Props {
  shape: PrimalShapeObject;
  selectedZoneId: string | null;
  onZoneSelect: (id: string | null) => void;
}

// Compute centroid of a list of anchors
function centroid(anchors: Anchor[]): { x: number; y: number } {
  const cx = anchors.reduce((s, a) => s + a.x, 0) / anchors.length;
  const cy = anchors.reduce((s, a) => s + a.y, 0) / anchors.length;
  return { x: cx, y: cy };
}

export function PrimalShapeRenderer({ shape, selectedZoneId, onZoneSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const vbw = shape.viewAspect; // viewBox width
  const filterId = `psf-glow-${shape.id}`;
  const clipId = `psf-clip-${shape.id}`;

  // Anchor lookup map
  const anchorMap = new Map(shape.anchors.map(a => [a.id, a]));

  // Scale normalised 0–1 to viewBox coords (x scaled by viewAspect, y identity)
  const sx = (x: number) => x * vbw;
  const sy = (y: number) => y;

  // Build polygon points string from anchor IDs
  function zonePoints(zone: PrimalZone): string {
    return zone.anchorIds
      .map(id => {
        const a = anchorMap.get(id);
        if (!a) return "";
        return `${sx(a.x)},${sy(a.y)}`;
      })
      .filter(Boolean)
      .join(" ");
  }

  // Zone label position (override or centroid)
  function labelPos(zone: PrimalZone): { lx: number; ly: number } {
    if (zone.labelX !== undefined && zone.labelY !== undefined) {
      return { lx: sx(zone.labelX), ly: sy(zone.labelY) };
    }
    const anchors = zone.anchorIds
      .map(id => anchorMap.get(id))
      .filter(Boolean) as Anchor[];
    if (!anchors.length) return { lx: 0, ly: 0 };
    const c = centroid(anchors);
    return { lx: sx(c.x), ly: sy(c.y) };
  }

  const selectedZone = selectedZoneId
    ? shape.zones.find(z => z.id === selectedZoneId) ?? null
    : null;

  return (
    <div
      className="w-full select-none"
      style={{ aspectRatio: String(vbw) }}
      onClick={() => onZoneSelect(null)}
    >
      <svg
        viewBox={`0 0 ${vbw} 1`}
        className="w-full h-full block"
        style={{ display: "block" }}
      >
        <defs>
          {/* Glow filter — stdDeviation in viewBox units */}
          <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="0.015" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Wireframe mode ────────────────────────────────── */}
        {shape.mode === "wireframe" && shape.edges.map(([a, b], i) => {
          const p1 = anchorMap.get(a);
          const p2 = anchorMap.get(b);
          if (!p1 || !p2) return null;
          return (
            <line
              key={i}
              x1={sx(p1.x)} y1={sy(p1.y)}
              x2={sx(p2.x)} y2={sy(p2.y)}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.005}
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Silhouette mode ───────────────────────────────── */}
        {shape.mode === "silhouette" && shape.zones.filter(z => z.type === "primal").map(z => (
          <polygon
            key={z.id}
            points={zonePoints(z)}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth={0.005}
          />
        ))}

        {/* ── Segmented mode ────────────────────────────────── */}
        {shape.mode === "segmented" && (
          <>
            {/* ── Pass 1: body silhouette background (rendered first) ── */}
            {shape.zones.filter(z => z.type === "body").map(z => {
              const pts = zonePoints(z);
              if (!pts) return null;
              return (
                <polygon
                  key={z.id}
                  points={pts}
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={0.005}
                  strokeLinejoin="round"
                  style={{ pointerEvents: "none" }}
                />
              );
            })}

            {/* ── Pass 2: primal zones (interactive, on top of silhouette) ── */}
            {shape.zones.filter(z => z.type === "primal").map(zone => {
              const isSelected = zone.id === selectedZoneId;
              const isHovered = zone.id === hoveredId;
              const dimmed = selectedZoneId !== null && !isSelected;
              const pts = zonePoints(zone);
              if (!pts) return null;
              const color = zone.color ?? "#888";
              return (
                <polygon
                  key={zone.id}
                  points={pts}
                  fill={color}
                  fillOpacity={isSelected ? 0.55 : isHovered ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={isSelected ? 0.010 : 0.005}
                  strokeDasharray={isSelected ? undefined : "0.024 0.014"}
                  strokeOpacity={dimmed ? 0.15 : isHovered ? 1 : 0.80}
                  strokeLinejoin="round"
                  filter={isSelected ? `url(#${filterId})` : undefined}
                  style={{
                    cursor: "pointer",
                    transition: "fill-opacity 180ms ease, stroke-opacity 180ms ease",
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    onZoneSelect(isSelected ? null : zone.id);
                  }}
                  onMouseEnter={() => setHoveredId(zone.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}
            {/* head / limb / tail zones: invisible — body outline provides the silhouette */}
          </>
        )}

        {/* ── Selected-zone label badge ─────────────────────── */}
        {selectedZone && selectedZone.type === "primal" && (() => {
          const color = selectedZone.color ?? "#888";
          const text = (selectedZone.shortLabel ?? selectedZone.label).toUpperCase();
          const { lx, ly } = labelPos(selectedZone);
          // Badge geometry in viewBox units (px/unit is equal on both axes)
          const charW = 0.038;
          const padX = 0.040;
          const h = 0.092;
          const w = Math.max(text.length * charW + padX * 2, 0.15);
          const rx = 0.012;
          return (
            <g style={{ pointerEvents: "none" }} filter={`url(#${filterId})`}>
              <rect
                x={lx - w / 2}
                y={ly - h / 2}
                width={w}
                height={h}
                rx={rx}
                fill={color}
              />
              <text
                x={lx}
                y={ly + 0.026}
                textAnchor="middle"
                fill="#0a0e1a"
                fontSize={0.062}
                fontWeight="800"
                fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                letterSpacing="0.003"
              >
                {text}
              </text>
            </g>
          );
        })()}

        {/* ── Wireframe anchor overlay (dev mode — disabled by default) ── */}
        {false && shape.anchors.map(a => (
          <circle
            key={a.id}
            cx={sx(a.x)} cy={sy(a.y)}
            r={0.008}
            fill="rgba(255,100,100,0.8)"
          />
        ))}
      </svg>
    </div>
  );
}
