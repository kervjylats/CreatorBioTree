/**
 * FanHomeTab.tsx — Home tab activity hub (fan-shell.md Part 4a): 7 sections
 * (Spotlight, New from creator, Partners, Community, Activity, Upcoming, Announcements).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, CreditCard, Tag } from "lucide-react";
import type { FanShellData } from "./fanData";
import { isScheduledVisible, money } from "./fanData";
import { cardRadius } from "./themeStyles";
import { CreatorHeader } from "./CreatorHeader";
import { FanCommunitySection } from "./FanCommunitySection";
import type { EditModeTarget } from "./GuestPageContent";

interface Partner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string | null;
}

interface FanHomeTabProps {
  data: FanShellData;
  editMode?: boolean;
  onEdit?: (target: EditModeTarget) => void;
}

export function FanHomeTab({ data, editMode, onEdit }: FanHomeTabProps) {
  const { branding } = data;
  const [followedPartners, setFollowedPartners] = useState<Partner[]>([]);

  // Fetch the fan's followed partners (real data from Phase 1 persistence).
  useEffect(() => {
    fetch(`/api/fan/partners?username=${encodeURIComponent(branding.creatorUsername)}`)
      .then((r) => r.json())
      .then((d) => setFollowedPartners(d.followed ?? []))
      .catch(() => {});
  }, [branding.creatorUsername]);

  // All published items, filtered by schedule.
  const items = (data.items ?? []).filter((item) => isScheduledVisible(item));

  // Section 1: Spotlight — featured items.
  const featured = items.filter((item) => item.is_featured);

  // Section 2: New from creator — most recent items (up to 6).
  const recent = items
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Section 6: Upcoming — live items with a future scheduled_publish_at.
  // Date.now() is impure — capture in state on mount to satisfy the linter.
  const [now] = useState(() => Date.now());
  const upcoming = items.filter(
    (item) =>
      item.type === "live" &&
      item.scheduled_publish_at &&
      new Date(item.scheduled_publish_at).getTime() > now,
  );

  // Section 7: Announcements — from the community's Announcements channel.
  const announcementsChannel = data.community?.channels.find(
    (ch) => ch.title === "Announcements" && ch.announcements_only,
  );

  // Section 5: Your activity — purchases + membership.
  const hasPurchases = data.purchases.length > 0;
  const hasMembership = data.purchases.some(
    (p) => p.status === "completed" && data.items.some((i) => i.id === p.content_item_id && i.type === "membership"),
  );

  return (
    <div
      className="min-h-full w-full"
      style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}
    >
      {/* Header — banner, avatar, name, bio */}
      <CreatorHeader branding={branding} bio={data.bio} editMode={editMode} onEdit={onEdit} />

      {/* Empty state — edit mode only, nothing to show yet */}
      {editMode && featured.length === 0 && recent.length === 0 && followedPartners.length === 0 && !data.community && (
        <div className="px-4 pt-8">
          <div
            className={cardRadius(branding, "p-6 text-center")}
            style={{
              backgroundColor: branding.cardColor,
              border: `2px dashed ${branding.textColor}22`,
            }}
          >
            <p className="text-sm font-semibold" style={{ color: branding.textColor + "88" }}>
              Your home tab is empty
            </p>
            <p className="mt-1 text-xs" style={{ color: branding.textColor + "66" }}>
              It will show spotlights, new items, and partner updates once you add them.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Spotlight */}
      {featured.length > 0 && (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Spotlights
          </h2>
          <div className="flex flex-col gap-2">
            {featured.map((item) => (
              <Link
                key={item.id}
                href="/content"
                className={cardRadius(branding, "flex items-center justify-between px-4 py-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <span className="text-sm font-semibold">{item.title}</span>
                <ArrowRight size={16} style={{ color: branding.accentColor }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: New from creator */}
      {recent.length > 0 && (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            New from {branding.displayName}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {recent.map((item) => (
              <Link
                key={item.id}
                href="/content"
                className={cardRadius(branding, "snap-start shrink-0 w-44 p-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <span className="block truncate text-sm font-bold">{item.title}</span>
                <span className="mt-1 block text-xs" style={{ color: branding.textColor + "77" }}>
                  {item.type}
                </span>
                <span className="mt-2 block text-xs font-semibold" style={{ color: branding.accentColor }}>
                  {item.pricing_model === "free" || item.price === 0 ? "Free" : money(item.price, item.currency)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Updates from partners you follow */}
      {followedPartners.length > 0 && (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            From partners you follow
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {followedPartners.map((p) => (
              <a
                key={p.id}
                href={`/${branding.creatorUsername}/partner/${p.username}`}
                className={cardRadius(branding, "snap-start shrink-0 w-40 flex items-center gap-2.5 p-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold overflow-hidden"
                  style={{ backgroundColor: branding.accentColor + "22" }}>
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt={p.display_name} className="h-full w-full object-cover" />
                  ) : (
                    p.display_name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
                  )}
                </span>
                <span className="block truncate text-sm font-semibold">{p.display_name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Community */}
      <FanCommunitySection data={data} />

      {/* Section 5: Your activity */}
      {(hasPurchases || hasMembership || data.identity) && (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Your activity
          </h2>
          <div className="flex flex-col gap-2">
            {hasPurchases && (
              <Link
                href="/settings"
                className={cardRadius(branding, "flex items-center gap-3 px-4 py-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <CreditCard size={16} style={{ color: branding.accentColor }} />
                <span className="text-sm font-semibold">
                  {data.purchases.length} purchase{data.purchases.length !== 1 ? "s" : ""}
                </span>
                <ArrowRight size={14} className="ml-auto" style={{ color: branding.textColor + "55" }} />
              </Link>
            )}
            {hasMembership && (
              <div
                className={cardRadius(branding, "flex items-center gap-3 px-4 py-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <Tag size={16} style={{ color: branding.accentColor }} />
                <span className="text-sm font-semibold">Active member</span>
                <span className="ml-auto rounded-full px-2 py-0.5 text-micro font-bold uppercase"
                  style={{ backgroundColor: branding.accentColor + "22", color: branding.accentColor }}>
                  Member
                </span>
              </div>
            )}
            {!data.identity && (
              <Link
                href="/settings"
                className={cardRadius(branding, "flex items-center gap-3 px-4 py-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <CreditCard size={16} style={{ color: branding.textColor + "66" }} />
                <span className="text-sm font-semibold" style={{ color: branding.textColor + "88" }}>
                  View receipts
                </span>
                <ArrowRight size={14} className="ml-auto" style={{ color: branding.textColor + "55" }} />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Section 6: Upcoming */}
      {upcoming.length > 0 && (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Upcoming
          </h2>
          <div className="flex flex-col gap-2">
            {upcoming.map((item) => (
              <Link
                key={item.id}
                href="/content"
                className={cardRadius(branding, "flex items-center gap-3 px-4 py-3")}
                style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
              >
                <Clock size={16} style={{ color: branding.accentColor }} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.title}</span>
                  <span className="text-xs" style={{ color: branding.textColor + "77" }}>
                    {new Date(item.scheduled_publish_at!).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="rounded-full px-2 py-0.5 text-micro font-bold uppercase"
                  style={{ backgroundColor: branding.accentColor + "22", color: branding.accentColor }}>
                  Live
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Section 7: Announcements */}
      {announcementsChannel && (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Announcements
          </h2>
          <div
            className={cardRadius(branding, "p-4 text-center")}
            style={{ backgroundColor: branding.cardColor }}
          >
            <p className="text-sm" style={{ color: branding.textColor + "88" }}>
              {data.community?.isMember
                ? "Announcements from the community will appear here."
                : "Join the community to see announcements."}
            </p>
          </div>
        </section>
      )}

      <div className="pb-24" />
    </div>
  );
}
