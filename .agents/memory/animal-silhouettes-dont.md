---
name: Animal silhouette rendering
description: How silhouettes work in PrimalButcherApp vs kitchen-reference/intelligence, and what NOT to do.
---

## Two systems — same principle, different paths

### PrimalButcherApp (`/primal-butcher`)
- Renderer: `WireframeViewport` in `PrimalButcherApp.tsx`
- Silhouette source: `src/engine/primal-silhouette.ts` → `getSilhouette(template.id)`
- Engine IDs: "cow" | "pig" | "chicken" | "lamb" | "fish" (NOT "beef"/"pork")
- Layer order: silhouette bodyPath → region overlays → zone polygons → wireframe edges → anchors
- Silhouette fill: `rgba(255,255,255,0.07)` — NOT a solid dark color (it blends into the dark bg)
- Silhouette stroke: `rgba(255,255,255,0.22)` — anything below ~15% opacity is invisible on dark bg
- Region overlay fillOpacity: `0.30 selected / 0.15 hovered / 0.06 idle` (not 0.03 — too faint)

### Kitchen Reference / Kitchen Intelligence
- Renderer: `AnimalViewport` → always `BezierViewport` (vertex polygon path REMOVED in 2026-05)
- Silhouette source: `src/data/animal-diagrams.ts` (`diagram.bodyPath`) — bezier clipPath approach
- Diagram IDs: "beef" | "pork" | "lamb" | "chicken" | "fish"
- Each species has its own coordinate space (beef 480×210, pork 460×200, etc.)
- `clipPath` contains bodyPath + legPaths; primal polygons sit inside the clip group

## Hard rules

- **Never use PrimalShapeRenderer for animal silhouettes.** It uses vertex polygons (anchor coords) which produce abstract wireframe grids, not anatomical shapes. Removed from `index.ts` barrel.
- **Never include wing anchors (WG0/WG1/WG2) in chicken body-outline zone.** They sit at y≈0.04 (near top of frame) and create a dorsal-fin spike — the body looks identical to a fish profile.
- **Never fill silhouette body with a solid dark color.** Use low-opacity white: `rgba(255,255,255,0.07)`.
- **Never use two separate rectangle paths for the chicken wing region.** One closed organic shape only.

## Chicken silhouette anatomy (CHICKEN_BODY in primal-silhouette.ts)

The fixed shape: head upper-left (x≈0.06–0.26), flat back across top (y≈0.12–0.20), raised compact tail upper-right (x≈0.88–0.92), TWO legs hanging down center-right (x≈0.60–0.76 → y=0.82), large breast lower-left. No path segment goes above y=0.12.

**Why this matters:** Old wing section reached y=0.03–0.08 — a spike shape identical to the fish dorsal fin — causing "chicken renders as fish" bug in both the silhouette and the vertex renderer.

## Coordinate spaces (do not mix)

- `animal-diagrams.ts` / BezierViewport: pixel coords per animal (480×210, 460×200, etc.)
- `primal-silhouette.ts` / WireframeViewport: normalized 0–1, viewBox `"0 0 1 1"`, square
- `animal-shapes/*.ts` / PrimalShapeRenderer (retired): normalized 0–1, x scaled by `viewAspect`
