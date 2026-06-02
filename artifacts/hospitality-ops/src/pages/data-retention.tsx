import { useState, useEffect, useCallback } from "react";
import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import { useDemoStore } from "@/stores/demoStore";
import { useAuth } from "@clerk/react";
import {
  Archive, Download, CalendarClock, Mail, Plus, X, RefreshCw,
  CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Database, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const FREQUENCY_OPTIONS = [
  { value: "off",       label: "Off",       description: "No automatic exports" },
  { value: "weekly",    label: "Weekly",    description: "Every 7 days" },
  { value: "monthly",   label: "Monthly",   description: "First of each month" },
  { value: "quarterly", label: "Quarterly", description: "Every 3 months" },
] as const;

const EXPORT_TYPES = [
  { value: "waste",       label: "Waste Log",         description: "Spoilage & waste records" },
  { value: "food-cost",   label: "Food Cost",          description: "Recipe cost analysis" },
  { value: "stocktake",   label: "Stocktake",          description: "Stock count history" },
  { value: "inventory",   label: "Inventory",          description: "Current inventory snapshot" },
  { value: "temperature", label: "Temperature",        description: "Equipment temp checks" },
  { value: "suppliers",   label: "Supplier Prices",    description: "Price history records" },
] as const;

interface RecipientEntry {
  email: string;
  name?: string;
  optedIn: boolean;
}

type ExportSettings = {
  venueId: number;
  frequency: string;
  exportTypes: string[];
  additionalRecipients: RecipientEntry[];
  ownerOptedIn: boolean;
  ownerName: string;
  ownerEmail: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  emailConfigured: boolean;
  role: string;
};

type ExportLog = {
  id: number;
  venueId: number;
  exportType: string;
  triggeredBy: string;
  emailedTo: string[];
  status: string;
  fileName: string | null;
  recordCount: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  errorMessage: string | null;
  generatedAt: string;
};

const EXPORT_TYPE_LABELS: Record<string, string> = {
  "waste": "Waste Log", "food-cost": "Food Cost", "stocktake": "Stocktake",
  "inventory": "Inventory", "temperature": "Temperature", "suppliers": "Supplier Prices",
};

function statusBadge(status: string) {
  switch (status) {
    case "success": return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs">Done</Badge>;
    case "failed":  return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 text-xs">Failed</Badge>;
    case "pending": return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 text-xs">Pending</Badge>;
    default:        return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

export default function DataRetentionPage() {
  const { activeVenueId } = useVenueStore();
  const { data: roleData, isLoading: roleLoading } = useVenueRole();
  const { isDemoMode, demoToken } = useDemoStore();
  const { getToken } = useAuth();

  // Builds the Authorization header for raw fetch calls, compatible with both
  // Clerk sessions and the demo sandbox token.
  const getAuthHeader = async (): Promise<string | null> => {
    if (isDemoMode && demoToken) return `Bearer demo-${demoToken}`;
    const t = await getToken();
    return t ? `Bearer ${t}` : null;
  };

  const isOwner  = roleData?.isOwner  ?? false;
  const isAdmin  = roleData?.isAdmin  ?? false;

  const [settings, setSettings] = useState<ExportSettings | null>(null);
  const [logs, setLogs] = useState<ExportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local editable state
  const [frequency, setFrequency] = useState("off");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["waste", "food-cost", "stocktake"]);
  const [ownerOptedIn, setOwnerOptedIn] = useState(true);
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Manual export
  const [triggerType, setTriggerType] = useState("waste");
  const [triggerFrom, setTriggerFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [triggerTo, setTriggerTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(true);

  const fetchData = useCallback(async () => {
    if (!activeVenueId) return;
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};
      const [settingsRes, logsRes] = await Promise.all([
        fetch(`/api/venues/${activeVenueId}/export-settings`, { headers }),
        fetch(`/api/venues/${activeVenueId}/export-logs`, { headers }),
      ]);
      if (settingsRes.ok) {
        const s: ExportSettings = await settingsRes.json();
        setSettings(s);
        setFrequency(s.frequency);
        setSelectedTypes(s.exportTypes ?? ["waste", "food-cost", "stocktake"]);
        setOwnerOptedIn(s.ownerOptedIn ?? true);
        setRecipients(s.additionalRecipients ?? []);
      }
      if (logsRes.ok) setLogs(await logsRes.json());
    } finally {
      setLoading(false);
    }
  }, [activeVenueId, getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveSchedule = async () => {
    if (!activeVenueId || !isAdmin) return;
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const authHeader = await getAuthHeader();
      const body: Record<string, unknown> = { frequency, exportTypes: selectedTypes };
      if (isOwner) { body["ownerOptedIn"] = ownerOptedIn; body["additionalRecipients"] = recipients; }
      const res = await fetch(`/api/venues/${activeVenueId}/export-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setSaveError((err as {error?: string}).error ?? "Failed to save");
      } else {
        const updated: ExportSettings = await res.json();
        setSettings(updated);
        setOwnerOptedIn(updated.ownerOptedIn ?? true);
        setRecipients(updated.additionalRecipients ?? []);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally { setSaving(false); }
  };

  const saveRecipients = async () => {
    if (!activeVenueId || !isOwner) return;
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`/api/venues/${activeVenueId}/export-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({
          frequency, exportTypes: selectedTypes,
          ownerOptedIn, additionalRecipients: recipients,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setSaveError((err as {error?: string}).error ?? "Failed to save");
      } else {
        const updated: ExportSettings = await res.json();
        setSettings(updated);
        setRecipients(updated.additionalRecipients ?? []);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally { setSaving(false); }
  };

  const addRecipient = () => {
    setEmailError(null);
    const e = newEmail.trim().toLowerCase();
    if (!e.includes("@") || !e.includes(".")) { setEmailError("Enter a valid email address"); return; }
    if (recipients.some(r => r.email === e)) { setEmailError("Already added"); return; }
    setRecipients(prev => [...prev, { email: e, name: newName.trim() || undefined, optedIn: true }]);
    setNewEmail(""); setNewName("");
  };

  const removeRecipient = (email: string) => setRecipients(prev => prev.filter(r => r.email !== email));

  const toggleRecipientOptIn = (email: string) => {
    setRecipients(prev => prev.map(r => r.email === email ? { ...r, optedIn: !r.optedIn } : r));
  };

  const triggerExport = async () => {
    if (!activeVenueId || !isAdmin) return;
    setTriggering(true); setTriggerError(null); setTriggerSuccess(null);
    try {
      const authHeader = await getAuthHeader();
      const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};

      let res: Response;

      if (isDemoMode) {
        // Demo kitchen: writes are blocked — use the simple GET export endpoint instead.
        const url = `/api/venues/${activeVenueId}/export?type=${triggerType}&from=${triggerFrom}&to=${triggerTo}`;
        res = await fetch(url, { headers });
      } else {
        res = await fetch(`/api/venues/${activeVenueId}/exports/trigger`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ type: triggerType, from: triggerFrom, to: triggerTo }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        setTriggerError((err as {error?: string}).error ?? "Export failed"); return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const fileName = disposition?.match(/filename="(.+)"/)?.[1]
        ?? `${triggerType}-${triggerFrom}-to-${triggerTo}.csv`;
      const emailedTo = res.headers.get("X-Emailed-To");
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = fileName; a.click();
      URL.revokeObjectURL(blobUrl);

      if (emailedTo) {
        setTriggerSuccess(`Downloaded and emailed to ${emailedTo}`);
      } else {
        setTriggerSuccess("Downloaded successfully");
      }
      setTimeout(() => setTriggerSuccess(null), 6000);
      if (!isDemoMode) setTimeout(fetchData, 800);
    } finally { setTriggering(false); }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  if (roleLoading || loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48 bg-card" />
        <Skeleton className="h-64 w-full bg-card" />
        <Skeleton className="h-48 w-full bg-card" />
      </div>
    );
  }

  if (!activeVenueId) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Select a venue to manage data exports.</div>;
  }

  return (
    <div className="space-y-6 pb-20 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Archive className="w-8 h-8 text-primary" />
          Data &amp; Exports
        </h1>
        <p className="text-muted-foreground mt-1">Schedule automatic exports, download records, and view export history.</p>
      </div>

      {/* ── Demo kitchen notice ──────────────────────────────────────────── */}
      {isDemoMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Email exports not available in the demo kitchen</p>
              <p className="text-sm text-blue-700">
                You can still download any export as a CSV file below. To enable scheduled email delivery, set up your own venue.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Non-admin notice ────────────────────────────────────────────── */}
      {!isAdmin && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">Only venue owners and admins can manage export settings. You can view export history below.</p>
          </CardContent>
        </Card>
      )}

      {/* ── Email not configured notice (owner only, non-demo) ──────────── */}
      {settings && !settings.emailConfigured && isOwner && !isDemoMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Email delivery not configured</p>
              <p className="text-sm text-blue-700">
                To send exports automatically, add a{" "}
                <code className="bg-blue-100 px-1 rounded text-xs">RESEND_API_KEY</code> secret in your project settings.
                Manual CSV downloads will still work without it.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Export Schedule ─────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Scheduled Exports
            {isDemoMode && (
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 ml-auto">Download only in demo</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Frequency */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">Export frequency</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FREQUENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  disabled={!isAdmin || isDemoMode}
                  onClick={() => isAdmin && !isDemoMode && setFrequency(opt.value)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                    frequency === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80 hover:bg-secondary/40",
                    (!isAdmin || isDemoMode) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-xs mt-0.5">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {settings?.nextRunAt && frequency !== "off" && !isDemoMode && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/40 rounded-lg px-4 py-2.5">
              <Clock className="w-4 h-4" />
              <span>Next scheduled run: <strong className="text-foreground">{fmtDate(settings.nextRunAt)}</strong></span>
            </div>
          )}
          {settings?.lastRunAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Last run: {fmtDate(settings.lastRunAt)}</span>
            </div>
          )}

          {/* Data types */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">Data types to export</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPORT_TYPES.map(type => (
                <label
                  key={type.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedTypes.includes(type.value) ? "border-primary/40 bg-primary/5" : "border-border hover:bg-secondary/40",
                    (!isAdmin || isDemoMode) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => isAdmin && !isDemoMode && toggleType(type.value)}
                    disabled={!isAdmin || isDemoMode}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {isAdmin && !isDemoMode && (
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={saveSchedule} disabled={saving || selectedTypes.length === 0}>
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? "Saving..." : "Save schedule"}
              </Button>
              {saveSuccess && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
              {saveError && <span className="text-sm text-destructive">{saveError}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Email Recipients — owner only, not demo ──────────────────────── */}
      {isOwner && !isDemoMode && (
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Export Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              Control who receives automatic export emails. Toggle any recipient off to pause their delivery without removing them.
            </p>

            {/* Owner row */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Venue Owner</p>
              <div className="flex items-center justify-between gap-3 bg-secondary/40 rounded-lg px-4 py-3 border border-border">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{settings?.ownerName ?? "You"}</p>
                  <p className="text-xs text-muted-foreground truncate">{settings?.ownerEmail}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{ownerOptedIn ? "Receiving" : "Paused"}</span>
                  <Switch
                    checked={ownerOptedIn}
                    onCheckedChange={v => setOwnerOptedIn(v)}
                  />
                </div>
              </div>
            </div>

            {/* Additional recipients */}
            {recipients.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Additional Recipients</p>
                <div className="space-y-2">
                  {recipients.map(r => (
                    <div key={r.email} className="flex items-center gap-3 bg-secondary/40 rounded-lg px-4 py-3 border border-border">
                      <div className="flex-1 min-w-0">
                        {r.name && <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>}
                        <p className={cn("text-sm truncate", r.name ? "text-muted-foreground text-xs" : "text-foreground font-medium")}>{r.email}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">{r.optedIn ? "Receiving" : "Paused"}</span>
                        <Switch checked={r.optedIn} onCheckedChange={() => toggleRecipientOptIn(r.email)} />
                        <button onClick={() => removeRecipient(r.email)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new recipient */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Recipient</p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Input
                  placeholder="Name (optional)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-background border-border sm:w-40 flex-shrink-0"
                />
                <Input
                  placeholder="accountant@example.com"
                  value={newEmail}
                  onChange={e => { setNewEmail(e.target.value); setEmailError(null); }}
                  onKeyDown={e => e.key === "Enter" && addRecipient()}
                  className="bg-background border-border flex-1"
                />
                <Button variant="outline" onClick={addRecipient} className="shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={saveRecipients} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? "Saving..." : "Save recipients"}
              </Button>
              {saveSuccess && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
              {saveError && <span className="text-sm text-destructive">{saveError}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Manual Export ────────────────────────────────────────────────── */}
      {isAdmin && (
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Now
              {isDemoMode && (
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 ml-auto">CSV download only</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Download any data set as a CSV file immediately.
              {!isDemoMode && " The file is also emailed to opted-in recipients if email is configured."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data type</Label>
                <select
                  value={triggerType}
                  onChange={e => setTriggerType(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {EXPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</Label>
                <Input type="date" value={triggerFrom} onChange={e => setTriggerFrom(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</Label>
                <Input type="date" value={triggerTo} onChange={e => setTriggerTo(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={triggerExport} disabled={triggering}>
                {triggering
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : <><Download className="w-4 h-4 mr-2" />Download CSV</>
                }
              </Button>
              {triggerError && <span className="text-sm text-destructive">{triggerError}</span>}
              {triggerSuccess && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{triggerSuccess}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Retention Policy ─────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-lg flex items-center gap-2"><Database className="w-5 h-5 text-primary" />Data Retention Policy</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Recipes", "Inventory history", "Waste logs", "Temperature logs",
              "Stocktakes", "Supplier price history", "Invoices", "Prep board history",
            ].map(item => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-foreground">{item}</span>
                <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs">Kept indefinitely</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            All operational records are kept indefinitely. No data is automatically deleted. Exports are for backup and off-platform analysis.
          </p>
        </CardContent>
      </Card>

      {/* ── Export History ───────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border py-4">
          <button className="w-full flex items-center justify-between" onClick={() => setLogsExpanded(p => !p)}>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Export History
              {logs.length > 0 && <Badge variant="outline" className="text-xs border-border ml-1">{logs.length}</Badge>}
            </CardTitle>
            {logsExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {logsExpanded && (
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No exports yet. Trigger a manual export above to get started.</div>
            ) : (
              <div className="divide-y divide-border">
                {logs.slice(0, 20).map(log => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {EXPORT_TYPE_LABELS[log.exportType] ?? log.exportType}
                          </span>
                          {statusBadge(log.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {log.dateFrom && log.dateTo && (
                            <span className="text-xs text-muted-foreground">
                              {fmtDateShort(log.dateFrom)} – {fmtDateShort(log.dateTo)}
                            </span>
                          )}
                          {log.recordCount !== null && (
                            <span className="text-xs text-muted-foreground">{log.recordCount} records</span>
                          )}
                          {log.triggeredBy === "scheduler"
                            ? <span className="text-xs text-muted-foreground">Scheduled</span>
                            : <span className="text-xs text-muted-foreground">Manual</span>
                          }
                        </div>
                        {!isDemoMode && log.emailedTo?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Sent to {log.emailedTo.join(", ")}
                          </p>
                        )}
                        {log.errorMessage && (
                          <p className="text-xs text-destructive mt-1">{log.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{fmtDate(log.generatedAt)}</p>
                        <p className="text-xs text-muted-foreground">{fmtTime(log.generatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
