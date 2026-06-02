import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppIcon } from "@/components/AppIcon";
import {
  useCreateVenue, useUpdateVenue, useListVenues,
  useApplyStarterPack,
  getListVenuesQueryKey,
} from "@workspace/api-client-react";
import { useVenueStore } from "@/stores/venueStore";
import { useModuleStore } from "@/stores/moduleStore";
import { useQueryClient } from "@tanstack/react-query";
import { DEFAULT_ENABLED_MODULES, type ModuleId } from "@/config/modules";
import {
  ClipboardList, ChefHat, Package, Thermometer,
  Check, Loader2, ArrowRight, Coffee, Utensils,
  Beer, Star, Croissant, Beef, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

type SetupIntent = "prep" | "full_ops" | "food_cost" | "compliance";
type ServicePreset = "lunch" | "dinner";

// ── Constants ───────────────────────────────────────────────────────────────

const INTENT_OPTIONS: {
  id: SetupIntent;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}[] = [
  { id: "prep",        Icon: ClipboardList, label: "Prep management",           sub: "Organise tasks, stations and team assignments" },
  { id: "full_ops",    Icon: ChefHat,       label: "Full kitchen operations",    sub: "Prep, stock, compliance, waste, costs" },
  { id: "food_cost",   Icon: Package,       label: "Food cost + inventory",      sub: "Track stock, recipes, invoices and GP%" },
  { id: "compliance",  Icon: Thermometer,   label: "Compliance only",            sub: "Temperature logs, MSDS, cleaning schedules" },
];

const TEAM_SIZES = [
  { id: "1-5",  label: "1–5" },
  { id: "6-15", label: "6–15" },
  { id: "16-30",label: "16–30" },
  { id: "30+",  label: "30+" },
];

const SERVICE_PRESETS: Record<ServicePreset, { label: string; startTime: string; endTime: string }> = {
  lunch:  { label: "Lunch",  startTime: "12:00", endTime: "14:30" },
  dinner: { label: "Dinner", startTime: "17:30", endTime: "22:00" },
};

const TEAM_SIZE_MAP: Record<string, number> = {
  "1-5": 3, "6-15": 10, "16-30": 22, "30+": 35,
};

function modulesForIntent(intent: SetupIntent): ModuleId[] {
  switch (intent) {
    case "prep":       return ["prep-board", "inventory", "waste", "temperature", "compliance", "suppliers"] as ModuleId[];
    case "food_cost":  return ["inventory", "suppliers", "invoices", "recipes", "stocktake", "temperature", "compliance", "waste"] as ModuleId[];
    case "compliance": return ["temperature", "compliance", "cleaning"] as ModuleId[];
    case "full_ops":
    default:           return DEFAULT_ENABLED_MODULES;
  }
}

function destinationForIntent(intent: SetupIntent): string {
  switch (intent) {
    case "prep":       return "/prep-board";
    case "food_cost":  return "/inventory";
    case "compliance": return "/temperature";
    default:           return "/dashboard";
  }
}

// ── Shared Chip ─────────────────────────────────────────────────────────────

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 touch-manipulation select-none",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-foreground hover:border-primary/50"
      )}
    >
      {label}
    </button>
  );
}

// ── Screen 1: Setup Intent ──────────────────────────────────────────────────

function ScreenIntent({
  intent,
  setIntent,
  onNext,
  onDemo,
}: {
  intent: SetupIntent | "";
  setIntent: (v: SetupIntent) => void;
  onNext: () => void;
  onDemo: () => void;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="flex items-center gap-3 px-6 pt-8 pb-2">
        <AppIcon className="w-9 h-9" />
        <span className="font-bold text-base tracking-tight text-foreground">Kitchen Command</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-foreground leading-snug mb-2">
            What are you using this for today?
          </h1>
          <p className="text-sm text-muted-foreground">
            Shapes your starting view. Change it any time from Settings.
          </p>
        </div>

        <div className="space-y-3">
          {INTENT_OPTIONS.map(({ id, Icon, label, sub }) => (
            <button
              key={id}
              type="button"
              onClick={() => setIntent(id)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-2xl border transition-all duration-150 text-left touch-manipulation",
                intent === id
                  ? "bg-primary/8 border-primary"
                  : "bg-card border-border hover:border-primary/40"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                intent === id ? "bg-primary/20" : "bg-muted"
              )}>
                <Icon className={cn("w-4.5 h-4.5", intent === id ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-bold leading-tight", intent === id ? "text-primary" : "text-foreground")}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>
              </div>
              {intent === id && (
                <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-10 pt-4 space-y-3">
        <Button
          size="lg"
          className="w-full h-14 text-base font-bold rounded-xl"
          onClick={onNext}
          disabled={!intent}
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
        <button
          type="button"
          onClick={onDemo}
          className="w-full py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
        >
          Explore the demo kitchen first
        </button>
      </div>
    </div>
  );
}

// ── Screen 2: Your Kitchen ──────────────────────────────────────────────────

function ScreenKitchen({
  venueName,
  setVenueName,
  teamSize,
  setTeamSize,
  servicePresets,
  togglePreset,
  onBack,
  onNext,
  isLoading,
}: {
  venueName: string;
  setVenueName: (v: string) => void;
  teamSize: string;
  setTeamSize: (v: string) => void;
  servicePresets: Set<ServicePreset>;
  togglePreset: (p: ServicePreset) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  const canContinue = venueName.trim().length > 0;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6 touch-manipulation"
        >
          Back
        </button>
        <h2 className="text-2xl font-black text-foreground mb-1">Your kitchen</h2>
        <p className="text-sm text-muted-foreground">Takes less than a minute.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-8">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-foreground/50 mb-3">
            Kitchen name
          </label>
          <Input
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            placeholder="e.g. The Black Apron, Station Kitchen"
            className="h-12 text-base font-medium rounded-xl border-border bg-card"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-foreground/50 mb-3">
            Team size
          </label>
          <div className="flex flex-wrap gap-2">
            {TEAM_SIZES.map(t => (
              <Chip key={t.id} label={t.label} selected={teamSize === t.id} onClick={() => setTeamSize(t.id)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-foreground/50 mb-1">
            Service times
            <span className="text-foreground/30 font-normal normal-case tracking-normal ml-2">(optional)</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Tap to enable. Exact times can be adjusted in Settings.
          </p>
          <div className="flex gap-3">
            {(["lunch", "dinner"] as ServicePreset[]).map(p => {
              const preset = SERVICE_PRESETS[p];
              const selected = servicePresets.has(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePreset(p)}
                  className={cn(
                    "flex-1 rounded-2xl border p-4 text-left transition-all duration-150 touch-manipulation",
                    selected
                      ? "bg-primary/8 border-primary"
                      : "bg-card border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-sm font-bold", selected ? "text-primary" : "text-foreground")}>
                      {preset.label}
                    </span>
                    {selected && (
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {preset.startTime} – {preset.endTime}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 pt-4">
        <Button
          size="lg"
          className="w-full h-14 text-base font-bold rounded-xl"
          onClick={onNext}
          disabled={!canContinue || isLoading}
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Setting up...</>
          ) : (
            <>Continue <ArrowRight className="w-5 h-5 ml-1" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Screen 3: Starter Pack ──────────────────────────────────────────────────

type Archetype = "cafe" | "restaurant" | "bistro" | "pub" | "fine_dining" | "bakery" | "burger" | "hotel";

const ARCHETYPE_OPTIONS: {
  id: Archetype;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  seeds: string;
}[] = [
  {
    id: "cafe",
    Icon: Coffee,
    label: "Cafe",
    sub: "Coffee, all-day menu, pastry",
    seeds: "5 supplier slots · 5 prep templates · 3 chemical SOPs",
  },
  {
    id: "restaurant",
    Icon: Utensils,
    label: "Restaurant",
    sub: "À la carte, casual or mid-range dining",
    seeds: "6 supplier slots · 5 prep templates · 3 chemical SOPs",
  },
  {
    id: "bistro",
    Icon: ChefHat,
    label: "Bistro",
    sub: "European-style, neighbourhood bistro",
    seeds: "5 supplier slots · 5 prep templates · 3 chemical SOPs",
  },
  {
    id: "pub",
    Icon: Beer,
    label: "Pub / Bar Kitchen",
    sub: "Pub food, casual dining, bar menu",
    seeds: "6 supplier slots · 5 prep templates · 3 chemical SOPs",
  },
  {
    id: "fine_dining",
    Icon: Star,
    label: "Fine Dining",
    sub: "Restaurant, tasting menu, premium service",
    seeds: "6 supplier slots · 5 prep templates · 3 chemical SOPs",
  },
  {
    id: "bakery",
    Icon: Croissant,
    label: "Bakery / Patisserie",
    sub: "Bread, pastry, cakes, and baked goods",
    seeds: "5 supplier slots · 5 prep templates · 3 chemical SOPs",
  },
  {
    id: "burger",
    Icon: Beef,
    label: "Burger / Fast-Casual",
    sub: "Burgers, fries, and counter service",
    seeds: "6 supplier slots · 5 prep templates · 3 chemical SOPs",
  },
  {
    id: "hotel",
    Icon: Building2,
    label: "Hotel Kitchen",
    sub: "Hotel, function venue, high-volume service",
    seeds: "7 supplier slots · 5 prep templates · 4 chemical SOPs",
  },
];

function ScreenStarterPack({
  onApply,
  onSkip,
  isLoading,
}: {
  onApply: (archetype: Archetype) => void;
  onSkip: () => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState<Archetype | null>(null);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <AppIcon className="w-9 h-9" />
          <span className="font-bold text-base tracking-tight text-foreground">Kitchen Command</span>
        </div>
        <h2 className="text-2xl font-black text-foreground mb-1">What type of kitchen?</h2>
        <p className="text-sm text-muted-foreground">
          We'll scaffold your kitchen structure — categories, prep templates, and chemical SOPs. You add your real suppliers and stock — no fake numbers.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2.5">
        {ARCHETYPE_OPTIONS.map(({ id, Icon, label, sub, seeds }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected(id)}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-2xl border transition-all duration-150 text-left touch-manipulation",
              selected === id
                ? "bg-primary/8 border-primary"
                : "bg-card border-border hover:border-primary/40"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
              selected === id ? "bg-primary/20" : "bg-muted"
            )}>
              <Icon className={cn("w-4.5 h-4.5", selected === id ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-bold leading-tight", selected === id ? "text-primary" : "text-foreground")}>
                {label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>
              {selected === id && (
                <p className="text-[11px] text-primary/70 font-semibold mt-1.5">{seeds}</p>
              )}
            </div>
            {selected === id && (
              <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="px-6 pb-10 pt-4 space-y-3">
        <Button
          size="lg"
          className="w-full h-14 text-base font-bold rounded-xl"
          onClick={() => selected && onApply(selected)}
          disabled={!selected || isLoading}
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Setting up your kitchen...</>
          ) : (
            <>Load starter pack <ArrowRight className="w-5 h-5 ml-1" /></>
          )}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          className="w-full py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors touch-manipulation disabled:opacity-50"
        >
          Skip — I'll add everything manually
        </button>
      </div>
    </div>
  );
}

// ── Screen 4: Ready ─────────────────────────────────────────────────────────

function ScreenReady({
  venueName,
  setupIntent,
  onGoToPrepBoard,
  onGoToDashboard,
  isLoading,
}: {
  venueName: string;
  setupIntent: SetupIntent | "";
  onGoToPrepBoard: () => void;
  onGoToDashboard: () => void;
  isLoading: boolean;
}) {
  const primaryDest = setupIntent ? destinationForIntent(setupIntent) : "/prep-board";
  const isPrepFirst = primaryDest === "/prep-board";

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background px-6">
      <div className="flex items-center gap-3 pt-8 pb-0">
        <AppIcon className="w-9 h-9" />
        <span className="font-bold text-base tracking-tight text-foreground">Kitchen Command</span>
      </div>

      <div className="flex-1 flex flex-col justify-center py-10 max-w-xs mx-auto w-full">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-8">
          <Check className="w-7 h-7 text-emerald-500" />
        </div>

        <h2 className="text-3xl font-black text-foreground leading-tight mb-3">
          {venueName ? `${venueName} is ready.` : "Your kitchen is ready."}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed mb-2">
          {isPrepFirst
            ? "Your prep board is live. Add your first task and you're off."
            : "Everything is set up. Explore your kitchen below."}
        </p>
        <p className="text-xs text-muted-foreground">
          No tour. No walkthroughs. Just the kitchen.
        </p>
      </div>

      <div className="pb-10 pt-4 space-y-3">
        <Button
          size="lg"
          className="w-full h-14 text-base font-bold rounded-xl"
          onClick={isPrepFirst ? onGoToPrepBoard : onGoToDashboard}
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</>
          ) : isPrepFirst ? (
            <>Add your first task <ArrowRight className="w-5 h-5 ml-1" /></>
          ) : (
            <>Open your kitchen <ArrowRight className="w-5 h-5 ml-1" /></>
          )}
        </Button>
        <button
          type="button"
          onClick={isPrepFirst ? onGoToDashboard : onGoToPrepBoard}
          disabled={isLoading}
          className="w-full py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors touch-manipulation disabled:opacity-50"
        >
          {isPrepFirst ? "Take a look around the dashboard" : "Go to the prep board"}
        </button>
      </div>
    </div>
  );
}

// ── Main Onboarding Page ────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { setActiveVenueId } = useVenueStore();
  const { setVenueModules } = useModuleStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [setupIntent, setSetupIntent] = useState<SetupIntent | "">("");
  const [venueName, setVenueName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [servicePresets, setServicePresets] = useState<Set<ServicePreset>>(new Set());
  const [createdVenueId, setCreatedVenueId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue();
  const applyStarterPack = useApplyStarterPack();

  const { data: existingVenues } = useListVenues();
  useEffect(() => {
    if (!existingVenues) return;
    if (existingVenues.some(v => v.onboardingCompleted)) {
      setLocation("/dashboard");
      return;
    }
    const incomplete = existingVenues.find(v => !v.onboardingCompleted);
    if (incomplete) {
      setCreatedVenueId(incomplete.id);
      setVenueName(incomplete.name);
      setStep(2);
    }
  }, [existingVenues, setLocation]);

  const togglePreset = (p: ServicePreset) => {
    setServicePresets(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const handleKitchenNext = async () => {
    if (!venueName.trim()) return;
    setIsLoading(true);
    try {
      let venueId = createdVenueId;
      if (!venueId) {
        const venue = await createVenue.mutateAsync({
          data: {
            name: venueName.trim(),
            teamSize: teamSize ? TEAM_SIZE_MAP[teamSize] : undefined,
            currency: "AUD",
          },
        });
        venueId = venue.id;
        setCreatedVenueId(venueId);
        setActiveVenueId(venueId);
      } else {
        await updateVenue.mutateAsync({
          venueId,
          data: {
            name: venueName.trim(),
            teamSize: teamSize ? TEAM_SIZE_MAP[teamSize] : undefined,
          },
        });
      }
      setStep(3);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStarterPack = async (archetype: Archetype) => {
    if (!createdVenueId) { setStep(4); return; }
    setIsLoading(true);
    try {
      await applyStarterPack.mutateAsync({ venueId: createdVenueId, data: { archetype } });
    } catch {
      // Non-blocking — continue to ready screen even if seeding fails
    } finally {
      setIsLoading(false);
    }
    setStep(4);
  };

  const handleSkipStarterPack = () => setStep(4);

  const handleLaunch = async (destination: string) => {
    if (!createdVenueId) return;
    setIsLoading(true);
    try {
      const modules = setupIntent ? modulesForIntent(setupIntent) : DEFAULT_ENABLED_MODULES;
      const windows = Array.from(servicePresets).map(p => ({
        label: SERVICE_PRESETS[p].label,
        startTime: SERVICE_PRESETS[p].startTime,
        endTime: SERVICE_PRESETS[p].endTime,
        enabled: true as const,
      }));
      await updateVenue.mutateAsync({
        venueId: createdVenueId,
        data: {
          onboardingCompleted: true,
          enabledModules: modules,
          staffRole: undefined,
          serviceWindows: windows.length > 0 ? windows : undefined,
        },
      });
      setVenueModules(createdVenueId, modules);
      setActiveVenueId(createdVenueId);
      await queryClient.invalidateQueries({ queryKey: getListVenuesQueryKey() });
      setLocation(destination);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {step === 1 && (
        <ScreenIntent
          intent={setupIntent}
          setIntent={setSetupIntent}
          onNext={() => setStep(2)}
          onDemo={() => setLocation("/demo-kitchen")}
        />
      )}
      {step === 2 && (
        <ScreenKitchen
          venueName={venueName}
          setVenueName={setVenueName}
          teamSize={teamSize}
          setTeamSize={setTeamSize}
          servicePresets={servicePresets}
          togglePreset={togglePreset}
          onBack={() => setStep(1)}
          onNext={handleKitchenNext}
          isLoading={isLoading}
        />
      )}
      {step === 3 && (
        <ScreenStarterPack
          onApply={archetype => void handleApplyStarterPack(archetype)}
          onSkip={handleSkipStarterPack}
          isLoading={isLoading}
        />
      )}
      {step === 4 && (
        <ScreenReady
          venueName={venueName}
          setupIntent={setupIntent}
          onGoToPrepBoard={() => void handleLaunch("/prep-board")}
          onGoToDashboard={() => void handleLaunch("/dashboard")}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
