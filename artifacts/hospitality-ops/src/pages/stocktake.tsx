import { useVenueStore } from "@/stores/venueStore";
import {
  useListStocktakes,
  useCreateStocktake,
  useGetStocktake,
  useSubmitStocktake,
  useDeleteStocktake,
  getListStocktakesQueryKey,
  getGetStocktakeQueryKey,
} from "@workspace/api-client-react";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { StocktakeItem } from "@workspace/api-client-react";

type View = "list" | "conduct";

const UNSORTED_SECTION = "Unsorted";

export default function StocktakePage() {
  const { activeVenueId } = useVenueStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<View>("list");
  const [activeStocktakeId, setActiveStocktakeId] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, string>>({}); // itemId → actualStock string
  const [notes, setNotes] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

  const { data: stocktakes, isLoading: isLoadingList } = useListStocktakes(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListStocktakesQueryKey(activeVenueId as number) } }
  );

  const { data: activeStocktake, isLoading: isLoadingDetail } = useGetStocktake(
    activeVenueId as number,
    activeStocktakeId as number,
    { query: { enabled: !!activeVenueId && !!activeStocktakeId, queryKey: getGetStocktakeQueryKey(activeVenueId as number, activeStocktakeId as number) } }
  );

  const createStocktake = useCreateStocktake();
  const submitStocktake = useSubmitStocktake();
  const deleteStocktake = useDeleteStocktake();

  const handleStart = useCallback(() => {
    if (!activeVenueId) return;
    createStocktake.mutate(
      { venueId: activeVenueId, data: {} },
      {
        onSuccess: (stocktake) => {
          queryClient.invalidateQueries({ queryKey: getListStocktakesQueryKey(activeVenueId) });
          const initialCounts: Record<number, string> = {};
          stocktake.items.forEach((item: StocktakeItem) => {
            initialCounts[item.id] = String(item.expectedStock);
          });
          setCounts(initialCounts);
          setNotes("");
          setSavedSections(new Set());
          setActiveSection("all");
          setActiveStocktakeId(stocktake.id);
          setView("conduct");
        },
        onError: () => toast({ title: "Error", description: "Could not start stocktake.", variant: "destructive" }),
      }
    );
  }, [activeVenueId, createStocktake, queryClient, toast]);

  const handleOpenExisting = useCallback((stocktakeId: number) => {
    if (!activeVenueId) return;
    setActiveStocktakeId(stocktakeId);
    setView("conduct");
    queryClient.prefetchQuery({
      queryKey: getGetStocktakeQueryKey(activeVenueId, stocktakeId),
    });
  }, [activeVenueId, queryClient]);

  const handleSubmit = useCallback(() => {
    if (!activeVenueId || !activeStocktakeId || !activeStocktake) return;
    const items = activeStocktake.items.map((item: StocktakeItem) => ({
      id: item.id,
      actualStock: parseFloat(counts[item.id] ?? String(item.expectedStock)) || 0,
    }));
    submitStocktake.mutate(
      { venueId: activeVenueId, stocktakeId: activeStocktakeId, data: { notes: notes || undefined, items } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStocktakesQueryKey(activeVenueId) });
          toast({ title: "Stocktake submitted", description: "Inventory counts have been updated." });
          setView("list");
          setActiveStocktakeId(null);
          setCounts({});
          setNotes("");
        },
        onError: () => toast({ title: "Error", description: "Could not submit stocktake.", variant: "destructive" }),
      }
    );
  }, [activeVenueId, activeStocktakeId, activeStocktake, counts, notes, submitStocktake, queryClient, toast]);

  const handleExportCSV = useCallback(() => {
    if (!activeStocktake) return;
    const date = new Date(activeStocktake.conductedAt).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
    const rows: string[] = [
      ["Item", "Unit", "Expected Qty", "Actual Qty", "Variance Qty", "Unit Cost ($)", "Variance Value ($)"].join(","),
    ];
    for (const item of activeStocktake.items) {
      const actual = item.actualStock ?? item.expectedStock;
      const variance = actual - item.expectedStock;
      const varianceValue = variance * item.unitCost;
      rows.push([
        `"${item.itemName.replace(/"/g, '""')}"`,
        `"${item.unit}"`,
        item.expectedStock.toFixed(3),
        actual.toFixed(3),
        variance.toFixed(3),
        item.unitCost.toFixed(2),
        varianceValue.toFixed(2),
      ].join(","));
    }
    const totalVariance = activeStocktake.items.reduce((sum, item) => {
      const actual = item.actualStock ?? item.expectedStock;
      return sum + (actual - item.expectedStock) * item.unitCost;
    }, 0);
    rows.push(["", "", "", "", "", "Total Variance", totalVariance.toFixed(2)].join(","));
    if (activeStocktake.notes) {
      rows.push("");
      rows.push(`"Notes: ${activeStocktake.notes.replace(/"/g, '""')}"`);
    }
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stocktake-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeStocktake]);

  const handleDelete = useCallback((stocktakeId: number) => {
    if (!activeVenueId) return;
    deleteStocktake.mutate(
      { venueId: activeVenueId, stocktakeId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStocktakesQueryKey(activeVenueId) });
          toast({ title: "Deleted", description: "Stocktake removed." });
          if (activeStocktakeId === stocktakeId) {
            setView("list");
            setActiveStocktakeId(null);
          }
        },
        onError: () => toast({ title: "Error", description: "Could not delete stocktake.", variant: "destructive" }),
      }
    );
  }, [activeVenueId, deleteStocktake, queryClient, toast, activeStocktakeId]);

  if (!activeVenueId) {
    return <div className="text-center p-8">Please select a venue first.</div>;
  }

  // ── Conduct view ────────────────────────────────────────────────────────────
  if (view === "conduct") {
    const isSubmitted = activeStocktake?.status === "submitted";
    const items: StocktakeItem[] = activeStocktake?.items ?? [];

    // Group items by storage location
    const sectionMap = new Map<string, StocktakeItem[]>();
    for (const item of items) {
      const loc = (item as any).section ?? (item as any).storageLocation ?? UNSORTED_SECTION;
      if (!sectionMap.has(loc)) sectionMap.set(loc, []);
      sectionMap.get(loc)!.push(item);
    }
    const sections = [...sectionMap.keys()].sort((a, b) => a === UNSORTED_SECTION ? 1 : b === UNSORTED_SECTION ? -1 : a.localeCompare(b));
    const hasMultipleSections = sections.length > 1;

    const visibleItems = activeSection === "all" ? items : (sectionMap.get(activeSection) ?? []);

    const totalVariance = items.reduce((sum, item) => {
      const actual = parseFloat(counts[item.id] ?? String(item.actualStock));
      return sum + (actual - item.expectedStock) * item.unitCost;
    }, 0);

    const draftVariances = visibleItems.map((item) => {
      const actual = parseFloat(counts[item.id] ?? String(item.actualStock));
      return { item, actual, variance: actual - item.expectedStock };
    });

    const handleSaveSection = async (section: string) => {
      if (!activeVenueId || !activeStocktakeId) return;
      const sectionItems = sectionMap.get(section) ?? [];
      const payload = sectionItems.map((item) => ({
        id: item.id,
        actualStock: parseFloat(counts[item.id] ?? String(item.actualStock)) || 0,
      }));
      try {
        const resp = await fetch(`/api/venues/${activeVenueId}/stocktakes/${activeStocktakeId}/items/section`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section, items: payload }),
        });
        if (!resp.ok) throw new Error("Failed to save section");
        setSavedSections(prev => new Set(prev).add(section));
        toast({ title: `${section} saved`, description: `${payload.length} item${payload.length !== 1 ? "s" : ""} recorded. Move to the next section when ready.` });
      } catch {
        toast({ title: "Could not save section", description: "Check your connection and try again.", variant: "destructive" });
      }
    };

    const sectionsComplete = sections.filter(s => savedSections.has(s)).length;

    return (
      <div className="space-y-5 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView("list"); setActiveStocktakeId(null); }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              {isSubmitted ? "Stocktake Results" : "Conducting Stocktake"}
            </h1>
            {activeStocktake && (
              <p className="text-sm text-muted-foreground">
                {new Date(activeStocktake.conductedAt).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          {isSubmitted && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-1.5" />
                Export CSV
              </Button>
              <Badge className="bg-status-healthy/10 text-status-healthy border-status-healthy/30">Submitted</Badge>
            </div>
          )}
        </div>

        {/* Variance summary */}
        {items.length > 0 && (
          <Card className={cn("border", totalVariance < -10 ? "border-status-critical/30 bg-status-critical/5" : totalVariance > 0 ? "border-status-healthy/30 bg-status-healthy/5" : "border-border bg-card")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Variance Value</p>
                <p className={cn("text-2xl font-bold", totalVariance < 0 ? "text-status-critical" : totalVariance > 0 ? "text-status-healthy" : "text-foreground")}>
                  {totalVariance >= 0 ? "+" : ""}${Math.abs(totalVariance).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Items</p>
                <p className="text-2xl font-bold text-foreground">{items.length}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section tabs — only when inventory has storage locations */}
        {!isSubmitted && hasMultipleSections && items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Count by section</p>
              {sectionsComplete > 0 && (
                <span className="text-xs text-primary font-semibold">{sectionsComplete}/{sections.length} sections saved</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveSection("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors touch-manipulation",
                  activeSection === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                All ({items.length})
              </button>
              {sections.map(sec => {
                const isSaved = savedSections.has(sec);
                const isActive = activeSection === sec;
                return (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors touch-manipulation flex items-center gap-1.5",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : isSaved
                          ? "bg-status-healthy/10 text-status-healthy border-status-healthy/40 hover:bg-status-healthy/20"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isSaved && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {sec} ({sectionMap.get(sec)?.length ?? 0})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoadingDetail ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 bg-card w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No inventory items to count. Add items to your inventory first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {activeSection === "all" ? "Count each item — enter your actual on-hand qty" : `Counting: ${activeSection}`}
            </p>
            {draftVariances.map(({ item, actual, variance }) => {
              const varianceValue = variance * item.unitCost;
              const hasVariance = Math.abs(variance) > 0.001;
              return (
                <Card key={item.id} className={cn(
                  "border transition-colors",
                  hasVariance && !isSubmitted && variance < 0 ? "border-status-risk/30 bg-status-risk/5" :
                  hasVariance && !isSubmitted && variance > 0 ? "border-status-healthy/30 bg-status-healthy/5" :
                  "border-border bg-card"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground leading-tight">{item.itemName}</p>
                          {(item as any).isInHousePrepped && (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
                              In-house
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expected: <strong>{item.expectedStock} {item.unit}</strong>
                          {" "}&middot; ${item.unitCost.toFixed(2)}/{item.unit}
                          {(item as any).productionRecipeName && (
                            <span className="text-blue-600"> via {(item as any).productionRecipeName}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isSubmitted ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              value={counts[item.id] ?? String(item.expectedStock)}
                              onChange={(e) => setCounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="w-24 h-9 text-center font-bold bg-background border-border text-sm"
                            />
                            <span className="text-xs text-muted-foreground w-8">{item.unit}</span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="font-bold text-foreground">{item.actualStock} {item.unit}</p>
                          </div>
                        )}
                        {hasVariance && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md",
                            variance < 0 ? "bg-status-critical/10 text-status-critical" : "bg-status-healthy/10 text-status-healthy"
                          )}>
                            {variance < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {variance > 0 ? "+" : ""}{variance.toFixed(2)}
                            <span className="text-[10px] font-normal ml-0.5">
                              (${varianceValue >= 0 ? "+" : ""}{varianceValue.toFixed(2)})
                            </span>
                          </div>
                        )}
                        {!hasVariance && (
                          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Save section button — shown when viewing a specific section */}
            {!isSubmitted && activeSection !== "all" && (
              <div className="pt-3">
                {savedSections.has(activeSection) ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-status-healthy/10 border border-status-healthy/30">
                    <CheckCircle2 className="w-4 h-4 text-status-healthy" />
                    <span className="text-sm font-semibold text-status-healthy">{activeSection} count saved</span>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 font-semibold"
                    variant="outline"
                    onClick={() => handleSaveSection(activeSection)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {activeSection} count complete — save &amp; move on
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes + submit */}
        {!isSubmitted && items.length > 0 && (
          <div className="space-y-3 pt-2">
            <Separator />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes (optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. End of month count, after service"
                className="bg-background border-border"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setView("list"); setActiveStocktakeId(null); }}
              >
                Save &amp; Exit
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                onClick={handleSubmit}
                disabled={submitStocktake.isPending}
              >
                {submitStocktake.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Submit All Counts
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Submitting will update your inventory to the figures above.
            </p>
          </div>
        )}

        {isSubmitted && (
          <div className="pt-2">
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => { setView("list"); setActiveStocktakeId(null); }}
            >
              Back to Stocktake History
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const draftStocktakes = stocktakes?.filter((s) => s.status === "draft") ?? [];
  const submittedStocktakes = stocktakes?.filter((s) => s.status === "submitted") ?? [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Stocktake
          </h1>
          <p className="text-muted-foreground mt-1">Monthly physical count. Compare what you have against what the system says.</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={handleStart}
          disabled={createStocktake.isPending}
        >
          {createStocktake.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Start Stocktake
        </Button>
      </div>

      {/* Draft in progress */}
      {draftStocktakes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Progress</p>
          {draftStocktakes.map((st) => (
            <Card key={st.id} className="border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleOpenExisting(st.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(st.conductedAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{st.itemCount} items to count</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(st.id); }}
                    disabled={deleteStocktake.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoadingList ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 bg-card w-full" />)}
        </div>
      ) : submittedStocktakes.length === 0 ? (
        <Card className="bg-card border-dashed border-2 border-border mt-4">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <ClipboardCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No stocktakes yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Run a stocktake at the end of each month. Count your physical stock and we'll update your inventory and flag discrepancies.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</p>
          {submittedStocktakes.map((st) => {
            const isNegative = (st.totalVarianceValue ?? 0) < 0;
            return (
              <Card key={st.id} className="border-border bg-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleOpenExisting(st.id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-status-healthy" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {new Date(st.conductedAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {st.itemCount} items &middot;{" "}
                        <span className={cn("font-medium", isNegative ? "text-status-critical" : "text-status-healthy")}>
                          {(st.totalVarianceValue ?? 0) >= 0 ? "+" : ""}${(st.totalVarianceValue ?? 0).toFixed(2)} variance
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(st.id); }}
                      disabled={deleteStocktake.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
