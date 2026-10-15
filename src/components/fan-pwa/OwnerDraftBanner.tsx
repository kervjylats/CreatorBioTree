/**
 * OwnerDraftBanner — owner-only "unpublished changes" strip on the LIVE guest
 * page (founder 2026-10-15: he edited in the Playground, opened his live page
 * and couldn't tell Draft from Live). Mounted only when the viewer IS the
 * owner (Screen checks session id vs creator). Verdict is content-based: the
 * localStorage draft is merged over the server snapshot with the SAME helpers
 * the hook uses — a pristine auto-saved draft must never cry wolf. Fans never
 * see it; Deploy clears the draft key and the banner goes with it.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { creatorToDraft, mergeRestoredDraft } from "@/hooks/usePlaygroundForm";
import type { Creator } from "@/types";

interface OwnerDraftBannerProps {
  creatorId: string;
}

export function OwnerDraftBanner({ creatorId }: OwnerDraftBannerProps) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    try {
      const raw = localStorage.getItem(`playground_draft_${creatorId}`);
      if (!raw) return; // fast path — no local draft at all
      void (async () => {
        try {
          const res = await fetch("/api/creator/playground");
          if (!res.ok) return;
          const json = (await res.json()) as { creator?: Creator };
          if (!alive || !json.creator) return;
          const server = creatorToDraft(json.creator);
          const merged = mergeRestoredDraft(JSON.parse(raw), server);
          setPending(JSON.stringify(merged) !== JSON.stringify(server));
        } catch {
          /* corrupted draft or offline — stay quiet rather than cry wolf */
        }
      })();
    } catch {
      /* storage blocked — nothing to report */
    }
    return () => {
      alive = false;
    };
  }, [creatorId]);

  if (!pending) return null;

  return (
    <div
      data-tl="OwnerDraftBanner"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-amber-600 bg-amber-500 px-4 py-2 text-amber-950"
    >
      <span className="text-xs font-semibold">
        🟡 Unpublished changes — this is your live page; fans don&apos;t see these edits yet.
      </span>
      <Link
        href="/dashboard/playground"
        className="min-h-9 shrink-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
      >
        Open Playground
      </Link>
    </div>
  );
}
