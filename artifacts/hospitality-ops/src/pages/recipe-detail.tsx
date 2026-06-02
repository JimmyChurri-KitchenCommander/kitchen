import { useVenueStore } from "@/stores/venueStore";
import {
  useGetRecipe,
  useDeleteRecipe,
  useAddRecipeIngredient,
  useDeleteRecipeIngredient,
  useLogRecipePrep,
  useAdaptRecipe,
  useListInventory,
  useListPrepTasks,
  useListRecipes,
  useAddRecipeComponent,
  useDeleteRecipeComponent,
  useCreateInventoryItem,
  getGetRecipeQueryKey,
  getListInventoryQueryKey,
  getListRecipesQueryKey,
  getListPrepTasksQueryKey,
} from "@workspace/api-client-react";
import { useLocation, useParams, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Trash2, Loader2, Plus, Edit2, TrendingDown, ChefHat,
  PackageCheck, Sparkles, GitBranch, AlertCircle, CheckCircle2, X, Link as LinkIcon,
  Circle, Clock, ClipboardList, Info, RefreshCw, ShieldAlert, Scale,
} from "lucide-react";

import { CostExplainer } from "@/components/CostExplainer";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { StepTechniqueHints } from "@/components/TechniqueExplainer";
import { useApprenticeStore } from "@/stores/apprenticeModeStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALLERGEN_LABELS: Record<string, string> = {
  celery: "Celery", cereals_gluten: "Cereals (gluten)", crustaceans: "Crustaceans",
  eggs: "Eggs", fish: "Fish", lupin: "Lupin", milk: "Milk", molluscs: "Molluscs",
  mustard: "Mustard", nuts: "Tree nuts", peanuts: "Peanuts", sesame: "Sesame",
  soya: "Soya", sulphur_dioxide: "Sulphur dioxide",
};

type EnrichedComponent = {
  id: number;
  prepRecipeId: number;
  prepRecipeName: string;
  quantity: number;
  unit: string;
  yieldFactor: number;
  prepYield: number;
  prepYieldUnit: string | null;
  prepPortionCost: number;
  totalCost: number;
};

function PrepComponentsSection({
  venueId, recipeId, components,
}: { venueId: number; recipeId: number; components: EnrichedComponent[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [prepRecipeId, setPrepRecipeId] = useState<string>("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("g");

  const { data: prepRecipes } = useListRecipes(
    venueId,
    { type: "prep" },
    {
      query: {
        enabled: open,
        queryKey: [...getListRecipesQueryKey(venueId), "prep"],
      },
    }
  );

  const addComponent = useAddRecipeComponent();
  const deleteComponent = useDeleteRecipeComponent();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetRecipeQueryKey(venueId, recipeId) });
    queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(venueId) });
  };

  const handleAdd = () => {
    const pid = parseInt(prepRecipeId);
    const q = parseFloat(qty);
    if (!pid || !q || !unit) {
      toast({ title: "Pick a prep recipe and enter quantity + unit", variant: "destructive" });
      return;
    }
    addComponent.mutate(
      { venueId, recipeId, data: { prepRecipeId: pid, quantity: q, unit } },
      {
        onSuccess: () => {
          toast({ title: "Component linked" });
          invalidate();
          setOpen(false);
          setPrepRecipeId(""); setQty(""); setUnit("g");
        },
        onError: (err: any) => toast({ title: "Failed to link", description: err?.message, variant: "destructive" }),
      }
    );
  };

  const handleDelete = (componentId: number) => {
    deleteComponent.mutate(
      { venueId, recipeId, componentId },
      { onSuccess: invalidate },
    );
  };

  const totalComponentCost = components.reduce((sum, c) => sum + (c.totalCost ?? 0), 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Prep components
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1.5" /> Add prep</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link a prep recipe</DialogTitle>
              <DialogDescription>Pull in a sauce, batch, or component you've already costed.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prep recipe</Label>
                <Select value={prepRecipeId} onValueChange={setPrepRecipeId}>
                  <SelectTrigger><SelectValue placeholder="Choose a prep recipe" /></SelectTrigger>
                  <SelectContent>
                    {(prepRecipes ?? []).filter(r => r.id !== recipeId).map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</Label>
                  <Input type="number" step="0.01" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 50" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Unit</Label>
                  <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="g, ml, ptn" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={addComponent.isPending}>
                {addComponent.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Link prep
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {components.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No prep components linked. Add sauces, batches, or mise that feed this dish.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {components.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <Link href={`/recipes/${c.prepRecipeId}`} className="font-medium text-foreground hover:text-primary hover:underline">
                    {c.prepRecipeName}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {c.quantity} {c.unit} · ${c.prepPortionCost.toFixed(3)} / {c.prepYieldUnit || "unit"}
                  </p>
                </div>
                <div className="w-20 text-right font-medium text-foreground">${c.totalCost.toFixed(2)}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(c.id)} disabled={deleteComponent.isPending}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <div className="px-4 py-3 bg-secondary/30 flex items-center">
              <div className="flex-1 text-sm font-semibold text-foreground">Total component cost</div>
              <div className="w-20 text-right font-bold text-foreground">${totalComponentCost.toFixed(2)}</div>
              <div className="w-8" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MethodSteps({ method, apprenticeMode = false }: { method: string; apprenticeMode?: boolean }) {
  const lines = method.split("\n").map(l => l.trim()).filter(Boolean);
  const hasNumbering = lines.some(l => /^(\d+[.):]|\bstep\s*\d+[.):]\s)/i.test(l));

  const steps = lines.map(line =>
    hasNumbering
      ? line.replace(/^(\d+[.):\s]+|\bstep\s*\d+[.):\s]+)/i, "").trim()
      : line
  );

  if (steps.length <= 1) {
    return (
      <div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{method}</p>
        {apprenticeMode && <StepTechniqueHints stepText={method} apprenticeMode={apprenticeMode} className="mt-2" />}
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {steps.map((step, idx) => (
        <li key={idx} className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
            {idx + 1}
          </span>
          <div className="flex-1 pt-0.5">
            <p className="text-sm text-foreground leading-relaxed">{step}</p>
            {apprenticeMode && <StepTechniqueHints stepText={step} apprenticeMode={apprenticeMode} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function RecipeDetailPage() {
  const { activeVenueId } = useVenueStore();
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const recipeId = parseInt(params.id!);

  const search = useSearch();
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [ingQuantity, setIngQuantity] = useState("");
  const [ingUnit, setIngUnit] = useState("");
  const [ingYieldFactor, setIngYieldFactor] = useState("100");
  const [invSearch, setInvSearch] = useState("");
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [newItemStock, setNewItemStock] = useState("0");
  const [newItemParLevel, setNewItemParLevel] = useState("0");

  const [isLogPrepOpen, setIsLogPrepOpen] = useState(false);
  const [prepPortions, setPrepPortions] = useState("");
  const [prepResult, setPrepResult] = useState<{ itemName: string; deducted: number; unit: string; remaining: number }[] | null>(null);

  const [isAdapting, setIsAdapting] = useState(false);
  const [scaleCovers, setScaleCovers] = useState<string>("");

  const { data: recipe, isLoading: isLoadingRecipe } = useGetRecipe(
    activeVenueId as number, recipeId,
    { query: { enabled: !!activeVenueId, queryKey: getGetRecipeQueryKey(activeVenueId as number, recipeId) } }
  );
  const { data: inventory } = useListInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListInventoryQueryKey(activeVenueId as number) } }
  );

  const addIngredient = useAddRecipeIngredient();
  const deleteIngredient = useDeleteRecipeIngredient();
  const deleteRecipe = useDeleteRecipe();
  const logPrep = useLogRecipePrep();
  const adaptRecipe = useAdaptRecipe();
  const createItem = useCreateInventoryItem();

  const TODAY = new Date().toISOString().slice(0, 10);
  const { data: todayTasks = [] } = useListPrepTasks(
    activeVenueId ?? 0, { date: TODAY },
    { query: { enabled: !!activeVenueId, queryKey: getListPrepTasksQueryKey(activeVenueId ?? 0, { date: TODAY }) } }
  );

  type RawPrepTask = {
    id: number; title: string; description: string | null; category: string;
    status: string; shift: string; priority: string; assignedTo: string | null;
    prepDate: string; createdAt: string;
  };
  const { data: allRecipeTasks = [] } = useQuery<RawPrepTask[]>({
    queryKey: ["recipe-prep-tasks", activeVenueId, recipeId],
    queryFn: async () => {
      const resp = await fetch(`/api/venues/${activeVenueId}/recipes/${recipeId}/prep-tasks`);
      if (!resp.ok) return [];
      return resp.json() as Promise<RawPrepTask[]>;
    },
    enabled: !!activeVenueId && !isNaN(recipeId),
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("setup") === "1") {
      setIsAddIngredientOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [search]);

  const { apprenticeMode } = useApprenticeStore();

  if (!activeVenueId) return null;
  if (isLoadingRecipe) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!recipe) return <div className="p-8 text-center text-muted-foreground">Recipe not found</div>;

  const resetIngredientDialog = () => {
    setIsAddIngredientOpen(false);
    setInvSearch(""); setSelectedInvId(""); setIngQuantity(""); setIngUnit(""); setIngYieldFactor("100");
    setIsCreatingItem(false); setNewItemName(""); setNewItemUnit(""); setNewItemCost(""); setNewItemStock("0"); setNewItemParLevel("0");
  };

  const handleCreateAndSelect = () => {
    if (!newItemName.trim() || !newItemUnit.trim() || !newItemCost) return;
    createItem.mutate({
      venueId: activeVenueId,
      data: {
        name: newItemName.trim(),
        unit: newItemUnit.trim(),
        averageCost: parseFloat(newItemCost),
        currentStock: parseFloat(newItemStock) || 0,
        parLevel: parseFloat(newItemParLevel) || 0,
      },
    }, {
      onSuccess: (created) => {
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
        setSelectedInvId(created.id.toString());
        setIngUnit(created.unit);
        setIsCreatingItem(false);
        setNewItemName(""); setNewItemUnit(""); setNewItemCost(""); setNewItemStock("0"); setNewItemParLevel("0");
        setInvSearch("");
        toast({ title: `"${created.name}" added to inventory` });
      },
      onError: (err: unknown) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create item", variant: "destructive" }),
    });
  };

  const handleAddIngredient = () => {
    if (!selectedInvId || !ingQuantity || !ingUnit) return;
    const yf = Math.min(100, Math.max(1, parseFloat(ingYieldFactor) || 100)) / 100;
    addIngredient.mutate({
      venueId: activeVenueId, recipeId,
      data: { inventoryItemId: parseInt(selectedInvId), quantity: parseFloat(ingQuantity), unit: ingUnit, yieldFactor: yf },
    }, {
      onSuccess: () => {
        resetIngredientDialog();
        queryClient.invalidateQueries({ queryKey: getGetRecipeQueryKey(activeVenueId, recipeId) });
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
        toast({ title: "Ingredient added" });
      },
      onError: (err: unknown) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }),
    });
  };

  const handleDeleteIngredient = (ingId: number) => {
    deleteIngredient.mutate({ venueId: activeVenueId, recipeId, ingredientId: ingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRecipeQueryKey(activeVenueId, recipeId) });
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
        toast({ title: "Ingredient removed" });
      },
    });
  };

  const handleDeleteRecipe = () => {
    if (!confirm("Delete this recipe entirely?")) return;
    deleteRecipe.mutate({ venueId: activeVenueId, recipeId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(activeVenueId) });
        setLocation("/recipes");
        toast({ title: "Recipe deleted" });
      },
    });
  };

  const handleLogPrep = () => {
    const portionsNum = parseFloat(prepPortions);
    if (!prepPortions || isNaN(portionsNum) || portionsNum <= 0) return;
    logPrep.mutate({ venueId: activeVenueId, recipeId, data: { portions: portionsNum } }, {
      onSuccess: (result) => {
        setPrepResult(result.deductions);
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
        queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "dashboard"] });
      },
      onError: (err: unknown) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }),
    });
  };

  const handleAdapt = () => {
    setIsAdapting(true);
    adaptRecipe.mutate({ venueId: activeVenueId, recipeId }, {
      onSuccess: (adapted) => {
        setIsAdapting(false);
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(activeVenueId) });
        toast({ title: "Recipe adapted", description: adapted.name });
        setLocation(`/recipes/${adapted.id}`);
      },
      onError: (err: unknown) => {
        setIsAdapting(false);
        toast({ title: "Could not adapt recipe", description: err instanceof Error ? err.message : "AI adaptation failed", variant: "destructive" });
      },
    });
  };

  const isHighFC = recipe.foodCostPercent && recipe.foodCostPercent > 35;
  const isAdapted = !!recipe.parentRecipeId;
  const availableCount = recipe.ingredientAvailability?.filter(i => i.inStock).length ?? 0;
  const totalCount = recipe.ingredientAvailability?.length ?? 0;
  const missingCount = totalCount - availableCount;
  const linkedTasks = todayTasks.filter(t => t.recipeId === recipeId);
  const linkedDone = linkedTasks.filter(t => t.status === "done").length;
  const linkedInProgress = linkedTasks.filter(t => t.status === "in_progress").length;

  // Deduplicate by title — keep most recent entry per title
  const seenTitles = new Set<string>();
  const uniquePrepTasks: typeof allRecipeTasks = [];
  for (const task of allRecipeTasks) {
    if (!seenTitles.has(task.title)) {
      seenTitles.add(task.title);
      uniquePrepTasks.push(task);
    }
  }
  // Build a map from title → today's task (so we can show current status)
  const todayTaskByTitle = new Map(linkedTasks.map(t => [t.title, t]));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link href="/recipes"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{recipe.name}</h1>
              {recipe.category && <Badge variant="secondary">{recipe.category}</Badge>}
              {isAdapted && (
                <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                  <GitBranch className="w-3 h-3 mr-1" /> Adapted
                </Badge>
              )}
              {recipe.recipeType === "prep" && (
                <Badge className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  <ClipboardList className="w-3 h-3 mr-1" /> Prep recipe
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              Yield: {recipe.yield} {recipe.yieldUnit || "ptn"} &bull; Portion: {recipe.portionSize} {recipe.portionUnit}
            </p>
            {/* Allergen chips */}
            {(() => {
              const allergens = (recipe as any).allergens as string[] | null | undefined;
              if (!allergens || allergens.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  {allergens.map((a) => (
                    <Badge key={a} className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 text-xs font-medium">
                      {ALLERGEN_LABELS[a] ?? a}
                    </Badge>
                  ))}
                </div>
              );
            })()}
            {isAdapted && recipe.adaptationNotes && (
              <p className="text-sm text-violet-600 mt-1 italic">{recipe.adaptationNotes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Adapt button */}
          <Button
            variant="outline"
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
            onClick={handleAdapt}
            disabled={isAdapting}
          >
            {isAdapting
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <Sparkles className="w-4 h-4 mr-2" />}
            {isAdapting ? "Adapting…" : "Adapt for current stock"}
          </Button>

          {/* Log Prep dialog */}
          <Dialog open={isLogPrepOpen} onOpenChange={(open) => { setIsLogPrepOpen(open); if (!open) { setPrepResult(null); setPrepPortions(""); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                <ChefHat className="w-4 h-4 mr-2" /> Log Prep
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Log Prep Run</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Record how many portions you prepped. Inventory will be deducted automatically using gross quantities (after yield loss).
                </DialogDescription>
              </DialogHeader>
              {prepResult ? (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-2 text-status-healthy font-semibold">
                    <PackageCheck className="w-5 h-5" /> Inventory updated
                  </div>
                  <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider grid grid-cols-3 gap-2">
                      <span>Item</span><span className="text-right">Deducted</span><span className="text-right">Remaining</span>
                    </div>
                    {prepResult.map((d, i) => (
                      <div key={i} className="px-4 py-3 grid grid-cols-3 gap-2 text-sm">
                        <span className="font-medium text-foreground truncate">{d.itemName}</span>
                        <span className="text-right text-status-critical">&minus;{d.deducted.toFixed(3)} {d.unit}</span>
                        <span className="text-right text-muted-foreground">{d.remaining.toFixed(3)} {d.unit}</span>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setIsLogPrepOpen(false); setPrepResult(null); setPrepPortions(""); }} className="bg-primary text-primary-foreground w-full">Done</Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="grid gap-2">
                    <Label className="text-foreground">Number of portions prepped</Label>
                    <Input type="number" step="1" min="1" placeholder={`e.g. ${recipe.yield}`}
                      className="bg-background border-border text-foreground"
                      value={prepPortions} onChange={e => setPrepPortions(e.target.value)} />
                    {recipe.yield > 1 && (
                      <p className="text-xs text-muted-foreground">Recipe yields {recipe.yield} {recipe.yieldUnit || "portions"} per batch</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLogPrepOpen(false)}>Cancel</Button>
                    <Button onClick={handleLogPrep} disabled={!prepPortions || parseFloat(prepPortions) <= 0 || logPrep.isPending} className="bg-primary text-primary-foreground">
                      {logPrep.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Deduct from stock
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button variant="outline" asChild>
            <Link href={`/recipes/${recipe.id}/edit`}><Edit2 className="w-4 h-4 mr-2" /> Settings</Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDeleteRecipe}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Version switcher ── */}
      {(recipe.adaptations && recipe.adaptations.length > 0) && (
        <Card className="bg-violet-50 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">Recipe versions</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/recipes/${recipe.parentRecipeId ?? recipe.id}`}>
                <button className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  !isAdapted
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white text-violet-700 border-violet-300 hover:bg-violet-50"
                )}>
                  Original
                </button>
              </Link>
              {recipe.adaptations.map(a => (
                <Link key={a.id} href={`/recipes/${a.id}`}>
                  <button className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    recipeId === a.id
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-violet-700 border-violet-300 hover:bg-violet-50"
                  )}>
                    {a.name}
                  </button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stock availability banner ── */}
      {recipe.ingredientAvailability && recipe.ingredientAvailability.length > 0 && (
        <div className={cn(
          "flex items-start gap-3 px-4 py-3 rounded-lg border text-sm",
          missingCount > 0
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-green-50 border-green-200 text-green-800"
        )}>
          {missingCount > 0
            ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />}
          <div>
            {missingCount > 0 ? (
              <>
                <span className="font-semibold">{missingCount} ingredient{missingCount > 1 ? "s" : ""} not in stock:</span>{" "}
                {recipe.ingredientAvailability
                  .filter(i => !i.inStock)
                  .map(i => i.itemName)
                  .join(", ")}
                {". "}
                <button
                  className="underline font-medium hover:no-underline"
                  onClick={handleAdapt}
                  disabled={isAdapting}
                >
                  {isAdapting ? "Adapting…" : "Adapt recipe to use what's in stock"}
                </button>
              </>
            ) : (
              <span className="font-semibold">All {totalCount} ingredients in stock — ready to run.</span>
            )}
          </div>
        </div>
      )}

      {/* ── Needs ordering (adapted recipes only) ── */}
      {recipe.needsOrdering && recipe.needsOrdering.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">Needs ordering — not substituted:</p>
            <ul className="space-y-1">
              {recipe.needsOrdering.map((item, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-center gap-2">
                  <X className="w-3 h-3 shrink-0" />
                  <span className="font-medium">{item.itemName}</span>
                  <span className="text-amber-600">— {item.reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Prep Tasks ── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Prep Tasks
              {linkedTasks.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {linkedDone}/{linkedTasks.length} done today
                </span>
              )}
            </CardTitle>
            <Link href="/prep-board">
              <Button variant="ghost" size="sm" className="text-xs text-primary h-7">
                Full board
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {uniquePrepTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No prep tasks linked to this recipe yet. Add them on the prep board and link them to this recipe.
            </p>
          ) : (
            <>
              {uniquePrepTasks.map(task => {
                const todayTask = todayTaskByTitle.get(task.title);
                const isScheduledToday = !!todayTask;
                const isDone = todayTask?.status === "done";
                const isInProg = todayTask?.status === "in_progress";
                return (
                  <div key={task.id} className={cn(
                    "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border transition-opacity",
                    !isScheduledToday
                      ? "opacity-45 bg-secondary/20 border-border"
                      : isDone
                        ? "bg-secondary/30 border-border"
                        : isInProg
                          ? "bg-primary/5 border-primary/20"
                          : "bg-background border-border"
                  )}>
                    {!isScheduledToday
                      ? <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      : isDone
                        ? <CheckCircle2 className="w-4 h-4 text-status-healthy mt-0.5 shrink-0" />
                        : isInProg
                          ? <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          : <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium leading-tight",
                        !isScheduledToday && "line-through text-muted-foreground",
                        isDone && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      {(todayTask?.assignedTo || task.description) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {todayTask?.assignedTo ?? task.description}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium shrink-0",
                      !isScheduledToday
                        ? "text-muted-foreground/60"
                        : isDone
                          ? "text-status-healthy"
                          : isInProg
                            ? "text-primary"
                            : "text-muted-foreground"
                    )}>
                      {!isScheduledToday
                        ? "Not today"
                        : isDone
                          ? "Done"
                          : isInProg
                            ? "In progress"
                            : "To do"}
                    </span>
                  </div>
                );
              })}
              {linkedTasks.length > 0 && linkedInProgress === 0 && linkedDone === linkedTasks.length && (
                <p className="text-xs text-status-healthy font-semibold pt-1">All today's prep complete — ready for service.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── KPI Row ── */}
      {recipe.ingredients.length > 0 && recipe.totalCost === 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <span>Food cost and selling price will update automatically as ingredient costs are set through invoice uploads or manual price edits.</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Cost</p>
              <CostExplainer metricKey="total_cost" apprenticeMode={apprenticeMode} />
            </div>
            <p className="text-2xl font-bold text-foreground">${recipe.totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cost per Portion</p>
              <CostExplainer metricKey="portion_cost" apprenticeMode={apprenticeMode} />
            </div>
            <p className="text-2xl font-bold text-foreground">${recipe.portionCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Selling Price</p>
              <CostExplainer metricKey="selling_price" apprenticeMode={apprenticeMode} />
            </div>
            <p className="text-2xl font-bold text-foreground">{recipe.sellingPrice ? `$${recipe.sellingPrice.toFixed(2)}` : "—"}</p>
            {recipe.sellingPrice && recipe.gpPercent != null && (
              <p className="text-xs text-muted-foreground mt-1">
                <GlossaryTooltip term="GP%">GP%</GlossaryTooltip>
                {" "}{recipe.gpPercent.toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card className={cn("border", isHighFC ? "bg-status-critical/10 border-status-critical/30" : "bg-card border-border")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-1 mb-1">
              <p className={cn("text-xs uppercase tracking-wider font-semibold", isHighFC ? "text-status-critical" : "text-muted-foreground")}>
                Food Cost %
              </p>
              <CostExplainer metricKey="food_cost_pct" apprenticeMode={apprenticeMode} />
            </div>
            <p className={cn("text-2xl font-bold flex items-center gap-2", isHighFC ? "text-status-critical" : "text-status-healthy")}>
              {recipe.foodCostPercent ? `${recipe.foodCostPercent.toFixed(1)}%` : "—"}
              {isHighFC && <TrendingDown className="w-5 h-5" />}
            </p>
            {isHighFC && apprenticeMode && (
              <p className="text-xs text-status-critical/80 mt-1 leading-snug">
                Protein or yield loss is likely driving this up.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Scaling Calculator ── */}
      {recipe.ingredients.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">Scale Recipe</span>
              <span className="text-xs text-muted-foreground ml-1">Base yield: {recipe.yield} {recipe.yieldUnit || "ptn"}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Label className="text-sm text-muted-foreground whitespace-nowrap shrink-0">Covers</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={String(recipe.yield)}
                  value={scaleCovers}
                  onChange={(e) => setScaleCovers(e.target.value)}
                  className="bg-background border-border h-9 text-sm w-28"
                />
              </div>
              {scaleCovers && parseFloat(scaleCovers) > 0 && parseFloat(scaleCovers) !== recipe.yield && (
                <div className="text-sm text-muted-foreground">
                  Factor: <span className="font-bold text-primary">{(parseFloat(scaleCovers) / recipe.yield).toFixed(2)}×</span>
                </div>
              )}
              {scaleCovers && (
                <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setScaleCovers("")}>
                  Reset
                </Button>
              )}
            </div>
            {scaleCovers && parseFloat(scaleCovers) > 0 && (
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-secondary/50 grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Ingredient</span><span className="text-right">Original</span><span className="text-right">Scaled</span>
                </div>
                {recipe.ingredients.map((ing) => {
                  const factor = parseFloat(scaleCovers) / recipe.yield;
                  const scaledQty = ing.quantity * factor;
                  return (
                    <div key={ing.id} className="px-4 py-2.5 grid grid-cols-3 gap-2 text-sm hover:bg-secondary/20">
                      <span className="text-foreground font-medium truncate">{ing.itemName}</span>
                      <span className="text-right text-muted-foreground">{ing.quantity} {ing.unit}</span>
                      <span className="text-right font-semibold text-primary">{scaledQty % 1 === 0 ? scaledQty : scaledQty.toFixed(2)} {ing.unit}</span>
                    </div>
                  );
                })}
                <div className="px-4 py-2.5 bg-secondary/30 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">Est. total cost for {scaleCovers} covers</span>
                  <span className="font-bold text-foreground">
                    ${(recipe.totalCost * (parseFloat(scaleCovers) / recipe.yield)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Ingredient Cost Breakdown ── */}
      {recipe.ingredients.length > 0 && recipe.totalCost > 0 && (() => {
        const sorted = [...recipe.ingredients].sort((a, b) => b.totalCost - a.totalCost);
        const top = sorted.slice(0, 5);
        const barColors = [
          "bg-primary",
          "bg-primary/70",
          "bg-primary/50",
          "bg-primary/35",
          "bg-primary/20",
        ];
        return (
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost Drivers</p>
                <CostExplainer metricKey="ingredient_contribution" apprenticeMode={apprenticeMode} />
              </div>
              {apprenticeMode && (
                <p className="text-xs text-muted-foreground mb-3 -mt-1">
                  The ingredients that cost the most in this dish. Small changes here have the biggest impact on margin.
                </p>
              )}
              <div className="space-y-2.5">
                {top.map((ing, idx) => {
                  const pct = recipe.totalCost > 0 ? (ing.totalCost / recipe.totalCost) * 100 : 0;
                  return (
                    <div key={ing.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate max-w-[60%]">{ing.itemName}</span>
                        <span className="text-xs text-muted-foreground font-mono">${ing.totalCost.toFixed(2)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn("h-1.5 rounded-full transition-all", barColors[idx] ?? "bg-primary/15")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {recipe.lastCostUpdateAt && (() => {
                const days = Math.floor((Date.now() - new Date(recipe.lastCostUpdateAt!).getTime()) / 86_400_000);
                return (
                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border">
                    <RefreshCw className="w-3 h-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {days === 0
                        ? "Ingredient costs updated today."
                        : days === 1
                        ? "Ingredient costs updated yesterday."
                        : `Ingredient costs last updated ${days} days ago.`}
                      {apprenticeMode && " Supplier price changes or yield adjustments may affect this."}
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Ingredients</h2>
            <Dialog open={isAddIngredientOpen} onOpenChange={(open) => { if (!open) resetIngredientDialog(); else setIsAddIngredientOpen(true); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[460px] bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {isCreatingItem ? "New Inventory Item" : "Add Ingredient"}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {isCreatingItem
                      ? "Create this item in inventory, then set the quantity for this recipe."
                      : "Pick an existing inventory item, or create one on the spot if it's not listed yet."}
                  </DialogDescription>
                </DialogHeader>

                {isCreatingItem ? (
                  /* ── Step 2: create new inventory item inline ── */
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label className="text-foreground">Item Name</Label>
                      <Input
                        placeholder="e.g. Baby Spinach"
                        className="bg-background border-border text-foreground"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-foreground">Unit</Label>
                        <Input placeholder="kg, bunch, litre…"
                          className="bg-background border-border text-foreground"
                          value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-foreground">Cost per unit ($)</Label>
                        <Input type="number" step="0.01" placeholder="0.00"
                          className="bg-background border-border text-foreground"
                          value={newItemCost} onChange={e => setNewItemCost(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-foreground">Current stock</Label>
                        <Input type="number" step="0.1" placeholder="0"
                          className="bg-background border-border text-foreground"
                          value={newItemStock} onChange={e => setNewItemStock(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-foreground">Par level</Label>
                        <Input type="number" step="0.1" placeholder="0"
                          className="bg-background border-border text-foreground"
                          value={newItemParLevel} onChange={e => setNewItemParLevel(e.target.value)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Step 1: search & select existing item ── */
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label className="text-foreground">Inventory Item</Label>
                      <Input
                        placeholder="Search inventory..."
                        className="bg-background border-border text-foreground mb-1"
                        value={invSearch}
                        onChange={e => setInvSearch(e.target.value)}
                      />
                      <Select value={selectedInvId} onValueChange={(v) => {
                        setSelectedInvId(v);
                        setInvSearch("");
                        const item = inventory?.find(i => i.id.toString() === v);
                        if (item) setIngUnit(item.unit);
                      }}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(inventory ?? [])
                            .filter(i => i.name.toLowerCase().includes(invSearch.toLowerCase()))
                            .map(i => (
                              <SelectItem key={i.id} value={i.id.toString()}>
                                {i.name}
                                <span className="text-muted-foreground ml-1.5 text-xs">
                                  ${i.averageCost.toFixed(2)}/{i.unit}
                                </span>
                              </SelectItem>
                            ))}
                          {(inventory ?? []).filter(i => i.name.toLowerCase().includes(invSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-3 text-sm text-center text-muted-foreground">
                              {invSearch.trim()
                                ? <span>No match — <button
                                    className="text-primary font-semibold underline-offset-2 hover:underline"
                                    onMouseDown={e => { e.preventDefault(); setNewItemName(invSearch.trim()); setIsCreatingItem(true); }}
                                  >create "{invSearch.trim()}"</button></span>
                                : "Start typing to search..."}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-foreground">Net Quantity</Label>
                        <Input type="number" step="0.01" placeholder="e.g. 0.5"
                          className="bg-background border-border text-foreground"
                          value={ingQuantity} onChange={(e) => setIngQuantity(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-foreground">Unit</Label>
                        <Input placeholder="e.g. kg, ml, piece"
                          className="bg-background border-border text-foreground"
                          value={ingUnit} onChange={(e) => setIngUnit(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-foreground">Yield %</Label>
                      <Input type="number" step="1" min="1" max="100"
                        className="bg-background border-border text-foreground"
                        value={ingYieldFactor} onChange={(e) => setIngYieldFactor(e.target.value)} />
                      <p className="text-xs text-muted-foreground">
                        {ingYieldFactor && ingQuantity
                          ? `You'll buy ${(parseFloat(ingQuantity) / (Math.max(1, parseFloat(ingYieldFactor)) / 100)).toFixed(3)} ${ingUnit || "units"} gross to get ${ingQuantity} ${ingUnit || "units"} net.`
                          : "100% = no prep waste. Squid: ~55%. Fish fillet from whole: ~45-50%."}
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {isCreatingItem ? (
                    <>
                      <Button variant="outline" onClick={() => { setIsCreatingItem(false); setNewItemName(""); setNewItemUnit(""); setNewItemCost(""); setNewItemStock("0"); setNewItemParLevel("0"); }}>
                        Back
                      </Button>
                      <Button
                        onClick={handleCreateAndSelect}
                        disabled={!newItemName.trim() || !newItemUnit.trim() || !newItemCost || createItem.isPending}
                        className="bg-primary text-primary-foreground"
                      >
                        {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Select"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={resetIngredientDialog}>Cancel</Button>
                      <Button onClick={handleAddIngredient} disabled={!selectedInvId || !ingQuantity || !ingUnit || addIngredient.isPending} className="bg-primary text-primary-foreground">
                        {addIngredient.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Recipe"}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {recipe.ingredients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">No ingredients yet</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Link inventory items to calculate food cost and check stock availability.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setIsAddIngredientOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add first ingredient
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Scale calculator */}
                  <div className="px-4 py-3 bg-secondary/30 flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scale for</span>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder={String(recipe.yield)}
                      value={scaleCovers}
                      onChange={e => setScaleCovers(e.target.value)}
                      className="w-20 h-7 text-sm bg-background border-border text-center"
                    />
                    <span className="text-xs text-muted-foreground">covers</span>
                    {scaleCovers && parseFloat(scaleCovers) !== recipe.yield && (
                      <span className="text-xs text-primary font-semibold">
                        {(parseFloat(scaleCovers) / recipe.yield).toFixed(2)}x base recipe
                      </span>
                    )}
                    {scaleCovers && (
                      <button
                        type="button"
                        onClick={() => setScaleCovers("")}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Header — desktop only */}
                  <div className="hidden md:flex px-4 py-2.5 items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50">
                    <div className="w-2.5 mr-2 shrink-0" />
                    <div className="flex-1">Item</div>
                    <div className="w-32 text-right">Gross Qty</div>
                    <div className="w-16 text-right ml-2">Yield</div>
                    <div className="w-20 text-right ml-2">Cost</div>
                    <div className="w-8 ml-1" />
                  </div>

                  {recipe.ingredients.map(ing => {
                    const yf = ing.yieldFactor ?? 1;
                    const hasLoss = yf < 0.999;
                    const avail = recipe.ingredientAvailability?.find(a => a.itemName === ing.itemName);
                    const scaleFactor = scaleCovers && parseFloat(scaleCovers) > 0 && recipe.yield > 0
                      ? parseFloat(scaleCovers) / recipe.yield
                      : 1;
                    const scaledGross = ing.grossQuantity * scaleFactor;
                    const scaledNet = ing.quantity * scaleFactor;
                    const scaledCost = ing.totalCost * scaleFactor;
                    return (
                      <div key={ing.id} className={cn("px-4 py-3 hover:bg-secondary/50 transition-colors", avail && !avail.inStock && "bg-amber-50/50")}>
                        <div className="flex items-start gap-2">
                          {/* Stock dot */}
                          <span className={cn(
                            "w-2 h-2 rounded-full shrink-0 mt-2",
                            avail ? (avail.inStock ? "bg-status-healthy" : "bg-amber-400") : "bg-transparent"
                          )} />

                          {/* Name + badges + mobile sub-line */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/inventory/${ing.inventoryItemId}`}
                                className="font-medium text-foreground hover:text-primary hover:underline leading-snug">
                                {ing.itemName}
                              </Link>
                              {(ing as any).isInHousePrepped && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">In-house</Badge>
                              )}
                            </div>
                            {/* Mobile-only: qty + cost on second line */}
                            <div className="flex items-center gap-3 mt-0.5 md:hidden flex-wrap">
                              <span className="text-sm text-muted-foreground font-mono">
                                {scaledGross.toFixed(3)} {ing.unit}
                              </span>
                              {hasLoss && (
                                <span className="text-xs font-medium text-amber-600">{Math.round(yf * 100)}% yield</span>
                              )}
                              <span className="text-sm font-semibold text-foreground">${scaledCost.toFixed(2)}</span>
                            </div>
                            {hasLoss && (
                              <p className="text-xs text-muted-foreground">net {scaledNet.toFixed(3)} {ing.unit}</p>
                            )}
                            {avail && !avail.inStock && (
                              <p className="text-xs text-amber-600">Out of stock — {avail.currentStock.toFixed(3)} {avail.unit}</p>
                            )}
                          </div>

                          {/* Desktop-only: tabular columns */}
                          <div className="hidden md:flex items-center shrink-0">
                            <span className="w-32 text-right text-muted-foreground font-mono text-sm">
                              {scaledGross.toFixed(3)} {ing.unit}
                            </span>
                            <span className="w-16 text-right ml-2">
                              {hasLoss ? (
                                <GlossaryTooltip term="Yield %">
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 font-semibold border-dashed border-primary/60 cursor-pointer">
                                    {Math.round(yf * 100)}%
                                  </Badge>
                                </GlossaryTooltip>
                              ) : (
                                <span className="text-xs text-muted-foreground">100%</span>
                              )}
                            </span>
                            <span className="w-20 text-right ml-2 font-medium text-foreground">
                              ${scaledCost.toFixed(2)}
                            </span>
                          </div>

                          {/* Delete */}
                          <Button variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDeleteIngredient(ing.id)}
                            disabled={deleteIngredient.isPending}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="px-4 py-3 flex items-center bg-secondary/30">
                    <div className="w-2.5 mr-2 shrink-0" />
                    <div className="flex-1 text-sm font-semibold text-foreground">Total ingredient cost</div>
                    <div className="hidden md:flex items-center">
                      <span className="w-32" />
                      <span className="w-16 ml-2" />
                      <span className="w-20 text-right ml-2 font-bold text-foreground">${recipe.totalCost.toFixed(2)}</span>
                    </div>
                    <span className="md:hidden font-bold text-foreground">${recipe.totalCost.toFixed(2)}</span>
                    <div className="w-8 ml-1" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {recipe.ingredients.length > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              Gross quantities shown — what you need to purchase accounting for prep waste. Costs based on gross.
            </p>
          )}

          {/* PREP COMPONENTS — only on menu recipes */}
          {recipe.recipeType !== "prep" && (
            <PrepComponentsSection
              venueId={activeVenueId!}
              recipeId={recipe.id}
              components={(recipe.components ?? []) as EnrichedComponent[]}
            />
          )}

          {/* USED IN — only on prep recipes */}
          {recipe.recipeType === "prep" && (recipe.usedIn?.length ?? 0) > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Used in
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {recipe.usedIn!.map(u => (
                    <li key={u.id}>
                      <Link href={`/recipes/${u.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                        <span className="font-medium text-foreground">{u.name}</span>
                        <span className="text-xs text-muted-foreground">Menu</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Method / Notes / Other versions */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-lg">Method</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {recipe.method ? (
                <MethodSteps method={recipe.method} apprenticeMode={apprenticeMode} />
              ) : (
                <p className="text-muted-foreground text-sm italic">No method added yet.</p>
              )}
            </CardContent>
          </Card>

          {recipe.platingNotes && (
            <Card className="bg-card border-border bg-primary/5 border-primary/20">
              <CardHeader className="border-b border-primary/10 py-4">
                <CardTitle className="text-lg text-primary">Plating & Garnish</CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-sm text-foreground">{recipe.platingNotes}</CardContent>
            </Card>
          )}

          {/* Other recipe versions sidebar */}
          {recipe.adaptations && recipe.adaptations.length > 0 && (
            <Card className="bg-violet-50 border-violet-200">
              <CardHeader className="border-b border-violet-200 py-3">
                <CardTitle className="text-sm font-semibold text-violet-700 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" /> Other versions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {recipe.adaptations.map(a => (
                    <Link key={a.id} href={`/recipes/${a.id}`}>
                      <div className="flex items-start gap-2 p-2 rounded hover:bg-violet-100 transition-colors cursor-pointer">
                        <LinkIcon className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-violet-800">{a.name}</p>
                          {a.adaptationNotes && (
                            <p className="text-xs text-violet-600 line-clamp-2">{a.adaptationNotes}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
