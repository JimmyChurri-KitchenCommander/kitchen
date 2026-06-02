import { useParams, useLocation } from "wouter";
import { useGetSharedContent, useCopySharedContent, useListVenues } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { Package, ChefHat, Copy, Loader2, AlertCircle, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getListVenuesQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export default function SharedContentPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, navigate] = useLocation();
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  const [targetVenueId, setTargetVenueId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const { data: shared, isLoading, error } = useGetSharedContent(token, {
    query: { queryKey: ["/shared", token] },
  });

  const { data: venues } = useListVenues({
    query: { enabled: !!isSignedIn, queryKey: getListVenuesQueryKey() },
  });

  const copyMutation = useCopySharedContent();

  const handleCopy = async () => {
    if (!targetVenueId) return;
    try {
      const result = await copyMutation.mutateAsync({
        token,
        data: { targetVenueId: parseInt(targetVenueId) },
      });
      setCopied(true);
      const total = result.copied.inventoryItems.length + result.copied.recipes.length;
      toast({ title: `${total} item${total !== 1 ? "s" : ""} copied to your venue` });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy items to your venue.", variant: "destructive" });
    }
  };

  const basePath = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 gap-4">
        <Skeleton className="h-10 w-64 bg-card" />
        <Skeleton className="h-48 w-full max-w-xl bg-card" />
      </div>
    );
  }

  if (error || !shared) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Link not found</h1>
        <p className="text-muted-foreground max-w-sm">This share link may have expired or been revoked.</p>
      </div>
    );
  }

  const shareType = shared.type;
  const shareInfo = shared.share;

  const renderInventoryItem = (item: Record<string, unknown>, idx: number) => (
    <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
      <Package className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{String(item.name ?? "")}</p>
        <p className="text-xs text-muted-foreground">{String(item.unit ?? "")}</p>
      </div>
      {item.averageCost != null && <p className="text-sm font-semibold text-foreground shrink-0">${parseFloat(String(item.averageCost)).toFixed(2)}/unit</p>}
    </div>
  );

  const renderRecipe = (recipe: Record<string, unknown>, idx: number) => (
    <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
      <ChefHat className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{String(recipe.name ?? "")}</p>
        <p className="text-xs text-muted-foreground">{String(recipe.category ?? "")} · Yield: {String(recipe.yield ?? "")} {String(recipe.yieldUnit ?? "")}</p>
      </div>
      {recipe.sellingPrice != null && <p className="text-sm font-semibold text-foreground shrink-0">${parseFloat(String(recipe.sellingPrice)).toFixed(2)}</p>}
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Kitchen Command</span>
          <span className="text-muted-foreground text-sm">/ Shared Content</span>
        </div>
        {!isSignedIn && (
          <Button asChild size="sm" className="bg-primary text-black hover:bg-primary/90">
            <a href={`${basePath}/sign-in`}>Sign in <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></a>
          </Button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {shareType === "inventory_item" && <Badge variant="outline" className="border-border text-muted-foreground"><Package className="w-3 h-3 mr-1" />Inventory Item</Badge>}
            {shareType === "recipe" && <Badge variant="outline" className="border-border text-muted-foreground"><ChefHat className="w-3 h-3 mr-1" />Recipe</Badge>}
            {shareType === "group" && <Badge variant="outline" className="border-border text-muted-foreground"><Users className="w-3 h-3 mr-1" />Share Group</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-foreground">{shareInfo.label ?? "Shared Content"}</h1>
          <p className="text-muted-foreground mt-1">Shared by another chef on Kitchen Command</p>
        </div>

        {/* Content */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            {shareType === "inventory_item" && shared.item && (
              renderInventoryItem(shared.item as Record<string, unknown>, 0)
            )}

            {shareType === "recipe" && (
              <>
                {shared.recipe && renderRecipe(shared.recipe as Record<string, unknown>, 0)}
                {shared.ingredients && (shared.ingredients as Record<string, unknown>[]).length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Ingredients</p>
                    <div className="space-y-1.5">
                      {(shared.ingredients as Record<string, unknown>[]).map((ing, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-foreground">{String(ing.quantity ?? "")} {String(ing.unit ?? "")}</span>
                          <span>{String(ing.itemName ?? "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {shareType === "group" && (
              <>
                {shared.group && (
                  <div className="mb-3">
                    <h3 className="font-semibold text-foreground">{String((shared.group as Record<string, unknown>).name ?? "")}</h3>
                    {(shared.group as Record<string, unknown>).description != null && (
                      <p className="text-sm text-muted-foreground">{String((shared.group as Record<string, unknown>).description ?? "")}</p>
                    )}
                  </div>
                )}
                {(shared.inventoryItems as Record<string, unknown>[] | undefined)?.map((item, i) => renderInventoryItem(item, i))}
                {(shared.recipes as Record<string, unknown>[] | undefined)?.map((r, i) => renderRecipe(r, i))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Copy to venue */}
        {shareInfo.allowCopy && (
          <Card className={cn("border-border", copied ? "bg-green-500/10 border-green-500/30" : "bg-card")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-primary" />}
                {copied ? "Copied to your venue" : "Copy to your kitchen"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {copied ? (
                <p className="text-sm text-green-300">Items are now in your inventory / recipes.</p>
              ) : !isSignedIn ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sign in to copy these items directly to your venue.</p>
                  <Button asChild className="bg-primary text-black hover:bg-primary/90">
                    <a href={`${basePath}/sign-in`}>Sign in to copy <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Choose which of your venues to copy into:</p>
                  <Select value={targetVenueId} onValueChange={setTargetVenueId}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select a venue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {venues?.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleCopy}
                    disabled={!targetVenueId || copyMutation.isPending}
                    className="w-full bg-primary text-black hover:bg-primary/90 font-semibold"
                  >
                    {copyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy to My Kitchen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">Powered by <span className="text-primary font-semibold">Kitchen Command</span></p>
      </div>
    </div>
  );
}
