/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";

interface FollowButtonProps {
  partnerUsername: string;
  currentCreatorUsername: string;
  accentColor: string;
}

export function FollowButton({ partnerUsername, currentCreatorUsername, accentColor }: FollowButtonProps) {
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (loading || followed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/fan/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_username: partnerUsername, current_creator_username: currentCreatorUsername }),
      });
      if (res.ok) setFollowed(true);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading || followed}
      className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: followed ? undefined : accentColor }}
    >
      {loading ? "..." : followed ? "✓ Following" : `Follow @${partnerUsername}`}
    </button>
  );
}
