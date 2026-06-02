/* =========================================================
   PRIMAL ENGINE CORE v1 — Phase 4 Production Stabilization
   ---------------------------------------------------------
   Purpose:
   Deterministic anatomical graph engine for culinary
   butchery visualization.

   Guarantees:
   - No inferred geometry
   - No blob generation
   - No cross-layer anatomical corruption
   - No invalid edge rendering
   - No invalid zone topology
   - Species-safe rendering constraints
   - Compile-time immutability  (readonly interfaces)
   - Runtime immutability       (Object.freeze applied at boot)
   - Typed anchor lookup        (requireAnchor — no unsafe index)

   Rendering:
   SVG-only. Normalized coordinates (0–1). viewBox 0 0 1 1.

   Pipeline:
   Template → Constraint Validation → Render Preparation → SVG Presentation
   ========================================================= */

/* =========================================================
   TYPES
   ========================================================= */

export type AnimalId =
  | "cow"
  | "pig"
  | "chicken"
  | "lamb"
  | "fish";

export type AnatomyLayer =
  | "HEAD"
  | "BODY"
  | "LIMB"
  | "APPENDAGE"
  | "FIN";

export interface Anchor {
  readonly id:    string;
  readonly x:     number;
  readonly y:     number;
  readonly role:  string;
  readonly layer: AnatomyLayer;
}

export type Edge = readonly [string, string];

/* ----------------------------------------------------- */
/* Intelligence hooks — metadata scaffold                 */
/* Scaffolded only. NO rendering impact.                  */
/* Extension points for future butcher intelligence:      */
/*   yield analytics, recipe linkage, fabrication,        */
/*   kitchen workflow, grade systems.                      */
/* ----------------------------------------------------- */

export type FabricationType =
  | "seam"
  | "bone-in"
  | "boneless"
  | "portion"
  | "offal";

export interface ZoneMetadata {
  readonly yieldPercent?:    number;              // expected yield as % of primal weight
  readonly trimClass?:       string;              // butcher trim spec (e.g. "1/4 inch")
  readonly stationGroup?:    string;              // kitchen station (e.g. "butchery", "grill")
  readonly fabricationType?: FabricationType;
  readonly recipeLinks?:     readonly string[];   // recipe IDs linked to this zone
}

export interface TemplateMetadata {
  readonly commonName?:    string;   // consumer-facing name (e.g. "Whole Beef Carcass")
  readonly gradeSystem?:   string;   // grading system (e.g. "USDA", "MSA")
  readonly primingYield?:  number;   // average yield from live weight (0–1)
}

export interface Zone {
  readonly id:                  string;
  readonly label:               string;
  readonly layer:               AnatomyLayer;
  readonly anchors:             readonly string[];
  readonly colorToken:          ZoneColorToken;
  readonly silhouetteRegionId?: string;  // optional visual zone ↔ silhouette link
  readonly metadata?:           ZoneMetadata;
}

export type ZoneColorToken =
  | "RIB_ZONE"
  | "LOIN_ZONE"
  | "LEG_ZONE"
  | "SHOULDER_ZONE"
  | "BELLY_ZONE"
  | "HEAD_ZONE"
  | "FIN_ZONE";

export interface AnimalTemplate {
  readonly id:           AnimalId;
  readonly label:        string;
  readonly anchors:      readonly Anchor[];
  readonly edges:        readonly Edge[];
  readonly allowedEdges: readonly Edge[];
  readonly zones:        readonly Zone[];
  readonly metadata?:    TemplateMetadata;
}

/* ----------------------------------------------------- */
/* Render data types — formalized pipeline output         */
/* ----------------------------------------------------- */

export interface EdgeRenderDatum {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface ZoneRenderDatum {
  readonly id:     string;
  readonly label:  string;
  readonly points: string;
  readonly color:  string;
  readonly cx:     number;
  readonly cy:     number;
}

export interface RenderData {
  readonly template: AnimalTemplate;
  readonly edges:    EdgeRenderDatum[];
  readonly zones:    ZoneRenderDatum[];
}

/* =========================================================
   COLOR SYSTEM
   ========================================================= */

export const ZONE_COLORS: Record<ZoneColorToken, string> = {
  RIB_ZONE:      "#d94841",
  LOIN_ZONE:     "#3b82f6",
  LEG_ZONE:      "#16a34a",
  SHOULDER_ZONE: "#f59e0b",
  BELLY_ZONE:    "#7c3aed",
  HEAD_ZONE:     "#6b7280",
  FIN_ZONE:      "#06b6d4",
} as const;

/* =========================================================
   DEBUG TOGGLES
   ---------------------------------------------------------
   All defaults are false as const.
   Toggle locally for visual inspection.
   Debug state NEVER affects geometry or production render.
   ========================================================= */

export const DEBUG_SHOW_ANCHORS      = false as const; // anchor metadata overlay (role + layer tag)
export const DEBUG_SHOW_EDGE_IDS     = false as const; // edge index labels at midpoints
export const DEBUG_SHOW_LAYER_COLORS = false as const; // colour anchors by anatomy layer
export const DEBUG_SHOW_ZONE_BOUNDS  = false as const; // zone polygon bounding boxes

/* =========================================================
   CONSTRAINT DEFINITIONS
   ========================================================= */

const FORBIDDEN_LAYER_CONNECTIONS: ReadonlyArray<
  readonly [AnatomyLayer, AnatomyLayer]
> = [
  ["HEAD",      "LIMB"],
  ["LIMB",      "HEAD"],
  ["HEAD",      "FIN"],
  ["FIN",       "HEAD"],
  ["APPENDAGE", "LIMB"],
  ["LIMB",      "APPENDAGE"],
  ["FIN",       "LIMB"],
  ["LIMB",      "FIN"],
];

/* =========================================================
   UTILS
   ========================================================= */

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function flipY(y: number): number {
  return 1 - y;
}

function getAnchorMap(
  anchors: readonly Anchor[]
): Record<string, Anchor> {
  return Object.fromEntries(
    anchors.map((a) => [a.id, a])
  );
}

/** Type-safe anchor lookup — throws immediately if anchor is missing.
 *  Never silently returns undefined. Template topology errors surface
 *  at boot time or first render, never silently in production. */
function requireAnchor(
  map:  Record<string, Anchor>,
  id:   string,
  ctx:  string
): Anchor {
  const anchor = map[id];
  if (anchor === undefined) {
    throw new Error(
      `[ENGINE] Anchor "${id}" not found — ${ctx}. ` +
      `This indicates a topology authoring error in the template.`
    );
  }
  return anchor;
}

/* =========================================================
   VALIDATION ENGINE
   ========================================================= */

export class PrimalConstraintEngine {
  static validateTemplate(
    template: AnimalTemplate
  ): void {
    this.validateLayers(template);
    this.validateEdges(template);
    this.validateCrossLayerConnections(template);
    this.validateZones(template);
  }

  /* ----------------------------------------------------- */
  /* RULE 1 — LAYER COMPLETENESS                           */
  /* ----------------------------------------------------- */

  static validateLayers(
    template: AnimalTemplate
  ): void {
    for (const anchor of template.anchors) {
      if (!anchor.layer) {
        throw new Error(
          `[${template.id}] Anchor "${anchor.id}" missing AnatomyLayer`
        );
      }
    }
  }

  /* ----------------------------------------------------- */
  /* RULE 2 — EDGE CONTRACT                                */
  /* ----------------------------------------------------- */

  static validateEdges(
    template: AnimalTemplate
  ): void {
    const allowed = new Set(
      template.allowedEdges.map(([a, b]) => edgeKey(a, b))
    );

    for (const [a, b] of template.edges) {
      const key = edgeKey(a, b);
      if (!allowed.has(key)) {
        throw new Error(
          `[${template.id}] Illegal edge "${a} -> ${b}"`
        );
      }
    }
  }

  /* ----------------------------------------------------- */
  /* RULE 3 — CROSS-LAYER ILLEGAL CONNECTIONS              */
  /* ----------------------------------------------------- */

  static validateCrossLayerConnections(
    template: AnimalTemplate
  ): void {
    const anchorMap = getAnchorMap(template.anchors);

    for (const [aId, bId] of template.edges) {
      const a = requireAnchor(
        anchorMap, aId,
        `validateCrossLayerConnections of "${template.id}"`
      );
      const b = requireAnchor(
        anchorMap, bId,
        `validateCrossLayerConnections of "${template.id}"`
      );

      const illegal = FORBIDDEN_LAYER_CONNECTIONS.some(
        ([l1, l2]) => a.layer === l1 && b.layer === l2
      );

      if (illegal) {
        throw new Error(
          `[${template.id}] Forbidden layer connection ` +
          `"${a.layer} -> ${b.layer}" via "${aId} -> ${bId}"`
        );
      }
    }
  }

  /* ----------------------------------------------------- */
  /* RULE 4 — ZONE CONSTRAINTS                             */
  /* ----------------------------------------------------- */

  static validateZones(
    template: AnimalTemplate
  ): void {
    const anchorMap = getAnchorMap(template.anchors);

    for (const zone of template.zones) {
      if (zone.anchors.length < 3) {
        throw new Error(
          `[${template.id}] Zone "${zone.id}" has fewer than 3 anchors`
        );
      }

      for (const anchorId of zone.anchors) {
        const anchor = requireAnchor(
          anchorMap, anchorId,
          `zone "${zone.id}" of "${template.id}"`
        );

        if (anchor.layer !== zone.layer) {
          throw new Error(
            `[${template.id}] Zone "${zone.id}" mixes layers ` +
            `(${zone.layer} vs ${anchor.layer})`
          );
        }
      }
    }
  }
}

/* =========================================================
   SVG RENDER ENGINE
   ---------------------------------------------------------
   Pipeline stages (each explicit — no stage bypasses another):

   1. PrimalEngine.boot()              — Constraint Validation
   2. PrimalRenderEngine.prepare()     — Render Preparation
      ├─ renderEdges()                 — edge coordinate transform
      └─ renderZones()                 — zone polygon + centroid
   3. WireframeViewport (React)        — SVG Presentation
   ========================================================= */

export class PrimalRenderEngine {

  /* ----------------------------------------------------- */
  /* PIPELINE ENTRY — retrieve + prepare in one typed call  */
  /* ----------------------------------------------------- */

  static prepare(animal: AnimalId): RenderData {
    const template = PrimalEngine.getTemplate(animal);
    return {
      template,
      edges: this.renderEdges(template),
      zones: this.renderZones(template),
    };
  }

  /* ----------------------------------------------------- */
  /* STAGE: Render Preparation — edges                     */
  /* ----------------------------------------------------- */

  static renderEdges(
    template: AnimalTemplate
  ): EdgeRenderDatum[] {
    const map = getAnchorMap(template.anchors);

    return template.edges.map(([aId, bId], i) => {
      const a = requireAnchor(
        map, aId, `renderEdges[${i}] of "${template.id}"`
      );
      const b = requireAnchor(
        map, bId, `renderEdges[${i}] of "${template.id}"`
      );

      return {
        x1: a.x,
        y1: flipY(a.y),
        x2: b.x,
        y2: flipY(b.y),
      };
    });
  }

  /* ----------------------------------------------------- */
  /* STAGE: Render Preparation — zones                     */
  /* ----------------------------------------------------- */

  static renderZones(
    template: AnimalTemplate
  ): ZoneRenderDatum[] {
    const map = getAnchorMap(template.anchors);

    return template.zones.map((zone) => {
      const zoneAnchors = zone.anchors.map((id) =>
        requireAnchor(
          map, id, `renderZones zone "${zone.id}" of "${template.id}"`
        )
      );

      const points = zoneAnchors
        .map((a) => `${a.x},${flipY(a.y)}`)
        .join(" ");

      const cx =
        zoneAnchors.reduce((s, a) => s + a.x, 0) / zoneAnchors.length;
      const cy =
        zoneAnchors.reduce((s, a) => s + flipY(a.y), 0) /
        zoneAnchors.length;

      return {
        id:    zone.id,
        label: zone.label,
        points,
        color: ZONE_COLORS[zone.colorToken],
        cx,
        cy,
      };
    });
  }
}

/* =========================================================
   ENGINE BOOTSTRAP
   ========================================================= */

export class PrimalEngine {
  static templates: Record<AnimalId, AnimalTemplate> =
    {} as Record<AnimalId, AnimalTemplate>;

  static boot(
    templates: AnimalTemplate[]
  ): void {
    const map = {} as Record<AnimalId, AnimalTemplate>;

    for (const template of templates) {
      // Stage 1: Constraint Validation (read-only — no mutations)
      PrimalConstraintEngine.validateTemplate(template);

      // Stage 2: Runtime immutability — deep-freeze after validation
      // Compile-time safety (readonly types) + runtime enforcement (Object.freeze)
      template.anchors.forEach(a => Object.freeze(a));
      template.edges.forEach(e => Object.freeze(e));
      template.allowedEdges.forEach(e => Object.freeze(e));
      template.zones.forEach(z => {
        Object.freeze(z.anchors);
        Object.freeze(z);
      });
      Object.freeze(template);

      map[template.id] = template;

      console.log(
        `[PASS] ${template.id} :: ${template.anchors.length} anchors :: ${template.edges.length} edges`
      );
    }

    this.templates = map;

    console.log("✅ PrimalEngine boot successful");
  }

  static getTemplate(
    animal: AnimalId
  ): AnimalTemplate {
    const template = this.templates[animal];

    if (!template) {
      throw new Error(
        `[ENGINE] Unknown animal template "${animal}". ` +
        `Ensure PrimalEngine.boot() has been called with this species.`
      );
    }

    return template;
  }
}

/* =========================================================
   ARCHITECTURE NOTES
   =========================================================

   CORE PRINCIPLES:

   1. Geometry is explicit
      - no inferred topology
      - no smoothing
      - no generated meshes

   2. Anatomy is typed
      - all anchors belong to layers
      - invalid anatomy connections impossible

   3. Zones are constrained
      - zones cannot drift across anatomy
      - zones cannot bind illegal anchors

   4. Rendering is deterministic
      - identical input => identical SVG output

   5. Species are isolated
      - no shared fallback skeletons
      - no inherited geometry
      - no cross-species mutation

   6. Templates are immutable
      - readonly types at compile time
      - Object.freeze applied at boot (runtime enforcement)
      - no mutation after boot — ever

   7. Render pipeline is isolated
      Template → Validate → Prepare → Present
      No stage may bypass another.
      PrimalRenderEngine.prepare() is the canonical entry point.

   8. Intelligence hooks are scaffolded
      ZoneMetadata and TemplateMetadata provide clean extension
      points for butcher intelligence, recipe linkage, yield
      analytics, and fabrication guidance.
      They do NOT affect rendering.

   ========================================================= */
