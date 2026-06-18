import { useState } from "react";
import { useVenueStore } from "@/stores/venueStore";
import {
  useListCleaningTasks,
  useCreateCleaningTask,
  useUpdateCleaningTask,
  useDeleteCleaningTask,
  useCompleteCleaningTask,
  useListCleaningLogs,
  useListVenueStaff,
} from "@workspace/api-client-react";
import type { CleaningTask, CleaningTaskInput } from "@workspace/api-client-react";
import { getListCleaningTasksQueryKey, getListCleaningLogsQueryKey, getListVenueStaffQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle2, Trash2, Clock, AlertTriangle, History } from "lucide-react";
import { SwipeableRow } from "@/components/SwipeableRow";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

const AREAS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "walk_in", label: "Walk-in Fridge" },
  { value: "dry_store", label: "Dry Store" },
  { value: "prep_area", label: "Prep Area" },
  { value: "fryer", label: "Fryer" },
  { value: "grill", label: "Grill" },
  { value: "oven", label: "Oven" },
  { value: "dishwash", label: "Dishwash" },
  { value: "floors", label: "Floors" },
  { value: "toilets", label: "Toilets" },
  { value: "other", label: "Other" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const TASK_KINDS = [
  { value: "all", label: "All" },
  { value: "cleaning", label: "Cleaning" },
  { value: "opening", label: "Opening" },
  { value: "closing", label: "Closing" },
  { value: "equipment", label: "Equipment" },
];

type CleaningTaskWithKind = CleaningTask & { taskKind?: "cleaning" | "opening" | "closing" | "equipment" };
type CleaningTaskInputWithKind = CleaningTaskInput & { taskKind?: "cleaning" | "opening" | "closing" | "equipment" };

function frequencyColor(freq: string) {
  const map: Record<string, string> = {
    daily: "bg-blue-100 text-blue-700",
    weekly: "bg-purple-100 text-purple-700",
    fortnightly: "bg-indigo-100 text-indigo-700",
    monthly: "bg-orange-100 text-orange-700",
    quarterly: "bg-slate-100 text-slate-600",
  };
  return map[freq] ?? "bg-slate-100 text-slate-600";
}

const emptyForm = (): CleaningTaskInputWithKind => ({
  title: "",
  area: "kitchen",
  frequency: "daily",
  taskKind: "cleaning",
  assignedTo: "",
  notes: "",
  isActive: true,
});

export default function CleaningRosterPage() {
  const { activeVenueId } = useVenueStore();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<CleaningTask | null>(null);
  const [form, setForm] = useState<CleaningTaskInputWithKind>(emptyForm());
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completingTask, setCompletingTask] = useState<CleaningTask | null>(null);
  const [completedBy, setCompletedBy] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [filterFreq, setFilterFreq] = useState<string>("all");
  const [filterKind, setFilterKind] = useState<string>("all");

  const { data: tasks = [], isLoading } = useListCleaningTasks(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId, queryKey: getListCleaningTasksQueryKey(activeVenueId ?? 0) },
  });
  const { data: logs = [] } = useListCleaningLogs(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId && showHistory, queryKey: getListCleaningLogsQueryKey(activeVenueId ?? 0) },
  });
  const { data: staff = [] } = useListVenueStaff(activeVenueId ?? 0, {
    query: { enabled: !!activeVenueId, queryKey: getListVenueStaffQueryKey(activeVenueId ?? 0) },
  });

  const invalidateTasks = () => qc.invalidateQueries({ queryKey: getListCleaningTasksQueryKey(activeVenueId ?? 0) });
  const invalidateLogs = () => qc.invalidateQueries({ queryKey: getListCleaningLogsQueryKey(activeVenueId ?? 0) });

  const createTask = useCreateCleaningTask({ mutation: { onSuccess: () => { invalidateTasks(); setShowTaskDialog(false); toast({ title: "Cleaning task added" }); } } });
  const updateTask = useUpdateCleaningTask({ mutation: { onSuccess: () => { invalidateTasks(); setShowTaskDialog(false); toast({ title: "Task updated" }); } } });
  const deleteTask = useDeleteCleaningTask({ mutation: { onSuccess: () => { invalidateTasks(); toast({ title: "Task removed" }); } } });
  const completeTask = useCompleteCleaningTask({ mutation: { onSuccess: () => { invalidateTasks(); invalidateLogs(); setShowCompleteDialog(false); setCompletedBy(""); setCompletionNotes(""); toast({ title: "Marked as clean" }); } } });

  const allTasks = tasks as CleaningTaskWithKind[];
  const filteredByKind = filterKind === "all" ? allTasks : allTasks.filter((t) => (t.taskKind ?? "cleaning") === filterKind);
  const filteredTasks = filterFreq === "all" ? filteredByKind : filteredByKind.filter((t) => t.frequency === filterFreq);
  const overdueTasks = filteredTasks.filter((t) => t.isOverdue && t.isActive);
  const upToDateTasks = filteredTasks.filter((t) => !t.isOverdue && t.isActive);
  const inactiveTasks = filteredTasks.filter((t) => !t.isActive);

  function openNew() {
    setEditingTask(null);
    setForm(emptyForm());
    setShowTaskDialog(true);
  }

  function openEdit(task: CleaningTask) {
    setEditingTask(task);
    setForm({
      title: task.title,
      area: task.area as CleaningTaskInput["area"],
      frequency: task.frequency as CleaningTaskInput["frequency"],
      taskKind: ((task as CleaningTaskWithKind).taskKind ?? "cleaning"),
      assignedTo: task.assignedTo ?? "",
      notes: task.notes ?? "",
      isActive: task.isActive,
    });
    setShowTaskDialog(true);
  }

  function openComplete(task: CleaningTask, e: React.MouseEvent) {
    e.stopPropagation();
    setCompletingTask(task);
    setCompletedBy("");
    setCompletionNotes("");
    setShowCompleteDialog(true);
  }

  function beginComplete(task: CleaningTask) {
    setCompletingTask(task);
    setCompletedBy("");
    setCompletionNotes("");
    setShowCompleteDialog(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVenueId) return;
    const payload: CleaningTaskInputWithKind = {
      ...form,
      assignedTo: form.assignedTo || undefined,
      notes: form.notes || undefined,
    };
    if (editingTask) {
      updateTask.mutate({ venueId: activeVenueId, taskId: editingTask.id, data: payload as CleaningTaskInput });
    } else {
      createTask.mutate({ venueId: activeVenueId, data: payload as CleaningTaskInput });
    }
  }

  function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVenueId || !completingTask || !completedBy.trim()) return;
    completeTask.mutate({
      venueId: activeVenueId,
      taskId: completingTask.id,
      data: { completedBy: completedBy.trim(), notes: completionNotes || undefined },
    });
  }

  if (!activeVenueId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select a venue to view the cleaning roster
      </div>
    );
  }

  const TaskCard = ({ task }: { task: CleaningTaskWithKind }) => (
    <div
      className={cn(
        "bg-card border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors",
        task.isOverdue && task.isActive && "border-red-300 bg-red-50/50"
      )}
      onClick={() => openEdit(task)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{task.title}</span>
            {task.isOverdue && task.isActive && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs text-muted-foreground">
              {AREAS.find((a) => a.value === task.area)?.label ?? task.area}
            </span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", frequencyColor(task.frequency))}>
              {FREQUENCIES.find((f) => f.value === task.frequency)?.label ?? task.frequency}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-secondary text-muted-foreground">
              {TASK_KINDS.find((k) => k.value === (task.taskKind ?? "cleaning"))?.label ?? "Cleaning"}
            </span>
            {task.assignedTo && (
              <span className="text-xs text-muted-foreground">
                {task.assignedTo}
              </span>
            )}
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground flex gap-3">
            {task.lastCompletedAt ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last done {formatDistanceToNow(new Date(task.lastCompletedAt), { addSuffix: true })}
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Never completed
              </span>
            )}
            {task.nextDueAt && (
              <span>Due {format(new Date(task.nextDueAt), "d MMM")}</span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={task.isOverdue ? "default" : "outline"}
          className={cn("flex-shrink-0", task.isOverdue && "bg-red-600 hover:bg-red-700")}
          onClick={(e) => openComplete(task, e)}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cleaning Roster</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {overdueTasks.length > 0
              ? `${overdueTasks.length} task${overdueTasks.length > 1 ? "s" : ""} overdue`
              : "All cleaning up to date"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const taskNameById = new Map(tasks.map(t => [t.id, t.title]));
              const rows = logs.map(l => [
                taskNameById.get(l.taskId) ?? `Task #${l.taskId}`,
                l.completedBy,
                l.completedAt ? new Date(l.completedAt).toLocaleString() : "",
                l.notes ?? "",
              ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
              const csv = ["Task,Completed By,Completed At,Notes", ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cleaning-log-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={logs.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-1.5" />
            {showHistory ? "Hide" : "Show"} History
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Checklist type filter */}
      <div className="flex gap-2 flex-wrap">
        {TASK_KINDS.map((kind) => (
          <button
            key={kind.value}
            onClick={() => setFilterKind(kind.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filterKind === kind.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {kind.label}
          </button>
        ))}
      </div>

      {/* Frequency filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "all", label: "All" }, ...FREQUENCIES].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterFreq(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filterFreq === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : filteredTasks.filter((t) => t.isActive).length === 0 && inactiveTasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No cleaning tasks yet</p>
          <p className="text-sm mt-1">Add your first cleaning schedule below</p>
          <Button className="mt-4" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Task
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Overdue ({overdueTasks.length})
              </h2>
              <div className="space-y-2">
                {overdueTasks.map((t) => (
                  <SwipeableRow
                    key={t.id}
                    rightAction={{ label: "Done", icon: <CheckCircle2 className="w-4 h-4" />, bgClass: "bg-green-600", onTrigger: () => beginComplete(t) }}
                  >
                    <TaskCard task={t} />
                  </SwipeableRow>
                ))}
              </div>
            </div>
          )}

          {/* Up to date */}
          {upToDateTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                Up to Date ({upToDateTasks.length})
              </h2>
              <div className="space-y-2">
                {upToDateTasks.map((t) => (
                  <SwipeableRow
                    key={t.id}
                    rightAction={{ label: "Done", icon: <CheckCircle2 className="w-4 h-4" />, bgClass: "bg-green-600", onTrigger: () => beginComplete(t) }}
                  >
                    <TaskCard task={t} />
                  </SwipeableRow>
                ))}
              </div>
            </div>
          )}

          {/* Inactive */}
          {inactiveTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                Inactive ({inactiveTasks.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {inactiveTasks.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            </div>
          )}

          {/* History log */}
          {showHistory && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4" />
                Completion History
              </h2>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completions logged yet.</p>
              ) : (
                <div className="space-y-1">
                  {logs.slice(0, 50).map((log) => {
                    const task = tasks.find((t) => t.id === log.taskId);
                    return (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                        <div>
                          <span className="font-medium">{task?.title ?? "Deleted task"}</span>
                          <span className="text-muted-foreground ml-2">by {log.completedBy}</span>
                          {log.notes && <span className="text-muted-foreground ml-2 text-xs">— {log.notes}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                          {format(new Date(log.completedAt), "d MMM, HH:mm")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit task dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Cleaning Task" : "New Cleaning Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Task</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Deep clean fryer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Area</Label>
                <Select value={form.area ?? "kitchen"} onValueChange={(v) => setForm({ ...form, area: v as CleaningTaskInput["area"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={form.frequency ?? "daily"} onValueChange={(v) => setForm({ ...form, frequency: v as CleaningTaskInput["frequency"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Checklist Type</Label>
              <Select value={form.taskKind ?? "cleaning"} onValueChange={(v) => setForm({ ...form, taskKind: v as CleaningTaskInputWithKind["taskKind"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_KINDS.filter((kind) => kind.value !== "all").map((kind) => (
                    <SelectItem key={kind.value} value={kind.value}>{kind.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <Select
                value={form.assignedTo ?? "__none__"}
                onValueChange={(v) => setForm({ ...form, assignedTo: v === "__none__" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}{s.role ? ` — ${s.role}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any instructions or notes..."
                rows={2}
              />
            </div>

            {editingTask && (
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.isActive ?? true}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            )}

            <div className="flex gap-2 justify-between pt-1">
              {editingTask && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (!activeVenueId) return;
                    deleteTask.mutate({ venueId: activeVenueId, taskId: editingTask.id });
                    setShowTaskDialog(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
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

      {/* Mark complete dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as Complete</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleComplete} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{completingTask?.title}</span> — log who completed this and when.
            </p>

            <div className="space-y-1.5">
              <Label>Completed by</Label>
              <Select
                value={completedBy || "__none__"}
                onValueChange={(v) => setCompletedBy(v === "__none__" ? "" : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select or type a name" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select staff...</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!staff.length && (
                <Input
                  placeholder="Enter name"
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any remarks..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={!completedBy.trim() || completeTask.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirm
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
