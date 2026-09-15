/** PartnerPageContent — fan-facing partner page (partner-page.md Parts 2-5). Shows partner branding, catalog, social links, follow button. */
"use client";

import { useState } from "react";
import { ExternalLink, ArrowLeft, Heart } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import type { ContentItem } from "@/types";
import { buttonClass, cardRadius, contrastText } from "./themeStyles";

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
}: PartnerPageContentProps) {
  const [following, setFollowing] = useState(false);

  return (
    <div
      className="min-h-screen-safe"
      style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3" style={{ borderColor: branding.textColor + "22" }}>
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
            onClick={() => setFollowing((f) => !f)}
            {...buttonClass(branding, "text-xs px-3 py-1.5")}
          >
            {following ? "Following ✓" : <><Heart size={12} /> Follow</>}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg">
      {/* Partner identity */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold overflow-hidden"
            style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
          >
            {branding.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.avatarUrl} alt={branding.displayName} className="h-full w-full object-cover" />
            ) : (
              branding.displayName
                .split(/[\s@._-]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("")
            )}
          </span>
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: branding.textColor }}>
              {branding.displayName}
            </h1>
            <p className="text-sm" style={{ color: branding.textColor + "88" }}>
              @{branding.creatorUsername}
            </p>
          </div>
        </div>
      </div>

      {/* Artist links */}
      {socialLinks.length > 0 && (
        <section className="px-4 pb-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Links
          </h2>
          <div className="flex flex-col gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cardRadius(branding, "flex items-center justify-between px-4 py-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <span className="text-sm font-semibold">{link.label}</span>
                <ExternalLink size={15} style={{ color: branding.accentColor }} />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Catalog feed */}
      {items.length > 0 && (
        <section className="px-4 pb-24">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Content
          </h2>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={cardRadius(branding, "p-4")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <h3 className="text-sm font-bold">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 text-xs" style={{ color: branding.textColor + "aa" }}>
                    {item.description}
                  </p>
                )}
                {item.price > 0 && item.access_type === "paid" && (
                  <span
                    className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: branding.accentColor, color: contrastText(branding.accentColor) }}
                  >
                    Buy — ${item.price.toFixed(2)}
                  </span>
                )}
                {item.access_type === "free" && (
                  <span
                    className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: branding.accentColor + "22", color: branding.accentColor }}
                  >
                    Free
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && socialLinks.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm" style={{ color: branding.textColor + "88" }}>
            No content yet.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
