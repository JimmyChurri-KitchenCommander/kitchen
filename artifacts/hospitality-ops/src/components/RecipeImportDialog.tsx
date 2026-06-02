import { useState, useRef, useCallback } from "react";
import { useVenueStore } from "@/stores/venueStore";
import {
  useImportRecipeFromSource,
  useCreateRecipe,
  useAddRecipeIngredient,
  useListInventory,
  useCreateInventoryItem,
  useCreatePrepTask,
  getListRecipesQueryKey,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import type { RecipeImportResult, RecipeImportIngredient, RecipeImportBatchResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Camera, Link2, Upload, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, ChevronDown, X, Package, Info, ClipboardList, Circle, CheckSquare, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = "pick" | "select" | "review" | "inventory" | "prep";

interface InventoryDraft {
  ingredientIdx: number;
  rawName: string;      // original AI name, for prep detection
  name: string;         // cleaned, title-cased name
  note?: string;        // alternatives hint ("Similar: Soft Lettuce…")
  unit: string;
  cost: string;
  stock: string;
}

interface SuggestedTask {
  title: string;
  detail?: string;      // full step text, shown on expand
  section: "hot_cook" | "make" | "cut" | "seafood" | "other";
  priority: "low" | "medium" | "high";
  selected: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PREP_DESCRIPTORS = [
  "thinly sliced", "finely sliced", "thickly sliced",
  "finely chopped", "roughly chopped", "coarsely chopped",
  "finely diced", "coarsely diced",
  "finely grated", "coarsely grated", "freshly grated",
  "thinly shaved",
  "julienned", "diced", "minced", "sliced", "chopped", "shredded",
  "torn", "halved", "quartered", "peeled", "deveined",
  "melted", "softened", "toasted", "roasted", "blanched", "thawed",
  "crushed", "ground", "grated", "squeezed", "zested",
  "thinly", "finely", "roughly", "coarsely", "freshly", "lightly",
];

/** Strip prep descriptors and parenthetical notes; return Title Cased name. */
function cleanIngredientName(raw: string): string {
  let name = raw;
  name = name.replace(/\s*\([^)]*\)/g, ""); // remove (optional), (to taste) etc.
  for (const d of PREP_DESCRIPTORS) {
    name = name.replace(new RegExp(`\\b${d.replace(/\s+/g, "\\s+")}\\b`, "gi"), " ");
  }
  name = name.replace(/\s+/g, " ").replace(/^[\s,]+|[\s,]+$/g, "").trim();
  if (!name) return raw;
  // Title case
  return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

const PREP_ACTION_MAP: [RegExp, string][] = [
  [/\bthinly\s+sliced\b/i, "Thinly slice"],
  [/\bsliced\b/i, "Slice"],
  [/\bfinely\s+chopped\b/i, "Finely chop"],
  [/\broughly\s+chopped\b/i, "Roughly chop"],
  [/\bchopped\b/i, "Chop"],
  [/\bfinely\s+diced\b/i, "Fine dice"],
  [/\bdiced\b/i, "Dice"],
  [/\bminced\b/i, "Mince"],
  [/\bjulienned\b/i, "Julienne"],
  [/\bfinely\s+grated\b/i, "Finely grate"],
  [/\bgrated\b/i, "Grate"],
  [/\bshredded\b/i, "Shred"],
  [/\bmelted\b/i, "Melt"],
  [/\btoasted\b/i, "Toast"],
  [/\broasted\b/i, "Roast"],
  [/\bpeeled\b/i, "Peel"],
  [/\bhalved\b/i, "Halve"],
  [/\bquartered\b/i, "Quarter"],
  [/\bcrushed\b/i, "Crush"],
  [/\bzested\b/i, "Zest"],
  [/\bsqueezed\b/i, "Juice"],
];

/** Return a prep task title if the raw ingredient has a preparation descriptor. */
function extractPrepAction(raw: string, cleanName: string): string | null {
  for (const [pattern, verb] of PREP_ACTION_MAP) {
    if (pattern.test(raw)) return `${verb} ${cleanName}`;
  }
  return null;
}

const SAUCE_PATTERN = /\b(dressing|vinaigrette|aioli|sauce|coulis|purée|puree|salsa|chutney|jus|mayo|mayonnaise|beurre|emulsion|relish)\b/i;

/**
 * Detect "X, Y or similar" / "X or Y" alternative patterns.
 * Returns the most specific named item as the primary name, with a note for alternatives.
 */
function extractAlternativesNote(raw: string): { name: string; note?: string } {
  // "Soft Lettuce, Butter Lettuce Or Similar" → primary="Butter Lettuce", note="Similar: Soft Lettuce"
  const orSimilarMatch = raw.match(/^(.+?)\s+or\s+similar\s*$/i);
  if (orSimilarMatch) {
    const parts = orSimilarMatch[1].split(/,\s*/i).map(p => p.trim()).filter(Boolean);
    const primary = parts[parts.length - 1]; // most specific (last listed)
    const others = parts.slice(0, -1);
    return {
      name: primary,
      note: others.length > 0 ? `Similar: ${others.join(", ")}` : "Or similar variety",
    };
  }
  // "X (or Y)" → primary="X", note="Alternative: Y"
  const parenOrMatch = raw.match(/^(.+?)\s*\(or\s+(.+?)\)\s*$/i);
  if (parenOrMatch) {
    return { name: parenOrMatch[1].trim(), note: `Alternative: ${parenOrMatch[2].trim()}` };
  }
  // "X or Y" (plain, not a sauce pattern) → primary="X", note="Alternative: Y"
  const orMatch = raw.match(/^(.+?)\s+or\s+([^,]+)$/i);
  if (orMatch && !SAUCE_PATTERN.test(raw) && !/\bsimilar\b/i.test(orMatch[2])) {
    return { name: orMatch[1].trim(), note: `Alternative: ${orMatch[2].trim()}` };
  }
  return { name: raw };
}

/**
 * Auto-number method text if it's a wall of sentences without numbered steps.
 * Splits on period-space-Capital boundaries.
 */
function formatMethodText(text: string): string {
  if (!text?.trim()) return text;
  if (/^\s*\d+[.)]/m.test(text)) return text; // already numbered
  const parts = text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
  if (parts.length < 2) return text;
  return parts.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

/**
 * From a full step sentence, extract a short, readable task title
 * and keep the full sentence as optional detail.
 */
function extractTaskTitle(step: string): { title: string; detail?: string } {
  // "Roast almonds: Preheat oven…" → title="Roast almonds", detail=full
  const colonIdx = step.indexOf(":");
  if (colonIdx > 4 && colonIdx < 45) {
    const rawTitle = step.slice(0, colonIdx).replace(/\b(the|a|an)\s+/gi, " ").replace(/\s+/g, " ").trim();
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    return { title, detail: step };
  }
  // Otherwise take first 5 words, dropping articles
  const words = step.split(/\s+/);
  const kept = words.filter((w, i) => i === 0 || !/^(the|a|an)$/i.test(w));
  const title = kept.slice(0, 5).join(" ");
  const detail = words.length > 6 ? step : undefined;
  return { title: title.charAt(0).toUpperCase() + title.slice(1), detail };
}

// Steps starting with these words are continuations of the previous action, not new tasks
const CONTINUATION_STARTS = /^(place|put|add|let\s+(it|them|cool|rest|sit)|cool|remove|transfer|set\s+aside|drain|rest|bake\s+(for|at|until)|cook\s+(for|until|another)|simmer\s+for|fry\s+for|roast\s+for|stir\s+in|pour|fold\s+in|whisk\s+in|toss|coat|spread|adjust|check|season\s+with|top\s+with|garnish|drizzle)/i;

// Steps starting with these verbs are the start of a new cooking action
const PRIMARY_STARTS = /^(make|prepare|roast|toast|slice|dice|chop|mince|grate|cook|sauté|saute|fry|grill|steam|blanch|dress|assemble|marinate|caramelize|smoke|poach|render|char|combine|mix|whisk|sear|reduce|press|blanch|cure|brine|dehydrate|confit)/i;

function generateSuggestions(
  name: string,
  method?: string | null,
  rawIngredients?: string[],
): SuggestedTask[] {
  const tasks: SuggestedTask[] = [];
  const seen = new Set<string>();

  const add = (task: SuggestedTask) => {
    const key = task.title.toLowerCase();
    if (!seen.has(key)) { seen.add(key); tasks.push(task); }
  };

  // 1. Mise en place — always first
  add({ title: `${name} — mise en place`, section: "make", priority: "medium", selected: true });

  // 2. Ingredient prep actions (slice avocado, dice onion…)
  if (rawIngredients) {
    for (const raw of rawIngredients) {
      const clean = cleanIngredientName(raw);
      const action = extractPrepAction(raw, clean);
      if (action) add({ title: action, section: "cut", priority: "medium", selected: true });
    }

    // 3. Sauce / dressing → "Make Caesar Dressing"
    for (const raw of rawIngredients) {
      if (SAUCE_PATTERN.test(raw)) {
        const clean = cleanIngredientName(raw);
        add({ title: `Make ${clean}`, section: "make", priority: "high", selected: true });
      }
    }
  }

  // 4. Method steps — group continuation steps under their parent action
  if (method) {
    const lines = method.split("\n").map(l => l.trim()).filter(Boolean);
    const steps = lines
      .map(l => l.replace(/^(\d+[.):\s]+)/i, "").trim())
      .filter(s => s.length > 5);

    // Group steps: each PRIMARY verb starts a new group; CONTINUATION steps fold into the last group
    interface StepGroup { primaryStep: string; subSteps: string[] }
    const groups: StepGroup[] = [];
    let current: StepGroup | null = null;

    for (const step of steps) {
      const isContinuation = CONTINUATION_STARTS.test(step.trim());
      const isPrimary = PRIMARY_STARTS.test(step.trim()) && !isContinuation;
      if (isPrimary || current === null) {
        if (current) groups.push(current);
        current = { primaryStep: step, subSteps: [] };
      } else {
        current.subSteps.push(step);
      }
    }
    if (current) groups.push(current);

    // Create one task per group (max 3 method-derived tasks)
    let methodAdded = 0;
    for (const group of groups) {
      if (methodAdded >= 3) break;
      const { title } = extractTaskTitle(group.primaryStep);
      if (title.length < 3) continue;

      // Detail = primary step + sub-steps as a numbered procedure
      const allSteps = [group.primaryStep, ...group.subSteps];
      const detail = allSteps.length > 1
        ? allSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")
        : (group.primaryStep.length > 55 ? group.primaryStep : undefined);

      add({ title, detail, section: "make", priority: "low", selected: false });
      methodAdded++;
    }
  }

  // 5. Service ready — always last
  add({ title: `${name} — service ready`, section: "other", priority: "high", selected: true });

  return tasks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RecipeImportDialog({ open, onOpenChange }: Props) {
  const { activeVenueId } = useVenueStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"photo" | "url">("photo");
  const [step, setStep] = useState<Step>("pick");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [result, setResult] = useState<RecipeImportResult | null>(null);
  const [multipleResults, setMultipleResults] = useState<RecipeImportResult[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editedIngredients, setEditedIngredients] = useState<RecipeImportIngredient[]>([]);
  const [inventoryDrafts, setInventoryDrafts] = useState<InventoryDraft[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [creatingInventory, setCreatingInventory] = useState(false);
  const [saving, setSaving] = useState(false);

  const importMutation = useImportRecipeFromSource();
  const createRecipe = useCreateRecipe();
  const addIngredient = useAddRecipeIngredient();
  const createInventoryItem = useCreateInventoryItem();
  const createPrepTask = useCreatePrepTask();

  const { data: inventory = [] } = useListInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListInventoryQueryKey(activeVenueId as number) } }
  );

  const reset = () => {
    setStep("pick");
    setImageFile(null);
    setImagePreview(null);
    setUrlInput("");
    setResult(null);
    setMultipleResults(null);
    setSelectedIndices(new Set());
    setBulkSaving(false);
    setEditedIngredients([]);
    setInventoryDrafts([]);
    setSuggestedTasks([]);
    setExpandedTask(null);
    setDragging(false);
    setCreatingInventory(false);
    setSaving(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleExtract = async () => {
    if (!activeVenueId) return;
    const onSuccess = (data: RecipeImportBatchResult) => {
      const rawList = data.recipes ?? [];
      if (rawList.length === 0) {
        toast({ title: "No recipe found", description: "Could not extract a recipe from this source.", variant: "destructive" });
        return;
      }
      if (rawList.length === 1) {
        // Single recipe — go straight to review
        const formatted = { ...rawList[0]!, method: formatMethodText(rawList[0]!.method ?? "") };
        setResult(formatted);
        setEditedIngredients(formatted.ingredients ?? []);
        setStep("review");
      } else {
        // Multiple recipes — show selection step
        setMultipleResults(rawList as RecipeImportResult[]);
        setSelectedIndices(new Set(rawList.map((_, i) => i)));
        setStep("select");
      }
    };
    const onError = (err: unknown) =>
      toast({ title: "Extraction failed", description: (err as Error)?.message ?? "Please try again.", variant: "destructive" });

    if (tab === "photo") {
      if (!imageFile) return;
      const imageBase64 = await toBase64(imageFile);
      importMutation.mutate({ venueId: activeVenueId, data: { source: "image", imageBase64, mimeType: imageFile.type } }, { onSuccess, onError });
    } else {
      if (!urlInput.trim()) return;
      importMutation.mutate({ venueId: activeVenueId, data: { source: "url", url: urlInput.trim() } }, { onSuccess, onError });
    }
  };

  /** Start a full review flow on a single recipe chosen from the multi-select screen */
  const startSingleReview = (idx: number) => {
    if (!multipleResults) return;
    const r = multipleResults[idx]!;
    const formatted = { ...r, method: formatMethodText(r.method ?? "") };
    setResult(formatted);
    setEditedIngredients(formatted.ingredients ?? []);
    setStep("review");
  };

  /** Bulk-create all selected recipes without ingredient linking */
  const handleBulkImport = async () => {
    if (!activeVenueId || !multipleResults) return;
    setBulkSaving(true);
    try {
      let saved = 0;
      for (const idx of Array.from(selectedIndices).sort()) {
        const r = multipleResults[idx];
        if (!r) continue;
        await createRecipe.mutateAsync({
          venueId: activeVenueId,
          data: {
            name: r.name,
            category: r.category ?? undefined,
            method: r.method ?? undefined,
            platingNotes: r.platingNotes ?? undefined,
            yield: r.yield,
            yieldUnit: r.yieldUnit ?? undefined,
            portionSize: r.portionSize,
            portionUnit: r.portionUnit,
            sellingPrice: r.sellingPrice ?? undefined,
          } as never,
        });
        saved++;
      }
      queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(activeVenueId) });
      toast({ title: `${saved} recipe${saved !== 1 ? "s" : ""} imported`, description: "Open each one to link ingredients and set food costs." });
      onOpenChange(false);
      reset();
    } catch {
      toast({ title: "Import failed", description: "Some recipes could not be saved.", variant: "destructive" });
    } finally {
      setBulkSaving(false);
    }
  };

  // Called when user clicks Continue on the review step
  const handleProceedFromReview = () => {
    const unlinked = editedIngredients.filter(i => i.matchedInventoryItemId == null);
    if (unlinked.length > 0) {
      setInventoryDrafts(unlinked.map(ing => {
        // Detect "or similar" / "X or Y" patterns first, then clean the resolved name
        const { name: resolved, note } = extractAlternativesNote(ing.name);
        return {
          ingredientIdx: editedIngredients.indexOf(ing),
          rawName: ing.name,
          name: cleanIngredientName(resolved),
          note,
          unit: ing.unit,
          cost: "0",
          stock: "0",
        };
      }));
      setStep("inventory");
    } else {
      const rawNames = editedIngredients.map(i => i.name);
      setSuggestedTasks(generateSuggestions(result!.name, result!.method, rawNames));
      setStep("prep");
    }
  };

  // Called when user confirms adding items to inventory
  const handleInventoryConfirm = async () => {
    if (!activeVenueId) return;
    setCreatingInventory(true);
    try {
      const updatedIngredients = [...editedIngredients];
      for (const draft of inventoryDrafts) {
        const created = await createInventoryItem.mutateAsync({
          venueId: activeVenueId,
          data: {
            name: draft.name.trim() || draft.rawName.trim(),
            unit: draft.unit.trim() || "unit",
            averageCost: parseFloat(draft.cost) || 0,
            currentStock: parseFloat(draft.stock) || 0,
            parLevel: 0,
          },
        });
        updatedIngredients[draft.ingredientIdx] = {
          ...updatedIngredients[draft.ingredientIdx],
          matchedInventoryItemId: created.id,
        };
      }
      setEditedIngredients(updatedIngredients);
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
      // Pass raw names (including all ingredients) for prep action detection
      const rawNames = editedIngredients.map(i => i.name);
      setSuggestedTasks(generateSuggestions(result!.name, result!.method, rawNames));
      setExpandedTask(null);
      setStep("prep");
    } catch {
      toast({ title: "Failed to add ingredients to inventory", variant: "destructive" });
    } finally {
      setCreatingInventory(false);
    }
  };

  // Final save — create recipe, link ingredients, create prep tasks
  const handleFinalCreate = async () => {
    if (!result || !activeVenueId) return;
    setSaving(true);
    try {
      const newRecipe = await createRecipe.mutateAsync({
        venueId: activeVenueId,
        data: {
          name: result.name,
          category: result.category ?? undefined,
          method: result.method ?? undefined,
          platingNotes: result.platingNotes ?? undefined,
          yield: result.yield,
          yieldUnit: result.yieldUnit ?? undefined,
          portionSize: result.portionSize,
          portionUnit: result.portionUnit,
          sellingPrice: result.sellingPrice ?? undefined,
        } as never,
      });

      const matched = editedIngredients.filter(i => i.matchedInventoryItemId != null);
      for (const ing of matched) {
        await addIngredient.mutateAsync({
          venueId: activeVenueId,
          recipeId: newRecipe.id,
          data: { inventoryItemId: ing.matchedInventoryItemId!, quantity: ing.quantity, unit: ing.unit },
        }).catch(() => {});
      }

      const selectedTasks = suggestedTasks.filter(t => t.selected);
      for (const task of selectedTasks) {
        await createPrepTask.mutateAsync({
          venueId: activeVenueId,
          data: {
            title: task.title,
            section: task.section,
            priority: task.priority,
            recipeId: newRecipe.id,
            shift: "morning",
            category: "other",
          },
        }).catch(() => {});
      }

      queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(activeVenueId) });
      toast({
        title: "Recipe saved",
        description: `${matched.length} ingredient${matched.length !== 1 ? "s" : ""} linked${selectedTasks.length > 0 ? `, ${selectedTasks.length} prep task${selectedTasks.length !== 1 ? "s" : ""} added to board` : ""}.`,
      });
      onOpenChange(false);
      reset();
      setLocation(`/recipes/${newRecipe.id}`);

      // Prompt about sauce/dressing ingredients that could be sub-recipes
      const sauceIngredients = editedIngredients.filter(i => SAUCE_PATTERN.test(i.name));
      if (sauceIngredients.length > 0) {
        const sauceName = cleanIngredientName(sauceIngredients[0].name);
        setTimeout(() => {
          toast({
            title: `Add a recipe for ${sauceName}?`,
            description: "You used a sauce or dressing — check if it already has a recipe, or add one to track its food cost.",
          });
        }, 1800);
      }
    } catch {
      toast({ title: "Failed to create recipe", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof RecipeImportResult>(key: K, value: RecipeImportResult[K]) => {
    if (!result) return;
    setResult({ ...result, [key]: value });
  };

  const updateIngredient = (idx: number, field: keyof RecipeImportIngredient, value: string | number | null) => {
    setEditedIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const removeIngredient = (idx: number) => {
    setEditedIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const updateDraft = (idx: number, field: keyof InventoryDraft, value: string) => {
    setInventoryDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const removeDraft = (idx: number) => {
    setInventoryDrafts(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleTask = (idx: number) => {
    setSuggestedTasks(prev => prev.map((t, i) => i === idx ? { ...t, selected: !t.selected } : t));
  };

  const canExtract = tab === "photo" ? !!imageFile : !!urlInput.trim();
  const linkedCount = editedIngredients.filter(i => i.matchedInventoryItemId != null).length;

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-full sm:max-w-lg bg-card border-border max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary shrink-0" />
            {step === "pick" && "Import Recipe"}
            {step === "select" && `${multipleResults?.length ?? 0} Recipes Found`}
            {step === "review" && "Review Recipe"}
            {step === "inventory" && "Add to Inventory"}
            {step === "prep" && "Suggested Prep Tasks"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {step === "pick" && "Snap a photo of a recipe card or paste a URL — AI extracts everything."}
            {step === "select" && "Multiple recipes detected. Select which ones to import."}
            {step === "review" && "Check the details below before continuing."}
            {step === "inventory" && "These ingredients aren't in your inventory yet. Names have been cleaned — adjust if needed."}
            {step === "prep" && "Select the tasks to add to your prep board. Tap a task to see full detail."}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP: pick ── */}
        {step === "pick" && (
          <div className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "photo" | "url")}>
              <TabsList className="w-full bg-secondary">
                <TabsTrigger value="photo" className="flex-1 gap-2 data-[state=active]:bg-card">
                  <Camera className="w-4 h-4" /> Photo
                </TabsTrigger>
                <TabsTrigger value="url" className="flex-1 gap-2 data-[state=active]:bg-card">
                  <Link2 className="w-4 h-4" /> URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photo" className="mt-4">
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="Recipe" className="w-full max-h-56 object-contain bg-secondary" />
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-card/80 hover:bg-card"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Drop a photo or tap to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Recipe cards, printouts, whiteboards</p>
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="mt-4 space-y-2">
                <Label className="text-foreground">Recipe URL</Label>
                <Input placeholder="https://example.com/my-recipe" className="bg-background border-border"
                  value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canExtract && !importMutation.isPending && handleExtract()} />
                <p className="text-xs text-muted-foreground">Paste any publicly accessible recipe page.</p>
              </TabsContent>
            </Tabs>

            <Button className="w-full bg-primary text-primary-foreground font-bold h-11"
              disabled={!canExtract || importMutation.isPending} onClick={handleExtract}>
              {importMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Reading recipe...</>
                : <>Extract Recipe <ChevronRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        )}

        {/* ── STEP: select (multi-recipe) ── */}
        {step === "select" && multipleResults && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">
                {selectedIndices.size} of {multipleResults.length} selected
              </p>
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  if (selectedIndices.size === multipleResults.length) setSelectedIndices(new Set());
                  else setSelectedIndices(new Set(multipleResults.map((_, i) => i)));
                }}
              >
                {selectedIndices.size === multipleResults.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {multipleResults.map((recipe, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors touch-manipulation",
                      isSelected ? "border-primary/50 bg-primary/5" : "border-border hover:bg-secondary/40"
                    )}
                    onClick={() => {
                      setSelectedIndices(prev => {
                        const next = new Set(prev);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        return next;
                      });
                    }}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isSelected
                        ? <CheckSquare className="w-4 h-4 text-primary" />
                        : <Square className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight">{recipe.name}</p>
                      {recipe.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">{recipe.category}</p>
                      )}
                      {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    {selectedIndices.size === 1 && isSelected && (
                      <button
                        className="text-xs text-primary hover:underline flex-shrink-0 mt-0.5"
                        onClick={(e) => { e.stopPropagation(); startSingleReview(idx); }}
                      >
                        Full review
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground font-bold"
                disabled={selectedIndices.size === 0 || bulkSaving}
                onClick={handleBulkImport}
              >
                {bulkSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                  : `Import ${selectedIndices.size} Recipe${selectedIndices.size !== 1 ? "s" : ""}`
                }
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: review ── */}
        {step === "review" && result && (
          <div className="space-y-4">
            {/* Name + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recipe Name</Label>
                <Input className="mt-1 bg-background border-border" value={result.name}
                  onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Category</Label>
                <Input className="mt-1 bg-background border-border" value={result.category ?? ""}
                  onChange={(e) => updateField("category", e.target.value || null)} placeholder="e.g. Prep, Mains" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Selling Price</Label>
                <Input className="mt-1 bg-background border-border" type="number" step="0.01"
                  value={result.sellingPrice ?? ""} placeholder="Optional"
                  onChange={(e) => updateField("sellingPrice", e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
            </div>

            {/* Yield + Portion — 2×2 to avoid overflow */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Yield</Label>
                <Input className="mt-1 bg-background border-border" type="number" step="0.01" value={result.yield}
                  onChange={(e) => updateField("yield", parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Yield Unit</Label>
                <Input className="mt-1 bg-background border-border" value={result.yieldUnit ?? ""}
                  onChange={(e) => updateField("yieldUnit", e.target.value || null)} placeholder="ptn" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Portion Size</Label>
                <Input className="mt-1 bg-background border-border" type="number" step="0.01" value={result.portionSize}
                  onChange={(e) => updateField("portionSize", parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Portion Unit</Label>
                <Input className="mt-1 bg-background border-border" value={result.portionUnit}
                  onChange={(e) => updateField("portionUnit", e.target.value || "ptn")} />
              </div>
            </div>

            {/* Method */}
            {result.method && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Method</Label>
                <Textarea
                  className="mt-1 bg-background border-border min-h-28 text-sm leading-relaxed font-mono"
                  value={result.method}
                  onChange={(e) => updateField("method", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Each numbered line becomes a prep step. Edit or re-order as needed.</p>
              </div>
            )}

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Ingredients ({editedIngredients.length})
                </Label>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-healthy" />
                  <span>{linkedCount} matched</span>
                </div>
              </div>

              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {editedIngredients.map((ing, idx) => {
                  const matched = ing.matchedInventoryItemId != null;
                  const matchedItem = matched ? inventory.find(i => i.id === ing.matchedInventoryItemId) : null;
                  return (
                    <div key={idx} className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
                      matched ? "border-status-healthy/30 bg-status-healthy/5" : "border-border bg-secondary/30"
                    )}>
                      {matched
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-status-healthy shrink-0" />
                        : <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-xs">{ing.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {matched && matchedItem ? matchedItem.name : "will add to inventory"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Input className="w-12 h-6 text-xs px-1.5 bg-background border-border" type="number" step="0.01"
                          value={ing.quantity} onChange={(e) => updateIngredient(idx, "quantity", parseFloat(e.target.value) || 0)} />
                        <Input className="w-12 h-6 text-xs px-1.5 bg-background border-border"
                          value={ing.unit} onChange={(e) => updateIngredient(idx, "unit", e.target.value)} />
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeIngredient(idx)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {editedIngredients.filter(i => !i.matchedInventoryItemId).length > 0 && (
                <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{editedIngredients.filter(i => !i.matchedInventoryItemId).length} ingredients will be added to inventory on the next step. Prep descriptors (sliced, diced…) will be stripped from their names.</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="border-border" onClick={() => setStep("pick")}>Back</Button>
              <Button className="flex-1 bg-primary text-primary-foreground font-bold h-11"
                onClick={handleProceedFromReview} disabled={!result.name}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: inventory ── */}
        {step === "inventory" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
              <Package className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Prep descriptors have been removed from names. Items with 0 stock will show as needing to be ordered.</span>
            </div>

            <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
              {inventoryDrafts.map((draft, idx) => (
                <div key={idx} className="border border-border rounded-xl p-3 bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        className="text-sm font-semibold text-foreground bg-background border-border h-9"
                        value={draft.name}
                        onChange={(e) => updateDraft(idx, "name", e.target.value)}
                      />
                      {draft.note && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-start gap-1 leading-relaxed">
                          <Info className="w-3 h-3 shrink-0 mt-0.5" />
                          {draft.note}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive mt-1"
                      onClick={() => removeDraft(idx)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Unit</Label>
                      <Input className="mt-0.5 h-8 text-sm bg-background border-border"
                        value={draft.unit} onChange={(e) => updateDraft(idx, "unit", e.target.value)} placeholder="kg, L…" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cost / unit</Label>
                      <Input className="mt-0.5 h-8 text-sm bg-background border-border"
                        type="number" step="0.01" value={draft.cost}
                        onChange={(e) => updateDraft(idx, "cost", e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Opening stock</Label>
                      <Input className="mt-0.5 h-8 text-sm bg-background border-border"
                        type="number" step="0.1" value={draft.stock}
                        onChange={(e) => updateDraft(idx, "stock", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>
              ))}

              {inventoryDrafts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">All items removed — continue to proceed.</p>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="border-border" onClick={() => setStep("review")} disabled={creatingInventory}>
                Back
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground font-bold h-11"
                onClick={handleInventoryConfirm} disabled={creatingInventory}>
                {creatingInventory
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Adding to inventory…</>
                  : <>Add {inventoryDrafts.length > 0 ? `${inventoryDrafts.length} item${inventoryDrafts.length !== 1 ? "s" : ""}` : "items"} &amp; Continue <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: prep ── */}
        {step === "prep" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
              <ClipboardList className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              <span>Toggle tasks on or off. Tap a task to read the full detail before deciding.</span>
            </div>

            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {suggestedTasks.map((task, idx) => {
                const isExpanded = expandedTask === idx;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border-2 transition-all overflow-hidden",
                      task.selected ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60"
                    )}
                  >
                    {/* Main row */}
                    <div className="flex items-start gap-3 px-4 py-3">
                      {/* Toggle */}
                      <button onClick={() => toggleTask(idx)} className="mt-0.5 shrink-0">
                        {task.selected
                          ? <CheckCircle2 className="w-5 h-5 text-primary" />
                          : <Circle className="w-5 h-5 text-muted-foreground" />}
                      </button>

                      {/* Title + badges */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold leading-snug", task.selected ? "text-foreground" : "text-muted-foreground")}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-1.5 py-0 h-4 border-0 font-semibold",
                            task.priority === "high" ? "bg-red-100 text-red-700" :
                            task.priority === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-secondary text-muted-foreground"
                          )}>
                            {task.priority}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground capitalize">{task.section.replace("_", " ")}</span>
                        </div>
                      </div>

                      {/* Expand toggle (only if there's detail) */}
                      {task.detail && (
                        <button
                          onClick={() => setExpandedTask(isExpanded ? null : idx)}
                          className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                        </button>
                      )}
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && task.detail && (
                      <div className="px-4 pb-3 pt-0">
                        <div className="border-t border-border/60 pt-2 space-y-1">
                          {task.detail.split("\n").filter(Boolean).map((line, i) => (
                            <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="border-border"
                onClick={() => setStep(inventoryDrafts.length > 0 ? "inventory" : "review")} disabled={saving}>
                Back
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground font-bold h-11"
                onClick={handleFinalCreate} disabled={saving || !result?.name}>
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving recipe…</>
                  : <>Save Recipe <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
