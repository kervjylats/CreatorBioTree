/**
 * fanShellData.ts — server-only resolver for the fan shell. Builds one
 * FanShellData per request: creator row → branding → published items →
 * fan_session identity (Fan vs Follower vs visitor) → completed purchases →
 * Connect-tab artist links. Screens (guest/home/content/connect/settings)
 * call this; presentation components stay dumb.
 */
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveBranding } from "@/lib/branding";
import { getFanSession } from "@/lib/fanSession";
import type { Creator, FanPurchase } from "@/types";
import type { FanIdentity, FanShellData } from "@/components/fan-pwa/fanData";

/** Resolve the full fan-shell data for a Link Address. Returns null when the creator doesn't exist. */
export async function resolveFanShellData(username: string): Promise<FanShellData | null> {
  const supabase = createServiceClient();

  const { data: creator } = await supabase
    .from("creators")
    .select(
      "id, username, display_name, bio, avatar_url, banner_url, theme_id, custom_theme, connect_empty_text, social_links, ai_summary",
    )
    .eq("username", username)
    .maybeSingle();

  if (!creator) return null;
  const typedCreator = creator as Pick<
    Creator,
    | "id"
    | "username"
    | "display_name"
    | "bio"
    | "avatar_url"
    | "banner_url"
    | "theme_id"
    | "custom_theme"
    | "connect_empty_text"
    | "social_links"
    | "ai_summary"
  >;

  const cookieStore = await cookies();
  const session = await getFanSession(cookieStore, supabase);

  // Identity: Fan (password set) vs Follower (no password) vs visitor (no session).
  let identity: FanIdentity | null = null;
  if (session && session.creatorId === creator.id) {
    const { data: account } = await supabase
      .from("fan_accounts")
      .select("id, email, password_hash")
      .eq("id", session.fanId)
      .maybeSingle();
    if (account) {
      identity = {
        fanId: account.id,
        email: account.email,
        hasPassword: Boolean(account.password_hash),
      };
    }
  }

  // Receipts are email-keyed: the session row IS the account row (find-or-create
  // keeps ids stable), so fanId is the right key for completed purchases.
  let purchases: FanPurchase[] = [];
  if (identity) {
    const { data: rows } = await supabase
      .from("fan_purchases")
      .select("*")
      .eq("fan_id", identity.fanId)
      .eq("status", "completed")
      .order("purchased_at", { ascending: false });
    purchases = (rows ?? []) as FanPurchase[];
  }

  const { data: items } = await supabase
    .from("content_items")
    .select("*")
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  const artistLinks = Object.entries((typedCreator.social_links ?? {}) as Record<string, string>)
    .filter(([, url]) => Boolean(url))
    .map(([label, url]) => ({ label, url }));

  // ── Community (messaging.md Part 3) ──────────────────────────────────────
  let community: FanShellData["community"] = null;
  const { data: commRow } = await supabase
    .from("communities")
    .select("id, name, icon, join_rule")
    .eq("creator_id", creator.id)
    .maybeSingle();

  if (commRow) {
    // Fetch ALL channels for the community.
    const { data: allChannels } = await supabase
      .from("conversations")
      .select("id, title, announcements_only, restricted")
      .eq("community_id", commRow.id)
      .eq("type", "community_chat");

    let isMember = false;
    const memberRoles: Record<string, string> = {};
    if (identity) {
      const channelIds = (allChannels ?? []).map((c) => c.id as string);
      if (channelIds.length > 0) {
        const { data: memberships } = await supabase
          .from("conversation_members")
          .select("conversation_id, role")
          .eq("participant_key", identity.fanId)
          .in("conversation_id", channelIds);
        for (const m of memberships ?? []) {
          memberRoles[m.conversation_id as string] = m.role as string;
          isMember = true;
        }
      }
    }

    const channels = (allChannels ?? [])
      .filter((ch) => {
        if (!ch.restricted) return true;
        return memberRoles[ch.id as string] !== undefined;
      })
      .map((ch) => ({
        id: ch.id as string,
        title: ch.title as string,
        announcements_only: ch.announcements_only as boolean,
        restricted: ch.restricted as boolean,
        myRole: memberRoles[ch.id as string] ?? null,
      }));

    community = {
      id: commRow.id as string,
      name: commRow.name as string,
      icon: (commRow.icon as string) ?? null,
      join_rule: commRow.join_rule as string,
      isMember,
      channels,
    };
  }

  return {
    branding: resolveBranding(typedCreator as Creator),
    username: creator.username,
    bio: typedCreator.bio,
    items: (items ?? []) as FanShellData["items"],
    identity,
    purchases,
    connectEmptyText: typedCreator.connect_empty_text || "",
    artistLinks,
    community,
  };
}