import type { PrimalShapeObject } from "./types";

// ─── Lamb — Primal Shape Object ─────────────────────────────────────────────────
// viewAspect=3.5. Head RIGHT, tail LEFT. Compact slender frame, elevated rack.
//
// Body decomposition:
//   LEG      (x 0.04–0.30): hindquarter
//   BREAST   (x 0.30–0.62, lower): belly/flap section
//   LOIN     (x 0.30–0.62, upper): dorsal loin
//   RACK     (x 0.62–0.78, upper): rib section
//   SHOULDER (x 0.62–0.86): forequarter (full height)
//   HEAD structural zone (x 0.86–0.99)

export const LAMB_SHAPE: PrimalShapeObject = {
  id: "lamb",
  type: "animal",
  mode: "segmented",
  viewAspect: 3.5,
  curveMode: "none",
  symmetry: "none",
  fill: true,

  anchors: [
    // Back line
    { id: "BK0", x: 0.07, y: 0.24 }, // rump top
    { id: "BK1", x: 0.30, y: 0.18 }, // Leg/Loin top
    { id: "BK2", x: 0.62, y: 0.14 }, // Loin/Rack top (elevated rack)
    { id: "BK3", x: 0.78, y: 0.16 }, // Rack/Shoulder top
    { id: "BK4", x: 0.86, y: 0.25 }, // neck junction

    // Mid split (y≈0.52)
    { id: "SP1", x: 0.30, y: 0.52 }, // Leg/Breast mid
    { id: "SP2", x: 0.62, y: 0.52 }, // Breast/Shoulder mid
    { id: "SP3", x: 0.86, y: 0.52 }, // head left mid

    // Belly line
    { id: "BL0", x: 0.12, y: 0.70 }, // leg belly
    { id: "BL1", x: 0.30, y: 0.70 }, // Leg/Breast belly
    { id: "BL2", x: 0.62, y: 0.72 }, // Breast/Shoulder belly
    { id: "BL3", x: 0.86, y: 0.68 }, // chest/throat

    // Rump / tail (left side)
    { id: "RT0", x: 0.03, y: 0.34 },
    { id: "RT1", x: 0.03, y: 0.54 },
    { id: "RT2", x: 0.06, y: 0.62 },

    // Head (right side)
    { id: "HD0", x: 0.91, y: 0.19 },
    { id: "HD1", x: 0.97, y: 0.26 },
    { id: "HD2", x: 0.99, y: 0.40 },
    { id: "HD3", x: 0.98, y: 0.54 },
    { id: "HD4", x: 0.94, y: 0.63 },
    { id: "HD5", x: 0.88, y: 0.68 },

    // Front legs
    { id: "FLA", x: 0.73, y: 0.72 }, { id: "FLD", x: 0.73, y: 0.97 },
    { id: "FLB", x: 0.79, y: 0.72 }, { id: "FLE", x: 0.79, y: 0.97 },
    { id: "FLC", x: 0.85, y: 0.72 }, { id: "FLF", x: 0.85, y: 0.97 },

    // Rear legs
    { id: "RLA", x: 0.12, y: 0.71 }, { id: "RLD", x: 0.12, y: 0.97 },
    { id: "RLB", x: 0.18, y: 0.71 }, { id: "RLE", x: 0.18, y: 0.97 },
    { id: "RLC", x: 0.26, y: 0.71 }, { id: "RLF", x: 0.26, y: 0.97 },
  ],

  edges: [
    ["BK0","BK1"], ["BK1","BK2"], ["BK2","BK3"], ["BK3","BK4"],
    ["BK4","HD0"], ["HD0","HD1"], ["HD1","HD2"], ["HD2","HD3"], ["HD3","HD4"], ["HD4","HD5"], ["HD5","BL3"],
    ["BL3","BL2"], ["BL2","BL1"], ["BL1","BL0"],
    ["BL0","RT2"], ["RT2","RT1"], ["RT1","RT0"], ["RT0","BK0"],
    ["BK1","SP1"], ["BK2","SP2"], ["BK4","SP3"],
    ["SP1","SP2"], ["SP2","SP3"],
    ["SP1","BL1"], ["SP2","BL2"], ["SP3","BL3"],
    ["FLA","FLB"], ["FLB","FLC"], ["FLA","FLD"], ["FLD","FLE"], ["FLE","FLF"], ["FLF","FLC"], ["FLB","FLE"],
    ["RLA","RLB"], ["RLB","RLC"], ["RLA","RLD"], ["RLD","RLE"], ["RLE","RLF"], ["RLF","RLC"], ["RLB","RLE"],
  ],

  zones: [
    {
      id: "leg",
      type: "primal",
      label: "Leg",
      color: "#3ab4d4",
      anchorIds: ["BK0","BK1","SP1","BL1","BL0","RT2","RT1","RT0"],
      labelX: 0.15, labelY: 0.38,
    },
    {
      id: "breast",
      type: "primal",
      label: "Breast",
      shortLabel: "Flap",
      color: "#d44a6e",
      anchorIds: ["SP1","SP2","BL2","BL1"],
      labelX: 0.46, labelY: 0.62,
    },
    {
      id: "loin",
      type: "primal",
      label: "Loin",
      color: "#c4d43a",
      anchorIds: ["BK1","BK2","SP2","SP1"],
      labelX: 0.46, labelY: 0.33,
    },
    {
      id: "rack",
      type: "primal",
      label: "Rack",
      color: "#e8c03a",
      // Rack is upper portion of shoulder-rack combined — x=0.62–0.78 upper half
      anchorIds: ["BK2","BK3","SP2"],
      labelX: 0.70, labelY: 0.28,
    },
    {
      id: "shoulder",
      type: "primal",
      label: "Shoulder",
      color: "#e8763a",
      // Full-height from x=0.62 to x=0.86 but below rack for upper and all lower
      anchorIds: ["BK3","BK4","SP3","BL3","BL2","SP2"],
      labelX: 0.74, labelY: 0.46,
    },
    // Body outline silhouette (rendered as background)
    {
      id: "body-outline",
      type: "body",
      label: "Body",
      anchorIds: ["BK0","BK1","BK2","BK3","BK4","HD0","HD1","HD2","HD3","HD4","HD5","BL3","BL2","BL1","BL0","RT2","RT1","RT0"],
    },
    // Structural (invisible — body outline provides silhouette)
    { id: "head", type: "head", label: "Head",
      anchorIds: ["BK4","HD0","HD1","HD2","HD3","HD4","HD5","BL3","SP3"] },
    { id: "fl1", type: "limb", label: "Shank", anchorIds: ["FLA","FLB","FLE","FLD"] },
    { id: "fl2", type: "limb", label: "Shank", anchorIds: ["FLB","FLC","FLF","FLE"] },
    { id: "rl1", type: "limb", label: "Shank", anchorIds: ["RLA","RLB","RLE","RLD"] },
    { id: "rl2", type: "limb", label: "Shank", anchorIds: ["RLB","RLC","RLF","RLE"] },
  ],
};
