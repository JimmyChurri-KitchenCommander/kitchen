import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AppIcon } from "@/components/AppIcon";
import { useClerk } from "@clerk/react";
import DemoBanner from "@/components/DemoBanner";
import { useDemoStore } from "@/stores/demoStore";
import { useVenueStore } from "@/stores/venueStore";
import { useModuleStore } from "@/stores/moduleStore";
import { useListVenues } from "@workspace/api-client-react";
import { useVenueRole } from "@/hooks/use-venue-role";
import { useModules } from "@/hooks/use-modules";
import type { ModuleId } from "@/config/modules";
import {
  LayoutDashboard, Package, Truck, ChefHat, Trash2, Receipt,
  LineChart, Settings, Building, Menu, X, LogOut, Users,
  ShoppingCart, ClipboardList, Sparkles, ClipboardCheck,
  UtensilsCrossed, Thermometer, Archive, ChevronDown,
  Shield, Zap, Layers, GraduationCap, BookOpen,
  Scissors, Fish, Leaf, Droplets, Flame, Snowflake,
  FlaskConical, Atom, Scale, Wrench, FileText,
  ArrowLeftRight, AlertTriangle, Database, Pencil,
} from "lucide-react";
import { useApprenticeStore } from "@/stores/apprenticeModeStore";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  moduleId?: ModuleId;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  items: NavItem[];
};

// ── Navigation definition ─────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    id: "kitchen",
    label: "Kitchen Operations",
    icon: ChefHat,
    colorClass: "text-orange-500",
    items: [
      { href: "/service-mode",      label: "Service Mode", icon: Zap,             moduleId: "prep-board" },
      { href: "/prep-board",        label: "Prep Board",   icon: ClipboardList,   moduleId: "prep-board" },
      { href: "/recipes",           label: "Recipes",      icon: ChefHat,         moduleId: "recipes" },
      { href: "/menu",              label: "Menu",         icon: UtensilsCrossed, moduleId: "menu" },
      { href: "/staff-quick-start", label: "Staff Guide",  icon: GraduationCap },
    ],
  },
  {
    id: "stock",
    label: "Stock & Ordering",
    icon: Package,
    colorClass: "text-blue-500",
    items: [
      { href: "/inventory",  label: "Inventory",        icon: Package,       moduleId: "inventory" },
      { href: "/stocktake",  label: "Stocktake",        icon: ClipboardCheck, adminOnly: true, moduleId: "stocktake" },
      { href: "/suppliers",  label: "Suppliers",        icon: Truck,         moduleId: "suppliers" },
      { href: "/invoices",   label: "Invoices",         icon: Receipt,       moduleId: "invoices" },
      { href: "/orders",     label: "Suggested Orders", icon: ShoppingCart,  moduleId: "orders" },
    ],
  },
  {
    id: "safety",
    label: "Safety & Compliance",
    icon: Thermometer,
    colorClass: "text-emerald-600",
    items: [
      { href: "/temperature", label: "Temperature",    icon: Thermometer, moduleId: "temperature" },
      { href: "/cleaning",    label: "Cleaning",       icon: Sparkles,    moduleId: "cleaning" },
      { href: "/compliance",  label: "Chemical Safety", icon: Shield,     moduleId: "compliance" },
    ],
  },
  {
    id: "insights",
    label: "Insights & Control",
    icon: LineChart,
    colorClass: "text-purple-500",
    items: [
      { href: "/waste",     label: "Waste & Cost", icon: Trash2,    moduleId: "waste" },
      { href: "/analytics", label: "Analytics",    icon: LineChart, adminOnly: true, moduleId: "analytics" },
    ],
  },
  {
    id: "ki",
    label: "Kitchen Intelligence",
    icon: Flame,
    colorClass: "text-amber-500",
    items: [
      { href: "/kitchen-reference",      label: "Butchery Board",      icon: Scissors },
      { href: "/seafood-fabrication",    label: "Seafood Fabrication", icon: Fish },
      { href: "/knife-intelligence",     label: "Knife Intelligence",  icon: Pencil },
      { href: "/produce-cuts",           label: "Produce Cuts",        icon: Leaf },
      { href: "/sauce-systems",          label: "Sauce Systems",       icon: Droplets },
      { href: "/cooking-intelligence",   label: "Cooking Intelligence",icon: Flame },
      { href: "/preservation",           label: "Preservation",        icon: Snowflake },
      { href: "/fermentation",           label: "Fermentation",        icon: FlaskConical },
      { href: "/ingredient-science",     label: "Ingredient Science",  icon: Atom },
      { href: "/yield-intelligence",     label: "Yield Intelligence",  icon: Scale },
      { href: "/plating-systems",        label: "Plating Systems",     icon: Layers },
    ],
  },
  {
    id: "kr",
    label: "Kitchen Reference",
    icon: BookOpen,
    colorClass: "text-teal-500",
    items: [
      { href: "/reference/temperatures", label: "Temperatures",  icon: Thermometer },
      { href: "/reference/conversions",  label: "Conversions",   icon: ArrowLeftRight },
      { href: "/reference/allergens",    label: "Allergen Guide",icon: AlertTriangle },
      { href: "/reference/species",      label: "Species Guide", icon: Database },
      { href: "/reference/equipment",    label: "Equipment",     icon: Wrench },
      { href: "/reference/sop",          label: "SOP Library",   icon: FileText },
      { href: "/reference/terminology",  label: "Terminology",   icon: BookOpen },
    ],
  },
];

const SYSTEM_ITEMS: NavItem[] = [
  { href: "/venue-team",     label: "Team",          icon: Users,    adminOnly: true },
  { href: "/venues",         label: "Venues",        icon: Building },
  { href: "/module-settings", label: "Modules",      icon: Layers },
  { href: "/data-retention", label: "Data & Exports",icon: Archive, adminOnly: true },
  { href: "/settings",       label: "Settings",      icon: Settings },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActive(href: string, location: string) {
  return location === href || location.startsWith(`${href}/`);
}

function groupContainsRoute(group: NavGroup, location: string) {
  return group.items.some(i => isActive(i.href, location));
}

function buildInitialExpanded(location: string): Set<string> {
  const expanded = new Set<string>();
  for (const g of NAV_GROUPS) {
    if (groupContainsRoute(g, location)) expanded.add(g.id);
  }
  return expanded;
}

// ── NavGroupSection ───────────────────────────────────────────────────────────

function NavGroupSection({
  group, isExpanded, onToggle, location, isAdmin, onNavigate,
}: {
  group: NavGroup;
  isExpanded: boolean;
  onToggle: () => void;
  location: string;
  isAdmin: boolean;
  onNavigate: () => void;
}) {
  const { isEnabled } = useModules();

  const visibleItems = group.items.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.moduleId && !isEnabled(item.moduleId)) return false;
    return true;
  });

  if (visibleItems.length === 0) return null;

  const isActiveGroup = groupContainsRoute(group, location);

  return (
    <div className="mb-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-manipulation select-none",
          isActiveGroup
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <group.icon className={cn("w-4 h-4 flex-shrink-0", isActiveGroup ? group.colorClass : "opacity-60")} />
        <span className="flex-1 text-left text-[13px]">{group.label}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 opacity-50",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>

      <div
        style={{
          maxHeight: isExpanded ? `${visibleItems.length * 44}px` : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
        className="overflow-hidden transition-all duration-200 ease-in-out"
      >
        <div className="ml-3 pl-3 border-l-2 border-border/40 space-y-0.5 pb-1 pt-0.5">
          {visibleItems.map(item => {
            const active = isActive(item.href, location);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer touch-manipulation select-none",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────

function SidebarContent({ isMobile, onNavigate }: { isMobile: boolean; onNavigate: () => void }) {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { isDemoMode, deactivate: deactivateDemo } = useDemoStore();
  const { data: venues } = useListVenues();
  const { activeVenueId, setActiveVenueId } = useVenueStore();
  const { data: roleData } = useVenueRole();
  const isAdmin = roleData?.isAdmin ?? true;

  const isServiceMode =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("dashMode") !== "planning"
      : false;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    buildInitialExpanded(location)
  );

  useEffect(() => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      for (const g of NAV_GROUPS) {
        if (groupContainsRoute(g, location)) next.add(g.id);
      }
      return next;
    });
  }, [location]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleSystemItems = SYSTEM_ITEMS.filter(i => !i.adminOnly || isAdmin);

  const handleSignOut = () => {
    onNavigate();
    if (isDemoMode) { deactivateDemo(); setLocation("/"); }
    else signOut({ redirectUrl: "/" });
  };

  return (
    <>
      {/* Dashboard shortcut */}
      <div className={cn("px-3 pb-2", isMobile ? "pt-2" : "pt-0 mt-2")}>
        <Link href="/dashboard">
          <div
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer touch-manipulation select-none",
              location === "/dashboard"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Today's Dashboard
          </div>
        </Link>
      </div>

      {/* Service Mode badge */}
      {isServiceMode && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <Zap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">Service Mode On</span>
          </div>
        </div>
      )}

      {/* Grouped nav */}
      <div className="flex-1 px-2 overflow-y-auto space-y-0">
        {NAV_GROUPS.map(group => (
          <NavGroupSection
            key={group.id}
            group={group}
            isExpanded={expandedGroups.has(group.id)}
            onToggle={() => toggleGroup(group.id)}
            location={location}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* System footer */}
      <div className="px-2 pt-2 pb-2 border-t border-sidebar-border mt-auto">
        <button
          onClick={() => toggleGroup("system")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors touch-manipulation select-none mb-0.5"
        >
          <Settings className="w-4 h-4 flex-shrink-0 opacity-60" />
          <span className="flex-1 text-left text-[13px]">System</span>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 opacity-50 transition-transform duration-200",
            expandedGroups.has("system") ? "rotate-180" : ""
          )} />
        </button>

        <div
          style={{
            maxHeight: expandedGroups.has("system")
              ? `${(visibleSystemItems.length + 1) * 40}px`
              : "0px",
            opacity: expandedGroups.has("system") ? 1 : 0,
          }}
          className="overflow-hidden transition-all duration-200 ease-in-out"
        >
          <div className="ml-3 pl-3 border-l-2 border-border/40 space-y-0.5 pb-1 pt-0.5">
            {visibleSystemItems.map(item => {
              const active = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer touch-manipulation select-none",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors touch-manipulation select-none"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {isDemoMode ? "Exit Demo" : "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main AppLayout ────────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeVenueId, setActiveVenueId } = useVenueStore();
  const { setVenueModules } = useModuleStore();
  const { data: venues } = useListVenues();

  // Auto-select first venue
  useEffect(() => {
    if (!venues || venues.length === 0) return;
    const isValid = activeVenueId != null && venues.some(v => v.id === activeVenueId);
    if (!isValid) setActiveVenueId(venues[0].id);
  }, [venues, activeVenueId, setActiveVenueId]);

  // Sync enabled modules from DB into local store whenever the active venue changes
  useEffect(() => {
    if (!venues || activeVenueId == null) return;
    const venue = venues.find(v => v.id === activeVenueId);
    if (venue?.enabledModules && venue.enabledModules.length > 0) {
      setVenueModules(activeVenueId, venue.enabledModules as ModuleId[]);
    }
  }, [venues, activeVenueId, setVenueModules]);

  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DemoBanner />
      <div className="flex-1 flex flex-col md:flex-row">

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-border bg-card z-50 sticky top-0">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 touch-manipulation active:opacity-70 transition-opacity">
              <AppIcon className="w-8 h-8 flex-shrink-0" />
              <span className="font-bold text-[15px] tracking-tight leading-none">Kitchen Command</span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            {venues && venues.length > 0 && (
              <Select value={activeVenueId?.toString()} onValueChange={v => setActiveVenueId(parseInt(v))}>
                <SelectTrigger className="w-[110px] h-8 bg-background border-border text-xs font-medium">
                  <SelectValue placeholder="Venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(o => !o)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-60 md:flex-col md:flex-shrink-0 bg-sidebar border-r border-sidebar-border min-h-0">
          <Link href="/dashboard">
            <div className="px-4 py-3.5 flex items-center gap-3 hover:opacity-80 transition-opacity border-b border-sidebar-border/50 mb-1">
              <AppIcon className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-[15px] tracking-tight leading-tight">Kitchen Command</p>
                <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5 italic">Operational intelligence</p>
              </div>
            </div>
          </Link>

          {/* Venue selector */}
          <div className="px-3 pt-3 pb-2">
            {venues && venues.length > 0 ? (
              <Select value={activeVenueId?.toString()} onValueChange={v => setActiveVenueId(parseInt(v))}>
                <SelectTrigger className="w-full bg-background border-border font-medium text-sm h-9">
                  <SelectValue placeholder="Select Venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button variant="outline" className="w-full justify-start text-sm" asChild>
                <Link href="/venues">Add a Venue</Link>
              </Button>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <SidebarContent isMobile={false} onNavigate={() => {}} />
          </div>
        </aside>

        {/* Mobile slide-in */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={closeMobile}
          />
        )}
        <div className={cn(
          "fixed inset-y-0 right-0 z-40 w-72 bg-sidebar border-l border-sidebar-border flex flex-col transition-transform duration-250 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Mobile sidebar header */}
          <div className="px-4 pt-5 pb-4 border-b border-sidebar-border/50">
            <div className="flex items-center gap-2.5 mb-4">
              <AppIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-[15px] tracking-tight leading-tight">Kitchen Command</p>
                <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5 italic">Operational intelligence</p>
              </div>
            </div>
            {venues && venues.length > 0 && (
              <Select value={activeVenueId?.toString()} onValueChange={v => setActiveVenueId(parseInt(v))}>
                <SelectTrigger className="w-full h-9 bg-background border-border text-sm">
                  <SelectValue placeholder="Select Venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(v => (
                    <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <SidebarContent isMobile={true} onNavigate={closeMobile} />
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-[1200px] mx-auto h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
