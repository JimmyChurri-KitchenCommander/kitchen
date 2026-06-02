import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CostMetricKey =
  | "food_cost_pct"
  | "gp_pct"
  | "portion_cost"
  | "total_cost"
  | "yield_pct"
  | "selling_price"
  | "waste_cost"
  | "ingredient_contribution";

type ExplanationLevel = {
  quick: string;
  apprenticeQuick?: string;
  whyMatters: string;
  kitchenExample: string;
};

const EXPLANATIONS: Record<CostMetricKey, ExplanationLevel> = {
  food_cost_pct: {
    quick: "The percentage of the selling price that goes toward ingredient cost.",
    apprenticeQuick: "Out of every dollar charged, this is how much went on ingredients.",
    whyMatters: "Keeping food cost in check protects your GP — even during a full and busy service.",
    kitchenExample:
      "If salmon costs $8 to plate and sells for $28, your food cost is 28.6%. Raise the price or trim the portion and that number improves.",
  },
  gp_pct: {
    quick: "Gross profit percentage — what's left after ingredient cost, expressed as a share of the selling price.",
    apprenticeQuick: "The money left over after ingredients are paid for, shown as a percentage.",
    whyMatters: "GP% funds wages, rent, and everything else. Protect it by managing portion size and waste.",
    kitchenExample:
      "A dish selling for $30 with $9 in ingredients has a GP of $21 — that's 70% GP. A strong kitchen targets 65–75%.",
  },
  portion_cost: {
    quick: "The ingredient cost to produce one serving of this dish.",
    apprenticeQuick: "How much it costs in ingredients to make one plate of this dish.",
    whyMatters:
      "Portion cost drives menu pricing. Over-portioning by even 20g on a protein dish can erase your margin across a service.",
    kitchenExample:
      "If risotto costs $4.20 per portion and sells for $18, that's a strong margin — but add an extra 30g of parmesan each plate and that shifts fast.",
  },
  total_cost: {
    quick: "The combined ingredient cost for the full recipe batch.",
    apprenticeQuick: "What all the ingredients for this recipe cost in total.",
    whyMatters:
      "Total cost helps you scale accurately. Batch cooking needs clean totals to price and portion fairly across covers.",
    kitchenExample:
      "A sauce base costing $12 across 20 portions is 60c per plate — easy to overlook, but it adds up across a week of service.",
  },
  yield_pct: {
    quick: "The usable percentage of an ingredient after prep, trim, and waste.",
    apprenticeQuick: "How much of the ingredient you actually use after cleaning and trimming it.",
    whyMatters:
      "Low yield means you're buying more than you're using. That gap directly inflates ingredient cost.",
    kitchenExample:
      "A whole salmon fillet at 70% yield means 30% is lost to skin, pin bones, and trim. You cost on the gross weight purchased — not what lands on the plate.",
  },
  selling_price: {
    quick: "The price this dish is charged on the menu.",
    apprenticeQuick: "What the customer pays for this dish.",
    whyMatters:
      "Selling price determines your GP%. Price too low and the margin disappears — even with a full section and a clean service.",
    kitchenExample:
      "If ingredient costs rise and the menu price stays the same, GP% shrinks every cover. That's why regular costing reviews matter.",
  },
  waste_cost: {
    quick: "The financial value of ingredients lost to spoilage, over-production, or trim.",
    apprenticeQuick: "How much money was lost through food that couldn't be used or sold.",
    whyMatters:
      "Waste cost is direct profit loss. Reducing it doesn't mean cutting corners — it means buying smarter and prepping accurately.",
    kitchenExample:
      "Half a kilo of rocket wilting before service isn't just waste — it's a specific dollar amount that comes off the bottom line.",
  },
  ingredient_contribution: {
    quick: "How much each ingredient contributes to the total dish cost as a percentage.",
    apprenticeQuick: "Which ingredients are costing the most in this dish.",
    whyMatters:
      "Knowing your biggest cost drivers tells you where small changes have the largest impact on margin.",
    kitchenExample:
      "If protein makes up 60% of a dish's cost, a small portion increase there is worth more than trimming every other ingredient.",
  },
};

interface CostExplainerProps {
  metricKey: CostMetricKey;
  apprenticeMode?: boolean;
  className?: string;
  iconSize?: "sm" | "md";
}

export function CostExplainer({
  metricKey,
  apprenticeMode = false,
  className,
  iconSize = "sm",
}: CostExplainerProps) {
  const [open, setOpen] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const exp = EXPLANATIONS[metricKey];

  const quickText =
    apprenticeMode && exp.apprenticeQuick ? exp.apprenticeQuick : exp.quick;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setExampleOpen(false); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Explain this metric"
          className={cn(
            "rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            iconSize === "sm" ? "p-0.5" : "p-1",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <HelpCircle className={iconSize === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-72 p-0 bg-card border-border shadow-xl overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {apprenticeMode && (
          <div className="bg-primary/10 border-b border-border px-3 py-1.5">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Operational guidance
            </p>
          </div>
        )}
        <div className="p-3 space-y-3">
          <p className="text-xs text-foreground leading-relaxed font-medium">{quickText}</p>

          <div className="border-t border-border pt-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Why it matters
            </p>
            <p className="text-xs text-foreground leading-relaxed">{exp.whyMatters}</p>
          </div>

          <div className="border-t border-border pt-2">
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider hover:underline"
              onClick={() => setExampleOpen((v) => !v)}
            >
              Kitchen example
              {exampleOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {exampleOpen && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed italic">
                {exp.kitchenExample}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
