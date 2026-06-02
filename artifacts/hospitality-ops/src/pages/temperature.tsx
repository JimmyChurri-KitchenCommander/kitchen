import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Thermometer, Plus, Download, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Loader2, Pencil, Archive,
  RefreshCw, ShieldCheck, Clock, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableRow } from "@/components/SwipeableRow";
import { useToast } from "@/hooks/use-toast";
import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import { cn } from "@/lib/utils";
import {
  useListTemperatureEquipment,
  useCreateTemperatureEquipment,
  useUpdateTemperatureEquipment,
  useArchiveTemperatureEquipment,
  useListTemperatureLogs,
  useCreateTemperatureLog,
  useUpdateTemperatureLog,
  getListTemperatureEquipmentQueryKey,
  getListTemperatureLogsQueryKey,
  type TemperatureEquipment,
  type TemperatureLog,
} from "@workspace/api-client-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EQUIPMENT_TYPES = [
  { value: "fridge",   label: "Fridge",      minTemp: 1,   maxTemp: 5   },
  { value: "coolroom", label: "Cool Room",   minTemp: 0,   maxTemp: 5   },
  { value: "freezer",  label: "Freezer",     minTemp: -22, maxTemp: -15 },
  { value: "display",  label: "Display Case",minTemp: 1,   maxTemp: 5   },
  { value: "delivery", label: "Delivery",    minTemp: 0,   maxTemp: 5   },
];

const EQUIPMENT_TYPE_LABEL: Record<string, string> = {
  fridge: "Fridge", coolroom: "Cool Room", freezer: "Freezer",
  display: "Display", delivery: "Delivery",
};

const INTERVAL_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "1", label: "Every 1 hour" },
  { value: "2", label: "Every 2 hours" },
  { value: "4", label: "Every 4 hours" },
  { value: "6", label: "Every 6 hours" },
  { value: "8", label: "Every 8 hours" },
  { value: "12", label: "Every 12 hours" },
  { value: "24", label: "Daily (24 hours)" },
];

function intervalLabel(hours: number | null): string {
  if (!hours) return "";
  const opt = INTERVAL_OPTIONS.find((o) => o.value === String(hours));
  return opt ? opt.label : `Every ${hours}h`;
}

function overdueSince(lastChecked: string | null, intervalHours: number): string {
  if (!lastChecked) return "never checked";
  const overdueMs = Date.now() - new Date(lastChecked).getTime() - intervalHours * 3_600_000;
  if (overdueMs <= 0) return "";
  const h = Math.floor(overdueMs / 3_600_000);
  const m = Math.floor((overdueMs % 3_600_000) / 60_000);
  if (h === 0) return `${m}m overdue`;
  return `${h}h ${m}m overdue`;
}

function predictStatus(temp: number, eq: TemperatureEquipment | null, logType: string): "pass" | "fail" | null {
  if (logType === "delivery_check" && !eq) {
    if (temp > 5) return "fail";
    return "pass";
  }
  if (!eq) return null;
  if (temp < eq.minTemp || temp > eq.maxTemp) return "fail";
  return "pass";
}

function formatTemp(t: number) {
  return `${t >= 0 ? "+" : ""}${t.toFixed(1)}°C`;
}

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h === 0) return `${m}m ago`;
  if (h < 24) return `${h}h ${m}m ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtDT(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Equipment Form Dialog ────────────────────────────────────────────────────

interface EquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  venueId: number;
  editing?: TemperatureEquipment;
}

function EquipmentDialog({ open, onClose, venueId, editing }: EquipmentDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState(editing?.type ?? "fridge");
  const [minTemp, setMinTemp] = useState(editing ? String(editing.minTemp) : "1");
  const [maxTemp, setMaxTemp] = useState(editing ? String(editing.maxTemp) : "5");
  const [intervalHours, setIntervalHours] = useState(editing?.checkIntervalHours ? String(editing.checkIntervalHours) : "");

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setType(editing?.type ?? "fridge");
      setMinTemp(editing ? String(editing.minTemp) : "1");
      setMaxTemp(editing ? String(editing.maxTemp) : "5");
      setIntervalHours(editing?.checkIntervalHours ? String(editing.checkIntervalHours) : "");
    }
  }, [open, editing]);

  const handleTypeChange = (v: string) => {
    setType(v);
    const preset = EQUIPMENT_TYPES.find((t) => t.value === v);
    if (preset && !editing) {
      setMinTemp(String(preset.minTemp));
      setMaxTemp(String(preset.maxTemp));
    }
  };

  const create = useCreateTemperatureEquipment();
  const update = useUpdateTemperatureEquipment();

  const handleSave = () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(), type,
      minTemp: parseFloat(minTemp), maxTemp: parseFloat(maxTemp),
      checkIntervalHours: intervalHours ? parseInt(intervalHours) : null,
    };
    const invalidateEq = () => qc.invalidateQueries({ queryKey: getListTemperatureEquipmentQueryKey(venueId) });

    if (editing) {
      update.mutate(
        { venueId, equipmentId: editing.id, data },
        {
          onSuccess: () => { toast({ title: "Equipment updated" }); invalidateEq(); onClose(); },
          onError: () => toast({ title: "Failed to update", variant: "destructive" }),
        }
      );
    } else {
      create.mutate(
        { venueId, data },
        {
          onSuccess: () => { toast({ title: "Equipment added" }); invalidateEq(); onClose(); },
          onError: () => toast({ title: "Failed to create", variant: "destructive" }),
        }
      );
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Walk-in Fridge 1" className="mt-1" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min Temp (°C)</Label>
              <Input value={minTemp} onChange={(e) => setMinTemp(e.target.value)} type="number" step="0.5" className="mt-1" />
            </div>
            <div>
              <Label>Max Temp (°C)</Label>
              <Input value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} type="number" step="0.5" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Check Reminder Interval</Label>
            <Select value={intervalHours} onValueChange={setIntervalHours}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="No reminder" /></SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Staff will see a prompt if no check is recorded within this time
            </p>
          </div>
          <p className="text-xs text-muted-foreground">NSW: chilled ≤5°C, frozen ≤-15°C</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy || !name.trim()}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? "Save Changes" : "Add Equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Corrective Action Dialog ─────────────────────────────────────────────────

interface CorrectiveDialogProps {
  open: boolean;
  onClose: () => void;
  venueId: number;
  log: TemperatureLog;
}

function CorrectiveDialog({ open, onClose, venueId, log }: CorrectiveDialogProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [action, setAction] = useState(log.correctiveAction ?? "");
  const [recheck, setRecheck] = useState(log.recheckTemp != null ? String(log.recheckTemp) : "");
  const [resolved, setResolved] = useState(log.isResolved ?? false);

  const update = useUpdateTemperatureLog();

  const handleSave = () => {
    update.mutate(
      {
        venueId,
        logId: log.id,
        data: {
          correctiveAction: action || null,
          recheckTemp: recheck ? parseFloat(recheck) : null,
          isResolved: resolved,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Corrective action saved" });
          qc.invalidateQueries({ queryKey: getListTemperatureLogsQueryKey(venueId) });
          onClose();
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Corrective Action</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Failed check — {log.itemName || "equipment"} at {formatTemp(log.recordedTemp)} on {fmtDT(log.checkedAt)}
          </div>
          <div>
            <Label>Action Taken</Label>
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Adjusted thermostat, moved stock to backup fridge, notified manager"
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label>Recheck Temperature (°C)</Label>
            <Input value={recheck} onChange={(e) => setRecheck(e.target.value)} type="number" step="0.1" placeholder="e.g. 4.2" className="mt-1" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={resolved} onChange={(e) => setResolved(e.target.checked)} className="rounded" />
            <span className="text-sm">Mark as resolved</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Equipment Tab ────────────────────────────────────────────────────────────

interface EquipmentTabProps {
  venueId: number;
  isAdmin: boolean;
}

function QuickTempLogDialog({
  eq,
  venueId,
  onClose,
}: {
  eq: TemperatureEquipment;
  venueId: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [temp, setTemp] = useState("");
  const [checker, setChecker] = useState<string>(() => {
    try { return localStorage.getItem("tempCheckedBy") ?? ""; } catch { return ""; }
  });
  const createLog = useCreateTemperatureLog();
  const tempNum = parseFloat(temp);
  const predicted = temp && !isNaN(tempNum) ? predictStatus(tempNum, eq, "equipment_check") : null;

  function submit() {
    if (!temp || isNaN(tempNum)) { toast({ title: "Enter a temperature reading", variant: "destructive" }); return; }
    if (!checker.trim()) { toast({ title: "Enter your name", variant: "destructive" }); return; }
    try { localStorage.setItem("tempCheckedBy", checker); } catch {}
    createLog.mutate(
      { venueId, data: { logType: "equipment_check", equipmentId: eq.id, recordedTemp: tempNum, checkedBy: checker.trim() } },
      {
        onSuccess: (log) => {
          const pass = log.status === "pass";
          toast({
            title: pass ? `PASS — ${formatTemp(log.recordedTemp)}` : `FAIL — ${formatTemp(log.recordedTemp)} out of range`,
            variant: pass ? "default" : "destructive",
          });
          qc.invalidateQueries({ queryKey: getListTemperatureEquipmentQueryKey(venueId) });
          onClose();
        },
        onError: () => toast({ title: "Failed to save check", variant: "destructive" }),
      }
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Log temperature — {eq.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Reading (°C) — range {eq.minTemp} to {eq.maxTemp}</Label>
            <Input
              type="number"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder={`e.g. ${Math.round((eq.minTemp + eq.maxTemp) / 2)}`}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            {predicted && (
              <p className={cn("text-xs font-semibold", predicted === "pass" ? "text-green-600" : "text-red-600")}>
                {predicted === "pass" ? "Within range" : "Out of range — corrective action required"}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Checked by</Label>
            <Input
              value={checker}
              onChange={(e) => setChecker(e.target.value)}
              placeholder="Your name"
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={createLog.isPending || !temp || !checker.trim()}>
            {createLog.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EquipmentTab({ venueId, isAdmin }: EquipmentTabProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<TemperatureEquipment | undefined>();
  const [quickLogEq, setQuickLogEq] = useState<TemperatureEquipment | null>(null);

  const { data: equipment = [], isLoading } = useListTemperatureEquipment(venueId, {
    query: { enabled: !!venueId, queryKey: getListTemperatureEquipmentQueryKey(venueId) },
  });

  const archive = useArchiveTemperatureEquipment();

  const overdueList = equipment.filter((e) => e.isOverdue);

  const handleArchive = (eq: TemperatureEquipment) => {
    if (!confirm(`Archive "${eq.name}"? This will hide it from the list.`)) return;
    archive.mutate(
      { venueId, equipmentId: eq.id },
      {
        onSuccess: () => {
          toast({ title: "Equipment archived" });
          qc.invalidateQueries({ queryKey: getListTemperatureEquipmentQueryKey(venueId) });
        },
        onError: () => toast({ title: "Failed to archive", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 bg-secondary" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue alert banner */}
      {overdueList.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              {overdueList.length === 1 ? "1 check overdue" : `${overdueList.length} checks overdue`}
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              {overdueList.map((e) => e.name).join(", ")} — go to Log Check to record temperatures now
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{equipment.length} active {equipment.length === 1 ? "unit" : "units"}</p>
        {isAdmin && (
          <Button onClick={() => { setEditing(undefined); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        )}
      </div>

      {equipment.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Thermometer className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No equipment configured</p>
            {isAdmin && <p className="text-sm mt-1">Add your fridges, freezers and cool rooms to get started.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment.map((eq) => {
            const status = eq.lastStatus;
            const overdue = eq.isOverdue;
            return (
              <SwipeableRow
                key={eq.id}
                rightAction={{ label: "Log Temp", icon: <Thermometer className="w-4 h-4" />, bgClass: "bg-blue-600", onTrigger: () => setQuickLogEq(eq) }}
              >
              <Card className={cn(
                "border",
                overdue ? "border-amber-300 bg-amber-50/40"
                  : status === "fail" ? "border-status-critical/40 bg-status-critical/5"
                  : status === "pass" ? "border-green-300/50 bg-green-50/30"
                  : "border-border bg-card"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground">{eq.name}</p>
                        <Badge variant="outline" className="text-xs">{EQUIPMENT_TYPE_LABEL[eq.type] ?? eq.type}</Badge>
                        {overdue && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Check overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Range: {formatTemp(eq.minTemp)} to {formatTemp(eq.maxTemp)}
                        {eq.checkIntervalHours && (
                          <span className="ml-2 text-xs">&bull; {intervalLabel(eq.checkIntervalHours)}</span>
                        )}
                      </p>
                    </div>
                    {overdue ? (
                      <Clock className="w-6 h-6 text-amber-500 shrink-0" />
                    ) : status === "fail" ? (
                      <XCircle className="w-6 h-6 text-status-critical shrink-0" />
                    ) : status === "pass" ? (
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                    ) : (
                      <Thermometer className="w-6 h-6 text-muted-foreground/40 shrink-0" />
                    )}
                  </div>

                  {/* Last check info */}
                  {eq.lastChecked ? (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        <span className={cn(
                          "text-lg font-bold",
                          status === "fail" ? "text-status-critical" : "text-green-700"
                        )}>
                          {eq.lastTemp != null ? formatTemp(eq.lastTemp) : "—"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">{eq.lastChecked ? timeSince(eq.lastChecked) : ""}</span>
                      </div>
                      {overdue && eq.checkIntervalHours && (
                        <span className="text-xs font-medium text-amber-600">
                          {overdueSince(eq.lastChecked ?? null, eq.checkIntervalHours ?? 0)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-border">
                      {overdue ? (
                        <p className="text-xs font-medium text-amber-600">Never checked — check required</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No checks recorded yet</p>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setEditing(eq); setShowDialog(true); }}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => handleArchive(eq)}>
                        <Archive className="w-3 h-3 mr-1" /> Archive
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              </SwipeableRow>
            );
          })}
        </div>
      )}

      <EquipmentDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        venueId={venueId}
        editing={editing}
      />
      {quickLogEq && (
        <QuickTempLogDialog
          eq={quickLogEq}
          venueId={venueId}
          onClose={() => setQuickLogEq(null)}
        />
      )}
    </div>
  );
}

// ─── Log Check Tab ────────────────────────────────────────────────────────────

interface LogCheckTabProps {
  venueId: number;
}

function LogCheckTab({ venueId }: LogCheckTabProps) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [logType, setLogType] = useState<"equipment_check" | "delivery_check">("equipment_check");
  const [equipmentId, setEquipmentId] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [recordedTemp, setRecordedTemp] = useState("");
  const [notes, setNotes] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [prevFailAction, setPrevFailAction] = useState("");
  const [checkedBy, setCheckedBy] = useState(() => localStorage.getItem("tempCheckedBy") ?? "");

  const { data: equipment = [] } = useListTemperatureEquipment(venueId, {
    query: { enabled: !!venueId, queryKey: getListTemperatureEquipmentQueryKey(venueId) },
  });

  const overdueEquipment = equipment.filter((e) => e.isOverdue);
  const selectedEq = equipment.find((e) => String(e.id) === equipmentId) ?? null;
  const tempNum = parseFloat(recordedTemp);
  const predictedStatus = recordedTemp && !isNaN(tempNum)
    ? predictStatus(tempNum, selectedEq, logType)
    : null;

  // Fetch recent fail logs for selected equipment so we can detect an unresolved previous fail
  const prevFailParams = equipmentId
    ? { equipmentId: parseInt(equipmentId), failedOnly: "true" as const }
    : null;
  const { data: prevFailLogs = [] } = useListTemperatureLogs(
    venueId,
    prevFailParams ?? {},
    {
      query: {
        enabled: logType === "equipment_check" && !!equipmentId && selectedEq?.lastStatus === "fail",
        queryKey: getListTemperatureLogsQueryKey(venueId, prevFailParams ?? {}),
      },
    },
  );
  const prevFail = prevFailLogs.find((l) => !l.isResolved) ?? null;

  const createLog = useCreateTemperatureLog();
  const updateLog = useUpdateTemperatureLog();

  const handleSubmit = () => {
    if (!recordedTemp || isNaN(tempNum)) { toast({ title: "Enter a temperature", variant: "destructive" }); return; }
    if (!checkedBy.trim()) { toast({ title: "Enter your name", variant: "destructive" }); return; }
    if (logType === "equipment_check" && !equipmentId) { toast({ title: "Select equipment", variant: "destructive" }); return; }
    if (logType === "delivery_check" && !itemName.trim()) { toast({ title: "Enter the item or delivery name", variant: "destructive" }); return; }

    localStorage.setItem("tempCheckedBy", checkedBy);

    createLog.mutate(
      {
        venueId,
        data: {
          logType,
          equipmentId: logType === "equipment_check" && equipmentId ? parseInt(equipmentId) : undefined,
          itemName: logType === "delivery_check" ? itemName.trim() : undefined,
          recordedTemp: tempNum,
          notes: notes.trim() || undefined,
          correctiveAction: correctiveAction.trim() || undefined,
          checkedBy: checkedBy.trim(),
        },
      },
      {
        onSuccess: (log) => {
          const passed = log.status === "pass";
          // Auto-resolve the previous unresolved fail for this equipment
          if (prevFail) {
            updateLog.mutate({
              venueId,
              logId: prevFail.id,
              data: {
                correctiveAction: prevFailAction.trim() || prevFail.correctiveAction || null,
                isResolved: true,
              },
            });
          }
          toast({
            title: passed ? "Check recorded — PASS" : "Check recorded — FAIL",
            description: passed ? `${formatTemp(log.recordedTemp)} is within range` : `${formatTemp(log.recordedTemp)} is out of range — corrective action required`,
            variant: passed ? "default" : "destructive",
          });
          setRecordedTemp("");
          setNotes("");
          setCorrectiveAction("");
          setItemName("");
          setPrevFailAction("");
        },
        onError: () => toast({ title: "Failed to save check", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Overdue prompt banner */}
      {overdueEquipment.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                {overdueEquipment.length === 1 ? "Temperature check required" : `${overdueEquipment.length} temperature checks required`}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {overdueEquipment.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setLogType("equipment_check"); setEquipmentId(String(e.id)); }}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                      equipmentId === String(e.id)
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
                    )}
                  >
                    {e.name}
                    {e.checkIntervalHours && (
                      <span className="ml-1 opacity-75">
                        ({overdueSince(e.lastChecked ?? null, e.checkIntervalHours ?? 0)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2">
        <Card className="bg-card border-border">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="text-base font-bold">Record Temperature Check</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(["equipment_check", "delivery_check"] as const).map((t) => (
                <Button
                  key={t}
                  variant={logType === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setLogType(t); setEquipmentId(""); setItemName(""); }}
                >
                  {t === "equipment_check" ? "Equipment Check" : "Delivery Check"}
                </Button>
              ))}
            </div>

            {/* Equipment or Item */}
            {logType === "equipment_check" ? (
              <div>
                <Label>Equipment</Label>
                <Select value={equipmentId} onValueChange={(v) => { setEquipmentId(v); setPrevFailAction(""); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={String(eq.id)}>
                        {eq.name} ({EQUIPMENT_TYPE_LABEL[eq.type] ?? eq.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEq && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Safe range: {formatTemp(selectedEq.minTemp)} to {formatTemp(selectedEq.maxTemp)}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label>Item / Delivery Name</Label>
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Ocean Fresh seafood delivery" className="mt-1" />
              </div>
            )}

            {/* Previous fail notice — shown when selected equipment has an unresolved fail */}
            {prevFail && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Previous fail not yet rectified</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {formatTemp(prevFail.recordedTemp)} recorded on {fmtDT(prevFail.checkedAt)} by {prevFail.checkedBy}
                      {selectedEq && ` — safe range ${formatTemp(selectedEq.minTemp)} to ${formatTemp(selectedEq.maxTemp)}`}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-amber-800 uppercase tracking-wider">What corrective action was taken?</Label>
                  <Textarea
                    value={prevFailAction}
                    onChange={(e) => setPrevFailAction(e.target.value)}
                    placeholder="e.g. Adjusted thermostat, moved stock to backup fridge, called technician"
                    className="mt-1.5 min-h-[64px] border-amber-300 bg-white text-sm"
                  />
                  <p className="text-xs text-amber-700 mt-1">
                    Submitting this check will mark the previous fail as rectified.
                  </p>
                </div>
              </div>
            )}

            {/* Temperature */}
            <div>
              <Label>Recorded Temperature (°C)</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  value={recordedTemp}
                  onChange={(e) => setRecordedTemp(e.target.value)}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.5"
                  className="max-w-[160px]"
                />
                {predictedStatus === "pass" && (
                  <div className="flex items-center gap-1.5 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">PASS</span>
                  </div>
                )}
                {predictedStatus === "fail" && (
                  <div className="flex items-center gap-1.5 text-status-critical">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">FAIL — out of range</span>
                  </div>
                )}
              </div>
            </div>

            {/* Corrective action — shown when a fail is predicted */}
            {predictedStatus === "fail" && (
              <div className="bg-status-critical/5 border border-status-critical/20 rounded-lg p-4">
                <Label className="text-status-critical font-medium">Corrective Action Required</Label>
                <Textarea
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="What action did you take? e.g. Moved stock to backup fridge, called technician, notified manager"
                  className="mt-2 min-h-[70px] border-status-critical/30"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional observations" className="mt-1" />
            </div>

            {/* Checked by */}
            <div>
              <Label>Checked by</Label>
              <Input value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} placeholder="Your name" className="mt-1 max-w-[240px]" />
            </div>

            <Button onClick={handleSubmit} disabled={createLog.isPending} className="w-full sm:w-auto">
              {createLog.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Check
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* NSW Food Safety Guide */}
      <FoodSafetyPanel />
    </div>
  </div>
  );
}

// ─── Food Safety Info Panel ───────────────────────────────────────────────────

function FoodSafetyPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-blue-50 border-blue-200 h-fit">
      <CardHeader className="px-5 py-4 border-b border-blue-200 cursor-pointer" onClick={() => setExpanded((p) => !p)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            NSW Food Safety Guide
          </CardTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-5 space-y-4 text-sm text-blue-900">
          <div>
            <p className="font-bold mb-1">Temperature Requirements</p>
            <ul className="space-y-1 text-blue-800">
              <li>Chilled food: 5°C or below</li>
              <li>Frozen food: -15°C or below</li>
              <li>Hot food: 60°C or above</li>
              <li>Danger zone: 5°C – 60°C</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-1">2-Hour / 4-Hour Rule</p>
            <ul className="space-y-1 text-blue-800">
              <li>Under 2 hrs in danger zone: refrigerate or use immediately</li>
              <li>2 – 4 hrs: use immediately, do not refrigerate</li>
              <li>Over 4 hrs: discard</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-1">Delivery Checks</p>
            <p className="text-blue-800">Refuse delivery if chilled goods arrive above 5°C or frozen above -15°C. Document refusal and notify supplier.</p>
          </div>
          <div>
            <p className="font-bold mb-1">Record Keeping</p>
            <p className="text-blue-800">NSW Food Authority requires temperature logs to be kept for 3 years. Export CSV records monthly.</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

interface HistoryTabProps {
  venueId: number;
}

function HistoryTab({ venueId }: HistoryTabProps) {
  const { toast } = useToast();
  const [filterEquipmentId, setFilterEquipmentId] = useState<string>("all");
  const [filterLogType, setFilterLogType] = useState<string>("all");
  const [filterFailedOnly, setFilterFailedOnly] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [correctiveLog, setCorrectiveLog] = useState<TemperatureLog | null>(null);

  const { data: equipment = [] } = useListTemperatureEquipment(venueId, {
    query: { enabled: !!venueId, queryKey: getListTemperatureEquipmentQueryKey(venueId) },
  });

  const params = {
    ...(filterEquipmentId && filterEquipmentId !== "all" ? { equipmentId: parseInt(filterEquipmentId) } : {}),
    ...(filterLogType && filterLogType !== "all" ? { logType: filterLogType } : {}),
    ...(filterFailedOnly ? { failedOnly: "true" } : {}),
    ...(filterFrom ? { from: filterFrom } : {}),
    ...(filterTo ? { to: filterTo } : {}),
  };

  const queryKey = getListTemperatureLogsQueryKey(venueId, params);
  const { data: logs = [], isLoading } = useListTemperatureLogs(venueId, params, {
    query: { enabled: !!venueId, queryKey },
  });

  const eqMap = new Map(equipment.map((e) => [e.id, e]));

  const handleExport = () => {
    const qs = new URLSearchParams();
    if (filterEquipmentId && filterEquipmentId !== "all") qs.set("equipmentId", filterEquipmentId);
    if (filterLogType && filterLogType !== "all") qs.set("logType", filterLogType);
    if (filterFailedOnly) qs.set("failedOnly", "true");
    if (filterFrom) qs.set("from", filterFrom);
    if (filterTo) qs.set("to", filterTo);
    const url = `/api/venues/${venueId}/temperature/logs/export?${qs.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `temperature-logs.csv`;
    a.click();
    toast({ title: "Downloading CSV..." });
  };

  return (
    <div className="space-y-4">
      {/* Filters — 2-column grid on mobile, single row on desktop */}
      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:items-end">
            <div>
              <Label className="text-xs mb-1 block">Equipment</Label>
              <Select value={filterEquipmentId} onValueChange={setFilterEquipmentId}>
                <SelectTrigger className="h-8 text-sm w-full sm:w-[152px]"><SelectValue placeholder="All equipment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All equipment</SelectItem>
                  {equipment.map((eq) => <SelectItem key={eq.id} value={String(eq.id)}>{eq.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Type</Label>
              <Select value={filterLogType} onValueChange={setFilterLogType}>
                <SelectTrigger className="h-8 text-sm w-full sm:w-[148px]"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="equipment_check">Equipment</SelectItem>
                  <SelectItem value="delivery_check">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">From</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-8 text-sm w-full sm:w-[132px]" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">To</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-8 text-sm w-full sm:w-[132px]" />
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-3 sm:pb-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer touch-manipulation">
                <input type="checkbox" checked={filterFailedOnly} onChange={(e) => setFilterFailedOnly(e.target.checked)} className="rounded" />
                <span className="text-sm">Failed only</span>
              </label>
              <Button variant="outline" size="sm" className="h-8 sm:ml-auto" onClick={handleExport}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log list — card rows, no horizontal scroll */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 bg-secondary" />)}
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>No temperature checks found.</p>
            <p className="text-sm mt-1">Go to "Log Check" to record your first check.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card divide-y divide-border">
          {logs.map((log) => {
            const eq = log.equipmentId ? eqMap.get(log.equipmentId) : null;
            const isFail = log.status === "fail";
            const needsAction = isFail && !log.isResolved;
            return (
              <div
                key={log.id}
                className={cn("px-4 py-3 transition-colors", isFail ? "bg-status-critical/5" : "hover:bg-secondary/20")}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        {eq?.name ?? log.itemName ?? "—"}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0 py-0">
                        {log.logType === "delivery_check" ? "Delivery" : "Equipment"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtDT(log.checkedAt)} &bull; {log.checkedBy}
                    </p>
                    {isFail && log.correctiveAction && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                        Action: {log.correctiveAction}
                      </p>
                    )}
                  </div>

                  {/* Right: temp + result + action button */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn("text-base font-bold leading-none", isFail ? "text-status-critical" : "text-green-700")}>
                      {formatTemp(log.recordedTemp)}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {isFail ? (
                        <>
                          <Badge className="bg-status-critical/10 text-status-critical border-status-critical/30 text-xs py-0">FAIL</Badge>
                          {log.isResolved && (
                            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs py-0">rectified</Badge>
                          )}
                        </>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs py-0">PASS</Badge>
                      )}
                    </div>
                    {isFail && (
                      <Button
                        variant={needsAction ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-6 text-xs px-2 mt-0.5 touch-manipulation",
                          needsAction
                            ? "bg-status-critical text-white hover:bg-status-critical/90"
                            : "text-muted-foreground",
                        )}
                        onClick={() => setCorrectiveLog(log)}
                      >
                        {needsAction ? (
                          <><RefreshCw className="w-3 h-3 mr-1" />Add action</>
                        ) : (
                          <><Pencil className="w-3 h-3 mr-1" />Edit</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {correctiveLog && (
        <CorrectiveDialog
          open={!!correctiveLog}
          onClose={() => setCorrectiveLog(null)}
          venueId={venueId}
          log={correctiveLog}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "equipment" | "log" | "history";

export default function TemperaturePage() {
  const { activeVenueId } = useVenueStore();
  const { data: roleData, isLoading: roleLoading } = useVenueRole();
  const [tab, setTab] = useState<Tab>("log");

  const canManage = roleLoading ? true : (roleData?.isAdmin ?? false);

  if (!activeVenueId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Select a venue to view temperature logs.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "log", label: "Log Check" },
    { id: "equipment", label: "Equipment" },
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Thermometer className="w-7 h-7 text-primary" />
            Temperature Log
          </h1>
          <p className="text-muted-foreground mt-1">NSW food safety compliance — equipment and delivery checks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const url = `/api/venues/${activeVenueId}/temperature/logs/export`;
            const a = document.createElement("a"); a.href = url; a.download = "temperature-logs.csv"; a.click();
          }}>
            <Download className="w-4 h-4 mr-1.5" />
            Export All
          </Button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "equipment" && <EquipmentTab venueId={activeVenueId} isAdmin={canManage} />}
      {tab === "log" && <LogCheckTab venueId={activeVenueId} />}
      {tab === "history" && <HistoryTab venueId={activeVenueId} />}
    </div>
  );
}
