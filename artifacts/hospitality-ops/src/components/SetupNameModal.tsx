import { useState } from "react";
import { useUser, useAuth } from "@clerk/react";
import { ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupNameModal() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();
    if (!trimFirst) {
      setError("First name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: trimFirst, lastName: trimLast }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to save name");
      }
      // Reload Clerk user — once firstName is set the gate in ProtectedRoute clears
      await user?.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome to Kitchen Command
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set your name so your team knows who you are on prep boards, cleaning rosters, and assignments.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="setup-first" className="text-sm font-medium">
              First name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="setup-first"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(null); }}
              placeholder="e.g. Marco"
              className="bg-background border-border"
              disabled={saving}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setup-last" className="text-sm font-medium">
              Last name
            </Label>
            <Input
              id="setup-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Pierre"
              className="bg-background border-border"
              disabled={saving}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={() => void handleSave()}
            disabled={saving || !firstName.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Enter the kitchen"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
