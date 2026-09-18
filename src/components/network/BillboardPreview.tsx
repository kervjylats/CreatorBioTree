/**
 * BillboardPreview — live preview card showing how the creator's billboard
 * looks to other creators in the Network search/discovery. Displays avatar,
 * display name, username, tagline, tags as chips, collab style, and
 * visibility status badge. Display-only; edits happen in BillboardEditor.
 */
"use client";

import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BillboardPreviewProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  tagline: string;
  tags: string[];
  collabStyle: string;
  isVisible: boolean;
  onToggleVisibility?: () => void;
}

export function BillboardPreview({
  displayName,
  username,
  avatarUrl,
  tagline,
  tags,
  collabStyle,
  isVisible,
  onToggleVisibility,
}: BillboardPreviewProps) {
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          My Billboard
        </p>
        <button
          type="button"
          onClick={onToggleVisibility}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-semibold transition-colors ${
            isVisible
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
          {isVisible ? "Visible" : "Hidden"}
        </button>
      </div>

      {/* Identity row */}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold text-foreground overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
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
