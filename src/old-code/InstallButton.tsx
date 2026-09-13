/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface Props {
  creatorName: string;
  creatorId?: string;
  accentColor?: string;
}

export function InstallButton({
  creatorName,
  creatorId,
  accentColor = "#6366f1",
}: Props) {
  const { installState, triggerInstall, dismiss } = usePWAInstall({
    creatorId,
  });
  const [showGuide, setShowGuide] = useState(false);

  // Already installed → hide
  if (installState === "installed") return null;

  const handleClick = async () => {
    if (installState === "android-ready") {
      // Native prompt on Android / desktop Chrome
      const result = await triggerInstall();
      if (!result) setShowGuide(true);
    } else if (installState === "ios-guide" || installState === "unsupported") {
      // Show manual guide
      setShowGuide(true);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: accentColor }}
      >
        <span>📲</span>
        {installState === "android-ready"
          ? "Install App"
          : "Add to Home Screen"}
      </button>

      {/* Fallback guide modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => {
            setShowGuide(false);
            dismiss();
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Install {creatorName}&apos;s App
            </h2>

            {/* iOS Instructions */}
            <div className="space-y-3 text-sm text-gray-600">
              <Step number={1}>
                Tap the <strong>Share</strong> button (square with arrow)
              </Step>
              <Step number={2}>
                Scroll down and tap{" "}
                <strong>&quot;Add to Home Screen&quot;</strong>
              </Step>
              <Step number={3}>
                Tap <strong>&quot;Add&quot;</strong> in the top right
              </Step>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              The {creatorName} app icon will appear on your home screen.
            </p>

            <button
              onClick={() => {
                setShowGuide(false);
                dismiss();
              }}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
        {number}
      </span>
      <p className="pt-0.5">{children}</p>
    </div>
  );
}
