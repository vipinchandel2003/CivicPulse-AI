"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export const OfflineNetworkBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 py-2 px-4 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md transition-all ${
        showRestored
          ? "bg-emerald-600 text-white animate-in fade-in slide-in-from-top"
          : "bg-amber-600 text-white animate-in fade-in slide-in-from-top"
      }`}
    >
      {showRestored ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span>Connection Restored · Synchronizing background queues...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 animate-bounce" />
          <span>Working in Offline Mode · Reports will be stored securely and synced automatically.</span>
        </>
      )}
    </div>
  );
};
