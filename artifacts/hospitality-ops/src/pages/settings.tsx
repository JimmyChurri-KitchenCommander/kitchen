import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, User, Sun, Moon, Shield, Pencil, Check, X, Loader2, Lock, Clock, Activity, Zap, ChefHat } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useVenueRole } from "@/hooks/use-venue-role";
import { useVenueStore } from "@/stores/venueStore";
import { useApprenticeStore } from "@/stores/apprenticeModeStore";
import { useListVenues, useUpdateVenue, getGetVenueQueryKey, getListVenuesQueryKey } from "@workspace/api-client-react";
import type { ServiceWindow, ServiceModeConfig } from "@workspace/api-client-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const DEFAULT_WINDOWS: ServiceWindow[] = [
  { label: "Breakfast", startTime: "07:00", endTime: "10:00", enabled: false },
  { label: "Lunch",     startTime: "12:00", endTime: "14:30", enabled: false },
  { label: "Dinner",    startTime: "17:30", endTime: "22:00", enabled: false },
  { label: "Late",      startTime: "22:00", endTime: "00:00", enabled: false },
];

type UserProfileData = { nameChangeCount: number; isAdmin: boolean };

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { activeVenueId } = useVenueStore();
  const { theme, setTheme } = useTheme();
  const { apprenticeMode, setApprenticeMode } = useApprenticeStore();
  const { data: roleData, isLoading: roleLoading } = useVenueRole();
  const { data: venues } = useListVenues();
  const { toast } = useToast();

  const qc = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [serviceWindows, setServiceWindows] = useState<ServiceWindow[]>(DEFAULT_WINDOWS);
  const [v2Enabled, setV2Enabled] = useState(false);
  const [v3Enabled, setV3Enabled] = useState(false);

  useEffect(() => {
    const existing = venues?.find((v) => v.id === activeVenueId)?.serviceWindows;
    if (existing && existing.length > 0) {
      setServiceWindows(existing as ServiceWindow[]);
    } else {
      setServiceWindows(DEFAULT_WINDOWS);
    }
  }, [activeVenueId, venues]);

  useEffect(() => {
    const config = venues?.find((v) => v.id === activeVenueId)?.serviceModeConfig as ServiceModeConfig | null | undefined;
    setV2Enabled(config?.v2Enabled ?? false);
    setV3Enabled(config?.v3Enabled ?? false);
  }, [activeVenueId, venues]);

  const updateVenueMutation = useUpdateVenue({
    mutation: {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: getGetVenueQueryKey(activeVenueId as number) });
        void qc.invalidateQueries({ queryKey: getListVenuesQueryKey() });
        toast({ title: "Service schedule saved" });
      },
      onError: () => toast({ title: "Failed to save schedule", variant: "destructive" }),
    },
  });

  const intelligenceMutation = useUpdateVenue({
    mutation: {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: getGetVenueQueryKey(activeVenueId as number) });
        void qc.invalidateQueries({ queryKey: getListVenuesQueryKey() });
        toast({ title: "Intelligence settings saved" });
      },
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    },
  });

  const saveServiceWindows = () => {
    if (!activeVenueId) return;
    updateVenueMutation.mutate({ venueId: activeVenueId, data: { serviceWindows } });
  };

  const saveIntelligenceConfig = () => {
    if (!activeVenueId) return;
    intelligenceMutation.mutate({
      venueId: activeVenueId,
      data: { serviceModeConfig: { v2Enabled, v3Enabled } as ServiceModeConfig },
    });
  };

  const { data: profileData, refetch: refetchProfile } = useQuery<UserProfileData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json() as Promise<UserProfileData>;
    },
    enabled: isLoaded && !!user,
  });

  const activeVenue = venues?.find((v) => v.id === activeVenueId);
  const canEditName = profileData?.isAdmin || (profileData?.nameChangeCount ?? 0) === 0;
  const nameLocked = !canEditName && profileData !== undefined;

  const startEditName = () => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setEditingName(true);
  };

  const cancelEditName = () => {
    setEditingName(false);
    setFirstName("");
    setLastName("");
  };

  const saveName = async () => {
    if (!user) return;
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();
    if (!trimFirst) {
      toast({ title: "First name is required", variant: "destructive" });
      return;
    }
    setSavingName(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: trimFirst, lastName: trimLast }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((err as { error?: string }).error ?? "Failed to update");
      }
      await user.reload();
      await refetchProfile();
      setEditingName(false);
      toast({ title: "Name updated", description: "Your display name has been saved." });
    } catch (err) {
      toast({
        title: "Could not save name",
        description: err instanceof Error ? err.message : "Something went wrong — please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingName(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-8 bg-card" />
        <Skeleton className="h-64 w-full max-w-2xl bg-card" />
      </div>
    );
  }

  const roleBadge = () => {
    if (!roleData) return null;
    if (roleData.isOwner) return { label: "Owner", className: "border-amber-400/40 text-amber-600 bg-amber-50" };
    if (roleData.isAdmin) return { label: "Admin", className: "border-primary/40 text-primary bg-primary/5" };
    if (roleData.isUser) return { label: "Crew", className: "border-border text-muted-foreground" };
    return null;
  };

  const badge = roleBadge();

  return (
    <div className="space-y-6 pb-20 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <img
              src={user?.imageUrl}
              alt={user?.fullName || "User"}
              className="w-20 h-20 rounded-full border-2 border-border shrink-0"
            />
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="bg-background border-border"
                        disabled={savingName}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="bg-background border-border"
                        disabled={savingName}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveName();
                          if (e.key === "Escape") cancelEditName();
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void saveName()}
                      disabled={savingName || !firstName.trim()}
                      className="gap-1.5"
                    >
                      {savingName ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {savingName ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEditName} disabled={savingName} className="gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">{user?.fullName}</h2>
                    {canEditName ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={startEditName}
                        className="text-muted-foreground hover:text-foreground gap-1.5 h-7 px-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    ) : nameLocked ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        Ask an admin to change your name
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Name update affects</p>
            <p className="text-sm text-muted-foreground">
              Your display name appears on prep task assignments, cleaning tasks, and team member lists across all your venues.
              {!profileData?.isAdmin && (
                <span className="block mt-1">
                  {profileData?.nameChangeCount === 0
                    ? "You can set your name once. After that, ask your venue admin to update it."
                    : "Your name has been set. Contact your venue admin if you need it changed."}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {activeVenueId && (
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Venue Access
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {roleLoading ? (
              <Skeleton className="h-10 w-full bg-secondary" />
            ) : badge ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeVenue?.name ?? "Current Venue"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {roleData?.isOwner
                      ? "You created this venue and have full control."
                      : roleData?.isAdmin
                      ? "You have admin access — you can manage team members, inventory, and settings."
                      : "You have standard member access to this venue."}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-sm px-3 py-1 font-semibold shrink-0", badge.className)}
                >
                  {badge.label}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No access to this venue.</p>
            )}

            {venues && venues.length > 1 && (
              <div className="mt-5 pt-5 border-t border-border space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                  All venues
                </p>
                {venues.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm py-1">
                    <span className={cn(
                      "font-medium",
                      v.id === activeVenueId ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {v.name}
                    </span>
                    {v.id === activeVenueId && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                        Active
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeVenueId && (roleData?.isOwner || roleData?.isAdmin) && (
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Service Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              Set your daily service windows. The dashboard will show a live countdown to the next service, and the prep board can sort tasks by urgency relative to service time.
            </p>
            <div className="space-y-3">
              {serviceWindows.map((w, i) => (
                <div key={w.label} className={cn(
                  "flex flex-col gap-2 p-3 rounded-lg border transition-colors",
                  w.enabled ? "border-primary/30 bg-primary/5" : "border-border bg-background"
                )}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`sw-${i}`}
                      checked={w.enabled}
                      onCheckedChange={(checked) =>
                        setServiceWindows(prev => prev.map((x, j) => j === i ? { ...x, enabled: Boolean(checked) } : x))
                      }
                    />
                    <label
                      htmlFor={`sw-${i}`}
                      className={cn(
                        "text-sm font-semibold cursor-pointer select-none",
                        w.enabled ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {w.label}
                    </label>
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                    <Input
                      type="time"
                      value={w.startTime}
                      disabled={!w.enabled}
                      onChange={(e) =>
                        setServiceWindows(prev => prev.map((x, j) => j === i ? { ...x, startTime: e.target.value } : x))
                      }
                      className="h-8 text-sm flex-1 min-w-0 bg-background disabled:opacity-40"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">to</span>
                    <Input
                      type="time"
                      value={w.endTime}
                      disabled={!w.enabled}
                      onChange={(e) =>
                        setServiceWindows(prev => prev.map((x, j) => j === i ? { ...x, endTime: e.target.value } : x))
                      }
                      className="h-8 text-sm flex-1 min-w-0 bg-background disabled:opacity-40"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={saveServiceWindows}
              disabled={updateVenueMutation.isPending}
              className="gap-1.5"
            >
              {updateVenueMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {updateVenueMutation.isPending ? "Saving..." : "Save Schedule"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeVenueId && (roleData?.isOwner || roleData?.isAdmin) && (
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Service Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground mb-1">
              The chef decides how intelligent the kitchen becomes. These are opt-in layers — your core system works exactly as it is, and you activate deeper intelligence only when you're ready.
            </p>
            <p className="text-xs text-muted-foreground/60 italic">
              Suggestions only — Kitchen Command assists your decisions, it never overrides them.
            </p>

            <div className="space-y-3">
              <div className={cn(
                "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                v2Enabled ? "border-amber-400/40 bg-amber-50/5 dark:bg-amber-950/10" : "border-border bg-background"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-bold text-foreground">Operational Pressure Layer</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 ml-1">v2</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Live Service Pressure Score, station workload balancing, task feasibility warnings, and reality check banner when you're falling behind.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !v2Enabled;
                    setV2Enabled(next);
                    if (!next) setV3Enabled(false);
                  }}
                  className={cn(
                    "shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors",
                    v2Enabled
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {v2Enabled ? "ON" : "OFF"}
                </button>
              </div>

              <div className={cn(
                "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                !v2Enabled && "opacity-50 cursor-not-allowed",
                v3Enabled ? "border-red-400/40 bg-red-50/5 dark:bg-red-950/10" : "border-border bg-background"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm font-bold text-foreground">Operational Intelligence Layer</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-500 ml-1">v3</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Focus Queue, bottleneck detection, stop-doing recommendations, staffing imbalance insights, and Chef Mode (Assist / Directive / Silent).
                  </p>
                  {!v2Enabled && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-semibold">
                      Requires the Pressure Layer (v2) to be enabled first
                    </p>
                  )}
                </div>
                <button
                  disabled={!v2Enabled}
                  onClick={() => v2Enabled && setV3Enabled(v => !v)}
                  className={cn(
                    "shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors",
                    !v2Enabled && "pointer-events-none",
                    v3Enabled
                      ? "bg-red-500 border-red-500 text-white"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {v3Enabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                size="sm"
                onClick={saveIntelligenceConfig}
                disabled={intelligenceMutation.isPending}
                className="gap-1.5"
              >
                {intelligenceMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Check className="w-3.5 h-3.5" />}
                {intelligenceMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Changes take effect immediately across your dashboard and prep board.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Choose how Kitchen Command looks. Dark mode matches the command-centre aesthetic — light mode is optimised for bright kitchen environments.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
                theme === "dark"
                  ? "border-primary bg-primary/8"
                  : "border-border bg-background hover:border-border/80 hover:bg-muted/40"
              )}
            >
              <div className="w-full h-16 rounded-lg bg-[#080f1f] border border-white/10 flex items-end px-3 pb-2 gap-1.5 overflow-hidden">
                <div className="w-2 h-6 rounded-sm bg-[#1464D8]/80" />
                <div className="w-2 h-10 rounded-sm bg-[#1464D8]" />
                <div className="w-2 h-7 rounded-sm bg-[#1464D8]/60" />
                <div className="w-2 h-9 rounded-sm bg-[#1464D8]/80" />
                <div className="flex-1 h-3 rounded-sm bg-white/10 mb-3.5 ml-1" />
              </div>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-foreground" />
                <span className="text-sm font-semibold text-foreground">Dark</span>
                {theme === "dark" && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
            </button>

            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
                theme === "light"
                  ? "border-primary bg-primary/8"
                  : "border-border bg-background hover:border-border/80 hover:bg-muted/40"
              )}
            >
              <div className="w-full h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-end px-3 pb-2 gap-1.5 overflow-hidden">
                <div className="w-2 h-6 rounded-sm bg-[#1464D8]/60" />
                <div className="w-2 h-10 rounded-sm bg-[#1464D8]" />
                <div className="w-2 h-7 rounded-sm bg-[#1464D8]/50" />
                <div className="w-2 h-9 rounded-sm bg-[#1464D8]/70" />
                <div className="flex-1 h-3 rounded-sm bg-slate-200 mb-3.5 ml-1" />
              </div>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-foreground" />
                <span className="text-sm font-semibold text-foreground">Light</span>
                {theme === "light" && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Apprentice Mode ── */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Operational Support
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Apprentice Mode adds inline guidance for any member of the team — quick instructions on prep task cards, technique science on recipe steps, cost metric explanations, and glossary tooltips for kitchen terms. It changes how information is presented to you. Nothing else.
          </p>
          <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-secondary/40 border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">Apprentice Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable for your account only. Other team members are unaffected.
              </p>
            </div>
            <Switch
              checked={apprenticeMode}
              onCheckedChange={setApprenticeMode}
              aria-label="Toggle Apprentice Mode"
            />
          </div>
          {apprenticeMode && (
            <>
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/8 border border-primary/20 text-xs text-primary">
                <ChefHat className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Apprentice Mode is on. Tap the help icon on any cost metric or recipe card to see how the numbers connect to real kitchen decisions.
                </span>
              </div>
              {roleData && (roleData.isOwner || roleData.isAdmin) && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-foreground/40" />
                  <span>
                    Your{" "}
                    <span className="font-semibold text-foreground/70">
                      {roleData.isOwner ? "owner" : "admin"}
                    </span>{" "}
                    permissions are fully intact. Apprentice Mode only changes how information is presented — it does not affect what you can access, edit, or manage.
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
