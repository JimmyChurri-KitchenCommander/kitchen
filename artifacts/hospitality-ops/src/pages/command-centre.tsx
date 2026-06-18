import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVenueStore } from "@/stores/venueStore";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, DollarSign,
  Gauge, Play, Shield, ShoppingCart, Trash2, UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CommandCentreView = {
  meta: {
    venueName: string;
    targetDate: string;
    totalCovers: number | null;
    planApplied: boolean;
    menuName: string | null;
  };
  serviceReadiness: {
    score: number;
    colour: "green" | "amber" | "red";
    label: "ready" | "attention_required" | "high_risk";
    headline: string;
    coversRequiredForAccuracy: boolean;
  };
  attention: {
    count: number;
    headline: string;
    items: Array<{
      id: string;
      category: string;
      severity: "critical" | "high" | "medium";
      title: string;
      detail: string;
      href: string;
    }>;
  };
  dishesAtRisk: Array<{
    recipeId: number;
    recipeName: string;
    portionsRequired: number;
    portionsAtRisk: number;
    status: "ready" | "ingredient_shortage" | "may_run_out" | "cannot_produce";
    blockingItems: Array<{ name: string; gapQuantity: number; unit: string }>;
    href: string;
  }>;
  prepToday: {
    openTaskCount: number;
    urgentTaskCount: number;
    suggestedTasks: Array<{ title: string; quantity: number; unit: string; onBoard: boolean; reason: string }>;
    headline: string;
  };
  orderToday: {
    itemCount: number;
    estimatedTotal: number;
    headline: string;
    source: "demand_and_par" | "par_only";
    items: Array<{ itemName: string; suggestedQty: number; unit: string; supplierName: string | null; reason: string }>;
  };
  compliance: { score: number; headline: string; totalIssues: number };
  foodCost: { score: number; level: string; headline: string; drivers: Array<{ label: string; detail: string; href: string }> };
  waste: { todayCost: number; isElevated: boolean; headline: string; topItems: Array<{ itemName: string; totalCost: number }> };
  morningRun?: { prepTasksCreated: number };
};

const TODAY = new Date().toISOString().slice(0, 10);

function readinessStyles(colour: CommandCentreView["serviceReadiness"]["colour"]) {
  switch (colour) {
    case "green": return { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", text: "text-emerald-700", label: "Ready" };
    case "amber": return { badge: "bg-amber-100 text-amber-800 border-amber-200", text: "text-amber-700", label: "Attention required" };
    default: return { badge: "bg-red-100 text-red-800 border-red-200", text: "text-red-700", label: "High risk" };
  }
}

function dishStatusBadge(status: CommandCentreView["dishesAtRisk"][number]["status"]) {
  switch (status) {
    case "cannot_produce": return <Badge className="bg-red-100 text-red-700 border-red-200">Cannot produce</Badge>;
    case "may_run_out": return <Badge className="bg-orange-100 text-orange-700 border-orange-200">May run out</Badge>;
    case "ingredient_shortage": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Shortage</Badge>;
    default: return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Ready</Badge>;
  }
}

export default function CommandCentrePage() {
  const activeVenueId = useVenueStore((s) => s.activeVenueId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lunchCovers, setLunchCovers] = useState("");
  const [dinnerCovers, setDinnerCovers] = useState("");
  const [appliedCovers, setAppliedCovers] = useState<{ lunch?: number; dinner?: number } | null>(null);

  const queryKey = useMemo(
    () => ["command-centre", activeVenueId, TODAY, appliedCovers?.lunch, appliedCovers?.dinner],
    [activeVenueId, appliedCovers],
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey,
    enabled: !!activeVenueId,
    queryFn: () => {
      const params = new URLSearchParams({ targetDate: TODAY });
      if (appliedCovers?.lunch) params.set("lunchCovers", String(appliedCovers.lunch));
      if (appliedCovers?.dinner) params.set("dinnerCovers", String(appliedCovers.dinner));
      return customFetch<CommandCentreView>(
        `/api/venues/${activeVenueId}/command-centre?${params.toString()}`,
        { responseType: "json" },
      );
    },
  });

  const morningRun = useMutation({
    mutationFn: async () => {
      const lunch = Number(lunchCovers) || 0;
      const dinner = Number(dinnerCovers) || 0;
      if (lunch + dinner <= 0) throw new Error("Enter lunch and/or dinner covers");
      const servicePeriods = [
        ...(lunch > 0 ? [{ label: "Lunch", covers: lunch }] : []),
        ...(dinner > 0 ? [{ label: "Dinner", covers: dinner }] : []),
      ];
      return customFetch<CommandCentreView>(
        `/api/venues/${activeVenueId}/command-centre/morning-run`,
        {
          method: "POST",
          responseType: "json",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetDate: TODAY, servicePeriods, createPrepTasks: true, prepTaskSelection: "gaps_only" }),
        },
      );
    },
    onSuccess: (result) => {
      setAppliedCovers({
        lunch: Number(lunchCovers) || undefined,
        dinner: Number(dinnerCovers) || undefined,
      });
      queryClient.setQueryData(queryKey, result);
      toast({
        title: "Morning workflow complete",
        description: result.morningRun
          ? `${result.morningRun.prepTasksCreated} prep task${result.morningRun.prepTasksCreated === 1 ? "" : "s"} added to today's board.`
          : "Service plan calculated.",
      });
    },
    onError: (err) => {
      toast({
        title: "Could not run morning workflow",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    },
  });

  if (!activeVenueId) {
    return <div className="p-6 text-muted-foreground">Select a venue to open the Command Centre.</div>;
  }

  const readiness = data ? readinessStyles(data.serviceReadiness.colour) : null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold tracking-tight">Chef Command Centre</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            One operational view for service readiness, prep, ordering, menu risk, compliance, food cost, and waste.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>Refresh</Button>
      </div>

      <Card className="border-orange-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Morning workflow</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-end gap-3">
          <div>
            <Label htmlFor="lunchCovers" className="text-xs">Lunch covers</Label>
            <Input id="lunchCovers" type="number" min={0} value={lunchCovers} onChange={(e) => setLunchCovers(e.target.value)} className="w-[120px]" placeholder="150" />
          </div>
          <div>
            <Label htmlFor="dinnerCovers" className="text-xs">Dinner covers</Label>
            <Input id="dinnerCovers" type="number" min={0} value={dinnerCovers} onChange={(e) => setDinnerCovers(e.target.value)} className="w-[120px]" placeholder="250" />
          </div>
          <Button onClick={() => morningRun.mutate()} disabled={morningRun.isPending} className="gap-2">
            <Play className="w-4 h-4" />
            {morningRun.isPending ? "Running..." : "Run service plan"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : data && readiness ? (
        <>
          <Card className="bg-gradient-to-br from-orange-50/70 to-background dark:from-orange-950/20">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Service readiness</p>
                <p className={cn("text-xl font-semibold mt-1", readiness.text)}>{data.serviceReadiness.headline}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.meta.venueName} · {data.meta.targetDate}
                  {data.meta.totalCovers ? ` · ${data.meta.totalCovers} covers` : ""}
                  {data.meta.menuName ? ` · ${data.meta.menuName}` : ""}
                </p>
                {data.serviceReadiness.coversRequiredForAccuracy && (
                  <p className="text-xs text-amber-700 mt-2">Enter covers and run the morning workflow for service-accurate readiness.</p>
                )}
              </div>
              <div className="text-right space-y-2">
                <p className="text-4xl font-bold">{data.serviceReadiness.score}%</p>
                <Badge className={readiness.badge}>{readiness.label}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card id="attention-now">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{data.attention.headline}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.attention.items.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Nothing urgent right now.</p>
              ) : data.attention.items.map((item) => (
                <Link key={item.id} href={item.href}>
                  <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3 hover:bg-secondary/30 transition-colors">
                    <AlertTriangle className={cn("w-5 h-5 mt-0.5", item.severity === "critical" ? "text-red-600" : item.severity === "high" ? "text-amber-500" : "text-slate-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card id="dishes-at-risk">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Dishes at risk</CardTitle>
            </CardHeader>
            <CardContent>
              {data.dishesAtRisk.length === 0 ? (
                <p className="text-sm text-muted-foreground">Run the morning workflow with covers to assess menu risk.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {data.dishesAtRisk.map((dish) => (
                    <Link key={dish.recipeId} href={dish.href}>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 p-3 hover:bg-secondary/20">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{dish.recipeName}</p>
                          <p className="text-xs text-muted-foreground">{dish.portionsRequired} portions planned · {dish.portionsAtRisk} at risk</p>
                          {dish.blockingItems[0] && (
                            <p className="text-xs text-muted-foreground mt-1">Blocked by {dish.blockingItems[0].name} (−{dish.blockingItems[0].gapQuantity} {dish.blockingItems[0].unit})</p>
                          )}
                        </div>
                        {dishStatusBadge(dish.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card id="prep-today">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Prep today</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{data.prepToday.headline}</p>
                {data.prepToday.suggestedTasks.filter((t) => !t.onBoard).slice(0, 5).map((task) => (
                  <div key={task.title} className="rounded-md border border-border/70 px-3 py-2 text-sm">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.quantity} {task.unit} · {task.reason}</p>
                  </div>
                ))}
                <Link href="/prep-board"><Button variant="outline" size="sm">Open prep board</Button></Link>
              </CardContent>
            </Card>

            <Card id="order-today">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Order today</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{data.orderToday.headline}</p>
                <p className="text-xs text-muted-foreground">{data.orderToday.source === "demand_and_par" ? "Based on today's covers and par levels." : "Based on par levels — run covers for demand accuracy."}</p>
                {data.orderToday.items.slice(0, 5).map((item) => (
                  <div key={item.itemName} className="rounded-md border border-border/70 px-3 py-2 text-sm">
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">Order ~{item.suggestedQty} {item.unit}{item.supplierName ? ` · ${item.supplierName}` : ""}</p>
                  </div>
                ))}
                <Link href="/orders"><Button variant="outline" size="sm">Open orders</Button></Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Compliance</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.compliance.score}%</p>
                <p className="text-sm text-muted-foreground mt-1">{data.compliance.headline}</p>
                <Link href="/compliance"><Button variant="outline" size="sm" className="mt-3">Open compliance</Button></Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" /> Food cost</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{data.foodCost.headline}</p>
                {data.foodCost.drivers.slice(0, 2).map((driver) => (
                  <p key={driver.label} className="text-xs text-muted-foreground mt-2">{driver.label}: {driver.detail}</p>
                ))}
                <Link href="/recipes"><Button variant="outline" size="sm" className="mt-3">Review recipes</Button></Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4" /> Waste</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{data.waste.headline}</p>
              {data.waste.isElevated && <p className="text-sm text-amber-700 mt-2">Today: ${data.waste.todayCost.toFixed(2)} logged</p>}
              <Link href="/waste"><Button variant="outline" size="sm" className="mt-3">Open waste log</Button></Link>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
