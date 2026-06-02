import { useState } from "react";
import { useVenueStore } from "@/stores/venueStore";
import {
  useGetSuggestedOrders,
  useCreatePurchaseOrder,
  useListPurchaseOrders,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  getGetSuggestedOrdersQueryKey,
  getListPurchaseOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, AlertTriangle, Package, Clock, CheckCircle, XCircle, Truck, Save, Loader2, FileText, Send, Trash2, ReceiptText, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScatteredSketches, OrderPageHeader } from "@/components/SketchIllustrations";

type PurchaseOrderRow = {
  id: number;
  supplierName: string;
  status: "draft" | "sent" | "received" | "cancelled";
  totalEstimatedCost: number;
  createdAt: string;
  sentAt: string | null;
  receivedAt: string | null;
  notes: string | null;
};

function poStatusBadge(status: string) {
  switch (status) {
    case "draft": return <Badge variant="outline" className="text-xs border-border text-muted-foreground">Draft</Badge>;
    case "sent": return <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">Sent</Badge>;
    case "received": return <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">Received</Badge>;
    case "cancelled": return <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Cancelled</Badge>;
    default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function PurchaseOrdersTab({ venueId }: { venueId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [actionId, setActionId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useListPurchaseOrders(venueId, {
    query: { enabled: !!venueId, queryKey: getListPurchaseOrdersQueryKey(venueId) },
  });

  const updatePO = useUpdatePurchaseOrder({
    mutation: {
      onSuccess: (_d, vars) => {
        queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey(venueId) });
        const statusLabel = (vars.data as any).status === "sent" ? "marked as sent" : "marked as received";
        toast({ title: `Order ${statusLabel}` });
        setActionId(null);
      },
      onError: () => { toast({ title: "Could not update order", variant: "destructive" }); setActionId(null); },
    },
  });

  const deletePO = useDeletePurchaseOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey(venueId) });
        toast({ title: "Order deleted" });
        setActionId(null);
      },
      onError: () => { toast({ title: "Could not delete order", variant: "destructive" }); setActionId(null); },
    },
  });

  const handleMarkSent = (po: PurchaseOrderRow) => {
    setActionId(po.id);
    updatePO.mutate({ venueId, orderId: po.id, data: { status: "sent" } as any });
  };

  const handleMarkReceived = (po: PurchaseOrderRow) => {
    setActionId(po.id);
    updatePO.mutate({ venueId, orderId: po.id, data: { status: "received" } as any });
  };

  const handleDelete = (po: PurchaseOrderRow) => {
    setActionId(po.id);
    deletePO.mutate({ venueId, orderId: po.id });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full bg-card" />)}
      </div>
    );
  }

  if (!orders || (orders as PurchaseOrderRow[]).length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No purchase orders yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Save suggested orders as POs from the Suggested Orders tab. They'll appear here once created.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedOrders = [...(orders as PurchaseOrderRow[])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedOrders.map(po => {
        const isActing = actionId === po.id && (updatePO.isPending || deletePO.isPending);
        return (
          <Card key={po.id} className="bg-card border-border">
            <CardContent className="px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Truck className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground text-sm">{po.supplierName}</span>
                    {poStatusBadge(po.status)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Created {new Date(po.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</div>
                    {po.sentAt && <div>Sent {new Date(po.sentAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>}
                    {po.receivedAt && <div>Received {new Date(po.receivedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>}
                    {po.notes && <div className="italic text-muted-foreground/70 mt-1">{po.notes}</div>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Est. Total</div>
                    <div className="text-xl font-bold text-foreground">${po.totalEstimatedCost.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {po.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        onClick={() => handleMarkSent(po)}
                        disabled={isActing}
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                        Mark Sent
                      </Button>
                    )}
                    {po.status === "sent" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                        onClick={() => handleMarkReceived(po)}
                        disabled={isActing}
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5 mr-1" />}
                        Mark Received
                      </Button>
                    )}
                    {(po.status === "draft" || po.status === "cancelled") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(po)}
                        disabled={isActing}
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

type SuggestedOrderItem = {
  itemId: number;
  itemName: string;
  unit: string;
  currentStock: number;
  parLevel: number;
  suggestedQty: number;
  estimatedCost: number;
  averageCost: number;
  status: string;
};

type SuggestedOrderGroup = {
  supplierId: number | null;
  supplierName: string;
  deliveryDays: string | null;
  orderCutoffTime: string | null;
  minimumOrderValue: number | null;
  items: SuggestedOrderItem[];
  subtotal: number;
  meetsMinimum: boolean | null;
};

function statusLabel(status: string) {
  switch (status) {
    case "critical": return "Critical";
    case "low_stock": return "Low";
    case "expiry_risk": return "Expiry Risk";
    case "stagnant": return "Stagnant";
    default: return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "critical": return "bg-red-100 text-red-700 border-red-200";
    case "low_stock": return "bg-orange-100 text-orange-700 border-orange-200";
    case "expiry_risk": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "stagnant": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default: return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SupplierCard({
  group,
  overrides,
  onQtyChange,
  onSaveAsPO,
  isSaving,
}: {
  group: SuggestedOrderGroup;
  overrides: Record<number, number>;
  onQtyChange: (itemId: number, qty: number) => void;
  onSaveAsPO: (group: SuggestedOrderGroup) => void;
  isSaving: boolean;
}) {
  const computedSubtotal = group.items.reduce((sum, item) => {
    const qty = overrides[item.itemId] ?? item.suggestedQty;
    return sum + qty * item.averageCost;
  }, 0);

  const meetsMin =
    group.minimumOrderValue != null
      ? computedSubtotal >= group.minimumOrderValue
      : null;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground text-base truncate">
                {group.supplierName}
              </span>
              {group.supplierId === null && (
                <Badge variant="outline" className="text-xs text-muted-foreground">No supplier linked</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {group.deliveryDays && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Delivers: {group.deliveryDays}
                </span>
              )}
              {group.orderCutoffTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Cutoff: {group.orderCutoffTime}
                </span>
              )}
              {group.minimumOrderValue != null && (
                <span className={cn(
                  "flex items-center gap-1 font-medium",
                  meetsMin ? "text-green-600" : "text-orange-600"
                )}>
                  {meetsMin
                    ? <CheckCircle className="w-3 h-3" />
                    : <XCircle className="w-3 h-3" />
                  }
                  Min. order ${fmt(group.minimumOrderValue)}
                  {!meetsMin && (
                    <span className="font-normal text-muted-foreground ml-1">
                      (${fmt(group.minimumOrderValue - computedSubtotal)} short)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="text-xl font-bold text-foreground tracking-tight">
                ${fmt(computedSubtotal)}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-8"
              onClick={() => onSaveAsPO(group)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save as PO
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {group.items.map((item) => {
            const qty = overrides[item.itemId] ?? item.suggestedQty;
            const lineCost = qty * item.averageCost;
            return (
              <div key={item.itemId} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground truncate">{item.itemName}</span>
                    <Badge variant="outline" className={cn("text-xs border", statusColor(item.status))}>
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Have {item.currentStock} {item.unit} · Par {item.parLevel} {item.unit} · ${fmt(item.averageCost)}/{item.unit}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={qty}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) onQtyChange(item.itemId, val);
                      }}
                      className="w-20 h-8 text-sm text-right bg-background border-border"
                    />
                    <span className="text-xs text-muted-foreground w-8">{item.unit}</span>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-semibold text-foreground">${fmt(lineCost)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuggestedOrdersPage() {
  const { activeVenueId } = useVenueStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [qtyOverrides, setQtyOverrides] = useState<Record<number, number>>({});
  const [savingGroupId, setSavingGroupId] = useState<number | "unassigned" | null>(null);

  const { data, isLoading, refetch } = useGetSuggestedOrders(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getGetSuggestedOrdersQueryKey(activeVenueId as number) } }
  );

  const createPO = useCreatePurchaseOrder({
    mutation: {
      onSuccess: (_data, variables) => {
        toast({ title: "Purchase order saved", description: `PO created for ${(variables.data as any).supplierName ?? "supplier"}` });
        setSavingGroupId(null);
        queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey(activeVenueId as number) });
      },
      onError: () => {
        toast({ title: "Failed to create PO", variant: "destructive" });
        setSavingGroupId(null);
      },
    },
  });

  const handleQtyChange = (itemId: number, qty: number) => {
    setQtyOverrides((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleSaveAsPO = (group: SuggestedOrderGroup) => {
    if (!activeVenueId) return;
    const groupKey = group.supplierId ?? "unassigned";
    setSavingGroupId(groupKey);
    const items = group.items.map((item) => ({
      inventoryItemId: item.itemId,
      name: item.itemName,
      quantity: String(qtyOverrides[item.itemId] ?? item.suggestedQty),
      unit: item.unit,
      estimatedCost: String((qtyOverrides[item.itemId] ?? item.suggestedQty) * item.averageCost),
    }));
    createPO.mutate({
      venueId: activeVenueId,
      data: {
        supplierId: group.supplierId ?? undefined,
        supplierName: group.supplierName,
        status: "draft",
        items,
      } as any,
    });
    void queryClient;
  };

  const computedGrandTotal = data?.groups.reduce((sum, group) => {
    return sum + group.items.reduce((s, item) => {
      const qty = qtyOverrides[item.itemId] ?? item.suggestedQty;
      return s + qty * (item.averageCost ?? 0);
    }, 0);
  }, 0) ?? 0;

  if (!activeVenueId) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No Venue Selected</h2>
        <p className="text-muted-foreground mb-8">
          Please create or select a venue to generate suggested orders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative">
      <ScatteredSketches />

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-primary" />
              Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              Suggested restocks and purchase order management.
            </p>
          </div>
        </div>
        <OrderPageHeader className="mt-3 opacity-80" />
      </div>

      <Tabs defaultValue="suggested" className="relative z-10">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="suggested" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <Package className="w-4 h-4" />
            Suggested Orders
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <ReceiptText className="w-4 h-4" />
            Purchase Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setQtyOverrides({}); refetch(); }}
            >
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full bg-card" />
              ))}
            </div>
          ) : !data || data.groups.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">You're all stocked up</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Nothing is below par level right now. Check back after service.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Items to Order</div>
                    <div className="text-2xl font-bold text-foreground">{data.totalItems}</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Suppliers</div>
                    <div className="text-2xl font-bold text-foreground">{data.groups.length}</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20 col-span-2 sm:col-span-1">
                  <CardContent className="px-4 py-3">
                    <div className="text-xs text-muted-foreground mb-1">Est. Total Cost</div>
                    <div className="text-2xl font-bold text-primary">${fmt(computedGrandTotal)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Supplier groups */}
              <div className="space-y-4">
                {data.groups.map((group, idx) => (
                  <SupplierCard
                    key={group.supplierId ?? `unassigned-${idx}`}
                    group={group as SuggestedOrderGroup}
                    overrides={qtyOverrides}
                    onQtyChange={handleQtyChange}
                    onSaveAsPO={handleSaveAsPO}
                    isSaving={savingGroupId === (group.supplierId ?? "unassigned") && createPO.isPending}
                  />
                ))}
              </div>

              {/* Grand total footer */}
              <div className="sticky bottom-4 mt-4">
                <Card className="bg-primary text-primary-foreground border-primary shadow-lg">
                  <CardContent className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium opacity-80">Grand Total</div>
                      <div className="text-xs opacity-70">{data.totalItems} items across {data.groups.length} supplier{data.groups.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="text-3xl font-bold tracking-tight">
                      ${fmt(computedGrandTotal)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="purchase-orders" className="mt-4">
          <PurchaseOrdersTab venueId={activeVenueId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
