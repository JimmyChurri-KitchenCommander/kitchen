import { useState, useEffect } from "react";
import { useVenueStore } from "@/stores/venueStore";
import {
  useListPrepTasks,
  useListHandoverNotes,
  useCreateHandoverNote,
  useUpdateHandoverNote,
  useDeleteHandoverNote,
  useUpdateInventoryItem,
  getListPrepTasksQueryKey,
  getListHandoverNotesQueryKey,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Zap, AlertTriangle, CheckCircle2, Circle, Thermometer, Trash2,
  StickyNote, Pin, PinOff, Plus, Loader2, ChevronDown, ChevronUp,
  RefreshCw, Package, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ServiceConfig = {
  inventory: Array<{
    id: number; name: string; unit: string;
    parLevel: string | null; currentStock: string | null; averageCost: string | null;
  }>;
  equipment: Array<{
    id: number; name: string; minTemp: string | null; maxTemp: string | null;
  }>;
  staff: Array<{ id: number; name: string; role: string }>;
};

const WASTE_REASONS = [
  { value: "spoilage", label: "Spoilage" },
  { value: "overproduction", label: "Overproduction" },
  { value: "dropped", label: "Dropped" },
  { value: "trimming", label: "Trimming waste" },
  { value: "other", label: "Other" },
];

const SHIFTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

// ─── Section: Low Stock Strip ─────────────────────────────────────────────────
function LowStockStrip({ inventory }: { inventory: ServiceConfig["inventory"] }) {
  const lowItems = inventory.filter((item) => {
    if (!item.parLevel || !item.currentStock) return false;
    return parseFloat(item.currentStock) < parseFloat(item.parLevel);
  });

  if (lowItems.length === 0) return null;

  return (
    <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          Below Par Right Now ({lowItems.length} item{lowItems.length !== 1 ? "s" : ""})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {lowItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-2.5 py-1.5 text-xs"
            >
              <Package className="w-3 h-3 text-orange-500 shrink-0" />
              <span className="font-semibold text-orange-800 dark:text-orange-300">{item.name}</span>
              <span className="text-orange-600 dark:text-orange-400">
                {parseFloat(item.currentStock ?? "0").toFixed(1)} / {parseFloat(item.parLevel ?? "0").toFixed(1)} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section: Prep Tasks ──────────────────────────────────────────────────────
function PrepTasksSection({
  venueId, staffName,
}: { venueId: number; staffName: string }) {
  const TODAY = new Date().toISOString().slice(0, 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useListPrepTasks(
    venueId, { date: TODAY },
    { query: { queryKey: getListPrepTasksQueryKey(venueId, { date: TODAY }) } }
  );

  const toggleMutation = useMutation({
    mutationFn: async ({ taskId, undo, completedBy }: { taskId: number; undo: boolean; completedBy: string }) => {
      const resp = await fetch(`/api/venues/${venueId}/service/prep-tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedBy, undo }),
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListPrepTasksQueryKey(venueId, { date: TODAY }) });
    },
    onError: () => toast({ title: "Failed to update task", variant: "destructive" }),
  });

  const priorityTasks = [...tasks].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[String(a.priority)] ?? 2) - (order[String(b.priority)] ?? 2);
  });

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  if (priorityTasks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No prep tasks for today.
      </div>
    );
  }

  const done = priorityTasks.filter(t => t.status === "done").length;
  const total = priorityTasks.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{done}/{total} complete</span>
        <div className="w-32 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>
      {priorityTasks.map((task) => {
        const isDone = task.status === "done";
        const isInProgress = task.status === "in_progress";
        return (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
              isDone
                ? "bg-secondary/30 border-border/50 opacity-70"
                : "bg-card border-border hover:bg-secondary/20"
            )}
          >
            <button
              className="shrink-0"
              onClick={() =>
                toggleMutation.mutate({
                  taskId: task.id, undo: isDone, completedBy: staffName || "Service",
                })
              }
              disabled={toggleMutation.isPending}
            >
              {isDone
                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                : <Circle className={cn("w-5 h-5", isInProgress ? "text-amber-500" : "text-muted-foreground")} />
              }
            </button>
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm font-semibold", isDone ? "line-through text-muted-foreground" : "text-foreground")}>
                {task.title}
              </div>
              {task.description && (
                <div className="text-xs text-muted-foreground truncate">{task.description}</div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {task.shift && (
                <Badge variant="outline" className="text-xs capitalize">{task.shift}</Badge>
              )}
              {(task.priority as string) === "critical" && (
                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Critical</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Quick Temp Log ──────────────────────────────────────────────────
function TempLogSection({ venueId, equipment }: { venueId: number; equipment: ServiceConfig["equipment"] }) {
  const [equipId, setEquipId] = useState<string>("");
  const [tempValue, setTempValue] = useState("");
  const [checkedBy, setCheckedBy] = useState("");
  const [lastResult, setLastResult] = useState<{ status: string; itemName?: string } | null>(null);
  const { toast } = useToast();

  const logMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`/api/venues/${venueId}/service/temperature-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: equipId ? parseInt(equipId) : undefined,
          temp: tempValue,
          checkedBy: checkedBy || "Service",
        }),
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    onSuccess: (data) => {
      const equip = equipment.find(e => e.id === parseInt(equipId));
      setLastResult({ status: data.status, itemName: equip?.name });
      if (data.status === "pass") {
        toast({ title: "Temperature logged — pass" });
      } else {
        toast({ title: "Temperature fail — action required", variant: "destructive" });
      }
      setTempValue(""); setEquipId("");
    },
    onError: () => toast({ title: "Failed to log temperature", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      {lastResult && (
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
          lastResult.status === "pass"
            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
            : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
        )}>
          {lastResult.status === "pass"
            ? <CheckCircle2 className="w-4 h-4" />
            : <AlertTriangle className="w-4 h-4" />
          }
          {lastResult.itemName} — {lastResult.status === "pass" ? "Pass" : "FAIL — action required"}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Equipment</Label>
          <Select value={equipId} onValueChange={setEquipId}>
            <SelectTrigger className="bg-background border-border h-9 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {equipment.map(e => (
                <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Temp (°C)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g. 4.2"
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Checked by</Label>
        <Input
          placeholder="Your name"
          value={checkedBy}
          onChange={e => setCheckedBy(e.target.value)}
          className="bg-background border-border h-9 text-sm"
        />
      </div>
      <Button
        className="w-full"
        size="sm"
        onClick={() => logMutation.mutate()}
        disabled={!tempValue || logMutation.isPending}
      >
        {logMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Thermometer className="w-4 h-4 mr-2" />}
        Log Temperature
      </Button>
    </div>
  );
}

// ─── Section: Quick Waste Log ─────────────────────────────────────────────────
function WasteLogSection({
  venueId, staffName, inventory,
}: { venueId: number; staffName: string; inventory: ServiceConfig["inventory"] }) {
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [reason, setReason] = useState("spoilage");
  const [lastResult, setLastResult] = useState<{ parCheck?: { belowPar: boolean; projectedStock: string; parLevel: string; itemName: string } } | null>(null);
  const { toast } = useToast();

  const filteredInv = itemSearch.length > 1
    ? inventory.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 6)
    : [];

  const selectItem = (item: ServiceConfig["inventory"][0]) => {
    setSelectedItemId(item.id);
    setItemName(item.name);
    setUnit(item.unit);
    setItemSearch("");
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`/api/venues/${venueId}/service/waste-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: selectedItemId ?? undefined,
          itemName: itemName.trim(),
          quantity,
          unit,
          reason,
          loggedBy: staffName || "Service",
        }),
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast({ title: "Waste logged" });
      setItemName(""); setQuantity(""); setUnit(""); setSelectedItemId(null); setItemSearch("");
    },
    onError: () => toast({ title: "Failed to log waste", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      {lastResult?.parCheck && lastResult.parCheck.belowPar && (
        <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 px-3 py-2 text-xs">
          <span className="font-bold text-orange-700 dark:text-orange-400">Heads up:</span>
          <span className="text-orange-600 dark:text-orange-500 ml-1">
            {lastResult.parCheck.itemName} is now at {lastResult.parCheck.projectedStock} — below par of {lastResult.parCheck.parLevel}
          </span>
        </div>
      )}

      {/* Item search / free text */}
      <div className="space-y-1.5 relative">
        <Label className="text-xs text-muted-foreground">Item name</Label>
        <Input
          placeholder="Search inventory or type free text..."
          value={selectedItemId ? itemName : itemSearch}
          onChange={e => {
            if (selectedItemId) {
              setSelectedItemId(null);
              setItemName("");
              setItemSearch(e.target.value);
            } else {
              setItemSearch(e.target.value);
              setItemName(e.target.value);
            }
          }}
          className="bg-background border-border h-9 text-sm"
        />
        {filteredInv.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
            {filteredInv.map(item => (
              <button
                key={item.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 text-left"
                onClick={() => selectItem(item)}
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground text-xs ml-auto">{item.unit}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quantity</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Unit</Label>
          <Input
            placeholder="kg, L, ptn..."
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="bg-background border-border h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WASTE_REASONS.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        size="sm"
        onClick={() => logMutation.mutate()}
        disabled={!itemName || !quantity || !unit || logMutation.isPending}
      >
        {logMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
        Log Waste
      </Button>
    </div>
  );
}

// ─── Section: Handover Notes ──────────────────────────────────────────────────
function HandoverNotesSection({ venueId, staffName }: { venueId: number; staffName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newContent, setNewContent] = useState("");
  const [newShift, setNewShift] = useState("evening");
  const [isAdding, setIsAdding] = useState(false);

  const { data: notes = [], isLoading } = useListHandoverNotes(venueId, { limit: 20 }, {
    query: { queryKey: getListHandoverNotesQueryKey(venueId) },
  });

  const createMutation = useCreateHandoverNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHandoverNotesQueryKey(venueId) });
        toast({ title: "Note added" });
        setNewContent(""); setIsAdding(false);
      },
      onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
    },
  });

  const pinMutation = useUpdateHandoverNote({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListHandoverNotesQueryKey(venueId) }),
    },
  });

  const deleteMutation = useDeleteHandoverNote({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListHandoverNotesQueryKey(venueId) }),
    },
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {/* Notes list */}
      {notes.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-2">No notes yet. Write one to start the handover chain.</p>
      )}
      {notes.map((note) => (
        <div
          key={note.id}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            note.isPinned
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
              : "bg-card border-border"
          )}
        >
          <div className="flex items-start gap-2">
            {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{formatTime(note.createdAt)}</span>
                {note.createdBy && <span className="text-xs text-muted-foreground">— {note.createdBy}</span>}
                {note.shift && <Badge variant="outline" className="text-xs capitalize">{note.shift}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                title={note.isPinned ? "Unpin" : "Pin"}
                onClick={() => pinMutation.mutate({ venueId, noteId: note.id, data: { isPinned: !note.isPinned } })}
              >
                {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
              <button
                className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate({ venueId, noteId: note.id })}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add note form */}
      {isAdding ? (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <Textarea
            placeholder="What does the next shift need to know?"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            className="bg-background border-border text-sm min-h-20 resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Select value={newShift} onValueChange={setNewShift}>
              <SelectTrigger className="bg-background border-border h-8 text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewContent(""); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate({
                venueId,
                data: { content: newContent, shift: newShift, createdBy: staffName || undefined },
              })}
              disabled={!newContent.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Save note
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add handover note
        </Button>
      )}
    </div>
  );
}

// ─── Section: Stock Adjustment ────────────────────────────────────────────────
function StockAdjSection({ venueId, inventory }: { venueId: number; inventory: ServiceConfig["inventory"] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [adjustments, setAdjustments] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const updateMutation = useUpdateInventoryItem({
    mutation: {
      onSuccess: (_data, vars) => {
        setSaving(null);
        setAdjustments(prev => { const next = { ...prev }; delete next[vars.itemId]; return next; });
        toast({ title: "Stock updated" });
        queryClient.invalidateQueries({ queryKey: ["service-config", venueId] });
      },
      onError: () => { setSaving(null); toast({ title: "Could not update stock", variant: "destructive" }); },
    },
  });

  const filtered = inventory
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 15);

  return (
    <div className="space-y-3 pt-3">
      <Input
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-8 text-sm"
      />
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">No items match.</p>
      )}
      <div className="divide-y divide-border -mx-4">
        {filtered.map(item => {
          const current = parseFloat(item.currentStock ?? "0");
          const rawDelta = adjustments[item.id];
          const delta = rawDelta !== undefined && rawDelta !== "" ? parseFloat(rawDelta) : 0;
          const next = Math.max(0, current + delta);
          const isDirty = rawDelta !== undefined && rawDelta !== "" && delta !== 0;
          return (
            <div key={item.id} className="px-4 py-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {current} {item.unit}
                  {isDirty && (
                    <span className={cn("ml-1.5 font-semibold", delta > 0 ? "text-status-healthy" : "text-status-low")}>
                      {delta > 0 ? "+" : ""}{delta} {"\u2192"} {next} {item.unit}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => setAdjustments(prev => ({ ...prev, [item.id]: String((parseFloat(prev[item.id] ?? "0") || 0) - 1) }))}>
                  <span className="text-base leading-none">-</span>
                </Button>
                <Input
                  type="number"
                  value={adjustments[item.id] ?? ""}
                  onChange={e => setAdjustments(prev => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="0"
                  className="h-7 w-14 text-center text-sm px-1"
                />
                <Button type="button" variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => setAdjustments(prev => ({ ...prev, [item.id]: String((parseFloat(prev[item.id] ?? "0") || 0) + 1) }))}>
                  <span className="text-base leading-none">+</span>
                </Button>
                <Button type="button" size="sm" className="h-7 text-xs ml-1 px-3"
                  disabled={!isDirty || saving === item.id}
                  onClick={() => {
                    setSaving(item.id);
                    updateMutation.mutate({ venueId, itemId: item.id, data: { currentStock: String(next) } as any });
                  }}>
                  {saving === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Collapsible section wrapper ──────────────────────────────────────────────
function Section({
  title, icon: Icon, iconClass, defaultOpen = true, badge, children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="bg-card border-border">
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <Icon className={cn("w-4 h-4 shrink-0", iconClass)} />
        <span className="font-semibold text-sm text-foreground flex-1">{title}</span>
        {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <CardContent className="px-4 pb-4 pt-0 border-t border-border/50">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceModePage() {
  const { activeVenueId } = useVenueStore();
  const { toast } = useToast();
  const [staffName, setStaffName] = useState(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem("kc-service-staff") ?? "" : ""
  );

  useEffect(() => {
    localStorage.setItem("kc-service-staff", staffName);
  }, [staffName]);

  const { data: config, isLoading: isLoadingConfig, refetch } = useQuery<ServiceConfig>({
    queryKey: ["service-config", activeVenueId],
    queryFn: async () => {
      const resp = await fetch(`/api/venues/${activeVenueId}/service/config`);
      if (!resp.ok) throw new Error("Failed to load service config");
      return resp.json();
    },
    enabled: !!activeVenueId,
    staleTime: 60_000,
  });

  if (!activeVenueId) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <Zap className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No Venue Selected</h2>
        <p className="text-muted-foreground text-sm">Select a venue to start Service Mode.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Service Mode</h1>
            <p className="text-xs text-muted-foreground">Real-time kitchen log</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 h-9">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="text-sm bg-transparent text-foreground outline-none w-28 placeholder:text-muted-foreground/50"
              placeholder="Your name"
              value={staffName}
              onChange={e => setStaffName(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => refetch()} title="Refresh">
            <RefreshCw className={cn("w-4 h-4", isLoadingConfig && "animate-spin")} />
          </Button>
        </div>
      </div>

      {isLoadingConfig ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Low stock strip — always visible, not collapsible */}
          {config && <LowStockStrip inventory={config.inventory} />}

          {/* Prep Tasks */}
          <Section title="Prep Tasks" icon={CheckCircle2} iconClass="text-green-500" defaultOpen>
            <div className="pt-3">
              <PrepTasksSection venueId={activeVenueId} staffName={staffName} />
            </div>
          </Section>

          {/* Temperature Log */}
          {config && config.equipment.length > 0 && (
            <Section title="Temperature Check" icon={Thermometer} iconClass="text-blue-500" defaultOpen={false}>
              <div className="pt-3">
                <TempLogSection venueId={activeVenueId} equipment={config.equipment} />
              </div>
            </Section>
          )}

          {/* Stock Adjustment */}
          {config && config.inventory.length > 0 && (
            <Section title="Stock +/-" icon={Package} iconClass="text-purple-500" defaultOpen={false}>
              <StockAdjSection venueId={activeVenueId} inventory={config.inventory} />
            </Section>
          )}

          {/* Quick Waste */}
          <Section title="Log Waste" icon={Trash2} iconClass="text-red-500" defaultOpen={false}>
            <div className="pt-3">
              {config && (
                <WasteLogSection
                  venueId={activeVenueId}
                  staffName={staffName}
                  inventory={config.inventory}
                />
              )}
            </div>
          </Section>

          {/* Handover Notes */}
          <Section title="Handover Notes" icon={StickyNote} iconClass="text-amber-500" defaultOpen>
            <div className="pt-3">
              <HandoverNotesSection venueId={activeVenueId} staffName={staffName} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
