/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { CreatorBranding } from "@/lib/branding";

interface UpdateToastProps {
  branding?: CreatorBranding;
  accentColor?: string;
}

/**
 * Listens for service worker updates and shows a banner when a new version
 * of the app is available. The user taps "Refresh" to activate the new
 * version immediately.
 *
 * Works in any component rendered under the creator's brand — guests on
 * PublicCreatorPage and signed-in fans on FanAppShell both see it.
 */
export function UpdateToast({ branding, accentColor }: UpdateToastProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const accent = accentColor ?? branding?.accentColor ?? "#6366f1";

  const handleRefresh = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }, [waitingWorker]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const sw = navigator.serviceWorker;

    // Already waiting — show immediately
    sw.ready.then((reg) => {
      if (reg.waiting) {
        setUpdateAvailable(true);
        setWaitingWorker(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
            setWaitingWorker(newWorker);
          }
        });
      });
    });

    // Handle the controllerchange event (after skipWaiting + reload)
    let refreshing = false;
    sw.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 animate-in slide-in-from-top">
      <div className="w-full max-w-sm rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/10 flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-white"
          style={{ backgroundColor: accent }}
        >
          ⚡
        </div>
        <p className="flex-1 text-xs font-medium text-gray-900">
          New version available
        </p>
        <Button
          size="sm"
          styleColor={accent}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
