/** PageViewTracker — fire-and-forget pageview ping (analytics; never blocks rendering). */
"use client";

import { useEffect } from "react";

interface PageViewTrackerProps {
  creatorId: string;
  contentItemId?: string | null;
}

/** Posts a pageview for the creator on mount (and when the item changes). Renders nothing. */
export function PageViewTracker({ creatorId, contentItemId = null }: PageViewTrackerProps) {
  useEffect(() => {
    fetch("/api/creator/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator_id: creatorId, content_item_id: contentItemId }),
    }).catch(() => {});
  }, [creatorId, contentItemId]);
  return null;
}