import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import {
  useListInventory,
  useListArchivedInventory,
  useListInactiveInventory,
  useArchiveInventoryItem,
  useRestoreInventoryItem,
  useDeactivateInventoryItem,
  useReactivateInventoryItem,
  useUpdateInventoryItem,
  useListSuppliers,
  getListInventoryQueryKey,
  getListArchivedInventoryQueryKey,
  getListInactiveInventoryQueryKey,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Package, Plus, Search, AlertTriangle, Archive, ArchiveRestore, DollarSign, EyeOff, Eye, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tab = "active" | "inactive" | "archived";

export default function InventoryPage() {
  const { activeVenueId } = useVenueStore();
  const { data: roleData } = useVenueRole();
  const canManage = roleData?.canManage ?? true;
  const search = useSearch();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("active");
  const [sortBy, setSortBy] = useState<"status" | "name" | "stock" | "cost">("status");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const s = params.get("status");
    if (s) setStatusFilter(s);
  }, [search]);

  const { data: inventory, isLoading } = useListInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId && tab === "active", queryKey: getListInventoryQueryKey(activeVenueId as number) } }
  );

  const { data: archivedInventory, isLoading: isLoadingArchived } = useListArchivedInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId && tab === "archived", queryKey: getListArchivedInventoryQueryKey(activeVenueId as number) } }
  );

  const { data: inactiveInventory, isLoading: isLoadingInactive } = useListInactiveInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId && tab === "inactive", queryKey: getListInactiveInventoryQueryKey(activeVenueId as number) } }
  );

  const { data: suppliers = [] } = useListSuppliers(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListSuppliersQueryKey(activeVenueId as number) } }
  );
  const supplierById = new Map(suppliers.map(s => [s.id, s.name]));

  const archiveMutation = useArchiveInventoryItem();
  const restoreMutation = useRestoreInventoryItem();
  const deactivateMutation = useDeactivateInventoryItem();
  const reactivateMutation = useReactivateInventoryItem();
  const updateStockMutation = useUpdateInventoryItem();
  const [archiveTarget, setArchiveTarget] = useState<{ id: number; name: string } | null>(null);
  const [stockBumping, setStockBumping] = useState<Set<number>>(new Set());

  const handleStockBump = (item: { id: number; name: string; currentStock: number; unit: string; [key: string]: unknown }, delta: number) => {
    if (!activeVenueId || stockBumping.has(item.id)) return;
    const newStock = Math.max(0, item.currentStock + delta);
    setStockBumping(prev => new Set(prev).add(item.id));
    updateStockMutation.mutate(
      { venueId: activeVenueId, itemId: item.id, data: { currentStock: newStock } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
          setStockBumping(prev => { const n = new Set(prev); n.delete(item.id); return n; });
        },
        onError: () => {
          toast({ title: "Could not update stock", variant: "destructive" });
          setStockBumping(prev => { const n = new Set(prev); n.delete(item.id); return n; });
        },
      }
    );
  };

  const handleArchive = (itemId: number, itemName: string) => {
    setArchiveTarget({ id: itemId, name: itemName });
  };

  const confirmArchive = () => {
    if (!activeVenueId || !archiveTarget) return;
    archiveMutation.mutate(
      { venueId: activeVenueId, itemId: archiveTarget.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
          queryClient.invalidateQueries({ queryKey: getListArchivedInventoryQueryKey(activeVenueId) });
          queryClient.invalidateQueries({ queryKey: getListInactiveInventoryQueryKey(activeVenueId) });
          toast({ title: "Archived", description: `${archiveTarget.name} moved to archive.` });
          setArchiveTarget(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Could not archive item.", variant: "destructive" });
          setArchiveTarget(null);
        },
      }
    );
  };

  const handleDeactivate = (itemId: number, itemName: string) => {
    if (!activeVenueId) return;
    deactivateMutation.mutate(
      { venueId: activeVenueId, itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
          queryClient.invalidateQueries({ queryKey: getListInactiveInventoryQueryKey(activeVenueId) });
          toast({ title: "Deactivated", description: `${itemName} moved to inactive. Reactivate any time.` });
        },
        onError: () => toast({ title: "Error", description: "Could not deactivate item.", variant: "destructive" }),
      }
    );
  };

  const handleReactivate = (itemId: number, itemName: string) => {
    if (!activeVenueId) return;
    reactivateMutation.mutate(
      { venueId: activeVenueId, itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
          queryClient.invalidateQueries({ queryKey: getListInactiveInventoryQueryKey(activeVenueId) });
          toast({ title: "Reactivated", description: `${itemName} is back in active inventory.` });
        },
        onError: () => toast({ title: "Error", description: "Could not reactivate item.", variant: "destructive" }),
      }
    );
  };

  const handleRestore = (itemId: number, itemName: string) => {
    if (!activeVenueId) return;
    restoreMutation.mutate(
      { venueId: activeVenueId, itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey(activeVenueId) });
          queryClient.invalidateQueries({ queryKey: getListArchivedInventoryQueryKey(activeVenueId) });
          toast({ title: "Restored", description: `${itemName} is back in active inventory.` });
        },
        onError: () => toast({ title: "Error", description: "Could not restore item.", variant: "destructive" }),
      }
    );
  };

  if (!activeVenueId) {
    return <div className="text-center p-8">Please select a venue first.</div>;
  }

  const uniqueSupplierIds = inventory
    ? [...new Set(inventory.filter(i => i.supplierId != null).map(i => i.supplierId!))]
    : [];
  const uniqueLocations = inventory
    ? ([...new Set(inventory.map(i => i.storageLocation).filter(Boolean))] as string[])
    : [];

  const STATUS_PRIORITY: Record<string, number> = { critical: 0, low_stock: 1, expiry_risk: 2, stagnant: 3, healthy: 4 };

  const activeItems = inventory?.filter(item => {
    if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase()) && !(item.supplierName ?? "").toLowerCase().includes(searchText.toLowerCase())) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (supplierFilter !== "all" && item.supplierId?.toString() !== supplierFilter) return false;
    if (locationFilter !== "all" && (item.storageLocation ?? "") !== locationFilter) return false;
    return true;
  })?.sort((a, b) => {
    if (sortBy === "status") return (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "stock") return a.currentStock - b.currentStock;
    if (sortBy === "cost") return b.averageCost - a.averageCost;
    return 0;
  });

  const archivedItems = archivedInventory?.filter(item =>
    !searchText || item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const inactiveItems = inactiveInventory?.filter(item =>
    !searchText || item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-status-healthy text-status-healthy border-status-healthy';
      case 'low_stock': return 'bg-status-risk text-status-risk border-status-risk';
      case 'stagnant': return 'bg-status-slow text-status-slow border-status-slow';
      case 'expiry_risk': return 'bg-status-risk text-status-risk border-status-risk';
      case 'critical': return 'bg-status-critical text-status-critical border-status-critical';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'low_stock': return 'Low Stock';
      case 'stagnant': return 'Stagnant';
      case 'expiry_risk': return 'Expiry Risk';
      case 'critical': return 'Critical';
      default: return status;
    }
  };

  const getStatusBarColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-status-healthy';
      case 'low_stock': return 'bg-status-risk';
      case 'stagnant': return 'bg-status-slow';
      case 'expiry_risk': return 'bg-status-risk';
      case 'critical': return 'bg-status-critical';
      default: return 'bg-muted';
    }
  };

  const loading = tab === "active" ? isLoading : tab === "inactive" ? isLoadingInactive : isLoadingArchived;

  return (
    <>
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            Inventory
          </h1>
          <p className="text-muted-foreground mt-1">Live stock levels, costs and status.</p>
        </div>
        {canManage && (
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            <Link href="/inventory/new"><Plus className="w-4 h-4 mr-2" /> Add Item</Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setTab("active")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors",
            tab === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Active {inventory ? `(${inventory.length})` : ""}
        </button>
        <button
          onClick={() => setTab("inactive")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5",
            tab === "inactive" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <EyeOff className="w-3.5 h-3.5" /> Inactive {inactiveInventory ? `(${inactiveInventory.length})` : ""}
        </button>
        <button
          onClick={() => setTab("archived")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5",
            tab === "archived" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="w-3.5 h-3.5" /> Archives {archivedInventory ? `(${archivedInventory.length})` : ""}
        </button>
      </div>

      {/* Filters — for active and inactive tabs */}
      {(tab === "active" || tab === "inactive") && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-9 bg-card border-border text-foreground"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="stagnant">Stagnant</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
            </SelectContent>
          </Select>
          {tab === "active" && uniqueSupplierIds.length > 0 && (
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-[160px] bg-card border-border">
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {uniqueSupplierIds.map(id => (
                  <SelectItem key={id} value={id.toString()}>
                    {supplierById.get(id) ?? `Supplier ${id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {tab === "active" && uniqueLocations.length > 0 && (
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[160px] bg-card border-border">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {tab === "active" && (
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[160px] bg-card border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Sort: Status</SelectItem>
                <SelectItem value="name">Sort: Name A–Z</SelectItem>
                <SelectItem value="stock">Sort: Lowest Stock</SelectItem>
                <SelectItem value="cost">Sort: Highest Cost</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Archived search */}
      {tab === "archived" && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search archived..."
            className="pl-9 bg-card border-border text-foreground"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-card w-full" />)}
        </div>
      ) : tab === "active" ? (
        !inventory || inventory.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No inventory items</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Start building your digital prep whiteboard. Add your first ingredient to track costs and levels.
              </p>
              <Button asChild>
                <Link href="/inventory/new"><Plus className="w-4 h-4 mr-2" /> Add Item</Link>
              </Button>
            </CardContent>
          </Card>
        ) : activeItems?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No items match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeItems?.map(item => (
              <div key={item.id} className="relative group/card">
                <Link href={`/inventory/${item.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col overflow-hidden relative">
                    <div className={cn("absolute top-0 left-0 w-1 h-full", getStatusBarColor(item.status))} />
                    <CardContent className="p-5 flex flex-col h-full pl-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">{item.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{item.supplierName || "No Supplier"}</p>
                        </div>
                        <Badge variant="outline" className={cn("bg-transparent flex-shrink-0", getStatusColor(item.status))}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>

                      {item.expiresAt && (() => {
                        const daysLeft = Math.floor((new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        if (daysLeft > 7) return null;
                        return (
                          <div className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded mb-2 w-fit",
                            daysLeft <= 0 ? "bg-red-100 text-red-700" :
                            daysLeft <= 3 ? "bg-orange-100 text-orange-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {daysLeft <= 0 ? "Expired" : daysLeft === 1 ? "Expires tomorrow" : `Expires in ${daysLeft}d`}
                          </div>
                        );
                      })()}
                      <div className="mt-auto pt-3 border-t border-border/50">
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Stock</p>
                            <p className="text-base font-bold text-foreground flex items-end gap-0.5">
                              {item.currentStock} <span className="text-xs font-normal text-muted-foreground mb-0.5">{item.unit}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold flex items-center gap-0.5">
                              <DollarSign className="w-2.5 h-2.5" />Cost
                            </p>
                            <p className="text-base font-bold text-foreground">
                              ${item.averageCost.toFixed(2)}
                              <span className="text-xs font-normal text-muted-foreground">/{item.unit}</span>
                            </p>
                          </div>
                        </div>
                        {/* Quick stock bump — stops link navigation */}
                        <div className="flex items-center gap-1.5" onClick={e => e.preventDefault()}>
                          <button
                            disabled={stockBumping.has(item.id)}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); handleStockBump(item as any, -1); }}
                            className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-destructive hover:border-destructive active:bg-red-50 transition-colors touch-manipulation disabled:opacity-40"
                            title={`Remove 1 ${item.unit}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs text-muted-foreground flex-1 text-center">quick adjust</span>
                          <button
                            disabled={stockBumping.has(item.id)}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); handleStockBump(item as any, 1); }}
                            className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary active:bg-blue-50 transition-colors touch-manipulation disabled:opacity-40"
                            title={`Add 1 ${item.unit}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.stagnantDays > 0 && (
                        <div className="mt-2 bg-status-slow/10 rounded-md p-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-status-slow flex-shrink-0" />
                          <span className="text-sm text-status-slow font-medium">Stagnant for {item.stagnantDays} days</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>

                {/* Action buttons — overlaid top-right */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {canManage && (
                    <button
                      title="Deactivate item"
                      onClick={() => handleDeactivate(item.id, item.name)}
                      disabled={deactivateMutation.isPending}
                      className="opacity-0 group-hover/card:opacity-100 transition-opacity h-7 w-7 rounded bg-background/80 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "inactive" ? (
        /* Inactive tab */
        !inactiveInventory || inactiveInventory.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <EyeOff className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No inactive items</h3>
              <p className="text-muted-foreground max-w-sm">
                Items you deactivate from the active list appear here. Reactivate them any time with one tap.
              </p>
            </CardContent>
          </Card>
        ) : inactiveItems?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No inactive items match your search.</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              These items are hidden from active stock but not archived — reactivate when you start using them again.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveItems?.map(item => (
                <Card key={item.id} className="bg-card border-border opacity-75 hover:opacity-100 transition-opacity relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-muted" />
                  <CardContent className="p-5 pl-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-bold text-base text-foreground leading-tight">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.supplierName || "No Supplier"}</p>
                      </div>
                      <Badge variant="outline" className="bg-transparent text-muted-foreground border-border flex-shrink-0 text-xs">
                        Inactive
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 mb-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Last Stock</p>
                        <p className="text-sm font-bold text-foreground">{item.currentStock} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Cost</p>
                        <p className="text-sm font-bold text-foreground">${item.averageCost.toFixed(2)}/{item.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={reactivateMutation.isPending}
                        onClick={() => handleReactivate(item.id, item.name)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Reactivate
                      </Button>
                      {canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-muted-foreground"
                          disabled={archiveMutation.isPending}
                          onClick={() => handleArchive(item.id, item.name)}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Archived tab */
        !archivedInventory || archivedInventory.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <Archive className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No archived items</h3>
              <p className="text-muted-foreground max-w-sm">
                Archive items you no longer use — their cost history and recipe links are preserved.
              </p>
            </CardContent>
          </Card>
        ) : archivedItems?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No archived items match your search.</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Archived items are hidden from active inventory. Their data and cost history are preserved.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedItems?.map(item => (
                <Card key={item.id} className="bg-card border-border opacity-75 hover:opacity-100 transition-opacity relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-muted" />
                  <CardContent className="p-5 pl-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-bold text-base text-foreground leading-tight">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {item.archivedAt
                            ? `Archived ${new Date(item.archivedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
                            : "Archived"}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-transparent text-muted-foreground border-border flex-shrink-0 text-xs">
                        Archived
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 mb-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Last Cost</p>
                        <p className="text-sm font-bold text-foreground">${item.averageCost.toFixed(2)}/{item.unit}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">Supplier</p>
                        <p className="text-sm text-muted-foreground">{item.supplierName || "—"}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs"
                      disabled={restoreMutation.isPending}
                      onClick={() => handleRestore(item.id, item.name)}
                    >
                      <ArchiveRestore className="w-3.5 h-3.5 mr-1.5" /> Restore to inventory
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      )}
    </div>

    <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {archiveTarget?.name}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              This will remove <strong>{archiveTarget?.name}</strong> from active inventory. All cost history and recipe links are preserved, and you can restore it at any time from the Archives tab.
            </span>
            <span className="block font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm">
              Confirm archive — only archive items with no activity for 2+ months.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmArchive}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Archive item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
