// ─── Chef Decision Layer — Output Contract (locked) ────────────────────────────
//
// This file defines the SOLE output type of the Chef Decision Layer.
//
// CONTRACT RULES:
//   - No optional fields on core properties.
//   - No ad-hoc runtime additions beyond this schema.
//   - Every field has a distinct informational role (no duplication between fields).
//   - The layer READS from Engine, Intelligence, and Ontology.
//   - It NEVER writes back to any truth system.
//
// Internal scoring trace (MethodScoreTrace) is defined here for use by
// ranking-rules.ts ONLY. It must never be included in ChefDecisionOutput.

export type RiskProfile = "low" | "medium" | "high";

export type MethodCategory =
  | "high_heat"      // grill, sear, sauté, fry, broil, salamander
  | "slow_moist"     // braise, confit, slow roast, osso, stock, low-and-slow
  | "roast_dry"      // roast, reverse sear
  | "cure_preserve"  // cure, air dry, cold smoke, brine
  | "gentle_moist"   // poach, steam, sous vide
  | "unknown";

/**
 * Internal-only scoring trace — computed alongside each method score.
 * MUST NOT appear in ChefDecisionOutput. MUST NOT reach the UI layer.
 * MUST NOT influence the output in any way other than as a debug record.
 */
export interface MethodScoreTrace {
  readonly methodWeight:  number;   // contribution from intelligence-layer position
  readonly textureWeight: number;   // contribution from texture alignment (+/-)
  readonly yieldWeight:   number;   // 0 at method level — yield affects serviceFitScore only
  readonly riskPenalty:   number;   // 0 at method level — risk affects serviceFitScore only
}

/**
 * ChefDecisionOutput — the locked output contract of the Chef Decision Layer.
 *
 * Derived entirely from:
 *   - Zone Intelligence (yield, texture, fat, methods, failureRisks)
 *   - Ontology         (canonical identity, cross-species mapping)
 *   - Ranking Rules    (this layer's scoring and derivation logic only)
 *
 * SCHEMA RULES:
 *   - serviceFitScore  ∈ [0, 100]
 *   - decisionFlags    max 3 items
 *   - avoidMethods     max 3 items, no overlap with rankedApplications
 *   - rankedApplications sorted by score descending (stable — equal scores
 *     preserve intelligence-layer ordering)
 *   - yieldOptimization.midpointYield ∈ [0, 100]
 *
 * Violation of any rule causes a hard throw in validateDecisionOutput().
 */
export interface ChefDecisionOutput {
  readonly primaryIntent: string;
  readonly serviceFitScore: number;   // 0–100
  readonly riskProfile: RiskProfile;

  readonly rankedApplications: ReadonlyArray<{
    readonly method:    string;
    readonly score:     number;   // 0–100, sorted descending
    readonly rationale: string;
  }>;

  readonly yieldOptimization: {
    readonly midpointYield: number;   // parsed numeric midpoint (0–100)
    readonly advisory:      string;
  };

  readonly decisionFlags: ReadonlyArray<string>;   // max 3, distinct from rankedApplications
  readonly avoidMethods:  ReadonlyArray<string>;   // max 3, no overlap with rankedApplications
}
