import { useVenueStore } from "@/stores/venueStore";
import { 
  useCreateRecipe, 
  useUpdateRecipe, 
  useGetRecipe,
  useDeleteRecipe,
  useAddRecipeIngredient,
  useDeleteRecipeIngredient,
  useListInventory,
  getGetRecipeQueryKey,
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Loader2, DollarSign, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "wouter";

// We'll separate the builder into a separate file for ingredients logic, 
// this is the main setup form.
const EU_ALLERGENS = [
  { key: "celery",          label: "Celery" },
  { key: "cereals_gluten",  label: "Cereals (gluten)" },
  { key: "crustaceans",     label: "Crustaceans" },
  { key: "eggs",            label: "Eggs" },
  { key: "fish",            label: "Fish" },
  { key: "lupin",           label: "Lupin" },
  { key: "milk",            label: "Milk / Dairy" },
  { key: "molluscs",        label: "Molluscs" },
  { key: "mustard",         label: "Mustard" },
  { key: "nuts",            label: "Tree nuts" },
  { key: "peanuts",         label: "Peanuts" },
  { key: "sesame",          label: "Sesame" },
  { key: "soya",            label: "Soya" },
  { key: "sulphur_dioxide", label: "Sulphur dioxide" },
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  recipeType: z.enum(["menu", "prep"]),
  yield: z.coerce.number().min(1, "Yield must be at least 1"),
  yieldUnit: z.string().optional(),
  portionSize: z.coerce.number().min(0.01),
  portionUnit: z.string().min(1),
  sellingPrice: z.coerce.number().optional().nullable(),
  method: z.string().optional(),
  platingNotes: z.string().optional(),
  allergens: z.array(z.string()).default([]),
});

export default function RecipeFormPage() {
  const { activeVenueId } = useVenueStore();
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isNew = !params.id || params.id === "new";
  const recipeId = isNew ? null : parseInt(params.id!);

  // If not new, we fetch detail in recipe-detail.tsx
  // This form is just for the top level recipe metadata

  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  
  const { data: recipe, isLoading } = useGetRecipe(
    activeVenueId as number,
    recipeId as number,
    { query: { enabled: !!activeVenueId && !isNew, queryKey: getGetRecipeQueryKey(activeVenueId as number, recipeId as number) } }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      recipeType: "menu",
      yield: 1,
      yieldUnit: "ptn",
      portionSize: 1,
      portionUnit: "ptn",
      allergens: [],
    },
  });

  useEffect(() => {
    if (recipe && !isNew) {
      form.reset({
        name: recipe.name,
        category: recipe.category || "",
        recipeType: ((recipe as any).recipeType === "prep" ? "prep" : "menu") as "menu" | "prep",
        yield: recipe.yield,
        yieldUnit: recipe.yieldUnit || "",
        portionSize: recipe.portionSize,
        portionUnit: recipe.portionUnit,
        sellingPrice: recipe.sellingPrice,
        method: recipe.method || "",
        platingNotes: recipe.platingNotes || "",
        allergens: ((recipe as any).allergens as string[]) ?? [],
      });
    }
  }, [recipe, isNew, form]);

  if (!activeVenueId) return <div className="p-8">Select venue first.</div>;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      sellingPrice: values.sellingPrice || undefined,
      allergens: values.allergens ?? [],
    };

    if (isNew) {
      createMutation.mutate({ venueId: activeVenueId, data: payload as any }, {
        onSuccess: (newRecipe) => {
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "recipes"] });
          toast({ title: "Recipe created — now add your ingredients." });
          setLocation(`/recipes/${newRecipe.id}?setup=1`);
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    } else {
      updateMutation.mutate({ venueId: activeVenueId, recipeId: recipeId!, data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "recipes"] });
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "recipes", recipeId] });
          toast({ title: "Recipe updated" });
          setLocation(`/recipes/${recipeId}`);
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={isNew ? "/recipes" : `/recipes/${recipeId}`}><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isNew ? "Create Recipe Specs" : "Edit Recipe Settings"}</h1>
          <p className="text-sm text-muted-foreground">{isNew ? "Set up the basics, then add ingredients." : recipe?.name}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Core Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="recipeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Recipe Type</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange("menu")}
                        className={`text-left rounded-lg border p-3 transition-colors ${field.value === "menu" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <div className="font-semibold text-foreground">Menu dish</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Plated, customer-facing, has a sell price.</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("prep")}
                        className={`text-left rounded-lg border p-3 transition-colors ${field.value === "prep" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <div className="font-semibold text-foreground">Prep / mise</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Sauce, batch, component used by other recipes.</div>
                      </button>
                    </div>
                    <FormDescription>You can change this later.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Recipe Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pomodoro Sauce" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Prep, Mains, Sides" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="yield"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-1">
                      <FormLabel className="text-foreground">Total Yield</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yieldUnit"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-1">
                      <FormLabel className="text-foreground">Yield Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. L, kg, ptn" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portionSize"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-1">
                      <FormLabel className="text-foreground">Portion Size</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portionUnit"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-1">
                      <FormLabel className="text-foreground">Portion Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ml, g, ptn" className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> Selling Price
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" className="bg-background border-border" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>Leave blank for prep recipes</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Allergens (EU 14)
              </CardTitle>
              <CardDescription>Select all allergens present in this recipe.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="allergens"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {EU_ALLERGENS.map((allergen) => {
                        const checked = field.value?.includes(allergen.key) ?? false;
                        return (
                          <button
                            key={allergen.key}
                            type="button"
                            onClick={() => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? current.filter((a) => a !== allergen.key)
                                  : [...current, allergen.key]
                              );
                            }}
                            className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                              checked
                                ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700"
                                : "border-border hover:border-muted-foreground/40 text-muted-foreground"
                            }`}
                          >
                            {allergen.label}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Method & Prep</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Method</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={"1. Bring pan to medium heat\n2. Add butter and let it foam\n3. Add shallots, sweat until soft\n4. Deglaze with white wine..."}
                        className="bg-background border-border min-h-40 leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      One step per line. Number each step for best display (e.g. "1. Bring to heat").
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="platingNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Plating Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Garnish, vessel..." className="bg-background border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-12" disabled={isPending}>
            {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (isNew ? <ArrowLeft className="w-5 h-5 mr-2 rotate-180" /> : <Save className="w-5 h-5 mr-2" />)}
            {isNew ? "Continue to Ingredients" : "Save Settings"}
          </Button>
        </form>
      </Form>
    </div>
  );
}