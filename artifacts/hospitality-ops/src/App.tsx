import { useEffect, useRef, useState } from "react";
import OfflineBanner from "@/components/OfflineBanner";
import { AppIcon } from "@/components/AppIcon";
import { useDemoStore } from "@/stores/demoStore";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { Loader2 } from "lucide-react";
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useListVenues } from "@workspace/api-client-react";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient();

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "none" as const,
  },
  variables: {
    colorPrimary: "hsl(214 89% 45%)",
    colorForeground: "hsl(220 25% 12%)",
    colorMutedForeground: "hsl(215 16% 48%)",
    colorDanger: "hsl(0 84% 55%)",
    colorBackground: "hsl(210 25% 97%)",
    colorInput: "hsl(215 20% 86%)",
    colorInputForeground: "hsl(220 25% 12%)",
    colorNeutral: "hsl(215 20% 86%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.375rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-lg w-[440px] max-w-full overflow-hidden border border-[#dce3ef]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-sm text-gray-500",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formFieldLabel: "text-sm font-medium leading-none",
    footerActionLink: "text-sm font-medium text-[#1d6cc4] hover:text-[#1559a0]",
    footerActionText: "text-sm text-gray-500",
    dividerText: "text-xs text-gray-400",
    identityPreviewEditButton: "text-sm font-medium text-[#1d6cc4]",
    formFieldSuccessText: "text-sm font-medium text-green-600",
    alertText: "text-sm font-medium",
    logoBox: "h-12 flex justify-center mb-4",
    logoImage: "h-full w-auto",
    socialButtonsBlockButton: "border border-[#dce3ef] bg-white hover:bg-[#f0f4fb]",
    formButtonPrimary: "bg-[#1d6cc4] hover:bg-[#1559a0] text-white font-semibold",
    formFieldInput: "flex h-10 w-full rounded-md border border-[#dce3ef] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6cc4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#dce3ef]",
    alert: "border-[#dce3ef] bg-[#f0f4fb]",
    otpCodeFieldInput: "border-[#dce3ef] bg-white focus:ring-[#1d6cc4]",
    formFieldRow: "mb-4",
    main: "gap-4 flex flex-col",
  },
};

function AuthBrandHeader() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <AppIcon className="w-14 h-14" />
      <div className="space-y-1">
        <p className="font-bold text-xl tracking-tight text-foreground">Kitchen Command</p>
        <p className="text-sm text-muted-foreground italic">"Don't just run a kitchen. Command it."</p>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 gap-8">
      <AuthBrandHeader />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

const ACCESS_CODE = "kitchen commander ops";

function SignUpPage() {
  const [codeInput, setCodeInput] = useState("");
  const [showRejected, setShowRejected] = useState(false);
  const [codeAccepted, setCodeAccepted] = useState(
    () =>
      sessionStorage.getItem("kc_early_access") === "granted" ||
      sessionStorage.getItem("kc_invite_bypass") === "1"
  );

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim().toLowerCase() === ACCESS_CODE) {
      sessionStorage.setItem("kc_early_access", "granted");
      setCodeAccepted(true);
    } else {
      setShowRejected(true);
    }
  };

  if (!codeAccepted) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 gap-8">
        <AuthBrandHeader />
        <div className="w-full max-w-[440px] bg-white rounded-lg border border-[#dce3ef] p-8">
          {showRejected ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-base font-semibold text-foreground">
                Account creation is not available at this time.
              </p>
              <p className="text-sm text-muted-foreground">
                Watch this space — we'll be opening up soon.
              </p>
              <button
                className="text-sm text-[#1d6cc4] hover:underline mt-2"
                onClick={() => { setShowRejected(false); setCodeInput(""); }}
              >
                Try a different code
              </button>
            </div>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div className="space-y-1">
                <p className="text-xl font-semibold tracking-tight text-foreground">Early access</p>
                <p className="text-sm text-muted-foreground">Enter your access code to create an account.</p>
              </div>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Access code"
                autoFocus
                className="flex h-10 w-full rounded-md border border-[#dce3ef] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6cc4] focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                className="w-full bg-[#1d6cc4] hover:bg-[#1559a0] text-white font-semibold h-10 rounded-md text-sm transition-colors"
              >
                Continue
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href={`${basePath}/sign-in`} className="text-[#1d6cc4] hover:text-[#1559a0] font-medium">
                  Sign in
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 gap-8">
      <AuthBrandHeader />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}


import OnboardingPage from "./pages/onboarding";
import SetupNameModal from "./components/SetupNameModal";
import LandingPage from "./pages/landing";
import DemoPage from "./pages/demo";
import DemoKitchenPage from "./pages/demo-kitchen";
import InviteGatePage from "./pages/invite-gate";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/dashboard";
import CommandCentrePage from "./pages/command-centre";
import VenuesPage from "./pages/venues";
import InventoryPage from "./pages/inventory";
import InventoryFormPage from "./pages/inventory-form";
import InventoryDetailPage from "./pages/inventory-detail";
import SuppliersPage from "./pages/suppliers";
import SupplierFormPage from "./pages/supplier-form";
import SupplierDetailPage from "./pages/supplier-detail";
import RecipesPage from "./pages/recipes";
import RecipeFormPage from "./pages/recipe-form";
import RecipeDetailPage from "./pages/recipe-detail";
import WastePage from "./pages/waste";
import InvoicesPage from "./pages/invoices";
import AnalyticsPage from "./pages/analytics";
import SettingsPage from "./pages/settings";
import ShareGroupsPage from "./pages/share-groups";
import SharedContentPage from "./pages/shared-content";
import PriceComparisonPage from "./pages/price-comparison";
import SuggestedOrdersPage from "./pages/suggested-orders";
import PrepBoardPage from "./pages/prep-board";
import PrepBoardDisplayPage from "./pages/prep-board-display";
import MenuPage from "./pages/menu";
import MenuDetailPage from "./pages/menu-detail";
import CleaningRosterPage from "./pages/cleaning-roster";
import StocktakePage from "./pages/stocktake";
import VenueTeamPage from "./pages/venue-team";
import TemperaturePage from "./pages/temperature";
import DataRetentionPage from "./pages/data-retention";
import JoinVenuePage from "./pages/join-venue";
import CompliancePage from "./pages/compliance";
import ModulesPage from "./pages/modules";
import ModuleSettingsPage from "./pages/module-settings";
import ApprenticeLibraryPage from "./pages/apprentice-library";
import ApprenticePage from "./pages/apprentice";
import ServiceModePage from "./pages/service-mode";
import StaffQuickStartPage from "./pages/staff-quick-start";
import IntelligencePage from "./pages/intelligence";
import KitchenIntelligencePage from "./pages/kitchen-intelligence";
import KitchenBriefPage from "./pages/kitchen-brief";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import PrimalButcherApp from "./pages/PrimalButcherApp";
import ButcheryBoardPage from "./pages/ButcheryBoardPage";
import {
  Fish, Leaf, Droplets, Flame, Snowflake, FlaskConical,
  Atom, Scale, Layers, Thermometer, ArrowLeftRight,
  AlertTriangle, Database, Wrench, FileText, BookOpen, Scissors,
} from "lucide-react";

console.log("🚨 ACTIVE FILE LOADED:", import.meta.url);

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/command-centre" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-8">
        <AppIcon className="w-20 h-20" />
        <div className="text-center space-y-2">
          <p className="font-bold text-2xl tracking-tight text-foreground">Kitchen Command</p>
          <p className="text-sm text-muted-foreground italic font-medium">"Don't just run a kitchen. Command it."</p>
        </div>
        <div className="flex flex-col items-center gap-3 mt-1">
          <Loader2 className="w-4 h-4 animate-spin text-primary/70" />
          <p className="text-xs text-muted-foreground/50 tracking-widest uppercase">Loading operational systems</p>
        </div>
      </div>
    </div>
  );
}

function OnboardingGate({ component: Component }: { component: React.ComponentType }) {
  const { data: venues, isLoading } = useListVenues();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading || venues === undefined) return;
    // Only redirect to onboarding if the user has no venues at all.
    // Users with existing venues (pre-onboarding) enter the app normally.
    if (venues.length === 0) setLocation("/onboarding");
  }, [venues, isLoading, setLocation]);

  if (isLoading || venues === undefined) return <LoadingScreen />;

  if (venues.length === 0) return null; // redirect in-flight

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoaded } = useUser();
  const { isDemoMode } = useDemoStore();

  // Demo mode bypasses Clerk auth — show the full app directly.
  if (isDemoMode) {
    return (
      <AppLayout>
        <Component />
      </AppLayout>
    );
  }

  return (
    <>
      <Show when="signed-in">
        {!isLoaded ? (
          <LoadingScreen />
        ) : user?.publicMetadata?.inviteVerified !== true ? (
          <InviteGatePage />
        ) : !user.firstName ? (
          <SetupNameModal />
        ) : (
          <OnboardingGate component={Component} />
        )}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

// Onboarding route: auth-gated but skips the OnboardingGate (no redirect loop)
function OnboardingRouteInner() {
  const { user, isLoaded } = useUser();
  const { isDemoMode } = useDemoStore();
  const { data: venues } = useListVenues();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isDemoMode) { setLocation("/command-centre"); return; }
    if (!venues) return;
    if (venues.some(v => v.onboardingCompleted)) setLocation("/command-centre");
  }, [venues, isDemoMode, setLocation]);

  if (isDemoMode) return null;

  return (
    <>
      <Show when="signed-in">
        {!isLoaded ? (
          <LoadingScreen />
        ) : user?.publicMetadata?.inviteVerified !== true ? (
          <InviteGatePage />
        ) : !user.firstName ? (
          <SetupNameModal />
        ) : (
          <OnboardingPage />
        )}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Kitchen Command",
            subtitle: "Sign in to access your kitchen",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <ScrollToTop />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />

            {/* Public join route — needs auth to work, Clerk handles redirect */}
            <Route path="/join/:token" component={JoinVenuePage} />

            {/* Public demo pages — no auth required */}
            <Route path="/demo" component={DemoPage} />
            <Route path="/demo-kitchen" component={DemoKitchenPage} />

            {/* Onboarding — auth-gated, no AppLayout, no onboarding redirect loop */}
            <Route path="/onboarding" component={OnboardingRouteInner} />

            <Route path="/command-centre" component={() => <ProtectedRoute component={CommandCentrePage} />} />
            <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
            <Route path="/kitchen-brief" component={() => <ProtectedRoute component={KitchenBriefPage} />} />
            <Route path="/venues" component={() => <ProtectedRoute component={VenuesPage} />} />

            <Route path="/inventory" component={() => <ProtectedRoute component={InventoryPage} />} />
            <Route path="/inventory/new" component={() => <ProtectedRoute component={InventoryFormPage} />} />
            <Route path="/inventory/:id/edit" component={() => <ProtectedRoute component={InventoryFormPage} />} />
            <Route path="/inventory/:id" component={() => <ProtectedRoute component={InventoryDetailPage} />} />

            <Route path="/suppliers" component={() => <ProtectedRoute component={SuppliersPage} />} />
            <Route path="/suppliers/new" component={() => <ProtectedRoute component={SupplierFormPage} />} />
            <Route path="/suppliers/price-comparison" component={() => <ProtectedRoute component={PriceComparisonPage} />} />
            <Route path="/suppliers/:id/edit" component={() => <ProtectedRoute component={SupplierFormPage} />} />
            <Route path="/suppliers/:id" component={() => <ProtectedRoute component={SupplierDetailPage} />} />

            <Route path="/recipes" component={() => <ProtectedRoute component={RecipesPage} />} />
            <Route path="/recipes/new" component={() => <ProtectedRoute component={RecipeFormPage} />} />
            <Route path="/recipes/:id" component={() => <ProtectedRoute component={RecipeDetailPage} />} />
            <Route path="/recipes/:id/edit" component={() => <ProtectedRoute component={RecipeFormPage} />} />

            <Route path="/waste" component={() => <ProtectedRoute component={WastePage} />} />
            <Route path="/invoices" component={() => <ProtectedRoute component={InvoicesPage} />} />
            <Route path="/analytics" component={() => <ProtectedRoute component={AnalyticsPage} />} />
            <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
            <Route path="/share-groups" component={() => <ProtectedRoute component={ShareGroupsPage} />} />

            <Route path="/orders" component={() => <ProtectedRoute component={SuggestedOrdersPage} />} />
            <Route path="/menu" component={() => <ProtectedRoute component={MenuPage} />} />
            <Route path="/menu/:id" component={() => <ProtectedRoute component={MenuDetailPage} />} />
            <Route path="/prep-board" component={() => <ProtectedRoute component={PrepBoardPage} />} />
            <Route path="/cleaning" component={() => <ProtectedRoute component={CleaningRosterPage} />} />
            <Route path="/compliance" component={() => <ProtectedRoute component={CompliancePage} />} />
            <Route path="/temperature" component={() => <ProtectedRoute component={TemperaturePage} />} />
            <Route path="/stocktake" component={() => <ProtectedRoute component={StocktakePage} />} />
            <Route path="/venue-team" component={() => <ProtectedRoute component={VenueTeamPage} />} />
            <Route path="/data-retention" component={() => <ProtectedRoute component={DataRetentionPage} />} />
            {/* Public marketing pages — no auth required */}
            <Route path="/modules" component={ModulesPage} />
            <Route path="/intelligence" component={IntelligencePage} />
            <Route path="/apprentice" component={ApprenticePage} />
            <Route path="/module-settings" component={() => <ProtectedRoute component={ModuleSettingsPage} />} />
            <Route path="/apprentice-library" component={() => <ProtectedRoute component={ApprenticeLibraryPage} />} />
            <Route path="/kitchen-intelligence" component={() => <ProtectedRoute component={KitchenIntelligencePage} />} />
            <Route path="/kitchen-reference" component={() => <ProtectedRoute component={ButcheryBoardPage} />} />
            <Route path="/service-mode" component={() => <ProtectedRoute component={ServiceModePage} />} />
            <Route path="/staff-quick-start" component={() => <ProtectedRoute component={StaffQuickStartPage} />} />

            {/* ── Kitchen Intelligence sub-pages ─────────────────────────────── */}
            <Route path="/knife-intelligence" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Knife Intelligence" group="Kitchen Intelligence" Icon={Scissors}
                description="Precision knife-work intelligence — cut profiles, blade geometry, edge maintenance, and technique breakdowns for every classic and modern cut style." accentColor="#64748b" />
            )} />} />
            <Route path="/seafood-fabrication" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Seafood Fabrication" group="Kitchen Intelligence" Icon={Fish}
                description="Butchery diagrams, fabrication techniques, and yield guides for whole fish, shellfish, and cephalopods — from round fish to lobster breakdown." accentColor="#0ea5e9" />
            )} />} />
            <Route path="/produce-cuts" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Produce Cuts" group="Kitchen Intelligence" Icon={Leaf}
                description="Standardised knife-work library for vegetables, herbs, and aromatics. Brunoise, chiffonade, tourné, and beyond — with portion-weight references." accentColor="#22c55e" />
            )} />} />
            <Route path="/sauce-systems" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Sauce Systems" group="Kitchen Intelligence" Icon={Droplets}
                description="Mother sauces, derivatives, emulsions, and reduction ratios. Build your sauce tree and track ratios, temperatures, and shelf life for each base." accentColor="#f59e0b" />
            )} />} />
            <Route path="/cooking-intelligence" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Cooking Intelligence" group="Kitchen Intelligence" Icon={Flame}
                description="Heat transfer, Maillard and caramelisation windows, carryover curves, and cooking-method decision trees by protein and cut." accentColor="#ef4444" />
            )} />} />
            <Route path="/preservation" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Preservation" group="Kitchen Intelligence" Icon={Snowflake}
                description="Curing ratios, brine percentages, vacuum-seal guides, modified atmosphere rules, and shelf-life tables for every preservation method." accentColor="#67e8f9" />
            )} />} />
            <Route path="/fermentation" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Fermentation" group="Kitchen Intelligence" Icon={FlaskConical}
                description="pH targets, salt percentages, temperature bands, and timeline guides for lacto-ferments, koji, vinegars, and live cultures." accentColor="#a78bfa" />
            )} />} />
            <Route path="/ingredient-science" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Ingredient Science" group="Kitchen Intelligence" Icon={Atom}
                description="Protein denaturation points, starch gelatinisation windows, emulsifier ratios, hydrocolloid behaviour, and enzyme activity charts." accentColor="#818cf8" />
            )} />} />
            <Route path="/yield-intelligence" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Yield Intelligence" group="Kitchen Intelligence" Icon={Scale}
                description="Trim-loss tables, cooking-loss percentages, and as-purchased versus edible-portion cost modelling for every category in your kitchen." accentColor="#34d399" />
            )} />} />
            <Route path="/plating-systems" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Plating Systems" group="Kitchen Intelligence" Icon={Layers}
                description="Visual plating composition frameworks, sauce placement rules, height and tension guides, and colour-contrast principles for consistent pass output." accentColor="#f472b6" />
            )} />} />

            {/* ── Kitchen Reference sub-pages ────────────────────────────────── */}
            <Route path="/reference/temperatures" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Temperatures" group="Kitchen Reference" Icon={Thermometer}
                description="Doneness targets for every protein, egg coagulation windows, sugar-work stages, pastry temperatures, and pasteurisation thresholds — all in one reference." accentColor="#0d9488" />
            )} />} />
            <Route path="/reference/conversions" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Conversions" group="Kitchen Reference" Icon={ArrowLeftRight}
                description="Weight, volume, temperature, and pan-size conversions. Metric and imperial. Scaling multipliers for recipe yields and batch cooking." accentColor="#0d9488" />
            )} />} />
            <Route path="/reference/allergens" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Allergen Guide" group="Kitchen Reference" Icon={AlertTriangle}
                description="The 14 major allergens with cross-contamination risk levels, hidden-source alerts, and dish-level allergen tracking linked to your recipe library." accentColor="#0d9488" />
            )} />} />
            <Route path="/reference/species" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Species Guide" group="Kitchen Reference" Icon={Database}
                description="Sourcing seasonality, sustainability ratings, flavour profiles, and handling notes for fish, shellfish, meat breeds, and heritage varieties." accentColor="#0d9488" />
            )} />} />
            <Route path="/reference/equipment" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Equipment" group="Kitchen Reference" Icon={Wrench}
                description="Capacity tables, operating temperatures, cleaning schedules, and fault guides for every piece of kit in a professional kitchen." accentColor="#0d9488" />
            )} />} />
            <Route path="/reference/sop" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="SOP Library" group="Kitchen Reference" Icon={FileText}
                description="Standard operating procedures for opening, service, closing, and HACCP compliance — searchable, version-controlled, and printable for your team." accentColor="#0d9488" />
            )} />} />
            <Route path="/reference/terminology" component={() => <ProtectedRoute component={() => (
              <ComingSoonPage title="Terminology" group="Kitchen Reference" Icon={BookOpen}
                description="A culinary glossary covering classical French brigade terms, modern technique language, and international cuisine vocabulary for your whole team." accentColor="#0d9488" />
            )} />} />

            {/* Public standalone renderer — no auth required */}
            <Route path="/primal-butcher" component={PrimalButcherApp} />

            <Route path="/display/:venueId" component={PrepBoardDisplayPage} />
            <Route path="/shared/:token" component={SharedContentPage} />

            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
        <Toaster />
        <OfflineBanner />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
