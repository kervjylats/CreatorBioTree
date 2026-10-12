/**
 * BillboardPreview — the Network rail MIRROR of how the creator's billboard
 * looks to other creators in Discover. Displays avatar, display name,
 * username, tagline, tags as chips, collab style, and the status-only
 * Open/Closed to collabs badge (the switch lives in the Discover section's
 * card). Two pencils: header ✏️ → Playground's Billboard view (design, Part
 * 1d) · name-row ✏️ → identity gateway #2 (settings.md Part 13 → Settings).
 */
"use client";

import { useState } from "react";
import { CircleCheck, CircleX, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/shared/Avatar";
import { ProfileEditDialog } from "@/components/settings/ProfileEditDialog";
import { LABEL_CLASS } from "@/lib/ui-constants";

interface BillboardPreviewProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  tagline: string;
  tags: string[];
  collabStyle: string;
  openToCollab: boolean;
  /** Header ✏️ → Playground's Billboard view (design edit — always visible
   *  since 2026-10-09; distinct from the name-row ✏️, which is identity). */
  onEditBillboard: () => void;
}

export function BillboardPreview({
  displayName,
  username,
  avatarUrl,
  tagline,
  tags,
  collabStyle,
  openToCollab,
  onEditBillboard,
}: BillboardPreviewProps) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1">
          <p className={`${LABEL_CLASS} truncate`}>
            My Billboard
          </p>
          <button
            type="button"
            title="Edit billboard"
            aria-label="Edit billboard"
            onClick={onEditBillboard}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil size={14} />
          </button>
        </span>
        {/* Status badge only — no click; the toggle lives in the Discover
            section's card (founder decision 2026-10-09: one toggle home).
            Relabelled with the switch removal: "In search" would be
            permanently true, so it mirrors open_to_collab instead. */}
        <span
          className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 text-micro font-semibold ${
            openToCollab ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          }`}
        >
          {openToCollab ? <CircleCheck size={10} /> : <CircleX size={10} />}
          {openToCollab ? "Open to collabs" : "Closed to collabs"}
        </span>
      </div>

      {/* Identity row — the name-row ✏️ = identity gateway #2 (identity →
          Settings; the header ✏️ above = design → Playground Billboard view,
          playground.md Part 1d) */}
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl} name={displayName} size="h-12 w-12" textClass="text-sm" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground">
            {displayName || "Your Name"}
          </span>
          <span className="text-xs text-muted-foreground">@{username}</span>
        </div>
        <button
          type="button"
          title="Edit name & photo"
          aria-label="Edit name and photo"
          onClick={() => setProfileDialogOpen(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Pencil size={14} />
        </button>
        <ProfileEditDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
      </div>

      {/* Tagline */}
      {tagline && (
        <p className="text-xs text-muted-foreground/70 italic">
          &ldquo;{tagline}&rdquo;
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-foreground/10 px-2 py-0.5 text-micro font-semibold text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Collab style */}
      {collabStyle && (
        <p className="text-caption text-muted-foreground line-clamp-2">
          {collabStyle}
        </p>
      )}

      {/* Empty state */}
      {!tagline && tags.length === 0 && !collabStyle && (
        <p className="text-caption text-muted-foreground/50 italic">
          Add a tagline, tags, or collab style to personalize your billboard.
        </p>
      )}
    </Card>
  );
}
