/** TODO: Add purpose docstring. */
"use client";

import type { CreatorBranding } from "@/lib/branding";

interface FanContentTabProps {
  branding: CreatorBranding;
}

export function FanContentTab({ branding }: FanContentTabProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <p className="text-center text-sm" style={{ color: branding.textColor + "80" }}>
        Content coming soon.
      </p>
    </div>
  );
}
