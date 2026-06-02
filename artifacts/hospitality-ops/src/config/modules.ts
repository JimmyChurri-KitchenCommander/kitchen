import {
  Package, Truck, Receipt, Trash2, Thermometer, ShieldCheck,
  ClipboardList, ChefHat, UtensilsCrossed, Sparkles,
  ClipboardCheck, ShoppingCart, LineChart,
} from "lucide-react";

export type ModuleId =
  | "inventory" | "suppliers" | "invoices" | "waste" | "temperature" | "compliance"
  | "prep-board" | "recipes" | "menu" | "cleaning" | "stocktake" | "orders" | "analytics";

export type ModuleGroup = "operations" | "production" | "stock" | "compliance" | "analytics";

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  group: ModuleGroup;
  isCore: boolean;
  defaultEnabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  routes: string[];
  venueTypes: string[];
  complexity: "simple" | "moderate" | "advanced";
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  // ── Core: Operations ────────────────────────────────────────────────────────
  {
    id: "inventory",
    name: "Inventory",
    description: "Live stock levels, par tracking, status alerts, and item management.",
    group: "operations",
    isCore: true,
    defaultEnabled: true,
    icon: Package,
    routes: ["/inventory"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "simple",
  },
  {
    id: "suppliers",
    name: "Supplier Management",
    description: "Manage suppliers, delivery schedules, and order cutoff countdowns.",
    group: "operations",
    isCore: true,
    defaultEnabled: true,
    icon: Truck,
    routes: ["/suppliers"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "simple",
  },
  {
    id: "invoices",
    name: "Invoice Management",
    description: "Track delivery invoices, import line items, and map costs to inventory.",
    group: "operations",
    isCore: true,
    defaultEnabled: true,
    icon: Receipt,
    routes: ["/invoices"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "simple",
  },
  {
    id: "waste",
    name: "Waste Tracking",
    description: "Log spoilage and overproduction with full cost impact tracking.",
    group: "operations",
    isCore: true,
    defaultEnabled: true,
    icon: Trash2,
    routes: ["/waste"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "simple",
  },
  // ── Core: Compliance ────────────────────────────────────────────────────────
  {
    id: "temperature",
    name: "Temperature Logs",
    description: "HACCP-ready temperature checks with audit trail and alert history.",
    group: "compliance",
    isCore: true,
    defaultEnabled: true,
    icon: Thermometer,
    routes: ["/temperature"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "simple",
  },
  {
    id: "compliance",
    name: "Chemical Safety (SDS)",
    description: "Safety data sheets, MSDS register, and dilution ratios for the whole team.",
    group: "compliance",
    isCore: true,
    defaultEnabled: true,
    icon: ShieldCheck,
    routes: ["/compliance"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "simple",
  },
  // ── Optional: Production ────────────────────────────────────────────────────
  {
    id: "prep-board",
    name: "Prep Board",
    description: "Digital prep whiteboard with Service Mode for tablets and wall screens.",
    group: "production",
    isCore: false,
    defaultEnabled: true,
    icon: ClipboardList,
    routes: ["/prep-board"],
    venueTypes: ["restaurant", "hotel", "catering"],
    complexity: "simple",
  },
  {
    id: "recipes",
    name: "Recipe Management",
    description: "Recipe library with live food cost %, GP%, and portion cost from live inventory prices.",
    group: "production",
    isCore: false,
    defaultEnabled: true,
    icon: ChefHat,
    routes: ["/recipes"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering"],
    complexity: "moderate",
  },
  {
    id: "menu",
    name: "Menu Management",
    description: "Manage menus with linked recipes, pricing, and margin analysis.",
    group: "production",
    isCore: false,
    defaultEnabled: false,
    icon: UtensilsCrossed,
    routes: ["/menu"],
    venueTypes: ["restaurant", "cafe", "hotel"],
    complexity: "moderate",
  },
  // ── Optional: Compliance ────────────────────────────────────────────────────
  {
    id: "cleaning",
    name: "Cleaning & Checklists",
    description: "Cleaning rosters, open/close checklists, and equipment check schedules.",
    group: "compliance",
    isCore: false,
    defaultEnabled: true,
    icon: Sparkles,
    routes: ["/cleaning"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "simple",
  },
  // ── Optional: Stock ─────────────────────────────────────────────────────────
  {
    id: "stocktake",
    name: "Stocktake",
    description: "Structured periodic stocktakes with variance tracking and cost reporting.",
    group: "stock",
    isCore: false,
    defaultEnabled: true,
    icon: ClipboardCheck,
    routes: ["/stocktake"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering", "pub"],
    complexity: "moderate",
  },
  {
    id: "orders",
    name: "Suggested Orders",
    description: "Intelligent order suggestions based on par levels and current stock.",
    group: "stock",
    isCore: false,
    defaultEnabled: false,
    icon: ShoppingCart,
    routes: ["/orders"],
    venueTypes: ["restaurant", "hotel", "catering"],
    complexity: "moderate",
  },
  // ── Optional: Analytics ─────────────────────────────────────────────────────
  {
    id: "analytics",
    name: "Advanced Analytics",
    description: "Waste trends, cost spike detection, price variance, and usage insights.",
    group: "analytics",
    isCore: false,
    defaultEnabled: false,
    icon: LineChart,
    routes: ["/analytics"],
    venueTypes: ["restaurant", "cafe", "hotel", "catering"],
    complexity: "advanced",
  },
];

export const MODULE_MAP = new Map<ModuleId, ModuleDefinition>(
  MODULE_DEFINITIONS.map(m => [m.id, m])
);

export const DEFAULT_ENABLED_MODULES: ModuleId[] = MODULE_DEFINITIONS
  .filter(m => m.defaultEnabled)
  .map(m => m.id);

export const CORE_MODULES: ModuleId[] = MODULE_DEFINITIONS
  .filter(m => m.isCore)
  .map(m => m.id);
