// ─── Chef Decision Layer — Ranking Rules ──────────────────────────────────────
//
// Pure scoring and derivation functions.
// Inputs:  data from Intelligence and Ontology layers (passed as arguments).
// Outputs: scored, ranked, flagged decision primitives.
//
// INVARIANTS:
//   - These functions NEVER call into the Primal Engine.
//   - They NEVER mutate their inputs.
//   - All scoring uses the explicit SCORE_WEIGHTS / SERVICE_FIT_WEIGHTS /
//     RISK_WEIGHTS constants below — no magic numbers in function bodies.
//   - Cross-species consistency is guaranteed by schema: species differences
//     only affect intelligence inputs, never the decision structure or logic.

import type { ZoneIntelligence, TextureProfile } from "../engine/primal-zone-intelligence";
import type { CanonicalCut } from "../engine/primal-ontology";
import type {
  ChefDecisionOutput,
  MethodCategory,
  MethodScoreTrace,
  RiskProfile,
} from "./decision-types";

// ── Canonical scoring constants ───────────────────────────────────────────────
//
// METHOD_POSITION    — max contribution from intelligence-layer list ordering.
//                      score at position i = METHOD_POSITION × (1 − i / max(n−1,1))
// TEXTURE_ALIGN_BONUS    — added when method category aligns with texture profile.
// TEXTURE_ALIGN_PENALTY  — subtracted when method category misaligns.
//
// Per-method score = clamp(methodWeight + textureWeight, 0, 100)
// Yield and risk NEVER enter per-method scores — they affect serviceFitScore only.

export const SCORE_WEIGHTS = {
  METHOD_POSITION:       50,
  TEXTURE_ALIGN_BONUS:   35,
  TEXTURE_ALIGN_PENALTY: 25,
} as const;

// Service fit score — zone-level, not per-method.

export const SERVICE_FIT_WEIGHTS = {
  BASE_TENDER:  68,
  BASE_MEDIUM:  52,
  BASE_TOUGH:   35,
  YIELD_HIGH:   16,   // midpointYield > 73
  YIELD_MID:     8,   // midpointYield 64–73
  RISK_HIGH:    20,
  RISK_MEDIUM:  10,
} as const;

// Risk profile accumulator weights.

export const RISK_WEIGHTS = {
  PER_FAILURE_RISK:  18,
  TOUGH_TEXTURE:     20,
  MEDIUM_TEXTURE:     8,
  LOW_YIELD:         18,   // midpointYield < 60
  MID_YIELD:          9,   // midpointYield 60–67
  THRESHOLD_LOW:     25,   // score < this → "low"
  THRESHOLD_MEDIUM:  52,   // score < this → "medium", else "high"
} as const;

// ── Method categorisation ─────────────────────────────────────────────────────

/** Classify a cooking method string into a canonical MethodCategory. */
export function categorizeMethod(method: string): MethodCategory {
  const m = method.toLowerCase();
  if (/grill|sear|saut[eé]|fry|broil|salamander|yakitori/.test(m))       return "high_heat";
  if (/braise|confit|slow roast|slow smoke|osso|stock|low-and-slow|pulled/.test(m)) return "slow_moist";
  if (/roast|reverse sear/.test(m))                                        return "roast_dry";
  if (/cure|air dry|cold smoke|prosciutto|guanciale|bacon|ferment|brine/.test(m)) return "cure_preserve";
  if (/poach|steam|sous vide|gentle/.test(m))                              return "gentle_moist";
  return "unknown";
}

// ── Texture alignment tables ──────────────────────────────────────────────────

const TEXTURE_ALIGNED: Record<TextureProfile, MethodCategory[]> = {
  tender: ["high_heat", "gentle_moist", "roast_dry"],
  medium: ["roast_dry", "slow_moist", "gentle_moist"],
  tough:  ["slow_moist", "cure_preserve"],
};

const TEXTURE_MISALIGNED: Record<TextureProfile, MethodCategory[]> = {
  tender: ["slow_moist"],
  medium: [],
  tough:  ["high_heat"],
};

// ── Per-method scoring ────────────────────────────────────────────────────────

/**
 * Score a single method (0–100) using SCORE_WEIGHTS constants only.
 * Yield and risk are not inputs here — they belong to serviceFitScore.
 */
export function scoreMethod(
  method:         string,
  positionInList: number,
  listLength:     number,
  texture:        TextureProfile,
): number {
  return scoreMethodWithTrace(method, positionInList, listLength, texture).score;
}

/**
 * Score a method and return an internal trace alongside the result.
 * The trace is for debugging only — it MUST NOT appear in ChefDecisionOutput.
 */
export function scoreMethodWithTrace(
  method:         string,
  positionInList: number,
  listLength:     number,
  texture:        TextureProfile,
): { score: number; trace: MethodScoreTrace } {
  const cat = categorizeMethod(method);

  // methodWeight: linear decay from METHOD_POSITION (i=0) to 0 (i=n-1).
  const span         = Math.max(listLength - 1, 1);
  const methodWeight = Math.round(SCORE_WEIGHTS.METHOD_POSITION * (1 - positionInList / span));

  // textureWeight: +BONUS if aligned, -PENALTY if misaligned, 0 otherwise.
  const isAligned    = TEXTURE_ALIGNED[texture].includes(cat);
  const isMisaligned = TEXTURE_MISALIGNED[texture].includes(cat);
  const textureWeight = isAligned    ?  SCORE_WEIGHTS.TEXTURE_ALIGN_BONUS
                       : isMisaligned ? -SCORE_WEIGHTS.TEXTURE_ALIGN_PENALTY
                       : 0;

  const score: number = Math.min(100, Math.max(0, methodWeight + textureWeight));

  const trace: MethodScoreTrace = {
    methodWeight,
    textureWeight,
    yieldWeight:  0,   // yield does not enter per-method scoring
    riskPenalty:  0,   // risk does not enter per-method scoring
  };

  return { score, trace };
}

// ── Rationale matrix ──────────────────────────────────────────────────────────
//
// Each cell is a single sentence. Content is structurally distinct from:
//   - INTENT_MATRIX (primaryIntent is a strategic directive, not a rationale)
//   - decisionFlags (flags are warnings/constraints, not method explanations)

const RATIONALE_MATRIX: Record<MethodCategory, Record<TextureProfile, string>> = {
  high_heat: {
    tender: "Tender muscle benefits from fast high heat — short exposure locks moisture and develops a crust without toughening the fibres",
    medium: "Medium-textured muscle tolerates high heat with tight internal temperature monitoring — carryover is significant",
    tough:  "High heat contracts collagen without converting it — this muscle needs time and moisture, not peak temperature",
  },
  slow_moist: {
    tender: "Extended moist heat over-softens tender muscle beyond serviceable texture — reserve for specific preparations only",
    medium: "Partial collagen conversion gives a yielding, fork-tender result at the correct time-temperature intersection",
    tough:  "Full collagen-to-gelatin conversion via slow moist heat — the definitive route for maximum flavour extraction from this muscle",
  },
  roast_dry: {
    tender: "Dry heat suits this cut well — intramuscular fat bastes from within; rest period completes carry-over without over-cooking",
    medium: "Controlled dry roast with extended rest — carry-over brings medium-textured muscle to target temperature smoothly",
    tough:  "Extended low-temperature dry roasting can work, but added moisture is preferred — without it, collagen tightens rather than converts",
  },
  cure_preserve: {
    tender: "Even, lean muscle allows consistent salt penetration — a predictable, controlled cure result with minimal variation",
    medium: "Fat pockets slow penetration — extend cure time proportionally and verify all surfaces are fully covered before hanging",
    tough:  "Long cure achieves structural transformation — connective tissue firms and the product preserves well with extended shelf life",
  },
  gentle_moist: {
    tender: "Precise temperature control prevents overcooking of lean, tender muscle — holds cleanly for extended service periods",
    medium: "Gentle moist heat yields a consistent, evenly cooked result — more forgiving than high heat on medium-textured muscle",
    tough:  "Gentle heat alone is insufficient for full collagen conversion — time must significantly compensate for the lower temperature",
  },
  unknown: {
    tender: "Assess time and temperature requirements carefully — lean, tender muscle has a narrow optimal window",
    medium: "Standard preparation with close monitoring of internal temperature at both ends of the cook",
    tough:  "Prioritise time and moisture over heat — tough muscle demands low and slow regardless of method",
  },
};

/** Generate a one-sentence rationale for a method applied to a zone. */
export function buildRationale(method: string, intel: ZoneIntelligence): string {
  const cat = categorizeMethod(method);
  return RATIONALE_MATRIX[cat][intel.textureProfile];
}

// ── Primary intent ────────────────────────────────────────────────────────────
//
// DISTINCT from rationale: primaryIntent is a strategic directive for the whole
// zone, not an explanation of a single method.

const INTENT_MATRIX: Record<MethodCategory, Record<TextureProfile, string>> = {
  high_heat: {
    tender: "Service-grade portioned cook — fast execution, zero hold time on the pass",
    medium: "High-heat cook with precise carryover management — time-critical at service",
    tough:  "High heat is a secondary path for this muscle — batch braise is preferred",
  },
  slow_moist: {
    tender: "Slow moist technique is secondary — primary path should be faster and hotter",
    medium: "Batch production braise — portion after full collagen softening and rest",
    tough:  "Batch braise is the primary route — collagen conversion produces usable, high-margin yield",
  },
  roast_dry: {
    tender: "Oven roast application — strong yield, controlled sear, extended carry-over rest",
    medium: "Controlled roast with extended rest — bring to service temperature through carry-over",
    tough:  "Low-and-slow roast with added moisture — extended cook for partial collagen conversion",
  },
  cure_preserve: {
    tender: "Cure for value extension — consistent lean muscle takes salt evenly and reliably",
    medium: "Long-cycle cure production — fat pockets require extended penetration and hang time",
    tough:  "Cure for structural transformation — connective tissue firms and shelf life extends",
  },
  gentle_moist: {
    tender: "Precision temperature cook — holds cleanly for extended service without degradation",
    medium: "Gentle temperature path — even, moist result suited to high-volume service hold",
    tough:  "Gentle moist heat alone insufficient — extend time significantly or add pressure",
  },
  unknown: {
    tender: "High-precision cook — lean, tender muscle has a narrow optimal temperature window",
    medium: "Moderate approach — time and temperature control are the decisive variables",
    tough:  "Low and slow is the correct route — this muscle needs time, moisture, and patience",
  },
};

/** Build the top-line primary intent statement for a decision. */
export function buildPrimaryIntent(topMethod: string, intel: ZoneIntelligence): string {
  const cat = categorizeMethod(topMethod);
  return INTENT_MATRIX[cat][intel.textureProfile];
}

// ── Yield parsing ─────────────────────────────────────────────────────────────

/** Parse a yield range string (e.g. "72–78%" or "~40%") to a numeric midpoint. */
export function parseYieldMidpoint(yieldRange: string): number {
  const approx = yieldRange.match(/~(\d+)/);
  if (approx?.[1]) return parseInt(approx[1]);
  const range = yieldRange.match(/(\d+)[–\-](\d+)/);
  if (range?.[1] && range[2]) return (parseInt(range[1]) + parseInt(range[2])) / 2;
  const single = yieldRange.match(/(\d+)/);
  if (single?.[1]) return parseInt(single[1]);
  return 70;
}

/**
 * Derive yield optimisation as a structured object.
 * advisory is DISTINCT from rankedApplications rationale — it addresses cost
 * and portion economics, not cooking method suitability.
 */
export function deriveYieldOptimization(intel: ZoneIntelligence): ChefDecisionOutput["yieldOptimization"] {
  const midpointYield = parseYieldMidpoint(intel.yieldRange);
  let advisory: string;
  if (midpointYield >= 73) {
    advisory = `Strong usable yield at ${intel.yieldRange} — portion direct from the primal with standard seam work. Trim to spec and count.`;
  } else if (midpointYield >= 62) {
    advisory = `Moderate yield at ${intel.yieldRange} — weigh usable meat before pricing portions. Trim losses must be factored into cost per kg.`;
  } else {
    advisory = `Low usable yield at ${intel.yieldRange} — full primal cost must be spread across all derived products. Account for stock and trim revenue.`;
  }
  return { midpointYield, advisory };
}

// ── Risk profile ──────────────────────────────────────────────────────────────

/** Derive the risk profile using RISK_WEIGHTS constants only. */
export function deriveRiskProfile(intel: ZoneIntelligence): RiskProfile {
  const mid = parseYieldMidpoint(intel.yieldRange);
  let score = 0;
  score += intel.failureRisks.length * RISK_WEIGHTS.PER_FAILURE_RISK;
  score += intel.textureProfile === "tough"  ? RISK_WEIGHTS.TOUGH_TEXTURE  : 0;
  score += intel.textureProfile === "medium" ? RISK_WEIGHTS.MEDIUM_TEXTURE : 0;
  score += mid < 60 ? RISK_WEIGHTS.LOW_YIELD : mid < 68 ? RISK_WEIGHTS.MID_YIELD : 0;
  if (score < RISK_WEIGHTS.THRESHOLD_LOW)    return "low";
  if (score < RISK_WEIGHTS.THRESHOLD_MEDIUM) return "medium";
  return "high";
}

// ── Avoid methods ─────────────────────────────────────────────────────────────
//
// DISTINCT from rankedApplications: avoid methods are texture-misaligned
// techniques NOT in the intelligence layer's recommended list.
// Deduplication against ranked methods is applied in chef-decision-engine.ts.

const AVOID_CANDIDATES: Record<TextureProfile, string[]> = {
  tender: ["Long braise", "Braise", "Stock reduction"],
  medium: [],
  tough:  ["Grill", "Sauté", "Pan sear"],
};

/**
 * Return candidate avoid methods from the texture anti-alignment table.
 * Filters out methods already listed in intel.cookingMethods.
 * Caller must additionally filter against rankedApplications (engine responsibility).
 * Hard-capped at 3.
 */
export function deriveAvoidMethods(intel: ZoneIntelligence): string[] {
  const existing = new Set(intel.cookingMethods.map(m => m.toLowerCase()));
  return AVOID_CANDIDATES[intel.textureProfile]
    .filter(m => !existing.has(m.toLowerCase()))
    .slice(0, 3);
}

// ── Decision flags ────────────────────────────────────────────────────────────
//
// DISTINCT from rankedApplications rationale and primaryIntent:
// flags are operational warnings and constraints, not technique explanations.
// Hard-capped at 3 (highest-priority first).

/** Generate prioritised decision flags. Max 3 returned. */
export function deriveDecisionFlags(
  intel:     ZoneIntelligence,
  canonical: CanonicalCut | null,
): string[] {
  const flags: string[] = [];
  const mid = parseYieldMidpoint(intel.yieldRange);

  if (intel.textureProfile === "tough") {
    flags.push("Batch production preferred — not suited to à la minute service");
  }
  if (intel.textureProfile === "tender") {
    flags.push("Time-critical at service — zero margin for over-hold on the pass");
  }
  if (mid < 62) {
    flags.push("Low usable yield — price all portions against full primal cost");
  }
  if (intel.failureRisks.length >= 2) {
    flags.push("Multiple failure points — elevated bench attention required");
  }
  const fatLower = intel.fatDistribution.toLowerCase();
  if (fatLower.includes("heavy") || fatLower.includes("thick") || fatLower.includes("high fat")) {
    flags.push("Significant fat rendering — weigh before and after fabrication for accurate yield");
  }
  if (canonical && Object.keys(canonical.speciesVariants).length >= 4) {
    flags.push("Cross-species equivalent — technique transfers directly to other proteins in this station");
  }

  return flags.slice(0, 3);
}

// ── Service fit score ─────────────────────────────────────────────────────────

/** Compute a 0–100 service fit score using SERVICE_FIT_WEIGHTS constants only. */
export function computeServiceFitScore(
  intel:       ZoneIntelligence,
  riskProfile: RiskProfile,
): number {
  const mid = parseYieldMidpoint(intel.yieldRange);
  const base = intel.textureProfile === "tender" ? SERVICE_FIT_WEIGHTS.BASE_TENDER
             : intel.textureProfile === "medium" ? SERVICE_FIT_WEIGHTS.BASE_MEDIUM
             : SERVICE_FIT_WEIGHTS.BASE_TOUGH;
  const yieldBonus  = mid > 73 ? SERVICE_FIT_WEIGHTS.YIELD_HIGH
                    : mid > 64 ? SERVICE_FIT_WEIGHTS.YIELD_MID
                    : 0;
  const riskPenalty = riskProfile === "high"   ? SERVICE_FIT_WEIGHTS.RISK_HIGH
                    : riskProfile === "medium" ? SERVICE_FIT_WEIGHTS.RISK_MEDIUM
                    : 0;
  return Math.min(100, Math.max(0, base + yieldBonus - riskPenalty));
}

// ── Output validation ─────────────────────────────────────────────────────────

/**
 * Validate a ChefDecisionOutput against the locked contract.
 * Throws with a descriptive message on any violation.
 * Called by chef-decision-engine.ts before returning to the UI layer.
 */
export function validateDecisionOutput(
  output:   ChefDecisionOutput,
  animalId: string,
  zoneId:   string,
): void {
  const ctx = `${animalId}:${zoneId}`;

  if (output.serviceFitScore < 0 || output.serviceFitScore > 100) {
    throw new Error(
      `[ChefDecisionEngine] serviceFitScore out of range [0–100]: got ${output.serviceFitScore} (${ctx})`
    );
  }
  if (output.yieldOptimization.midpointYield < 0 || output.yieldOptimization.midpointYield > 100) {
    throw new Error(
      `[ChefDecisionEngine] yieldOptimization.midpointYield out of range [0–100]: got ${output.yieldOptimization.midpointYield} (${ctx})`
    );
  }
  if (output.decisionFlags.length > 3) {
    throw new Error(
      `[ChefDecisionEngine] decisionFlags exceeds max 3: got ${output.decisionFlags.length} (${ctx})`
    );
  }
  if (output.avoidMethods.length > 3) {
    throw new Error(
      `[ChefDecisionEngine] avoidMethods exceeds max 3: got ${output.avoidMethods.length} (${ctx})`
    );
  }
  // rankedApplications must be sorted by score descending (stable ties are fine).
  for (let i = 1; i < output.rankedApplications.length; i++) {
    const prev = output.rankedApplications[i - 1]!.score;
    const curr = output.rankedApplications[i]!.score;
    if (curr > prev) {
      throw new Error(
        `[ChefDecisionEngine] rankedApplications not sorted descending at index ${i}: ${curr} > ${prev} (${ctx})`
      );
    }
  }
  // Required string fields must be non-empty.
  if (!output.primaryIntent || !output.riskProfile || !output.yieldOptimization.advisory) {
    throw new Error(`[ChefDecisionEngine] required string field is empty in output (${ctx})`);
  }
  // avoidMethods must not overlap rankedApplications.
  const rankedSet = new Set(output.rankedApplications.map(a => a.method.toLowerCase()));
  const duplicates = output.avoidMethods.filter(m => rankedSet.has(m.toLowerCase()));
  if (duplicates.length > 0) {
    throw new Error(
      `[ChefDecisionEngine] avoidMethods overlaps rankedApplications: [${duplicates.join(", ")}] (${ctx})`
    );
  }
}
