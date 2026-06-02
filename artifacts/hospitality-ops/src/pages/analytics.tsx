import { useVenueStore } from "@/stores/venueStore";
import { useDemoStore } from "@/stores/demoStore";
import { useGetAnalytics, getGetAnalyticsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { LineChart as ChartIcon, TrendingDown, DollarSign, Percent, AlertTriangle, ArrowUpRight, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function isoDate(d: Date) {
  return d.toISOString().split("T")[0] as string;
}

export default function AnalyticsPage() {
  const { activeVenueId } = useVenueStore();
  const { toast } = useToast();
  const { isDemoMode, demoToken } = useDemoStore();

  const { data: analytics, isLoading } = useGetAnalytics(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getGetAnalyticsQueryKey(activeVenueId as number) } }
  );

  // Export state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState("waste");
  const [exportFrom, setExportFrom] = useState(isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [exportTo, setExportTo] = useState(isoDate(new Date()));
  const [isExporting, setIsExporting] = useState(false);

  const getAuthHeader = (): string | null => {
    if (isDemoMode && demoToken) return `Bearer demo-${demoToken}`;
    return null;
  };

  const handleExport = async () => {
    if (!activeVenueId) return;
    setIsExporting(true);
    try {
      const url = `/api/venues/${activeVenueId}/export?type=${exportType}&from=${exportFrom}&to=${exportTo}`;
      const authHeader = getAuthHeader();
      const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${exportType}-${exportFrom}-to-${exportTo}.csv`;
      a.click();
      URL.revokeObjectURL(objUrl);
      setIsExportOpen(false);
      toast({ title: "Export downloaded" });
    } catch {
      toast({ title: "Export failed", description: "Could not generate the report.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (!activeVenueId) return <div className="text-center p-8">Select a venue first.</div>;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton className="h-10 w-48 mb-8 bg-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-card" />)}
        </div>
        <Skeleton className="h-[400px] w-full bg-card" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ChartIcon className="w-8 h-8 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Financial performance and margin protection.</p>
        </div>

        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <Download className="w-4 h-4 mr-2" /> Export Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Export Data</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-foreground">Report Type</Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">Financial</SelectLabel>
                      <SelectItem value="waste">Waste Log</SelectItem>
                      <SelectItem value="food-cost">Food Cost (Recipes)</SelectItem>
                      <SelectItem value="stocktake">Stocktakes</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">Compliance</SelectLabel>
                      <SelectItem value="temperature-logs">Temperature Logs</SelectItem>
                      <SelectItem value="cleaning-logs">Cleaning Log</SelectItem>
                      <SelectItem value="chemicals">Chemical Safety Register</SelectItem>
                      <SelectItem value="compliance-actions">Compliance Actions</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {(exportType === "chemicals" || exportType === "food-cost") && (
                  <p className="text-xs text-amber-500">This report is a full snapshot — the date range below is not applied.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">From</Label>
                  <Input type="date" className="bg-background border-border text-foreground" value={exportFrom} onChange={e => setExportFrom(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">To</Label>
                  <Input type="date" className="bg-background border-border text-foreground" value={exportTo} onChange={e => setExportTo(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Last 14 days", days: 14 },
                  { label: "Last 30 days", days: 30 },
                  { label: "Last 90 days", days: 90 },
                ].map(({ label, days }) => (
                  <Button key={days} variant="outline" size="sm" className="text-xs" onClick={() => {
                    setExportFrom(isoDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000)));
                    setExportTo(isoDate(new Date()));
                  }}>
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Downloads as a CSV file you can open in Excel or Google Sheets.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
              <Button onClick={handleExport} disabled={isExporting || !exportFrom || !exportTo} className="bg-primary text-primary-foreground">
                {isExporting ? "Exporting..." : "Download CSV"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Food Cost</p>
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className={cn("text-3xl font-bold", analytics.avgFoodCostPercent && analytics.avgFoodCostPercent > 32 ? "text-status-critical" : "text-foreground")}>
              {analytics.avgFoodCostPercent ? `${analytics.avgFoodCostPercent.toFixed(1)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stagnant Capital</p>
              <DollarSign className="w-4 h-4 text-status-slow" />
            </div>
            <p className="text-3xl font-bold text-foreground">${analytics.stagnantValue.toFixed(0)}</p>
            <p className="text-xs text-status-slow mt-1">Tied up in slow stock</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Waste (30d)</p>
              <TrendingDown className="w-4 h-4 text-status-critical" />
            </div>
            <p className="text-3xl font-bold text-status-critical">${analytics.totalWasteCost.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-primary uppercase tracking-wider font-semibold">Avg GP Margin</p>
              <ArrowUpRight className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">
              {analytics.avgGpPercent ? `${analytics.avgGpPercent.toFixed(1)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg font-bold">Waste Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
            {analytics.wasteTrend && analytics.wasteTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.wasteTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#111', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Waste Cost']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="totalCost" stroke="hsl(0 84% 60%)" strokeWidth={3} fillOpacity={1} fill="url(#colorWaste)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Not enough data to render chart.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="border-b border-border py-4">
             <CardTitle className="text-lg font-bold flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-status-critical" />
               Recent Price Spikes
             </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analytics.priceSpikes && analytics.priceSpikes.length > 0 ? (
              <div className="divide-y divide-border">
                {analytics.priceSpikes.map((spike, idx) => (
                  <div key={idx} className="p-5 hover:bg-secondary/50 transition-colors">
                    <p className="font-bold text-foreground mb-1">{spike.itemName}</p>
                    <p className="text-sm text-muted-foreground mb-3">{spike.supplierName}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-muted-foreground line-through decoration-destructive/50">${spike.oldPrice.toFixed(2)}</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="font-bold text-status-critical">${spike.newPrice.toFixed(2)}</span>
                      </div>
                      <Badge variant="outline" className="bg-status-critical/10 text-status-critical border-status-critical/30 font-bold">
                        +{spike.changePercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No recent price spikes detected from invoices.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
