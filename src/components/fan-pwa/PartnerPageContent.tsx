/**
 * PartnerPageContent — full fan-facing partner page (partner-page.md Parts
 * 2-5) at /[username]/partner/[partnerUsername]. Uses the shared PartnerBody
 * (same surface as the PartnerModal bottom-sheet) + a REAL follow toggle via
 * usePartnerFollow — no more cosmetic local-state flip (2026-09-23 fix).
 */
"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import type { ContentItem } from "@/types";
import { buttonClass } from "./themeStyles";
import { PartnerBody, usePartnerFollow } from "./PartnerBody";
import { firePartnerHop } from "@/lib/hopAttribution";

interface PartnerPageContentProps {
  branding: CreatorBranding;
  items: ContentItem[];
  socialLinks: { label: string; url: string }[];
  hostUsername: string;
  partnerUsername: string;
}

export function PartnerPageContent({
  branding,
  items,
  socialLinks,
  hostUsername,
  partnerUsername,
}: PartnerPageContentProps) {
  const { following, toggleFollow } = usePartnerFollow(partnerUsername, hostUsername);

  // Silent hop (earnings.md Part 8, Door 2) — the full partner page is the
  // second hop surface; same fire-and-forget, once per session pair.
  useEffect(() => {
    firePartnerHop(hostUsername, partnerUsername);
  }, [hostUsername, partnerUsername]);

  return (
    <div
      data-tl="PartnerPageContent"
      className="min-h-screen-safe"
      style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3 safe-top backdrop-blur-md" style={{ borderColor: branding.textColor + "22", backgroundColor: branding.backgroundColor + "DD" }}>
        <div className="flex items-center justify-between">
          <a
            href={`/${hostUsername}`}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: branding.accentColor }}
          >
            <ArrowLeft size={16} />
            Back to @{hostUsername}
          </a>
          <button
            type="button"
            onClick={() => void toggleFollow()}
            {...buttonClass(branding, "text-xs px-3 py-1.5")}
          >
            {following ? "Following ✓" : <><Heart size={12} /> Follow</>}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <PartnerBody branding={branding} items={items} socialLinks={socialLinks} />
      </div>
    </div>
  );
}