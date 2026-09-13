/** IOSInstallGuide — manual iOS install sheet (Share → Add to Home Screen → Add; fan-shell.md Part 3). */
"use client";

import { useState } from "react";
import { Share, AppWindow, Plus } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { contrastText } from "./themeStyles";

const STEPS = [
  { Icon: Share, title: "Tap Share", body: "Tap the Share button in your browser's toolbar." },
  { Icon: AppWindow, title: "Add to Home Screen", body: "Scroll down and tap “Add to Home Screen”." },
  { Icon: Plus, title: "Tap Add", body: "Confirm with “Add” in the top-right corner." },
];

/** Shown only on iOS Safari when the app is not installed. Accounts are NOT needed to install. */
export function IOSInstallGuide({ branding }: { branding: CreatorBranding }) {
  const { installState, dismiss } = usePWAInstall({ creatorId: branding.creatorId });
  const [visible, setVisible] = useState(false);

  if (installState !== "ios-guide") return null;
  if (!visible) {
    return (
      <button
        type="button"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl p-3 text-left shadow-xl"
        style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
        onClick={() => setVisible(true)}
      >
        <div className="text-sm font-semibold">Install {branding.appName}?</div>
        <div className="text-xs opacity-70">Adds an app icon to your home screen — tap here for steps</div>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={() => {
        setVisible(false);
        dismiss();
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-6 shadow-2xl"
        style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold">Install {branding.appName}</h3>
        <ol className="mt-4 space-y-4">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: branding.accentColor, color: contrastText(branding.accentColor) }}
              >
                <Icon size={18} />
              </span>
              <div>
                <div className="text-sm font-semibold">
                  {i + 1}. {title}
                </div>
                <div className="text-xs opacity-70">{body}</div>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="mt-5 w-full rounded-full py-2.5 text-sm font-semibold"
          style={{ backgroundColor: branding.accentColor, color: contrastText(branding.accentColor) }}
          onClick={() => {
            setVisible(false);
            dismiss();
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}