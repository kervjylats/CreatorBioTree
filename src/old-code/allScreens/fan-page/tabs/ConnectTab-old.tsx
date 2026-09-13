/** TODO: Add purpose docstring. */
"use client";

import type { CreatorBranding } from "@/lib/branding";

interface FanConnectTabProps {
  branding: CreatorBranding;
}

export function FanConnectTab({ branding }: FanConnectTabProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <p className="text-center text-sm" style={{ color: branding.textColor + "80" }}>
        Partners will appear here soon.
      </p>
    </div>
  );
}
