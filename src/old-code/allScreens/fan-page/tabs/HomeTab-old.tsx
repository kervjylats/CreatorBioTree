/** TODO: Add purpose docstring. */
"use client";

import type { CreatorBranding } from "@/lib/branding";

interface FanHomeTabProps {
  branding: CreatorBranding;
}

export function FanHomeTab({ branding }: FanHomeTabProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <p className="text-center text-sm" style={{ color: branding.textColor + "80" }}>
        Welcome to {branding.displayName}&apos;s app. Content coming soon.
      </p>
    </div>
  );
}
