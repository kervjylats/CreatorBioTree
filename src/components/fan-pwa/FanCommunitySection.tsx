/**
 * FanCommunitySection.tsx — Home-tab community section (messaging.md Part 3
 * decisions #3/#4/#5/#6). Shows community name/icon, join/leave button, and
 * channel list (open channels always visible; restricted channels only when
 * the fan has the right role). Each section self-hides when no community exists.
 */
"use client";

import { useState } from "react";
import { Hash, Lock, Megaphone, Users, UserPlus, UserMinus } from "lucide-react";
import type { FanShellData } from "./fanData";
import { cardRadius, contrastText } from "./themeStyles";

interface FanCommunitySectionProps {
  data: FanShellData;
}

export function FanCommunitySection({ data }: FanCommunitySectionProps) {
  const { branding, community } = data;
  const [joining, setJoining] = useState(false);
  const [member, setMember] = useState(community?.isMember ?? false);
  const [channels, setChannels] = useState(community?.channels ?? []);

  if (!community) return null;

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/chat/communities/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ community_id: community.id }),
      });
      if (res.ok) {
        setMember(true);
        // Re-fetch channels to get the full list after joining.
        const chRes = await fetch(`/api/chat/communities/${community.id}/channels`);
        const chData = await chRes.json();
        setChannels(chData.channels ?? []);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/chat/communities/${community.id}/leave`, {
        method: "POST",
      });
      if (res.ok) {
        setMember(false);
        setChannels([]);
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <section className="px-4 pt-4">
      <div className={cardRadius(branding, "p-4")} style={{ backgroundColor: branding.cardColor }}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: branding.accentColor + "22" }}>
            {community.icon ?? "🏠"}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold" style={{ color: branding.textColor }}>{community.name}</h3>
            <p className="text-xs" style={{ color: branding.textColor + "88" }}>
              {member ? `${channels.length} channel${channels.length !== 1 ? "s" : ""}` : "Community"}
            </p>
          </div>
          {member ? (
            <button
              type="button"
              onClick={handleLeave}
              disabled={joining}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: branding.textColor + "11", color: branding.textColor }}
            >
              <UserMinus size={13} /> Leave
            </button>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: branding.accentColor, color: contrastText(branding.accentColor) }}
            >
              <UserPlus size={13} /> {joining ? "Joining…" : "Join"}
            </button>
          )}
        </div>

        {/* Channel list (only visible when the fan is a member) */}
        {member && channels.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ backgroundColor: branding.backgroundColor + "88" }}
              >
                {ch.announcements_only ? (
                  <Megaphone size={14} style={{ color: branding.accentColor }} />
                ) : ch.restricted ? (
                  <Lock size={14} style={{ color: branding.textColor + "66" }} />
                ) : (
                  <Hash size={14} style={{ color: branding.textColor + "66" }} />
                )}
                <span className="text-xs font-medium" style={{ color: branding.textColor }}>
                  {ch.title}
                </span>
                {ch.myRole && ch.myRole !== "member" && (
                  <span className="ml-auto rounded-full px-1.5 py-0.5 text-micro font-bold uppercase"
                    style={{ backgroundColor: branding.accentColor + "22", color: branding.accentColor }}>
                    {ch.myRole}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Join-rule hint */}
        {!member && community.join_rule === "invite_only" && (
          <p className="mt-2 text-caption" style={{ color: branding.textColor + "66" }}>
            This community is invite-only.
          </p>
        )}
        {!member && community.join_rule === "fans_partners" && (
          <p className="mt-2 text-caption" style={{ color: branding.textColor + "66" }}>
            Follow this creator to join.
          </p>
        )}
      </div>
    </section>
  );
}
