import { SignUpButton } from "@clerk/react";
import { ChefHat, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/stores/demoStore";
import { useVenueStore } from "@/stores/venueStore";
import { useLocation } from "wouter";

export default function DemoBanner() {
  const { isDemoMode, deactivate } = useDemoStore();
  const { setActiveVenueId } = useVenueStore();
  const [, setLocation] = useLocation();

  if (!isDemoMode) return null;

  const handleExit = () => {
    deactivate();
    setActiveVenueId(0 as unknown as number);
    setLocation("/");
  };

  return (
    <div className="w-full bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 z-50">
      <div className="flex items-center gap-2 text-sm font-medium min-w-0">
        <ChefHat className="w-4 h-4 shrink-0" />
        <span className="truncate">
          Exploring The Black Apron — demo kitchen. Changes are not saved.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <SignUpButton mode="modal">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-3 text-xs font-semibold bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
          >
            Create free account
          </Button>
        </SignUpButton>
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/20 transition-colors text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Clock out
        </button>
      </div>
    </div>
  );
}
