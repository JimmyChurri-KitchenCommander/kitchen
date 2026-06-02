import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMethod = "native" | "ios" | "samsung" | "manual";

export function usePWAInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSamsungBrowser = /SamsungBrowser/i.test(ua);
  const isSafariOnly = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isIOSSafari = isIOS && isSafariOnly;

  const method: InstallMethod = installEvent
    ? "native"
    : isIOSSafari
    ? "ios"
    : isSamsungBrowser
    ? "samsung"
    : "manual";

  // Show the button whenever the app is not already installed
  const canInstall = !isInstalled;

  const install = async () => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstallEvent(null);
      setIsInstalled(true);
    }
    return outcome === "accepted";
  };

  return { canInstall, method, install, isInstalled };
}
