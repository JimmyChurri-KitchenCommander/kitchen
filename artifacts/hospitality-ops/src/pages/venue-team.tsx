import { useState, useCallback } from "react";
import { useVenueStore } from "@/stores/venueStore";
import { useVenueRole } from "@/hooks/use-venue-role";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import {
  Users, Link, Copy, Check, Shield, UserMinus, RefreshCw,
  UserCheck, Clock, ShieldCheck, ShieldOff, Crown, AlertTriangle, Pencil, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Member = {
  id: number;
  venueId: number;
  clerkUserId: string | null;
  displayName: string | null;
  role: string;
  status: string;
  joinedAt: string | null;
  removedAt: string | null;
  createdAt: string;
};

export default function VenueTeamPage() {
  const { activeVenueId } = useVenueStore();
  const { data: roleData } = useVenueRole();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // Transfer ownership state
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  // Remove member confirmation state
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null);

  // Name editing state
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["venue-members", activeVenueId],
    queryFn: async () => {
      const resp = await fetch(`/api/venues/${activeVenueId}/members`);
      if (!resp.ok) throw new Error("Failed to load members");
      return resp.json() as Promise<Member[]>;
    },
    enabled: !!activeVenueId && (roleData?.isAdmin ?? false),
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      const resp = await fetch(`/api/venues/${activeVenueId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!resp.ok) throw new Error("Failed to update role");
      return resp.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["venue-members", activeVenueId] });
      toast({ title: vars.role === "admin" ? "Promoted to admin" : "Role changed to member" });
    },
    onError: (err: unknown) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Could not update role", variant: "destructive" });
    },
  });

  const updateMemberName = useMutation({
    mutationFn: async ({ memberId, firstName, lastName }: { memberId: number; firstName: string; lastName: string }) => {
      const resp = await fetch(`/api/venues/${activeVenueId}/members/${memberId}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to update name");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-members", activeVenueId] });
      setEditingNameId(null);
      toast({ title: "Name updated" });
    },
    onError: (err: unknown) => {
      toast({ title: "Could not update name", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: number) => {
      const resp = await fetch(`/api/venues/${activeVenueId}/members/${memberId}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Failed to remove member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-members", activeVenueId] });
      toast({ title: "Member removed" });
    },
    onError: (err: unknown) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Could not remove member", variant: "destructive" });
    },
  });

  const transferOwnership = useMutation({
    mutationFn: async (newOwnerMemberId: number) => {
      const resp = await fetch(`/api/venues/${activeVenueId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerMemberId }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to transfer ownership");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-members", activeVenueId] });
      queryClient.invalidateQueries({ queryKey: ["venue-role", activeVenueId] });
      setTransferTargetId("");
      setTransferConfirmOpen(false);
      toast({ title: "Ownership transferred", description: "You are now an admin of this venue." });
    },
    onError: (err: unknown) => {
      setTransferConfirmOpen(false);
      toast({ title: "Transfer failed", description: err instanceof Error ? err.message : "Could not transfer ownership", variant: "destructive" });
    },
  });

  const generateInvite = useCallback(async () => {
    setGeneratingLink(true);
    try {
      const resp = await fetch(`/api/venues/${activeVenueId}/invite`, { method: "POST" });
      if (!resp.ok) throw new Error("Failed to generate invite");
      const { token } = await resp.json() as { token: string; expiresAt: string };
      const url = `${window.location.origin}/join/${token}`;
      setInviteUrl(url);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Could not generate link", variant: "destructive" });
    } finally {
      setGeneratingLink(false);
    }
  }, [activeVenueId, toast]);

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied", description: "Share it with a chef — expires in 7 days." });
  }, [inviteUrl, toast]);

  const startEditName = (m: Member) => {
    const parts = (m.displayName ?? "").split(" ");
    setEditFirstName(parts[0] ?? "");
    setEditLastName(parts.slice(1).join(" "));
    setEditingNameId(m.id);
  };

  const cancelEditName = () => {
    setEditingNameId(null);
    setEditFirstName("");
    setEditLastName("");
  };

  const saveEditName = (memberId: number) => {
    const first = editFirstName.trim();
    if (!first) return;
    updateMemberName.mutate({ memberId, firstName: first, lastName: editLastName.trim() });
  };

  if (!activeVenueId) return <div className="text-center p-8">Select a venue first.</div>;

  if (!roleData?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Admin access required</h2>
        <p className="text-muted-foreground max-w-sm">Only venue admins can manage team members. Ask your admin for access.</p>
      </div>
    );
  }

  const activeMembers = members?.filter((m) => m.status === "active") ?? [];
  const invitedMembers = members?.filter((m) => m.status === "invited") ?? [];
  const removedMembers = members?.filter((m) => m.status === "removed") ?? [];

  const transferCandidates = activeMembers.filter(
    (m) => m.clerkUserId && m.clerkUserId !== user?.id
  );

  const transferTarget = transferCandidates.find((m) => m.id === parseInt(transferTargetId));

  const RoleBadge = ({ role }: { role: string }) => {
    if (role === "owner") return (
      <Badge variant="outline" className="border-amber-400/40 text-amber-600 bg-amber-50">Owner</Badge>
    );
    if (role === "admin") return (
      <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">Admin</Badge>
    );
    return (
      <Badge variant="outline" className="border-border text-muted-foreground">Member</Badge>
    );
  };

  const isSelf = (m: Member) => m.clerkUserId === user?.id;
  const canToggleRole = (m: Member) => !isSelf(m) && m.role !== "owner";
  const canRemove = (m: Member) => !isSelf(m) && m.role !== "owner";

  const memberDisplayName = (m: Member) => {
    if (isSelf(m)) return user?.fullName ?? "You";
    return m.displayName ?? "Chef (pending name)";
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          Team
        </h1>
        <p className="text-muted-foreground mt-1">Manage who has access to this venue.</p>
      </div>

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link className="w-4 h-4 text-primary" />
            Invite a chef
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generate a one-time join link. Anyone with the link can join as a member — link expires in 7 days.
          </p>
          {inviteUrl ? (
            <div className="flex gap-2">
              <div className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm font-mono truncate text-muted-foreground border border-border">
                {inviteUrl}
              </div>
              <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="ghost" onClick={generateInvite} disabled={generatingLink} className="shrink-0">
                <RefreshCw className={cn("w-4 h-4", generatingLink && "animate-spin")} />
              </Button>
            </div>
          ) : (
            <Button onClick={generateInvite} disabled={generatingLink} className="w-full sm:w-auto">
              {generatingLink ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Link className="w-4 h-4 mr-2" />}
              Generate invite link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active members */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading team...</div>
      ) : (
        <>
          {activeMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Active members ({activeMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {activeMembers.map((m) => (
                  <div key={m.id} className="px-6 py-4">
                    {editingNameId === m.id ? (
                      /* Inline name edit */
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <Input
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            placeholder="First name"
                            className="bg-background border-border text-sm h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditName(m.id);
                              if (e.key === "Escape") cancelEditName();
                            }}
                          />
                          <Input
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            placeholder="Last name"
                            className="bg-background border-border text-sm h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditName(m.id);
                              if (e.key === "Escape") cancelEditName();
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEditName(m.id)}
                            disabled={updateMemberName.isPending || !editFirstName.trim()}
                            className="h-7 gap-1.5 text-xs"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditName}
                            disabled={updateMemberName.isPending}
                            className="h-7 gap-1.5 text-xs"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{memberDisplayName(m)}</p>
                            {isSelf(m) && <span className="text-xs text-muted-foreground">(you)</span>}
                            {/* Admin can edit any member's name */}
                            {!isSelf(m) && m.clerkUserId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditName(m)}
                                className="h-5 px-1.5 text-muted-foreground hover:text-foreground gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                <span className="text-xs">Edit name</span>
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>

                        <RoleBadge role={m.role} />

                        {canToggleRole(m) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "shrink-0 gap-1.5 text-xs font-semibold border",
                              m.role === "admin"
                                ? "border-border text-muted-foreground hover:border-status-critical/40 hover:text-status-critical hover:bg-status-critical/5"
                                : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                            )}
                            onClick={() => updateRole.mutate({ memberId: m.id, role: m.role === "admin" ? "member" : "admin" })}
                            disabled={updateRole.isPending}
                          >
                            {m.role === "admin" ? (
                              <><ShieldOff className="w-3.5 h-3.5" /> Remove admin</>
                            ) : (
                              <><ShieldCheck className="w-3.5 h-3.5" /> Make admin</>
                            )}
                          </Button>
                        )}

                        {canRemove(m) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Remove from venue"
                            onClick={() => setRemoveTargetId(m.id)}
                            disabled={removeMember.isPending}
                            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {invitedMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Pending invites ({invitedMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {invitedMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Invite pending</p>
                      <p className="text-xs text-muted-foreground">
                        Expires {m.createdAt ? new Date(new Date(m.createdAt).getTime() + 7 * 86400000).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground">Invited</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {removedMembers.length > 0 && (
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Former members ({removedMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {removedMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        {m.displayName ?? "Former chef"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Removed {m.removedAt ? new Date(m.removedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeMembers.length === 0 && invitedMembers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No team members yet. Generate an invite link to add your first chef.</p>
              </CardContent>
            </Card>
          )}

          {/* Transfer Ownership — only visible to the owner */}
          {roleData?.isOwner && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="border-b border-amber-200/60 pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <Crown className="w-4 h-4" />
                  Transfer Ownership
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Hand full ownership of this venue to another active member. You will remain as an admin and keep your access.
                </p>

                {transferCandidates.length === 0 ? (
                  <p className="text-sm text-amber-700/70 italic">
                    No other active members to transfer ownership to. Invite someone first.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                      <SelectTrigger className="flex-1 bg-background border-amber-200">
                        <SelectValue placeholder="Select new owner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transferCandidates.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {memberDisplayName(m)}
                            {m.role === "admin" && " (Admin)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      className="border-amber-400 text-amber-700 hover:bg-amber-100 hover:border-amber-500 shrink-0 font-semibold"
                      disabled={!transferTargetId}
                      onClick={() => setTransferConfirmOpen(true)}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Transfer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Remove member confirmation dialog */}
      <AlertDialog open={removeTargetId !== null} onOpenChange={(open) => { if (!open) setRemoveTargetId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <UserMinus className="w-5 h-5 text-destructive" />
              Remove from venue?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-2">
              <span className="block">
                This chef will immediately lose access to all data for this venue, including inventory, recipes, orders, and prep boards.
              </span>
              <span className="block font-semibold text-foreground">
                They can be re-invited using a new invite link if needed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border" onClick={() => setRemoveTargetId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (removeTargetId !== null) {
                  removeMember.mutate(removeTargetId);
                  setRemoveTargetId(null);
                }
              }}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? "Removing..." : "Remove from venue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer ownership confirmation dialog */}
      <AlertDialog open={transferConfirmOpen} onOpenChange={setTransferConfirmOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Transfer ownership?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-2">
              <span className="block">
                You are about to transfer ownership of this venue to{" "}
                <strong className="text-foreground">{transferTarget ? memberDisplayName(transferTarget) : "this member"}</strong>.
              </span>
              <span className="block">
                They will become the new owner with full control. You will stay on as an admin and keep your access — but you will no longer be able to transfer ownership or delete the venue.
              </span>
              <span className="block font-semibold text-amber-600">This cannot be undone by you once transferred.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                if (transferTarget) transferOwnership.mutate(transferTarget.id);
              }}
              disabled={transferOwnership.isPending}
            >
              {transferOwnership.isPending ? "Transferring..." : "Yes, transfer ownership"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
