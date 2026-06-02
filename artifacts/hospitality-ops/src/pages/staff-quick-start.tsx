import { Link } from "wouter";
import { ArrowLeft, Zap, ChefHat, ClipboardList, Trash2, Thermometer, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Step = { action: string; detail: string };
type Guide = { id: string; icon: React.ComponentType<{ className?: string }>; title: string; color: string; steps: Step[] };

const GUIDES: Guide[] = [
  {
    id: "prep",
    icon: ClipboardList,
    title: "Starting Your Prep Shift",
    color: "text-orange-500",
    steps: [
      { action: "Open Prep Board", detail: "Head to Prep Board in the nav. You'll see all tasks for today split by shift." },
      { action: "Claim a task", detail: "Tap a task to open it, add your name and mark it In Progress. One task at a time — don't ghost it." },
      { action: "Complete it", detail: "When it's done, tap Complete. Inventory will be deducted automatically if a recipe is linked." },
      { action: "Log any waste", detail: "If you lose product during prep, log it straight away in Waste so the numbers stay honest." },
    ],
  },
  {
    id: "service",
    icon: Zap,
    title: "Running Service Mode",
    color: "text-amber-500",
    steps: [
      { action: "Open Service Mode", detail: "Tap Service Mode in the nav. Enter your name once — it sticks for the session." },
      { action: "Check low stock", detail: "The top strip shows anything below par. Call it before service starts, not halfway through a ticket." },
      { action: "Log temperatures", detail: "Hit any fridge, blast chiller or bain marie. Pass/fail auto-calculated against your set limits." },
      { action: "Quick waste capture", detail: "Dropped a sauce, over-fired a steak? Log it fast. No inventory lookup needed — just the name and quantity." },
      { action: "Write a handover note", detail: "End of service: write what the next shift needs to know. Pin it if it's important." },
    ],
  },
  {
    id: "waste",
    icon: Trash2,
    title: "Logging Waste Properly",
    color: "text-red-500",
    steps: [
      { action: "Go to Waste Log", detail: "Use the nav or the Quick Waste button in Service Mode for fast capture." },
      { action: "Select the item", detail: "Search your inventory. If it's not there, type the name — it'll save as a free-text entry." },
      { action: "Enter quantity and reason", detail: "Be precise — kg or L, not 'a bit'. Choose the honest reason: spoilage, overproduction, dropped, trimming." },
      { action: "Review daily cost", detail: "Check the Waste section in Today's Dashboard to see cumulative daily cost. If it's creeping up, it needs a conversation." },
    ],
  },
  {
    id: "temp",
    icon: Thermometer,
    title: "Temperature Checks",
    color: "text-emerald-600",
    steps: [
      { action: "Open Temperature page", detail: "Or use the quick temp widget in Service Mode for fast logging mid-service." },
      { action: "Select the equipment", detail: "Pick from your configured list (set up in Settings). If it's not there, type the name manually." },
      { action: "Enter the reading", detail: "Type the actual probe reading, not what you think it should be. Honesty only — a fail logged is better than a fail hidden." },
      { action: "Action a fail immediately", detail: "Any fail auto-flags. Check the corrective action field — it creates a paper trail for compliance." },
    ],
  },
  {
    id: "recipe",
    icon: ChefHat,
    title: "Using Recipes During Service",
    color: "text-blue-500",
    steps: [
      { action: "Find your recipe", detail: "Search in Recipes. Filter by Menu or Prep type. Tap to open the full spec." },
      { action: "Check allergens", detail: "Allergen chips are shown at the top of every recipe. If a guest asks, this is your source of truth." },
      { action: "Scale the recipe", detail: "Use the scaling calculator in the recipe detail. Enter cover count and all quantities recalculate." },
      { action: "Log the prep run", detail: "When you batch cook, hit Log Prep Run and enter portions. Inventory auto-deducts." },
    ],
  },
  {
    id: "stocktake",
    icon: BookOpen,
    title: "Running a Stocktake",
    color: "text-purple-500",
    steps: [
      { action: "Open Stocktake", detail: "Admin-only. Head to Stocktake in the nav to create a new count." },
      { action: "Count by section", detail: "Work through your sections one at a time — Dry Store, Fridges, Freezers. Tick each item as you count it." },
      { action: "Enter actuals", detail: "Enter what you actually have, not what you think you should have. Variances are informative, not an accusation." },
      { action: "Submit when complete", detail: "Hit Submit to lock the count. The system auto-computes variances and updates dashboard signals." },
    ],
  },
];

export default function StaffQuickStartPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Quick-Start</h1>
          <p className="text-sm text-muted-foreground">How to use Kitchen Command — the basics, fast.</p>
        </div>
      </div>

      {/* Intro card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="px-5 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">New to Kitchen Command?</span> Read the section relevant to your role. Each guide covers one workflow — step by step, no jargon.
              If something's wrong in the system, tell the admin — don't work around it.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guide cards */}
      <div className="space-y-4">
        {GUIDES.map((guide) => (
          <Card key={guide.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <guide.icon className={`w-5 h-5 ${guide.color}`} />
                {guide.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {guide.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{step.action}</div>
                    <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <Card className="bg-secondary/30 border-border">
        <CardContent className="px-5 py-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Need to do something that isn't listed here? Ask your kitchen manager or admin.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href="/prep-board">Prep Board</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/service-mode">Service Mode</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/recipes">Recipes</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/waste">Waste Log</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Allergen reminder */}
      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
        <CardContent className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
            <div>
              <div className="font-semibold text-red-700 dark:text-red-400 text-sm">Allergen Responsibility</div>
              <div className="text-sm text-red-600 dark:text-red-500 mt-1 leading-relaxed">
                Always cross-check allergens in the recipe screen before service. If you're unsure about a dish, ask.
                Never guess with allergens.
              </div>
              <Badge className="mt-2 bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                14 EU Allergens tracked per recipe
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
