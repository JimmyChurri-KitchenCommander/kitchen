import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import {
  useListRecipes,
  getListRecipesQueryKey,
  useGetUnclassifiedRecipeCount,
  getGetUnclassifiedRecipeCountQueryKey,
  useActivateRecipe,
  useDeactivateRecipe,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChefHat, Plus, Search, Percent, Camera, X, Clock3, ClipboardList, Power, PowerOff, AlertTriangle, TrendingUp } from "lucide-react";
import ShareDialog from "@/components/ShareDialog";
import RecipeImportDialog from "@/components/RecipeImportDialog";
import ClassifyRecipesDialog from "@/components/ClassifyRecipesDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "menu", label: "Menu" },
  { value: "prep", label: "Prep" },
] as const;

type TypeFilter = typeof TYPE_FILTERS[number]["value"];

// Chef-centric category order for filter pills
const CATEGORY_ORDER = [
  "Starters", "Mains", "Sides", "Sauces", "Desserts",
  "Pastry", "Snacks", "Specials", "Special", "Other",
];

function sortCategories(cats: string[]): string[] {
  const ordered: string[] = [];
  for (const c of CATEGORY_ORDER) {
    if (cats.includes(c)) ordered.push(c);
  }
  for (const c of cats) {
    if (!ordered.includes(c)) ordered.push(c);
  }
  return ordered;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "waiting_approval", label: "Pending Approval" },
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]["value"];

export default function RecipesPage() {
  const { activeVenueId } = useVenueStore();
  const queryClient = useQueryClient();
  const { data: roleData } = useVenueRole();
  const canManage = roleData?.canManage ?? true;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [importOpen, setImportOpen] = useState(false);
  const [classifyOpen, setClassifyOpen] = useState(false);

  const activateRecipeMutation = useActivateRecipe({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(activeVenueId as number) }),
    },
  });
  const deactivateRecipeMutation = useDeactivateRecipe({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(activeVenueId as number) }),
    },
  });

  const dismissKey = activeVenueId ? `kc-classify-dismissed-${activeVenueId}` : null;

  const { data: unclassified } = useGetUnclassifiedRecipeCount(
    activeVenueId as number,
    {
      query: {
        enabled: !!activeVenueId,
        queryKey: getGetUnclassifiedRecipeCountQueryKey(activeVenueId as number),
      },
    }
  );

  useEffect(() => {
    if (!dismissKey || !unclassified) return;
    if (unclassified.count > 0 && localStorage.getItem(dismissKey) !== "1") {
      setClassifyOpen(true);
    }
  }, [dismissKey, unclassified]);

  const { data: recipes, isLoading } = useListRecipes(
    activeVenueId as number,
    undefined,
    { query: { enabled: !!activeVenueId, queryKey: getListRecipesQueryKey(activeVenueId as number) } }
  );

  const categories = useMemo(() => {
    if (!recipes) return [];
    const cats = new Set(recipes.map(r => r.category).filter(Boolean) as string[]);
    return sortCategories(Array.from(cats));
  }, [recipes]);

  const driftRecipes = useMemo(() => {
    if (!recipes) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return recipes.filter(r => {
      if (r.totalCost === 0) return false;
      if (!r.lastCostUpdateAt) return true;
      return new Date(r.lastCostUpdateAt) < cutoff;
    });
  }, [recipes]);

  if (!activeVenueId) return <div className="text-center p-8">Please select a venue first.</div>;

  const filteredRecipes = recipes?.filter(r => {
    const recipeStatus = r.status ?? "active";
    const matchesStatus = statusFilter === "all" || recipeStatus === statusFilter;
    const matchesSearch = !search
      || r.name.toLowerCase().includes(search.toLowerCase())
      || (r.category && r.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !activeCategory || r.category === activeCategory;
    const recipeType = r.recipeType ?? null;
    const matchesType = typeFilter === "all"
      || (typeFilter === "menu" && (recipeType === "menu" || recipeType === null))
      || (typeFilter === "prep" && recipeType === "prep");
    return matchesStatus && matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-5 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" />
            Recipes
          </h1>
          <p className="text-muted-foreground mt-1">Live costing and specs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border font-semibold gap-2"
            onClick={() => setImportOpen(true)}
          >
            <Camera className="w-4 h-4" /> Import
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            <Link href="/recipes/new"><Plus className="w-4 h-4 mr-2" /> New Recipe</Link>
          </Button>
        </div>
      </div>

      <RecipeImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {activeVenueId && (
        <ClassifyRecipesDialog
          open={classifyOpen}
          onOpenChange={setClassifyOpen}
          venueId={activeVenueId}
          onDismiss={() => { if (dismissKey) localStorage.setItem(dismissKey, "1"); }}
        />
      )}

      {unclassified && unclassified.count > 0 && !classifyOpen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-semibold">{unclassified.count}</span> recipe{unclassified.count === 1 ? "" : "s"} still need to be sorted into menu dishes or prep components.
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 dark:border-amber-700"
            onClick={() => setClassifyOpen(true)}
          >
            Sort now
          </Button>
        </div>
      )}

      {driftRecipes.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                {driftRecipes.length} recipe{driftRecipes.length === 1 ? "" : "s"} may have stale costs
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                Ingredient prices may have moved since these were last costed. Open each recipe to recalculate.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {driftRecipes.slice(0, 6).map(r => (
                  <Link
                    key={r.id}
                    href={`/recipes/${r.id}`}
                    className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
                  >
                    {r.name}
                  </Link>
                ))}
                {driftRecipes.length > 6 && (
                  <span className="text-xs text-orange-600 dark:text-orange-400 self-center">+{driftRecipes.length - 6} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Type filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors",
              typeFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-border pb-3">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search + category filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            className="pl-9 bg-card border-border text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors touch-manipulation",
                !activeCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors touch-manipulation",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 bg-card w-full" />)}
        </div>
      ) : !recipes || recipes.length === 0 ? (
        <Card className="bg-card border-dashed border-2 border-border mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No recipes yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create recipes from your inventory to track live food costs and margins.
            </p>
            <Button asChild>
              <Link href="/recipes/new"><Plus className="w-4 h-4 mr-2" /> Create Recipe</Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredRecipes?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No recipes match {activeCategory ? `"${activeCategory}"` : "your search"}.
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="ml-2 text-primary underline text-sm">Clear filter</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes?.map(recipe => {
            const isHighFC = recipe.foodCostPercent && recipe.foodCostPercent > 35;
            const isInactive = recipe.status === "inactive";
            const isPending = recipe.status === "waiting_approval";

            return (
              <div key={recipe.id} className={cn("relative", isInactive && "opacity-60")}>
              <Link href={`/recipes/${recipe.id}`}>
                <Card className={cn(
                  "bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col",
                  isPending && "border-amber-400/50 dark:border-amber-700/50",
                )}>
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">{recipe.name}</h3>
                          {recipe.recipeType === "prep" && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                              <ClipboardList className="w-3 h-3" /> Prep
                            </Badge>
                          )}
                          {isInactive && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-secondary text-muted-foreground border-border">
                              Inactive
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                              Pending
                            </Badge>
                          )}
                        </div>
                        {recipe.category && <p className="text-sm text-muted-foreground">{recipe.category}</p>}
                      </div>
                      {recipe.sellingPrice ? (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-foreground">${recipe.sellingPrice.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Sell Price</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-auto pt-4 border-t border-border/50">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Cost / Ptn</p>
                          <p className="text-lg font-bold text-foreground">
                            ${recipe.portionCost.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">FC %</p>
                          {recipe.foodCostPercent ? (
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "text-lg font-bold",
                                isHighFC ? "text-status-critical" : "text-status-healthy"
                              )}>
                                {recipe.foodCostPercent.toFixed(1)}%
                              </span>
                              {isHighFC && <Percent className="w-3 h-3 text-status-critical" />}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No sell price</span>
                          )}
                        </div>
                      </div>
                      {recipe.reviewStale && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mb-2">
                          <Clock3 className="w-3 h-3" />
                          <span>
                            {recipe.daysSinceReview != null
                              ? `Not reviewed in ${recipe.daysSinceReview} days`
                              : "Never reviewed"}
                          </span>
                        </div>
                      )}
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        {canManage && activeVenueId && (
                          isInactive || isPending ? (
                            <button
                              title="Activate recipe"
                              disabled={activateRecipeMutation.isPending}
                              onClick={() => activateRecipeMutation.mutate({ venueId: activeVenueId, recipeId: recipe.id })}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-status-healthy hover:bg-green-500/10 transition-colors"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              title="Deactivate recipe"
                              disabled={deactivateRecipeMutation.isPending}
                              onClick={() => deactivateRecipeMutation.mutate({ venueId: activeVenueId, recipeId: recipe.id })}
                              className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-muted-foreground hover:bg-secondary transition-all"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                        <ShareDialog itemId={recipe.id} itemType="recipe" itemName={recipe.name} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
