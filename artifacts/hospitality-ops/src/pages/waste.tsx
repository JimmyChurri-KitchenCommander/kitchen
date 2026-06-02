import { useVenueStore } from "@/stores/venueStore";
import { useListWasteLogs, useCreateWasteLog, useListInventory, useQuickAddPrepTask, getListWasteLogsQueryKey, getListInventoryQueryKey } from "@workspace/api-client-react";
import type { WastePrepSuggestion } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Trash2, TrendingDown, Loader2, Check, ChevronsUpDown, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COMMON_UNITS = ["kg", "g", "L", "mL", "each", "portion", "tray", "bunch", "bag"];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function WastePage() {
  const { activeVenueId } = useVenueStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [selectedInvId, setSelectedInvId] = useState<string>("custom");
  const [itemOpen, setItemOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [costImpact, setCostImpact] = useState("");
  const [reason, setReason] = useState<string>("spoilage");
  const [prepSuggestion, setPrepSuggestion] = useState<WastePrepSuggestion | null>(null);

  const quickAdd = useQuickAddPrepTask();

  const { data: logs, isLoading: isLoadingLogs } = useListWasteLogs(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListWasteLogsQueryKey(activeVenueId as number) } }
  );

  const { data: inventory } = useListInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListInventoryQueryKey(activeVenueId as number) } }
  );

  const createLog = useCreateWasteLog();

  const handleInventorySelect = (idStr: string) => {
    setSelectedInvId(idStr);
    if (idStr !== "custom" && inventory) {
      const item = inventory.find(i => i.id === parseInt(idStr));
      if (item) {
        setUnit(item.unit);
      }
    }
  };

  const handleQtyChange = (val: string) => {
    setQuantity(val);
    if (selectedInvId !== "custom" && inventory) {
      const item = inventory.find(i => i.id === parseInt(selectedInvId));
      if (item && val) {
        setCostImpact((parseFloat(val) * item.averageCost).toFixed(2));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVenueId) return;

    let itemName = customName;
    let invId = undefined;

    if (selectedInvId !== "custom") {
      const item = inventory?.find(i => i.id === parseInt(selectedInvId));
      if (item) {
        itemName = item.name;
        invId = item.id;
      }
    }

    if (!itemName || !quantity || !unit || !costImpact || !reason) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const wastedQty = parseFloat(quantity);
    const linkedItem = invId ? inventory?.find(i => i.id === invId) : undefined;

    createLog.mutate({
      venueId: activeVenueId,
      data: {
        inventoryItemId: invId,
        itemName,
        quantity: wastedQty,
        unit,
        costImpact: parseFloat(costImpact),
        reason: reason as any
      }
    }, {
      onSuccess: (data) => {
        if (data.prepSuggestion) {
          setPrepSuggestion(data.prepSuggestion);
          toast({ title: "Waste logged — stock below par" });
        } else {
          toast({ title: "Waste logged" });
        }
        setSelectedInvId("custom");
        setCustomName("");
        setQuantity("");
        setUnit("");
        setCostImpact("");
        setReason("spoilage");
        queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "waste"] });
        queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "dashboard"] });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  if (!activeVenueId) return <div className="text-center p-8">Select a venue first.</div>;

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const todayLogs = logs?.filter(l => new Date(l.loggedAt) >= todayStart) ?? [];
  const weekLogs = logs?.filter(l => new Date(l.loggedAt) >= weekStart) ?? [];
  const todayTotal = todayLogs.reduce((sum, l) => sum + l.costImpact, 0);
  const weekTotal = weekLogs.reduce((sum, l) => sum + l.costImpact, 0);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Trash2 className="w-8 h-8 text-primary" />
          Waste Log
        </h1>
        <p className="text-muted-foreground mt-1">Track spoilage and overproduction to protect margins.</p>
      </div>

      {/* Daily / Weekly cost summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Today's waste</p>
            <p className={cn("text-3xl font-black", todayTotal > 0 ? "text-status-critical" : "text-foreground")}>
              ${todayTotal.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{todayLogs.length} item{todayLogs.length !== 1 ? "s" : ""} logged</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">This week's waste</p>
            <p className={cn("text-3xl font-black", weekTotal > 0 ? "text-status-risk" : "text-foreground")}>
              ${weekTotal.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{weekLogs.length} item{weekLogs.length !== 1 ? "s" : ""} logged</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Log Form */}
        <Card className="lg:col-span-1 bg-card border-border h-fit">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg">Log New Waste</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Item</Label>
                <Popover open={itemOpen} onOpenChange={setItemOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={itemOpen}
                      className="w-full justify-between bg-background border-border font-normal h-10"
                    >
                      <span className="truncate">
                        {selectedInvId === "custom"
                          ? "Custom item"
                          : (inventory?.find(i => i.id.toString() === selectedInvId)?.name ?? "Select item")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search items..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="custom"
                            onSelect={() => { handleInventorySelect("custom"); setItemOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedInvId === "custom" ? "opacity-100" : "opacity-0")} />
                            Custom item
                          </CommandItem>
                          {inventory?.map(i => (
                            <CommandItem
                              key={i.id}
                              value={`${i.name} ${i.unit}`}
                              onSelect={() => { handleInventorySelect(i.id.toString()); setItemOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedInvId === i.id.toString() ? "opacity-100" : "opacity-0")} />
                              <span className="flex-1">{i.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{i.unit} · ${i.averageCost.toFixed(2)}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedInvId === "custom" && (
                <div className="space-y-2">
                  <Label className="text-foreground">Item Name</Label>
                  <Input 
                    value={customName} onChange={e => setCustomName(e.target.value)} 
                    placeholder="e.g. Broken Plates, Dropped Steak"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Quantity</Label>
                  <Input 
                    type="number" step="0.01" value={quantity} onChange={e => handleQtyChange(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Unit</Label>
                  <Input 
                    value={unit} onChange={e => setUnit(e.target.value)}
                    placeholder="kg, L, each..."
                    className="bg-background border-border text-foreground"
                  />
                  {/* Quick-select unit buttons */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {COMMON_UNITS.filter(u => u !== unit).slice(0, 5).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className="text-[11px] px-2 py-0.5 rounded border border-border bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Cost Impact ($)</Label>
                <Input 
                  type="number" step="0.01" value={costImpact} onChange={e => setCostImpact(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
                {selectedInvId !== "custom" && quantity && inventory && (
                  <p className="text-xs text-muted-foreground">
                    Auto-computed from unit cost — adjust if needed
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spoilage">Spoilage</SelectItem>
                    <SelectItem value="overproduction">Overproduction</SelectItem>
                    <SelectItem value="dropped">Dropped / Accident</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="trimming">Excess Trimming</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 mt-2" disabled={createLog.isPending}>
                {createLog.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Log Waste
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Prep suggestion — shown when waste drops stock below par */}
        {prepSuggestion && (
          <Card className="lg:col-span-1 bg-amber-950/20 dark:bg-amber-950/30 border-amber-600/40 h-fit">
            <CardContent className="p-4">
              <p className="text-sm font-bold text-amber-200 mb-1">Stock below par</p>
              <p className="text-sm text-amber-100/80 mb-3">
                {prepSuggestion.itemName} is at{" "}
                <span className="font-semibold">{prepSuggestion.currentStock.toFixed(1)}</span>
                {" "}— par is <span className="font-semibold">{prepSuggestion.parLevel.toFixed(1)}</span>.
                {prepSuggestion.libraryTaskTitle
                  ? ` Add "${prepSuggestion.libraryTaskTitle}" to today's prep?`
                  : " Add a prep task now?"}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-8 text-xs"
                  disabled={quickAdd.isPending}
                  onClick={() => {
                    if (!activeVenueId) return;
                    quickAdd.mutate(
                      {
                        venueId: activeVenueId,
                        data: {
                          title: prepSuggestion.libraryTaskTitle ?? `Restock ${prepSuggestion.itemName}`,
                        },
                      },
                      {
                        onSuccess: () => {
                          toast({ title: "Prep task added to today's board" });
                          setPrepSuggestion(null);
                        },
                      }
                    );
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add prep task
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-amber-600/40 text-amber-200 hover:bg-amber-950/40"
                  onClick={() => {
                    if (activeVenueId && prepSuggestion.libraryTaskId) {
                      localStorage.setItem(
                        `kc-prep-reminder-${activeVenueId}-${prepSuggestion.libraryTaskId}`,
                        JSON.stringify({ ...prepSuggestion, remindedAt: Date.now() })
                      );
                    }
                    toast({ title: "Reminder set — check prep board before service" });
                    setPrepSuggestion(null);
                  }}
                >
                  Remind later
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-amber-300/60 hover:text-amber-200"
                  onClick={() => setPrepSuggestion(null)}
                >
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Log */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg">Recent Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingLogs ? (
              <div className="p-5 space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full bg-secondary" />)}
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="w-6 h-6 text-muted-foreground" />
                </div>
                <p>No waste logged yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map(log => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground">{log.itemName}</span>
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded capitalize">
                          {log.reason}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.quantity} {log.unit} • {new Date(log.loggedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-status-critical">-${log.costImpact.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
