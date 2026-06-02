import type { PrimalShapeObject } from "./types";

// ─── Pork — Primal Shape Object ─────────────────────────────────────────────────
// viewAspect=4. Head RIGHT (jowl/hock), Ham LEFT (hindquarter), tail far-left.
// Pork body: longer rectangular profile, flat back, pronounced ham, round snout.
//
// Body decomposition:
//   HAM      (x 0.04–0.35): hindquarter, rear section
//   BELLY    (x 0.35–0.65, lower): lower mid-section
//   LOIN     (x 0.35–0.65, upper): dorsal mid-section
//   SHOULDER (x 0.65–0.85): forequarter
//   HOCK     (x 0.85–0.99): jowl, cheek, front hock

export const PORK_SHAPE: PrimalShapeObject = {
  id: "pork",
  type: "animal",
  mode: "segmented",
  viewAspect: 4,
  curveMode: "none",
  symmetry: "none",
  fill: true,

  anchors: [
    // Back line
    { id: "BK0", x: 0.08, y: 0.22 }, // ham/rump top-left
    { id: "BK1", x: 0.35, y: 0.16 }, // Ham/Loin top divider
    { id: "BK2", x: 0.65, y: 0.16 }, // Loin/Shoulder top divider
    { id: "BK3", x: 0.78, y: 0.18 }, // shoulder peak
    { id: "BK4", x: 0.85, y: 0.25 }, // neck/head junction (top)

    // Mid-body split (y≈0.52)
    { id: "SP1", x: 0.35, y: 0.52 }, // Ham/Belly mid
    { id: "SP2", x: 0.65, y: 0.52 }, // Belly/Shoulder mid
    { id: "SP3", x: 0.85, y: 0.52 }, // Shoulder/Hock mid

    // Belly line
    { id: "BL0", x: 0.10, y: 0.72 }, // ham belly
    { id: "BL1", x: 0.35, y: 0.73 }, // Ham/Belly belly divider
    { id: "BL2", x: 0.65, y: 0.73 }, // Belly/Shoulder belly divider
    { id: "BL3", x: 0.80, y: 0.72 }, // shoulder belly
    { id: "BL4", x: 0.85, y: 0.68 }, // chest/throat

    // Rump / tail (left side)
    { id: "RT0", x: 0.03, y: 0.34 }, // tail base
    { id: "RT1", x: 0.03, y: 0.54 }, // rump mid
    { id: "RT2", x: 0.06, y: 0.64 }, // rump base

    // Head/snout polygon (right side) — pig disc snout
    { id: "HD0", x: 0.92, y: 0.20 }, // head top
    { id: "HD1", x: 0.97, y: 0.28 }, // snout top
    { id: "HD2", x: 0.99, y: 0.40 }, // snout tip
    { id: "HD3", x: 0.98, y: 0.54 }, // snout lower
    { id: "HD4", x: 0.94, y: 0.64 }, // jowl/chin
    { id: "HD5", x: 0.88, y: 0.68 }, // throat

    // Front legs
    { id: "FLA", x: 0.72, y: 0.73 }, { id: "FLD", x: 0.72, y: 0.97 },
    { id: "FLB", x: 0.78, y: 0.73 }, { id: "FLE", x: 0.78, y: 0.97 },
    { id: "FLC", x: 0.84, y: 0.73 }, { id: "FLF", x: 0.84, y: 0.97 },

    // Rear legs
    { id: "RLA", x: 0.10, y: 0.73 }, { id: "RLD", x: 0.10, y: 0.97 },
    { id: "RLB", x: 0.17, y: 0.73 }, { id: "RLE", x: 0.17, y: 0.97 },
    { id: "RLC", x: 0.24, y: 0.73 }, { id: "RLF", x: 0.24, y: 0.97 },
  ],

  edges: [
    // Back line
    ["BK0","BK1"], ["BK1","BK2"], ["BK2","BK3"], ["BK3","BK4"],
    // Head outline
    ["BK4","HD0"], ["HD0","HD1"], ["HD1","HD2"], ["HD2","HD3"], ["HD3","HD4"], ["HD4","HD5"], ["HD5","BL4"],
    // Belly
    ["BL4","BL3"], ["BL3","BL2"], ["BL2","BL1"], ["BL1","BL0"],
    // Rump
    ["BL0","RT2"], ["RT2","RT1"], ["RT1","RT0"], ["RT0","BK0"],
    // Primal dividers (upper)
    ["BK1","SP1"], ["BK2","SP2"], ["BK4","SP3"],
    // Mid split
    ["SP1","SP2"], ["SP2","SP3"],
    // Lower dividers
    ["SP1","BL1"], ["SP2","BL2"], ["SP3","BL4"],
    ["BK4","SP3"],
    // Legs
    ["FLA","FLB"], ["FLB","FLC"],
    ["FLA","FLD"], ["FLD","FLE"], ["FLE","FLF"], ["FLF","FLC"], ["FLB","FLE"],
    ["RLA","RLB"], ["RLB","RLC"],
    ["RLA","RLD"], ["RLD","RLE"], ["RLE","RLF"], ["RLF","RLC"], ["RLB","RLE"],
  ],

  zones: [
    {
      id: "ham",
      type: "primal",
      label: "Ham",
      color: "#7ad43a",
      anchorIds: ["BK0","BK1","SP1","BL1","BL0","RT2","RT1","RT0"],
      labelX: 0.18, labelY: 0.38,
    },
    {
      id: "belly",
      type: "primal",
      label: "Belly",
      color: "#d44a9a",
      anchorIds: ["SP1","SP2","BL2","BL1"],
      labelX: 0.50, labelY: 0.63,
    },
    {
      id: "loin",
      type: "primal",
      label: "Loin",
      color: "#e8c03a",
      anchorIds: ["BK1","BK2","SP2","SP1"],
      labelX: 0.50, labelY: 0.34,
    },
    {
      id: "shoulder",
      type: "primal",
      label: "Shoulder",
      color: "#e8763a",
      anchorIds: ["BK2","BK3","BK4","SP3","BL4","BL3","BL2","SP2"],
      labelX: 0.74, labelY: 0.44,
    },
    {
      id: "hock",
      type: "primal",
      label: "Hock",
      color: "#9a4ad4",
      anchorIds: ["BK4","HD0","HD1","HD2","HD3","HD4","HD5","SP3"],
      labelX: 0.91, labelY: 0.42,
    },
    // Body outline silhouette (rendered as background)
    {
      id: "body-outline",
      type: "body",
      label: "Body",
      anchorIds: ["BK0","BK1","BK2","BK3","BK4","HD0","HD1","HD2","HD3","HD4","HD5","BL4","BL3","BL2","BL1","BL0","RT2","RT1","RT0"],
    },
    // Structural (invisible — body outline provides silhouette)
    { id: "fl1", type: "limb", label: "Trotter", anchorIds: ["FLA","FLB","FLE","FLD"] },
    { id: "fl2", type: "limb", label: "Trotter", anchorIds: ["FLB","FLC","FLF","FLE"] },
    { id: "rl1", type: "limb", label: "Trotter", anchorIds: ["RLA","RLB","RLE","RLD"] },
    { id: "rl2", type: "limb", label: "Trotter", anchorIds: ["RLB","RLC","RLF","RLE"] },
  ],
};
