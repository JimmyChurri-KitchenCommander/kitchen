import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { StepTechniqueHints } from "@/components/TechniqueExplainer";
import { useApprenticeStore } from "@/stores/apprenticeModeStore";
import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import {
  useListPrepTasks,
  useListArchivedPrepTasks,
  useCreatePrepTask,
  useUpdatePrepTask,
  useDeletePrepTask,
  useArchivePrepTask,
  useRestorePrepTask,
  useListVenueStaff,
  useCreateVenueStaff,
  useDeleteVenueStaff,
  useScanPrepListImage,
  useDeferPrepTask,
  useListRecipes,
  useGetVenue,
  getListPrepTasksQueryKey,
  getListArchivedPrepTasksQueryKey,
  getListVenueStaffQueryKey,
  getListRecipesQueryKey,
  getGetVenueQueryKey,
  useListPrepLibraryTasks,
  useCreatePrepLibraryTask,
  useUpdatePrepLibraryTask,
  useDeletePrepLibraryTask,
  useApprovePrepLibraryTask,
  useRejectPrepLibraryTask,
  useClaimPrepTask,
  useBuildPrepList,
  useGetBuildSuggestions,
  useQuickAddPrepTask,
  useListPendingPrepLibraryTasks,
  useGetBookingNotes,
  useUpdateBookingNotes,
  useGetPrepLibraryTaskReactivationChecklist,
  getListPrepLibraryTasksQueryKey,
  getGetBookingNotesQueryKey,
  getListPendingPrepLibraryTasksQueryKey,
  getGetBuildSuggestionsQueryKey,
  useSuggestPrepInstructions,
} from "@workspace/api-client-react";
import { useServiceCountdown } from "@/hooks/useServiceCountdown";
import type {
  PrepTask, PrepTaskInput, SuggestedPrepTask, PrepListNote, PrepListClarification,
  PrepLibraryTask, PrepLibraryTaskInput, BuildSuggestionsResponse,
  PrepLibraryTaskReactivationChecklist,
} from "@workspace/api-client-react";
import type {
  PrepTaskInputStatus,
  PrepTaskInputCategory,
  PrepTaskInputShift,
  PrepTaskInputPriority,
  PrepTaskInputSection,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, UserPlus, X, Camera, Upload, Loader2, ChevronLeft, ChevronRight,
  CalendarDays, ChevronsRight, CheckCircle2, Circle, Clock, Archive, ArchiveRestore,
  ChefHat, ScrollText, Monitor, List, LayoutGrid, MoreVertical, Pencil, BookOpen,
  UserCheck, Check, Library, ClipboardList, AlertTriangle, Zap, Search, Timer, Power,
  Sparkles,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;
import { cn } from "@/lib/utils";
import { SwipeableRow } from "@/components/SwipeableRow";
import { useSignoffName } from "@/hooks/useSignoffName";
import { matchButcheryContext } from "@/data/butchery-reference";
import { matchKnifeSkill } from "@/data/knife-skills";

// ── Constants ────────────────────────────────────────────────────────────────

const SECTIONS = [
  { value: "hot_cook", label: "Hot / Cook", description: "Stove, oven, grill" },
  { value: "make", label: "Make", description: "Stocks, sauces, components" },
  { value: "cut", label: "Cut", description: "Butchery, portioning, knife work" },
  { value: "garde_manger", label: "Garde Manger", description: "Cold larder, salads, starters" },
  { value: "pastry", label: "Pastry", description: "Pastry, desserts, baking" },
  { value: "butchery", label: "Butchery", description: "Meat and protein breakdown" },
  { value: "seafood", label: "Seafood", description: "Fish and shellfish" },
  { value: "other", label: "Other", description: "Everything else" },
] as const;

const CATEGORIES = [
  { value: "meat", label: "Meat" },
  { value: "fish", label: "Fish" },
  { value: "veg", label: "Veg" },
  { value: "sauce", label: "Sauce" },
  { value: "pastry", label: "Pastry" },
  { value: "bakery", label: "Bakery" },
  { value: "garnish", label: "Garnish" },
  { value: "other", label: "Other" },
];

const SHIFTS = [
  { value: "all_day", label: "All Day" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const SECTION_COLORS: Record<string, string> = {
  hot_cook: "border-t-red-500",
  make: "border-t-amber-500",
  cut: "border-t-blue-500",
  garde_manger: "border-t-green-500",
  pastry: "border-t-pink-400",
  butchery: "border-t-rose-700",
  seafood: "border-t-cyan-500",
  other: "border-t-slate-400",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string { return d.toISOString().slice(0, 10); }

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return toDateString(d);
}

function formatDateHeading(dateStr: string): { dayName: string; dateLabel: string } {
  const d = new Date(dateStr + "T00:00:00Z");
  const today = toDateString(new Date());
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const dayName = dateStr === today ? "Today" : dateStr === tomorrow ? "Tomorrow" : dateStr === yesterday ? "Yesterday"
    : d.toLocaleDateString("en-AU", { weekday: "long", timeZone: "UTC" });
  const dateLabel = d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return { dayName, dateLabel };
}

function priorityDot(priority: string) {
  if (priority === "high") return "bg-red-500";
  if (priority === "medium") return "bg-amber-400";
  return "bg-slate-300";
}

function categoryColor(category: string) {
  const map: Record<string, string> = {
    meat: "bg-red-100 text-red-700", fish: "bg-blue-100 text-blue-700",
    veg: "bg-green-100 text-green-700", sauce: "bg-amber-100 text-amber-700",
    pastry: "bg-purple-100 text-purple-700", bakery: "bg-orange-100 text-orange-700",
    garnish: "bg-teal-100 text-teal-700", other: "bg-slate-100 text-slate-600",
  };
  return map[category] ?? "bg-slate-100 text-slate-600";
}

const emptyForm = (overrides?: Partial<PrepTaskInput>): PrepTaskInput => ({
  title: "", description: "", category: "other" as PrepTaskInputCategory,
  section: "other" as PrepTaskInputSection, shift: "all_day" as PrepTaskInputShift,
  assignedTo: "", priority: "medium" as PrepTaskInputPriority, status: "todo" as PrepTaskInputStatus,
  notes: "", prepDate: toDateString(new Date()), recipeId: undefined, estimatedDurationMinutes: undefined, isCritical: false, ...overrides,
});

type LibraryForm = {
  title: string; description: string; category: string; section: string;
  shift: string; priority: string; quantity: string; unit: string;
  batchSize: string; notes: string; estimatedMinutes: string; recipeId?: number;
  status: string;
  quickInstructions: string; imageUrl: string; trainingTags: string;
};

const emptyLibraryForm = (): LibraryForm => ({
  title: "", description: "", category: "other", section: "other",
  shift: "all_day", priority: "medium", quantity: "", unit: "",
  batchSize: "", notes: "", estimatedMinutes: "", status: "active",
  quickInstructions: "", imageUrl: "", trainingTags: "",
});

const TRAINING_TAG_OPTIONS = [
  { value: "training_friendly", label: "Training friendly" },
  { value: "senior_required", label: "Senior required" },
  { value: "critical_task", label: "Critical task" },
];

function trainingTagLabel(v: string): string {
  return TRAINING_TAG_OPTIONS.find(t => t.value === v)?.label ?? v;
}

function parseTrainingTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task, staff, onEdit, onStatusCycle, onClaim, onDefer, onArchive, onDelete, canManage = true, serviceWarning = false,
}: {
  task: PrepTask;
  staff: Array<{ id: number; name: string; role?: string | null }>;
  onEdit: () => void;
  onStatusCycle: () => void;
  onClaim: () => void;
  onDefer: () => void;
  onArchive: () => void;
  onDelete: () => void;
  canManage?: boolean;
  serviceWarning?: boolean;
}) {
  const { apprenticeMode } = useApprenticeStore();
  const isDone = task.status === "done";
  const isInProgress = task.status === "in_progress";
  const isUrgent = task.priority === "high" && !isDone;
  const isPrePlanned = task.createdAt.slice(0, 10) < task.prepDate && !isDone;

  return (
    <div className={cn(
      "group bg-card border border-border rounded-lg p-3 shadow-sm transition-all",
      isDone && "opacity-60",
      isUrgent && "border-red-200 bg-red-50/20 dark:bg-red-950/20",
      serviceWarning && !isDone && "border-red-400 bg-red-50/40 dark:bg-red-950/40",
    )}>
      <div className="flex items-start gap-2.5">
        {/* Status toggle */}
        <button onClick={onStatusCycle} className="flex-shrink-0 p-2.5 -m-2.5 rounded-lg hover:bg-secondary/70 active:bg-secondary transition-colors touch-manipulation">
          {isDone ? <CheckCircle2 className="w-5 h-5 text-status-healthy" />
            : isInProgress ? <Clock className="w-5 h-5 text-primary" />
            : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
        </button>

        {/* Priority dot */}
        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", priorityDot(task.priority))} />

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <p className={cn("text-sm font-semibold leading-tight text-foreground", isDone && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", categoryColor(task.category))}>
              {CATEGORIES.find(c => c.value === task.category)?.label ?? task.category}
            </span>
            {(task.quantity != null || task.unit) && (
              <span className="text-xs font-semibold text-foreground bg-secondary px-1.5 py-0.5 rounded">
                {task.quantity != null ? task.quantity : ""}{task.unit ? ` ${task.unit}` : ""}{task.batchSize ? ` — ${task.batchSize}` : ""}
              </span>
            )}
            {task.shift !== "all_day" && (
              <span className="text-xs text-muted-foreground">{SHIFTS.find(s => s.value === task.shift)?.label}</span>
            )}
            {isUrgent && <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-red-100 text-red-700 border border-red-200">Urgent</span>}
            {serviceWarning && !isDone && (
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5">
                <Timer className="w-3 h-3" />Won&apos;t finish in time
              </span>
            )}
            {isPrePlanned && <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-primary/10 text-primary">Pre-planned</span>}
            {task.deferredFrom && <span className="text-xs text-amber-600 font-medium">Deferred</span>}
            {task.recipeName && (
              <span className="text-xs text-primary flex items-center gap-0.5 font-medium">
                <ChefHat className="w-3 h-3" />{task.recipeName}
              </span>
            )}
          </div>
          {task.claimedBy && (
            <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />{task.claimedBy}
            </p>
          )}
          {!task.claimedBy && task.assignedTo && (
            <p className="text-xs text-muted-foreground mt-1">{task.assignedTo}</p>
          )}
          {(() => {
            const tags = parseTrainingTags(task.trainingTags);
            if (tags.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map(t => (
                  <span key={t} className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-semibold border",
                    t === "critical_task" ? "border-red-300 text-red-700 bg-red-50" :
                    t === "senior_required" ? "border-amber-300 text-amber-700 bg-amber-50" :
                    "border-emerald-300 text-emerald-700 bg-emerald-50",
                  )}>
                    {trainingTagLabel(t)}
                  </span>
                ))}
              </div>
            );
          })()}
          {(task.quickInstructions || task.imageUrl || task.recipeMethod) && (
            <details className="mt-2" onClick={e => e.stopPropagation()}>
              <summary className="text-xs text-primary cursor-pointer select-none flex items-center gap-1 hover:underline">
                <ScrollText className="w-3 h-3" />How to
              </summary>
              <div className="mt-1.5 space-y-2">
                {task.quickInstructions && (
                  <div className="border-l-2 border-primary/40 pl-2">
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {task.quickInstructions}
                    </p>
                    {apprenticeMode && (
                      <StepTechniqueHints stepText={task.quickInstructions} apprenticeMode={apprenticeMode} className="mt-1.5" />
                    )}
                  </div>
                )}
                {task.imageUrl && (
                  <img
                    src={task.imageUrl}
                    alt={task.title}
                    className="max-h-32 w-auto rounded-md border border-border"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                {task.recipeMethod && (
                  <div className="border-l-2 border-primary/30 pl-2">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {task.recipeMethod}
                    </p>
                    {apprenticeMode && (
                      <StepTechniqueHints stepText={task.recipeMethod} apprenticeMode={apprenticeMode} className="mt-1.5" />
                    )}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Claim + overflow actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Claim button */}
          {!isDone && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaim(); }}
              title={task.claimedBy ? "Change or release claim" : "Claim this task"}
              className={cn(
                "p-2 rounded-md transition-colors touch-manipulation text-xs",
                task.claimedBy
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}
          {/* Overflow menu for admin actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors touch-manipulation">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-3.5 h-3.5 mr-2" />Edit task
              </DropdownMenuItem>
              {!isDone && (
                <DropdownMenuItem onClick={onDefer}>
                  <ChevronsRight className="w-3.5 h-3.5 mr-2" />Defer to tomorrow
                </DropdownMenuItem>
              )}
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="w-3.5 h-3.5 mr-2" />Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ── Library Task Card ─────────────────────────────────────────────────────────

const LIBRARY_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:           { label: "Active",   cls: "bg-green-100 text-green-700" },
  inactive:         { label: "Inactive", cls: "bg-slate-100 text-slate-600" },
  seasonal:         { label: "Seasonal", cls: "bg-blue-100 text-blue-700" },
  waiting_approval: { label: "Pending",  cls: "bg-amber-100 text-amber-700" },
  archived:         { label: "Archived", cls: "bg-slate-100 text-slate-500" },
};

function LibraryTaskCard({
  task, onEdit, onArchive, onRestore, onActivate, canManage, showStatusBadge,
}: {
  task: PrepLibraryTask;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onActivate?: () => void;
  canManage?: boolean;
  showStatusBadge?: boolean;
}) {
  const badge = LIBRARY_STATUS_BADGE[task.status];
  const isArchived = task.status === "archived";
  const isInactive = task.status === "inactive";
  // Non-admins see the library in read-only mode; only admins can open the edit dialog
  const isClickable = canManage && !isArchived;
  return (
    <div className={cn("group bg-card border border-border rounded-lg p-3 shadow-sm", isArchived && "opacity-60", isInactive && "opacity-70")}>
      <div className="flex items-start gap-2.5">
        <div className={cn("flex-1 min-w-0", isClickable && "cursor-pointer")} onClick={isClickable ? onEdit : undefined}>
          <p className="text-sm font-semibold leading-tight text-foreground">{task.title}</p>
          {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {showStatusBadge && badge && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide", badge.cls)}>
                {badge.label}
              </span>
            )}
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", categoryColor(task.category))}>
              {CATEGORIES.find(c => c.value === task.category)?.label ?? task.category}
            </span>
            {(task.quantity != null || task.unit) && (
              <span className="text-xs font-semibold text-foreground bg-secondary px-1.5 py-0.5 rounded">
                {task.quantity != null ? task.quantity : ""}{task.unit ? ` ${task.unit}` : ""}{task.batchSize ? ` — ${task.batchSize}` : ""}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="text-xs text-muted-foreground">{task.estimatedMinutes}min</span>
            )}
            {task.recipeName && (
              <span className="text-xs text-primary flex items-center gap-0.5 font-medium">
                <ChefHat className="w-3 h-3" />{task.recipeName}
              </span>
            )}
            {task.approvedUntil && (
              <span className="text-xs text-amber-600">Temp until {new Date(task.approvedUntil).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onRestore ? (
              <button onClick={onRestore} title="Restore to library"
                className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                <ArchiveRestore className="w-3.5 h-3.5" />
              </button>
            ) : onActivate ? (
              <button onClick={onActivate} title="Activate task"
                className="p-2 rounded-md text-muted-foreground hover:text-status-healthy hover:bg-green-500/10 transition-colors">
                <Power className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button onClick={onEdit}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {onArchive && (
                  <button onClick={onArchive} title="Remove from library"
                    className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function ReactivationChecklistDialog({ task, venueId, onClose, onConfirm }: {
  task: PrepLibraryTask;
  venueId: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { data: checklist, isLoading } = useGetPrepLibraryTaskReactivationChecklist(venueId, task.id);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reactivate: {task.title}</DialogTitle>
          <DialogDescription>Check the following before putting this task back on the board.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : checklist ? (
          <div className="space-y-3 py-2">
            {checklist.linkedRecipe && (
              <div className={cn(
                "flex items-start gap-3 rounded-md p-3 border text-sm",
                checklist.linkedRecipe.status === "active"
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              )}>
                <ChefHat className={cn(
                  "w-4 h-4 mt-0.5 flex-shrink-0",
                  checklist.linkedRecipe.status === "active" ? "text-status-healthy" : "text-amber-500"
                )} />
                <div>
                  <p className="font-medium text-foreground">{checklist.linkedRecipe.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Recipe is {checklist.linkedRecipe.status}
                    {checklist.linkedRecipe.status !== "active" && " — activate the recipe first"}
                  </p>
                </div>
              </div>
            )}
            {checklist.linkedInventoryItem && (
              <div className={cn(
                "flex items-start gap-3 rounded-md p-3 border text-sm",
                checklist.linkedInventoryItem.currentStock >= checklist.linkedInventoryItem.parLevel
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              )}>
                <AlertTriangle className={cn(
                  "w-4 h-4 mt-0.5 flex-shrink-0",
                  checklist.linkedInventoryItem.currentStock >= checklist.linkedInventoryItem.parLevel
                    ? "text-status-healthy"
                    : "text-amber-500"
                )} />
                <div>
                  <p className="font-medium text-foreground">{checklist.linkedInventoryItem.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {checklist.linkedInventoryItem.currentStock.toFixed(1)} in stock — par {checklist.linkedInventoryItem.parLevel.toFixed(1)}
                    {checklist.linkedInventoryItem.currentStock < checklist.linkedInventoryItem.parLevel
                      ? " (below par)"
                      : " (ok)"}
                  </p>
                </div>
              </div>
            )}
            {checklist.suggestedQuantityUpdate && (
              <p className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-3">
                Review this task's quantity — stock levels may have changed since it was last active.
              </p>
            )}
          </div>
        ) : null}
        <div className="flex gap-2 pt-2">
          <Button onClick={onConfirm} className="flex-1 font-semibold">
            <Power className="w-3.5 h-3.5 mr-1.5" /> Confirm Activate
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PrepBoardPage() {
  const { activeVenueId } = useVenueStore();
  const { data: roleData } = useVenueRole();
  const canManage = roleData?.canManage ?? true;
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  // ── Page mode ──────────────────────────────────────────────────────────────
  const [pageMode, setPageMode] = useState<"board" | "library">("board");

  // ── Service Priority Mode ──────────────────────────────────────────────────
  const [servicePriorityMode, setServicePriorityMode] = useState(false);

  // ── Board state ────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<PrepTask | null>(null);
  const [form, setForm] = useState<PrepTaskInput>(emptyForm({ prepDate: selectedDate }));
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplateTasks, setSelectedTemplateTasks] = useState<Set<number>>(new Set());
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);
  const [showArchivedPanel, setShowArchivedPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"sections" | "list" | "service">("sections");
  const prevDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const { dayName, dateLabel } = formatDateHeading(selectedDate);

  // Photo scan
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const [scannedTasks, setScannedTasks] = useState<SuggestedPrepTask[]>([]);
  const [selectedScanTasks, setSelectedScanTasks] = useState<Set<number>>(new Set());
  const [isImportingScan, setIsImportingScan] = useState(false);
  const [scanNotes, setScanNotes] = useState<PrepListNote[]>([]);
  const [scanClarifications, setScanClarifications] = useState<PrepListClarification[]>([]);
  const [clarificationChoices, setClarificationChoices] = useState<Record<number, string[]>>({});
  const [showPlanAheadDialog, setShowPlanAheadDialog] = useState(false);

  // ── Claim dialog ───────────────────────────────────────────────────────────
  const [claimingTask, setClaimingTask] = useState<PrepTask | null>(null);
  const [claimName, setClaimName] = useState("");
  const { name: signoffName, setName: setSignoffName } = useSignoffName();
  const [pendingSwipe, setPendingSwipe] = useState<{ task: PrepTask; action: "claim" | "complete" } | null>(null);
  const [pendingSwipeName, setPendingSwipeName] = useState("");

  // ── Build Prep List dialog ─────────────────────────────────────────────────
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [buildSelected, setBuildSelected] = useState<Set<number>>(new Set());
  const [buildQuantities, setBuildQuantities] = useState<Record<number, { quantity: string; unit: string }>>({});
  const [buildBrowseSearch, setBuildBrowseSearch] = useState("");

  // ── Quick Add dialog ───────────────────────────────────────────────────────
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ title: "", section: "other", category: "other", priority: "medium", addToLibrary: true, quantity: "", unit: "" });

  // ── Library state ──────────────────────────────────────────────────────────
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [editingLibraryTask, setEditingLibraryTask] = useState<PrepLibraryTask | null>(null);
  const [reactivationTask, setReactivationTask] = useState<PrepLibraryTask | null>(null);
  const [libraryForm, setLibraryForm] = useState<LibraryForm>(emptyLibraryForm());
  const [libraryStatusFilter, setLibraryStatusFilter] = useState("all");
  const [librarySearch, setLibrarySearch] = useState("");

  // ── Booking notes ──────────────────────────────────────────────────────────
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesEditValue, setNotesEditValue] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: tasks = [], isLoading } = useListPrepTasks(
    activeVenueId ?? 0, { date: selectedDate },
    { query: { enabled: !!activeVenueId, queryKey: getListPrepTasksQueryKey(activeVenueId ?? 0, { date: selectedDate }), refetchInterval: 15000 } }
  );

  const { data: prevTasks = [] } = useListPrepTasks(
    activeVenueId ?? 0, { date: prevDate },
    { query: { enabled: !!activeVenueId && showTemplateDialog, queryKey: getListPrepTasksQueryKey(activeVenueId ?? 0, { date: prevDate }) } }
  );

  const { data: nextTasks = [], isLoading: isLoadingNextTasks } = useListPrepTasks(
    activeVenueId ?? 0, { date: nextDate },
    { query: { enabled: !!activeVenueId && showPlanAheadDialog, queryKey: getListPrepTasksQueryKey(activeVenueId ?? 0, { date: nextDate }) } }
  );

  const { data: staff = [] } = useListVenueStaff(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId, queryKey: getListVenueStaffQueryKey(activeVenueId ?? 0) },
  });

  const { data: archivedTasks = [] } = useListArchivedPrepTasks(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId && showArchivedPanel, queryKey: getListArchivedPrepTasksQueryKey(activeVenueId ?? 0) },
  });

  const { data: recipes = [] } = useListRecipes(activeVenueId ?? 0, undefined, {
    query: { enabled: !!activeVenueId && (showTaskDialog || showLibraryDialog), queryKey: getListRecipesQueryKey(activeVenueId ?? 0) },
  });

  const { data: libraryTasks = [] } = useListPrepLibraryTasks(activeVenueId ?? 0, undefined, {
    query: { enabled: !!activeVenueId, queryKey: getListPrepLibraryTasksQueryKey(activeVenueId ?? 0) },
  });

  // Separate query for archived tasks — only fetched when that filter tab is active
  const { data: archivedLibraryTasks = [] } = useListPrepLibraryTasks(
    activeVenueId ?? 0,
    { status: "archived" } as Parameters<typeof useListPrepLibraryTasks>[1],
    { query: { enabled: !!activeVenueId && libraryStatusFilter === "archived", queryKey: getListPrepLibraryTasksQueryKey(activeVenueId ?? 0, { status: "archived" }) } },
  );

  const { data: pendingLibraryFromApi = [] } = useListPendingPrepLibraryTasks(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId && canManage, queryKey: getListPendingPrepLibraryTasksQueryKey(activeVenueId ?? 0) },
  });

  const { data: buildSuggestions, isLoading: isBuildSuggestionsLoading } = useGetBuildSuggestions(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId && showBuildDialog, queryKey: getGetBuildSuggestionsQueryKey(activeVenueId ?? 0) },
  });

  const { data: bookingNote } = useGetBookingNotes(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId, queryKey: getGetBookingNotesQueryKey(activeVenueId ?? 0) },
  });

  const { data: venueData } = useGetVenue(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId, queryKey: getGetVenueQueryKey(activeVenueId ?? 0) },
  });
  const serviceCountdown = useServiceCountdown(venueData?.serviceWindows);
  const v2Enabled = !!(venueData?.serviceModeConfig as { v2Enabled?: boolean } | null | undefined)?.v2Enabled;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const invalidate = () => qc.invalidateQueries({ queryKey: getListPrepTasksQueryKey(activeVenueId ?? 0, { date: selectedDate }) });
  const invalidateLibrary = () => qc.invalidateQueries({ queryKey: getListPrepLibraryTasksQueryKey(activeVenueId ?? 0) });

  const createTask = useCreatePrepTask({ mutation: { onSuccess: () => { invalidate(); setShowTaskDialog(false); } } });
  const updateTask = useUpdatePrepTask({ mutation: { onSuccess: () => { invalidate(); setShowTaskDialog(false); } } });
  const deleteTask = useDeletePrepTask({ mutation: { onSuccess: () => invalidate() } });
  const deferTask = useDeferPrepTask({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Deferred to tomorrow" }); } } });
  const archiveTask = useArchivePrepTask({ mutation: { onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: getListArchivedPrepTasksQueryKey(activeVenueId ?? 0) }); } } });
  const restoreTask = useRestorePrepTask({ mutation: { onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: getListArchivedPrepTasksQueryKey(activeVenueId ?? 0) }); toast({ title: "Task restored to board" }); } } });
  const createStaff = useCreateVenueStaff({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListVenueStaffQueryKey(activeVenueId ?? 0) }); setNewStaffName(""); setNewStaffRole(""); } } });
  const deleteStaff = useDeleteVenueStaff({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListVenueStaffQueryKey(activeVenueId ?? 0) }) } });
  const scanMutation = useScanPrepListImage();
  const claimMutation = useClaimPrepTask({ mutation: { onSuccess: () => { invalidate(); setClaimingTask(null); } } });
  const buildListMutation = useBuildPrepList({ mutation: { onSuccess: () => { invalidate(); setShowBuildDialog(false); setBuildSelected(new Set()); setBuildQuantities({}); toast({ title: `Tasks added to ${dayName.toLowerCase()}'s board` }); } } });

  const createLibraryTask = useCreatePrepLibraryTask({ mutation: { onSuccess: () => { invalidateLibrary(); setShowLibraryDialog(false); toast({ title: "Added to library" }); } } });
  const updateLibraryTask = useUpdatePrepLibraryTask({ mutation: { onSuccess: () => { invalidateLibrary(); setShowLibraryDialog(false); toast({ title: "Library task updated" }); } } });
  const deleteLibraryTask = useDeletePrepLibraryTask({ mutation: { onSuccess: () => { invalidateLibrary(); toast({ title: "Removed from library" }); } } });
  const approveLibraryTask = useApprovePrepLibraryTask({ mutation: { onSuccess: () => {
    invalidateLibrary();
    qc.invalidateQueries({ queryKey: getListPendingPrepLibraryTasksQueryKey(activeVenueId ?? 0) });
    toast({ title: "Task approved" });
  } } });
  const rejectLibraryTask = useRejectPrepLibraryTask({ mutation: { onSuccess: () => {
    invalidateLibrary();
    qc.invalidateQueries({ queryKey: getListPendingPrepLibraryTasksQueryKey(activeVenueId ?? 0) });
    toast({ title: "Task rejected" });
  } } });
  const quickAddMutation = useQuickAddPrepTask({ mutation: { onSuccess: (data) => {
    invalidate();
    invalidateLibrary();
    setShowQuickAddDialog(false);
    setQuickAddForm({ title: "", section: "other", category: "other", priority: "medium", addToLibrary: true, quantity: "", unit: "" });
    if (data.pendingLibraryApproval) {
      toast({ title: "Task added to today's board", description: "Queued for library approval — an admin will review it shortly." });
    } else {
      toast({ title: "Task added to today's board" });
    }
  } } });

  const updateNotesMutation = useUpdateBookingNotes({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetBookingNotesQueryKey(activeVenueId ?? 0) }); setIsEditingNotes(false); } } });

  const suggestInstructionsMutation = useSuggestPrepInstructions({ mutation: {
    onError: () => { toast({ title: "Couldn't generate instructions", description: "Try again or write them manually.", variant: "destructive" }); },
  } });

  function handleSuggestForTaskForm() {
    if (!activeVenueId || !form.title) return;
    suggestInstructionsMutation.mutate(
      { venueId: activeVenueId, data: { title: form.title, category: form.category ?? undefined, quantity: form.quantity ?? undefined, unit: form.unit ?? undefined } },
      { onSuccess: (data) => setForm(f => ({ ...f, notes: data.instructions })) }
    );
  }

  function handleSuggestForLibraryForm() {
    if (!activeVenueId || !libraryForm.title) return;
    suggestInstructionsMutation.mutate(
      { venueId: activeVenueId, data: { title: libraryForm.title, category: libraryForm.category ?? undefined } },
      { onSuccess: (data) => setLibraryForm(f => ({ ...f, quickInstructions: data.instructions })) }
    );
  }

  // ── Board handlers ─────────────────────────────────────────────────────────

  function openNew(defaults?: Partial<PrepTaskInput>) {
    setEditingTask(null);
    setForm(emptyForm({ prepDate: selectedDate, ...defaults }));
    setShowTaskDialog(true);
  }

  function openEdit(task: PrepTask) {
    setEditingTask(task);
    setForm({
      title: task.title, description: task.description ?? "", category: task.category as PrepTaskInputCategory,
      section: task.section as PrepTaskInputSection, shift: task.shift as PrepTaskInputShift,
      assignedTo: task.assignedTo ?? "", priority: task.priority as PrepTaskInputPriority,
      status: task.status as PrepTaskInputStatus, notes: task.notes ?? "", prepDate: task.prepDate,
      recipeId: task.recipeId ?? undefined,
      estimatedDurationMinutes: task.estimatedDurationMinutes ?? undefined,
      isCritical: task.isCritical ?? false,
    });
    setShowTaskDialog(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVenueId) return;
    const payload: PrepTaskInput = {
      ...form,
      description: form.description || undefined,
      assignedTo: form.assignedTo || undefined,
      notes: form.notes || undefined,
      prepDate: form.prepDate ?? selectedDate,
    };
    if (editingTask) {
      updateTask.mutate({ venueId: activeVenueId, taskId: editingTask.id, data: payload });
    } else {
      createTask.mutate({ venueId: activeVenueId, data: payload });
    }
  }

  function cycleStatus(task: PrepTask) {
    if (!activeVenueId) return;
    const next: Record<string, PrepTaskInputStatus> = { todo: "in_progress", in_progress: "done", done: "todo" };
    updateTask.mutate({ venueId: activeVenueId, taskId: task.id, data: { title: task.title, status: next[task.status] ?? "todo" } });
  }

  function handleDefer(task: PrepTask) {
    if (!activeVenueId) return;
    deferTask.mutate({ venueId: activeVenueId, taskId: task.id, data: {} });
  }

  function handleArchive(task: PrepTask) {
    if (!activeVenueId) return;
    archiveTask.mutate({ venueId: activeVenueId, taskId: task.id });
  }

  function handleRestore(task: PrepTask) {
    if (!activeVenueId) return;
    restoreTask.mutate({ venueId: activeVenueId, taskId: task.id });
  }

  function openClaim(task: PrepTask) {
    setClaimingTask(task);
    setClaimName(task.claimedBy ?? "");
  }

  function handleClaim() {
    if (!activeVenueId || !claimingTask) return;
    claimMutation.mutate({ venueId: activeVenueId, taskId: claimingTask.id, data: { claimedBy: claimName || null } });
  }

  function handleSwipeClaim(task: PrepTask) {
    if (!activeVenueId || task.status === "done") return;
    if (!signoffName) { setPendingSwipe({ task, action: "claim" }); setPendingSwipeName(""); return; }
    claimMutation.mutate(
      { venueId: activeVenueId, taskId: task.id, data: { claimedBy: signoffName } },
      { onSuccess: () => toast({ title: `Claimed by ${signoffName}` }) },
    );
  }

  function handleSwipeComplete(task: PrepTask) {
    if (!activeVenueId || task.status === "done") return;
    if (!signoffName) { setPendingSwipe({ task, action: "complete" }); setPendingSwipeName(""); return; }
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    updateTask.mutate(
      { venueId: activeVenueId, taskId: task.id, data: { title: task.title, status: "done" } },
      { onSuccess: () => toast({ title: `Done at ${time}`, description: `Signed off by ${signoffName}` }) },
    );
  }

  function executePendingSwipe() {
    if (!activeVenueId || !pendingSwipe) return;
    const name = pendingSwipeName.trim();
    if (!name) return;
    setSignoffName(name);
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (pendingSwipe.action === "claim") {
      claimMutation.mutate(
        { venueId: activeVenueId, taskId: pendingSwipe.task.id, data: { claimedBy: name } },
        { onSuccess: () => toast({ title: `Claimed by ${name}` }) },
      );
    } else {
      updateTask.mutate(
        { venueId: activeVenueId, taskId: pendingSwipe.task.id, data: { title: pendingSwipe.task.title, status: "done" } },
        { onSuccess: () => toast({ title: `Done at ${time}`, description: `Signed off by ${name}` }) },
      );
    }
    setPendingSwipe(null);
    setPendingSwipeName("");
  }

  // Template builder
  function openTemplateDialog() {
    setSelectedTemplateTasks(new Set());
    setShowTemplateDialog(true);
  }
  const prevTasksLoaded = prevTasks.length > 0;
  if (showTemplateDialog && prevTasksLoaded && selectedTemplateTasks.size === 0) {
    setSelectedTemplateTasks(new Set(prevTasks.filter(t => t.status !== "done").map(t => t.id)));
  }

  const handleImportTemplate = useCallback(async () => {
    if (!activeVenueId) return;
    setIsImportingTemplate(true);
    const toImport = prevTasks.filter(t => selectedTemplateTasks.has(t.id));
    for (const task of toImport) {
      await new Promise<void>((resolve) => {
        createTask.mutate(
          { venueId: activeVenueId, data: {
            title: task.title, description: task.description ?? undefined,
            category: task.category as PrepTaskInputCategory, section: task.section as PrepTaskInputSection,
            shift: task.shift as PrepTaskInputShift, priority: task.priority as PrepTaskInputPriority,
            status: "todo" as PrepTaskInputStatus, assignedTo: task.assignedTo ?? undefined, prepDate: selectedDate,
          }},
          { onSettled: () => resolve() }
        );
      });
    }
    setIsImportingTemplate(false);
    setShowTemplateDialog(false);
    invalidate();
    toast({ title: `${toImport.length} task${toImport.length !== 1 ? "s" : ""} added from previous list` });
  }, [activeVenueId, prevTasks, selectedTemplateTasks, selectedDate, createTask, toast]);

  // Build Prep List
  const activeLibraryTasks = libraryTasks.filter(t => t.status === "active");
  const pendingLibrary = pendingLibraryFromApi.length > 0 ? pendingLibraryFromApi : libraryTasks.filter(t => t.status === "waiting_approval");

  // All-status library view — basis for filter tabs
  const displayedLibraryTasks = (() => {
    const base = libraryStatusFilter === "archived" ? archivedLibraryTasks : libraryTasks;
    const byStatus = libraryStatusFilter === "all" || libraryStatusFilter === "archived"
      ? base
      : base.filter(t => t.status === libraryStatusFilter);
    if (!librarySearch.trim()) return byStatus;
    const q = librarySearch.toLowerCase();
    return byStatus.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false),
    );
  })();

  function openBuildDialog() {
    setBuildSelected(new Set());
    setBuildQuantities({});
    setBuildBrowseSearch("");
    setShowBuildDialog(true);
  }

  // Auto-apply defaults once when suggestions first arrive and nothing is selected yet.
  // Runs via useEffect to avoid calling setState during render.
  useEffect(() => {
    if (!showBuildDialog || !buildSuggestions) return;
    if (buildSelected.size === 0 && (buildSuggestions.standard.length > 0 || buildSuggestions.critical.length > 0)) {
      applyBuildDefaults(buildSuggestions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildSuggestions, showBuildDialog]);

  // Called after suggestions load — pre-select standard and critical suggested tasks
  function applyBuildDefaults(suggestions: BuildSuggestionsResponse) {
    const next = new Set<number>();
    const qty: Record<number, { quantity: string; unit: string }> = {};
    // Section B: all standard (active) tasks pre-selected
    for (const t of suggestions.standard) {
      next.add(t.id);
      qty[t.id] = { quantity: t.quantity != null ? String(t.quantity) : "", unit: t.unit ?? "" };
    }
    // Section A: pre-select suggested tasks for critical items
    for (const c of suggestions.critical) {
      if (c.suggestedTask && !next.has(c.suggestedTask.id)) {
        next.add(c.suggestedTask.id);
        qty[c.suggestedTask.id] = { quantity: c.suggestedTask.quantity != null ? String(c.suggestedTask.quantity) : "", unit: c.suggestedTask.unit ?? "" };
      }
    }
    setBuildSelected(next);
    setBuildQuantities(qty);
  }

  function handleBuildList() {
    if (!activeVenueId || buildSelected.size === 0) return;
    const items = [...buildSelected].map(id => {
      const qty = buildQuantities[id];
      return {
        libraryTaskId: id,
        quantity: qty?.quantity ? parseFloat(qty.quantity) : undefined,
        unit: qty?.unit || undefined,
      };
    });
    buildListMutation.mutate({ venueId: activeVenueId, data: { prepDate: selectedDate, items } });
  }

  // Photo scan
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVenueId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      setScanPreviewUrl(dataUrl); setScannedTasks([]); setSelectedScanTasks(new Set()); setShowScanDialog(true);
      scanMutation.mutate({ venueId: activeVenueId, data: { imageBase64: base64, mimeType } }, {
        onSuccess: (result) => {
          setScannedTasks(result.tasks ?? []); setSelectedScanTasks(new Set((result.tasks ?? []).map((_, i) => i)));
          setScanNotes((result.notes ?? []) as PrepListNote[]); setScanClarifications((result.clarifications ?? []) as PrepListClarification[]);
          const defaultChoices: Record<number, string[]> = {};
          ((result.clarifications ?? []) as PrepListClarification[]).forEach(c => { if (c.options[0]) defaultChoices[c.taskIndex] = [c.options[0]]; });
          setClarificationChoices(defaultChoices);
        },
        onError: () => { toast({ title: "Could not read the prep list", description: "Try a clearer photo with good lighting.", variant: "destructive" }); setShowScanDialog(false); },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [activeVenueId, scanMutation, toast]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVenueId) return;
    e.target.value = "";
    let base64: string; let dataUrl: string; let mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg";
    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { toast({ title: "Could not read PDF", variant: "destructive" }); return; }
        await page.render({ canvasContext: ctx, viewport } as unknown as Parameters<typeof page.render>[0]).promise;
        dataUrl = canvas.toDataURL("image/jpeg", 0.9); base64 = dataUrl.split(",")[1] ?? ""; mimeType = "image/jpeg";
      } catch { toast({ title: "Could not read PDF", variant: "destructive" }); return; }
    } else {
      const reader = new FileReader();
      const result = await new Promise<string>((resolve, reject) => { reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
      dataUrl = result; base64 = result.split(",")[1] ?? ""; mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
    }
    setScanPreviewUrl(dataUrl); setScannedTasks([]); setSelectedScanTasks(new Set()); setShowScanDialog(true);
    scanMutation.mutate({ venueId: activeVenueId, data: { imageBase64: base64, mimeType } }, {
      onSuccess: (result) => {
        setScannedTasks(result.tasks ?? []); setSelectedScanTasks(new Set((result.tasks ?? []).map((_, i) => i)));
        setScanNotes((result.notes ?? []) as PrepListNote[]); setScanClarifications((result.clarifications ?? []) as PrepListClarification[]);
        const defaultChoices: Record<number, string[]> = {};
        ((result.clarifications ?? []) as PrepListClarification[]).forEach(c => { if (c.options[0]) defaultChoices[c.taskIndex] = [c.options[0]]; });
        setClarificationChoices(defaultChoices);
      },
      onError: () => { toast({ title: "Could not read the prep list", variant: "destructive" }); setShowScanDialog(false); },
    });
  }, [activeVenueId, scanMutation, toast]);

  const handleImportScan = useCallback(async () => {
    if (!activeVenueId) return;
    setIsImportingScan(true);
    const toImport = scannedTasks.filter((_, i) => selectedScanTasks.has(i));
    for (let idx = 0; idx < toImport.length; idx++) {
      const task = toImport[idx]!;
      const originalIndex = scannedTasks.indexOf(task);
      const chosenTitles = clarificationChoices[originalIndex];
      const titlesToCreate = chosenTitles && chosenTitles.length > 0 ? chosenTitles : [task.title];
      for (const title of titlesToCreate) {
        await new Promise<void>((resolve) => {
          createTask.mutate(
            { venueId: activeVenueId, data: { title, description: task.description ?? undefined,
              category: task.category as PrepTaskInputCategory, section: (task.section ?? "other") as PrepTaskInputSection,
              shift: task.shift as PrepTaskInputShift, priority: task.priority as PrepTaskInputPriority,
              status: "todo" as PrepTaskInputStatus, prepDate: selectedDate } },
            { onSettled: () => resolve() }
          );
        });
      }
    }
    setIsImportingScan(false); setShowScanDialog(false); setScanPreviewUrl(null); setScanNotes([]); setScanClarifications([]); setClarificationChoices({});
    invalidate();
    toast({ title: `${toImport.length} task${toImport.length !== 1 ? "s" : ""} added to the board` });
  }, [activeVenueId, scannedTasks, selectedScanTasks, clarificationChoices, selectedDate, createTask, toast]);

  // Library handlers
  function openNewLibraryTask() {
    setEditingLibraryTask(null);
    setLibraryForm(emptyLibraryForm());
    setShowLibraryDialog(true);
  }

  function openEditLibraryTask(task: PrepLibraryTask) {
    setEditingLibraryTask(task);
    setLibraryForm({
      title: task.title, description: task.description ?? "", category: task.category,
      section: task.section, shift: task.shift, priority: task.priority,
      quantity: task.quantity != null ? String(task.quantity) : "", unit: task.unit ?? "",
      batchSize: task.batchSize ?? "", notes: task.notes ?? "",
      estimatedMinutes: task.estimatedMinutes != null ? String(task.estimatedMinutes) : "",
      quickInstructions: task.quickInstructions ?? "",
      imageUrl: task.imageUrl ?? "",
      trainingTags: task.trainingTags ?? "",
      recipeId: task.recipeId ?? undefined,
      status: task.status ?? "active",
    });
    setShowLibraryDialog(true);
  }

  function handleLibrarySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVenueId) return;
    const payload: PrepLibraryTaskInput = {
      title: libraryForm.title,
      description: libraryForm.description || undefined,
      category: libraryForm.category as PrepLibraryTaskInput["category"],
      section: libraryForm.section as PrepLibraryTaskInput["section"],
      shift: libraryForm.shift as PrepLibraryTaskInput["shift"],
      priority: libraryForm.priority as PrepLibraryTaskInput["priority"],
      quantity: libraryForm.quantity ? parseFloat(libraryForm.quantity) : undefined,
      unit: libraryForm.unit || undefined,
      batchSize: libraryForm.batchSize || undefined,
      notes: libraryForm.notes || undefined,
      estimatedMinutes: libraryForm.estimatedMinutes ? parseInt(libraryForm.estimatedMinutes) : undefined,
      recipeId: libraryForm.recipeId,
      status: libraryForm.status as PrepLibraryTaskInput["status"],
      quickInstructions: libraryForm.quickInstructions || undefined,
      imageUrl: libraryForm.imageUrl || undefined,
      trainingTags: libraryForm.trainingTags || undefined,
    };
    if (editingLibraryTask) {
      updateLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: editingLibraryTask.id, data: payload });
    } else {
      createLibraryTask.mutate({ venueId: activeVenueId, data: payload });
    }
  }

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!activeVenueId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select a venue to view the prep board
      </div>
    );
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Top tab selector ── */}
      <div className="flex items-center gap-1 p-1 bg-secondary rounded-md w-fit">
        <button
          onClick={() => setPageMode("board")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors",
            pageMode === "board" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardList className="w-3.5 h-3.5" /> Daily Board
        </button>
        <button
          onClick={() => setPageMode("library")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors relative",
            pageMode === "library" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Library className="w-3.5 h-3.5" /> Task Library
          {canManage && pendingLibrary.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {pendingLibrary.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          BOARD VIEW
      ════════════════════════════════════════════════════════════════ */}
      {pageMode === "board" && (
        <div className="space-y-4">

          {/* Date nav header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="relative group">
                  <h1 className="text-2xl font-bold text-foreground">{dayName}</h1>
                  <p className="text-sm text-muted-foreground">{dateLabel}</p>
                  <input type="date" value={selectedDate} onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full" aria-label="Pick a date" />
                </div>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                {selectedDate !== toDateString(new Date()) && (
                  <button onClick={() => setSelectedDate(toDateString(new Date()))} className="text-xs text-primary hover:underline">
                    Back to today
                  </button>
                )}
              </div>
              {totalTasks > 0 && (
                <p className="text-sm text-muted-foreground mt-1 ml-1">
                  {doneTasks}/{totalTasks} done
                  <span className="ml-2 text-xs text-muted-foreground/60">Live — syncs every 15s</span>
                </p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {activeLibraryTasks.length > 0 && (
                <Button size="sm" onClick={openBuildDialog}>
                  <ClipboardList className="w-4 h-4 mr-1.5" />
                  Build Prep List
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowQuickAddDialog(true)}>
                <Zap className="w-4 h-4 mr-1.5" />
                Quick Add
              </Button>
              <Button variant="outline" size="sm" onClick={openTemplateDialog}>
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Previous list
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPlanAheadDialog(true)}>
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Plan next day
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowArchivedPanel(true)}>
                    <Archive className="w-3.5 h-3.5 mr-2" />Archived tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStaffDialog(true)}>
                    <UserPlus className="w-3.5 h-3.5 mr-2" />Manage staff
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-3.5 h-3.5 mr-2" />Camera scan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => uploadFileRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5 mr-2" />Upload prep list
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const url = `${window.location.origin}/display/${activeVenueId}`;
                    navigator.clipboard.writeText(url).then(() => toast({ title: "Display link copied" }));
                  }}>
                    <Monitor className="w-3.5 h-3.5 mr-2" />Copy display link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" onClick={() => openNew()}>
                <Plus className="w-4 h-4 mr-1.5" />Add Task
              </Button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} capture="environment" />
              <input ref={uploadFileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {/* Booking notes banner */}
          {(bookingNote?.notes || isEditingNotes) && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Upcoming bookings &amp; events</p>
                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          value={notesEditValue}
                          onChange={e => setNotesEditValue(e.target.value)}
                          className="text-xs min-h-[60px] bg-white border-blue-200"
                          placeholder="Add notes about upcoming events, large bookings, special menus..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => {
                            if (!activeVenueId) return;
                            updateNotesMutation.mutate({ venueId: activeVenueId, data: { notes: notesEditValue } });
                          }} disabled={updateNotesMutation.isPending}>
                            {updateNotesMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}Save
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsEditingNotes(false)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{bookingNote?.notes}</p>
                    )}
                  </div>
                </div>
                {!isEditingNotes && (
                  <button onClick={() => { setNotesEditValue(bookingNote?.notes ?? ""); setIsEditingNotes(true); }}
                    className="p-1.5 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-100 flex-shrink-0 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Add booking notes prompt (if no notes and not editing) */}
          {!bookingNote?.notes && !isEditingNotes && (
            <button
              onClick={() => { setNotesEditValue(""); setIsEditingNotes(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Add upcoming booking notes for the team
            </button>
          )}

          {/* View toggle + Service Priority */}
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 bg-secondary rounded-md w-fit">
                <button onClick={() => setViewMode("sections")} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors", viewMode === "sections" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <LayoutGrid className="w-3.5 h-3.5" /> Sections
                </button>
                <button onClick={() => setViewMode("list")} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors", viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <List className="w-3.5 h-3.5" /> All tasks
                </button>
                {v2Enabled && (
                  <button onClick={() => setViewMode("service")} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors", viewMode === "service" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    <Timer className="w-3.5 h-3.5" /> Service
                  </button>
                )}
              </div>
              <button
                onClick={() => setServicePriorityMode(m => !m)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors",
                  servicePriorityMode
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-secondary border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Timer className="w-3.5 h-3.5" />
                Service Priority
              </button>
            </div>
          )}

          {/* Board content */}
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading prep list...</div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">No tasks for {dayName.toLowerCase()}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Build from the library, carry over yesterday's list, or add tasks manually.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {activeLibraryTasks.length > 0 && (
                  <Button size="sm" onClick={openBuildDialog}>
                    <ClipboardList className="w-4 h-4 mr-1.5" />Build Prep List
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={openTemplateDialog}>
                  <CalendarDays className="w-4 h-4 mr-1.5" />Previous list
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-1.5" />Scan whiteboard
                </Button>
                <Button variant="outline" size="sm" onClick={() => openNew()}>
                  <Plus className="w-4 h-4 mr-1.5" />Add Task
                </Button>
                {activeLibraryTasks.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => setPageMode("library")}>
                    <Library className="w-4 h-4 mr-1.5" />Set up library
                  </Button>
                )}
              </div>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {[...tasks].sort((a, b) => {
                if (servicePriorityMode) {
                  if (a.status === "done" && b.status !== "done") return 1;
                  if (a.status !== "done" && b.status === "done") return -1;
                }
                const pri = { high: 0, medium: 1, low: 2 };
                const pDiff = (pri[a.priority as keyof typeof pri] ?? 1) - (pri[b.priority as keyof typeof pri] ?? 1);
                if (pDiff !== 0) return pDiff;
                return SECTIONS.findIndex(s => s.value === a.section) - SECTIONS.findIndex(s => s.value === b.section);
              }).map(task => (
                <SwipeableRow
                  key={task.id}
                  leftAction={task.status !== "done" ? { label: "Claim", icon: <UserCheck className="w-4 h-4" />, bgClass: "bg-primary", onTrigger: () => handleSwipeClaim(task) } : undefined}
                  rightAction={task.status !== "done" ? { label: "Done", icon: <CheckCircle2 className="w-4 h-4" />, bgClass: "bg-green-600", onTrigger: () => handleSwipeComplete(task) } : undefined}
                >
                  <TaskCard task={task} staff={staff}
                    onEdit={() => openEdit(task)} onStatusCycle={() => cycleStatus(task)}
                    onClaim={() => openClaim(task)} onDefer={() => handleDefer(task)}
                    onArchive={() => handleArchive(task)} canManage={canManage}
                    onDelete={() => activeVenueId && deleteTask.mutate({ venueId: activeVenueId, taskId: task.id })}
                    serviceWarning={
                      servicePriorityMode && task.status !== "done" &&
                      serviceCountdown.minutesUntilService !== null &&
                      (task.estimatedDurationMinutes ?? 15) > serviceCountdown.minutesUntilService
                    }
                  />
                </SwipeableRow>
              ))}
            </div>
          ) : viewMode === "service" ? (
            (() => {
              const mustFinish = tasks.filter(t => (t.isCritical || t.priority === "high") && t.status !== "done");
              const mustFinishIds = new Set(mustFinish.map(t => t.id));
              const inProg = tasks.filter(t => t.status === "in_progress" && !mustFinishIds.has(t.id));
              const inProgIds = new Set(inProg.map(t => t.id));
              const flexible = tasks.filter(t => t.status !== "done" && !mustFinishIds.has(t.id) && !inProgIds.has(t.id));

              const renderGroup = (label: string, groupTasks: PrepTask[], colorCls: string, emptyMsg?: string) => (
                groupTasks.length === 0 && !emptyMsg ? null : (
                  <div className={cn("rounded-xl border border-t-4 bg-card", colorCls)}>
                    <div className="p-3 pb-2 flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{label}</span>
                      {groupTasks.length > 0 && (
                        <span className="text-xs text-muted-foreground">{groupTasks.length} task{groupTasks.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <div className="p-3 pt-1 space-y-2">
                      {groupTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1">{emptyMsg}</p>
                      ) : groupTasks.map(task => (
                        <SwipeableRow
                          key={task.id}
                          leftAction={task.status !== "done" ? { label: "Claim", icon: <UserCheck className="w-4 h-4" />, bgClass: "bg-primary", onTrigger: () => handleSwipeClaim(task) } : undefined}
                          rightAction={task.status !== "done" ? { label: "Done", icon: <CheckCircle2 className="w-4 h-4" />, bgClass: "bg-green-600", onTrigger: () => handleSwipeComplete(task) } : undefined}
                        >
                          <TaskCard task={task} staff={staff}
                            onEdit={() => openEdit(task)} onStatusCycle={() => cycleStatus(task)}
                            onClaim={() => openClaim(task)} onDefer={() => handleDefer(task)}
                            onArchive={() => handleArchive(task)} canManage={canManage}
                            onDelete={() => activeVenueId && deleteTask.mutate({ venueId: activeVenueId, taskId: task.id })}
                            serviceWarning={
                              task.status !== "done" &&
                              serviceCountdown.minutesUntilService !== null &&
                              (task.estimatedDurationMinutes ?? 15) > serviceCountdown.minutesUntilService
                            }
                          />
                        </SwipeableRow>
                      ))}
                    </div>
                  </div>
                )
              );

              return (
                <div className="space-y-3">
                  {renderGroup("Must finish before service", mustFinish, "border-t-red-400", mustFinish.length === 0 ? "No critical or high-priority tasks outstanding." : undefined)}
                  {renderGroup("In progress", inProg, "border-t-primary")}
                  {renderGroup("Flexible", flexible, "border-t-slate-300")}
                </div>
              );
            })()
          ) : (
            <div className="space-y-4">
              {SECTIONS.map(section => {
                const rawTasks = tasks.filter(t => t.section === section.value);
                const sectionTasks = servicePriorityMode
                  ? [...rawTasks].sort((a, b) => {
                      if (a.status === "done" && b.status !== "done") return 1;
                      if (a.status !== "done" && b.status === "done") return -1;
                      const pri = { high: 0, medium: 1, low: 2 };
                      return (pri[a.priority as keyof typeof pri] ?? 1) - (pri[b.priority as keyof typeof pri] ?? 1);
                    })
                  : rawTasks;
                if (sectionTasks.length === 0) return null;
                const sectionDone = sectionTasks.filter(t => t.status === "done").length;
                return (
                  <div key={section.value} className={cn("bg-card border-t-4 rounded-xl border border-border", SECTION_COLORS[section.value])}>
                    <div className="p-4 pb-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">{section.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{section.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{sectionDone}/{sectionTasks.length}</span>
                        <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-dashed border-border hover:border-primary/50 transition-colors"
                          onClick={() => openNew({ section: section.value as PrepTaskInputSection })}>
                          + Add
                        </button>
                      </div>
                    </div>
                    <div className="p-4 pt-2 space-y-2">
                      {sectionTasks.map(task => (
                        <SwipeableRow
                          key={task.id}
                          leftAction={task.status !== "done" ? { label: "Claim", icon: <UserCheck className="w-4 h-4" />, bgClass: "bg-primary", onTrigger: () => handleSwipeClaim(task) } : undefined}
                          rightAction={task.status !== "done" ? { label: "Done", icon: <CheckCircle2 className="w-4 h-4" />, bgClass: "bg-green-600", onTrigger: () => handleSwipeComplete(task) } : undefined}
                        >
                          <TaskCard task={task} staff={staff}
                            onEdit={() => openEdit(task)} onStatusCycle={() => cycleStatus(task)}
                            onClaim={() => openClaim(task)} onDefer={() => handleDefer(task)}
                            onArchive={() => handleArchive(task)} canManage={canManage}
                            onDelete={() => activeVenueId && deleteTask.mutate({ venueId: activeVenueId, taskId: task.id })}
                            serviceWarning={
                              servicePriorityMode && task.status !== "done" &&
                              serviceCountdown.minutesUntilService !== null &&
                              (task.estimatedDurationMinutes ?? 15) > serviceCountdown.minutesUntilService
                            }
                          />
                        </SwipeableRow>
                      ))}
                    </div>
                  </div>
                );
              })}
              {tasks.filter(t => t.section === "other").length === 0 && (
                <button className="w-full text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed border-border rounded-xl hover:border-primary/50 transition-colors"
                  onClick={() => openNew({ section: "other" as PrepTaskInputSection })}>
                  + Add task to Other
                </button>
              )}
            </div>
          )}

          {/* Quick-add section buttons */}
          {tasks.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-2">
              {SECTIONS.map(section => (
                <button key={section.value}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  onClick={() => openNew({ section: section.value as PrepTaskInputSection })}>
                  + {section.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          LIBRARY VIEW
      ════════════════════════════════════════════════════════════════ */}
      {pageMode === "library" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Task Library</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your master list of prep tasks. Build any day's board from here in one shot.
              </p>
            </div>
            <Button size="sm" onClick={openNewLibraryTask}>
              <Plus className="w-4 h-4 mr-1.5" />Add to Library
            </Button>
          </div>

          {/* Approval queue (admin only) */}
          {canManage && pendingLibrary.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">
                {pendingLibrary.length} task{pendingLibrary.length !== 1 ? "s" : ""} waiting for approval
              </p>
              <div className="space-y-2">
                {pendingLibrary.map(task => (
                  <div key={task.id} className="flex items-start gap-3 bg-white rounded-lg border border-amber-100 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{task.title}</p>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", categoryColor(task.category))}>
                          {CATEGORIES.find(c => c.value === task.category)?.label ?? task.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {SECTIONS.find(s => s.value === task.section)?.label ?? task.section}
                        </span>
                        {task.createdBy && (
                          <span className="text-xs text-muted-foreground">Added by {task.createdBy.split("_")[0]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button size="sm" className="h-7 text-xs" onClick={() => activeVenueId && approveLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: task.id })}>
                        <Check className="w-3 h-3 mr-1" />Approve
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            <Timer className="w-3 h-3 mr-1" />Temp
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => activeVenueId && approveLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: task.id, data: { days: 7 } })}>
                            Approve for 7 days
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => activeVenueId && approveLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: task.id, data: { days: 30 } })}>
                            Approve for 30 days
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => activeVenueId && rejectLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: task.id })}>
                        <X className="w-3 h-3 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "active", "inactive", "seasonal", "waiting_approval", "archived"] as const).map(f => {
              const LABELS: Record<string, string> = { all: "All", active: "Active", inactive: "Inactive", seasonal: "Seasonal", waiting_approval: "Pending", archived: "Archived" };
              const count = f === "waiting_approval" && canManage && pendingLibrary.length > 0 ? pendingLibrary.length : null;
              return (
                <button key={f} onClick={() => setLibraryStatusFilter(f)}
                  className={cn("text-xs px-2.5 py-1 rounded-full border font-medium transition-colors",
                    libraryStatusFilter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}>
                  {LABELS[f]}{count ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={librarySearch}
              onChange={e => setLibrarySearch(e.target.value)}
              className="pl-9 h-8 text-sm" />
          </div>

          {/* All-status task list by section */}
          {displayedLibraryTasks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <Library className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              {libraryTasks.length === 0 && libraryStatusFilter === "all" ? (
                <>
                  <p className="font-semibold text-foreground mb-1">Library is empty</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build your master task list here. Then pull from it to fill any day's board in seconds.
                  </p>
                  <Button size="sm" onClick={openNewLibraryTask}>
                    <Plus className="w-4 h-4 mr-1.5" />Add first task
                  </Button>
                </>
              ) : (
                <p className="font-semibold text-foreground">No tasks match this filter</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {SECTIONS.map(section => {
                const sectionTasks = displayedLibraryTasks.filter(t => t.section === section.value);
                if (sectionTasks.length === 0) return null;
                const showBadge = libraryStatusFilter === "all" || libraryStatusFilter === "archived";
                return (
                  <div key={section.value} className={cn("bg-card border-t-4 rounded-xl border border-border", SECTION_COLORS[section.value])}>
                    <div className="p-4 pb-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">{section.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{sectionTasks.length} task{sectionTasks.length !== 1 ? "s" : ""}</span>
                      </div>
                      {libraryStatusFilter !== "archived" && (
                        <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-dashed border-border hover:border-primary/50 transition-colors"
                          onClick={() => { setLibraryForm(f => ({ ...emptyLibraryForm(), section: section.value })); setEditingLibraryTask(null); setShowLibraryDialog(true); }}>
                          + Add
                        </button>
                      )}
                    </div>
                    <div className="p-4 pt-2 space-y-2">
                      {sectionTasks.map(task => (
                        <LibraryTaskCard key={task.id} task={task}
                          onEdit={() => openEditLibraryTask(task)}
                          onArchive={task.status !== "archived" ? () => activeVenueId && deleteLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: task.id }) : undefined}
                          onRestore={task.status === "archived" ? () => activeVenueId && updateLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: task.id, data: { title: task.title, status: "active" } }) : undefined}
                          onActivate={task.status === "inactive" ? () => setReactivationTask(task) : undefined}
                          canManage={canManage}
                          showStatusBadge={showBadge}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Non-admin pending notice */}
          {!canManage && libraryTasks.filter(t => t.status === "waiting_approval").length > 0 && (
            <p className="text-xs text-amber-600 text-center py-2">
              You have {libraryTasks.filter(t => t.status === "waiting_approval").length} task{libraryTasks.filter(t => t.status === "waiting_approval").length !== 1 ? "s" : ""} awaiting admin approval.
            </p>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          DIALOGS
      ════════════════════════════════════════════════════════════════ */}

      {/* Swipe signoff prompt — first-time name capture */}
      <Dialog open={!!pendingSwipe} onOpenChange={open => { if (!open) setPendingSwipe(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Who's {pendingSwipe?.action === "claim" ? "claiming" : "signing off"}?</DialogTitle>
            <DialogDescription>{pendingSwipe?.task.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Your name"
              value={pendingSwipeName}
              onChange={e => setPendingSwipeName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") executePendingSwipe(); }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Saved for future swipes on this device.</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPendingSwipe(null)}>Cancel</Button>
            <Button className="flex-1" disabled={!pendingSwipeName.trim()} onClick={executePendingSwipe}>
              {pendingSwipe?.action === "claim" ? "Claim task" : "Mark done"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim dialog */}
      <Dialog open={!!claimingTask} onOpenChange={open => { if (!open) setClaimingTask(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Who's on this?</DialogTitle>
            <DialogDescription>{claimingTask?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {claimingTask?.claimedBy && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md">
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Currently claimed by {claimingTask.claimedBy}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Your name</Label>
              {staff.length > 0 ? (
                <Select value={claimName} onValueChange={setClaimName}>
                  <SelectTrigger><SelectValue placeholder="Pick your name" /></SelectTrigger>
                  <SelectContent>
                    {claimingTask?.claimedBy && <SelectItem value="">Remove claim</SelectItem>}
                    {staff.map(s => <SelectItem key={s.id} value={s.name}>{s.name}{s.role ? ` — ${s.role}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={claimName} onChange={e => setClaimName(e.target.value)} placeholder="Enter your name" />
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setClaimingTask(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleClaim} disabled={claimMutation.isPending}>
                {claimMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {claimName ? "Claim it" : "Remove claim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Build Prep List dialog — A/B/C sections */}
      <Dialog open={showBuildDialog} onOpenChange={open => {
        if (!open) { setShowBuildDialog(false); setBuildBrowseSearch(""); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Build Prep List for {dayName}</DialogTitle>
            <DialogDescription>
              Pick tasks to add to {dayName.toLowerCase()}'s board. Adjust quantities as needed.
            </DialogDescription>
          </DialogHeader>

          {isBuildSuggestionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (() => {
            const suggestions = buildSuggestions;
            if (!suggestions) return (
              <p className="text-sm text-muted-foreground py-4 text-center">Could not load suggestions. Try again.</p>
            );

            const browseTasks = suggestions.browse.filter(t =>
              buildBrowseSearch.trim().length === 0 ||
              t.title.toLowerCase().includes(buildBrowseSearch.toLowerCase()) ||
              (t.description?.toLowerCase().includes(buildBrowseSearch.toLowerCase()) ?? false)
            );

            function BuildTaskRow({ task, badge }: { task: PrepLibraryTask; badge?: React.ReactNode }) {
              const isSelected = buildSelected.has(task.id);
              const qty = buildQuantities[task.id];
              return (
                <div className={cn("rounded-md border p-3 transition-colors", isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-background opacity-50")}>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} className="mt-0.5" onCheckedChange={() => {
                      const next = new Set(buildSelected);
                      if (next.has(task.id)) {
                        next.delete(task.id);
                        setBuildQuantities(prev => { const n = { ...prev }; delete n[task.id]; return n; });
                      } else {
                        next.add(task.id);
                        setBuildQuantities(prev => ({ ...prev, [task.id]: { quantity: task.quantity != null ? String(task.quantity) : "", unit: task.unit ?? "" } }));
                      }
                      setBuildSelected(next);
                    }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{task.title}</p>
                        {badge}
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                      {isSelected && (
                        <div className="flex gap-2 mt-2">
                          <Input type="number" step="0.5" min="0" placeholder={task.quantity != null ? String(task.quantity) : "Qty"}
                            value={qty?.quantity ?? ""}
                            onChange={e => setBuildQuantities(prev => ({ ...prev, [task.id]: { ...prev[task.id] ?? { quantity: "", unit: "" }, quantity: e.target.value } }))}
                            className="h-7 text-xs flex-1" />
                          <Input placeholder={task.unit ?? "Unit"} value={qty?.unit ?? ""}
                            onChange={e => setBuildQuantities(prev => ({ ...prev, [task.id]: { ...prev[task.id] ?? { quantity: "", unit: "" }, unit: e.target.value } }))}
                            className="h-7 text-xs flex-1" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">

                {/* Section A — Critical */}
                {suggestions.critical.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <p className="text-xs font-bold uppercase tracking-wider text-red-600">A — Critical</p>
                    </div>
                    <div className="space-y-2">
                      {suggestions.critical.map(c => (
                        <div key={c.itemId}>
                          {c.suggestedTask ? (
                            <BuildTaskRow task={c.suggestedTask} badge={
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", c.stockStatus === "zero" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700")}>
                                {c.stockStatus === "zero" ? "Out of stock" : `Low — ${c.currentStock}${c.unit ? ` ${c.unit}` : ""} left`}
                              </span>
                            } />
                          ) : (
                            <div className="rounded-md border border-red-100 bg-red-50/40 p-3 flex items-center gap-3">
                              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-red-800">{c.itemName}</p>
                                <p className="text-xs text-red-600">
                                  {c.stockStatus === "zero" ? "Out of stock" : `${c.currentStock}${c.unit ? ` ${c.unit}` : ""} left`} — no library task
                                </p>
                              </div>
                              <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0"
                                onClick={() => setShowQuickAddDialog(true)}>
                                <Zap className="w-3 h-3 mr-1" />Quick add
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section B — Standard (active library tasks by section) */}
                {suggestions.standard.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">B — Standard</p>
                      <button className="text-xs text-primary hover:underline" onClick={() => {
                        const standardIds = new Set(suggestions.standard.map(t => t.id));
                        const allSelected = [...standardIds].every(id => buildSelected.has(id));
                        const next = new Set(buildSelected);
                        if (allSelected) { standardIds.forEach(id => next.delete(id)); }
                        else { suggestions.standard.forEach(t => { next.add(t.id); setBuildQuantities(prev => ({ ...prev, [t.id]: prev[t.id] ?? { quantity: t.quantity != null ? String(t.quantity) : "", unit: t.unit ?? "" } })); }); }
                        setBuildSelected(next);
                      }}>
                        {[...suggestions.standard.map(t => t.id)].every(id => buildSelected.has(id)) ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    {SECTIONS.map(sec => {
                      const secTasks = suggestions.standard.filter(t => t.section === sec.value);
                      if (secTasks.length === 0) return null;
                      return (
                        <div key={sec.value} className="mb-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1.5">{sec.label}</p>
                          <div className="space-y-1.5">
                            {secTasks.map(task => <BuildTaskRow key={task.id} task={task} />)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Section C — Browse (inactive/seasonal) */}
                {suggestions.browse.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">C — Browse</p>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input placeholder="Search inactive/seasonal tasks..." value={buildBrowseSearch}
                        onChange={e => setBuildBrowseSearch(e.target.value)} className="h-8 text-xs pl-8" />
                    </div>
                    <div className="space-y-1.5">
                      {browseTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">No tasks match your search.</p>
                      ) : browseTasks.map(task => (
                        <BuildTaskRow key={task.id} task={task} badge={
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{task.status}</span>
                        } />
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.critical.length === 0 && suggestions.standard.length === 0 && suggestions.browse.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No tasks in the library yet.</p>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" className="flex-1" onClick={() => setShowBuildDialog(false)}>Cancel</Button>
                  <Button className="flex-1" disabled={buildSelected.size === 0 || buildListMutation.isPending} onClick={handleBuildList}>
                    {buildListMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add {buildSelected.size} task{buildSelected.size !== 1 ? "s" : ""} to board
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Quick Add dialog */}
      <Dialog open={showQuickAddDialog} onOpenChange={open => { if (!open) { setShowQuickAddDialog(false); setQuickAddForm({ title: "", section: "other", category: "other", priority: "medium", addToLibrary: true, quantity: "", unit: "" }); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Add to Board</DialogTitle>
            <DialogDescription>
              Add a task to today's board right now. If you want it in the library permanently, an admin will approve it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Task name</Label>
              <Input
                placeholder="e.g. Portion salmon fillets"
                value={quickAddForm.title}
                onChange={e => setQuickAddForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter" && quickAddForm.title.trim() && activeVenueId) {
                  quickAddMutation.mutate({ venueId: activeVenueId, data: { title: quickAddForm.title.trim(), section: quickAddForm.section as PrepTaskInputSection, category: quickAddForm.category as PrepTaskInputCategory, priority: quickAddForm.priority as PrepTaskInputPriority, prepDate: selectedDate, addToLibrary: quickAddForm.addToLibrary, quantity: quickAddForm.quantity ? parseFloat(quickAddForm.quantity) : undefined, unit: quickAddForm.unit || undefined } });
                }}}
              />
            </div>
            {/* Contextual reference hints */}
            {(() => {
              const butchery = matchButcheryContext(quickAddForm.title);
              const knife = matchKnifeSkill(quickAddForm.title);
              if (!butchery && !knife) return null;
              return (
                <div className="text-xs bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 space-y-0.5">
                  {butchery?.cut && (
                    <p>
                      <span className="font-semibold">{butchery.cut.name}</span>
                      <span className="text-muted-foreground ml-1.5">yield {butchery.cut.expectedYieldPercent}</span>
                      {butchery.cut.trimRecovery.length > 0 && (
                        <span className="text-muted-foreground"> · trim {"\u2192"} {butchery.cut.trimRecovery.slice(0, 2).map(r => r.use).join(", ")}</span>
                      )}
                    </p>
                  )}
                  {!butchery?.cut && butchery?.category && (
                    <p className="font-semibold">{butchery.category.label} guidance available</p>
                  )}
                  {knife && (
                    <p>
                      <span className="font-semibold">{knife.label}</span>
                      <span className="text-muted-foreground ml-1.5">{knife.dimensions}</span>
                    </p>
                  )}
                  <Link href="/kitchen-reference" className="text-primary hover:underline font-medium">Full guide</Link>
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Section</Label>
                <Select value={quickAddForm.section} onValueChange={v => setQuickAddForm(f => ({ ...f, section: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={quickAddForm.priority} onValueChange={v => setQuickAddForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Quantity (optional)</Label>
                <Input type="number" step="0.5" min="0" placeholder="e.g. 12"
                  value={quickAddForm.quantity}
                  onChange={e => setQuickAddForm(f => ({ ...f, quantity: e.target.value }))}
                  className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Unit (optional)</Label>
                <Input placeholder="e.g. portions"
                  value={quickAddForm.unit}
                  onChange={e => setQuickAddForm(f => ({ ...f, unit: e.target.value }))}
                  className="mt-1 h-8 text-xs" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={quickAddForm.addToLibrary} onCheckedChange={v => setQuickAddForm(f => ({ ...f, addToLibrary: !!v }))} />
              <span className="text-sm">Queue for library approval</span>
            </label>
            {quickAddForm.addToLibrary && (
              <p className="text-xs text-muted-foreground">
                This task will appear on today's board immediately. An admin will review it for the permanent library.
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowQuickAddDialog(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!quickAddForm.title.trim() || quickAddMutation.isPending}
                onClick={() => {
                  if (!activeVenueId || !quickAddForm.title.trim()) return;
                  quickAddMutation.mutate({ venueId: activeVenueId, data: { title: quickAddForm.title.trim(), section: quickAddForm.section as PrepTaskInputSection, category: quickAddForm.category as PrepTaskInputCategory, priority: quickAddForm.priority as PrepTaskInputPriority, prepDate: selectedDate, addToLibrary: quickAddForm.addToLibrary, quantity: quickAddForm.quantity ? parseFloat(quickAddForm.quantity) : undefined, unit: quickAddForm.unit || undefined } });
                }}>
                {quickAddMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Add to board
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archived tasks panel */}
      <Dialog open={showArchivedPanel} onOpenChange={setShowArchivedPanel}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archived tasks</DialogTitle>
            <DialogDescription>Tasks removed from the active board. Restore any to put it back.</DialogDescription>
          </DialogHeader>
          {archivedTasks.length === 0 ? (
            <div className="py-8 text-center"><Archive className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No archived tasks yet.</p></div>
          ) : (
            <div className="space-y-2">
              {SECTIONS.map(section => {
                const sectionArchived = archivedTasks.filter(t => t.section === section.value);
                if (sectionArchived.length === 0) return null;
                return (
                  <div key={section.value}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1.5">{section.label}</p>
                    <div className="space-y-1.5">
                      {sectionArchived.map(task => (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border border-border bg-background">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight text-muted-foreground line-through">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", categoryColor(task.category))}>
                                {CATEGORIES.find(c => c.value === task.category)?.label ?? task.category}
                              </span>
                              <span className="text-xs text-muted-foreground">{formatDateHeading(task.prepDate).dayName}, {formatDateHeading(task.prepDate).dateLabel}</span>
                            </div>
                          </div>
                          <button onClick={() => handleRestore(task)} className="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0 mt-0.5">
                            <ArchiveRestore className="w-3.5 h-3.5" />Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Build from previous list dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Build from previous list</DialogTitle>
            <DialogDescription>
              Tasks from {formatDateHeading(prevDate).dayName.toLowerCase()} ({formatDateHeading(prevDate).dateLabel}).
              Tick what you want to carry into {dayName.toLowerCase()}'s list.
            </DialogDescription>
          </DialogHeader>
          {prevTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks on the previous day's list.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{selectedTemplateTasks.size} of {prevTasks.length} selected</p>
                <button className="text-xs text-primary hover:underline"
                  onClick={() => setSelectedTemplateTasks(selectedTemplateTasks.size === prevTasks.length ? new Set() : new Set(prevTasks.map(t => t.id)))}>
                  {selectedTemplateTasks.size === prevTasks.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {SECTIONS.map(section => {
                const sectionPrevTasks = prevTasks.filter(t => t.section === section.value);
                if (sectionPrevTasks.length === 0) return null;
                return (
                  <div key={section.value}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1.5">{section.label}</p>
                    <div className="space-y-1.5">
                      {sectionPrevTasks.map(task => (
                        <div key={task.id}
                          className={cn("flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors select-none",
                            selectedTemplateTasks.has(task.id) ? "border-primary/40 bg-primary/5" : "border-border bg-background opacity-50")}
                          onClick={() => { const next = new Set(selectedTemplateTasks); if (next.has(task.id)) next.delete(task.id); else next.add(task.id); setSelectedTemplateTasks(next); }}>
                          <Checkbox checked={selectedTemplateTasks.has(task.id)} className="mt-0.5" onCheckedChange={() => {}} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium leading-tight", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", categoryColor(task.category))}>
                                {CATEGORIES.find(c => c.value === task.category)?.label ?? task.category}
                              </span>
                              {task.status === "done" && <span className="text-xs text-status-healthy font-medium">Done yesterday</span>}
                              {task.deferredFrom && <span className="text-xs text-amber-600">Was deferred</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-2 pt-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary text-primary-foreground" disabled={selectedTemplateTasks.size === 0 || isImportingTemplate} onClick={handleImportTemplate}>
                  {isImportingTemplate ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</> : <><Plus className="w-4 h-4 mr-2" />Add {selectedTemplateTasks.size} task{selectedTemplateTasks.size !== 1 ? "s" : ""}</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit task dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Prep Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Task</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Break down the duck legs" required />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Any extra detail..." />
            </div>
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select value={form.section ?? "other"} onValueChange={v => setForm({ ...form, section: v as PrepTaskInputSection })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label} — <span className="text-muted-foreground">{s.description}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category ?? "other"} onValueChange={v => setForm({ ...form, category: v as PrepTaskInputCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shift</Label>
                <Select value={form.shift ?? "all_day"} onValueChange={v => setForm({ ...form, shift: v as PrepTaskInputShift })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority ?? "medium"} onValueChange={v => setForm({ ...form, priority: v as PrepTaskInputPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prep date</Label>
                <Input type="date" value={form.prepDate ?? selectedDate} onChange={e => setForm({ ...form, prepDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" step="0.5" min="0" placeholder="e.g. 12"
                  value={form.quantity != null ? String(form.quantity) : ""}
                  onChange={e => setForm({ ...form, quantity: e.target.value ? parseFloat(e.target.value) : undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input placeholder="e.g. portions"
                  value={form.unit ?? ""}
                  onChange={e => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Assign to</Label>
                <Select value={form.assignedTo || "__none__"} onValueChange={v => setForm({ ...form, assignedTo: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {staff.map(s => <SelectItem key={s.id} value={s.name}>{s.name}{s.role ? ` — ${s.role}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Link Recipe (optional)</Label>
              <Select value={form.recipeId?.toString() ?? "__none__"} onValueChange={v => setForm({ ...form, recipeId: v === "__none__" ? undefined : parseInt(v) })}>
                <SelectTrigger><SelectValue placeholder="No recipe linked" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No recipe</SelectItem>
                  {recipes.map(r => <SelectItem key={r.id} value={r.id.toString()}><span className="flex items-center gap-1.5"><ChefHat className="w-3.5 h-3.5 text-muted-foreground" />{r.name}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Est. time (min)</Label>
                <Input type="number" min="1" max="480" placeholder="e.g. 20"
                  value={form.estimatedDurationMinutes != null ? String(form.estimatedDurationMinutes) : ""}
                  onChange={e => setForm({ ...form, estimatedDurationMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label>Batch size (optional)</Label>
                <Input placeholder="e.g. 30 portions"
                  value={form.batchSize ?? ""}
                  onChange={e => setForm({ ...form, batchSize: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="task-is-critical"
                checked={!!form.isCritical}
                onCheckedChange={v => setForm({ ...form, isCritical: Boolean(v) })}
              />
              <label htmlFor="task-is-critical" className="text-sm font-semibold cursor-pointer select-none">
                Critical task
              </label>
              <span className="text-xs text-muted-foreground">— always surfaces first in Service Mode</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Notes (optional)</Label>
                <Button type="button" variant="ghost" size="sm"
                  className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                  disabled={!form.title || suggestInstructionsMutation.isPending}
                  onClick={handleSuggestForTaskForm}>
                  {suggestInstructionsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Suggest steps
                </Button>
              </div>
              <Textarea value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes for the team..." rows={2} />
            </div>
            <div className="flex gap-2 justify-between pt-1">
              {editingTask && (
                <Button type="button" variant="destructive" size="sm"
                  onClick={() => { if (!activeVenueId) return; deleteTask.mutate({ venueId: activeVenueId, taskId: editingTask.id }); setShowTaskDialog(false); }}>
                  <Trash2 className="w-4 h-4 mr-1" />Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
                  {editingTask ? "Save" : "Add Task"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reactivation checklist dialog */}
      {reactivationTask && (
        <ReactivationChecklistDialog
          task={reactivationTask}
          venueId={activeVenueId!}
          onClose={() => setReactivationTask(null)}
          onConfirm={() => {
            if (!activeVenueId) return;
            updateLibraryTask.mutate(
              { venueId: activeVenueId, libraryTaskId: reactivationTask.id, data: { title: reactivationTask.title, status: "active" } },
              { onSuccess: () => setReactivationTask(null) }
            );
          }}
        />
      )}

      {/* Library task dialog (add/edit) */}
      <Dialog open={showLibraryDialog} onOpenChange={setShowLibraryDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLibraryTask ? "Edit Library Task" : "Add to Library"}</DialogTitle>
            <DialogDescription>
              {editingLibraryTask ? "Update this task in the master library." : "Add a recurring prep task to the master library. You can pull it onto any day's board in one click."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLibrarySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Task name</Label>
              <Input value={libraryForm.title} onChange={e => setLibraryForm({ ...libraryForm, title: e.target.value })} placeholder="e.g. Portion duck legs" required />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={libraryForm.description} onChange={e => setLibraryForm({ ...libraryForm, description: e.target.value })} placeholder="Any extra detail..." />
            </div>
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select value={libraryForm.section} onValueChange={v => setLibraryForm({ ...libraryForm, section: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label} — <span className="text-muted-foreground">{s.description}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={libraryForm.category} onValueChange={v => setLibraryForm({ ...libraryForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shift</Label>
                <Select value={libraryForm.shift} onValueChange={v => setLibraryForm({ ...libraryForm, shift: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Default qty</Label>
                <Input type="number" step="0.5" min="0" placeholder="e.g. 12" value={libraryForm.quantity} onChange={e => setLibraryForm({ ...libraryForm, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input placeholder="portions" value={libraryForm.unit} onChange={e => setLibraryForm({ ...libraryForm, unit: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={libraryForm.priority} onValueChange={v => setLibraryForm({ ...libraryForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Batch size (optional)</Label>
                <Input placeholder="e.g. double batch" value={libraryForm.batchSize} onChange={e => setLibraryForm({ ...libraryForm, batchSize: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Est. time (min)</Label>
                <Input type="number" min="0" placeholder="e.g. 30" value={libraryForm.estimatedMinutes} onChange={e => setLibraryForm({ ...libraryForm, estimatedMinutes: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={libraryForm.status} onValueChange={v => setLibraryForm({ ...libraryForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Link Recipe (optional)</Label>
                <Select value={libraryForm.recipeId?.toString() ?? "__none__"} onValueChange={v => setLibraryForm({ ...libraryForm, recipeId: v === "__none__" ? undefined : parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="No recipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No recipe</SelectItem>
                    {recipes.map(r => <SelectItem key={r.id} value={r.id.toString()}><span className="flex items-center gap-1.5"><ChefHat className="w-3.5 h-3.5 text-muted-foreground" />{r.name}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={libraryForm.notes} onChange={e => setLibraryForm({ ...libraryForm, notes: e.target.value })} placeholder="Any standing notes for this task..." rows={2} />
            </div>
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Training & Reference</Label>
                <Button type="button" variant="ghost" size="sm"
                  className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                  disabled={!libraryForm.title || suggestInstructionsMutation.isPending}
                  onClick={handleSuggestForLibraryForm}>
                  {suggestInstructionsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI suggest
                </Button>
              </div>
              <Textarea
                value={libraryForm.quickInstructions}
                onChange={e => setLibraryForm({ ...libraryForm, quickInstructions: e.target.value })}
                placeholder="Quick how-to a new chef can follow (3-5 lines)..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reference image URL (optional)</Label>
                <Input
                  type="url"
                  value={libraryForm.imageUrl}
                  onChange={e => setLibraryForm({ ...libraryForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Training tags</Label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TRAINING_TAG_OPTIONS.map(opt => {
                    const tags = parseTrainingTags(libraryForm.trainingTags);
                    const active = tags.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? tags.filter(t => t !== opt.value)
                            : [...tags, opt.value];
                          setLibraryForm({ ...libraryForm, trainingTags: next.join(",") });
                        }}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border transition-colors",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-between pt-1">
              {editingLibraryTask && canManage && (
                <Button type="button" variant="destructive" size="sm"
                  onClick={() => { if (!activeVenueId) return; deleteLibraryTask.mutate({ venueId: activeVenueId, libraryTaskId: editingLibraryTask.id }); setShowLibraryDialog(false); }}>
                  <Trash2 className="w-4 h-4 mr-1" />Remove
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setShowLibraryDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createLibraryTask.isPending || updateLibraryTask.isPending}>
                  {editingLibraryTask ? "Save changes" : "Add to Library"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Scan dialog */}
      <Dialog open={showScanDialog} onOpenChange={open => { if (!open && !scanMutation.isPending && !isImportingScan) { setShowScanDialog(false); setScanPreviewUrl(null); setScanNotes([]); setScanClarifications([]); setClarificationChoices({}); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Prep List</DialogTitle>
            <DialogDescription>Review the tasks extracted from your photo. Deselect any you don't need, then import.</DialogDescription>
          </DialogHeader>
          {scanPreviewUrl && <img src={scanPreviewUrl} alt="Prep list" className="w-full rounded-md border border-border max-h-48 object-cover object-top" />}
          {scanMutation.isPending && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Reading your prep list...</span>
            </div>
          )}
          {!scanMutation.isPending && scannedTasks.length === 0 && scanNotes.length === 0 && !scanMutation.isIdle && (
            <div className="text-center py-4"><p className="text-sm text-muted-foreground">No tasks found. Try a clearer photo with good lighting.</p></div>
          )}
          {scanNotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes from the board</p>
              {scanNotes.map((note, ni) => (
                <div key={ni} className={cn("flex items-start gap-2.5 p-3 rounded-md border text-sm", note.type === "stock_alert" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-blue-50 border-blue-100 text-blue-800")}>
                  <span className="mt-0.5 flex-shrink-0 text-base leading-none">{note.type === "stock_alert" ? "⚠" : "ℹ"}</span>
                  <div className="flex-1">
                    <p className="font-medium leading-snug">{note.text}</p>
                    {note.type === "stock_alert" && note.itemName && <p className="text-xs mt-0.5 opacity-75">{note.quantity != null ? `${note.quantity} ` : ""}{note.itemName} — low stock noted</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {scannedTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{selectedScanTasks.size} of {scannedTasks.length} tasks selected</p>
                <button className="text-xs text-primary hover:underline"
                  onClick={() => setSelectedScanTasks(selectedScanTasks.size === scannedTasks.length ? new Set() : new Set(scannedTasks.map((_, i) => i)))}>
                  {selectedScanTasks.size === scannedTasks.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {SECTIONS.map(section => {
                const sectionScanned = scannedTasks.map((t, i) => ({ t, i })).filter(({ t }) => (t.section ?? "other") === section.value);
                if (sectionScanned.length === 0) return null;
                return (
                  <div key={section.value}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 mb-1.5">{section.label}</p>
                    {sectionScanned.map(({ t: task, i }) => {
                      const clarification = scanClarifications.find(c => c.taskIndex === i);
                      return (
                        <div key={i} className={cn("flex items-start gap-3 p-3 rounded-md border transition-colors mb-1.5", selectedScanTasks.has(i) ? "border-primary/40 bg-primary/5" : "border-border bg-background opacity-50")}>
                          <Checkbox checked={selectedScanTasks.has(i)} className="mt-0.5 cursor-pointer"
                            onCheckedChange={() => { const next = new Set(selectedScanTasks); if (next.has(i)) next.delete(i); else next.add(i); setSelectedScanTasks(next); }} />
                          <div className="flex-1 min-w-0" onClick={() => { const next = new Set(selectedScanTasks); if (next.has(i)) next.delete(i); else next.add(i); setSelectedScanTasks(next); }}>
                            {clarification ? (
                              <div className="mb-1" onClick={e => e.stopPropagation()}>
                                <p className="text-xs text-amber-700 font-semibold mb-1.5">What does "{clarification.text}" mean? Pick all that apply:</p>
                                <div className="space-y-1.5">
                                  {clarification.options.map((opt, oi) => {
                                    const selected = (clarificationChoices[i] ?? [clarification.options[0]]).includes(opt);
                                    return (
                                      <label key={oi} className={cn("flex items-center gap-2.5 px-2.5 py-1.5 rounded cursor-pointer border text-xs transition-colors select-none", selected ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border bg-background text-muted-foreground hover:bg-muted")}
                                        onClick={e => { e.stopPropagation(); const current = clarificationChoices[i] ?? (clarification.options[0] ? [clarification.options[0]] : []); const next = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt]; setClarificationChoices(prev => ({ ...prev, [i]: next })); }}>
                                        <Checkbox checked={selected} onCheckedChange={() => {}} className="pointer-events-none" />{opt}
                                      </label>
                                    );
                                  })}
                                </div>
                                {(clarificationChoices[i] ?? []).length > 1 && <p className="text-xs text-primary mt-1.5 font-medium">{(clarificationChoices[i] ?? []).length} tasks will be created</p>}
                              </div>
                            ) : (
                              <p className="text-sm font-medium leading-tight">{task.title}</p>
                            )}
                            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", categoryColor(task.category))}>{CATEGORIES.find(c => c.value === task.category)?.label ?? task.category}</span>
                              <span className={cn("text-xs px-1.5 py-0.5 rounded", task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>{task.priority}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowScanDialog(false); setScanPreviewUrl(null); setScanNotes([]); setScanClarifications([]); setClarificationChoices({}); }}>Cancel</Button>
                <Button className="flex-1 bg-primary text-primary-foreground" disabled={selectedScanTasks.size === 0 || isImportingScan} onClick={handleImportScan}>
                  {isImportingScan ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</> : <><Plus className="w-4 h-4 mr-2" />Add {selectedScanTasks.size} task{selectedScanTasks.size !== 1 ? "s" : ""}</>}
                </Button>
              </div>
            </div>
          )}
          {!scanMutation.isPending && scannedTasks.length === 0 && scanNotes.length > 0 && (
            <Button variant="outline" className="w-full mt-2" onClick={() => { setShowScanDialog(false); setScanPreviewUrl(null); setScanNotes([]); }}>Close</Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Plan next day dialog */}
      <Dialog open={showPlanAheadDialog} onOpenChange={setShowPlanAheadDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan {formatDateHeading(nextDate).dayName}'s Prep</DialogTitle>
            <DialogDescription>
              Review tasks already scheduled for {formatDateHeading(nextDate).dateLabel}. Remove any you won't need.
            </DialogDescription>
          </DialogHeader>
          {isLoadingNextTasks && <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading tasks...</span></div>}
          {!isLoadingNextTasks && nextTasks.length === 0 && (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Nothing scheduled yet</p>
              <p className="text-xs text-muted-foreground mb-4">Add tasks now to get ahead of {formatDateHeading(nextDate).dayName.toLowerCase()}'s service.</p>
              <Button size="sm" onClick={() => { setShowPlanAheadDialog(false); setSelectedDate(nextDate); setTimeout(() => openNew(), 50); }}>
                <Plus className="w-4 h-4 mr-1.5" />Add first task
              </Button>
            </div>
          )}
          {!isLoadingNextTasks && nextTasks.length > 0 && (
            <div className="space-y-2">
              {nextTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border border-border bg-background">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{task.title}</p>
                    {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                    <div className="flex gap-1.5 mt-1">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", categoryColor(task.category))}>{CATEGORIES.find(c => c.value === task.category)?.label ?? task.category}</span>
                    </div>
                  </div>
                  {canManage && (
                    <button onClick={() => activeVenueId && deleteTask.mutate({ venueId: activeVenueId, taskId: task.id })}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button className="w-full mt-2" variant="outline" onClick={() => { setShowPlanAheadDialog(false); setSelectedDate(nextDate); }}>
                Switch to {formatDateHeading(nextDate).dayName}'s board
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Staff management dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage Staff</DialogTitle>
            <DialogDescription>Add your team members so tasks can be assigned to them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {staff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No staff added yet.</p>
            ) : (
              <div className="space-y-1.5">
                {staff.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.role && <p className="text-xs text-muted-foreground">{s.role}</p>}
                    </div>
                    {canManage && (
                      <button onClick={() => activeVenueId && deleteStaff.mutate({ venueId: activeVenueId, staffId: s.id })}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {canManage && (
              <div className="flex gap-2 pt-1">
                <Input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Name" className="flex-1" onKeyDown={e => { if (e.key === "Enter" && newStaffName.trim()) { e.preventDefault(); if (activeVenueId) createStaff.mutate({ venueId: activeVenueId, data: { name: newStaffName.trim(), role: newStaffRole.trim() || undefined } }); } }} />
                <Input value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} placeholder="Role" className="flex-1" />
                <Button size="sm" disabled={!newStaffName.trim()} onClick={() => { if (!activeVenueId || !newStaffName.trim()) return; createStaff.mutate({ venueId: activeVenueId, data: { name: newStaffName.trim(), role: newStaffRole.trim() || undefined } }); }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
