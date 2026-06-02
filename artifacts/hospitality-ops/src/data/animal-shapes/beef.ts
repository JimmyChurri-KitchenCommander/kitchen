import type { PrimalShapeObject } from "./types";

// ─── Beef — Primal Shape Object ─────────────────────────────────────────────────
// Normalised 0–1 coordinate space. viewAspect=4 (4:1 wide container).
// Head RIGHT, tail LEFT. All geometry: straight-line polygons (curveMode none).
//
// Body decomposition:
//   BACK BAND  (BK line → y≈0.52 mid-split): Round, Sirloin, Short Loin, Rib, Chuck
//   BELLY BAND (y≈0.52 → BL line):           Flank, Plate, Brisket
//   HEAD ZONE  (x>0.84):                      structural, non-primal
//   LIMB ZONES (y>0.72):                      4 legs, structural

export const BEEF_SHAPE: PrimalShapeObject = {
  id: "beef",
  type: "animal",
  mode: "segmented",
  viewAspect: 4,
  curveMode: "none",
  symmetry: "none",
  fill: true,

  anchors: [
    // ── Back line (top edge, tail→head) ──────────────────
    { id: "BK0", x: 0.07, y: 0.22 }, // rump top / back-left
    { id: "BK1", x: 0.28, y: 0.16 }, // Round/Sirloin top divider
    { id: "BK2", x: 0.43, y: 0.13 }, // Sirloin/Short-Loin top
    { id: "BK3", x: 0.56, y: 0.13 }, // Short-Loin/Rib top
    { id: "BK4", x: 0.69, y: 0.15 }, // Rib/Chuck top
    { id: "BK5", x: 0.80, y: 0.20 }, // shoulder/withers
    { id: "BK6", x: 0.84, y: 0.28 }, // neck/head junction (top)

    // ── Mid-body horizontal split (y≈0.52) ───────────────
    { id: "SP1", x: 0.28, y: 0.52 }, // Round/Sirloin mid
    { id: "SP2", x: 0.43, y: 0.52 }, // Sirloin/Short-Loin mid
    { id: "SP3", x: 0.56, y: 0.52 }, // Short-Loin/Rib mid
    { id: "SP4", x: 0.69, y: 0.52 }, // Rib/Chuck mid
    { id: "SP5", x: 0.80, y: 0.52 }, // shoulder mid
    { id: "SP6", x: 0.84, y: 0.52 }, // neck/head junction (mid)

    // ── Belly line (bottom edge) ──────────────────────────
    { id: "BL0", x: 0.13, y: 0.72 }, // rump belly
    { id: "BL1", x: 0.28, y: 0.72 }, // Round/Flank belly
    { id: "BL2", x: 0.56, y: 0.73 }, // Flank/Plate belly
    { id: "BL3", x: 0.69, y: 0.73 }, // Plate/Brisket belly
    { id: "BL4", x: 0.82, y: 0.76 }, // brisket bottom (hangs lower)
    { id: "BL5", x: 0.88, y: 0.68 }, // dewlap/throat

    // ── Rump / tail (left side, 3-point chamfer) ─────────
    { id: "RT0", x: 0.04, y: 0.32 }, // tail base
    { id: "RT1", x: 0.04, y: 0.52 }, // rump mid
    { id: "RT2", x: 0.07, y: 0.64 }, // rump base

    // ── Head polygon (right side) ─────────────────────────
    { id: "HD0", x: 0.90, y: 0.18 }, // head crown
    { id: "HD1", x: 0.96, y: 0.25 }, // poll / ear
    { id: "HD2", x: 0.99, y: 0.38 }, // forehead / bridge
    { id: "HD3", x: 0.99, y: 0.52 }, // muzzle
    { id: "HD4", x: 0.97, y: 0.62 }, // lower jaw
    { id: "HD5", x: 0.90, y: 0.68 }, // chin

    // ── Front legs (near chest, right side) ──────────────
    { id: "FLA", x: 0.72, y: 0.73 }, { id: "FLD", x: 0.72, y: 0.97 },
    { id: "FLB", x: 0.78, y: 0.73 }, { id: "FLE", x: 0.78, y: 0.97 },
    { id: "FLC", x: 0.83, y: 0.73 }, { id: "FLF", x: 0.83, y: 0.97 },

    // ── Rear legs (near rump, left side) ─────────────────
    { id: "RLA", x: 0.13, y: 0.73 }, { id: "RLD", x: 0.13, y: 0.97 },
    { id: "RLB", x: 0.19, y: 0.73 }, { id: "RLE", x: 0.19, y: 0.97 },
    { id: "RLC", x: 0.26, y: 0.73 }, { id: "RLF", x: 0.26, y: 0.97 },
  ],

  edges: [
    // Back line
    ["BK0","BK1"], ["BK1","BK2"], ["BK2","BK3"], ["BK3","BK4"], ["BK4","BK5"], ["BK5","BK6"],
    // Head outline
    ["BK6","HD0"], ["HD0","HD1"], ["HD1","HD2"], ["HD2","HD3"], ["HD3","HD4"], ["HD4","HD5"], ["HD5","BL5"],
    // Belly line
    ["BL5","BL4"], ["BL4","BL3"], ["BL3","BL2"], ["BL2","BL1"], ["BL1","BL0"],
    // Rump curve
    ["BL0","RT2"], ["RT2","RT1"], ["RT1","RT0"], ["RT0","BK0"],
    // Primal vertical dividers (upper half)
    ["BK1","SP1"], ["BK2","SP2"], ["BK3","SP3"], ["BK4","SP4"], ["BK5","SP5"], ["BK6","SP6"],
    // Mid-body split (horizontal)
    ["SP1","SP2"], ["SP2","SP3"], ["SP3","SP4"], ["SP4","SP5"], ["SP5","SP6"],
    // Lower primal boundaries
    ["SP1","BL1"], ["SP3","BL2"], ["SP4","BL3"], ["SP6","BL5"],
    // Head left-side boundary
    ["BK6","SP6"],
    // Front legs
    ["FLA","FLB"], ["FLB","FLC"],
    ["FLA","FLD"], ["FLD","FLE"], ["FLE","FLF"], ["FLF","FLC"],
    ["FLB","FLE"],
    // Rear legs
    ["RLA","RLB"], ["RLB","RLC"],
    ["RLA","RLD"], ["RLD","RLE"], ["RLE","RLF"], ["RLF","RLC"],
    ["RLB","RLE"],
  ],

  zones: [
    // ── Primal zones ──────────────────────────────────────
    {
      id: "round",
      type: "primal",
      label: "Round",
      color: "#3ab4d4",
      anchorIds: ["BK0","BK1","SP1","BL1","BL0","RT2","RT1","RT0"],
      labelX: 0.14, labelY: 0.38,
    },
    {
      id: "sirloin",
      type: "primal",
      label: "Sirloin",
      color: "#7ad43a",
      anchorIds: ["BK1","BK2","SP2","SP1"],
      labelX: 0.355, labelY: 0.34,
    },
    {
      id: "short-loin",
      type: "primal",
      label: "Short Loin",
      shortLabel: "Loin",
      color: "#c4d43a",
      anchorIds: ["BK2","BK3","SP3","SP2"],
      labelX: 0.495, labelY: 0.33,
    },
    {
      id: "rib",
      type: "primal",
      label: "Rib",
      color: "#e8c03a",
      anchorIds: ["BK3","BK4","SP4","SP3"],
      labelX: 0.625, labelY: 0.33,
    },
    {
      id: "chuck",
      type: "primal",
      label: "Chuck",
      color: "#e8763a",
      anchorIds: ["BK4","BK5","BK6","SP6","SP5","SP4"],
      labelX: 0.755, labelY: 0.34,
    },
    {
      id: "flank",
      type: "primal",
      label: "Flank",
      color: "#4a80d4",
      anchorIds: ["SP1","SP3","BL2","BL1"],
      labelX: 0.42, labelY: 0.63,
    },
    {
      id: "plate",
      type: "primal",
      label: "Plate",
      color: "#9a4ad4",
      anchorIds: ["SP3","SP4","BL3","BL2"],
      labelX: 0.625, labelY: 0.63,
    },
    {
      id: "brisket",
      type: "primal",
      label: "Brisket",
      color: "#d44a6e",
      anchorIds: ["SP4","SP5","SP6","BL5","BL4","BL3"],
      labelX: 0.775, labelY: 0.65,
    },

    // ── Body outline silhouette (rendered as background) ──
    {
      id: "body-outline",
      type: "body",
      label: "Body",
      anchorIds: ["BK0","BK1","BK2","BK3","BK4","BK5","BK6","HD0","HD1","HD2","HD3","HD4","HD5","BL5","BL4","BL3","BL2","BL1","BL0","RT2","RT1","RT0"],
    },
    // ── Structural zones (invisible — body outline provides silhouette) ──
    {
      id: "head",
      type: "head",
      label: "Head",
      anchorIds: ["BK6","HD0","HD1","HD2","HD3","HD4","HD5","BL5","SP6"],
    },
    { id: "fl1", type: "limb", label: "Shank", anchorIds: ["FLA","FLB","FLE","FLD"] },
    { id: "fl2", type: "limb", label: "Shank", anchorIds: ["FLB","FLC","FLF","FLE"] },
    { id: "rl1", type: "limb", label: "Shank", anchorIds: ["RLA","RLB","RLE","RLD"] },
    { id: "rl2", type: "limb", label: "Shank", anchorIds: ["RLB","RLC","RLF","RLE"] },
  ],
};
