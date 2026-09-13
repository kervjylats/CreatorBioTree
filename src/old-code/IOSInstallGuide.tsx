/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import type { CreatorBranding } from "@/lib/branding";

interface IOSInstallGuideProps {
  branding: CreatorBranding;
}

export function IOSInstallGuide({ branding }: IOSInstallGuideProps) {
  const { installState, dismiss } = usePWAInstall({
    creatorId: branding.creatorId,
  });
  const [visible, setVisible] = useState(true);

  if (installState !== "ios-guide" || !visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    dismiss();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="absolute inset-0 -top-full" onClick={handleDismiss} />

      <div className="relative rounded-t-3xl bg-white px-6 pb-10 pt-5 shadow-2xl">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        <button
          onClick={handleDismiss}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-1 text-center text-lg font-semibold text-gray-900">
          Install {branding.appName}
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Add to your home screen for quick access
        </p>

        <div className="space-y-4">
          <IOSStep number={1} icon="⬆️" title="Tap the Share button" description="It's the square with an arrow at the bottom of Safari" />
          <IOSStep number={2} icon="➕" title='Tap "Add to Home Screen"' description="Scroll down in the share sheet to find it" />
          <IOSStep number={3} icon="✅" title="Tap Add" description="The app icon will appear on your home screen" />
        </div>

        <div className="mt-6 flex flex-col items-center">
          <p className="text-xs text-gray-400">The share button is here ↓</p>
          <div className="mt-2 text-2xl">⬇️</div>
        </div>
      </div>
    </div>
  );
}

function IOSStep({ number, icon, title, description }: { number: number; icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">
          <span className="mr-1 text-gray-400">{number}.</span>
          {title}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}