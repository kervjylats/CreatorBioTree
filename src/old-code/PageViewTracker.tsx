/** TODO: Add purpose docstring. */
"use client";

import { useEffect } from "react";

interface PageViewTrackerProps {
  creatorId: string;
}

export function PageViewTracker({ creatorId }: PageViewTrackerProps) {
  useEffect(() => {
    // Fire and forget — don't block page render
    fetch("/api/creator/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator_id: creatorId }),
    }).catch(() => {});
  }, [creatorId]);

  return null; // renders nothing
}
