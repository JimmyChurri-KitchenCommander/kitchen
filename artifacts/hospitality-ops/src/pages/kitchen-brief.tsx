import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useVenueStore } from "@/stores/venueStore";
import { customFetch } from "@workspace/api-client-react";
import {
  Brain, ArrowRight, CheckCircle2, AlertTriangle, Info,
  ClipboardList, ShoppingCart, Trash2, DollarSign, ChefHat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AssistantEvidence = {
  label: string;
  value: string;
  href?: string;
};

type AssistantBriefingAnswer = {
  id: string;
  question: string;
  answer: string;
  status: "ready" | "watch" | "action_required" | "info";
  confidence: "high" | "medium" | "low";
  evidence: AssistantEvidence[];
  href?: string;
};

type KitchenAssistantContext = {
  meta: {
    venueId: number;
    venueName: string;
    generatedAt: string;
    targetDate: string;
    tomorrowDate: string;
    timezone: string;
    avgCoversPerService: number | null;
  };
  readiness: {
    status: "ready" | "watch" | "not_ready";
    score: number;
    headline: string;
  };
  briefing: AssistantBriefingAnswer[];
};

const BRIEFING_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "service-readiness": ChefHat,
  "food-cost-trend": DollarSign,
  "prep-tomorrow": ClipboardList,
  "ordering-needs": ShoppingCart,
  "waste-loss": Trash2,
};

function statusBadge(status: AssistantBriefingAnswer["status"]) {
  switch (status) {
    case "ready":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Ready</Badge>;
    case "watch":
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Watch</Badge>;
    case "action_required":
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Action needed</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">Info</Badge>;
  }
}

function statusIcon(status: AssistantBriefingAnswer["status"]) {
  switch (status) {
    case "ready":
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "watch":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "action_required":
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    default:
      return <Info className="w-5 h-5 text-slate-500" />;
  }
}

function readinessColor(status: KitchenAssistantContext["readiness"]["status"]) {
  switch (status) {
    case "ready": return "text-emerald-600";
    case "watch": return "text-amber-500";
    default: return "text-red-600";
  }
}

function BriefingCard({ item }: { item: AssistantBriefingAnswer }) {
  const Icon = BRIEFING_ICONS[item.id] ?? Brain;
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Icon className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{item.question}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {statusBadge(item.status)}
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {item.confidence} confidence
            </span>
          </div>
        </div>
      </CardHeader>
      {item.evidence.length > 0 && (
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {item.evidence.map((evidence) => (
              <div key={`${item.id}-${evidence.label}`} className="flex items-start gap-2 rounded-md border border-border/70 px-3 py-2">
                {statusIcon(item.status)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{evidence.label}</p>
                  <p className="text-xs text-muted-foreground">{evidence.value}</p>
                </div>
              </div>
            ))}
          </div>
          {item.href && (
            <Link href={item.href}>
              <Button variant="outline" size="sm" className="gap-2">
                Open related area
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function KitchenBriefPage() {
  const activeVenueId = useVenueStore((s) => s.activeVenueId);
  const today = new Date().toISOString().slice(0, 10);
  const [targetDate, setTargetDate] = useState(today);
  const [covers, setCovers] = useState<string>("");

  const queryKey = ["kitchen-assistant-context", activeVenueId, targetDate, covers];
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey,
    enabled: !!activeVenueId,
    queryFn: () => {
      const params = new URLSearchParams({ targetDate });
      if (covers.trim()) params.set("covers", covers.trim());
      return customFetch<KitchenAssistantContext>(
        `/api/venues/${activeVenueId}/assistant/context?${params.toString()}`,
        { responseType: "json" },
      );
    },
  });

  if (!activeVenueId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Select a venue to view the kitchen brief.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold tracking-tight">Kitchen Brief</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Structured answers to the questions a head chef asks every day. This layer prepares the data for a future AI assistant — no chat required yet.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="targetDate" className="text-xs">Service date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div>
            <Label htmlFor="covers" className="text-xs">Expected covers</Label>
            <Input
              id="covers"
              type="number"
              min={0}
              placeholder={data?.meta.avgCoversPerService?.toString() ?? "Covers"}
              value={covers}
              onChange={(e) => setCovers(e.target.value)}
              className="w-[120px]"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : data ? (
        <>
          <Card className="border-orange-200/60 bg-gradient-to-br from-orange-50/70 to-background dark:from-orange-950/20">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Service readiness</p>
                <p className={cn("text-xl font-semibold mt-1", readinessColor(data.readiness.status))}>
                  {data.readiness.headline}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.meta.venueName} · target {data.meta.targetDate} · prep for {data.meta.tomorrowDate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{data.readiness.score}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Readiness score</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {data.briefing.map((item) => (
              <BriefingCard key={item.id} item={item} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
