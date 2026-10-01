/**
 * CreatorHeader — the shared profile header across Guest and Home tabs.
 * Layout: centered banner card (equal left/right padding) with DisplayName
 * centered at top and Bio centered at bottom inside the card. Below the
 * banner, an avatar + optional actions row (Email/Follow/Contact for Guest).
 * Edit-mode tap targets let creators customize each element via ElementPopover.
 */
"use client";

import type { ReactNode } from "react";
import type { CreatorBranding } from "@/lib/branding";
import type { EditModeTarget } from "@/components/fan-pwa/GuestPageContent";
import { getInitials } from "@/lib/fan-helpers";
import { contrastText } from "@/components/fan-pwa/themeStyles";

interface CreatorHeaderProps {
  branding: CreatorBranding;
  /** Follower + fan count for this creator (server-resolved). */
  /** Creator bio from the artists row (not part of the theme). */
  bio?: string | null;
  /** When true, each element is independently tappable. */
  editMode?: boolean;
  /** Fires when a header sub-element is tapped in edit mode. */
  onEdit?: (target: EditModeTarget) => void;
  /** Inline actions next to avatar (Email/Follow/Contact for Guest tab). */
  actions?: ReactNode;
}

/** Check whether an avatar URL is the platform default (not a real upload). */
function hasRealAvatar(url: string): boolean {
  return !url.includes("icon-192x192") && !url.includes("default-avatar");
}

const editClasses = "cursor-pointer ring-1 ring-transparent hover:ring-white/40 transition rounded-lg";

export function CreatorHeader({ branding, bio, editMode, onEdit, actions }: CreatorHeaderProps) {
  const hasBanner = Boolean(branding.bannerUrl);
  const hasAvatar = hasRealAvatar(branding.avatarUrl);
  const textOnAccent = contrastText(branding.accentColor);

  return (
    <header data-tl="CreatorHeader">
      {/* ─── SECTION 1: Banner card — centered, equal left/right padding ─── */}
      <div className="px-4 pt-3">
        <div
          className={`relative h-24 w-full overflow-hidden rounded-2xl border ${editMode ? editClasses : ""}`}
          style={{ borderColor: branding.textColor + "22" }}
          onClick={editMode ? () => onEdit?.({ kind: "banner" }) : undefined}
        >
          {/* Banner background — image or gradient */}
          {hasBanner ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${branding.bannerUrl})` }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${branding.accentColor}, ${branding.accentColor}AA)`,
              }}
            />
          )}

          {/* Gradient overlay for text readability over any image */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

          {/* DisplayName — centered top */}
          <div className="relative flex justify-center pt-4">
            <span
              className={`break-words text-base font-bold text-white drop-shadow-md line-clamp-2 text-center leading-snug ${editMode ? "cursor-pointer" : ""}`}
              onClick={editMode ? (e) => { e.stopPropagation(); onEdit?.({ kind: "header" }); } : undefined}
            >
              {branding.displayName}
            </span>
          </div>

          {/* Bio — centered bottom */}
          <div className="relative flex justify-center pb-3">
            {bio ? (
              <span
                className={`break-words text-xs text-white/80 drop-shadow-md leading-relaxed max-w-[80%] text-center line-clamp-2 ${editMode ? "cursor-pointer" : ""}`}
                onClick={editMode ? (e) => { e.stopPropagation(); onEdit?.({ kind: "bio" }); } : undefined}
              >
                {bio}
              </span>
            ) : editMode && hasBanner ? (
              <span
                className="text-[10px] italic text-white/50 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onEdit?.({ kind: "bio" }); }}
              >
                Add bio
              </span>
            ) : null}
          </div>

          {/* Edit hint when no banner */}
          {editMode && !hasBanner && (
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-xs text-white/40 pointer-events-none">
              Upload banner
            </span>
          )}
        </div>
      </div>

      {/* ─── SECTION 2: Avatar + Actions row — below banner, avatar overlaps ─── */}
      <div className="flex flex-wrap items-center gap-3 px-4 -mt-4 pb-3">
        {/* Avatar — shrink-0, overlaps banner bottom */}
        <div className="shrink-0">
          {hasAvatar ? (
            <div
              className={editMode ? editClasses : ""}
              onClick={editMode ? () => onEdit?.({ kind: "avatar" }) : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.avatarUrl}
                alt=""
                className="h-14 w-14 rounded-full border-3 object-cover shadow-md"
                style={{ borderColor: branding.cardColor }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border-3 text-lg font-bold shadow-md ${editMode ? editClasses : ""}`}
                style={{
                  borderColor: branding.cardColor,
                  backgroundColor: branding.accentColor,
                  color: textOnAccent,
                }}
                onClick={editMode ? () => onEdit?.({ kind: "avatar" }) : undefined}
              >
                {getInitials(branding.displayName)}
              </div>
              {editMode && (
                <span
                  className="mt-0.5 text-[9px] text-muted-foreground/50 cursor-pointer"
                  onClick={() => onEdit?.({ kind: "avatar" })}
                >
                  Add photo
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions — inline next to avatar (Email/Follow/Contact for Guest tab).
            flex-wrap lets Contact drop to a second line when the frame is
            narrower than a phone (My App preview at 229-300px); the row wraps
            the actions below the avatar when even the email row can't fit. */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
