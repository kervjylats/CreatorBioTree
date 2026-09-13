/**
 * POST /api/fan/follow — toggle follow/unfollow for a partner creator.
 * Persists to `fan_follows` (fan-shell.md Part 4c + partner-page.md Part 2).
 * DELETE — also supported (unfollow).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getFanSession } from "@/lib/fanSession";
import { rateLimiter } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = await rateLimiter.check(`follow:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const { partner_username, current_creator_username } = await req.json();
  const supabase = createServiceClient();

  const { data: partner } = await supabase
    .from("creators")
    .select("id")
    .eq("username", partner_username?.toLowerCase())
    .maybeSingle();
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const { data: hostCreator } = await supabase
    .from("creators")
    .select("id")
    .eq("username", current_creator_username?.toLowerCase())
    .maybeSingle();
  if (!hostCreator) return NextResponse.json({ error: "Current creator not found" }, { status: 404 });

  const session = await getFanSession(req.cookies, supabase);
  if (!session || session.creatorId !== hostCreator.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("fan_follows")
    .select("id")
    .eq("fan_id", session.fanId)
    .eq("partner_id", partner.id)
    .eq("host_creator_id", hostCreator.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("fan_follows").delete().eq("id", existing.id);
    return NextResponse.json({ followed: false });
  }

  await supabase.from("fan_follows").insert({
    fan_id: session.fanId,
    partner_id: partner.id,
    host_creator_id: hostCreator.id,
    created_at: new Date().toISOString(),
  });
  return NextResponse.json({ followed: true });
}

export async function DELETE(req: NextRequest) {
  const { partner_username, current_creator_username } = await req.json();
  const supabase = createServiceClient();

  const { data: partner } = await supabase
    .from("creators")
    .select("id")
    .eq("username", partner_username?.toLowerCase())
    .maybeSingle();
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const { data: hostCreator } = await supabase
    .from("creators")
    .select("id")
    .eq("username", current_creator_username?.toLowerCase())
    .maybeSingle();
  if (!hostCreator) return NextResponse.json({ error: "Current creator not found" }, { status: 404 });

  const session = await getFanSession(req.cookies, supabase);
  if (!session || session.creatorId !== hostCreator.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("fan_follows")
    .select("id")
    .eq("fan_id", session.fanId)
    .eq("partner_id", partner.id)
    .eq("host_creator_id", hostCreator.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("fan_follows").delete().eq("id", existing.id);
  }
  return NextResponse.json({ followed: false });
}
