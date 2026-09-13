/**
 * FollowBox.tsx — the email-only Follow gate (fan-shell.md Part 1 Layer 1b).
 * An email in this box creates a no-password fan_accounts row + fan_session
 * cookie → the visitor becomes a recognized Follower: personalized guest page,
 * "Following ✓", gates unlocked — but never the 4-tab app. Setting a password
 * later (via FanAuthModal) upgrades Follower → Fan.
 *
 * Three size tiers:
 * - inline: ultra-compact single row (fits next to avatar in Guest header)
 * - compact: small horizontal (used in Content tab follow bar)
 * - default: full-size with wrapping
 */
"use client";

import { useState } from "react";
import { Check, Heart } from "lucide-react";
import { toast } from "sonner";
import type { CreatorBranding } from "@/lib/branding";
import { buttonClass, buttonShape, cardRadius, contrastText } from "./themeStyles";

interface FollowBoxProps {
  creatorUsername: string;
  branding: CreatorBranding;
  alreadyFollowing?: boolean;
  viewOnly?: boolean;
  compact?: boolean;
  /** Ultra-compact single row — fits next to avatar in the Guest header. */
  inline?: boolean;
}

export function FollowBox({ creatorUsername, branding, alreadyFollowing, viewOnly, compact, inline }: FollowBoxProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState(alreadyFollowing ?? false);
  const accent = branding.accentColor;

  if (viewOnly) {
    return (
      <div
        className={`flex items-center gap-1 font-semibold ${
          inline ? "text-[11px]" : compact ? "text-xs" : "text-sm"
        }`}
        style={{ color: accent }}
      >
        <Check size={inline ? 10 : compact ? 14 : 16} /> Following
      </div>
    );
  }

  if (followed) {
    return (
      <div
        className={`${buttonShape(branding)} flex items-center gap-1 font-semibold ${
          inline
            ? "px-2 py-1 text-[11px]"
            : compact
              ? "px-2.5 py-1 text-xs"
              : "px-4 py-2 text-sm"
        }`}
        style={{ backgroundColor: accent + "CC", color: contrastText(accent) }}
      >
        <Check size={inline ? 10 : compact ? 14 : 16} /> Following
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/fan/follow-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), creator_username: creatorUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(typeof data?.error === "string" ? data.error : "Couldn't follow — try again.");
        return;
      }
      setFollowed(true);
      toast("Following — thanks for joining!");
      window.setTimeout(() => window.location.reload(), 600);
    } catch {
      toast("Couldn't follow — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-1.5 ${
        inline
          ? "items-center"
          : compact
            ? "flex-row"
            : "w-full flex-col gap-2 sm:flex-row"
      }`}
    >
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`${cardRadius(branding, "min-w-0 border outline-none")} ${
          inline
            ? "w-24 px-2 py-1 text-[11px]"
            : compact
              ? "flex-1 px-2.5 py-1.5 text-xs"
              : "flex-1 px-4 py-2.5 text-sm"
        }`}
        style={{ borderColor: branding.textColor + "33", color: branding.textColor, backgroundColor: branding.cardColor }}
      />
      <button
        type="submit"
        disabled={loading}
        {...buttonClass(branding, inline ? "px-2 py-1 text-[11px]" : compact ? "px-2.5 py-1.5 text-xs" : "")}
      >
        <Heart size={inline ? 10 : compact ? 12 : 14} /> {loading ? "…" : "Follow"}
      </button>
    </form>
  );
}
