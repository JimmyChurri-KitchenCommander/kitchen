// ─── Pipeline Executor ────────────────────────────────────────────────────────
// Runs the requested phase(s) in order. Each phase builds on the previous.
// G5 — layers are always isolated; never merged into a single structure.

import type {
  RenderRequest, EngineOutput, GeometryLayer, CutMapLayer, CutDefinitionLayer,
} from "./types";
import type { PromptKey } from "./types";
import { validateRequest } from "./validate";
import { getAnimalShape } from "@/data/animal-shapes";
import { validateShape } from "@/data/animal-shapes/types";
import { ANIMAL_DIAGRAMS } from "@/data/animal-diagrams";

// ── Spec G1 mapping: prompt key → internal animal ID ──────────────────────────

const PROMPT_TO_ID: Record<PromptKey, string> = {
  RENDER_COW:     "beef",
  RENDER_PIG:     "pork",
  RENDER_LAMB:    "lamb",
  RENDER_CHICKEN: "chicken",
  RENDER_FISH:    "fish",
};

// ── Main entry point ──────────────────────────────────────────────────────────

export function executePipeline(req: RenderRequest): EngineOutput {
  // Gate 1 — validate the request contract
  const rejection = validateRequest(req);
  if (rejection) return rejection;

  const animalId = PROMPT_TO_ID[req.prompt];

  // ── Phase 1: GEOMETRY ──────────────────────────────────────────────────────
  const rawShape = getAnimalShape(animalId);

  if (!rawShape) {
    return {
      ok: false,
      code: "INVALID_GEOMETRY:TEMPLATE_NOT_FOUND",
      detail: `No vertex template registered for ${req.prompt} (id="${animalId}")`,
    };
  }

  const validationErrors = validateShape(rawShape);

  // Critical failure: geometry is structurally unusable (< 3 anchors, no edges)
  const isCritical = rawShape.anchors.length < 3 || rawShape.edges.length === 0;
  if (isCritical) {
    return {
      ok: false,
      code: "INVALID_GEOMETRY:VALIDATION_FAILED",
      detail: validationErrors.join("; "),
    };
  }

  // G3 — outputMode from request overrides template default (no implicit mode inference)
  const shape = { ...rawShape, mode: req.outputMode };

  const geometry: GeometryLayer = {
    shape,
    anchorCount: shape.anchors.length,
    edgeCount: shape.edges.length,
    validationErrors,
  };

  if (req.phase === "GEOMETRY") {
    return { ok: true, prompt: req.prompt, outputMode: req.outputMode, geometry, cutMap: null, cutDefinition: null };
  }

  // ── Phase 2: CUT_MAP ───────────────────────────────────────────────────────
  // G5 — primal and structural zones are isolated into separate arrays
  const cutMap: CutMapLayer = {
    primalZones:     shape.zones.filter(z => z.type === "primal"),
    structuralZones: shape.zones.filter(z => z.type !== "primal"),
  };

  if (req.phase === "CUT_MAP") {
    return { ok: true, prompt: req.prompt, outputMode: req.outputMode, geometry, cutMap, cutDefinition: null };
  }

  // ── Phase 3: CUT_DEFINITION ────────────────────────────────────────────────
  const diagram = ANIMAL_DIAGRAMS.find(d => d.id === animalId);

  if (!diagram) {
    return {
      ok: false,
      code: "INVALID_GEOMETRY:TEMPLATE_NOT_FOUND",
      detail: `No AnimalDiagram registered for id="${animalId}"`,
    };
  }

  const cutDefinition: CutDefinitionLayer = {
    diagram,
    primalCount: diagram.primals.length,
  };

  // ── FULL_PIPELINE or CUT_DEFINITION both return all layers ─────────────────
  return {
    ok: true,
    prompt: req.prompt,
    outputMode: req.outputMode,
    geometry,
    cutMap,
    cutDefinition,
  };
}
