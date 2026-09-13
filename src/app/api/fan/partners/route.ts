/** Fan-side partners API — returns a creator's active partners and the fan's followed partners for the Connect tab. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getFanSession } from "@/lib/fanSession";

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
  }[] = [];
  if (partnerIds.length > 0) {
    const { data: partnerCreators } = await supabase
      .from("creators")
      .select("id, username, display_name, avatar_url, tagline")
      .in("id", partnerIds);
    partners = partnerCreators ?? [];
  }

  // Resolve the fan's followed partners (fan_follows table).
  const session = await getFanSession(req.cookies, supabase);
  let followedIds: string[] = [];
  if (session) {
    const { data: follows } = await supabase
      .from("fan_follows")
      .select("partner_id")
      .eq("fan_id", session.fanId)
      .eq("host_creator_id", host.id);
    followedIds = (follows ?? []).map((f) => f.partner_id);
  }

  const followed = partners.filter((p) => followedIds.includes(p.id));

  // Compute deal weights for billboard rotation — partners with active
  // affiliate deals get 2× weight (invisible to fans, spec §7).
  const { data: deals } = await supabase
    .from("affiliate_deals")
    .select("partner_id")
    .eq("creator_id", host.id)
    .eq("status", "active");

  const dealPartnerIds = new Set((deals ?? []).map((d) => d.partner_id));
  const partnerWeights = partners.map((p) => ({
    ...p,
    dealWeight: dealPartnerIds.has(p.id) ? 2 : 1,
  }));

  return NextResponse.json({ partners: partnerWeights, followed });
}
