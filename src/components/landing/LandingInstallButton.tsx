/**
 * LandingInstallButton — install the MAIN platform PWA (manifest `/`, PWA #1)
 * from the landing hero (landing.md Phase 4). Uses the shared usePWAInstall
 * state machine: Chrome/Android installs directly; iOS/in-app browsers show
 * the manual steps instead. Hidden when already installed or unsupported.
 */
"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const HINTS: Partial<Record<string, string>> = {
  "ios-guide": "On iPhone: tap Share \u2191, then \u201CAdd to Home Screen\u201D.",
  "in-app": "Open this page in your browser (Safari/Chrome) to install.",
};

export function LandingInstallButton() {
  const { installState, triggerInstall } = usePWAInstall();
  const [showHint, setShowHint] = useState(false);

  if (installState === "unsupported" || installState === "installed") return null;

  const handleClick = async () => {
    if (installState === "android-ready") {
      await triggerInstall();
      return;
    }
    setShowHint((v) => !v);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-foreground hover:bg-card transition-all"
      >
        <Download size={16} />
        Install BioTree
      </button>
      {showHint && HINTS[installState] && (
        <p className="text-xs text-muted-foreground max-w-xs" role="status">
          {HINTS[installState]}
        </p>
      )}
    </div>
  );
}
