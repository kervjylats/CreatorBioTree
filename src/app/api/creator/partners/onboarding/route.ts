/**
 * POST /api/creator/partners/onboarding — post-signup auto-connect: validate
 * invite code, mark used, create partnerships row (partnership.md Part 2).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    const { data: invite } = await supabase
      .from("partner_invites")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();
    if (!invite) {
      return NextResponse.json({ error: "Invite invalid or expired" }, { status: 404 });
    }
    if (invite.used_by) {
      return NextResponse.json({ error: "Invite already used" }, { status: 409 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite invalid or expired" }, { status: 410 });
    }
    if (invite.from_creator_id === user.id) {
      return NextResponse.json({ error: "Cannot accept your own invite" }, { status: 400 });
    }

    await supabase
      .from("partner_invites")
      .update({ used_by: user.id })
      .eq("id", invite.id);

    const { data: alreadyConnected } = await supabase
      .from("partnerships")
      .select("id")
      .eq("status", "active")
      .or(`and(creator_a.eq.${invite.from_creator_id},creator_b.eq.${user.id}),and(creator_a.eq.${user.id},creator_b.eq.${invite.from_creator_id})`)
      .maybeSingle();

    if (!alreadyConnected) {
      const now = new Date().toISOString();
      await supabase.from("partnerships").insert({
        creator_a: invite.from_creator_id,
        creator_b: user.id,
        status: "active",
        source: "invited",
        commission_pct: 0,
        notes: null,
        created_at: now,
        updated_at: now,
      });
    }

    const { data: partner } = await supabase
      .from("creators")
      .select("id, username, display_name, avatar_url")
      .eq("id", invite.from_creator_id)
      .maybeSingle();

    return NextResponse.json({ ok: true, partner });
  } catch (err) {
    console.error("[partners/onboarding] POST:", err);
    return NextResponse.json({ error: "Failed to process invite" }, { status: 500 });
  }
}
