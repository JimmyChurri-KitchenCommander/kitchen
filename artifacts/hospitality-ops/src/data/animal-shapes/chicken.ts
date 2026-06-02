import type { PrimalShapeObject } from "./types";

// ─── Chicken — Primal Shape Object ──────────────────────────────────────────────
// viewAspect=2.5. Head RIGHT, tail LEFT. Oval body, wing arc upper-right.
//
// Body decomposition:
//   BACK     (lower band): dorsal back section
//   BREAST   (upper-center): the white meat forward section
//   WING     (upper-right arc): wing attachment
//   MARYLAND (right haunch): thigh + drumstick

export const CHICKEN_SHAPE: PrimalShapeObject = {
  id: "chicken",
  type: "animal",
  mode: "segmented",
  viewAspect: 2.5,
  curveMode: "none",
  symmetry: "none",
  fill: true,

  anchors: [
    // Outer body (oval shape — polygon approximation)
    { id: "BK0", x: 0.10, y: 0.35 }, // tail/rump top-left
    { id: "BK1", x: 0.18, y: 0.22 }, // upper left back
    { id: "BK2", x: 0.35, y: 0.14 }, // back top (breast/back boundary top)
    { id: "BK3", x: 0.58, y: 0.12 }, // breast peak
    { id: "BK4", x: 0.75, y: 0.16 }, // shoulder top
    { id: "BK5", x: 0.86, y: 0.26 }, // head junction top

    // Mid split (horizontal at y≈0.55)
    { id: "SP0", x: 0.18, y: 0.55 }, // tail/back mid-left
    { id: "SP1", x: 0.35, y: 0.52 }, // breast/back mid-top (breast left boundary bottom)
    { id: "SP2", x: 0.58, y: 0.50 }, // breast/maryland mid
    { id: "SP3", x: 0.75, y: 0.52 }, // maryland/shoulder mid
    { id: "SP4", x: 0.86, y: 0.55 }, // head mid

    // Belly / lower arc
    { id: "BL0", x: 0.12, y: 0.72 }, // tail belly left
    { id: "BL1", x: 0.35, y: 0.78 }, // back/breast belly
    { id: "BL2", x: 0.58, y: 0.76 }, // breast/maryland belly
    { id: "BL3", x: 0.78, y: 0.72 }, // chest lower
    { id: "BL4", x: 0.86, y: 0.65 }, // throat

    // Rump (left side)
    { id: "RT0", x: 0.04, y: 0.42 }, // tail base
    { id: "RT1", x: 0.06, y: 0.60 }, // rump lower

    // Head/beak (right side)
    { id: "HD0", x: 0.90, y: 0.20 }, // comb/head top
    { id: "HD1", x: 0.97, y: 0.30 }, // face
    { id: "HD2", x: 0.99, y: 0.42 }, // beak tip
    { id: "HD3", x: 0.97, y: 0.54 }, // lower beak
    { id: "HD4", x: 0.92, y: 0.62 }, // wattle/throat
    { id: "HD5", x: 0.88, y: 0.66 }, // neck base

    // Wing (upper arc, above body)
    { id: "WG0", x: 0.64, y: 0.04 }, // wing tip
    { id: "WG1", x: 0.76, y: 0.08 }, // wing joint
    { id: "WG2", x: 0.80, y: 0.14 }, // wing root

    // Legs (reduced — chicken legs are shorter)
    { id: "FLA", x: 0.64, y: 0.77 }, { id: "FLD", x: 0.64, y: 0.97 },
    { id: "FLB", x: 0.72, y: 0.77 }, { id: "FLE", x: 0.72, y: 0.97 },
    { id: "RLA", x: 0.18, y: 0.73 }, { id: "RLD", x: 0.18, y: 0.97 },
    { id: "RLB", x: 0.26, y: 0.73 }, { id: "RLE", x: 0.26, y: 0.97 },
  ],

  edges: [
    // Outer body top
    ["BK0","BK1"], ["BK1","BK2"], ["BK2","BK3"], ["BK3","BK4"], ["BK4","BK5"],
    // Head
    ["BK5","HD0"], ["HD0","HD1"], ["HD1","HD2"], ["HD2","HD3"], ["HD3","HD4"], ["HD4","HD5"], ["HD5","BL4"],
    // Belly
    ["BL4","BL3"], ["BL3","BL2"], ["BL2","BL1"], ["BL1","BL0"],
    // Rump
    ["BL0","RT1"], ["RT1","RT0"], ["RT0","BK0"],
    // Internal dividers
    ["BK2","SP1"], ["BK4","SP3"], ["BK5","SP4"],
    ["SP1","SP3"], ["SP3","SP4"],
    ["SP0","SP1"], ["BK1","SP0"],
    ["SP0","BL0"], ["SP1","BL1"], ["SP3","BL2"], ["SP3","BL3"], ["SP4","BL4"],
    // Wing
    ["BK3","WG0"], ["WG0","WG1"], ["WG1","WG2"], ["WG2","BK4"],
    ["BK4","WG1"],
    // Legs
    ["FLA","FLB"], ["FLA","FLD"], ["FLD","FLE"], ["FLE","FLB"],
    ["RLA","RLB"], ["RLA","RLD"], ["RLD","RLE"], ["RLE","RLB"],
  ],

  zones: [
    {
      id: "breast",
      type: "primal",
      label: "Breast",
      color: "#e8c03a",
      anchorIds: ["BK2","BK3","BK4","SP3","SP1"],
      labelX: 0.56, labelY: 0.30,
    },
    {
      id: "wing",
      type: "primal",
      label: "Wing",
      color: "#e8763a",
      anchorIds: ["BK3","WG0","WG1","WG2","BK4"],
      labelX: 0.72, labelY: 0.10,
    },
    {
      id: "maryland",
      type: "primal",
      label: "Maryland",
      shortLabel: "Leg",
      color: "#7ad43a",
      anchorIds: ["BK4","BK5","SP4","BL4","BL3","SP3"],
      labelX: 0.80, labelY: 0.40,
    },
    {
      id: "back",
      type: "primal",
      label: "Back",
      color: "#9a4ad4",
      anchorIds: ["BK0","BK1","SP0","BL0","RT1","RT0"],
      labelX: 0.13, labelY: 0.50,
    },
    // Body outline silhouette (rendered as background) — wing excluded to prevent dorsal-fin artifact
    {
      id: "body-outline",
      type: "body",
      label: "Body",
      anchorIds: ["BK0","BK1","BK2","BK3","BK4","BK5","HD0","HD1","HD2","HD3","HD4","HD5","BL4","BL3","BL2","BL1","BL0","RT1","RT0"],
    },
    // Structural (invisible — body outline provides silhouette)
    { id: "head", type: "head", label: "Head",
      anchorIds: ["BK5","HD0","HD1","HD2","HD3","HD4","HD5","BL4","SP4"] },
    { id: "fl1", type: "limb", label: "Drumstick", anchorIds: ["FLA","FLB","FLE","FLD"] },
    { id: "rl1", type: "limb", label: "Drumstick", anchorIds: ["RLA","RLB","RLE","RLD"] },
  ],
};
