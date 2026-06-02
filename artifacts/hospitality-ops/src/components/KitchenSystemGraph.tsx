import { useState } from "react";

// ── Graph data ────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  abbr: string;
  label: string;
  color: string;
  x: number;
  y: number;
  r: number;
  flagship?: boolean;
  state: "active" | "warning" | "idle";
  pulse: boolean;
  metrics: Array<{ label: string; value: string; color: string }>;
  events: string[];
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  color: string;
  particles: number;
  speed: number;
}

// Pentagon outer nodes + central intelligence hub
// ViewBox: 0 0 600 520 — center at (300, 260)
const NODES: GraphNode[] = [
  {
    id: "intelligence",
    abbr: "INTEL",
    label: "Operational Intelligence",
    color: "#7c3aed",
    x: 300, y: 260, r: 36,
    flagship: true, state: "active", pulse: true,
    metrics: [
      { label: "Pressure Score", value: "67 / 100", color: "#d97706" },
      { label: "GP% This Week",  value: "68.4%",    color: "#059669" },
      { label: "Active Alerts",  value: "3",         color: "#dc2626" },
    ],
    events: [
      "Butter stock: CRITICAL — action needed",
      "GP% up +1.2% vs last week",
      "Walk-in temp check due",
      "Station 2 workload flagged",
      "Waste down 8% vs last week",
    ],
  },
  {
    id: "inventory",
    abbr: "INV",
    label: "Inventory",
    color: "#1464D8",
    x: 300, y: 82, r: 28,
    state: "warning", pulse: true,
    metrics: [
      { label: "Low Stock Items",   value: "3",  color: "#d97706" },
      { label: "Critical Items",    value: "1",  color: "#dc2626" },
      { label: "Stagnant Items",    value: "2",  color: "#d97706" },
    ],
    events: [
      "Butter block: CRITICAL",
      "Salmon: below par level",
      "Invoice processed: +12 items",
      "Rocket: low (2 bags left)",
      "Cream 2L: restocked",
    ],
  },
  {
    id: "prep",
    abbr: "PREP",
    label: "Prep System",
    color: "#d97706",
    x: 468, y: 204, r: 28,
    state: "active", pulse: true,
    metrics: [
      { label: "Tasks Complete", value: "4 / 7", color: "#059669" },
      { label: "In Progress",    value: "1",      color: "#d97706" },
      { label: "Overdue",        value: "0",      color: "#059669" },
    ],
    events: [
      "Chef M: blanch broccolini ✓",
      "Chef L: portion salmon ✓",
      "Sauce base: in progress",
      "Chef K: cream cheese ✓",
      "Cold larder: pending",
    ],
  },
  {
    id: "cost",
    abbr: "COST",
    label: "Cost Engine",
    color: "#059669",
    x: 404, y: 404, r: 28,
    state: "active", pulse: false,
    metrics: [
      { label: "GP% This Week",   value: "68.4%", color: "#059669" },
      { label: "Avg Portion Cost",value: "$4.20", color: "#1464D8" },
      { label: "Price Alerts",    value: "1",      color: "#d97706" },
    ],
    events: [
      "Lamb rump GP%: 73.4%",
      "Salmon cost updated via invoice",
      "Butter price spike: +12%",
      "Weekly GP up +1.2%",
      "3 recipes recalculated",
    ],
  },
  {
    id: "waste",
    abbr: "WASTE",
    label: "Wastage",
    color: "#dc2626",
    x: 196, y: 404, r: 28,
    state: "active", pulse: true,
    metrics: [
      { label: "Waste Today",    value: "$54.70", color: "#dc2626" },
      { label: "Overproduction", value: "$34.20", color: "#d97706" },
      { label: "vs Last Week",   value: "-8%",    color: "#059669" },
    ],
    events: [
      "Trim loss logged: $12.40",
      "Overproduction: 2 portions",
      "Spoilage: rocket (end-of-day)",
      "Total waste today: $54.70",
      "Pattern: Tuesday +20% avg",
    ],
  },
  {
    id: "compliance",
    abbr: "COMP",
    label: "Compliance",
    color: "#0e7490",
    x: 132, y: 204, r: 28,
    state: "warning", pulse: false,
    metrics: [
      { label: "Temp Checks Due",  value: "1",        color: "#d97706" },
      { label: "Completed Today",  value: "3 / 4",    color: "#d97706" },
      { label: "Cleaning Tasks",   value: "All done", color: "#059669" },
    ],
    events: [
      "Walk-in fridge: 2°C ✓",
      "Prep fridge: check overdue",
      "All cleaning tasks complete",
      "Chemical SOP: accessed ×2",
      "Audit trail: 24 entries today",
    ],
  },
];

const EDGES: GraphEdge[] = [
  { id: "inventory-intelligence", from: "inventory",   to: "intelligence", label: "cost + usage data",    color: "#1464D8", particles: 3, speed: 2.5 },
  { id: "inventory-cost",         from: "inventory",   to: "cost",         label: "ingredient costs",     color: "#1464D8", particles: 2, speed: 3.2 },
  { id: "prep-inventory",         from: "prep",        to: "inventory",    label: "stock depletion",      color: "#d97706", particles: 3, speed: 2.0 },
  { id: "prep-waste",             from: "prep",        to: "waste",        label: "over-prep signals",    color: "#d97706", particles: 2, speed: 3.6 },
  { id: "prep-intelligence",      from: "prep",        to: "intelligence", label: "task completions",     color: "#d97706", particles: 2, speed: 2.8 },
  { id: "waste-cost",             from: "waste",       to: "cost",         label: "margin correction",    color: "#dc2626", particles: 2, speed: 3.0 },
  { id: "waste-intelligence",     from: "waste",       to: "intelligence", label: "waste events",         color: "#dc2626", particles: 2, speed: 2.6 },
  { id: "compliance-intelligence",from: "compliance",  to: "intelligence", label: "audit trail",          color: "#0e7490", particles: 1, speed: 4.2 },
  { id: "cost-intelligence",      from: "cost",        to: "intelligence", label: "GP% updates",          color: "#059669", particles: 3, speed: 2.2 },
];

// ── Geometry helpers ──────────────────────────────────────────────────────────

function rimPt(ax: number, ay: number, bx: number, by: number, r: number): [number, number] {
  const dx = bx - ax, dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  return [ax + (dx / d) * r, ay + (dy / d) * r];
}

function qPath(sx: number, sy: number, ex: number, ey: number, pull = 22): string {
  const mx = (sx + ex) / 2, my = (sy + ey) / 2;
  const dx = mx - 300, dy = my - 260;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cpx = mx + (dx / len) * pull, cpy = my + (dy / len) * pull;
  return `M${sx.toFixed(1)},${sy.toFixed(1)} Q${cpx.toFixed(1)},${cpy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface KitchenSystemGraphProps {
  compact?: boolean;
  /** When set, visually focuses these nodes and dims everything else */
  highlightedNodes?: string[];
  /**
   * "structure" = calm, dormant — used on the Modules page teaser.
   * "live"      = full activity — used on the Intelligence page (default).
   * "awakening" = waking up, edges brightening before the zoom transition.
   */
  mode?: "structure" | "live" | "awakening";
}

export function KitchenSystemGraph({ compact = false, highlightedNodes, mode = "live" }: KitchenSystemGraphProps) {
  const isStructure = mode === "structure";
  const isAwakening = mode === "awakening";
  const [selected, setSelected] = useState<string | null>(null);

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

  const isHighlightMode = !!highlightedNodes && highlightedNodes.length > 0;
  const isNodeFocused = (id: string) =>
    !isHighlightMode || id === "intelligence" || highlightedNodes!.includes(id);
  const isEdgeFocused = (from: string, to: string) =>
    !isHighlightMode ||
    from === "intelligence" || to === "intelligence" ||
    highlightedNodes!.includes(from) || highlightedNodes!.includes(to);

  const edgePaths = EDGES.map(edge => {
    const n1 = nodeMap[edge.from];
    const n2 = nodeMap[edge.to];
    const [sx, sy] = rimPt(n1.x, n1.y, n2.x, n2.y, n1.r + 3);
    const [ex, ey] = rimPt(n2.x, n2.y, n1.x, n1.y, n2.r + 3);
    const isOuterToOuter = edge.from !== "intelligence" && edge.to !== "intelligence";
    return { ...edge, path: qPath(sx, sy, ex, ey, isOuterToOuter ? 50 : 18) };
  });

  const sel = selected ? nodeMap[selected] : null;

  return (
    <div className="w-full select-none">
      <div className="relative w-full bg-[#080e18] rounded-2xl overflow-hidden border border-white/8 shadow-2xl">
        <svg
          viewBox="0 0 600 520"
          width="100%"
          style={{ display: "block", maxHeight: compact ? "300px" : undefined }}
          aria-label="Kitchen Command live system graph"
        >
          <defs>
            <pattern id="kc-dotgrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.7" fill="rgba(255,255,255,0.04)" />
            </pattern>
            {edgePaths.map(ep => (
              <path key={`def-${ep.id}`} id={`kcpath-${ep.id}`} d={ep.path} />
            ))}
          </defs>

          <rect width="600" height="520" fill="url(#kc-dotgrid)" />

          {/* Edge lines */}
          {edgePaths.map(ep => {
            const hoverHighlight = selected && (selected === ep.from || selected === ep.to);
            const focused = isEdgeFocused(ep.from, ep.to);
            return (
              <path
                key={`eline-${ep.id}`}
                d={ep.path}
                fill="none"
                stroke={ep.color}
                strokeWidth={hoverHighlight || (isHighlightMode && focused) ? "2" : "0.8"}
                strokeOpacity={
                  hoverHighlight ? 0.7 :
                  isHighlightMode && focused ? 0.55 :
                  isHighlightMode && !focused ? 0.04 :
                  isAwakening ? 0.55 :
                  isStructure ? 0.07 :
                  0.2
                }
                style={{ transition: "stroke-opacity 0.4s, stroke-width 0.4s" }}
              />
            );
          })}

          {/* Data particles */}
          {edgePaths.map(ep =>
            Array.from({ length: ep.particles }, (_, i) => {
              const focused = isEdgeFocused(ep.from, ep.to);
              return (
                <circle
                  key={`pt-${ep.id}-${i}`}
                  r={isHighlightMode && focused ? "3" : isAwakening ? "3.2" : isStructure ? "1.7" : "2.4"}
                  fill={ep.color}
                  opacity={isHighlightMode && !focused ? 0.08 : isStructure ? 0.55 : 0.9}
                  style={{ transition: "opacity 0.4s, r 0.4s" }}
                >
                  <animateMotion
                    dur={`${((ep.speed + i * 0.65) * (isStructure ? 1.7 : isAwakening ? 0.55 : 1)).toFixed(2)}s`}
                    repeatCount="indefinite"
                    begin={`${(-i * ep.speed / ep.particles).toFixed(2)}s`}
                  >
                    <mpath href={`#kcpath-${ep.id}`} />
                  </animateMotion>
                </circle>
              );
            })
          )}

          {/* Intelligence hub: sonar rings — disabled in structure mode, intense when awakening/highlight */}
          {!isStructure && [0, 1, 2].map(i => (
            <circle key={`sonar-${i}`} cx={300} cy={260} r={36} fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0">
              <animate attributeName="r"       values="38;95"   dur={`${((isHighlightMode || isAwakening) ? 1.8 : 3.2) + i * 1.0}s`} begin={`${i * 1.0}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values={(isHighlightMode || isAwakening) ? "0.80;0" : "0.45;0"} dur={`${((isHighlightMode || isAwakening) ? 1.8 : 3.2) + i * 1.0}s`} begin={`${i * 1.0}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Outer node pulse rings */}
          {NODES.filter(n => n.pulse && n.id !== "intelligence").map(node => {
            const focused = isNodeFocused(node.id);
            return (
              <circle key={`pring-${node.id}`} cx={node.x} cy={node.y} r={node.r} fill="none" stroke={node.color} strokeWidth="0.8" opacity="0">
                <animate attributeName="r"       values={`${node.r};${node.r + (isHighlightMode && focused ? 30 : isAwakening ? 32 : isStructure ? 12 : 22)}`} dur={isStructure ? "4s" : "2.6s"} repeatCount="indefinite" />
                <animate attributeName="opacity" values={(isHighlightMode && focused) || isAwakening ? "0.70;0" : isStructure ? "0.28;0" : "0.45;0"} dur={isStructure ? "4s" : "2.6s"} repeatCount="indefinite" />
              </circle>
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const isSelected = selected === node.id;
            const focused = isNodeFocused(node.id);
            const glowOpacity = isSelected ? 0.22 : isHighlightMode && focused ? 0.18 : isHighlightMode ? 0.03 : isAwakening ? 0.28 : isStructure ? 0.02 : 0.06;
            const strokeOpacity = isHighlightMode && !focused ? 0.15 : isStructure && !isSelected ? 0.38 : 1;
            const strokeWidth = isSelected ? "2.5" : isHighlightMode && focused ? "2" : isAwakening ? "2.2" : "1.5";
            const labelOpacity = isHighlightMode && !focused ? "rgba(255,255,255,0.12)" : isSelected ? "rgba(255,255,255,0.75)" : isAwakening ? "rgba(255,255,255,0.65)" : isStructure ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.42)";

            return (
              <g
                key={node.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setSelected(node.id)}
                onMouseLeave={() => setSelected(null)}
                onClick={() => setSelected(selected === node.id ? null : node.id)}
                role="button"
                aria-label={node.label}
              >
                <circle cx={node.x} cy={node.y} r={node.r + 10} fill={node.color} opacity={glowOpacity} style={{ transition: "opacity 0.4s" }} />
                <circle
                  cx={node.x} cy={node.y} r={node.r}
                  fill="#080e18"
                  stroke={node.color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  style={{ transition: "stroke-opacity 0.4s, stroke-width 0.3s" }}
                />
                <text
                  x={node.x} y={node.y}
                  textAnchor="middle" dominantBaseline="central"
                  fill={node.color}
                  fillOpacity={isHighlightMode && !focused ? 0.2 : 1}
                  fontSize={node.flagship ? "8.5" : "7.5"}
                  fontWeight="900"
                  fontFamily="ui-monospace, 'Courier New', monospace"
                  letterSpacing="0.8"
                  style={{ transition: "fill-opacity 0.4s" }}
                >
                  {node.abbr}
                </text>
                <text
                  x={node.x} y={node.y + node.r + 14}
                  textAnchor="middle"
                  fill={labelOpacity}
                  fontSize={compact ? "8.5" : "9"}
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                  style={{ transition: "fill 0.4s" }}
                >
                  {node.label}
                </text>
                <circle
                  cx={node.x + node.r * 0.72} cy={node.y - node.r * 0.72}
                  r="4"
                  fill={
                    node.state === "active"  ? "#10b981" :
                    node.state === "warning" ? "#f59e0b" :
                    "#4b5563"
                  }
                  opacity={isHighlightMode && !focused ? 0.2 : 1}
                  style={{ transition: "opacity 0.4s" }}
                >
                  {node.state !== "idle" && (
                    <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
                  )}
                </circle>
              </g>
            );
          })}

          <text
            x={300} y={308}
            textAnchor="middle"
            fill="rgba(124,58,237,0.4)"
            fontSize="6.5"
            fontFamily="ui-monospace, monospace"
            letterSpacing="2.5"
            fontWeight="700"
          >
            SYSTEM BRAIN
          </text>
        </svg>

        <div className="absolute top-3 left-4 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isStructure ? "bg-white/25" : "bg-emerald-400 animate-pulse"}`} />
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[2px]">
            {isStructure ? "Structure View" : isAwakening ? "Activating..." : "Live"}
          </span>
        </div>
        <div className="absolute top-3 right-4 flex items-center gap-3">
          {[{ c: "#10b981", l: "Active" }, { c: "#f59e0b", l: "Warning" }].map(({ c, l }) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              <span className="text-[9px] text-white/30 font-semibold">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node detail panel — on hover */}
      {sel ? (
        <div
          className="mt-4 rounded-2xl p-5 border transition-all duration-200"
          style={{ background: "#080e18", borderColor: `${sel.color}40`, boxShadow: `0 0 40px ${sel.color}12` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[2px] mb-1" style={{ color: sel.color }}>{sel.abbr}</p>
              <h3 className="text-sm font-black text-white">{sel.label}</h3>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold"
              style={{ background: `${sel.color}18`, border: `1px solid ${sel.color}40`, color: sel.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sel.color }} />
              {sel.state === "active" ? "Active" : sel.state === "warning" ? "Warning" : "Idle"}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2.5">Current State</p>
              <div className="space-y-2">
                {sel.metrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[11px] text-white/45">{m.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2.5">Last 5 Events</p>
              <div className="space-y-1.5">
                {sel.events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ background: sel.color }} />
                    <span className="text-[10px] text-white/45 leading-snug">{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/8">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2.5">Active Connections</p>
            <div className="flex flex-wrap gap-2">
              {EDGES
                .filter(e => e.from === sel.id || e.to === sel.id)
                .map((e, i) => {
                  const other = nodeMap[e.from === sel.id ? e.to : e.from];
                  const dir = e.from === sel.id ? "→" : "←";
                  return (
                    <div key={i} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px]"
                      style={{ background: `${e.color}12`, border: `1px solid ${e.color}28` }}>
                      <span className="text-white/35">{dir}</span>
                      <span className="font-semibold" style={{ color: e.color }}>{other.label}</span>
                      <span className="text-white/20 mx-0.5">·</span>
                      <span className="text-white/35">{e.label}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-[10px] text-white/20 mt-4 tracking-widest uppercase">
          Hover any node to see live system state
        </p>
      )}
    </div>
  );
}
