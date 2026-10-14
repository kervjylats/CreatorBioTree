/**
 * CreatorBillboardModal — Modal A (network.md §1, 2026-10-07): clicking a
 * Discover card (collab list or search result) opens this center modal over the
 * dimmed Network screen instead of navigating away. Fetches the target's full
 * billboard via GET /api/discover/creators/[id] (discoverable-only, 404 if
 * hidden), renders it with Connect (same state machine as the card — owned by
 * NetworkPage) + Visit. Close → back to the exact list position.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/shared/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";
import { fetchJson } from "@/lib/fetchJson";
import type { CreatorSearchResult } from "@/hooks/useCreatorSearch";
import type { HeroMedia } from "@/lib/spotlightHero";
import { BillboardHero } from "./BillboardHero";

export interface BillboardDetail {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string;
  tags: string[];
  collab_style: string;
  primary_field: string;
  bio: string;
  rate_card: { post: string; story: string; video: string };
  media_kit_message: string;
  is_featured: boolean | null;
  open_to_collab: boolean;
  featured_item: HeroMedia | null;
}

interface CreatorBillboardModalProps {
  /** Seed from the clicked card (id/username/name/tagline) — paints instantly. */
  creator: CreatorSearchResult;
  connectState: string;
  onConnect: (creator: CreatorSearchResult) => void;
  onClose: () => void;
}

export function CreatorBillboardModal({
  creator,
  connectState,
  onConnect,
  onClose,
}: CreatorBillboardModalProps) {
  const [detail, setDetail] = useState<BillboardDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchJson<{ creator: BillboardDetail }>(`/api/discover/creators/${creator.id}`)
      .then((d) => {
        if (alive) setDetail(d.creator);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [creator.id]);

  const openToCollab = (detail?.open_to_collab ?? creator.open_to_collab) !== false;
  const connectLabel =
    connectState === "loading"
      ? "…"
      : connectState === "requested"
        ? "Requested"
        : connectState === "connected"
          ? "Connected"
          : "Connect";

  const rate = detail?.rate_card;
  const rateBits = [
    rate?.post ? `Post ${rate.post}` : "",
    rate?.story ? `Story ${rate.story}` : "",
    rate?.video ? `Video ${rate.video}` : "",
  ].filter(Boolean);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8 text-left">
            <span className="truncate">{detail?.display_name || creator.display_name}</span>
            {(detail?.is_featured ?? creator.is_featured) && (
              <Badge variant="secondary" className="shrink-0 text-micro">Featured</Badge>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            @{detail?.username || creator.username}
          </p>
        </DialogHeader>

        {failed ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            This billboard isn&apos;t available right now.
          </p>
        ) : !detail ? (
          <div className="flex justify-center py-8">
            <Spinner size={20} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero (network.md §2, 2026-10-14): their spotlight as an LED
                screen + eyebrow/headline overlay. The body tagline hides while
                the hero shows it — no duplicated lines. */}
            <BillboardHero
              media={detail.featured_item}
              eyebrow={detail.primary_field || undefined}
              headline={detail.tagline || undefined}
            />
            <div className="flex items-start gap-3">
              <Avatar src={detail.avatar_url} name={detail.display_name} />
              <div className="min-w-0 flex-1">
                {detail.tagline && !detail.featured_item && (
                  <p className="text-sm font-medium text-foreground">{detail.tagline}</p>
                )}
                {detail.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {detail.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-micro">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {detail.collab_style && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Collab style:</span>{" "}
                {detail.collab_style}
              </p>
            )}
            {detail.bio && (
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {detail.bio}
              </p>
            )}
            {rateBits.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Rate card:</span>{" "}
                {rateBits.join(" · ")}
              </p>
            )}
            {detail.media_kit_message && (
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {detail.media_kit_message}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                variant={connectState === "connected" ? "outline" : "default"}
                disabled={!openToCollab || ["loading", "requested", "connected"].includes(connectState)}
                onClick={() => onConnect(creator)}
              >
                {openToCollab ? connectLabel : "Not open to collabs"}
              </Button>
              <Link
                href={`/${detail.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
              >
                Visit <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
