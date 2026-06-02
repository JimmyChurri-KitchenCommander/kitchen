import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChefHat, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useDemoStore } from "@/stores/demoStore";
import { useVenueStore } from "@/stores/venueStore";

export default function DemoKitchenPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [, setLocation] = useLocation();
  const { activate } = useDemoStore();
  const { setActiveVenueId } = useVenueStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");

    if (!key) {
      setErrorMsg("No demo access key found in this link.");
      setStatus("error");
      return;
    }

    fetch(`/api/demo-init?key=${encodeURIComponent(key)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Demo setup failed.");
        }
        return res.json() as Promise<{ venueId: number; venueName: string }>;
      })
      .then(({ venueId }) => {
        activate(key, venueId);
        setActiveVenueId(venueId);
        setLocation("/dashboard");
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("error");
      });
  }, [activate, setActiveVenueId, setLocation]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#080f1f] px-4 relative overflow-hidden">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#1464D8]/12 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-sm w-full space-y-5">
        {status === "error" ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Demo unavailable</h2>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">{errorMsg}</p>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#1464D8]/15 border border-[#1464D8]/25 flex items-center justify-center mx-auto">
              <ChefHat className="w-8 h-8 text-[#60a5fa]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Setting up your demo kitchen</h2>
              <p className="text-sm text-white/50 mt-2">Populating The Black Apron — just a moment.</p>
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-[#1464D8] mx-auto" />
          </>
        )}
      </div>
    </div>
  );
}
