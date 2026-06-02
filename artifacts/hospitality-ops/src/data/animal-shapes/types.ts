// ─── Primal Shape Rendering Engine — Type System ───────────────────────────────
// Spec v1.0: deterministic vertex system, normalized 0–1 coordinate space.
// All shapes derived from anchors + edges — no bezier inference, no blobs.

export type Anchor = {
  id: string;
  x: number; // 0.0–1.0 normalised (renderer scales by viewAspect)
  y: number; // 0.0–1.0 normalised (y = 0 top, y = 1 bottom — SVG convention)
};

// An edge connects two anchor IDs. All anchors must appear in ≥1 edge.
export type Edge = [string, string];

export type ZoneType =
  | "primal"   // interactive fabrication region
  | "head"     // non-primal structural head zone
  | "limb"     // non-primal limb/leg
  | "tail"     // non-primal tail accent
  | "body";    // generic structural body zone

export type PrimalZone = {
  id: string;
  type: ZoneType;
  label: string;
  shortLabel?: string;
  // anchorIds form the polygon of this zone (in order, closed loop)
  anchorIds: string[];
  // label position override — defaults to centroid of zone anchors
  labelX?: number; // 0–1 normalised
  labelY?: number; // 0–1 normalised
  color?: string;  // hex — required for type=primal
};

export type PrimalShapeObject = {
  id: string;
  type: "animal" | "cut" | "tool" | "reference";
  // rendering mode — segmented is the default for interactive primal maps
  mode: "wireframe" | "silhouette" | "segmented";
  // container aspect ratio: width / height (e.g. 4 → 4:1 wide)
  viewAspect: number;
  // all geometry anchors in 0–1 normalised space
  anchors: Anchor[];
  // structural edges — must connect every anchor to at least one other
  edges: Edge[];
  fill: boolean;
  curveMode: "none" | "quadratic" | "cubic";
  symmetry: "none" | "vertical" | "horizontal" | "radial";
  zones: PrimalZone[];
};

// Validation helpers ────────────────────────────────────────────────────────────

export function validateShape(shape: PrimalShapeObject): string[] {
  const errors: string[] = [];
  const ids = new Set(shape.anchors.map(a => a.id));
  const connected = new Set<string>();

  if (shape.anchors.length < 6) {
    errors.push(`Shape has fewer than 6 anchors (has ${shape.anchors.length})`);
  }

  for (const [a, b] of shape.edges) {
    if (!ids.has(a)) errors.push(`Edge references unknown anchor: ${a}`);
    if (!ids.has(b)) errors.push(`Edge references unknown anchor: ${b}`);
    connected.add(a);
    connected.add(b);
  }

  for (const anchor of shape.anchors) {
    if (!connected.has(anchor.id)) {
      errors.push(`Orphan anchor (not in any edge): ${anchor.id}`);
    }
    if (anchor.x < 0 || anchor.x > 1 || anchor.y < 0 || anchor.y > 1) {
      errors.push(`Anchor ${anchor.id} out of 0–1 bounds: (${anchor.x}, ${anchor.y})`);
    }
  }

  for (const zone of shape.zones) {
    for (const aid of zone.anchorIds) {
      if (!ids.has(aid)) errors.push(`Zone ${zone.id} references unknown anchor: ${aid}`);
    }
  }

  return errors;
}
