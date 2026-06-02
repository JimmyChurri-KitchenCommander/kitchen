// ─── Request Validator ────────────────────────────────────────────────────────
// First gate in the pipeline. Returns null (pass) or a typed RenderRejection.

import type { RenderRequest, RenderRejection, PromptKey, RenderPhase, OutputMode } from "./types";

const VALID_PROMPTS = new Set<PromptKey>([
  "RENDER_PIG",
  "RENDER_COW",
  "RENDER_CHICKEN",
  "RENDER_LAMB",
  "RENDER_FISH",
]);

const VALID_PHASES = new Set<RenderPhase>([
  "GEOMETRY",
  "CUT_MAP",
  "CUT_DEFINITION",
  "FULL_PIPELINE",
]);

const VALID_MODES = new Set<OutputMode>([
  "wireframe",
  "silhouette",
  "segmented",
]);

export function validateRequest(req: RenderRequest): RenderRejection | null {
  if (!VALID_PROMPTS.has(req.prompt)) {
    return {
      ok: false,
      code: "INVALID_PROMPT:SINGLE_ANIMAL_REQUIRED",
      detail: `'${req.prompt}' is not a recognised prompt key. Valid: ${[...VALID_PROMPTS].join(", ")}`,
    };
  }

  if (!VALID_PHASES.has(req.phase)) {
    return {
      ok: false,
      code: "INVALID_PHASE",
      detail: `Unknown phase: '${req.phase}'`,
    };
  }

  if (!VALID_MODES.has(req.outputMode)) {
    return {
      ok: false,
      code: "INVALID_OUTPUT_MODE",
      detail: `Unknown outputMode: '${req.outputMode}'`,
    };
  }

  return null;
}
