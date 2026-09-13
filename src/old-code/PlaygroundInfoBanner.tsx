/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface PlaygroundInfoBannerProps {
  storageKey?: string;
}

export function PlaygroundInfoBanner({ storageKey = "playground_banner_dismissed" }: PlaygroundInfoBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(storageKey) === "true"; } catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(storageKey, "true"); } catch {}
  };

  return (
    <div className="relative bg-indigo-50 border-b border-indigo-100 px-4 py-3">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      <div className="pr-6">
        <p className="text-[11px] font-semibold text-indigo-800 mb-1">How Preview Works</p>
        <p className="text-[10px] text-indigo-600 leading-relaxed">
          Your app has <strong>3 audiences</strong>: guests see the landing page, signed-in fans see tabs (Home/Content/Connect/Settings). Use &ldquo;Preview as&rdquo; to switch views.
        </p>
      </div>
    </div>
  );
}
