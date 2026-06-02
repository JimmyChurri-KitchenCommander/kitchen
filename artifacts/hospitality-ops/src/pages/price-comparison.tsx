import { useState, useMemo } from "react";
import { useVenueStore } from "@/stores/venueStore";
import { useGetPriceComparison, getGetPriceComparisonQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Scale, Search, TrendingDown, TrendingUp, Minus, Calendar, Clock, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type UnitMode,
  convertCost,
  modeLabel,
  modeSuffix,
  parseUnit,
} from "@/lib/unitConversion";

const MODES: { value: UnitMode; label: string }[] = [
  { value: "listed", label: "As listed" },
  { value: "kg", label: "per kg" },
  { value: "100g", label: "per 100g" },
  { value: "L", label: "per L" },
];

interface ComparisonEntry {
  id: number;
  name: string;
  unit: string;
  cost: number;
  supplierId: number | null;
  supplierName: string | null;
  deliveryDays: string | null;
  orderCutoffTime: string | null;
  minimumOrderValue: number | null;
  deliveryFee: number | null;
}

interface GroupedItem {
  name: string;
  entries: ComparisonEntry[];
  category: "weight" | "volume" | "each";
}

function groupByName(items: ComparisonEntry[]): GroupedItem[] {
  const map = new Map<string, ComparisonEntry[]>();
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([, entries]) => {
    const category = parseUnit(entries[0]?.unit ?? "").category;
    return { name: entries[0]?.name ?? "", entries, category };
  });
}

function getCostDisplay(
  cost: number,
  unit: string,
  mode: UnitMode
): { value: number | null; original: string } {
  const converted = convertCost(cost, unit, mode);
  return {
    value: converted,
    original: `$${cost.toFixed(2)}/${unit}`,
  };
}

function RankBadge({ rank, total }: { rank: number; total: number }) {
  if (total === 1) return null;
  if (rank === 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-status-healthy">
      <TrendingDown className="w-3 h-3" /> Cheapest
    </span>
  );
  if (rank === total - 1) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-status-critical">
      <TrendingUp className="w-3 h-3" /> Most expensive
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" /> Mid range
    </span>
  );
}

export default function PriceComparisonPage() {
  const { activeVenueId } = useVenueStore();
  const [mode, setMode] = useState<UnitMode>("listed");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "weight" | "volume" | "each">("all");

  const { data: rawItems, isLoading } = useGetPriceComparison(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getGetPriceComparisonQueryKey(activeVenueId as number) } }
  );

  const grouped = useMemo(() => {
    if (!rawItems) return [];
    return groupByName(rawItems as ComparisonEntry[]);
  }, [rawItems]);

  const filtered = useMemo(() => {
    let result = grouped;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      result = result.filter(g => g.category === categoryFilter);
    }
    return result;
  }, [grouped, search, categoryFilter]);

  // Only show mode buttons relevant to the current filtered set
  const availableCategories = useMemo(() => {
    const cats = new Set(filtered.map(g => g.category));
    return cats;
  }, [filtered]);

  const effectiveMode = useMemo(() => {
    if (mode === "kg" || mode === "100g") {
      return availableCategories.has("weight") ? mode : "listed";
    }
    if (mode === "L") {
      return availableCategories.has("volume") ? mode : "listed";
    }
    return mode;
  }, [mode, availableCategories]);

  if (!activeVenueId) {
    return <div className="text-center p-8 text-muted-foreground">Select a venue first.</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-2">
            <Link href="/suppliers"><ArrowLeft className="w-4 h-4 mr-1" /> Suppliers</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Scale className="w-8 h-8 text-primary" />
          Price Comparison
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare cost per unit across all your inventory items and suppliers.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Item type filter */}
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-md w-fit">
          {(["all", "weight", "volume", "each"] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded transition-colors capitalize",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              {cat === "all" ? "All types" : cat}
            </button>
          ))}
        </div>

        {/* Unit mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-md w-fit">
          {MODES.map(m => {
            const disabled =
              (m.value === "kg" || m.value === "100g") && !availableCategories.has("weight") ||
              m.value === "L" && !availableCategories.has("volume");
            return (
              <button
                key={m.value}
                disabled={disabled}
                onClick={() => setMode(m.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                  effectiveMode === m.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : disabled
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary strip */}
      {!isLoading && rawItems && (
        <div className="flex gap-6 text-sm text-muted-foreground border-b border-border pb-4">
          <span><span className="font-semibold text-foreground">{rawItems.length}</span> items</span>
          <span><span className="font-semibold text-foreground">{grouped.length}</span> unique names</span>
          <span>
            Showing{" "}
            <span className="font-semibold text-primary">{modeLabel(effectiveMode)}</span>
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 bg-card w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <Scale className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p>{search ? "No items match your search." : "No inventory items yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(group => {
            // Sort entries by converted cost (cheapest first) for ranking
            const ranked = [...group.entries]
              .map(e => {
                const converted = convertCost(e.cost, e.unit, effectiveMode);
                return { ...e, converted };
              })
              .sort((a, b) => {
                if (a.converted === null && b.converted === null) return 0;
                if (a.converted === null) return 1;
                if (b.converted === null) return -1;
                return a.converted - b.converted;
              });

            const hasComparable = ranked.some(r => r.converted !== null);
            const total = hasComparable ? ranked.filter(r => r.converted !== null).length : 0;

            return (
              <Card key={group.name} className="bg-card border-border overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/30">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    {group.name}
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                      {group.category}
                    </Badge>
                    {group.entries.length > 1 && (
                      <Badge variant="outline" className="text-[10px] font-normal text-primary border-primary/40">
                        {group.entries.length} sources
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/60">
                    {ranked.map((entry, rankIdx) => {
                      const { original } = getCostDisplay(entry.cost, entry.unit, effectiveMode);
                      const isConvertible = entry.converted !== null;
                      const visibleRank = isConvertible
                        ? ranked.filter(r => r.converted !== null).indexOf(entry)
                        : -1;

                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 gap-4",
                            group.entries.length > 1 && visibleRank === 0 && "bg-status-healthy/5",
                            group.entries.length > 1 && visibleRank === total - 1 && total > 1 && "bg-status-critical/5"
                          )}
                        >
                          {/* Left: supplier + item info */}
                          <div className="flex-1 min-w-0">
                            {entry.supplierId ? (
                              <a
                                href={`/suppliers/${entry.supplierId}`}
                                className="font-medium text-foreground text-sm hover:text-primary transition-colors"
                              >
                                {entry.supplierName}
                              </a>
                            ) : (
                              <p className="font-medium text-sm text-muted-foreground italic">No supplier</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">{original}</p>
                            {/* Logistics chips */}
                            {(entry.deliveryDays || entry.orderCutoffTime || entry.minimumOrderValue != null || entry.deliveryFee != null) && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {entry.deliveryDays && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {entry.deliveryDays.split(",").map(d => d.trim().slice(0, 3)).join(" · ")}
                                  </span>
                                )}
                                {entry.orderCutoffTime && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    <Clock className="w-2.5 h-2.5" />
                                    cutoff {entry.orderCutoffTime}
                                  </span>
                                )}
                                {entry.minimumOrderValue != null && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    <ShoppingCart className="w-2.5 h-2.5" />
                                    min ${entry.minimumOrderValue.toFixed(0)}
                                  </span>
                                )}
                                {entry.deliveryFee != null && (
                                  <span className={cn(
                                    "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                                    entry.deliveryFee === 0
                                      ? "text-status-healthy bg-status-healthy/10"
                                      : "text-muted-foreground bg-secondary"
                                  )}>
                                    <Truck className="w-2.5 h-2.5" />
                                    {entry.deliveryFee === 0 ? "free delivery" : `+$${entry.deliveryFee.toFixed(2)} delivery`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: converted cost + rank */}
                          <div className="text-right shrink-0">
                            {effectiveMode !== "listed" && isConvertible ? (
                              <>
                                <p className={cn(
                                  "text-lg font-bold tabular-nums",
                                  group.entries.length > 1 && visibleRank === 0
                                    ? "text-status-healthy"
                                    : group.entries.length > 1 && visibleRank === total - 1 && total > 1
                                      ? "text-status-critical"
                                      : "text-foreground"
                                )}>
                                  ${entry.converted!.toFixed(2)}
                                  <span className="text-xs font-normal text-muted-foreground ml-0.5">
                                    {modeSuffix(effectiveMode)}
                                  </span>
                                </p>
                                <div className="mt-0.5">
                                  <RankBadge rank={visibleRank} total={total} />
                                </div>
                              </>
                            ) : effectiveMode !== "listed" && !isConvertible ? (
                              <p className="text-sm text-muted-foreground italic">
                                ${entry.cost.toFixed(2)}/{entry.unit}
                                <span className="block text-xs opacity-60">unit — no conversion</span>
                              </p>
                            ) : (
                              <p className={cn(
                                "text-lg font-bold tabular-nums",
                                group.entries.length > 1 && rankIdx === 0
                                  ? "text-status-healthy"
                                  : group.entries.length > 1 && rankIdx === total - 1 && total > 1
                                    ? "text-status-critical"
                                    : "text-foreground"
                              )}>
                                ${entry.cost.toFixed(2)}
                                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                                  /{entry.unit}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
