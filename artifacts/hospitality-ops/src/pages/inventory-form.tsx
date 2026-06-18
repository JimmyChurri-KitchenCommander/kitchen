import { useVenueStore } from "@/stores/venueStore";
import { 
  useCreateInventoryItem, 
  useUpdateInventoryItem, 
  useGetInventoryItem,
  useListSuppliers,
  useDeleteInventoryItem,
  useGetInventoryItemPriceHistory,
  useListRecipes,
  useSuggestInventoryItemFields,
  getGetInventoryItemQueryKey,
  getGetInventoryItemPriceHistoryQueryKey,
  getListSuppliersQueryKey,
  getListRecipesQueryKey,
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Trash2, Loader2, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";

const STORAGE_LOCATIONS = [
  "Cool Room", "Dry Store", "Freezer", "Service Fridge",
  "Dairy", "Meat", "Veg / Produce", "Fish", "Pastry", "Bakery",
];

const CATEGORIES = [
  "Fruit & Veg", "Meat", "Seafood", "Dairy", "Dry Goods",
  "Herbs & Spices", "Oils & Condiments", "Beverages", "Bakery & Pastry", "Frozen", "Other",
];

const STOCK_TYPES = [
  { value: "raw", label: "Raw stock", description: "Purchased ingredients like beef, tomatoes, flour" },
  { value: "prep", label: "Prep stock", description: "In-house mise en place like sauces, marinades, pickles" },
  { value: "finished", label: "Finished stock", description: "Ready-to-sell or portioned items" },
] as const;

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required (e.g. kg, L, unit)"),
  currentStock: z.coerce.number().min(0, "Stock cannot be negative"),
  averageCost: z.coerce.number().min(0, "Cost cannot be negative"),
  parLevel: z.coerce.number().min(0, "Par level cannot be negative"),
  supplierId: z.coerce.number().optional().nullable(),
  shelfLifeDays: z.coerce.number().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  productionRecipeId: z.coerce.number().optional().nullable(),
  stockType: z.enum(["raw", "prep", "finished"]),
  storageLocation: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export default function InventoryFormPage() {
  const { activeVenueId } = useVenueStore();
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiSuggested, setAiSuggested] = useState<{ storageLocation?: string | null; category?: string | null } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNew = !params.id || params.id === "new";
  const itemId = isNew ? null : parseInt(params.id!);

  const { data: item, isLoading: isLoadingItem } = useGetInventoryItem(
    activeVenueId as number,
    itemId as number,
    { query: { enabled: !!activeVenueId && !isNew, queryKey: getGetInventoryItemQueryKey(activeVenueId as number, itemId as number) } }
  );

  const { data: suppliers } = useListSuppliers(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListSuppliersQueryKey(activeVenueId as number) } }
  );

  const { data: recipes = [] } = useListRecipes(
    activeVenueId as number,
    undefined,
    { query: { enabled: !!activeVenueId, queryKey: getListRecipesQueryKey(activeVenueId as number) } }
  );

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();
  const suggestMutation = useSuggestInventoryItemFields();

  const { data: priceHistory } = useGetInventoryItemPriceHistory(
    activeVenueId as number,
    itemId as number,
    { query: { enabled: !!activeVenueId && !isNew && !!itemId, queryKey: getGetInventoryItemPriceHistoryQueryKey(activeVenueId as number, itemId as number) } }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      unit: "",
      currentStock: 0,
      averageCost: 0,
      parLevel: 0,
      stockType: "raw",
    },
  });

  useEffect(() => {
    if (item && !isNew) {
      form.reset({
        name: item.name,
        unit: item.unit,
        currentStock: item.currentStock,
        averageCost: item.averageCost,
        parLevel: item.parLevel,
        supplierId: item.supplierId,
        shelfLifeDays: item.shelfLifeDays,
        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : null,
        productionRecipeId: item.productionRecipeId ?? null,
        stockType: ((item as { stockType?: "raw" | "prep" | "finished" }).stockType ?? (item.isInHousePrepped ? "prep" : "raw")),
        storageLocation: item.storageLocation ?? null,
        category: (item as any).category ?? null,
      });
    }
  }, [item, isNew, form]);

  const handleNameChange = useCallback((name: string) => {
    if (!isNew || !activeVenueId || name.length < 3) return;
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(() => {
      setIsSuggesting(true);
      suggestMutation.mutate(
        { venueId: activeVenueId, data: { name } },
        {
          onSuccess: (result) => {
            setAiSuggested(result);
            const current = form.getValues();
            if (result.storageLocation && !current.storageLocation) {
              form.setValue("storageLocation", result.storageLocation);
            }
            if (result.category && !current.category) {
              form.setValue("category", result.category);
            }
            setIsSuggesting(false);
          },
          onError: () => setIsSuggesting(false),
        }
      );
    }, 700);
  }, [isNew, activeVenueId, suggestMutation, form]);

  if (!activeVenueId) return <div className="p-8 text-center">Select a venue first.</div>;
  if (!isNew && isLoadingItem) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      supplierId: values.supplierId || undefined,
      shelfLifeDays: values.shelfLifeDays || undefined,
      // Convert local date string (YYYY-MM-DD) to ISO datetime for the API
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      productionRecipeId: values.productionRecipeId || undefined,
      storageLocation: values.storageLocation || undefined,
      category: values.category || undefined,
    };

    if (isNew) {
      createMutation.mutate({ venueId: activeVenueId, data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "inventory"] });
          toast({ title: "Item added successfully" });
          setLocation("/inventory");
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    } else {
      updateMutation.mutate({ venueId: activeVenueId, itemId: itemId!, data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "inventory"] });
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "inventory", itemId] });
          toast({ title: "Item updated successfully" });
          setLocation("/inventory");
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    }
  };

  const handleDelete = () => {
    if (!confirm("Delete this inventory item?")) return;
    deleteMutation.mutate({ venueId: activeVenueId, itemId: itemId! }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "inventory"] });
        toast({ title: "Item deleted" });
        setLocation("/inventory");
      }
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/inventory"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isNew ? "New Inventory Item" : "Edit Item"}</h1>
          <p className="text-sm text-muted-foreground">{isNew ? "Add to your prep whiteboard." : item?.name}</p>
        </div>
        {!isNew && (
          <Button variant="ghost" size="icon" className="ml-auto text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground flex items-center gap-2">
                        Item Name
                        {isNew && isSuggesting && (
                          <span className="flex items-center gap-1 text-xs text-primary font-normal">
                            <Loader2 className="w-3 h-3 animate-spin" /> Suggesting...
                          </span>
                        )}
                        {isNew && aiSuggested && !isSuggesting && (
                          <span className="flex items-center gap-1 text-xs text-primary font-normal">
                            <Sparkles className="w-3 h-3" /> Auto-filled
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Kosher Salt"
                          className="bg-background border-border"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleNameChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Unit of Measure</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. kg, L, unit" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Current Stock</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Par Level</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormDescription>Alerts below this</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="averageCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Sourcing & Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Category</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                        value={field.value ?? "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Kitchen Stock Layer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select stock layer..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STOCK_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {STOCK_TYPES.find(type => type.value === field.value)?.description}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Primary Supplier</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))} 
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select supplier..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {suppliers?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storageLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Storage Location</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                        value={field.value ?? "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select location..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          {STORAGE_LOCATIONS.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                  control={form.control}
                  name="shelfLifeDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Shelf Life (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          className="bg-background border-border" 
                          value={field.value || ""} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>Used for expiry risk</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Batch Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-background border-border"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>Flags as expiry risk within 3 days</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>In-House Production</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="productionRecipeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Produced by Recipe</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                      value={field.value?.toString() ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Purchased externally..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Purchased externally</SelectItem>
                        {recipes.map(r => (
                          <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      If this item is made in-house (soffritto, stocks, pastry), link the recipe. Costs and prep alerts will use the recipe instead of unit price.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-12" disabled={isPending}>
            {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isNew ? "Create Item" : "Save Changes"}
          </Button>
        </form>
      </Form>

      {/* ── Cost History ───────────────────────────────────────────── */}
      {!isNew && priceHistory && priceHistory.length > 0 && (() => {
        const sorted = [...priceHistory].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        const chartData = sorted.map((p) => ({
          date: new Date(p.recordedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
          price: p.newPrice,
        }));
        const prices = sorted.map((p) => p.newPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const change = lastPrice - firstPrice;
        const changePct = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
        const isUp = change > 0;
        const isFlat = Math.abs(change) < 0.001;

        return (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cost History</span>
                {!isFlat && (
                  <span className={cn(
                    "flex items-center gap-1 text-sm font-semibold",
                    isUp ? "text-status-critical" : "text-status-healthy"
                  )}>
                    {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isUp ? "+" : ""}{changePct.toFixed(1)}% over {sorted.length} records
                  </span>
                )}
                {isFlat && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                    <Minus className="w-4 h-4" /> Stable cost
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Current</p>
                  <p className="text-xl font-bold text-foreground">${lastPrice.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Low</p>
                  <p className="text-xl font-bold text-status-healthy">${minPrice.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">High</p>
                  <p className="text-xl font-bold text-status-critical">${maxPrice.toFixed(4)}</p>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v.toFixed(2)}`}
                      width={52}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }}
                      formatter={(v: number) => [`$${v.toFixed(4)}`, "Cost"]}
                    />
                    <ReferenceLine y={firstPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground">
                Cost recorded each time this item is invoiced and applied. Changes here flow through to all recipe food costs automatically.
              </p>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}