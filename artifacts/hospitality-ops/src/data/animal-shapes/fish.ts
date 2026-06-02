import type { PrimalShapeObject } from "./types";

// ─── Round Fish — Primal Shape Object ───────────────────────────────────────────
// viewAspect=5. Head LEFT (fish convention — operculum faces left), tail RIGHT.
// Reference species: salmon, snapper, kingfish. Torpedo profile.
//
// NOTE: Fish are oriented HEAD LEFT (conventional fish anatomy diagram orientation)
// to match how fillets are read — pin bones left, tail right.
//
// Body decomposition:
//   HEAD       (x 0.01–0.18): head, collar, cheek
//   UPPER FILLET (x 0.18–0.90, upper): dorsal fillet above lateral line
//   BELLY      (x 0.18–0.90, lower): belly fillet below lateral line
//   TAIL       (x 0.90–0.99): tail section

export const FISH_SHAPE: PrimalShapeObject = {
  id: "fish",
  type: "animal",
  mode: "segmented",
  viewAspect: 5,
  curveMode: "none",
  symmetry: "none",
  fill: true,

  anchors: [
    // Dorsal (top) edge — head to tail
    { id: "DL0", x: 0.18, y: 0.22 }, // head/body junction top
    { id: "DL1", x: 0.40, y: 0.12 }, // dorsal front peak
    { id: "DL2", x: 0.65, y: 0.10 }, // dorsal mid peak
    { id: "DL3", x: 0.82, y: 0.18 }, // dorsal taper
    { id: "DL4", x: 0.92, y: 0.28 }, // tail start top

    // Lateral line (mid-body, divides upper/lower fillet)
    { id: "LL0", x: 0.18, y: 0.50 }, // head/body junction lateral
    { id: "LL1", x: 0.90, y: 0.50 }, // lateral line end
    { id: "LL2", x: 0.96, y: 0.50 }, // tail midpoint

    // Ventral (bottom) edge
    { id: "VL0", x: 0.18, y: 0.78 }, // head/body junction bottom
    { id: "VL1", x: 0.40, y: 0.84 }, // belly front
    { id: "VL2", x: 0.65, y: 0.86 }, // belly mid
    { id: "VL3", x: 0.82, y: 0.80 }, // belly taper
    { id: "VL4", x: 0.92, y: 0.70 }, // tail start bottom

    // Tail fork
    { id: "TL0", x: 0.98, y: 0.28 }, // tail fork top
    { id: "TL1", x: 0.99, y: 0.50 }, // tail tip
    { id: "TL2", x: 0.98, y: 0.72 }, // tail fork bottom

    // Head polygon (left side)
    { id: "HD0", x: 0.18, y: 0.22 }, // = DL0 (shared)
    { id: "HD1", x: 0.08, y: 0.18 }, // head top-left
    { id: "HD2", x: 0.02, y: 0.30 }, // eye/face left
    { id: "HD3", x: 0.01, y: 0.50 }, // jaw/mouth
    { id: "HD4", x: 0.02, y: 0.68 }, // lower jaw
    { id: "HD5", x: 0.08, y: 0.78 }, // throat/chin
    // HD bottom-right = VL0 (shared)
  ],

  edges: [
    // Dorsal
    ["DL0","DL1"], ["DL1","DL2"], ["DL2","DL3"], ["DL3","DL4"],
    // Tail
    ["DL4","TL0"], ["TL0","TL1"], ["TL1","TL2"], ["TL2","VL4"],
    // Ventral
    ["VL4","VL3"], ["VL3","VL2"], ["VL2","VL1"], ["VL1","VL0"],
    // Lateral line (divides upper/lower fillet)
    ["LL0","LL1"], ["LL1","LL2"], ["LL2","TL1"],
    ["LL1","DL3"], ["LL1","VL3"], // fin connections for structure
    // Head/body junction
    ["DL0","LL0"], ["LL0","VL0"],
    // Head polygon
    ["DL0","HD1"], ["HD1","HD2"], ["HD2","HD3"], ["HD3","HD4"], ["HD4","HD5"], ["HD5","VL0"],
    // Tail fin top/bottom
    ["DL4","LL2"], ["VL4","LL2"],
  ],

  zones: [
    // Body outline silhouette (rendered as background)
    {
      id: "body-outline",
      type: "body",
      label: "Body",
      anchorIds: ["DL0","DL1","DL2","DL3","DL4","TL0","TL1","TL2","VL4","VL3","VL2","VL1","VL0","HD5","HD4","HD3","HD2","HD1"],
    },
    {
      id: "head",
      type: "primal",
      label: "Head",
      color: "#9a4ad4",
      anchorIds: ["DL0","HD1","HD2","HD3","HD4","HD5","VL0","LL0"],
      labelX: 0.09, labelY: 0.50,
    },
    {
      id: "upper-fillet",
      type: "primal",
      label: "Upper Fillet",
      shortLabel: "Fillet",
      color: "#3ab4d4",
      anchorIds: ["DL0","DL1","DL2","DL3","DL4","TL0","TL1","LL2","LL1","LL0"],
      labelX: 0.55, labelY: 0.30,
    },
    {
      id: "belly",
      type: "primal",
      label: "Belly",
      shortLabel: "Belly",
      color: "#d44a9a",
      anchorIds: ["LL0","LL1","LL2","TL1","TL2","VL4","VL3","VL2","VL1","VL0"],
      labelX: 0.55, labelY: 0.70,
    },
    {
      id: "tail",
      type: "primal",
      label: "Tail",
      color: "#e8c03a",
      anchorIds: ["DL4","TL0","TL1","TL2","VL4"],
      labelX: 0.95, labelY: 0.50,
    },
  ],
};
