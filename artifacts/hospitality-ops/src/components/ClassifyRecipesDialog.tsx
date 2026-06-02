import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRecipes,
  useClassifyRecipe,
  getListRecipesQueryKey,
  getGetUnclassifiedRecipeCountQueryKey,
} from "@workspace/api-client-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChefHat, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: number;
  onDismiss: () => void;
};

export default function ClassifyRecipesDialog({ open, onOpenChange, venueId, onDismiss }: Props) {
  const queryClient = useQueryClient();
  const classify = useClassifyRecipe();
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data: recipes, isLoading } = useListRecipes(
    venueId,
    { type: "unclassified" },
    {
      query: {
        enabled: open,
        queryKey: [...getListRecipesQueryKey(venueId), "unclassified"],
      },
    }
  );

  const remaining = recipes ?? [];

  const handleClassify = (recipeId: number, recipeType: "menu" | "prep") => {
    setPendingId(recipeId);
    classify.mutate(
      { venueId, recipeId, data: { recipeType } },
      {
        onSettled: async () => {
          await queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey(venueId) });
          await queryClient.invalidateQueries({ queryKey: getGetUnclassifiedRecipeCountQueryKey(venueId) });
          await queryClient.invalidateQueries({
            queryKey: [...getListRecipesQueryKey(venueId), "unclassified"],
          });
          setPendingId(null);
        },
      }
    );
  };

  const handleSkip = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Classify your recipes</DialogTitle>
          <DialogDescription>
            Every recipe now lives in one of two worlds — a <span className="font-semibold text-foreground">Menu</span> dish that goes
            to a guest, or a <span className="font-semibold text-foreground">Prep</span> component (sauces, batches, mise) that feeds
            other recipes. Take a minute to sort the existing ones.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : remaining.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-semibold text-foreground">All sorted. Nicely done.</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can change a recipe's type any time from its settings.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {remaining.map((r) => {
                const isPending = pendingId === r.id;
                return (
                  <li key={r.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{r.name}</p>
                      {r.category && (
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className={cn("gap-1.5", isPending && "opacity-50")}
                        disabled={isPending}
                        onClick={() => handleClassify(r.id, "prep")}
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Prep
                      </Button>
                      <Button
                        size="sm"
                        className={cn("gap-1.5 bg-primary text-primary-foreground", isPending && "opacity-50")}
                        disabled={isPending}
                        onClick={() => handleClassify(r.id, "menu")}
                      >
                        <ChefHat className="w-3.5 h-3.5" /> Menu
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3">
          <Button variant="ghost" onClick={handleSkip}>Skip for now</Button>
          <Button onClick={() => onOpenChange(false)} disabled={remaining.length > 0}>
            {remaining.length > 0 ? `${remaining.length} left` : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
