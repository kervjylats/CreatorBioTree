/**
 * POST /api/creator/team/invite — create a team invite row with a 7-day
 * expiry token (team.md Part 2). Owner only.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email, role, permissions } = await request.json();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("creator_team_invites")
      .select("id")
      .eq("creator_id", user.id)
      .eq("email", email)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Invite already pending for this email" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invite } = await supabase
      .from("creator_team_invites")
      .insert({
        creator_id: user.id,
        email,
        role: role ?? "member",
        permissions: permissions ?? {},
        invite_code: crypto.randomUUID(),
        used_by: null,
        expires_at: expiresAt,
        created_at: now,
      })
      .select()
      .single();

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    console.error("[team/invite] POST:", err);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
