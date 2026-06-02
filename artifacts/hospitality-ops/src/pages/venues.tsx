import { useListVenues, useCreateVenue, useDeleteVenue, useListRecipes, getListRecipesQueryKey } from "@workspace/api-client-react";
import type { SuggestedPrepTask } from "@workspace/api-client-react";
import { useVenueStore } from "@/stores/venueStore";
import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Building, Plus, Trash2, Loader2, Check, FlaskConical, X, ArrowRight, Package, Brush, ClipboardList, FileText, Users, ChefHat, Upload, ScanLine, LogIn, Link2, Monitor, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fileToImageBase64 } from "@/lib/pdf-to-image";


type OnboardingStep = "import-suppliers" | "upload-prep-list" | "upload-menu" | "checklist";

interface ExtractedMenuItem {
  name: string;
  section: string;
  price: number | null;
  description: string | null;
  matchedRecipeId: number | null;
  matchedRecipeName: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  meat: "bg-red-100 text-red-700",
  fish: "bg-blue-100 text-blue-700",
  veg: "bg-green-100 text-green-700",
  sauce: "bg-amber-100 text-amber-700",
  pastry: "bg-purple-100 text-purple-700",
  bakery: "bg-orange-100 text-orange-700",
  garnish: "bg-lime-100 text-lime-700",
  other: "bg-slate-100 text-slate-600",
};

export default function VenuesPage() {
  const { activeVenueId, setActiveVenueId } = useVenueStore();
  const { data: venues, isLoading } = useListVenues();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const UNLIMITED_VENUE_EMAILS = ["james.garrett2304@gmail.com"];
  const userEmails = user?.emailAddresses.map(e => e.emailAddress.toLowerCase()) ?? [];
  const hasUnlimitedVenues = UNLIMITED_VENUE_EMAILS.some(e => userEmails.includes(e));
  const atVenueLimit = !hasUnlimitedVenues && (venues?.length ?? 0) >= 1;

  const createVenue = useCreateVenue();
  const deleteVenue = useDeleteVenue();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [removingDemoId, setRemovingDemoId] = useState<number | null>(null);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [copiedServiceUrlId, setCopiedServiceUrlId] = useState<number | null>(null);

  // Join venue state
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Onboarding wizard state
  const [onboardingVenueId, setOnboardingVenueId] = useState<number | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("import-suppliers");
  const [importFromVenueId, setImportFromVenueId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // Recipes for the onboarding venue (for linking suggestions)
  const { data: onboardingRecipes = [] } = useListRecipes(onboardingVenueId as number, undefined, {
    query: { enabled: !!onboardingVenueId, queryKey: getListRecipesQueryKey(onboardingVenueId as number) },
  });

  // ── Prep list upload state ──────────────────────────────────────────────────
  const uploadPrepRef = useRef<HTMLInputElement>(null);
  const [prepScanState, setPrepScanState] = useState<"idle" | "scanning" | "review">("idle");
  const [prepPreviewUrl, setPrepPreviewUrl] = useState<string | null>(null);
  const [prepTasks, setPrepTasks] = useState<SuggestedPrepTask[]>([]);
  const [prepSelected, setPrepSelected] = useState<Set<number>>(new Set());
  const [prepRecipeLinks, setPrepRecipeLinks] = useState<Record<number, number | null>>({});
  const [isSavingPrep, setIsSavingPrep] = useState(false);

  // ── Menu upload state ───────────────────────────────────────────────────────
  const uploadMenuRef = useRef<HTMLInputElement>(null);
  const [menuScanState, setMenuScanState] = useState<"idle" | "scanning" | "review">("idle");
  const [menuPreviewUrl, setMenuPreviewUrl] = useState<string | null>(null);
  const [menuName, setMenuName] = useState("");
  const [menuItems, setMenuItems] = useState<ExtractedMenuItem[]>([]);
  const [menuRecipeLinks, setMenuRecipeLinks] = useState<Record<number, number | null>>({});
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  const isDemo = (name: string) => name === "The Black Apron";
  const otherVenues = venues?.filter(v => !isDemo(v.name) && v.id !== onboardingVenueId) ?? [];

  const resetOnboarding = () => {
    setOnboardingVenueId(null);
    setOnboardingStep("import-suppliers");
    setImportFromVenueId("");
    setPrepScanState("idle");
    setPrepPreviewUrl(null);
    setPrepTasks([]);
    setPrepSelected(new Set());
    setPrepRecipeLinks({});
    setMenuScanState("idle");
    setMenuPreviewUrl(null);
    setMenuName("");
    setMenuItems([]);
    setMenuRecipeLinks({});
  };

  // ── Prep list handlers ──────────────────────────────────────────────────────
  const handlePrepFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onboardingVenueId) return;
    e.target.value = "";
    setPrepScanState("scanning");
    try {
      const { base64, dataUrl, mimeType } = await fileToImageBase64(file);
      setPrepPreviewUrl(dataUrl);
      const res = await fetch(`/api/venues/${onboardingVenueId}/prep-tasks/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json() as { tasks: SuggestedPrepTask[] };
      const tasks = data.tasks ?? [];
      setPrepTasks(tasks);
      const links: Record<number, number | null> = {};
      tasks.forEach((t, i) => { links[i] = t.matchedRecipeId ?? null; });
      setPrepRecipeLinks(links);
      setPrepSelected(new Set(tasks.map((_, i) => i)));
      setPrepScanState("review");
    } catch {
      toast({ title: "Could not read prep list", description: "Try a clearer image or a different file.", variant: "destructive" });
      setPrepScanState("idle");
    }
  }, [onboardingVenueId, toast]);

  const handleSavePrepTasks = useCallback(async () => {
    if (!onboardingVenueId) return;
    setIsSavingPrep(true);
    const toImport = prepTasks.filter((_, i) => prepSelected.has(i));
    for (const [idx, task] of toImport.entries()) {
      const origIdx = prepTasks.indexOf(task);
      await fetch(`/api/venues/${onboardingVenueId}/prep-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description ?? undefined,
          category: task.category,
          section: task.section,
          shift: task.shift,
          priority: task.priority,
          recipeId: prepRecipeLinks[origIdx] ?? undefined,
          prepDate: new Date().toISOString().split("T")[0],
        }),
      });
      void idx;
    }
    toast({ title: `${toImport.length} prep task${toImport.length !== 1 ? "s" : ""} added` });
    setIsSavingPrep(false);
    setOnboardingStep("upload-menu");
  }, [onboardingVenueId, prepTasks, prepSelected, prepRecipeLinks, toast]);

  // ── Menu handlers ───────────────────────────────────────────────────────────
  const handleMenuFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onboardingVenueId) return;
    e.target.value = "";
    setMenuScanState("scanning");
    try {
      const { base64, dataUrl, mimeType } = await fileToImageBase64(file);
      setMenuPreviewUrl(dataUrl);
      const formData = new FormData();
      formData.append("image", new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: mimeType }), "menu.jpg");
      const res = await fetch(`/api/venues/${onboardingVenueId}/menus/import-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json() as { menuName: string; items: ExtractedMenuItem[] };
      setMenuItems(data.items ?? []);
      setMenuName(data.menuName ?? "");
      const links: Record<number, number | null> = {};
      (data.items ?? []).forEach((item, i) => { links[i] = item.matchedRecipeId ?? null; });
      setMenuRecipeLinks(links);
      setMenuScanState("review");
    } catch {
      toast({ title: "Could not read menu", description: "Try a clearer image or a different file.", variant: "destructive" });
      setMenuScanState("idle");
    }
  }, [onboardingVenueId, toast]);

  const handleSaveMenu = useCallback(async () => {
    if (!onboardingVenueId || !menuName.trim()) return;
    setIsSavingMenu(true);
    try {
      const menuRes = await fetch(`/api/venues/${onboardingVenueId}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: menuName, isActive: true }),
      });
      if (!menuRes.ok) throw new Error("Failed to create menu");
      const newMenu = await menuRes.json() as { id: number };
      const linked = menuItems.filter((_, i) => menuRecipeLinks[i] !== null && menuRecipeLinks[i] !== undefined);
      for (const [i, item] of menuItems.entries()) {
        const recipeId = menuRecipeLinks[i];
        if (!recipeId) continue;
        await fetch(`/api/venues/${onboardingVenueId}/menus/${newMenu.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeId,
            sellingPrice: item.price ?? undefined,
            category: item.section !== "other" ? item.section : undefined,
          }),
        });
      }
      toast({ title: "Menu created", description: `${menuName} saved with ${linked.length} linked dish${linked.length !== 1 ? "es" : ""}.` });
      setOnboardingStep("checklist");
    } catch {
      toast({ title: "Could not save menu", variant: "destructive" });
    } finally {
      setIsSavingMenu(false);
    }
  }, [onboardingVenueId, menuName, menuItems, menuRecipeLinks, toast]);

  const handleLoadDemo = async () => {
    setIsSeedingDemo(true);
    try {
      const res = await fetch("/api/seed-demo", { method: "POST" });
      const data = await res.json() as { venueId: number; error?: string };
      if (res.status === 409) {
        setActiveVenueId(data.venueId);
        queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
        toast({ title: "Demo kitchen loaded", description: "The Black Apron is ready to explore." });
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to load demo");
      setActiveVenueId(data.venueId);
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Demo kitchen loaded", description: "The Black Apron is ready to explore." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load demo";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const handleCopyServiceUrl = async (venueId: number) => {
    const url = `${window.location.origin}/display/${venueId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedServiceUrlId(venueId);
      setTimeout(() => setCopiedServiceUrlId(null), 2000);
    } catch {
      toast({ title: "Could not copy URL", variant: "destructive" });
    }
  };

  const handleCopyDemoLink = async () => {
    setIsCopyingLink(true);
    try {
      const res = await fetch("/api/demo-link");
      if (!res.ok) throw new Error("Demo link unavailable");
      const data = await res.json() as { url: string };
      await navigator.clipboard.writeText(data.url);
      toast({ title: "Demo link copied", description: "Share this with anyone who needs access." });
    } catch {
      toast({ title: "Could not copy link", description: "Make sure DEMO_ACCESS_TOKEN is set.", variant: "destructive" });
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleRemoveDemo = async (venueId: number) => {
    setRemovingDemoId(venueId);
    try {
      const res = await fetch(`/api/demo-venue/${venueId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove demo");
      if (activeVenueId === venueId) setActiveVenueId(null as unknown as number);
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Demo kitchen removed" });
    } catch {
      toast({ title: "Error", description: "Could not remove demo kitchen.", variant: "destructive" });
    } finally {
      setRemovingDemoId(null);
    }
  };

  const handleJoin = async () => {
    const raw = joinCode.trim();
    if (!raw) return;
    // Accept either a full URL (e.g. https://…/join/TOKEN) or just the token
    let token = raw;
    const match = raw.match(/\/join\/([a-f0-9]+)$/i);
    if (match) token = match[1];
    setIsJoining(true);
    try {
      const res = await fetch("/api/venues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json() as { venueId?: number; venueName?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to join venue");
      if (data.venueId) {
        setActiveVenueId(data.venueId);
        queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      }
      setIsJoinOpen(false);
      setJoinCode("");
      toast({ title: "Joined venue", description: `You now have access to ${data.venueName ?? "the venue"}.` });
    } catch (err: unknown) {
      toast({ title: "Could not join", description: err instanceof Error ? err.message : "Invalid or expired invite.", variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = () => {
    if (!newVenueName.trim()) return;
    createVenue.mutate({ data: { name: newVenueName } }, {
      onSuccess: (newVenue) => {
        setIsCreateOpen(false);
        setNewVenueName("");
        setActiveVenueId(newVenue.id);
        queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
        setOnboardingVenueId(newVenue.id);
        setOnboardingStep("import-suppliers");
        setImportFromVenueId("");
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to create venue";
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure? This will delete all data for this venue.")) return;
    deleteVenue.mutate({ venueId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
        if (activeVenueId === id) setActiveVenueId(null as unknown as number);
        toast({ title: "Venue deleted" });
      }
    });
  };

  const handleImportSuppliers = async () => {
    if (!importFromVenueId || !onboardingVenueId) return;
    setIsImporting(true);
    try {
      const res = await fetch(`/api/venues/${onboardingVenueId}/import-suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromVenueId: parseInt(importFromVenueId) }),
      });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json() as { copied: number; suppliers: string[] };
      toast({ title: `${data.copied} supplier${data.copied === 1 ? "" : "s"} imported`, description: data.suppliers.join(", ") });
      setOnboardingStep("upload-prep-list");
    } catch {
      toast({ title: "Import failed", description: "Could not copy suppliers.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const setupSteps = [
    { icon: Package, label: "Inventory", description: "Add your stock items, par levels and shelf life", href: "/inventory/new" },
    { icon: Users, label: "Suppliers", description: "Add supplier contacts, delivery days and cutoff times", href: "/suppliers" },
    { icon: ChefHat, label: "Recipes", description: "Build your recipe library with food cost and GP%", href: "/recipes/new" },
    { icon: ClipboardList, label: "Prep Board", description: "Set up today's prep tasks and assign to the team", href: "/prep-board" },
    { icon: Brush, label: "Cleaning Roster", description: "Build your daily and weekly cleaning schedule", href: "/cleaning" },
    { icon: FileText, label: "Invoices", description: "Start logging invoices to track costs over time", href: "/invoices" },
  ];

  // ── Wizard step content ─────────────────────────────────────────────────────
  const renderOnboardingContent = () => {
    if (onboardingStep === "import-suppliers") {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Set up your kitchen</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Let's get your new venue ready for service.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {otherVenues.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Import supplier contacts from another venue?</p>
                <p className="text-xs text-muted-foreground">This copies all supplier details — contacts, delivery days, cutoff times — into your new venue so you don't have to re-enter them.</p>
                <Select value={importFromVenueId} onValueChange={setImportFromVenueId}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Choose a venue to copy from..." />
                  </SelectTrigger>
                  <SelectContent>
                    {otherVenues.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">No other venues found to import from. You can add supplier contacts manually from the Suppliers page.</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOnboardingStep("upload-prep-list")}>
              Skip
            </Button>
            {otherVenues.length > 0 && (
              <Button onClick={handleImportSuppliers} disabled={!importFromVenueId || isImporting} className="bg-primary text-primary-foreground">
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Import suppliers
              </Button>
            )}
          </DialogFooter>
        </>
      );
    }

    if (onboardingStep === "upload-prep-list") {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Upload your prep list</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Got a handwritten or printed prep list? Upload a photo or PDF and we'll pull out the tasks automatically.
            </DialogDescription>
          </DialogHeader>

          {prepScanState === "idle" && (
            <div className="py-4 space-y-4">
              <button
                className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-primary/5 transition-colors p-8 flex flex-col items-center gap-3 cursor-pointer"
                onClick={() => uploadPrepRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload a prep list</p>
                  <p className="text-xs text-muted-foreground mt-1">Photo, scan, or PDF — we'll read it</p>
                </div>
              </button>
              <input ref={uploadPrepRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handlePrepFileChange} />
            </div>
          )}

          {prepScanState === "scanning" && (
            <div className="py-10 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reading your prep list...</p>
              {prepPreviewUrl && <img src={prepPreviewUrl} alt="Prep list" className="w-full max-h-32 object-cover rounded-md border border-border mt-2" />}
            </div>
          )}

          {prepScanState === "review" && (
            <div className="py-2 space-y-3">
              {prepPreviewUrl && <img src={prepPreviewUrl} alt="Prep list" className="w-full max-h-28 object-cover object-top rounded-md border border-border" />}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {prepSelected.size} of {prepTasks.length} tasks selected
                </p>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setPrepSelected(prepSelected.size === prepTasks.length ? new Set() : new Set(prepTasks.map((_, i) => i)))}
                >
                  {prepSelected.size === prepTasks.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {prepTasks.map((task, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                      prepSelected.has(i) ? "border-primary/40 bg-primary/5" : "border-border bg-background opacity-50"
                    )}
                    onClick={() => {
                      const next = new Set(prepSelected);
                      if (next.has(i)) next.delete(i); else next.add(i);
                      setPrepSelected(next);
                    }}
                  >
                    <Checkbox checked={prepSelected.has(i)} className="mt-0.5 shrink-0" onCheckedChange={() => {}} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{task.title}</p>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                      <span className={cn("inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-1", CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS["other"])}>
                        {task.category}
                      </span>
                    </div>
                    <div className="shrink-0 w-36" onClick={e => e.stopPropagation()}>
                      <Select
                        value={prepRecipeLinks[i] !== null && prepRecipeLinks[i] !== undefined ? String(prepRecipeLinks[i]) : "__none__"}
                        onValueChange={v => setPrepRecipeLinks(prev => ({ ...prev, [i]: v === "__none__" ? null : parseInt(v) }))}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Link recipe..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No link</SelectItem>
                          {onboardingRecipes.length === 0 && (
                            <SelectItem value="__empty__" disabled>No recipes yet</SelectItem>
                          )}
                          {onboardingRecipes.map(r => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
              {onboardingRecipes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Recipes highlighted in blue were matched automatically — confirm or change before saving.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOnboardingStep("upload-menu")}>
              Skip
            </Button>
            {prepScanState === "review" && (
              <Button
                onClick={handleSavePrepTasks}
                disabled={prepSelected.size === 0 || isSavingPrep}
                className="bg-primary text-primary-foreground"
              >
                {isSavingPrep
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                  : <>Add {prepSelected.size} task{prepSelected.size !== 1 ? "s" : ""}</>}
              </Button>
            )}
          </DialogFooter>
        </>
      );
    }

    if (onboardingStep === "upload-menu") {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Upload your menu</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload a photo or PDF of your menu and we'll extract the dishes and link them to your recipes.
            </DialogDescription>
          </DialogHeader>

          {menuScanState === "idle" && (
            <div className="py-4 space-y-4">
              <button
                className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-primary/5 transition-colors p-8 flex flex-col items-center gap-3 cursor-pointer"
                onClick={() => uploadMenuRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload your menu</p>
                  <p className="text-xs text-muted-foreground mt-1">Photo, scan, or PDF — we'll read it</p>
                </div>
              </button>
              <input ref={uploadMenuRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleMenuFileChange} />
            </div>
          )}

          {menuScanState === "scanning" && (
            <div className="py-10 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reading your menu...</p>
              {menuPreviewUrl && <img src={menuPreviewUrl} alt="Menu" className="w-full max-h-32 object-cover rounded-md border border-border mt-2" />}
            </div>
          )}

          {menuScanState === "review" && (
            <div className="py-2 space-y-3">
              {menuPreviewUrl && <img src={menuPreviewUrl} alt="Menu" className="w-full max-h-24 object-cover object-top rounded-md border border-border" />}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Menu name</Label>
                <Input
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                  placeholder="e.g. Dinner Menu"
                  className="bg-background border-border"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {menuItems.length} dish{menuItems.length !== 1 ? "es" : ""} found
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {menuItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground capitalize">{item.section}</span>
                        {item.price !== null && (
                          <span className="text-xs text-muted-foreground">· ${item.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 w-36">
                      <Select
                        value={menuRecipeLinks[i] !== null && menuRecipeLinks[i] !== undefined ? String(menuRecipeLinks[i]) : "__none__"}
                        onValueChange={v => setMenuRecipeLinks(prev => ({ ...prev, [i]: v === "__none__" ? null : parseInt(v) }))}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Link recipe..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No link</SelectItem>
                          {onboardingRecipes.length === 0 && (
                            <SelectItem value="__empty__" disabled>No recipes yet</SelectItem>
                          )}
                          {onboardingRecipes.map(r => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
              {onboardingRecipes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No recipes in this venue yet. You can link dishes to recipes later from the Menus page.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOnboardingStep("checklist")}>
              Skip
            </Button>
            {menuScanState === "review" && (
              <Button
                onClick={handleSaveMenu}
                disabled={!menuName.trim() || isSavingMenu}
                className="bg-primary text-primary-foreground"
              >
                {isSavingMenu
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                  : <>Create menu</>}
              </Button>
            )}
          </DialogFooter>
        </>
      );
    }

    // checklist
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Your kitchen is ready</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Here's what to set up next to get the most out of the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-2">
          {setupSteps.map(({ icon: Icon, label, description, href }) => (
            <Link key={href} href={href} onClick={() => resetOnboarding()}>
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer group">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10">
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </div>
            </Link>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={resetOnboarding} className="bg-primary text-primary-foreground w-full">
            Start using the kitchen
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Onboarding wizard */}
      <Dialog open={onboardingVenueId !== null} onOpenChange={(open) => { if (!open) resetOnboarding(); }}>
        <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto bg-card border-border text-foreground">
          {renderOnboardingContent()}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Venues</h1>
          <p className="text-muted-foreground">Manage your locations and kitchens.</p>
        </div>

        <div className="flex gap-2">
          {!venues?.some(v => isDemo(v.name)) && (
            <Button variant="outline" onClick={handleLoadDemo} disabled={isSeedingDemo}>
              {isSeedingDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
              Load demo kitchen
            </Button>
          )}

          {/* Join venue — available to all users */}
          <Dialog open={isJoinOpen} onOpenChange={(o) => { setIsJoinOpen(o); if (!o) setJoinCode(""); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LogIn className="w-4 h-4 mr-2" />
                Join Venue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Join a Venue</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Paste your invite link or the access code you were given.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="join-code" className="text-foreground">Invite link or code</Label>
                  <Input
                    id="join-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="https://…/join/abc123  or  abc123"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsJoinOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleJoin} disabled={!joinCode.trim() || isJoining} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Join
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create venue — 1 venue per early access account */}
          {!atVenueLimit && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Venue
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Venue</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Add a new location to your account.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-foreground">Venue Name</Label>
                    <Input
                      id="name"
                      value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      placeholder="e.g. Downtown Kitchen"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      onKeyDown={e => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="button" onClick={handleCreate} disabled={!newVenueName.trim() || createVenue.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {createVenue.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {!venues || venues.length === 0 ? (
        <Card className="bg-card border-border text-center py-12">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
              <Building className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No venues yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first venue or load a demo kitchen to see everything in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleLoadDemo} disabled={isSeedingDemo} variant="outline">
                {isSeedingDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
                Load demo kitchen
              </Button>
              <Button onClick={() => setIsJoinOpen(true)} variant="outline">
                <LogIn className="w-4 h-4 mr-2" /> Join a Venue
              </Button>
              {!atVenueLimit && (
                <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Venue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => {
            const demo = isDemo(venue.name);
            return (
              <Card
                key={venue.id}
                className={`bg-card border-border overflow-hidden transition-all ${activeVenueId === venue.id ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"}`}
              >
                {activeVenueId === venue.id && (
                  <div className="bg-primary px-4 py-1 text-xs font-bold text-primary-foreground flex items-center justify-center uppercase tracking-wider">
                    <Check className="w-3 h-3 mr-1" /> Active Service
                  </div>
                )}
                {demo && activeVenueId !== venue.id && (
                  <div className="bg-secondary px-4 py-1 text-xs font-semibold text-muted-foreground flex items-center justify-center uppercase tracking-wider">
                    <FlaskConical className="w-3 h-3 mr-1" /> Demo kitchen
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-foreground">{venue.name}</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Created {new Date(venue.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 pt-0">
                  <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Monitor className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide">Service Mode URL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] text-muted-foreground truncate font-mono">
                        {window.location.origin}/display/{venue.id}
                      </code>
                      <button
                        onClick={() => void handleCopyServiceUrl(venue.id)}
                        className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors touch-manipulation"
                      >
                        {copiedServiceUrlId === venue.id
                          ? <><Check className="w-3 h-3" />Copied</>
                          : <><Copy className="w-3 h-3" />Copy</>
                        }
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Open on a tablet or wall screen for kitchen use</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border pt-4 gap-2">
                  {activeVenueId !== venue.id ? (
                    <Button variant="outline" onClick={() => setActiveVenueId(venue.id)} className="flex-1">
                      Switch to venue
                    </Button>
                  ) : (
                    <div className="text-sm font-medium text-primary flex-1 text-center py-2">
                      Current venue
                    </div>
                  )}
                  {demo ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs shrink-0"
                        onClick={handleCopyDemoLink}
                        disabled={isCopyingLink}
                        title="Copy shareable demo link"
                      >
                        {isCopyingLink
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <><Link2 className="w-3.5 h-3.5 mr-1" />Share link</>
                        }
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs shrink-0"
                        onClick={() => handleRemoveDemo(venue.id)}
                        disabled={removingDemoId === venue.id}
                      >
                        {removingDemoId === venue.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <><X className="w-3.5 h-3.5 mr-1" />Remove</>
                        }
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost" size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDelete(venue.id)}
                      disabled={deleteVenue.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
