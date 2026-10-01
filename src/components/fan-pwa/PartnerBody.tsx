/**
 * PartnerBody.tsx — the shared partner surface (partner-page.md Parts 2-5),
 * used by BOTH the PartnerModal bottom-sheet and the full /[username]/partner/
 * page so partner content is never duplicated. Renders the partner's branded
 * identity, artist links, and catalog. `usePartnerFollow` carries the real
 * follow toggle (fan_follows via /api/fan/follow) plus the initial state.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { CreatorBranding } from "@/lib/branding";
import type { ContentItem } from "@/types";
import { contrastText } from "./themeStyles";
import { SectionTitle } from "./SectionTitle";
import { getInitials } from "@/lib/fan-helpers";
import { money } from "@/lib/format";

interface PartnerBodyProps {
  branding: CreatorBranding;
  items: ContentItem[];
  socialLinks: { label: string; url: string }[];
}

/** Follow state + toggle for a partner, backed by /api/fan/follow. */
export function usePartnerFollow(partnerUsername: string, hostUsername: string) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetchJson<{ followed?: { username: string }[] }>(`/api/fan/partners?username=${encodeURIComponent(hostUsername)}`)
      .then((d) => {
        const followedList: { username: string }[] = d.followed ?? [];
        setFollowing(followedList.some((p) => p.username === partnerUsername));
      })
      .catch(() => {});
  }, [hostUsername, partnerUsername]);

  const toggleFollow = useCallback(async () => {
    const method = following ? "DELETE" : "POST";
    const res = await fetch("/api/fan/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_username: partnerUsername, current_creator_username: hostUsername }),
    });
    if (res.ok) {
      const d = (await res.json()) as { followed: boolean };
      setFollowing(d.followed);
      return;
    }
    // Following needs a session on THIS creator's app (401). The tap used to do
    // nothing at all — no state change, no message (2026-10-01 audit).
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    toast.error(body?.error ?? (res.status === 401 ? "Sign in to follow" : "Couldn't update follow"));
  }, [following, partnerUsername, hostUsername]);

  return { following, toggleFollow };
}

/** The shared partner identity + links + catalog body (no outer frame). */
export function PartnerBody({ branding, items, socialLinks }: PartnerBodyProps) {
  return (
    <>
      {/* Partner identity */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold overflow-hidden"
            style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
          >
            {branding.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.avatarUrl} alt={branding.displayName} className="h-full w-full object-cover" />
            ) : (
              getInitials(branding.displayName)
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
          <SectionTitle branding={branding}>Links</SectionTitle>
          <div className="flex flex-col gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl px-4 py-3"
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
        <section className="px-4 pb-[var(--bottom-nav-height)]">
          <SectionTitle branding={branding}>Content</SectionTitle>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <h3 className="break-words text-sm font-bold">{item.title}</h3>
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
                    Buy — {money(item.price, item.currency)}
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
    </>
  );
}