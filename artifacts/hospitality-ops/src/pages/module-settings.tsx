import { useState } from "react";
import { MODULE_DEFINITIONS, CORE_MODULES, type ModuleId, type ModuleGroup } from "@/config/modules";
import { useModules } from "@/hooks/use-modules";
import { Lock, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUP_META: Record<ModuleGroup, { label: string; description: string }> = {
  operations: { label: "Operations", description: "Core inventory and supplier systems — always active." },
  production: { label: "Production & Kitchen", description: "Prep boards, recipe costing, and menu management." },
  stock: { label: "Stock Control", description: "Stocktakes, order suggestions, and stock intelligence." },
  compliance: { label: "Compliance & Safety", description: "Temperature, cleaning, and chemical safety systems." },
  analytics: { label: "Analytics & Reporting", description: "Advanced cost analysis and operational insights." },
};

const COMPLEXITY_LABEL: Record<"simple" | "moderate" | "advanced", { label: string; color: string }> = {
  simple: { label: "Quick setup", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15" },
  moderate: { label: "Some setup", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15" },
  advanced: { label: "Advanced", color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/15" },
};

const GROUP_ORDER: ModuleGroup[] = ["operations", "production", "stock", "compliance", "analytics"];

export default function ModulesPage() {
  const { isEnabled, toggle } = useModules();
  const [saving, setSaving] = useState<ModuleId | null>(null);

  const handleToggle = (moduleId: ModuleId, isCore: boolean) => {
    if (isCore) return;
    setSaving(moduleId);
    toggle(moduleId, !isEnabled(moduleId));
    setTimeout(() => setSaving(null), 300);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Modules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable the modules your venue uses. Disabled modules are hidden from the sidebar — data is preserved and can be restored at any time.
        </p>
      </div>

      <div className="space-y-8">
        {GROUP_ORDER.map(group => {
          const meta = GROUP_META[group];
          const modules = MODULE_DEFINITIONS.filter(m => m.group === group);

          return (
            <div key={group}>
              <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{meta.label}</h2>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{meta.description}</p>
              </div>

              <div className="space-y-2">
                {modules.map(mod => {
                  const enabled = isEnabled(mod.id);
                  const isCore = CORE_MODULES.includes(mod.id);
                  const isSaving = saving === mod.id;
                  const cx = COMPLEXITY_LABEL[mod.complexity];

                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleToggle(mod.id, isCore)}
                      disabled={isCore || isSaving}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-xl border text-left transition-all",
                        isCore
                          ? "bg-muted/40 border-border cursor-default"
                          : enabled
                          ? "bg-card border-primary/30 shadow-sm hover:border-primary/50 cursor-pointer"
                          : "bg-card border-border hover:border-border/80 opacity-70 hover:opacity-90 cursor-pointer"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isCore ? "bg-muted" : enabled ? "bg-primary/10" : "bg-muted"
                      )}>
                        <mod.icon className={cn(
                          "w-5 h-5",
                          isCore ? "text-muted-foreground" : enabled ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "text-sm font-semibold",
                            enabled || isCore ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {mod.name}
                          </span>
                          {isCore && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              Core
                            </span>
                          )}
                          <span className={cn("text-[10px] font-semibold rounded px-1.5 py-0.5", cx.color)}>
                            {cx.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mod.description}</p>
                      </div>

                      {/* Toggle indicator */}
                      <div className="shrink-0 ml-2">
                        {isCore ? (
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                        ) : enabled ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/40" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground/60 text-center mt-10 pb-4">
        Module settings are saved locally per device. Your data is always preserved.
      </p>
    </div>
  );
}
