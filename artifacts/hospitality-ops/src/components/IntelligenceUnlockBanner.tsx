import { useState } from "react";
import { Activity, Zap, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerVariant = "v2" | "v3";

const V2_CONTENT = {
  Icon: Activity,
  accent: "amber" as const,
  offerLine: "Want to see if your kitchen is on track for service? Three tasks in — you have enough data.",
  revealTitle: "Pressure Awareness",
  revealSub: "See exactly how your kitchen is tracking against service time — in real time.",
  features: [
    "Live Pressure Score — 0 to 100 readout of kitchen pressure right now",
    "Station load balance — see which sections are overloaded before service",
    "Reality check — a warning when service is becoming unachievable",
    "Service Mode view on the prep board",
  ],
  enableLabel: "Turn on Pressure Mode",
};

const V3_CONTENT = {
  Icon: Zap,
  accent: "red" as const,
  offerLine: "Your kitchen data is now rich enough to show operational risk patterns.",
  revealTitle: "Operational Intelligence",
  revealSub: "Kitchen Command can now help prioritise your kitchen in real time.",
  features: [
    "Focus Queue — your top priorities ranked by urgency score",
    "Bottleneck detection — which sections are blocking service right now",
    "Drop-for-now list — what to defer safely under pressure",
    "Staffing imbalance — who has too much, who needs more",
  ],
  enableLabel: "Turn on Intelligence",
};

export function IntelligenceUnlockBanner({
  variant,
  onEnable,
  onDismiss,
  enabling = false,
}: {
  variant: BannerVariant;
  onEnable: () => void;
  onDismiss: () => void;
  enabling?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const content = variant === "v2" ? V2_CONTENT : V3_CONTENT;
  const { Icon } = content;
  const isAmber = content.accent === "amber";

  const accentText  = isAmber ? "text-amber-500" : "text-red-500";
  const accentBg    = isAmber ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600";
  const accentBorder = isAmber
    ? "border-amber-400/30 bg-amber-50/5 dark:bg-amber-950/10"
    : "border-red-400/30 bg-red-50/5 dark:bg-red-950/10";
  const accentBorderRevealed = isAmber
    ? "border-amber-400/40 bg-amber-50/5 dark:bg-amber-950/10"
    : "border-red-400/40 bg-red-50/5 dark:bg-red-950/10";

  if (!revealed) {
    return (
      <div className={cn("rounded-xl border px-4 py-3 flex items-start gap-3", accentBorder)}>
        <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", accentText)} />
        <p className="text-sm text-foreground/80 flex-1 leading-snug">
          {content.offerLine}
        </p>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={onDismiss}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Not now
          </button>
          <button
            onClick={() => setRevealed(true)}
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 text-white whitespace-nowrap",
              accentBg
            )}
          >
            Show me
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border p-4 space-y-4", accentBorderRevealed)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", accentText)} />
        <div>
          <p className="text-sm font-bold text-foreground">{content.revealTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{content.revealSub}</p>
        </div>
      </div>
      <div className="space-y-2 pl-1">
        {content.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <Check className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", accentText)} />
            <span className="text-foreground/80 leading-snug">{f}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onDismiss}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Not for me
        </button>
        <button
          onClick={onEnable}
          disabled={enabling}
          className={cn(
            "text-xs font-bold px-4 py-2 rounded-full transition-colors flex-1 text-center text-white",
            accentBg,
            "disabled:opacity-60"
          )}
        >
          {enabling ? "Enabling..." : content.enableLabel}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 italic pt-1">
        Suggestions only — Kitchen Command assists your decisions, it never overrides them.
      </p>
    </div>
  );
}
