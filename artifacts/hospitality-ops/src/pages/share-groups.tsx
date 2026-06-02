import { useState } from "react";
import { Users, Plus, Trash2, Loader2, Package, ChefHat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useListShareGroups,
  useCreateShareGroup,
  useDeleteShareGroup,
  useAddShareGroupItem,
  useRemoveShareGroupItem,
  useListInventory,
  useListRecipes,
  useListShares,
  useCreateShare,
  useRevokeShare,
  getListInventoryQueryKey,
  getListRecipesQueryKey,
  getListSharesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useVenueStore } from "@/stores/venueStore";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

function buildShareUrl(token: string): string {
  const base = window.location.origin + (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  return `${base}/shared/${token}`;
}

const GROUPS_QUERY_KEY = (venueId: number) => ["/venues", venueId, "share-groups"];

export default function ShareGroupsPage() {
  const { activeVenueId } = useVenueStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addItemGroupId, setAddItemGroupId] = useState<number | null>(null);
  const [addItemType, setAddItemType] = useState<"inventory_item" | "recipe">("inventory_item");
  const [addItemId, setAddItemId] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [shareGroupId, setShareGroupId] = useState<number | null>(null);
  const [shareAllowCopy, setShareAllowCopy] = useState(true);

  const { data: groups, isLoading } = useListShareGroups(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: GROUPS_QUERY_KEY(activeVenueId as number) } }
  );

  const { data: inventory } = useListInventory(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListInventoryQueryKey(activeVenueId as number) } }
  );

  const { data: recipes } = useListRecipes(
    activeVenueId as number,
    undefined,
    { query: { enabled: !!activeVenueId, queryKey: getListRecipesQueryKey(activeVenueId as number) } }
  );

  const { data: shares } = useListShares(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListSharesQueryKey(activeVenueId as number) } }
  );

  const createGroup = useCreateShareGroup();
  const deleteGroup = useDeleteShareGroup();
  const addItem = useAddShareGroupItem();
  const removeItem = useRemoveShareGroupItem();
  const createShare = useCreateShare();
  const revokeShare = useRevokeShare();

  const invalidateGroups = () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY(activeVenueId as number) });
  const invalidateShares = () => queryClient.invalidateQueries({ queryKey: getListSharesQueryKey(activeVenueId as number) });

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !activeVenueId) return;
    await createGroup.mutateAsync({ venueId: activeVenueId, data: { name: newGroupName.trim(), description: newGroupDesc.trim() || undefined } });
    await invalidateGroups();
    setNewGroupName("");
    setNewGroupDesc("");
    setCreateOpen(false);
    toast({ title: "Group created" });
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!activeVenueId) return;
    await deleteGroup.mutateAsync({ venueId: activeVenueId, groupId });
    await invalidateGroups();
    toast({ title: "Group deleted" });
  };

  const handleAddItem = async () => {
    if (!addItemGroupId || !addItemId || !activeVenueId) return;
    await addItem.mutateAsync({ venueId: activeVenueId, groupId: addItemGroupId, data: { itemType: addItemType, itemId: parseInt(addItemId) } });
    await invalidateGroups();
    setAddItemId("");
    toast({ title: "Item added to group" });
  };

  const handleRemoveItem = async (groupId: number, itemId: number) => {
    if (!activeVenueId) return;
    await removeItem.mutateAsync({ venueId: activeVenueId, groupId, itemId });
    await invalidateGroups();
  };

  const handleShareGroup = async (groupId: number, groupName: string) => {
    if (!activeVenueId) return;
    const share = await createShare.mutateAsync({
      venueId: activeVenueId,
      data: { shareType: "group", shareGroupId: groupId, label: groupName, allowCopy: shareAllowCopy },
    });
    await invalidateShares();
    const url = buildShareUrl(share.shareToken);
    await navigator.clipboard.writeText(url);
    setCopiedToken(share.shareToken);
    toast({ title: "Group link copied" });
    setTimeout(() => setCopiedToken(null), 3000);
    setShareGroupId(null);
  };

  const handleCopyLink = async (token: string) => {
    await navigator.clipboard.writeText(buildShareUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevokeShare = async (shareId: number) => {
    if (!activeVenueId) return;
    await revokeShare.mutateAsync({ venueId: activeVenueId, shareId });
    await invalidateShares();
  };

  const groupShares = (groupId: number) => shares?.filter(s => s.shareGroupId === groupId) ?? [];

  const getItemName = (item: NonNullable<typeof groups>[number]["items"][number]) => {
    if (item.itemType === "inventory_item" && item.inventoryItemId) {
      return inventory?.find(i => i.id === item.inventoryItemId)?.name ?? `Item #${item.inventoryItemId}`;
    }
    if (item.itemType === "recipe" && item.recipeId) {
      return recipes?.find(r => r.id === item.recipeId)?.name ?? `Recipe #${item.recipeId}`;
    }
    return "Unknown";
  };

  if (!activeVenueId) return <div className="text-center p-8 text-muted-foreground">Select a venue first.</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Share Groups
          </h1>
          <p className="text-muted-foreground mt-1">Curate bundles of inventory and recipes to share with other chefs.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black hover:bg-primary/90 font-semibold">
              <Plus className="w-4 h-4 mr-2" /> New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Share Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-foreground">Group Name</Label>
                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="bg-background border-border text-foreground" placeholder="e.g. Autumn Menu Pack" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Description (optional)</Label>
                <Input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="bg-background border-border text-foreground" placeholder="What's in this group?" />
              </div>
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || createGroup.isPending} className="w-full bg-primary text-black">
                {createGroup.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 bg-card w-full" />)}
        </div>
      ) : !groups || groups.length === 0 ? (
        <Card className="bg-card border-dashed border-2 border-border mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No groups yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Build a group to share a curated set of inventory items or recipes as a single link — useful for menu hand-offs and supplier packs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <Card key={group.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-foreground text-lg">{group.name}</CardTitle>
                    {group.description && <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={shareGroupId === group.id} onOpenChange={open => setShareGroupId(open ? group.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:text-foreground">
                          <Copy className="w-3.5 h-3.5 mr-1.5" /> Share Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border text-foreground max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Share — {group.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-foreground text-sm">Allow others to copy to their venue</Label>
                            <input type="checkbox" checked={shareAllowCopy} onChange={e => setShareAllowCopy(e.target.checked)} className="w-4 h-4 accent-primary" />
                          </div>
                          <Button
                            onClick={() => handleShareGroup(group.id, group.name)}
                            disabled={createShare.isPending}
                            className="w-full bg-primary text-black"
                          >
                            {createShare.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                            Create &amp; Copy Link
                          </Button>
                          {groupShares(group.id).length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Links</p>
                              {groupShares(group.id).map(s => (
                                <div key={s.id} className="flex items-center gap-2 bg-secondary/30 rounded-md p-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">{s.label ?? "Group link"}</p>
                                    <p className="text-xs text-muted-foreground">{s.accessCount} views</p>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyLink(s.shareToken)}>
                                    {copiedToken === s.shareToken ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRevokeShare(s.id)}>
                                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="icon" variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Items in group */}
                {group.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No items in this group yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <Badge key={item.id} variant="secondary" className="bg-secondary/50 text-foreground gap-1.5 pr-1.5">
                        {item.itemType === "inventory_item" ? <Package className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                        {getItemName(item)}
                        <button onClick={() => handleRemoveItem(group.id, item.id)} className="ml-0.5 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add item form */}
                <div className={cn("flex gap-2 pt-2 border-t border-border/50", addItemGroupId === group.id ? "flex-col" : "")}>
                  {addItemGroupId === group.id ? (
                    <>
                      <div className="flex gap-2">
                        <Select value={addItemType} onValueChange={v => setAddItemType(v as "inventory_item" | "recipe")}>
                          <SelectTrigger className="w-36 bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inventory_item">Inventory</SelectItem>
                            <SelectItem value="recipe">Recipe</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={addItemId} onValueChange={setAddItemId}>
                          <SelectTrigger className="flex-1 bg-background border-border text-foreground">
                            <SelectValue placeholder="Pick item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {addItemType === "inventory_item"
                              ? inventory?.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)
                              : recipes?.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddItem} disabled={!addItemId || addItem.isPending} className="bg-primary text-black">
                          {addItem.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Add
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddItemGroupId(null)} className="text-muted-foreground">
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => { setAddItemGroupId(group.id); setAddItemId(""); }}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Item
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
