import { useState, useRef, useCallback } from "react";
import { useVenueStore } from "@/stores/venueStore";
import { useParams } from "wouter";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useGetSupplier,
  useGetSupplierPriceHistory,
  useListInventory,
  getGetSupplierQueryKey,
  getGetSupplierPriceHistoryQueryKey,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import {
  ArrowLeft, Edit2, Loader2, Phone, Mail, Globe, Calendar,
  Clock, Package, TrendingUp, TrendingDown, Minus, DollarSign,
  ShoppingCart, AlertTriangle, LineChart as ChartIcon, Upload,
  Link2, FileText, X, Check, ChevronDown, TriangleAlert, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SupplierProduct {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  parLevel: number;
  averageCost: number;
  shelfLifeDays: number | null;
  lastRestocked: string | null;
  latestPriceChange: {
    oldPrice: number | null;
    newPrice: number;
    changePercent: number | null;
    recordedAt: string;
  } | null;
}

interface ParsedProduct {
  name: string;
  price: number;
  unit: string;
  confidence: "high" | "low";
  matchedInventoryItemId: number | null;
  matchedInventoryItemName: string | null;
  currentCost: number | null;
}

type ImportTab = "url" | "text" | "csv" | "image";
type ImportStep = "input" | "review";

// ── Sub-components ────────────────────────────────────────────────────────────

function StockBar({ current, par }: { current: number; par: number }) {
  const pct = par > 0 ? Math.min((current / par) * 100, 100) : 100;
  const isLow = current < par;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", isLow ? "bg-status-low" : "bg-status-healthy")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-[10px] font-medium tabular-nums", isLow ? "text-status-low" : "text-muted-foreground")}>
        {current} / {par}
      </span>
    </div>
  );
}

function PriceTrend({ change }: { change: SupplierProduct["latestPriceChange"] }) {
  if (!change) return null;
  const pct = change.changePercent;
  const up = pct !== null && pct > 0;
  const down = pct !== null && pct < 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded",
      up ? "bg-status-critical/10 text-status-critical" :
      down ? "bg-status-healthy/10 text-status-healthy" :
      "bg-secondary text-muted-foreground"
    )}>
      {up ? <TrendingUp className="w-2.5 h-2.5" /> : down ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
      {pct !== null ? `${up ? "+" : ""}${pct.toFixed(1)}%` : "changed"}
      {change.oldPrice !== null && (
        <span className="font-normal opacity-70 ml-0.5">from ${change.oldPrice.toFixed(2)}</span>
      )}
    </span>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-secondary/60 rounded-lg px-3 py-2.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </span>
      <span className="text-sm font-semibold text-foreground truncate">{value}</span>
    </div>
  );
}

// ── Import dialog ─────────────────────────────────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  venueId: number;
  supplierId: number;
  inventoryItems: Array<{ id: number; name: string; averageCost: string }> | undefined;
  onApplied: () => void;
}

function ImportDialog({ open, onClose, venueId, supplierId, inventoryItems, onApplied }: ImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<ImportTab>("image");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>("input");
  const [urlValue, setUrlValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedProduct[]>([]);
  // Per-item overrides: key = index, value = { invId: number|null, skip: bool }
  const [overrides, setOverrides] = useState<Map<number, { invId: number | null; skip: boolean }>>(new Map());
  const [isApplying, setIsApplying] = useState(false);

  const reset = useCallback(() => {
    setStep("input");
    setParseError(null);
    setParsedItems([]);
    setOverrides(new Map());
    setUrlValue("");
    setTextValue("");
    setIsParsing(false);
    setIsApplying(false);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const parse = async (type: ImportTab, content: string, mediaType?: string) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const resp = await fetch(`/api/venues/${venueId}/suppliers/${supplierId}/parse-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, ...(mediaType ? { mediaType } : {}) }),
      });
      const data = await resp.json() as { products?: ParsedProduct[]; error?: string };
      if (!resp.ok) throw new Error(data.error ?? "Parse failed");
      const items = data.products ?? [];
      setParsedItems(items);
      setOverrides(new Map(items.map((p, i) => [i, { invId: p.matchedInventoryItemId, skip: false }])));
      setStep("review");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsParsing(false);
    }
  };

  const handleUrlParse = () => {
    if (!urlValue.trim()) return;
    parse("url", urlValue.trim());
  };

  const handleTextParse = () => {
    if (!textValue.trim()) return;
    parse("text", textValue.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      parse("csv", text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setParseError("Image is too large — keep it under 10 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      // Strip "data:image/jpeg;base64," prefix → keep only the base64 payload
      const commaIdx = dataUrl.indexOf(",");
      const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
      const mediaType = file.type || "image/jpeg";
      parse("image", base64, mediaType);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const setOverride = (idx: number, patch: Partial<{ invId: number | null; skip: boolean }>) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(idx, { ...next.get(idx)!, ...patch });
      return next;
    });
  };

  const itemsToApply = parsedItems
    .map((p, i) => ({ p, o: overrides.get(i) }))
    .filter(({ o }) => o && !o.skip && o.invId !== null);

  const handleApply = async () => {
    if (itemsToApply.length === 0) return;
    setIsApplying(true);
    try {
      const resp = await fetch(`/api/venues/${venueId}/suppliers/${supplierId}/apply-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToApply.map(({ p, o }) => ({
            inventoryItemId: o!.invId,
            name: p.name,
            newPrice: p.price,
          })),
        }),
      });
      const data = await resp.json() as { updated?: number; error?: string };
      if (!resp.ok) throw new Error(data.error ?? "Apply failed");
      toast({ title: `Updated ${data.updated} item${data.updated === 1 ? "" : "s"}` });
      onApplied();
      handleClose();
    } catch (err) {
      toast({ title: "Failed to apply", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  const tabItems: { id: ImportTab; label: string; icon: React.ReactNode }[] = [
    { id: "image", label: "Photo", icon: <Camera className="w-4 h-4" /> },
    { id: "url", label: "Website URL", icon: <Link2 className="w-4 h-4" /> },
    { id: "text", label: "Paste text", icon: <FileText className="w-4 h-4" /> },
    { id: "csv", label: "CSV / spreadsheet", icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "input" ? (
          <>
            <DialogHeader>
              <DialogTitle>Import price list</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Pull in supplier prices from a URL, pasted text, or a CSV file. AI reads the content and matches items to your inventory.
              </p>
            </DialogHeader>

            {/* Tab strip */}
            <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
              {tabItems.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setParseError(null); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors",
                    tab === t.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            <div className="space-y-4 py-2">
              {tab === "url" && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Supplier price list URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={urlValue}
                      onChange={e => setUrlValue(e.target.value)}
                      placeholder="https://supplier.com/price-list"
                      className="bg-background border-border flex-1"
                      onKeyDown={e => e.key === "Enter" && handleUrlParse()}
                    />
                    <Button onClick={handleUrlParse} disabled={!urlValue.trim() || isParsing} className="bg-primary text-primary-foreground shrink-0">
                      {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                    </Button>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Works best with:</p>
                    <p>Public HTML price list pages, shared Google Sheets, plain text files</p>
                    <p className="text-status-low">Does not work with: Ordermentum, pages requiring login, JavaScript-only pages, PDFs</p>
                    <p>For those, use "Paste text" — copy the content and paste it here instead.</p>
                  </div>
                </div>
              )}

              {tab === "text" && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Paste price list content
                  </Label>
                  <Textarea
                    value={textValue}
                    onChange={e => setTextValue(e.target.value)}
                    placeholder={"Copy text from Ordermentum, a supplier website, an email, or a spreadsheet and paste it here.\n\nExamples:\nBeef Bavette   $22.50/kg\nSea Bass (Whole)   $19.50/kg\nDouble Cream   $3.80/litre"}
                    className="bg-background border-border min-h-[180px] text-sm font-mono resize-y"
                  />
                  <Button onClick={handleTextParse} disabled={!textValue.trim() || isParsing} className="bg-primary text-primary-foreground w-full">
                    {isParsing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reading...</> : "Parse with AI"}
                  </Button>
                </div>
              )}

              {tab === "image" && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Photo of order sheet or price list
                  </Label>
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isParsing}
                    className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {isParsing ? (
                      <><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="text-sm font-medium">Reading photo with AI...</p><p className="text-xs text-muted-foreground">This usually takes 10-20 seconds.</p></>
                    ) : (
                      <><Camera className="w-8 h-8 text-muted-foreground" /><p className="text-sm font-medium text-foreground">Snap or upload a photo</p><p className="text-xs text-muted-foreground">Printed price list, supplier fax, handwritten order sheet</p></>
                    )}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Best results:</p>
                    <p>Flat, well-lit photo. Get the whole sheet in frame. Hold steady.</p>
                    <p>Works on printed sheets, faxes, and even legible handwriting.</p>
                    <p>JPEG, PNG, WebP, or GIF — under 10 MB.</p>
                  </div>
                </div>
              )}

              {tab === "csv" && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Upload CSV or spreadsheet
                  </Label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                    className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {isParsing ? (
                      <><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="text-sm font-medium">Reading file...</p></>
                    ) : (
                      <><Upload className="w-8 h-8 text-muted-foreground" /><p className="text-sm font-medium text-foreground">Click to upload a CSV file</p><p className="text-xs text-muted-foreground">Exported from a spreadsheet, accounting system, or supplier portal</p></>
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleFileChange} />
                  <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">CSV format tips:</p>
                    <p>Include column headers: <span className="font-mono">Product, Price, Unit</span> (or similar names)</p>
                    <p>If no headers are detected, the first column is used as product name and the first number column as price</p>
                    <p>Export from Excel/Sheets as CSV before uploading</p>
                  </div>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 rounded-lg border border-status-critical/30 bg-status-critical/5 p-3 text-sm text-status-critical">
                  <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{parseError}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review extracted prices</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                {parsedItems.length} products found. Link each to an inventory item and deselect any you want to skip.
              </p>
            </DialogHeader>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {parsedItems.map((item, idx) => {
                const o = overrides.get(idx) ?? { invId: item.matchedInventoryItemId, skip: false };
                const linkedInv = inventoryItems?.find(i => i.id === o.invId);
                const currentCost = linkedInv ? parseFloat(linkedInv.averageCost) : item.currentCost;
                const priceDiff = currentCost !== null ? item.price - currentCost : null;
                const priceDiffPct = currentCost && currentCost > 0 ? (priceDiff! / currentCost) * 100 : null;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-3 transition-opacity",
                      o.skip ? "opacity-40 bg-secondary/20 border-border/40" : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {/* Skip toggle */}
                      <button
                        onClick={() => setOverride(idx, { skip: !o.skip })}
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors",
                          o.skip
                            ? "border-border bg-secondary text-muted-foreground"
                            : "border-primary bg-primary text-primary-foreground"
                        )}
                      >
                        {!o.skip && <Check className="w-3 h-3" />}
                      </button>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + price + confidence */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{item.name}</span>
                          <span className="text-base font-bold text-foreground tabular-nums">
                            ${item.price.toFixed(2)}
                            <span className="text-xs font-normal text-muted-foreground ml-0.5">/{item.unit}</span>
                          </span>
                          {item.confidence === "low" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-status-low font-semibold">
                              <TriangleAlert className="w-2.5 h-2.5" />low confidence
                            </span>
                          )}
                          {priceDiffPct !== null && !o.skip && o.invId !== null && (
                            <span className={cn(
                              "text-[10px] font-semibold",
                              priceDiffPct > 0 ? "text-status-critical" : "text-status-healthy"
                            )}>
                              {priceDiffPct > 0 ? "+" : ""}{priceDiffPct.toFixed(1)}% vs current ${currentCost!.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Inventory link */}
                        {!o.skip && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0">Link to:</span>
                            <Select
                              value={o.invId !== null ? String(o.invId) : "none"}
                              onValueChange={v => setOverride(idx, { invId: v === "none" ? null : parseInt(v) })}
                            >
                              <SelectTrigger className="h-7 text-xs bg-background border-border flex-1">
                                <SelectValue placeholder="Select inventory item" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground italic">No match — skip this item</span>
                                </SelectItem>
                                {inventoryItems?.map(inv => (
                                  <SelectItem key={inv.id} value={String(inv.id)}>
                                    {inv.name} <span className="text-muted-foreground">(${parseFloat(inv.averageCost).toFixed(2)})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("input")} className="shrink-0">
                Back
              </Button>
              <Button
                onClick={handleApply}
                disabled={isApplying || itemsToApply.length === 0}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {isApplying
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Applying...</>
                  : <><Check className="w-4 h-4 mr-2" />Apply {itemsToApply.length} price{itemsToApply.length === 1 ? "" : "s"}</>
                }
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SupplierDetailPage() {
  const { activeVenueId } = useVenueStore();
  const params = useParams();
  const supplierId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);

  const { data: supplier, isLoading: isLoadingSupplier } = useGetSupplier(
    activeVenueId as number,
    supplierId,
    { query: { enabled: !!activeVenueId && !!supplierId, queryKey: getGetSupplierQueryKey(activeVenueId as number, supplierId) } }
  );

  const { data: products, isLoading: isLoadingProducts } = useQuery<SupplierProduct[]>({
    queryKey: ["supplier-products", activeVenueId, supplierId],
    queryFn: async () => {
      const resp = await fetch(`/api/venues/${activeVenueId}/suppliers/${supplierId}/products`);
      if (!resp.ok) throw new Error("Failed to load products");
      return resp.json() as Promise<SupplierProduct[]>;
    },
    enabled: !!activeVenueId && !!supplierId,
  });

  const { data: priceHistory } = useGetSupplierPriceHistory(
    activeVenueId as number,
    supplierId,
    { query: { enabled: !!activeVenueId && !!supplierId, queryKey: getGetSupplierPriceHistoryQueryKey(activeVenueId as number, supplierId) } }
  );

  const { data: allInventory } = useListInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListInventoryQueryKey(activeVenueId as number) } }
  );

  const handleApplied = () => {
    queryClient.invalidateQueries({ queryKey: ["supplier-products", activeVenueId, supplierId] });
    queryClient.invalidateQueries({ queryKey: getGetSupplierPriceHistoryQueryKey(activeVenueId as number, supplierId) });
    queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId as number) });
  };

  if (!activeVenueId) return <div className="p-8 text-center text-muted-foreground">Select a venue first.</div>;
  if (isLoadingSupplier) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!supplier) return <div className="p-8 text-center text-muted-foreground">Supplier not found.</div>;

  const recentSpikes = priceHistory?.filter(h => h.changePercent && h.changePercent > 5).length ?? 0;
  const totalProductCost = products?.reduce((sum, p) => sum + p.averageCost * p.currentStock, 0) ?? 0;
  const deliveryDaysDisplay = supplier.deliveryDays
    ? supplier.deliveryDays.split(",").map((d: string) => d.trim().slice(0, 3)).join(" · ")
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* Import dialog */}
      {activeVenueId && (
        <ImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          venueId={activeVenueId}
          supplierId={supplierId}
          inventoryItems={allInventory as Array<{ id: number; name: string; averageCost: string }> | undefined}
          onApplied={handleApplied}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/suppliers"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
            {supplier.category && <Badge variant="secondary" className="text-xs">{supplier.category}</Badge>}
          </div>
          {supplier.contactName && (
            <p className="text-sm text-muted-foreground mt-0.5">Contact: {supplier.contactName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />Import prices
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/suppliers/${supplierId}/edit`}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{products?.length ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Products</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">${totalProductCost.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Stock value</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className={cn("text-2xl font-bold", recentSpikes > 0 ? "text-status-critical" : "text-status-healthy")}>
            {recentSpikes}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Price spikes</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {supplier.minimumOrderValue != null ? `$${supplier.minimumOrderValue.toFixed(0)}` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Min order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Logistics chips */}
          {(deliveryDaysDisplay || supplier.orderCutoffTime || supplier.minimumOrderValue != null || supplier.deliveryFee != null) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {deliveryDaysDisplay && (
                <InfoChip icon={<Calendar className="w-3 h-3" />} label="Delivery" value={deliveryDaysDisplay} />
              )}
              {supplier.orderCutoffTime && (
                <InfoChip icon={<Clock className="w-3 h-3" />} label="Cutoff" value={supplier.orderCutoffTime} />
              )}
              {supplier.minimumOrderValue != null && (
                <InfoChip icon={<ShoppingCart className="w-3 h-3" />} label="Min order" value={`$${supplier.minimumOrderValue.toFixed(2)}`} />
              )}
              {supplier.deliveryFee != null && (
                <InfoChip icon={<DollarSign className="w-3 h-3" />} label="Delivery fee"
                  value={supplier.deliveryFee > 0 ? `$${supplier.deliveryFee.toFixed(2)}` : "Free"} />
              )}
            </div>
          )}

          {/* Products */}
          <Card className="bg-card border-border">
            <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Products
                {products && <span className="text-sm font-normal text-muted-foreground">({products.length})</span>}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-primary text-xs h-7">
                <Link href="/suppliers/price-comparison">Compare prices</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingProducts ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full bg-secondary" />)}
                </div>
              ) : !products || products.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No inventory items linked to this supplier yet.
                  <br />
                  <span className="text-xs opacity-70">Link items via Inventory, or import a price list above.</span>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {products.map(product => {
                    const isLow = product.currentStock < product.parLevel;
                    return (
                      <div key={product.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                              {product.latestPriceChange && <PriceTrend change={product.latestPriceChange} />}
                              {isLow && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-status-low">
                                  <AlertTriangle className="w-2.5 h-2.5" />Low
                                </span>
                              )}
                            </div>
                            <StockBar current={product.currentStock} par={product.parLevel} />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {product.currentStock} {product.unit} in stock · par {product.parLevel} {product.unit}
                              {product.shelfLifeDays && ` · ${product.shelfLifeDays}d shelf life`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-foreground tabular-nums">
                              ${product.averageCost.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">/{product.unit}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          {(supplier.phone || supplier.email || supplier.website || supplier.notes) && (
            <Card className="bg-card border-border">
              <CardHeader className="py-4 border-b border-border">
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {supplier.phone && (
                  <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-3.5 h-3.5 shrink-0" />{supplier.phone}
                  </a>
                )}
                {supplier.email && (
                  <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-3.5 h-3.5 shrink-0" />{supplier.email}
                  </a>
                )}
                {supplier.website && (
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="w-3.5 h-3.5 shrink-0" />{supplier.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {supplier.notes && (
                  <><Separator className="my-2" /><p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p></>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Price history sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border sticky top-24">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-primary" />
                Price changes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!priceHistory || priceHistory.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No price changes recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border/60 max-h-[480px] overflow-y-auto">
                  {[...priceHistory]
                    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                    .map(entry => {
                      const pct = entry.changePercent ?? 0;
                      const up = pct > 0;
                      return (
                        <div key={entry.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                          <p className="font-medium text-foreground text-sm truncate">{entry.itemName}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              {entry.oldPrice != null && (
                                <span className="text-muted-foreground line-through">${entry.oldPrice.toFixed(2)}</span>
                              )}
                              <span className="text-foreground font-semibold">${entry.newPrice.toFixed(2)}</span>
                            </div>
                            <span className={cn(
                              "text-xs font-bold flex items-center gap-0.5",
                              up ? "text-status-critical" : "text-status-healthy"
                            )}>
                              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {up ? "+" : ""}{pct.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(entry.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
