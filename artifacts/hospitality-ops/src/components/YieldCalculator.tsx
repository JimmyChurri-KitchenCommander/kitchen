import { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type YieldResult = {
  theoreticalPortions: number;
  minPortions: number;
  maxPortions: number;
  targetPortions: number;
  trimGrams: number;
  trimPercent: number;
};

export type ActualYieldResult = {
  portionVariance: number;
  trimEstimateGrams: number;
  withinTolerance: boolean;
  toleranceNote: string;
};

// ── Pure yield math ────────────────────────────────────────────────────────

export function calculateYield(
  primalWeightKg: number,
  portionSizeGrams: number,
  varianceGrams: number
): YieldResult {
  const primalGrams = primalWeightKg * 1000;
  const minPortionWeight = Math.max(portionSizeGrams - varianceGrams, 1);
  const maxPortionWeight = portionSizeGrams + varianceGrams;

  const theoreticalPortions = primalGrams / portionSizeGrams;
  const maxPortions = Math.floor(primalGrams / minPortionWeight);
  const minPortions = Math.floor(primalGrams / maxPortionWeight);
  const targetPortions = Math.round(theoreticalPortions);

  const trimGrams = primalGrams - targetPortions * portionSizeGrams;
  const trimPercent = Math.max(0, (trimGrams / primalGrams) * 100);

  return {
    theoreticalPortions,
    minPortions,
    maxPortions,
    targetPortions,
    trimGrams,
    trimPercent,
  };
}

export function calculateActualYield(
  primalWeightKg: number,
  portionSizeGrams: number,
  varianceGrams: number,
  actualPortions: number,
  avgPortionWeightGrams?: number
): ActualYieldResult {
  const primalGrams = primalWeightKg * 1000;
  const effectivePortionWeight = avgPortionWeightGrams ?? portionSizeGrams;
  const targetPortions = Math.round(primalGrams / portionSizeGrams);

  const portionVariance = actualPortions - targetPortions;
  const trimEstimateGrams = Math.max(
    0,
    primalGrams - actualPortions * effectivePortionWeight
  );

  const withinWeightTolerance =
    Math.abs(effectivePortionWeight - portionSizeGrams) <= varianceGrams;
  const withinCountTolerance = Math.abs(portionVariance) <= 1;
  const withinTolerance = withinWeightTolerance || withinCountTolerance;

  let toleranceNote = "";
  if (withinTolerance) {
    if (portionVariance < 0 && withinWeightTolerance) {
      toleranceNote = `${actualPortions} portions — within tolerance. Average portion weight above target compensates for one fewer cut.`;
    } else if (portionVariance === 0) {
      toleranceNote = "Exactly on target.";
    } else if (portionVariance > 0) {
      toleranceNote = `${portionVariance > 0 ? "+" : ""}${portionVariance} on target — within acceptable range.`;
    } else {
      toleranceNote = "Within acceptable operational tolerance.";
    }
  } else {
    if (portionVariance < 0) {
      toleranceNote = `${Math.abs(portionVariance)} fewer than target. Check trim losses or portion weights — may indicate cutting error.`;
    } else {
      toleranceNote = `${portionVariance} more than target. Portion weights may be below target — verify average weight.`;
    }
  }

  return { portionVariance, trimEstimateGrams, withinTolerance, toleranceNote };
}

// ── YieldCalculator component ──────────────────────────────────────────────

type Mode = "estimate" | "confirm";

export default function YieldCalculator({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("estimate");

  // Estimate inputs
  const [primalWeight, setPrimalWeight] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [variance, setVariance] = useState("30");

  // Actual yield inputs
  const [actualPortions, setActualPortions] = useState("");
  const [avgPortionWeight, setAvgPortionWeight] = useState("");

  const [showActual, setShowActual] = useState(false);

  const estimateResult = useMemo<YieldResult | null>(() => {
    const w = parseFloat(primalWeight);
    const p = parseFloat(portionSize);
    const v = parseFloat(variance);
    if (!w || !p || w <= 0 || p <= 0) return null;
    return calculateYield(w, p, v || 0);
  }, [primalWeight, portionSize, variance]);

  const actualResult = useMemo<ActualYieldResult | null>(() => {
    if (!estimateResult) return null;
    const actual = parseInt(actualPortions, 10);
    if (!actual || actual <= 0) return null;
    const avg = parseFloat(avgPortionWeight) || undefined;
    const w = parseFloat(primalWeight);
    const p = parseFloat(portionSize);
    const v = parseFloat(variance) || 0;
    return calculateActualYield(w, p, v, actual, avg);
  }, [estimateResult, actualPortions, avgPortionWeight, primalWeight, portionSize, variance]);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Mode tabs */}
      <div className="flex rounded-xl border border-border overflow-hidden self-start w-fit">
        {(["estimate", "confirm"] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); if (m === "confirm") setShowActual(true); }}
            className={cn(
              "px-4 py-2 text-sm font-semibold transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {m === "estimate" ? "Estimate Yield" : "Confirm Actual"}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Primal weight (kg)
          </Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 5.8"
            value={primalWeight}
            onChange={e => setPrimalWeight(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Target portion (g)
          </Label>
          <Input
            type="number"
            min="0"
            step="10"
            placeholder="e.g. 300"
            value={portionSize}
            onChange={e => setPortionSize(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Variance +/- (g)
          </Label>
          <Input
            type="number"
            min="0"
            step="5"
            placeholder="e.g. 30"
            value={variance}
            onChange={e => setVariance(e.target.value)}
          />
        </div>
      </div>

      {/* Estimate result */}
      {estimateResult && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Estimated achievable yield</span>
          </div>
          <div className="p-5 space-y-4">
            {/* Main yield range */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-foreground tabular-nums">
                {estimateResult.minPortions}–{estimateResult.maxPortions}
              </span>
              <span className="text-muted-foreground text-sm font-semibold">portions</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Target</span>
                <span className="ml-1.5 font-bold text-foreground">~{estimateResult.targetPortions} portions</span>
              </div>
              <div>
                <span className="text-muted-foreground">Theoretical</span>
                <span className="ml-1.5 font-bold text-foreground">
                  {estimateResult.theoreticalPortions.toFixed(1)} portions
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Expected trim</span>
                <span className="ml-1.5 font-bold text-foreground">
                  ~{Math.round(estimateResult.trimGrams)}g ({estimateResult.trimPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              With a {parseFloat(portionSize)}g target and ±{parseFloat(variance) || 0}g variance, acceptable portions run{" "}
              {parseFloat(portionSize) - (parseFloat(variance) || 0)}g–{parseFloat(portionSize) + (parseFloat(variance) || 0)}g.
            </p>
          </div>
        </div>
      )}

      {/* Actual yield confirmation */}
      {mode === "confirm" && estimateResult && (
        <>
          <button
            type="button"
            onClick={() => setShowActual(v => !v)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
          >
            Enter actual yield
            {showActual ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showActual && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actual portions achieved
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={`Expected ~${estimateResult.targetPortions}`}
                    value={actualPortions}
                    onChange={e => setActualPortions(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Avg portion weight (g) — optional
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    placeholder={`Target ${portionSize}g`}
                    value={avgPortionWeight}
                    onChange={e => setAvgPortionWeight(e.target.value)}
                  />
                </div>
              </div>

              {actualResult && (
                <div className={cn(
                  "rounded-xl border p-4 space-y-2",
                  actualResult.withinTolerance
                    ? "border-emerald-500/25 bg-emerald-500/5"
                    : "border-orange-500/25 bg-orange-500/5"
                )}>
                  <div className="flex items-center gap-2">
                    {actualResult.withinTolerance ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm font-bold",
                      actualResult.withinTolerance ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"
                    )}>
                      {actualResult.withinTolerance ? "Within tolerance" : "Outside tolerance"}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      actualResult.portionVariance === 0
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : actualResult.portionVariance > 0
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : actualResult.withinTolerance
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                    )}>
                      {actualResult.portionVariance > 0 ? "+" : ""}{actualResult.portionVariance} vs target
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{actualResult.toleranceNote}</p>
                  {actualResult.trimEstimateGrams > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Estimated trim generated:{" "}
                      <span className="font-bold text-foreground">
                        ~{Math.round(actualResult.trimEstimateGrams)}g
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!estimateResult && (
        <p className="text-xs text-muted-foreground">
          Enter primal weight and target portion size to calculate.
        </p>
      )}
    </div>
  );
}
