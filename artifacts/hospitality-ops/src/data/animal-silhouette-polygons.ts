// SVG polygon points per primal per animal. Coords are 0-1 ratios of the
// silhouette image's bounding box. All animals face RIGHT.
//
// Polygons are hand-authored to follow real anatomy (chuck is a wedge over
// the front shoulder, brisket is a flap underneath it, round wraps the hip,
// etc). They can extend slightly beyond the body edge because the CSS mask
// on the parent clips everything to the silhouette outline.

export type PolygonPoints = string; // "x1,y1 x2,y2 …"

export const PRIMAL_POLYGONS: Record<string, Record<string, PolygonPoints>> = {
  // ─── Beef (cow facing right) ────────────────────────────────────────────
  // Reference: chuck/rib/short-loin/sirloin/round across the back (front→rear);
  // brisket/plate/flank along the lower belly (front→rear).
  beef: {
    chuck:        "0.78,0.40 0.82,0.50 0.78,0.60 0.62,0.60 0.60,0.40",
    rib:          "0.62,0.40 0.62,0.56 0.50,0.56 0.50,0.40",
    "short-loin": "0.50,0.40 0.50,0.56 0.38,0.56 0.38,0.40",
    sirloin:      "0.38,0.40 0.38,0.56 0.26,0.56 0.26,0.40",
    round:        "0.26,0.40 0.26,0.56 0.20,0.68 0.04,0.68 0.04,0.42",
    brisket:      "0.78,0.60 0.62,0.60 0.62,0.68 0.78,0.68",
    plate:        "0.62,0.56 0.40,0.56 0.40,0.68 0.62,0.68",
    flank:        "0.40,0.56 0.26,0.56 0.26,0.68 0.40,0.68",
  },

  // ─── Pork (pig facing right) ────────────────────────────────────────────
  pork: {
    shoulder:     "0.78,0.40 0.80,0.50 0.78,0.62 0.60,0.62 0.58,0.40",
    loin:         "0.58,0.40 0.58,0.55 0.30,0.55 0.30,0.40",
    ham:          "0.30,0.40 0.30,0.62 0.20,0.72 0.04,0.70 0.04,0.42",
    belly:        "0.58,0.55 0.30,0.55 0.30,0.70 0.58,0.70",
    hock:         "0.78,0.62 0.62,0.62 0.62,0.80 0.78,0.80",
  },

  // ─── Lamb (sheep facing right) ──────────────────────────────────────────
  lamb: {
    shoulder:     "0.78,0.40 0.80,0.52 0.78,0.62 0.60,0.62 0.58,0.40",
    rack:         "0.58,0.40 0.58,0.55 0.46,0.55 0.46,0.40",
    loin:         "0.46,0.40 0.46,0.55 0.34,0.55 0.34,0.40",
    leg:          "0.34,0.40 0.34,0.55 0.26,0.68 0.06,0.68 0.06,0.42",
    breast:       "0.58,0.55 0.34,0.55 0.34,0.70 0.58,0.70",
  },

  // ─── Chicken (hen facing right) ─────────────────────────────────────────
  // Body is centred and round; comb pokes up at top-right, legs hang down.
  chicken: {
    back:         "0.30,0.30 0.65,0.30 0.65,0.45 0.30,0.45",
    breast:       "0.45,0.42 0.68,0.42 0.68,0.65 0.45,0.65",
    wing:         "0.25,0.34 0.50,0.34 0.50,0.55 0.25,0.55",
    maryland:     "0.22,0.55 0.55,0.55 0.55,0.82 0.22,0.82",
  },

  // ─── Fish (round fish facing right) ─────────────────────────────────────
  fish: {
    head:           "0.74,0.20 0.96,0.30 0.96,0.70 0.74,0.78",
    "upper-fillet": "0.22,0.16 0.74,0.20 0.74,0.50 0.22,0.50",
    belly:          "0.22,0.50 0.74,0.50 0.74,0.80 0.22,0.82",
    tail:           "0.02,0.30 0.22,0.20 0.22,0.80 0.02,0.70",
  },
};

// Approximate label anchor (centre of mass-ish) for the primal callout in
// the same 0-1 coordinate space. Used when a primal is selected to position
// the floating label.
export const PRIMAL_LABEL_ANCHORS: Record<string, Record<string, { x: number; y: number }>> = {
  beef: {
    chuck:        { x: 0.70, y: 0.48 },
    rib:          { x: 0.56, y: 0.48 },
    "short-loin": { x: 0.44, y: 0.48 },
    sirloin:      { x: 0.32, y: 0.48 },
    round:        { x: 0.15, y: 0.52 },
    brisket:      { x: 0.70, y: 0.64 },
    plate:        { x: 0.50, y: 0.62 },
    flank:        { x: 0.33, y: 0.62 },
  },
  pork: {
    shoulder: { x: 0.70, y: 0.50 },
    loin:     { x: 0.44, y: 0.48 },
    ham:      { x: 0.17, y: 0.55 },
    belly:    { x: 0.44, y: 0.62 },
    hock:     { x: 0.70, y: 0.72 },
  },
  lamb: {
    shoulder: { x: 0.70, y: 0.50 },
    rack:     { x: 0.52, y: 0.48 },
    loin:     { x: 0.40, y: 0.48 },
    leg:      { x: 0.18, y: 0.52 },
    breast:   { x: 0.46, y: 0.62 },
  },
  chicken: {
    back:     { x: 0.48, y: 0.38 },
    breast:   { x: 0.56, y: 0.55 },
    wing:     { x: 0.36, y: 0.45 },
    maryland: { x: 0.38, y: 0.70 },
  },
  fish: {
    head:           { x: 0.84, y: 0.50 },
    "upper-fillet": { x: 0.48, y: 0.35 },
    belly:          { x: 0.48, y: 0.65 },
    tail:           { x: 0.12, y: 0.50 },
  },
};
