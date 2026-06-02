import { useVenueStore } from "@/stores/venueStore";
import {
  useGetMenu, useUpdateMenu, useAddMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useListRecipes, useListPrepTasks,
  getGetMenuQueryKey, getListMenusQueryKey, getListRecipesQueryKey, getListPrepTasksQueryKey,
} from "@workspace/api-client-react";
import type { MenuItemCosted } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  ArrowLeft, Plus, Trash2, Loader2, TrendingDown,
  Percent, Edit2, AlertTriangle, CheckCircle, Star, GitBranch, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TARGET_FC = 30;

function fcColor(fc: number | null) {
  if (fc === null) return "text-muted-foreground";
  if (fc > TARGET_FC + 5) return "text-status-critical";
  if (fc > TARGET_FC) return "text-status-low";
  return "text-status-healthy";
}

const SECTION_ORDER = ["special", "starter", "main", "dessert", "side", "other"];
const SECTION_LABEL: Record<string, string> = {
  special: "Today's Specials",
  starter: "Starters",
  main: "Mains",
  dessert: "Desserts",
  side: "Sides",
  other: "Other",
};

const PLURAL_TO_SECTION: Record<string, string> = {
  specials: "special", starters: "starter", mains: "main",
  desserts: "dessert", sides: "side", others: "other",
};

function normaliseSection(category: string | null | undefined): string {
  const raw = (category ?? "other").toLowerCase().trim();
  if (SECTION_ORDER.includes(raw)) return raw;
  if (PLURAL_TO_SECTION[raw]) return PLURAL_TO_SECTION[raw]!;
  return "other";
}

function groupItemsBySection(items: MenuItemCosted[]): Map<string, MenuItemCosted[]> {
  const map = new Map<string, MenuItemCosted[]>();
  for (const item of items) {
    const section = normaliseSection(item.recipeCategory);
    if (!map.has(section)) map.set(section, []);
    map.get(section)!.push(item);
  }
  const ordered = new Map<string, MenuItemCosted[]>();
  for (const key of SECTION_ORDER) {
    if (map.has(key)) ordered.set(key, map.get(key)!);
  }
  return ordered;
}

interface PrepStats { total: number; done: number; inProgress: number }

interface ItemRowProps {
  item: MenuItemCosted;
  onEdit: (item: MenuItemCosted) => void;
  onDelete: (id: number, name: string) => void;
  prepStats: PrepStats | null;
}

function PrepPill({ stats }: { stats: PrepStats }) {
  if (stats.total === 0) return null;
  const allDone = stats.done === stats.total;
  const anyActive = stats.inProgress > 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
      allDone
        ? "bg-green-100 text-green-700"
        : anyActive
          ? "bg-blue-50 text-primary"
          : "bg-secondary text-muted-foreground"
    )}>
      {allDone
        ? <CheckCircle2 className="w-3 h-3" />
        : anyActive
          ? <Clock className="w-3 h-3" />
          : null}
      {stats.done}/{stats.total}
    </span>
  );
}

function ItemRow({ item, onEdit, onDelete, prepStats }: ItemRowProps) {
  const fc = item.foodCostPercent ?? null;
  const sp = item.sellingPrice ?? null;
  const isHighFC = fc !== null && fc > TARGET_FC;
  const isSpecial = (item.recipeCategory ?? "").toLowerCase() === "special";

  return (
    <tr className={cn(
      "hover:bg-secondary/50 transition-colors",
      isHighFC && "bg-status-critical/5",
      isSpecial && "bg-amber-50/60",
    )}>
      <td className="px-5 py-3">
        <div className="flex items-start gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">{item.recipeName}</p>
              {isSpecial && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                  <Star className="w-2.5 h-2.5 mr-1" /> Special
                </Badge>
              )}
              {(item as any).isAdapted && (
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                  <GitBranch className="w-2.5 h-2.5 mr-1" /> Adapted
                </Badge>
              )}
              {prepStats && prepStats.total > 0 && <PrepPill stats={prepStats} />}
            </div>
            {(item as any).ingredientWarnings && (item as any).ingredientWarnings.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600">
                  Low stock: {(item as any).ingredientWarnings.map((w: any) => w.itemName).join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
        ${item.portionCost.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right">
        {sp !== null ? (
          <span className="font-semibold text-foreground">${sp.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground italic text-xs">No price</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {fc !== null ? (
          <span className={cn("font-bold", fcColor(fc))}>
            {fc.toFixed(1)}%
            {isHighFC && <TrendingDown className="w-3.5 h-3.5 inline ml-1" />}
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(item)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(item.id, item.recipeName)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function SectionTable({ section, items, onEdit, onDelete, prepByRecipeId }: {
  section: string;
  items: MenuItemCosted[];
  onEdit: (item: MenuItemCosted) => void;
  onDelete: (id: number, name: string) => void;
  prepByRecipeId: Map<number, PrepStats>;
}) {
  const isSpecial = section === "special";
  const label = SECTION_LABEL[section] ?? section;

  return (
    <Card className={cn("border", isSpecial ? "border-amber-200 bg-amber-50/30" : "bg-card border-border")}>
      <CardHeader className={cn("border-b py-3 px-5", isSpecial ? "border-amber-200" : "border-border")}>
        <CardTitle className={cn("text-base font-bold flex items-center gap-2", isSpecial ? "text-amber-800" : "text-foreground")}>
          {isSpecial && <Star className="w-4 h-4 text-amber-500" />}
          {label}
          <span className={cn("text-xs font-normal", isSpecial ? "text-amber-600" : "text-muted-foreground")}>
            ({items.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-xs", isSpecial ? "border-amber-100 bg-amber-50/50" : "border-border bg-secondary/50")}>
                <th className="px-5 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Dish</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Portion Cost</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Selling Price</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">FC%</th>
                <th className="px-4 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  prepStats={prepByRecipeId.get(item.recipeId) ?? null}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MenuDetailPage() {
  const { activeVenueId } = useVenueStore();
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const menuId = parseInt(params.id!);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [addSellingPrice, setAddSellingPrice] = useState("");
  const [editItem, setEditItem] = useState<MenuItemCosted | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const { data: menu, isLoading } = useGetMenu(activeVenueId as number, menuId, {
    query: { enabled: !!activeVenueId, queryKey: getGetMenuQueryKey(activeVenueId as number, menuId) },
  });
  const { data: recipes = [] } = useListRecipes(activeVenueId as number, undefined, {
    query: { enabled: !!activeVenueId && isAddOpen, queryKey: getListRecipesQueryKey(activeVenueId as number) },
  });

  const TODAY = new Date().toISOString().slice(0, 10);
  const { data: todayTasks = [] } = useListPrepTasks(activeVenueId ?? 0, { date: TODAY }, {
    query: { enabled: !!activeVenueId, queryKey: getListPrepTasksQueryKey(activeVenueId ?? 0, { date: TODAY }) },
  });

  const addItem = useAddMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  useUpdateMenu();

  if (!activeVenueId) return null;
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!menu) return <div className="text-center p-8 text-muted-foreground">Menu not found.</div>;
  void setLocation;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetMenuQueryKey(activeVenueId, menuId) });
    qc.invalidateQueries({ queryKey: getListMenusQueryKey(activeVenueId) });
  };

  const handleAddItem = () => {
    if (!selectedRecipeId) return;
    addItem.mutate({
      venueId: activeVenueId, menuId,
      data: {
        recipeId: parseInt(selectedRecipeId),
        sellingPrice: addSellingPrice ? parseFloat(addSellingPrice) : undefined,
      },
    }, {
      onSuccess: () => {
        setIsAddOpen(false); setSelectedRecipeId(""); setAddSellingPrice("");
        invalidate();
        toast({ title: "Dish added to menu" });
      },
      onError: () => toast({ title: "Error", description: "Could not add dish.", variant: "destructive" }),
    });
  };

  const handleUpdatePrice = () => {
    if (!editItem) return;
    updateItem.mutate({
      venueId: activeVenueId, menuId, itemId: editItem.id,
      data: { sellingPrice: editPrice ? parseFloat(editPrice) : undefined },
    }, {
      onSuccess: () => { setEditItem(null); invalidate(); toast({ title: "Price updated" }); },
    });
  };

  const handleDelete = (itemId: number, recipeName: string) => {
    if (!confirm(`Remove "${recipeName}" from this menu?`)) return;
    deleteItem.mutate({ venueId: activeVenueId, menuId, itemId }, {
      onSuccess: () => { invalidate(); toast({ title: "Dish removed" }); },
    });
  };

  const existingRecipeIds = new Set(menu.items.map(i => i.recipeId));
  const availableRecipes = recipes.filter(r => !existingRecipeIds.has(r.id));
  const highFCItems = menu.items.filter(i => (i.foodCostPercent ?? null) !== null && i.foodCostPercent! > TARGET_FC);
  const sections = groupItemsBySection(menu.items);
  const specialItems = sections.get("special") ?? [];

  const prepByRecipeId = new Map<number, PrepStats>();
  for (const t of todayTasks) {
    if (t.recipeId == null) continue;
    const cur = prepByRecipeId.get(t.recipeId) ?? { total: 0, done: 0, inProgress: 0 };
    prepByRecipeId.set(t.recipeId, {
      total: cur.total + 1,
      done: cur.done + (t.status === "done" ? 1 : 0),
      inProgress: cur.inProgress + (t.status === "in_progress" ? 1 : 0),
    });
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link href="/menu"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{menu.name}</h1>
              <Badge variant={menu.isActive ? "default" : "secondary"}
                className={menu.isActive ? "bg-primary/10 text-primary border-primary/30" : ""}>
                {menu.isActive ? "Active" : "Draft"}
              </Badge>
            </div>
            {menu.description && <p className="text-muted-foreground">{menu.description}</p>}
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Add Dish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Dish to Menu</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-foreground">Recipe</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Choose a recipe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRecipes.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name} {r.category ? `— ${r.category}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Selling Price (optional override)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" step="0.01" placeholder="Leave blank to use recipe price"
                    className="bg-background border-border text-foreground pl-7"
                    value={addSellingPrice} onChange={e => setAddSellingPrice(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddItem} disabled={!selectedRecipeId || addItem.isPending} className="bg-primary text-primary-foreground">
                {addItem.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add to menu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Food Cost</p>
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className={cn("text-3xl font-bold", fcColor(menu.avgFoodCostPercent ?? null))}>
              {menu.avgFoodCostPercent !== null ? `${(menu.avgFoodCostPercent ?? 0).toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Target: &lt;{TARGET_FC}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenue Potential</p>
            </div>
            <p className="text-3xl font-bold text-foreground">${(menu.totalRevenuePotential ?? 0).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">per full menu cover</p>
          </CardContent>
        </Card>
        <Card className={cn("border", highFCItems.length > 0 ? "bg-status-critical/5 border-status-critical/30" : "bg-card border-border")}>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-1">
              <p className={cn("text-xs uppercase tracking-wider font-semibold", highFCItems.length > 0 ? "text-status-critical" : "text-muted-foreground")}>
                Dishes Over Target FC
              </p>
              {highFCItems.length > 0 ? <AlertTriangle className="w-4 h-4 text-status-critical" /> : <CheckCircle className="w-4 h-4 text-status-healthy" />}
            </div>
            <p className={cn("text-3xl font-bold", highFCItems.length > 0 ? "text-status-critical" : "text-status-healthy")}>
              {highFCItems.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {highFCItems.length === 0 ? "All dishes within target" : "above 30% food cost"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Specials callout */}
      {specialItems.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <Star className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <span className="font-semibold">{specialItems.length} special{specialItems.length > 1 ? "s" : ""} on today:</span>{" "}
            {specialItems.map(i => i.recipeName).join(", ")}.
            {specialItems.some(i => (i as any).ingredientWarnings?.length > 0) && (
              <span className="ml-1 text-amber-700 font-medium">Some specials have low-stock ingredients — check before service.</span>
            )}
          </span>
        </div>
      )}

      {/* Dish sections */}
      {menu.items.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center text-muted-foreground">
            No dishes on this menu yet. Add from your recipe library above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Array.from(sections.entries()).map(([section, items]) => (
            <SectionTable
              key={section}
              section={section}
              items={items}
              onEdit={(item) => { setEditItem(item); setEditPrice(item.sellingPrice?.toString() ?? ""); }}
              onDelete={handleDelete}
              prepByRecipeId={prepByRecipeId}
            />
          ))}
        </div>
      )}

      {/* Edit price dialog */}
      <Dialog open={editItem !== null} onOpenChange={open => { if (!open) setEditItem(null); }}>
        <DialogContent className="sm:max-w-[360px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Price — {editItem?.recipeName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label className="text-foreground">Selling Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input type="number" step="0.01" placeholder="e.g. 28.00"
                className="bg-background border-border text-foreground pl-7"
                value={editPrice} onChange={e => setEditPrice(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdatePrice} disabled={updateItem.isPending} className="bg-primary text-primary-foreground">
              {updateItem.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
