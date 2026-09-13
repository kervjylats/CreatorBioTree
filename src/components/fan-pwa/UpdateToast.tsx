/** UpdateToast — service-worker update banner ("New version available — Refresh", fan-shell.md Part 6 reuse). */
"use client";

import { useEffect, useState } from "react";
import type { CreatorBranding } from "@/lib/branding";
import { DEFAULT_ACCENT } from "@/lib/branding";
import { buttonShape, contrastText } from "./themeStyles";

/** Shows when the service worker has a waiting/installing update and offers a refresh. */
export function UpdateToast({ branding, accentColor }: { branding?: CreatorBranding; accentColor?: string }) {
  const [show, setShow] = useState(false);
  const color = accentColor ?? branding?.accentColor ?? DEFAULT_ACCENT;

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const showPrompt = () => setShow(true);
    const onControllerChange = () => window.location.reload();

    let waiting: ServiceWorker | null = null;
    navigator.serviceWorker.ready.then((reg) => {
      waiting = reg.waiting;
      if (waiting) showPrompt();
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) showPrompt();
        });
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-4 bottom-16 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-foreground p-3 text-sm text-background shadow-xl">
      <span>⚡ New version available</span>
      <button
        type="button"
        className={`${branding ? buttonShape(branding) : "rounded-full"} px-3 py-1.5 text-xs font-semibold`}
        style={{ backgroundColor: color, color: contrastText(color) }}
        onClick={() => {
          navigator.serviceWorker.ready.then((reg) => reg.waiting?.postMessage({ type: "SKIP_WAITING" }));
        }}
      >
        Refresh
      </button>
    </div>
  );
}