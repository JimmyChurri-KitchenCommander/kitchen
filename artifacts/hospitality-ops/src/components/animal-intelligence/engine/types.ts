// ─── Primal Render Engine — Input/Output Contract ───────────────────────────────
// Spec v1.2: deterministic single-animal rendering with strict prompt validation.
// All requests enter via RenderRequest; all outputs exit as EngineOutput.

import type { PrimalShapeObject, PrimalZone } from "@/data/animal-shapes/types";
import type { AnimalDiagram } from "@/data/animal-diagrams";

// ── Prompt keys ────────────────────────────────────────────────────────────────
// G1 — Exactly one key per request. No multi-animal, no freeform strings.

export type PromptKey =
  | "RENDER_PIG"
  | "RENDER_COW"
  | "RENDER_CHICKEN"
  | "RENDER_LAMB"
  | "RENDER_FISH";

// ── Execution phases ────────────────────────────────────────────────────────────
// FULL_PIPELINE runs all phases sequentially.

export type RenderPhase =
  | "GEOMETRY"        // Phase 1: load + validate vertex template
  | "CUT_MAP"         // Phase 2: extract zone layers from geometry
  | "CUT_DEFINITION"  // Phase 3: resolve primal/subprimal definitions
  | "FULL_PIPELINE";  // All phases in sequence

export type OutputMode = "wireframe" | "silhouette" | "segmented";

export interface RenderOptions {
  includeCuts?: boolean;
  includeLabels?: boolean;
}

// ── The input contract ─────────────────────────────────────────────────────────

export interface RenderRequest {
  prompt: PromptKey;
  phase: RenderPhase;
  outputMode: OutputMode;
  options?: RenderOptions;
}

// ── Layer outputs (G5: never merged, always isolated) ─────────────────────────

export interface GeometryLayer {
  shape: PrimalShapeObject;    // mode-overridden from request.outputMode
  anchorCount: number;
  edgeCount: number;
  validationErrors: string[];  // empty = clean; non-empty = degraded-pass
}

export interface CutMapLayer {
  primalZones: PrimalZone[];
  structuralZones: PrimalZone[];
}

export interface CutDefinitionLayer {
  diagram: AnimalDiagram;
  primalCount: number;
}

// ── Pipeline result ────────────────────────────────────────────────────────────

export type RenderResult = {
  ok: true;
  prompt: PromptKey;
  outputMode: OutputMode;
  // Layers are null when phase stopped before they were computed
  geometry: GeometryLayer;
  cutMap: CutMapLayer | null;
  cutDefinition: CutDefinitionLayer | null;
};

// ── Rejection codes — match spec G1/G3 validation engine ──────────────────────

export type RejectionCode =
  | "INVALID_PROMPT:SINGLE_ANIMAL_REQUIRED"  // prompt key not recognised
  | "INVALID_GEOMETRY:TEMPLATE_NOT_FOUND"    // no vertex template for this animal
  | "INVALID_GEOMETRY:VALIDATION_FAILED"     // critical geometry errors (< 3 anchors etc.)
  | "INVALID_PHASE"                          // unknown phase string
  | "INVALID_OUTPUT_MODE";                   // unknown outputMode string

export type RenderRejection = {
  ok: false;
  code: RejectionCode;
  detail?: string;
};

export type EngineOutput = RenderResult | RenderRejection;
