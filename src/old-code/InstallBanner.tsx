/** TODO: Add purpose docstring. */
"use client";

import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import type { CreatorBranding } from "@/lib/branding";

interface InstallBannerProps {
  branding: CreatorBranding;
}

export function InstallBanner({ branding }: InstallBannerProps) {
  const { installState, triggerInstall, dismiss } = usePWAInstall({
    creatorId: branding.creatorId,
  });

  if (installState !== "android-ready") return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm">
      <div className="rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl text-white"
            style={{ backgroundColor: branding.accentColor }}
          >
            ⚡
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              Add {branding.appName}
            </p>
            <p className="text-xs text-gray-500">
              Install to your home screen
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              ✕
            </button>
            <Button
              size="sm"
              styleColor={branding.accentColor}
              onClick={triggerInstall}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}