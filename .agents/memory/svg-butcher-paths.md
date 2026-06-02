---
name: SVG butcher silhouette technique
description: How to draw anatomically recognisable animal side-profile silhouettes in SVG for butcher-guide diagrams.
---

## Rules

**Squared muzzle (cattle):** Use an explicit `L x,y` straight-line segment for the face front so it reads as flat/vertical rather than a rounded curve. e.g. `... Q 4,72 4,84 L 4,116 Q 10,133 ...` creates a 32px tall flat face.

**Withers hump (cattle/lamb):** Use an explicit `L x,y` peak node on the topline rather than relying on bezier control points: `... Q 200,26 165,26 L 148,18 Q 128,28 105,36 ...` gives a clear 8px hump above the back at y=26.

**Rounded snout (pig):** Use smooth `Q` curves on both sides of the nose tip — do NOT use an `L` segment, as that makes it read as cattle. The roundedness is the key pig identifier.

**Sheep/lamb snout:** Narrower and slightly pointed. Keep the curve but make it shallower (less leftward protrusion) than cattle.

**Chicken:** Needs a small separate triangle accent path for the beak (`M 12,91 L 0,85 L 0,99 Z`) and a comb path. The body should be rounder/more circular than quadrupeds.

## AnimalDiagram.tsx rendering

- Removed `style={{ maxHeight: 210 }}` so diagrams scale to fill container width
- Body fill: `#0c1628` (near-black with blue tint, visible against dark bg)
- Body stroke: `#1d4ed8` (blue-700), strokeWidth: `2` — clearly visible
- Primal label fontSize: `9` (was 7.5)
- Selected primal fillOpacity: `0.65` (was 0.58)

**Why:** The previous oval blobs were unrecognisable. The key SVG tricks (L for squared muzzle, L peak for withers) are not intuitive — document them here to avoid guessing next time.

**How to apply:** When drawing side-view animal silhouettes, always trace the topline and face separately. The face/muzzle shape is the primary identifier for each species.
