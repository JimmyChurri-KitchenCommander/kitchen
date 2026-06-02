// ─── Chef Decision Engine ─────────────────────────────────────────────────────
//
// The sole public entry point for the Chef Decision Layer.
//
// Reads from (in order):
//   1. Zone Intelligence   — yield, texture, fat, methods, failureRisks
//   2. Ontology            — canonical identity, cross-species mapping
//   3. Ranking Rules       — this layer's own scoring and derivation logic
//
// Produces a ChefDecisionOutput object that the UI layer can render.
//
// GUARANTEES:
//   - Output is fully deterministic for a given (animalId, zoneId) pair.
//   - Equal-scoring methods preserve intelligence-layer ordering (stable sort).
//   - avoidMethods never overlaps rankedApplications.
//   - validateDecisionOutput() hard-throws on any contract violation.
//   - MethodScoreTrace is computed internally for debugging but never exposed.
//   - NEVER writes back to Engine, Intelligence, or Ontology.

import type { AnimalId } from "../engine/primal-engine";
import { getZoneIntelligence } from "../engine/primal-zone-intelligence";
import { getCanonicalCut } from "../engine/primal-ontology";
import type { ChefDecisionOutput } from "./decision-types";
import {
  scoreMethodWithTrace,
  buildRationale,
  buildPrimaryIntent,
  deriveRiskProfile,
  deriveAvoidMethods,
  deriveDecisionFlags,
  deriveYieldOptimization,
  computeServiceFitScore,
  validateDecisionOutput,
} from "./ranking-rules";

/**
 * Derive a ChefDecisionOutput for the given zone.
 *
 * Returns null if no intelligence data exists for this zone — a decision
 * cannot be made without understanding the zone's culinary properties.
 * The engine never decides; only the intelligence layer can provide that basis.
 */
export function getChefDecision(
  animalId: AnimalId,
  zoneId:   string,
): ChefDecisionOutput | null {
  const intel     = getZoneIntelligence(animalId, zoneId);
  const canonical = getCanonicalCut(animalId, zoneId);

  if (!intel) return null;

  // ── Score every method, preserving original index for stable sort ─────────────
  //
  // intel.cookingMethods is ordered best-first by the Intelligence layer.
  // We apply a texture-alignment score on top. The trace is computed
  // alongside each score but never included in the output.

  const scoredMethods = intel.cookingMethods.map((method, i) => {
    const { score, trace } = scoreMethodWithTrace(
      method,
      i,
      intel.cookingMethods.length,
      intel.textureProfile,
    );
    return { method, score, trace, originalIndex: i };
  });

  // Stable sort: descending by score; equal scores → preserve intelligence ordering.
  const ranked = scoredMethods.slice().sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.originalIndex - b.originalIndex;
  });

  // Top 3 ranked applications.
  const rankedApplications = ranked.slice(0, 3).map(entry => ({
    method:    entry.method,
    score:     entry.score,
    rationale: buildRationale(entry.method, intel),
  }));

  // ── Derive all remaining output fields ────────────────────────────────────────

  const topMethod   = ranked[0]?.method ?? intel.cookingMethods[0] ?? "";
  const riskProfile = deriveRiskProfile(intel);

  // avoidMethods: texture anti-alignment candidates, filtered against both
  // the intelligence list AND the rankedApplications set to guarantee no overlap.
  const rankedMethodSet = new Set(rankedApplications.map(a => a.method.toLowerCase()));
  const avoidMethods = deriveAvoidMethods(intel).filter(
    m => !rankedMethodSet.has(m.toLowerCase()),
  );

  const output: ChefDecisionOutput = {
    primaryIntent:     buildPrimaryIntent(topMethod, intel),
    serviceFitScore:   computeServiceFitScore(intel, riskProfile),
    riskProfile,
    rankedApplications,
    yieldOptimization: deriveYieldOptimization(intel),
    decisionFlags:     deriveDecisionFlags(intel, canonical),
    avoidMethods,
  };

  // Hard-throw on any contract violation — no silent fallback.
  validateDecisionOutput(output, animalId, zoneId);

  return output;
}
