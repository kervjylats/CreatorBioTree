/** TODO: Add purpose docstring. */
"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";

export function InAppBrowserWarning() {
  const { installState } = usePWAInstall();

  if (installState !== "in-app") return null;

  const isIOS = typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
     (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const browserName = isIOS ? "Safari" : "Chrome";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-2xl">
          📲
        </div>

        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Open in {browserName} for the best experience
        </h2>

        <p className="mb-5 text-sm text-gray-500">
          This app works best in {browserName}. Once open, you can install it on
          your home screen for instant access — no app store needed.
        </p>

        {/* Step by step */}
        <div className="mb-5 space-y-3">
          <Step number={1}>
            Tap the <strong>3 dots</strong> or <strong>share icon</strong> at the
            top or bottom of your screen
          </Step>
          <Step number={2}>
            Select <strong>&quot;Open in {browserName}&quot;</strong>
          </Step>
          <Step number={3}>
            Tap <strong>&quot;Add to Home Screen&quot;</strong> when prompted
          </Step>
        </div>

        <p className="text-center text-xs text-gray-400">
          Or copy the link and paste it into {browserName}
        </p>
      </div>
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
        {number}
      </span>
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  );
}
