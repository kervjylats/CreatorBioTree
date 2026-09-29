/**
 * BillboardPreview — live preview card showing how the creator's billboard
 * looks to other creators in the Network search/discovery. Displays avatar,
 * display name, username, tagline, tags as chips, collab style, and
 * visibility status badge. Display-only; edits happen in BillboardEditor.
 */
"use client";

import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getInitials } from "@/lib/fan-helpers";
import { Avatar } from "@/components/shared/Avatar";
import { LABEL_CLASS } from "@/lib/ui-constants";

interface BillboardPreviewProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  tagline: string;
  tags: string[];
  collabStyle: string;
  showInSearch: boolean;
  onToggleVisibility?: () => void;
}

export function BillboardPreview({
  displayName,
  username,
  avatarUrl,
  tagline,
  tags,
  collabStyle,
  showInSearch,
  onToggleVisibility,
}: BillboardPreviewProps) {
  const initials = getInitials(displayName);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className={LABEL_CLASS}>
          My Billboard
        </p>
        <button
          type="button"
          onClick={onToggleVisibility}
          className={`inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-micro font-semibold transition-colors ${
            showInSearch
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {showInSearch ? <Eye size={10} /> : <EyeOff size={10} />}
          {showInSearch ? "In search" : "Hidden"}
        </button>
      </div>

      {/* Identity row */}
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl} name={displayName} size="h-12 w-12" textClass="text-sm" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground">
            {displayName || "Your Name"}
          </span>
          <span className="text-xs text-muted-foreground">@{username}</span>
        </div>
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
