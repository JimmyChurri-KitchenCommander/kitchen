import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVenueStore } from "@/stores/venueStore";
import { useQueryClient } from "@tanstack/react-query";
import { useUser, useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type JoinState = "loading" | "awaiting-auth" | "success" | "error";

export default function JoinVenuePage() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const [state, setState] = useState<JoinState>("loading");
  const [venueName, setVenueName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { setActiveVenueId } = useVenueStore();
  const queryClient = useQueryClient();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    // Wait for Clerk to resolve auth state
    if (!isLoaded) return;

    // Not signed in — prompt sign-in with a redirect back to this join URL
    if (!user) {
      setState("awaiting-auth");
      const redirectUrl = `${window.location.origin}${basePath}/join/${token ?? ""}`;
      // Mark this browser session as coming from an invite so sign-up skips the access code gate
      if (token) sessionStorage.setItem("kc_invite_bypass", "1");
      openSignIn({ forceRedirectUrl: redirectUrl, signUpForceRedirectUrl: redirectUrl });
      return;
    }

    if (!token) { setState("error"); setErrorMsg("No invite token found."); return; }

    fetch("/api/venues/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (resp) => {
        const data = await resp.json() as { venueId?: number; venueName?: string; error?: string };
        if (!resp.ok) throw new Error(data.error ?? "Failed to join venue");
        setVenueName(data.venueName ?? "");
        if (data.venueId) {
          setActiveVenueId(data.venueId);
          queryClient.invalidateQueries({ queryKey: ["venues"] });
        }
        // Reload Clerk user so the updated inviteVerified metadata is reflected immediately
        await user.reload();
        setState("success");
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Could not join venue");
        setState("error");
      });
  }, [token, isLoaded, user, setActiveVenueId, queryClient, openSignIn]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">

        {(state === "loading" || state === "awaiting-auth") && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-bold">
              {state === "awaiting-auth" ? "Signing you in..." : "Joining venue..."}
            </h1>
            <p className="text-muted-foreground">
              {state === "awaiting-auth"
                ? "You'll be redirected back to complete the invite."
                : "Hang tight while we add you to the team."}
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">You're in.</h1>
            <p className="text-muted-foreground">
              You've joined <span className="font-semibold text-foreground">{venueName}</span>. Head to the dashboard to get started.
            </p>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Invite failed</h1>
            <p className="text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Go home
            </Button>
          </>
        )}

      </div>
    </div>
  );
}
