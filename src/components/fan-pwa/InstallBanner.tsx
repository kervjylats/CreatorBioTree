/** InstallBanner — Android/desktop install prompt bar ("Add {appName} — Install to your home screen", fan-shell Part 3). */
"use client";

import { X } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { buttonClass } from "./themeStyles";

/** Shows only when the browser deferred a `beforeinstallprompt` (Android/desktop Chrome). */
export function InstallBanner({ branding }: { branding: CreatorBranding }) {
  const { installState, triggerInstall, dismiss } = usePWAInstall({ creatorId: branding.creatorId });

  if (installState !== "android-ready") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl p-3 shadow-xl"
      style={{ backgroundColor: branding.cardColor, color: branding.textColor }}>
      <button
        type="button"
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100"
        onClick={dismiss}
      >
        <X size={16} />
      </button>
      <div className="flex-1 text-sm font-medium">Add {branding.appName} — install to your home screen</div>
      <button type="button" {...buttonClass(branding)} onClick={() => triggerInstall()}>
        Add
      </button>
    </div>
  );
}