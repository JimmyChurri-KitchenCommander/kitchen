import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const goOffline = () => { setIsOnline(false); setWasOffline(true); };
    const goOnline = () => {
      setIsOnline(true);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (isOnline && !showBack) return null;

  if (!isOnline) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-medium py-2.5 px-4 shadow-lg">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>You're offline — live data unavailable. Changes won't save until you reconnect.</span>
      </div>
    );
  }

  if (showBack && wasOffline) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium py-2.5 px-4 shadow-lg">
        <span>Back online — reconnected.</span>
      </div>
    );
  }

  return null;
}
