import { useState } from "react";
import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield, Plus, ExternalLink, Clock, FlaskConical, AlertTriangle, Check,
  ChevronDown, ChevronRight, Pencil, X, Loader2, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useListChemicals, useCreateChemical, useUpdateChemical, useDeleteChemical,
  useListComplianceTasks, useResolveComplianceTask, useGetComplianceSummary,
  useGetChemicalAlternatives, getGetChemicalAlternativesQueryKey,
  getListChemicalsQueryKey, getListComplianceTasksQueryKey, getGetComplianceSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Chemical, ChemicalInput } from "@workspace/api-client-react";

const CHEMICAL_TYPES = [
  { value: "sanitiser", label: "Sanitiser" },
  { value: "degreaser", label: "Degreaser" },
  { value: "disinfectant", label: "Disinfectant" },
  { value: "detergent", label: "Detergent" },
  { value: "bleach", label: "Bleach" },
  { value: "acid", label: "Acid cleaner" },
  { value: "other", label: "Other" },
];

const PPE_OPTIONS = [
  { value: "gloves", label: "Gloves" },
  { value: "goggles", label: "Goggles" },
  { value: "apron", label: "Apron" },
  { value: "mask", label: "Mask" },
  { value: "boots", label: "Boots" },
];

function complianceBadge(status: string) {
  switch (status) {
    case "VALID":          return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Valid</Badge>;
    case "EXPIRING_SOON":  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Expiring Soon</Badge>;
    case "EXPIRED":        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Expired</Badge>;
    case "MISSING_MSDS":   return <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">No MSDS</Badge>;
    case "BLOCKED":        return <Badge className="bg-red-600 text-white border-red-700 hover:bg-red-600">Blocked</Badge>;
    // legacy lowercase fallback
    case "current":        return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Valid</Badge>;
    case "expiring_soon":  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Expiring Soon</Badge>;
    case "expired":        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Expired</Badge>;
    default:               return <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">No MSDS</Badge>;
  }
}

function ComplianceSummaryWidget({ venueId }: { venueId: number }) {
  const { data } = useGetComplianceSummary(venueId, {
    query: { enabled: !!venueId, queryKey: getGetComplianceSummaryQueryKey(venueId) },
  });
  if (!data) return null;
  const score = data.score ?? 0;
  const scoreColor = score >= 90 ? "text-status-healthy" : score >= 70 ? "text-amber-500" : "text-status-critical";
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className={cn("w-8 h-8", scoreColor)} />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Compliance Score</p>
              <p className={cn("text-2xl font-bold", scoreColor)}>{score}%</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {data.blockedCount > 0 && (
              <div className="text-center">
                <p className="text-xl font-bold text-red-600">{data.blockedCount}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
            )}
            {data.expiringSoonCount > 0 && (
              <div className="text-center">
                <p className="text-xl font-bold text-amber-500">{data.expiringSoonCount}</p>
                <p className="text-xs text-muted-foreground">Expiring</p>
              </div>
            )}
            {data.missingMsdsCount > 0 && (
              <div className="text-center">
                <p className="text-xl font-bold text-slate-500">{data.missingMsdsCount}</p>
                <p className="text-xs text-muted-foreground">No MSDS</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{data.totalActive}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ppeList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function ppeLabel(val: string): string {
  return PPE_OPTIONS.find(p => p.value === val)?.label ?? val;
}

type ChemicalForm = {
  name: string;
  type: string;
  dilutionRatio: string;
  contactTimeSeconds: string;
  ppeRequired: string[];
  sopInstructions: string;
  msdsUrl: string;
  msdsExpiryDate: string;
  msdsVersion: string;
  notes: string;
};

const emptyForm = (): ChemicalForm => ({
  name: "", type: "other", dilutionRatio: "", contactTimeSeconds: "",
  ppeRequired: [], sopInstructions: "", msdsUrl: "",
  msdsExpiryDate: "", msdsVersion: "", notes: "",
});

function ChemicalCard({ chemical, venueId, onEdit, canManage }: {
  chemical: Chemical;
  venueId: number;
  onEdit: () => void;
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ppe = ppeList(chemical.ppeRequired);
  const hasSop = !!chemical.sopInstructions;
  const hasMsds = !!chemical.msdsUrl;
  const isBlocked = ["BLOCKED", "EXPIRED", "MISSING_MSDS"].includes(chemical.complianceStatus);

  const { data: alternatives, isLoading: isLoadingAlternatives } = useGetChemicalAlternatives(
    venueId, chemical.id,
    { query: { enabled: expanded && isBlocked, queryKey: getGetChemicalAlternativesQueryKey(venueId, chemical.id) } },
  );

  return (
    <Card className={cn(
      "border-border bg-card transition-all",
      !chemical.isActive && "opacity-60",
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-foreground leading-tight">{chemical.name}</span>
              {!chemical.isActive && (
                <Badge variant="outline" className="text-xs">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium capitalize">
                {CHEMICAL_TYPES.find(t => t.value === chemical.type)?.label ?? chemical.type}
              </span>
              {complianceBadge(chemical.complianceStatus)}
            </div>
            {chemical.complianceStatus === "BLOCKED" && chemical.complianceReason && (
              <p className="text-xs text-red-600 mt-1.5 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{chemical.complianceReason}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canManage && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick safety row always visible */}
        <div className="flex gap-4 mt-3 flex-wrap">
          {chemical.dilutionRatio && (
            <div className="flex items-center gap-1.5 text-xs text-foreground">
              <FlaskConical className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="font-semibold">Dilute</span>
              <span className="text-muted-foreground">{chemical.dilutionRatio}</span>
            </div>
          )}
          {chemical.contactTimeSeconds && (
            <div className="flex items-center gap-1.5 text-xs text-foreground">
              <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="font-semibold">Contact</span>
              <span className="text-muted-foreground">
                {chemical.contactTimeSeconds >= 60
                  ? `${Math.round(chemical.contactTimeSeconds / 60)} min`
                  : `${chemical.contactTimeSeconds}s`}
              </span>
            </div>
          )}
          {ppe.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-foreground flex-wrap">
              <Shield className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="font-semibold">PPE:</span>
              <span className="text-muted-foreground">{ppe.map(ppeLabel).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Expanded section */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-border pt-3">

            {/* Alternatives — shown first when chemical is blocked */}
            {isBlocked && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Suitable alternatives
                </p>
                {isLoadingAlternatives && (
                  <p className="text-xs text-muted-foreground">Checking available alternatives...</p>
                )}
                {!isLoadingAlternatives && alternatives && alternatives.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No compliant alternatives of the same type on file. Add one or update this chemical's MSDS.
                  </p>
                )}
                {!isLoadingAlternatives && alternatives && alternatives.length > 0 && (
                  <div className="space-y-2">
                    {alternatives.map(alt => (
                      <div key={alt.id} className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 px-3 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{alt.name}</span>
                          {complianceBadge(alt.complianceStatus)}
                          {alt.dilutionRatio && (
                            <span className="text-xs text-muted-foreground">
                              <span className="font-medium">Dilute:</span> {alt.dilutionRatio}
                            </span>
                          )}
                          {alt.ppeRequired && (
                            <span className="text-xs text-muted-foreground">
                              <span className="font-medium">PPE:</span> {ppeList(alt.ppeRequired).map(ppeLabel).join(", ")}
                            </span>
                          )}
                        </div>
                        {alt.notes && (
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1">{alt.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {hasSop && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Instructions</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{chemical.sopInstructions}</p>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {hasMsds ? (
                <a
                  href={chemical.msdsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View MSDS / SDS
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  No MSDS on file
                </span>
              )}
              {chemical.msdsExpiryDate && (
                <span className="text-xs text-muted-foreground">Expires: {chemical.msdsExpiryDate}</span>
              )}
              {chemical.msdsVersion && (
                <span className="text-xs text-muted-foreground">v{chemical.msdsVersion}</span>
              )}
            </div>
            {chemical.notes && (
              <p className="text-xs text-muted-foreground">{chemical.notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CompliancePage() {
  const { activeVenueId } = useVenueStore();
  const { data: roleData } = useVenueRole();
  const canManage = roleData?.canManage ?? false;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showDialog, setShowDialog] = useState(false);
  const [editingChemical, setEditingChemical] = useState<Chemical | null>(null);
  const [form, setForm] = useState<ChemicalForm>(emptyForm());
  const [activeTab, setActiveTab] = useState<"chemicals" | "tasks">("chemicals");

  const { data: chemicals, isLoading: isLoadingChemicals } = useListChemicals(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListChemicalsQueryKey(activeVenueId as number) } },
  );

  const { data: complianceTasks, isLoading: isLoadingTasks } = useListComplianceTasks(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId && canManage, queryKey: getListComplianceTasksQueryKey(activeVenueId as number) } },
  );

  const createChemical = useCreateChemical();
  const updateChemical = useUpdateChemical();
  const deleteChemical = useDeleteChemical();
  const resolveTask = useResolveComplianceTask();

  const pendingTasks = complianceTasks?.filter(t => t.status === "pending") ?? [];
  const activeChemicals = chemicals?.filter(c => c.isActive) ?? [];
  const inactiveChemicals = chemicals?.filter(c => !c.isActive) ?? [];

  // Count compliance issues
  const issueCount = activeChemicals.filter(c => c.complianceStatus !== "VALID").length;

  function openNew() {
    setEditingChemical(null);
    setForm(emptyForm());
    setShowDialog(true);
  }

  function openEdit(c: Chemical) {
    setEditingChemical(c);
    setForm({
      name: c.name,
      type: c.type,
      dilutionRatio: c.dilutionRatio ?? "",
      contactTimeSeconds: c.contactTimeSeconds ? String(c.contactTimeSeconds) : "",
      ppeRequired: ppeList(c.ppeRequired),
      sopInstructions: c.sopInstructions ?? "",
      msdsUrl: c.msdsUrl ?? "",
      msdsExpiryDate: c.msdsExpiryDate ?? "",
      msdsVersion: c.msdsVersion ?? "",
      notes: c.notes ?? "",
    });
    setShowDialog(true);
  }

  function togglePpe(val: string) {
    setForm(f => ({
      ...f,
      ppeRequired: f.ppeRequired.includes(val)
        ? f.ppeRequired.filter(p => p !== val)
        : [...f.ppeRequired, val],
    }));
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListChemicalsQueryKey(activeVenueId as number) });
    queryClient.invalidateQueries({ queryKey: getListComplianceTasksQueryKey(activeVenueId as number) });
  }

  function buildInput(): ChemicalInput {
    return {
      name: form.name,
      type: form.type,
      dilutionRatio: form.dilutionRatio || null,
      contactTimeSeconds: form.contactTimeSeconds ? parseInt(form.contactTimeSeconds) : null,
      ppeRequired: form.ppeRequired.length > 0 ? form.ppeRequired.join(",") : null,
      sopInstructions: form.sopInstructions || null,
      msdsUrl: form.msdsUrl || null,
      msdsExpiryDate: form.msdsExpiryDate || null,
      msdsVersion: form.msdsVersion || null,
      notes: form.notes || null,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVenueId || !form.name.trim()) return;

    if (editingChemical) {
      updateChemical.mutate(
        { venueId: activeVenueId, chemicalId: editingChemical.id, data: buildInput() },
        {
          onSuccess: () => { toast({ title: "Chemical updated" }); invalidate(); setShowDialog(false); },
          onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    } else {
      createChemical.mutate(
        { venueId: activeVenueId, data: buildInput() },
        {
          onSuccess: () => { toast({ title: "Chemical added" }); invalidate(); setShowDialog(false); },
          onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        },
      );
    }
  }

  function handleDeactivate() {
    if (!activeVenueId || !editingChemical) return;
    deleteChemical.mutate(
      { venueId: activeVenueId, chemicalId: editingChemical.id },
      {
        onSuccess: () => { toast({ title: "Chemical deactivated" }); invalidate(); setShowDialog(false); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      },
    );
  }

  function handleResolve(taskId: number) {
    if (!activeVenueId) return;
    resolveTask.mutate(
      { venueId: activeVenueId, taskId },
      {
        onSuccess: () => { toast({ title: "Task resolved" }); invalidate(); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      },
    );
  }

  if (!activeVenueId) return <div className="text-center p-8">Select a venue first.</div>;

  return (
    <div className="space-y-5 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Chemical Safety
          </h1>
          <p className="text-muted-foreground mt-1">
            Dilution ratios, PPE requirements, and safety data sheets for every product in your kitchen.
          </p>
        </div>
        {canManage && (
          <Button onClick={openNew} className="gap-2 self-start md:self-auto">
            <Plus className="w-4 h-4" />
            Add Chemical
          </Button>
        )}
      </div>

      <ComplianceSummaryWidget venueId={activeVenueId} />

      {/* Compliance alert banner */}
      {canManage && issueCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              {issueCount} chemical{issueCount !== 1 ? "s" : ""} with compliance issues
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Missing or expired MSDS/SDS documents need attention.
              {pendingTasks.length > 0 && ` ${pendingTasks.length} action${pendingTasks.length !== 1 ? "s" : ""} pending.`}
            </p>
            {pendingTasks.length > 0 && (
              <button
                onClick={() => setActiveTab("tasks")}
                className="text-xs font-semibold text-amber-800 underline mt-1"
              >
                View compliance tasks
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs (admin only sees Tasks tab) */}
      {canManage && (
        <div className="flex gap-1 border-b border-border">
          {(["chemicals", "tasks"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "chemicals" ? "Chemicals" : (
                <span className="flex items-center gap-1.5">
                  Compliance Tasks
                  {pendingTasks.length > 0 && (
                    <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {pendingTasks.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Chemicals tab */}
      {activeTab === "chemicals" && (
        <div className="space-y-4">
          {isLoadingChemicals ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : activeChemicals.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                  <FlaskConical className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No chemicals on file</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Add the cleaning products and chemicals your team uses daily — dilution ratios, PPE, and safety sheets in one place.
                </p>
                {canManage && (
                  <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add first chemical</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeChemicals.map(c => (
                <ChemicalCard key={c.id} chemical={c} venueId={activeVenueId as number} onEdit={() => openEdit(c)} canManage={canManage} />
              ))}
              {inactiveChemicals.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                    {inactiveChemicals.length} inactive chemical{inactiveChemicals.length !== 1 ? "s" : ""}
                  </summary>
                  <div className="space-y-2 mt-2">
                    {inactiveChemicals.map(c => (
                      <ChemicalCard key={c.id} chemical={c} venueId={activeVenueId as number} onEdit={() => openEdit(c)} canManage={canManage} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compliance tasks tab (admin only) */}
      {activeTab === "tasks" && canManage && (
        <div className="space-y-3">
          {isLoadingTasks ? (
            <Skeleton className="h-20 w-full" />
          ) : pendingTasks.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Check className="w-10 h-10 text-green-500 mb-3" />
                <h3 className="font-bold text-foreground mb-1">All compliance tasks resolved</h3>
                <p className="text-sm text-muted-foreground">Your chemical safety documentation is up to date.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                These tasks were auto-generated from chemicals with missing or expired MSDS documents.
              </p>
              {pendingTasks.map(task => (
                <Card key={task.id} className="border-border">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{task.title}</p>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(task.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 gap-1.5"
                      disabled={resolveTask.isPending}
                      onClick={() => handleResolve(task.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Resolve
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {complianceTasks?.filter(t => t.status === "resolved").map(task => (
                <Card key={task.id} className="border-border opacity-50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground line-through">{task.title}</p>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Add/Edit dialog */}
      {canManage && (
        <Dialog open={showDialog} onOpenChange={open => { if (!open) setShowDialog(false); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingChemical ? "Edit Chemical" : "Add Chemical"}</DialogTitle>
              <DialogDescription>
                {editingChemical
                  ? "Update the safety information for this chemical."
                  : "Add a cleaning product or chemical used in your kitchen."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diversey Suma Star D1" required />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHEMICAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Dilution ratio</Label>
                  <Input value={form.dilutionRatio} onChange={e => setForm({ ...form, dilutionRatio: e.target.value })} placeholder="e.g. 1:100" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact time (seconds)</Label>
                  <Input type="number" min="0" value={form.contactTimeSeconds} onChange={e => setForm({ ...form, contactTimeSeconds: e.target.value })} placeholder="e.g. 60" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>PPE required</Label>
                <div className="flex gap-2 flex-wrap">
                  {PPE_OPTIONS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => togglePpe(p.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                        form.ppeRequired.includes(p.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Step-by-step instructions (SOP)</Label>
                <Textarea
                  value={form.sopInstructions}
                  onChange={e => setForm({ ...form, sopInstructions: e.target.value })}
                  placeholder="1. Dilute at 1:100 with cold water&#10;2. Apply to surface&#10;3. Leave for 60 seconds&#10;4. Wipe with clean cloth"
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label>MSDS / SDS link</Label>
                <Input
                  type="url"
                  value={form.msdsUrl}
                  onChange={e => setForm({ ...form, msdsUrl: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Link to the manufacturer's Safety Data Sheet PDF.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>MSDS expiry date</Label>
                  <Input type="date" value={form.msdsExpiryDate} onChange={e => setForm({ ...form, msdsExpiryDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>MSDS version</Label>
                  <Input value={form.msdsVersion} onChange={e => setForm({ ...form, msdsVersion: e.target.value })} placeholder="e.g. 3.0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Suitable substitute for BleachPro until MSDS is renewed" />
              </div>
              <div className="flex gap-2 justify-between pt-1">
                {editingChemical && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleDeactivate} disabled={deleteChemical.isPending}>
                    <X className="w-4 h-4 mr-1" />Deactivate
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button type="submit" disabled={createChemical.isPending || updateChemical.isPending}>
                    {(createChemical.isPending || updateChemical.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingChemical ? "Save changes" : "Add chemical"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
