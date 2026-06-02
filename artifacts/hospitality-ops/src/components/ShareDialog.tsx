import { useState } from "react";
import { Share2, Copy, Check, Link2, Users, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateShare,
  useListShares,
  useRevokeShare,
  useListShareGroups,
  getListSharesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useVenueStore } from "@/stores/venueStore";

type ShareType = "inventory_item" | "recipe" | "group";

interface ShareDialogProps {
  itemId: number;
  itemType: "inventory_item" | "recipe";
  itemName: string;
  children?: React.ReactNode;
}

function buildShareUrl(token: string): string {
  const base = window.location.origin + (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  return `${base}/shared/${token}`;
}

export default function ShareDialog({ itemId, itemType, itemName, children }: ShareDialogProps) {
  const { activeVenueId } = useVenueStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "group">("single");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [allowCopy, setAllowCopy] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [label, setLabel] = useState(itemName);

  const { data: existingShares } = useListShares(
    activeVenueId as number,
    { query: { enabled: open && !!activeVenueId, queryKey: getListSharesQueryKey(activeVenueId as number) } }
  );

  const { data: shareGroups } = useListShareGroups(
    activeVenueId as number,
    {
      query: {
        enabled: open && !!activeVenueId,
        queryKey: ["/venues", activeVenueId, "share-groups"],
      }
    }
  );

  const createShare = useCreateShare();
  const revokeShare = useRevokeShare();

  const myShares = existingShares?.filter(s => {
    if (itemType === "inventory_item") return s.inventoryItemId === itemId;
    if (itemType === "recipe") return s.recipeId === itemId;
    return false;
  }) ?? [];

  const handleCreate = async () => {
    if (!activeVenueId) return;

    const body: Parameters<typeof createShare.mutateAsync>[0]["data"] = {
      shareType: mode === "group" && selectedGroupId ? "group" : itemType as ShareType,
      label,
      allowCopy,
      ...(itemType === "inventory_item" && mode === "single" ? { inventoryItemId: itemId } : {}),
      ...(itemType === "recipe" && mode === "single" ? { recipeId: itemId } : {}),
      ...(mode === "group" && selectedGroupId ? { shareGroupId: parseInt(selectedGroupId) } : {}),
    };

    try {
      const share = await createShare.mutateAsync({
        venueId: activeVenueId,
        data: body,
      });
      await queryClient.invalidateQueries({ queryKey: getListSharesQueryKey(activeVenueId) });
      const url = buildShareUrl(share.shareToken);
      await navigator.clipboard.writeText(url);
      setCopiedToken(share.shareToken);
      toast({ title: "Link copied", description: "Share link is on your clipboard." });
      setTimeout(() => setCopiedToken(null), 3000);
    } catch {
      toast({ title: "Error", description: "Failed to create share link.", variant: "destructive" });
    }
  };

  const handleCopy = async (token: string) => {
    const url = buildShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast({ title: "Copied", description: "Link copied to clipboard." });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (shareId: number) => {
    if (!activeVenueId) return;
    await revokeShare.mutateAsync({ venueId: activeVenueId, shareId });
    await queryClient.invalidateQueries({ queryKey: getListSharesQueryKey(activeVenueId) });
    toast({ title: "Link revoked" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share {itemType === "recipe" ? "Recipe" : "Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <p className="text-sm text-muted-foreground">
            Sharing: <span className="text-foreground font-semibold">{itemName}</span>
          </p>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              size="sm"
              className={mode === "single" ? "bg-primary text-black" : "border-border text-muted-foreground"}
              onClick={() => setMode("single")}
            >
              <Link2 className="w-3.5 h-3.5 mr-1.5" /> Single Link
            </Button>
            <Button
              variant={mode === "group" ? "default" : "outline"}
              size="sm"
              className={mode === "group" ? "bg-primary text-black" : "border-border text-muted-foreground"}
              onClick={() => setMode("group")}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" /> Via Group
            </Button>
          </div>

          {mode === "single" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Link Label</Label>
                <Input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="bg-background border-border text-foreground"
                  placeholder="e.g. For Marco at Bistro Nord"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm">Allow others to copy to their venue</Label>
                <Switch checked={allowCopy} onCheckedChange={setAllowCopy} />
              </div>
            </div>
          )}

          {mode === "group" && (
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Select Share Group</Label>
              {!shareGroups || shareGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No groups yet. Create one in Share Groups settings.</p>
              ) : (
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Pick a group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shareGroups.map(g => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name} ({g.itemCount} items)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={createShare.isPending || (mode === "group" && !selectedGroupId)}
            className="w-full bg-primary text-black hover:bg-primary/90 font-semibold"
          >
            {createShare.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Create &amp; Copy Link
          </Button>

          {/* Existing shares */}
          {myShares.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Links</p>
              {myShares.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-secondary/30 rounded-md p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.label ?? "Untitled link"}</p>
                    <p className="text-xs text-muted-foreground">{s.accessCount} views</p>
                  </div>
                  {s.allowCopy && <Badge variant="outline" className="text-xs border-border text-muted-foreground">Copyable</Badge>}
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => handleCopy(s.shareToken)}
                  >
                    {copiedToken === s.shareToken ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-400 shrink-0"
                    onClick={() => handleRevoke(s.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
