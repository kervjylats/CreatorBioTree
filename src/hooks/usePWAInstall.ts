/** usePWAInstall — PWA install state machine (fan-shell.md Part 3: install is account-free; fan-shell Part 4d). */
"use client";

import { useCallback, useEffect, useState } from "react";

export type InstallPlatform = "ios" | "android" | "desktop" | "unknown";
export type InstallState =
  | "unsupported"
  | "in-app"
  | "android-ready"
  | "ios-guide"
  | "installed"
  | "dismissed";

interface UsePWAInstallProps {
  creatorId?: string;
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** In-app browser (WebView) detection — branded apps that steal the install gesture. */
function detectInAppBrowser(ua: string): boolean {
  return /(TikTok|ByteDance|FBAN|FBAV|FB_IAB|Instagram|instagr|Snapchat|Twitter|Line|Pinterest|LinkedInApp|GSA\/)/i.test(
    ua,
  );
}

function getPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

/**
 * Full install flow for the fan shell:
 *  - already standalone → "installed"
 *  - in-app browser (TikTok/IG/…) → "in-app" (user gets the "open in browser" guide)
 *  - iOS Safari → "ios-guide" (manual Share → Add to Home Screen steps)
 *  - Android/desktop Chrome → listens for `beforeinstallprompt` → "android-ready"
 *  - on accepted install → tracks it via POST /api/fan/install
 */
export function usePWAInstall({ creatorId }: UsePWAInstallProps = {}): {
  installState: InstallState;
  triggerInstall: () => Promise<boolean>;
  dismiss: () => void;
} {
  const [installState, setInstallState] = useState<InstallState>("unsupported");
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) {
      setInstallState("installed");
      return;
    }
    if (detectInAppBrowser(navigator.userAgent)) {
      setInstallState("in-app");
      return;
    }
    if (getPlatform() === "ios") {
      setInstallState("ios-guide");
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
      setInstallState("android-ready");
    };
    const onInstalled = () => {
      trackInstall(getPlatform(), creatorId);
      setInstallState("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [creatorId]);

  const triggerInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setInstallState("installed");
      return true;
    }
    setInstallState("dismissed");
    return false;
  }, [deferred]);

  const dismiss = useCallback(() => setInstallState("dismissed"), []);

  return { installState, triggerInstall, dismiss };
}

/** Fire-and-forget install tracking (fan shell analytics; rate-limited 10/m server-side). */
export function trackInstall(platform: InstallPlatform, creatorId?: string): void {
  if (!creatorId || typeof window === "undefined") return;
  fetch("/api/fan/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, creator_id: creatorId }),
  }).catch(() => {});
}