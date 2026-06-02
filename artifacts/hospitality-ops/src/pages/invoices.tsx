import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import {
  useListInvoices,
  useCreateInvoice,
  useCreateInventoryItem,
  useUpdateInvoiceNote,
  useListSuppliers,
  useListInventory,
  getListInvoicesQueryKey,
  getListSuppliersQueryKey,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  Plus,
  Loader2,
  Camera,
  CheckCircle2,
  ScanLine,
  ChevronRight,
  Package,
  Link2,
  Link2Off,
  Trash2,
  PackagePlus,
  X,
  MessageSquare,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type ScanResult = {
  supplierName: string;
  matchedSupplierId: number | null;
  invoiceNumber: string | null;
  invoiceDate: string;
  totalAmount: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    matchedInventoryItemId: number | null;
    matchedInventoryItemName: string | null;
  }>;
  rawText: string | null;
};

type EditableLineItem = {
  _key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  inventoryItemId: string; // "" = none
  // inline "create new item" form
  isCreatingNew: boolean;
  newItemName: string;
  newItemParLevel: string;
  isCreatingNewPending: boolean;
};

type DialogMode = "closed" | "choose" | "scanning" | "review";

let _keyCounter = 0;
const nextKey = () => String(++_keyCounter);

function makeLineItem(partial?: Partial<EditableLineItem>): EditableLineItem {
  return {
    _key: nextKey(),
    description: "",
    quantity: "1",
    unit: "each",
    unitPrice: "0.00",
    totalPrice: "0.00",
    inventoryItemId: "",
    isCreatingNew: false,
    newItemName: "",
    newItemParLevel: "0",
    isCreatingNewPending: false,
    ...partial,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function autoTotal(qty: string, price: string): string {
  const q = parseFloat(qty);
  const p = parseFloat(price);
  if (!isNaN(q) && !isNaN(p)) return (q * p).toFixed(2);
  return "0.00";
}

function sumLineItems(items: EditableLineItem[]): string {
  const total = items.reduce((acc, item) => acc + (parseFloat(item.totalPrice) || 0), 0);
  return total.toFixed(2);
}

// ── Invoice Note Section ──────────────────────────────────────────────────────

type InvoiceRow = { id: number; notes?: string | null; noteResolvedAt?: string | null };

function InvoiceNoteSection({ invoice, venueId }: { invoice: InvoiceRow; venueId: number }) {
  const queryClient = useQueryClient();
  const updateNote = useUpdateInvoiceNote();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(invoice.notes ?? "");
  const { toast } = useToast();

  const hasNote = !!(invoice.notes?.trim());
  const isResolved = !!invoice.noteResolvedAt;

  const save = async () => {
    try {
      await updateNote.mutateAsync({ venueId, invoiceId: invoice.id, data: { notes: text.trim() || null } });
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(venueId) });
      setEditing(false);
    } catch {
      toast({ title: "Could not save note", variant: "destructive" });
    }
  };

  const toggleResolve = async () => {
    try {
      await updateNote.mutateAsync({ venueId, invoiceId: invoice.id, data: { resolveNote: !isResolved } });
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(venueId) });
    } catch {
      toast({ title: "Could not update note", variant: "destructive" });
    }
  };

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. 2kg beef short — supplier bringing tomorrow. Credit requested."
          className="text-sm bg-background border-border min-h-[72px] resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditing(false); setText(invoice.notes ?? ""); }}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground" disabled={updateNote.isPending} onClick={save}>
            {updateNote.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
            Save note
          </Button>
        </div>
      </div>
    );
  }

  if (!hasNote) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Add a note
      </button>
    );
  }

  return (
    <div className={cn(
      "mt-3 rounded-lg p-3 flex items-start gap-2.5",
      isResolved ? "bg-secondary/40 border border-border" : "bg-amber-50 border border-amber-200"
    )}>
      <MessageSquare className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", isResolved ? "text-muted-foreground" : "text-amber-600")} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs leading-relaxed", isResolved ? "text-muted-foreground line-through" : "text-foreground")}>
          {invoice.notes}
        </p>
        {isResolved && (
          <p className="text-[10px] text-status-healthy font-semibold mt-0.5">Resolved</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-1">
        {!isResolved && (
          <button
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Edit note"
          >
            <PenLine className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={toggleResolve}
          disabled={updateNote.isPending}
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded transition-colors",
            isResolved
              ? "text-muted-foreground hover:text-foreground"
              : "text-amber-700 hover:text-amber-900"
          )}
        >
          {updateNote.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : isResolved ? "Reopen" : "Mark resolved"}
        </button>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { activeVenueId } = useVenueStore();
  const { data: roleData } = useVenueRole();
  const canManage = roleData?.canManage ?? true;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Editable review state
  const [supplierId, setSupplierId] = useState(""); // "" = none
  const [supplierName, setSupplierName] = useState("");
  const [createNewSupplier, setCreateNewSupplier] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalAmount, setTotalAmount] = useState("0.00");
  const [applyToInventory, setApplyToInventory] = useState(true);
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([makeLineItem()]);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const { data: invoices, isLoading } = useListInvoices(activeVenueId as number, {
    query: { enabled: !!activeVenueId, queryKey: getListInvoicesQueryKey(activeVenueId as number) },
  });
  const { data: suppliers } = useListSuppliers(activeVenueId as number, {
    query: { enabled: !!activeVenueId, queryKey: getListSuppliersQueryKey(activeVenueId as number) },
  });
  const { data: inventoryItems } = useListInventory(activeVenueId as number, {
    query: { enabled: !!activeVenueId, queryKey: getListInventoryQueryKey(activeVenueId as number) },
  });

  const createInvoice = useCreateInvoice();
  const createInventoryItem = useCreateInventoryItem();

  const invalidateInvoices = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(activeVenueId as number) });
  }, [queryClient, activeVenueId]);

  const closeDialog = useCallback(() => {
    setDialogMode("closed");
    setIsManualEntry(false);
    setPreviewUrl(null);
    setSupplierId("");
    setSupplierName("");
    setCreateNewSupplier(false);
    setInvoiceNumber("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setTotalAmount("0.00");
    setApplyToInventory(true);
    setLineItems([makeLineItem()]);
  }, []);

  // Populate editable state from scan result
  const populateFromScan = useCallback(
    (result: ScanResult) => {
      setSupplierId(result.matchedSupplierId ? String(result.matchedSupplierId) : "");
      setSupplierName(result.supplierName);
      setInvoiceNumber(result.invoiceNumber ?? "");
      setInvoiceDate(result.invoiceDate);
      setTotalAmount(result.totalAmount.toFixed(2));
      setLineItems(
        result.lineItems.length > 0
          ? result.lineItems.map((li) =>
              makeLineItem({
                description: li.description,
                quantity: String(li.quantity),
                unit: li.unit,
                unitPrice: li.unitPrice.toFixed(2),
                totalPrice: li.totalPrice.toFixed(2),
                inventoryItemId: li.matchedInventoryItemId ? String(li.matchedInventoryItemId) : "",
              })
            )
          : [makeLineItem()]
      );
    },
    []
  );

  // Auto-sync total from line items when they change
  useEffect(() => {
    if (dialogMode === "review" && lineItems.length > 0) {
      setTotalAmount(sumLineItems(lineItems));
    }
  }, [lineItems, dialogMode]);

  // ── File handling ──────────────────────────────────────────────────────────

  const processImageFile = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setDialogMode("scanning");
      setIsScanning(true);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const resp = await fetch(`/api/venues/${activeVenueId}/invoices/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Unknown error" }));
          throw new Error((err as { error?: string }).error ?? "Scan failed");
        }

        const result = (await resp.json()) as ScanResult;
        populateFromScan(result);
        setDialogMode("review");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not read the invoice. Try a clearer photo.";
        toast({ title: "Scan failed", description: msg, variant: "destructive" });
        setDialogMode("choose");
      } finally {
        setIsScanning(false);
      }
    },
    [activeVenueId, populateFromScan, toast]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImageFile(file);
      e.target.value = "";
    },
    [processImageFile]
  );

  // ── Line item editing ──────────────────────────────────────────────────────

  const updateLineItem = useCallback(
    (key: string, field: keyof EditableLineItem, value: string) => {
      setLineItems((prev) =>
        prev.map((item) => {
          if (item._key !== key) return item;
          const updated = { ...item, [field]: value };
          // Auto-calculate total when qty or price changes
          if (field === "quantity" || field === "unitPrice") {
            updated.totalPrice = autoTotal(
              field === "quantity" ? value : item.quantity,
              field === "unitPrice" ? value : item.unitPrice
            );
          }
          return updated;
        })
      );
    },
    []
  );

  const removeLineItem = useCallback((key: string) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((i) => i._key !== key) : prev));
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, makeLineItem()]);
  }, []);

  const setLineItemField = useCallback(
    (key: string, patch: Partial<EditableLineItem>) => {
      setLineItems((prev) => prev.map((item) => item._key === key ? { ...item, ...patch } : item));
    },
    []
  );

  const handleCreateNewInventoryItem = useCallback(
    (key: string) => {
      const item = lineItems.find((i) => i._key === key);
      if (!item || !item.newItemName.trim()) return;
      setLineItemField(key, { isCreatingNewPending: true });
      createInventoryItem.mutate(
        {
          venueId: activeVenueId as number,
          data: {
            name: item.newItemName.trim(),
            unit: item.unit || "each",
            currentStock: 0,
            averageCost: parseFloat(item.unitPrice) || 0,
            parLevel: parseFloat(item.newItemParLevel) || 0,
            supplierId: supplierId ? parseInt(supplierId) : undefined,
          },
        },
        {
          onSuccess: (newItem) => {
            queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId as number) });
            setLineItemField(key, {
              inventoryItemId: String(newItem.id),
              isCreatingNew: false,
              isCreatingNewPending: false,
              newItemName: "",
              newItemParLevel: "0",
            });
            toast({ title: "Item added", description: `"${newItem.name}" added to your inventory.` });
          },
          onError: () => {
            setLineItemField(key, { isCreatingNewPending: false });
            toast({ title: "Error", description: "Could not create inventory item.", variant: "destructive" });
          },
        }
      );
    },
    [lineItems, createInventoryItem, activeVenueId, supplierId, queryClient, setLineItemField, toast]
  );

  // ── Confirm (scan review) ──────────────────────────────────────────────────

  const handleConfirm = useCallback(
    async (apply: boolean) => {
      if (!supplierName || !invoiceDate) {
        toast({ title: "Missing fields", description: "Supplier name and date are required.", variant: "destructive" });
        return;
      }
      setIsConfirming(true);
      try {
        const resp = await fetch(`/api/venues/${activeVenueId}/invoices/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: supplierId ? parseInt(supplierId) : null,
            supplierName,
            createNewSupplier: !supplierId && createNewSupplier,
            invoiceNumber: invoiceNumber || null,
            invoiceDate,
            totalAmount: parseFloat(totalAmount) || 0,
            applyToInventory: apply,
            lineItems: lineItems.map((li) => ({
              description: li.description,
              quantity: parseFloat(li.quantity) || 0,
              unit: li.unit,
              unitPrice: parseFloat(li.unitPrice) || 0,
              totalPrice: parseFloat(li.totalPrice) || 0,
              inventoryItemId: li.inventoryItemId ? parseInt(li.inventoryItemId) : null,
            })),
          }),
        });
        if (!resp.ok) throw new Error("Failed to save invoice");
        const { updatedCount } = (await resp.json()) as { invoice: unknown; updatedCount: number };
        invalidateInvoices();
        closeDialog();
        toast({
          title: apply ? "Invoice saved and costs updated" : "Invoice saved",
          description: apply && updatedCount > 0
            ? `${updatedCount} inventory item${updatedCount === 1 ? "" : "s"} updated with new prices.`
            : apply
            ? "No matching inventory items found — costs unchanged."
            : undefined,
        });
      } catch {
        toast({ title: "Error", description: "Could not save invoice.", variant: "destructive" });
      } finally {
        setIsConfirming(false);
      }
    },
    [activeVenueId, supplierId, supplierName, invoiceNumber, invoiceDate, totalAmount, lineItems, invalidateInvoices, closeDialog, toast]
  );

  // ── Manual save ────────────────────────────────────────────────────────────

  const openManualEntry = useCallback(() => {
    setIsManualEntry(true);
    setSupplierId("");
    setSupplierName("");
    setCreateNewSupplier(false);
    setInvoiceNumber("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setTotalAmount("0.00");
    setApplyToInventory(true);
    setLineItems([makeLineItem()]);
    setDialogMode("review");
  }, []);

  // ── Matched item count ─────────────────────────────────────────────────────

  const matchedCount = lineItems.filter((i) => i.inventoryItemId).length;

  if (!activeVenueId) return <div className="text-center p-8">Select a venue first.</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-8 h-8 text-primary" />
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">Scan a delivery docket — AI reads it, you review and fix it.</p>
        </div>
        {canManage && (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={() => setDialogMode("choose")}>
            <ScanLine className="w-4 h-4 mr-2" /> Add Invoice
          </Button>
        )}
      </div>

      {/* ── Dialog ─────────────────────────────────────────────────────────── */}
      <Dialog open={dialogMode !== "closed"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent
          className={cn(
            "bg-card border-border",
            dialogMode === "review" ? "sm:max-w-[680px]" : "sm:max-w-[520px]"
          )}
        >

          {/* CHOOSE */}
          {dialogMode === "choose" && (
            <>
              <DialogHeader><DialogTitle>Add an Invoice</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-4">
                <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/60 transition-colors text-left group">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Take a photo</p>
                    <p className="text-sm text-muted-foreground">Point your camera at a delivery docket — AI reads it, you review</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/60 transition-colors text-left group">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <ScanLine className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Upload from device</p>
                    <p className="text-sm text-muted-foreground">Choose an existing photo or scan from your camera roll</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
                </button>
                <div className="flex items-center gap-3"><Separator className="flex-1" /><span className="text-xs text-muted-foreground">or</span><Separator className="flex-1" /></div>
                <button onClick={openManualEntry} className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border hover:bg-secondary/40 transition-colors text-left group">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Enter manually</p>
                    <p className="text-sm text-muted-foreground">Add line items individually with cost and quantity</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
                </button>
              </div>
            </>
          )}

          {/* SCANNING */}
          {dialogMode === "scanning" && (
            <>
              <DialogHeader><DialogTitle>Reading your invoice...</DialogTitle></DialogHeader>
              <div className="py-6 flex flex-col items-center gap-6">
                {previewUrl && (
                  <div className="w-full max-h-52 overflow-hidden rounded-xl border border-border relative">
                    <img src={previewUrl} alt="Invoice" className="w-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm font-medium">AI is reading the docket...</p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">Extracting supplier, prices and line items. Takes about 10 seconds.</p>
              </div>
            </>
          )}

          {/* REVIEW — fully editable (also used for manual entry) */}
          {dialogMode === "review" && (
            <>
              <DialogHeader>
                <DialogTitle>{isManualEntry ? "Add Invoice" : "Review & Correct Invoice"}</DialogTitle>
                <p className="text-sm text-muted-foreground pt-1">
                  {isManualEntry
                    ? "Choose a supplier, add each line item with cost and quantity, then save."
                    : "Check what the AI extracted and fix anything that looks wrong before saving."}
                </p>
              </DialogHeader>

              <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1 py-2">

                {/* ── Header fields ── */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Supplier name + match */}
                  <div className="col-span-2 grid gap-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</Label>
                    <div className="flex gap-2">
                      <Input
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Supplier name"
                        className="flex-1 bg-background border-border"
                      />
                      <Select
                        value={supplierId}
                        onValueChange={(v) => {
                          setSupplierId(v === "none" ? "" : v);
                          if (v !== "none") {
                            const s = suppliers?.find((s) => s.id === parseInt(v));
                            if (s) setSupplierName(s.name);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[160px] bg-background border-border text-sm">
                          <SelectValue placeholder="Link supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No link</SelectItem>
                          {suppliers?.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {supplierId ? (
                      <p className="text-xs text-status-healthy flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Linked to {suppliers?.find((s) => s.id === parseInt(supplierId))?.name}
                      </p>
                    ) : supplierName ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <input
                          type="checkbox"
                          id="createNewSupplier"
                          checked={createNewSupplier}
                          onChange={(e) => setCreateNewSupplier(e.target.checked)}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer"
                        />
                        <label htmlFor="createNewSupplier" className="text-xs text-muted-foreground cursor-pointer select-none">
                          Add <span className="font-semibold text-foreground">{supplierName}</span> as a new supplier
                        </label>
                      </div>
                    ) : null}
                  </div>

                  {/* Invoice number */}
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice #</Label>
                    <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Optional" className="bg-background border-border" />
                  </div>

                  {/* Date */}
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
                    <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-background border-border" />
                  </div>

                  {/* Total */}
                  <div className="col-span-2 grid gap-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className="bg-background border-border font-bold text-lg"
                    />
                    <p className="text-xs text-muted-foreground">Auto-calculated from line items. Override if the docket total differs.</p>
                  </div>
                </div>

                <Separator />

                {/* ── Line items ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Line Items ({lineItems.length})
                    </Label>
                    <Button variant="ghost" size="sm" onClick={addLineItem} className="text-primary h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add row
                    </Button>
                  </div>

                  {lineItems.map((item) => {
                    const matched = inventoryItems?.find((inv) => inv.id === parseInt(item.inventoryItemId));
                    return (
                      <div
                        key={item._key}
                        className={cn(
                          "rounded-lg border p-3 space-y-2",
                          item.inventoryItemId
                            ? "border-status-healthy/30 bg-status-healthy/5"
                            : "border-border bg-secondary/20"
                        )}
                      >
                        {/* Row 1: description + delete */}
                        <div className="flex gap-2 items-center">
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(item._key, "description", e.target.value)}
                            placeholder="Item description"
                            className="flex-1 bg-background border-border text-sm h-8"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => removeLineItem(item._key)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Row 2: qty / unit / unit price / total */}
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Qty</p>
                            <Input
                              type="number"
                              step="0.001"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item._key, "quantity", e.target.value)}
                              className="bg-background border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Unit</p>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateLineItem(item._key, "unit", e.target.value)}
                              placeholder="kg"
                              className="bg-background border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Unit $</p>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item._key, "unitPrice", e.target.value)}
                              className="bg-background border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Total $</p>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.totalPrice}
                              onChange={(e) => updateLineItem(item._key, "totalPrice", e.target.value)}
                              className="bg-background border-border h-8 text-sm font-semibold"
                            />
                          </div>
                        </div>

                        {/* Row 3: inventory link */}
                        <div className="flex items-center gap-2">
                          {item.inventoryItemId ? (
                            <Link2 className="w-3.5 h-3.5 text-status-healthy flex-shrink-0" />
                          ) : (
                            <Link2Off className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <Select
                            value={item.isCreatingNew ? "__create__" : (item.inventoryItemId || "none")}
                            onValueChange={(v) => {
                              if (v === "__create__") {
                                setLineItemField(item._key, {
                                  isCreatingNew: true,
                                  newItemName: item.description,
                                  inventoryItemId: "",
                                });
                              } else {
                                setLineItemField(item._key, {
                                  inventoryItemId: v === "none" ? "" : v,
                                  isCreatingNew: false,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs bg-background border-border flex-1">
                              <SelectValue placeholder="Link to inventory item" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No inventory link</SelectItem>
                              <SelectItem value="__create__">
                                <span className="flex items-center gap-1.5 text-primary font-medium">
                                  <PackagePlus className="w-3 h-3" /> Add as new item...
                                </span>
                              </SelectItem>
                              {inventoryItems && inventoryItems.length > 0 && (
                                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Existing items
                                </div>
                              )}
                              {inventoryItems?.map((inv) => (
                                <SelectItem key={inv.id} value={String(inv.id)}>
                                  {inv.name} ({inv.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Inline "create new inventory item" form */}
                        {item.isCreatingNew && (
                          <div className="mt-1 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                <PackagePlus className="w-3.5 h-3.5" /> Add to inventory
                              </p>
                              <button
                                onClick={() => setLineItemField(item._key, { isCreatingNew: false })}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="col-span-2">
                                <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Item name</p>
                                <Input
                                  value={item.newItemName}
                                  onChange={(e) => setLineItemField(item._key, { newItemName: e.target.value })}
                                  placeholder="e.g. Free-range eggs"
                                  className="bg-background border-border h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Par level</p>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={item.newItemParLevel}
                                  onChange={(e) => setLineItemField(item._key, { newItemParLevel: e.target.value })}
                                  className="bg-background border-border h-8 text-sm"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Unit: <strong>{item.unit}</strong> · Starting stock: 0 · Cost: ${item.unitPrice}/{item.unit}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs"
                                onClick={() => setLineItemField(item._key, { isCreatingNew: false })}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 h-7 text-xs bg-primary text-primary-foreground"
                                disabled={!item.newItemName.trim() || item.isCreatingNewPending}
                                onClick={() => handleCreateNewInventoryItem(item._key)}
                              >
                                {item.isCreatingNewPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <PackagePlus className="w-3 h-3 mr-1" />
                                )}
                                Add item
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* ── Apply toggle ── */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                  <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">Update inventory costs</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {matchedCount > 0
                        ? `${matchedCount} item${matchedCount === 1 ? "" : "s"} linked — average costs will be updated`
                        : "No items linked yet — costs won't change"}
                    </p>
                  </div>
                  <Switch
                    checked={applyToInventory}
                    onCheckedChange={setApplyToInventory}
                    disabled={matchedCount === 0}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                {isManualEntry ? (
                  <Button variant="outline" onClick={() => { setIsManualEntry(false); setDialogMode("choose"); }} className="flex-shrink-0">
                    Back
                  </Button>
                ) : (
                  <Button variant="outline" onClick={closeDialog} className="flex-shrink-0">
                    Discard
                  </Button>
                )}
                <Button
                  onClick={() => handleConfirm(applyToInventory)}
                  disabled={isConfirming || !supplierName}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  {isConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {applyToInventory && matchedCount > 0 ? "Save & update costs" : "Save invoice"}
                </Button>
              </DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>

      {/* ── Invoice list ─────────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-secondary" />)}</div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No invoices yet</h3>
              <p className="mb-4">Take a photo of a delivery docket — AI reads it, you confirm the numbers.</p>
              <Button onClick={() => setDialogMode("choose")} className="bg-primary text-primary-foreground">
                <ScanLine className="w-4 h-4 mr-2" /> Scan your first invoice
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="px-6 py-4 flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50">
                <div className="flex-1">Supplier / Details</div>
                <div className="w-36 text-right hidden sm:block">Date</div>
                <div className="w-28 text-right">Amount</div>
              </div>
              {invoices.map((invoice) => (
                <div key={invoice.id} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{invoice.supplierName}</p>
                      {invoice.invoiceNumber && <p className="text-xs text-muted-foreground mt-0.5">#{invoice.invoiceNumber}</p>}
                      <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                        {new Date(invoice.invoiceDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="w-36 text-right text-muted-foreground font-medium hidden sm:block shrink-0">
                      {new Date(invoice.invoiceDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="w-28 text-right font-bold text-foreground text-lg shrink-0">${invoice.totalAmount.toFixed(2)}</div>
                  </div>
                  <InvoiceNoteSection invoice={invoice} venueId={activeVenueId} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
