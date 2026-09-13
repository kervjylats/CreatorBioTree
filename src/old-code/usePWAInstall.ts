"use client";

import { useEffect, useState } from "react";

// ─── Browser API augmentation ─────────────────────────────────────────────────

/**
 * The `beforeinstallprompt` event is not yet in the TypeScript DOM lib.
 * We extend Event here rather than using `any`.
 */
interface BeforeInstallPromptEvent extends Event {
  /** Show the native install prompt dialog */
  prompt: () => Promise<void>;
  /** Resolves when the user accepts or dismisses the prompt */
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type InstallPlatform = "ios" | "android" | "desktop" | "unknown";

export type InstallState =
  | "unsupported"   // browser has no install capability
  | "in-app"        // running inside a social/in-app browser — can't install
  | "android-ready" // Android Chrome: native prompt available
  | "ios-guide"     // iOS Safari: show manual "Add to Home Screen" instructions
  | "installed"     // already running as an installed PWA
  | "dismissed";    // user declined in this session

interface UsePWAInstallProps {
  /** Creator ID sent to the install-tracking endpoint */
  creatorId?: string;
}

interface UsePWAInstallReturn {
  installState:   InstallState;
  /** Triggers the native Android install prompt. Returns true on acceptance. */
  triggerInstall: () => Promise<boolean>;
  /** Mark the prompt as dismissed for this session */
  dismiss:        () => void;
}

// ─── Helper — in-app browser detection ───────────────────────────────────────

/**
 * Returns true when the page is running inside an in-app browser (e.g.
 * TikTok, Facebook, Instagram, Snapchat, Twitter, Line, Pinterest, LinkedIn).
 *
 * These WebViews do not support PWA installation and typically block the
 * `beforeinstallprompt` event. We detect them to show a "Open in Safari /
 * Chrome" nudge instead.
 */
function detectInAppBrowser(ua: string): boolean {
  return (
    // ByteDance / TikTok
    /BytedanceWebview|ByteLocale|TikTok/i.test(ua) ||
    // Facebook
    /FBAN|FBAV|FB_IAB/i.test(ua) ||
    // Instagram
    /Instagram/i.test(ua) ||
    // Snapchat
    /\bSnapchat\b/i.test(ua) ||
    // Twitter / X
    /\bTwitter\b/i.test(ua) ||
    // Line — reports itself as "Line/N.N.N" in the UA string
    /\bLine\//i.test(ua) ||
    // Pinterest
    /\bPinterest\b/i.test(ua) ||
    // LinkedIn
    /\bLinkedIn\b/i.test(ua)
  );
}

// ─── Helper — platform detection ──────────────────────────────────────────────

function detectPlatform(ua: string): InstallPlatform {
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua))         return "android";
  if (!/Mobi/i.test(ua))           return "desktop";
  return "unknown";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePWAInstall(
  { creatorId }: UsePWAInstallProps = {}
): UsePWAInstallReturn {
  const [installState,   setInstallState]   = useState<InstallState>("unsupported");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent;

    // ── Already installed ────────────────────────────────────────────────────
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      setInstallState("installed");
      return;
    }

    // ── In-app browser ───────────────────────────────────────────────────────
    if (detectInAppBrowser(ua)) {
      setInstallState("in-app");
      return;
    }

    // ── iOS Safari ───────────────────────────────────────────────────────────
    // iOS does not fire `beforeinstallprompt`; we show manual instructions.
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);

    if (isIOS && isSafari) {
      setInstallState("ios-guide");
      return;
    }

    // ── Android Chrome / desktop Chrome — native prompt ──────────────────────
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState("android-ready");
    };

    const handleAppInstalled = () => {
      setInstallState("installed");
      setDeferredPrompt(null);
      trackInstall(creatorId);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [creatorId]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);

    if (outcome === "dismissed") {
      setInstallState("dismissed");
      return false;
    }

    return true;
  };

  const dismiss = () => setInstallState("dismissed");

  return { installState, triggerInstall, dismiss };
}

// ─── Install tracking (fire-and-forget) ──────────────────────────────────────

async function trackInstall(creatorId?: string): Promise<void> {
  try {
    const platform = detectPlatform(navigator.userAgent);

    await fetch("/api/fan/install", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ platform, creator_id: creatorId ?? null }),
    });
  } catch (err) {
    // Non-fatal — tracking must never break the install experience.
    console.warn("[usePWAInstall] Install tracking failed:", err);
  }
}
