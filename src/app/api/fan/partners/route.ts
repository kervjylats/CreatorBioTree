/** Fan-side partners API — returns a creator's active partners and the fan's followed partners for the Connect tab. Partner rows carry their gated spotlight hero (The Lineup, fan-shell.md Part 4c). */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getFanSession } from "@/lib/fanSession";
import { toHeroMedia, type HeroMedia } from "@/lib/spotlightHero";
import type { FanIdentity } from "@/components/fan-pwa/fanData";
import type { ContentItem } from "@/types";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: host } = await supabase
    .from("creators")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!host) {
    return NextResponse.json({ partners: [], followed: [] });
  }

  const { data: active } = await supabase
    .from("partnerships")
    .select("*")
    .eq("status", "active")
    .or(`creator_a.eq.${host.id},creator_b.eq.${host.id}`);

  const partnerIds = (active ?? []).map((p) =>
    p.creator_a === host.id ? p.creator_b : p.creator_a,
  );

  let partners: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    tagline: string | null;
    featured_item: HeroMedia | null;
  }[] = [];
  if (partnerIds.length > 0) {
    const { data: partnerCreators } = await supabase
      .from("creators")
      .select("id, username, display_name, avatar_url, tagline")
      .in("id", partnerIds);
    partners = (partnerCreators ?? []).map((p) => ({ ...p, featured_item: null }));
  }

  // Resolve the fan's followed partners (fan_follows table).
  const session = await getFanSession(req.cookies, supabase, host.id);
  let followedIds: string[] = [];
  // Per-fan gating for heroes (fan-shell.md Part 2 — same computeItemGate the
  // cards use): identity + completed purchases under the session account.
  let identity: FanIdentity | null = null;
  let purchased = new Set<string>();
  if (session) {
    const { data: account } = await supabase
      .from("fan_accounts")
      .select("id, email, password_hash")
      .eq("id", session.fanId)
      .maybeSingle();
    if (account) {
      identity = {
        fanId: account.id as string,
        email: account.email as string,
        hasPassword: Boolean((account as { password_hash?: string | null }).password_hash),
      };
      const { data: rows } = await supabase
        .from("fan_purchases")
        .select("content_item_id")
        .eq("fan_id", account.id)
        .eq("status", "completed");
      purchased = new Set((rows ?? []).map((r) => (r as { content_item_id: string }).content_item_id));
    }
    const { data: follows } = await supabase
      .from("fan_follows")
      .select("partner_id")
      .eq("fan_id", session.fanId)
      .eq("host_creator_id", host.id);
    followedIds = (follows ?? []).map((f) => (f as { partner_id: string }).partner_id);
  }

  const followed = partners.filter((p) => followedIds.includes(p.id));

  // Compute deal weights for billboard rotation — partners with active
  // affiliate deals get 2× weight (invisible to fans, spec §7).
  const { data: deals } = await supabase
    .from("affiliate_deals")
    .select("partner_id")
    .eq("creator_id", host.id)
    .eq("status", "active");

  const dealPartnerIds = new Set((deals ?? []).map((d) => (d as { partner_id: string }).partner_id));
  const partnerWeights = partners.map((p) => ({
    ...p,
    dealWeight: dealPartnerIds.has(p.id) ? 2 : 1,
  }));

  // Lineup heroes (fan-shell.md Part 4c): each partner's published featured
  // item, gated per fan — strangers get covers on paid media (file_url
  // stripped, 2026-10-01 audit law); null = avatar-card slot instead.
  if (partners.length > 0) {
    const { data: featuredRows } = await supabase
      .from("content_items")
      .select("*")
      .in("creator_id", partners.map((p) => p.id))
      .eq("is_featured", true)
      .eq("is_published", true);
    const byCreator = new Map<string, HeroMedia | null>();
    for (const row of (featuredRows ?? []) as ContentItem[]) {
      if (!byCreator.has(row.creator_id)) {
        byCreator.set(row.creator_id, toHeroMedia(row, identity, purchased));
      }
    }
    for (const p of partnerWeights) {
      p.featured_item = byCreator.get(p.id) ?? null;
    }
  }

  return NextResponse.json({ partners: partnerWeights, followed });
}
