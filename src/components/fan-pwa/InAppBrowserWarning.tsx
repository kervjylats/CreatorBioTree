/** InAppBrowserWarning — nudge to open the app in Safari/Chrome when inside a WebView (TikTok/IG/…). */
"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iP(hone|ad|od)/i.test(navigator.userAgent);
}

/** Shown when the fan shell is opened inside an in-app browser (install + login won't work there). */
export function InAppBrowserWarning() {
  const { installState } = usePWAInstall();
  if (installState !== "in-app") return null;

  return (
    <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Open this link in {isIOS() ? "Safari" : "Chrome"} to install the app and log in.</p>
      {isIOS() ? (
        <ol className="mt-2 list-decimal pl-4 text-xs opacity-80">
          <li>Tap the Share button (square with an arrow).</li>
          <li>Copy the link.</li>
          <li>Paste it into Safari.</li>
        </ol>
      ) : (
        <ol className="mt-2 list-decimal pl-4 text-xs opacity-80">
          <li>Tap the three dots (⋮) top-right.</li>
          <li>“Copy link”.</li>
          <li>Paste it into Chrome.</li>
        </ol>
      )}
    </div>
  );
}