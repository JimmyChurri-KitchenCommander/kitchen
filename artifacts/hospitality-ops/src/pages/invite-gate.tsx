import { useState } from "react";
import { useUser } from "@clerk/react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InviteGatePage() {
  const { user } = useUser();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const resp = await fetch("/api/auth/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await resp.json() as { success?: boolean; error?: string };
      if (!resp.ok) {
        setError(data.error ?? "Incorrect code — try again.");
        return;
      }
      await user?.reload();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Early access</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform is invite-only while we finalise the build.
            Enter your access code to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-sm font-medium">Access code</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError(null); }}
              placeholder="Enter your access code"
              className="bg-background border-border text-center text-lg tracking-widest"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground"
            disabled={!code.trim() || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isSubmitting ? "Verifying..." : "Enter kitchen"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          No code? Get in touch with the team.
        </p>
      </div>
    </div>
  );
}
