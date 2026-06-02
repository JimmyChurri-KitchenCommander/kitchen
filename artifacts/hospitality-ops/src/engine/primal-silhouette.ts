/* =========================================================
   PRIMAL SILHOUETTE LAYER
   ---------------------------------------------------------
   Non-authoritative visual substrate for the Primal Butcher UI.

   RULES:
   - All paths are EXPLICIT SVG path strings — no generation.
   - Coordinate space: SVG (x: 0→1 left→right, y: 0→1 top→bottom).
   - Animals face LEFT (head at low x, rear at high x).
   - These paths DO NOT define geometry, zones, edges, or anchors.
   - Topology is owned by PrimalEngine. Silhouettes are decoration only.
   - Region paths are overlays that react to zone selection state.
   - zoneId on a region is the primary link; silhouetteRegionId on a zone
     provides the reverse link for zones that share a silhouette region.

   LAYER ORDER (in viewport SVG):
     0   — background / diagnostic grid
     0.5 — silhouette body + region overlays  ← this file
     1   — zone polygons (PrimalRenderEngine.renderZones)
     2   — wireframe edges (PrimalRenderEngine.renderEdges)
     3   — anchor nodes + labels

   ========================================================= */

import type { AnimalId, ZoneColorToken } from "./primal-engine";

export interface SilhouetteRegion {
  zoneId:     string;
  path:       string;
  colorToken: ZoneColorToken;
}

export interface AnimalSilhouette {
  bodyPath: string;
  regions:  SilhouetteRegion[];
}

/* =========================================================
   COW
   Facing left. Horns up-left. Four legs. Elongated topline.
   Regions: head | chuck | rib | short_loin | round
   Ventral zones (brisket/plate/flank) use silhouetteRegionId
   on their zone definition to link to the dorsal regions above.
   ========================================================= */

const COW_BODY =
  "M 0.29 0.19 " +
  "Q 0.21 0.24 0.18 0.27 " +
  "Q 0.11 0.30 0.07 0.38 " +
  "Q 0.03 0.44 0.04 0.52 " +
  "Q 0.05 0.60 0.12 0.63 " +
  "Q 0.20 0.65 0.22 0.62 " +
  "Q 0.24 0.67 0.21 0.73 " +
  "L 0.28 0.73 L 0.28 0.82 L 0.23 0.82 L 0.23 0.71 " +
  "L 0.39 0.71 L 0.39 0.82 L 0.34 0.82 L 0.34 0.71 " +
  "C 0.44 0.72 0.57 0.72 0.62 0.70 " +
  "L 0.60 0.82 L 0.55 0.82 L 0.55 0.70 " +
  "L 0.67 0.70 L 0.70 0.82 L 0.65 0.82 L 0.65 0.70 " +
  "Q 0.78 0.67 0.84 0.62 " +
  "Q 0.93 0.55 0.93 0.44 " +
  "Q 0.92 0.33 0.86 0.29 " +
  "C 0.78 0.26 0.60 0.26 0.48 0.27 " +
  "Q 0.40 0.28 0.35 0.31 " +
  "Q 0.31 0.32 0.28 0.29 " +
  "Q 0.25 0.24 0.29 0.19 Z";

const COW_REGIONS: SilhouetteRegion[] = [
  {
    zoneId: "head",
    colorToken: "HEAD_ZONE",
    path:
      "M 0.04 0.18 Q 0.01 0.40 0.02 0.65 " +
      "L 0.32 0.68 L 0.32 0.22 Z",
  },
  {
    zoneId: "chuck",
    colorToken: "SHOULDER_ZONE",
    path: "M 0.30 0.22 L 0.52 0.22 L 0.52 0.73 L 0.30 0.72 Z",
  },
  {
    zoneId: "rib",
    colorToken: "RIB_ZONE",
    path: "M 0.52 0.22 L 0.63 0.22 L 0.63 0.73 L 0.52 0.73 Z",
  },
  {
    zoneId: "short_loin",
    colorToken: "LOIN_ZONE",
    path: "M 0.63 0.22 L 0.73 0.22 L 0.73 0.73 L 0.63 0.73 Z",
  },
  {
    zoneId: "round",
    colorToken: "LEG_ZONE",
    path:
      "M 0.72 0.22 L 0.95 0.42 " +
      "Q 0.95 0.56 0.84 0.64 " +
      "L 0.72 0.72 Z",
  },
];

/* =========================================================
   PIG
   Facing left. Round body. Short legs. Curly tail at rear.
   Regions: head | shoulder | loin | ham | belly
   Jowl zone uses silhouetteRegionId "head".
   HindHock has no region (limb structural only).
   ========================================================= */

const PIG_BODY =
  "M 0.13 0.26 " +
  "Q 0.06 0.26 0.03 0.33 " +
  "Q 0.01 0.40 0.03 0.47 " +
  "Q 0.06 0.54 0.14 0.54 " +
  "Q 0.20 0.54 0.22 0.51 " +
  "Q 0.24 0.57 0.20 0.63 " +
  "L 0.24 0.63 L 0.24 0.82 L 0.19 0.82 L 0.19 0.63 " +
  "L 0.34 0.63 L 0.36 0.82 L 0.31 0.82 L 0.31 0.63 " +
  "C 0.44 0.65 0.56 0.65 0.62 0.63 " +
  "L 0.60 0.82 L 0.55 0.82 L 0.55 0.63 " +
  "L 0.67 0.63 L 0.70 0.82 L 0.65 0.82 L 0.65 0.63 " +
  "Q 0.78 0.61 0.84 0.56 " +
  "Q 0.91 0.50 0.92 0.43 " +
  "Q 0.94 0.35 0.91 0.29 " +
  "Q 0.88 0.27 0.90 0.22 " +
  "Q 0.94 0.25 0.93 0.30 " +
  "Q 0.90 0.22 0.84 0.21 " +
  "C 0.74 0.19 0.60 0.18 0.48 0.20 " +
  "Q 0.40 0.21 0.34 0.23 " +
  "Q 0.26 0.24 0.22 0.26 " +
  "Q 0.18 0.24 0.13 0.26 Z";

const PIG_REGIONS: SilhouetteRegion[] = [
  {
    zoneId: "head",
    colorToken: "HEAD_ZONE",
    path:
      "M 0.02 0.24 Q 0.00 0.40 0.01 0.56 " +
      "L 0.24 0.58 L 0.24 0.22 Z",
  },
  {
    zoneId: "shoulder",
    colorToken: "SHOULDER_ZONE",
    path: "M 0.22 0.22 L 0.46 0.21 L 0.46 0.66 L 0.22 0.67 Z",
  },
  {
    zoneId: "loin",
    colorToken: "LOIN_ZONE",
    path: "M 0.44 0.20 L 0.70 0.20 L 0.70 0.65 L 0.44 0.66 Z",
  },
  {
    zoneId: "ham",
    colorToken: "LEG_ZONE",
    path:
      "M 0.66 0.19 L 0.94 0.32 " +
      "Q 0.95 0.52 0.82 0.63 " +
      "L 0.66 0.65 Z",
  },
  {
    zoneId: "belly",
    colorToken: "BELLY_ZONE",
    path: "M 0.22 0.54 L 0.70 0.52 L 0.70 0.68 L 0.22 0.70 Z",
  },
];

/* =========================================================
   CHICKEN
   Facing left. Round plump body. Flat back. Raised compact tail.
   Two legs hanging from centre-rear. Large breast forward.
   Regions: crown | breast | back | wing | thigh
   Drumstick zone uses silhouetteRegionId "thigh".
   ========================================================= */

const CHICKEN_BODY =
  "M 0.06 0.42 " +
  "Q 0.04 0.28 0.12 0.22 " +
  "Q 0.18 0.18 0.26 0.20 " +
  "Q 0.32 0.20 0.36 0.16 " +
  "Q 0.46 0.12 0.58 0.12 " +
  "Q 0.66 0.12 0.74 0.16 " +
  "Q 0.82 0.18 0.88 0.26 " +
  "Q 0.92 0.32 0.90 0.40 " +
  "Q 0.88 0.46 0.82 0.50 " +
  "L 0.76 0.50 L 0.76 0.82 L 0.72 0.82 L 0.72 0.50 " +
  "L 0.66 0.50 L 0.64 0.82 L 0.60 0.82 L 0.60 0.50 " +
  "Q 0.48 0.56 0.34 0.64 " +
  "Q 0.20 0.68 0.12 0.60 " +
  "Q 0.06 0.54 0.04 0.48 " +
  "Q 0.04 0.44 0.06 0.42 Z";

const CHICKEN_REGIONS: SilhouetteRegion[] = [
  {
    zoneId: "crown",
    colorToken: "HEAD_ZONE",
    path: "M 0.02 0.18 Q 0.02 0.36 0.02 0.54 L 0.28 0.56 L 0.28 0.18 Z",
  },
  {
    zoneId: "breast",
    colorToken: "LOIN_ZONE",
    path: "M 0.26 0.36 L 0.62 0.36 L 0.62 0.66 L 0.26 0.68 Z",
  },
  {
    zoneId: "back",
    colorToken: "BELLY_ZONE",
    path:
      "M 0.60 0.12 L 0.94 0.28 " +
      "Q 0.94 0.48 0.84 0.54 " +
      "L 0.60 0.52 Z",
  },
  {
    zoneId: "wing",
    colorToken: "RIB_ZONE",
    path: "M 0.32 0.14 L 0.60 0.14 L 0.60 0.42 Q 0.48 0.48 0.32 0.42 Z",
  },
  {
    zoneId: "thigh",
    colorToken: "LEG_ZONE",
    path: "M 0.56 0.46 L 0.82 0.46 L 0.82 0.84 L 0.56 0.84 Z",
  },
];

/* =========================================================
   LAMB
   Facing left. Small head. Rounded woolly body. Four legs.
   Regions: head | shoulder | rack | loin | breast | leg
   Shank zone uses silhouetteRegionId "leg".
   ========================================================= */

const LAMB_BODY =
  "M 0.12 0.27 " +
  "Q 0.05 0.26 0.02 0.35 " +
  "Q 0.00 0.43 0.03 0.49 " +
  "Q 0.07 0.53 0.14 0.50 " +
  "Q 0.19 0.48 0.20 0.44 " +
  "Q 0.22 0.50 0.18 0.57 " +
  "L 0.22 0.57 L 0.22 0.82 L 0.17 0.82 L 0.17 0.57 " +
  "L 0.31 0.57 L 0.31 0.82 L 0.26 0.82 L 0.26 0.57 " +
  "C 0.38 0.63 0.54 0.64 0.64 0.62 " +
  "Q 0.74 0.64 0.78 0.68 " +
  "L 0.78 0.82 L 0.73 0.82 L 0.73 0.66 " +
  "L 0.84 0.66 L 0.86 0.82 L 0.81 0.82 L 0.81 0.64 " +
  "Q 0.90 0.56 0.92 0.44 " +
  "Q 0.92 0.33 0.88 0.25 " +
  "C 0.80 0.19 0.64 0.17 0.50 0.17 " +
  "Q 0.40 0.17 0.34 0.18 " +
  "Q 0.28 0.19 0.24 0.22 " +
  "Q 0.20 0.22 0.16 0.24 " +
  "Q 0.14 0.24 0.12 0.27 Z";

const LAMB_REGIONS: SilhouetteRegion[] = [
  {
    zoneId: "head",
    colorToken: "HEAD_ZONE",
    path:
      "M 0.00 0.24 Q 0.00 0.40 0.01 0.56 " +
      "L 0.24 0.58 L 0.24 0.22 Z",
  },
  {
    zoneId: "shoulder",
    colorToken: "SHOULDER_ZONE",
    path: "M 0.20 0.17 L 0.46 0.16 L 0.46 0.64 L 0.20 0.62 Z",
  },
  {
    zoneId: "rack",
    colorToken: "RIB_ZONE",
    path: "M 0.44 0.16 L 0.64 0.16 L 0.64 0.64 L 0.44 0.64 Z",
  },
  {
    zoneId: "loin",
    colorToken: "LOIN_ZONE",
    path: "M 0.60 0.16 L 0.82 0.18 L 0.82 0.68 L 0.60 0.64 Z",
  },
  {
    zoneId: "breast",
    colorToken: "BELLY_ZONE",
    path: "M 0.20 0.54 L 0.72 0.52 L 0.72 0.68 L 0.20 0.70 Z",
  },
  {
    zoneId: "leg",
    colorToken: "LEG_ZONE",
    path:
      "M 0.70 0.20 L 0.94 0.30 " +
      "Q 0.96 0.54 0.86 0.67 " +
      "L 0.70 0.68 Z",
  },
];

/* =========================================================
   FISH
   Facing left. Oval body. Dorsal + pectoral fins (structural).
   Tail fan at right (structural, not a primal zone).
   Regions: head | collar | loin | belly | tail
   Fins are structural wireframe only — no region overlay.
   ========================================================= */

const FISH_BODY =
  "M 0.06 0.36 " +
  "Q 0.04 0.28 0.12 0.24 " +
  "Q 0.20 0.22 0.28 0.22 " +
  "Q 0.36 0.18 0.44 0.13 " +
  "Q 0.50 0.10 0.56 0.13 " +
  "Q 0.60 0.17 0.58 0.24 " +
  "C 0.68 0.22 0.76 0.24 0.80 0.26 " +
  "Q 0.84 0.18 0.90 0.15 " +
  "Q 0.96 0.20 0.96 0.28 " +
  "Q 0.96 0.38 0.94 0.38 " +
  "Q 0.96 0.48 0.96 0.54 " +
  "Q 0.96 0.60 0.90 0.58 " +
  "Q 0.84 0.55 0.80 0.50 " +
  "C 0.76 0.52 0.68 0.54 0.58 0.52 " +
  "Q 0.50 0.52 0.46 0.57 " +
  "Q 0.42 0.62 0.38 0.60 " +
  "Q 0.42 0.58 0.46 0.55 " +
  "Q 0.36 0.53 0.28 0.52 " +
  "Q 0.20 0.52 0.14 0.50 " +
  "Q 0.07 0.46 0.06 0.42 " +
  "Q 0.05 0.39 0.06 0.36 Z";

const FISH_REGIONS: SilhouetteRegion[] = [
  {
    zoneId: "head",
    colorToken: "HEAD_ZONE",
    path:
      "M 0.02 0.22 Q 0.02 0.40 0.02 0.54 " +
      "L 0.30 0.54 L 0.30 0.22 Z",
  },
  {
    zoneId: "collar",
    colorToken: "SHOULDER_ZONE",
    path: "M 0.26 0.18 L 0.56 0.18 L 0.56 0.56 L 0.26 0.56 Z",
  },
  {
    zoneId: "loin",
    colorToken: "LOIN_ZONE",
    path: "M 0.54 0.18 L 0.80 0.18 L 0.80 0.56 L 0.54 0.56 Z",
  },
  {
    zoneId: "belly",
    colorToken: "BELLY_ZONE",
    path: "M 0.26 0.44 L 0.80 0.44 L 0.80 0.62 L 0.26 0.62 Z",
  },
  {
    zoneId: "tail",
    colorToken: "LEG_ZONE",
    path: "M 0.78 0.18 L 0.96 0.34 L 0.96 0.58 L 0.78 0.54 Z",
  },
];

/* =========================================================
   REGISTRY
   ========================================================= */

const SILHOUETTES: Record<AnimalId, AnimalSilhouette> = {
  cow:     { bodyPath: COW_BODY,     regions: COW_REGIONS     },
  pig:     { bodyPath: PIG_BODY,     regions: PIG_REGIONS     },
  chicken: { bodyPath: CHICKEN_BODY, regions: CHICKEN_REGIONS },
  lamb:    { bodyPath: LAMB_BODY,    regions: LAMB_REGIONS    },
  fish:    { bodyPath: FISH_BODY,    regions: FISH_REGIONS    },
};

export function getSilhouette(id: AnimalId): AnimalSilhouette {
  return SILHOUETTES[id];
}
