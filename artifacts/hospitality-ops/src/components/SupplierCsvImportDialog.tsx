import { useRef, useState } from "react";
import { Loader2, Upload, FileText, TriangleAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ParsedSupplier {
  name: string;
  category?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  deliveryDays?: string;
  orderCutoffTime?: string;
  notes?: string;
  rowNumber: number;
}

type Step = "input" | "review";
type InputTab = "paste" | "upload";

interface Props {
  open: boolean;
  onClose: () => void;
  venueId: number;
  onImported: () => void;
}

const SAMPLE = "Name,Category,Contact,Email,Phone,Delivery Days,Cutoff\nFresh Fields Produce,Fruit & Veg,Jamie,orders@freshfields.com.au,0432 100 200,Mon Wed Fri,15:00\nCoastal Seafood Co,Seafood,Mike,mike@coastalseafood.com,0411 300 400,Tue Thu Sat,12:00";

export function SupplierCsvImportDialog({ open, onClose, venueId, onImported }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<InputTab>("paste");
  const [step, setStep] = useState<Step>("input");
  const [csvText, setCsvText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parsed, setParsed] = useState<ParsedSupplier[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTab("paste");
    setStep("input");
    setCsvText("");
    setParsed([]);
    setWarnings([]);
    setError(null);
    setIsParsing(false);
    setIsCommitting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePreview = async (csv: string) => {
    setIsParsing(true);
    setError(null);
    try {
      const resp = await fetch(`/api/venues/${venueId}/suppliers/preview-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await resp.json() as { suppliers?: ParsedSupplier[]; warnings?: string[]; error?: string };
      if (!resp.ok) throw new Error(data.error ?? "Could not parse CSV");
      if (!data.suppliers || data.suppliers.length === 0) {
        setError("No supplier rows found. Make sure your CSV has a header row and at least one row with a name.");
        return;
      }
      setParsed(data.suppliers);
      setWarnings(data.warnings ?? []);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvText(text);
      handlePreview(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const resp = await fetch(`/api/venues/${venueId}/suppliers/import-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await resp.json() as { created?: number; skipped?: number; error?: string };
      if (!resp.ok) throw new Error(data.error ?? "Import failed");
      toast({
        title: `Added ${data.created} supplier${data.created === 1 ? "" : "s"}`,
        description: data.skipped ? `${data.skipped} row${data.skipped === 1 ? "" : "s"} skipped` : undefined,
      });
      onImported();
      handleClose();
    } catch (err) {
      toast({ title: "Import failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "input" ? (
          <>
            <DialogHeader>
              <DialogTitle>Import suppliers from CSV</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Bulk-add your supplier contacts. Paste from a spreadsheet or upload a CSV file.
              </p>
            </DialogHeader>

            <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
              {[
                { id: "paste" as const, label: "Paste", icon: <FileText className="w-4 h-4" /> },
                { id: "upload" as const, label: "Upload CSV", icon: <Upload className="w-4 h-4" /> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setError(null); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors",
                    tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 py-2">
              {tab === "paste" && (
                <>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Paste CSV content
                  </Label>
                  <Textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    placeholder={SAMPLE}
                    className="bg-background border-border min-h-[200px] text-sm font-mono resize-y"
                  />
                  <Button
                    onClick={() => handlePreview(csvText.trim())}
                    disabled={!csvText.trim() || isParsing}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    {isParsing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Parsing...</> : "Preview"}
                  </Button>
                </>
              )}

              {tab === "upload" && (
                <>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Upload CSV file
                  </Label>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={isParsing}
                    className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {isParsing ? (
                      <><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="text-sm font-medium">Reading...</p></>
                    ) : (
                      <><Upload className="w-8 h-8 text-muted-foreground" /><p className="text-sm font-medium text-foreground">Click to upload a CSV</p><p className="text-xs text-muted-foreground">Exported from Excel, Sheets, or your accounting system</p></>
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleFileUpload} />
                </>
              )}

              <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Recognised columns (case insensitive):</p>
                <p><span className="font-mono">Name</span> (required), <span className="font-mono">Category</span>, <span className="font-mono">Contact</span>, <span className="font-mono">Email</span>, <span className="font-mono">Phone</span>, <span className="font-mono">Website</span>, <span className="font-mono">Delivery Days</span>, <span className="font-mono">Cutoff</span>, <span className="font-mono">Notes</span></p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-status-critical/30 bg-status-critical/5 p-3 text-sm text-status-critical">
                  <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review suppliers to import</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                {parsed.length} supplier{parsed.length === 1 ? "" : "s"} ready to add.
              </p>
            </DialogHeader>

            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                {warnings.map((w, i) => <p key={i}>{w}</p>)}
              </div>
            )}

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {parsed.map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{s.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {s.category && <span>{s.category}</span>}
                        {s.contactName && <span>{s.contactName}</span>}
                        {s.email && <span className="truncate">{s.email}</span>}
                        {s.phone && <span>{s.phone}</span>}
                        {s.orderCutoffTime && <span>cutoff {s.orderCutoffTime}</span>}
                        {s.deliveryDays && <span>{s.deliveryDays}</span>}
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-status-healthy shrink-0 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")} disabled={isCommitting}>Back</Button>
              <Button onClick={handleCommit} disabled={isCommitting} className="bg-primary text-primary-foreground">
                {isCommitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</> : `Add ${parsed.length} supplier${parsed.length === 1 ? "" : "s"}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
