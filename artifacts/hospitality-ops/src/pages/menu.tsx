import { useVenueStore } from "@/stores/venueStore";
import { useListMenus, useCreateMenu, useDeleteMenu, getListMenusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Plus, Loader2, UtensilsCrossed, Trash2, ChevronRight, BadgePercent, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import MenuImportDialog from "@/components/MenuImportDialog";

export default function MenuPage() {
  const { activeVenueId } = useVenueStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: menus = [], isLoading } = useListMenus(activeVenueId as number, {
    query: { enabled: !!activeVenueId, queryKey: getListMenusQueryKey(activeVenueId as number) },
  });

  const createMenu = useCreateMenu();
  const deleteMenu = useDeleteMenu();

  const [isOpen, setIsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!activeVenueId) return <div className="text-center p-8 text-muted-foreground">Select a venue first.</div>;

  const handleCreate = () => {
    if (!name.trim()) return;
    createMenu.mutate({ venueId: activeVenueId, data: { name, description: description || undefined, isActive: true } }, {
      onSuccess: () => {
        setIsOpen(false); setName(""); setDescription("");
        qc.invalidateQueries({ queryKey: getListMenusQueryKey(activeVenueId) });
        toast({ title: "Menu created" });
      },
    });
  };

  const handleDelete = (id: number, menuName: string) => {
    if (!confirm(`Delete menu "${menuName}"?`)) return;
    deleteMenu.mutate({ venueId: activeVenueId, menuId: id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMenusQueryKey(activeVenueId) });
        toast({ title: "Menu deleted" });
      },
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            Menus
          </h1>
          <p className="text-muted-foreground mt-1">Build menus with live food cost tracking from your recipe library.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border font-semibold gap-2"
            onClick={() => setImportOpen(true)}
          >
            <ImageIcon className="w-4 h-4" /> Import from photo
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground shrink-0">
                <Plus className="w-4 h-4 mr-2" /> New Menu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Menu</DialogTitle>
                <DialogDescription className="text-muted-foreground">Give your menu a name and start adding dishes.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">Menu Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Dinner Menu"
                    className="bg-background border-border text-foreground" onKeyDown={e => e.key === "Enter" && handleCreate()} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">Description (optional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Seasonal highlights, occasion, notes..." rows={2}
                    className="bg-background border-border text-foreground resize-none" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!name.trim() || createMenu.isPending} className="bg-primary text-primary-foreground">
                  {createMenu.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <MenuImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {menus.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No menus yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create a menu or import from a photo to see live food cost percentages.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <ImageIcon className="w-4 h-4 mr-2" /> Import from photo
              </Button>
              <Button onClick={() => setIsOpen(true)} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Create your first menu
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map(menu => (
            <Card key={menu.id} className="bg-card border-border group hover:border-primary/40 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight text-foreground">{menu.name}</CardTitle>
                  <Badge variant={menu.isActive ? "default" : "secondary"} className={menu.isActive ? "bg-primary/10 text-primary border-primary/30 shrink-0" : "shrink-0"}>
                    {menu.isActive ? "Active" : "Draft"}
                  </Badge>
                </div>
                {menu.description && <p className="text-sm text-muted-foreground">{menu.description}</p>}
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BadgePercent className="w-3.5 h-3.5" />
                  <span>Food cost tracking per dish</span>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-3 flex justify-between">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => handleDelete(menu.id, menu.name)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/menu/${menu.id}`}>
                    Open menu <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
