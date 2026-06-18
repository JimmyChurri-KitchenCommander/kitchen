import { useVenueStore } from "@/stores/venueStore";
import {
  useGetInventoryItem,
  useGetInventoryItemPriceHistory,
  getGetInventoryItemQueryKey,
  getGetInventoryItemPriceHistoryQueryKey,
  customFetch,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  ArrowLeft, Edit2, Package, AlertTriangle, DollarSign,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function getStatusColor(status: string) {
  switch (status) {
    case "healthy": return "text-status-healthy border-status-healthy/30 bg-status-healthy/10";
    case "low_stock": return "text-status-low border-status-low/30 bg-status-low/10";
    case "stagnant": return "text-status-slow border-status-slow/30 bg-status-slow/10";
    case "expiry_risk": return "text-status-critical border-status-critical/30 bg-status-critical/10";
    case "critical": return "text-status-critical border-status-critical/30 bg-status-critical/10";
    default: return "text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "healthy": return "Healthy";
    case "low_stock": return "Low Stock";
    case "stagnant": return "Stagnant";
    case "expiry_risk": return "Expiry Risk";
    case "critical": return "Critical";
    default: return status;
  }
}

function getStatusBarColor(status: string) {
  switch (status) {
    case "healthy": return "bg-status-healthy";
    case "low_stock": return "bg-status-low";
    case "stagnant": return "bg-status-slow";
    case "expiry_risk": return "bg-status-critical";
    case "critical": return "bg-status-critical";
    default: return "bg-muted";
  }
}

function getStockTypeLabel(stockType: string) {
  switch (stockType) {
    case "prep": return "Prep stock";
    case "finished": return "Finished stock";
    case "raw":
    default: return "Raw stock";
  }
}

function getTransactionLabel(type: string) {
  switch (type) {
    case "PURCHASE": return "Delivery received";
    case "PRODUCTION_INPUT": return "Used in prep";
    case "PRODUCTION_OUTPUT": return "Prep produced";
    case "SALE": return "Sold through service";
    case "WASTE": return "Waste logged";
    case "STOCKTAKE": return "Stocktake correction";
    default: return type;
  }
}

type InventoryLedgerEntry = {
  id: number;
  venueId: number;
  inventoryItemId: number;
  layerId: number | null;
  transactionType: "PURCHASE" | "PRODUCTION_INPUT" | "PRODUCTION_OUTPUT" | "SALE" | "WASTE" | "STOCKTAKE";
  quantityDelta: number;
  resultingStock: number;
  unitCost: number;
  costImpact: number;
  reason: string;
  referenceType: string | null;
  referenceId: number | null;
  createdBy: string | null;
  createdAt: string;
};

export default function InventoryDetailPage() {
  const { activeVenueId } = useVenueStore();
  const params = useParams();
  const itemId = parseInt(params.id!);

  const { data: item, isLoading } = useGetInventoryItem(
    activeVenueId as number,
    itemId,
    { query: { enabled: !!activeVenueId && !!itemId, queryKey: getGetInventoryItemQueryKey(activeVenueId as number, itemId) } }
  );

  const { data: priceHistory = [] } = useGetInventoryItemPriceHistory(
    activeVenueId as number,
    itemId,
    { query: { enabled: !!activeVenueId && !!itemId, queryKey: getGetInventoryItemPriceHistoryQueryKey(activeVenueId as number, itemId) } }
  );

  const { data: ledgerEntries = [] } = useQuery({
    enabled: !!activeVenueId && !!itemId,
    queryKey: ["/api/venues", activeVenueId, "inventory", itemId, "ledger"],
    queryFn: () => customFetch<InventoryLedgerEntry[]>(
      `/venues/${activeVenueId}/inventory/${itemId}/ledger`,
      { responseType: "json" },
    ),
  });

  if (!activeVenueId) return null;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton className="h-10 w-48 bg-card" />
        <Skeleton className="h-40 w-full bg-card" />
        <Skeleton className="h-64 w-full bg-card" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        Item not found.{" "}
        <Link href="/inventory" className="text-primary hover:underline">Back to inventory</Link>
      </div>
    );
  }

  const sortedHistory = [...priceHistory].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const chartData = sortedHistory.map(entry => ({
    date: new Date(entry.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    price: entry.newPrice,
  }));

  const lastEntry = sortedHistory[sortedHistory.length - 1];
  const prevEntry = sortedHistory[sortedHistory.length - 2];
  const priceVariance = lastEntry && prevEntry && prevEntry.newPrice > 0
    ? ((lastEntry.newPrice - prevEntry.newPrice) / prevEntry.newPrice) * 100
    : null;
  const stockType = (item as { stockType?: string }).stockType ?? (item.isInHousePrepped ? "prep" : "raw");

  return (
    <div className="space-y-6 pb-20 max-w-3xl">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
            <Link href="/inventory"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{item.name}</h1>
              <Badge variant="outline" className={cn("bg-transparent", getStatusColor(item.status))}>
                {getStatusLabel(item.status)}
              </Badge>
              <Badge variant="secondary">{getStockTypeLabel(stockType)}</Badge>
            </div>
            {item.supplierName && (
              <p className="text-muted-foreground mt-1">{item.supplierName}</p>
            )}
          </div>
        </div>
        <Button asChild className="shrink-0 bg-primary text-primary-foreground">
          <Link href={`/inventory/${item.id}/edit`}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit
          </Link>
        </Button>
      </div>

      {/* Stats card */}
      <Card className="bg-card border-border overflow-hidden relative">
        <div className={cn("absolute top-0 left-0 w-1.5 h-full", getStatusBarColor(item.status))} />
        <CardContent className="p-6 pl-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Current Stock</p>
              <p className="text-2xl font-bold text-foreground">
                {item.currentStock}
                <span className="text-sm font-normal text-muted-foreground ml-1">{item.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Par Level</p>
              <p className="text-2xl font-bold text-foreground">
                {item.parLevel}
                <span className="text-sm font-normal text-muted-foreground ml-1">{item.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Avg Cost
              </p>
              <p className="text-2xl font-bold text-foreground">
                ${item.averageCost.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground ml-1">/{item.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Stock Value</p>
              <p className="text-2xl font-bold text-foreground">
                ${(item.currentStock * item.averageCost).toFixed(2)}
              </p>
            </div>
          </div>

          {item.stagnantDays > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-status-slow bg-status-slow/10 rounded-md px-3 py-2 w-fit">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Stagnant for {item.stagnantDays} days — consider using it up or running a special
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier + shelf life */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kitchen Layer</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="font-semibold text-foreground">{getStockTypeLabel(stockType)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stockType === "raw"
                ? "Purchased ingredient stock"
                : stockType === "prep"
                ? "Made in-house from other stock"
                : "Ready for sale or portioning"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Supplier</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {item.supplierName ? (
              item.supplierId ? (
                <Link href={`/suppliers/${item.supplierId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {item.supplierName}
                </Link>
              ) : (
                <p className="font-semibold text-foreground">{item.supplierName}</p>
              )
            ) : (
              <p className="text-muted-foreground italic">No supplier linked</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Shelf Life</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {item.shelfLifeDays ? (
              <p className="font-semibold text-foreground">{item.shelfLifeDays} days</p>
            ) : (
              <p className="text-muted-foreground italic">Not set</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Stock Movement Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ledgerEntries.length > 0 ? (
            <div className="divide-y divide-border/60">
              {ledgerEntries.slice(0, 12).map(entry => {
                const isPositive = entry.quantityDelta > 0;
                return (
                  <div key={entry.id} className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="font-semibold text-foreground">{getTransactionLabel(entry.transactionType)}</p>
                      <p className="text-sm text-muted-foreground">{entry.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.createdAt).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-bold", isPositive ? "text-status-healthy" : "text-status-critical")}>
                        {isPositive ? "+" : ""}{entry.quantityDelta.toFixed(2)} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance {entry.resultingStock.toFixed(2)} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${Math.abs(entry.costImpact).toFixed(2)} impact
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-5 text-sm text-muted-foreground">
              No stock movements recorded yet. New deliveries, stocktakes, prep logs, and waste will appear here.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price history */}
      {sortedHistory.length > 0 ? (
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Price History
              </CardTitle>
              {priceVariance !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md",
                  priceVariance > 5 ? "bg-status-critical/10 text-status-critical"
                    : priceVariance < -5 ? "bg-status-healthy/10 text-status-healthy"
                    : "bg-secondary text-muted-foreground"
                )}>
                  {priceVariance > 0
                    ? <TrendingUp className="w-3.5 h-3.5" />
                    : priceVariance < 0
                    ? <TrendingDown className="w-3.5 h-3.5" />
                    : <Minus className="w-3.5 h-3.5" />}
                  {priceVariance > 0 ? "+" : ""}{priceVariance.toFixed(1)}% vs last invoice
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} width={48} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(val: number) => [`$${val.toFixed(2)}`, "Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(214 89% 45%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* History table */}
            <div className="mt-4 divide-y divide-border/60 text-sm">
              {[...sortedHistory].reverse().slice(0, 8).map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-2 gap-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.recordedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${entry.newPrice.toFixed(2)}</p>
                    {entry.changePercent != null && entry.changePercent !== 0 && (
                      <p className={cn(
                        "text-xs",
                        entry.changePercent > 0 ? "text-status-critical" : "text-status-healthy"
                      )}>
                        {entry.changePercent > 0 ? "+" : ""}{entry.changePercent.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm">No price history yet — costs update automatically when you confirm invoices.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
