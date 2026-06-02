import { useState, useRef } from "react";
import { useVenueStore } from "@/stores/venueStore";
import { useListRecipes, getListRecipesQueryKey, getListMenusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon, CheckCircle2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "upload" | "extracting" | "review" | "creating" | "done";

interface ExtractedItem {
  name: string;
  section: string;
  price: number | null;
  description: string | null;
  matchedRecipeId: number | null;
  matchedRecipeName: string | null;
}

interface ImportResult {
  menuName: string;
  items: ExtractedItem[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTION_LABELS: Record<string, string> = {
  starter: "Starter", main: "Main", dessert: "Dessert",
  side: "Side", special: "Special", other: "Other",
};

export default function MenuImportDialog({ open, onOpenChange }: Props) {
  const { activeVenueId } = useVenueStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [menuName, setMenuName] = useState("");
  const [recipeLinks, setRecipeLinks] = useState<Record<number, number | null>>({});

  const { data: recipes = [] } = useListRecipes(activeVenueId as number, undefined, {
    query: { enabled: !!activeVenueId, queryKey: getListRecipesQueryKey(activeVenueId as number) },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!imageFile || !activeVenueId) return;
    setStep("extracting");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]!);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const resp = await fetch(`/api/venues/${activeVenueId}/menus/import-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: imageFile.type }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to extract menu");
      }

      const data = await resp.json() as ImportResult;
      setResult(data);
      setMenuName(data.menuName ?? "Imported Menu");
      const links: Record<number, number | null> = {};
      data.items.forEach((item, idx) => {
        links[idx] = item.matchedRecipeId;
      });
      setRecipeLinks(links);
      setStep("review");
    } catch (err) {
      toast({
        title: "Could not read menu",
        description: err instanceof Error ? err.message : "AI extraction failed — try a clearer photo",
        variant: "destructive",
      });
      setStep("upload");
    }
  };

  const handleCreate = async () => {
    if (!result || !activeVenueId || !menuName.trim()) return;
    setIsSubmitting(true);
    try {
      const menuResp = await fetch(`/api/venues/${activeVenueId}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: menuName, isActive: true }),
      });
      if (!menuResp.ok) throw new Error("Failed to create menu");
      const newMenu = await menuResp.json() as { id: number };

      const linkedItems = result.items
        .map((item, idx) => ({ item, recipeId: recipeLinks[idx] ?? null }))
        .filter(x => x.recipeId !== null);

      for (const { item, recipeId } of linkedItems) {
        await fetch(`/api/venues/${activeVenueId}/menus/${newMenu.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeId,
            sellingPrice: item.price ?? undefined,
            category: item.section !== "other" ? item.section : undefined,
          }),
        });
      }

      qc.invalidateQueries({ queryKey: getListMenusQueryKey(activeVenueId) });
      toast({ title: "Menu imported", description: `${menuName} created with ${linkedItems.length} linked dishes.` });
      setIsSubmitting(false);
      handleClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not create menu",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setIsSubmitting(false);
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setMenuName("");
    setRecipeLinks({});
    onOpenChange(false);
  };

  const linkedCount = result
    ? Object.values(recipeLinks).filter(v => v !== null).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Import Menu from Photo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a photo of your physical menu. AI will extract dishes and match them to your recipe library.
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP: UPLOAD ── */}
        {(step === "upload" || step === "extracting") && (
          <div className="space-y-5 py-2">
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
                imageFile ? "border-primary/40 bg-primary/5 py-4" : "border-border hover:border-primary/40 py-12"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Menu preview" className="max-h-64 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Click to upload a photo of your menu<br />
                    <span className="text-xs">JPG, PNG, HEIC supported</span>
                  </p>
                </>
              )}
            </div>

            {imageFile && (
              <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg text-sm">
                <span className="font-medium text-foreground truncate">{imageFile.name}</span>
                <Button variant="ghost" size="sm" className="text-xs shrink-0 ml-2"
                  onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}>
                  Change
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleExtract}
                disabled={!imageFile || step === "extracting"}
                className="bg-primary text-primary-foreground"
              >
                {step === "extracting"
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reading menu...</>
                  : <>Extract dishes</>}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── STEP: REVIEW ── */}
        {step === "review" && result && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Found <strong>{result.items.length} dishes</strong>. Review the matches below and adjust if needed.</span>
            </div>

            <div className="grid gap-2">
              <Label className="text-foreground font-semibold">Menu Name</Label>
              <Input
                value={menuName}
                onChange={e => setMenuName(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Extracted Dishes</Label>
                <span className="text-xs text-muted-foreground">
                  {linkedCount}/{result.items.length} linked to recipes
                </span>
              </div>

              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-4 py-2 bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Dish on menu</span>
                  <span></span>
                  <span>Link to recipe</span>
                </div>
                {result.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {SECTION_LABELS[item.section] ?? item.section}
                        </Badge>
                      </div>
                      {item.price !== null && (
                        <p className="text-xs text-muted-foreground mt-0.5">${item.price.toFixed(2)}</p>
                      )}
                    </div>
                    <LinkIcon className={cn("w-3.5 h-3.5 shrink-0", recipeLinks[idx] ? "text-primary" : "text-muted-foreground/40")} />
                    <Select
                      value={recipeLinks[idx] != null ? String(recipeLinks[idx]) : "none"}
                      onValueChange={(v) => setRecipeLinks(prev => ({ ...prev, [idx]: v === "none" ? null : parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-background border-border text-sm h-9">
                        <SelectValue placeholder="No recipe linked" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground italic">No recipe linked</span>
                        </SelectItem>
                        {recipes.map(r => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}{r.category ? ` — ${r.category}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {linkedCount === 0 && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  No dishes linked to recipes yet. Link at least one to include it in the menu with live costing.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button
                onClick={handleCreate}
                disabled={linkedCount === 0 || !menuName.trim() || isSubmitting}
                className="bg-primary text-primary-foreground"
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>
                  : <>Create menu ({linkedCount} dish{linkedCount !== 1 ? "es" : ""})</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
