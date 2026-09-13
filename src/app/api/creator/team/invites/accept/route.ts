/**
 * POST /api/creator/team/invites/accept — validate invite code, create
 * creator_team_members row, mark invite accepted (team.md Part 2 step 5-6).
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
      .from("creator_team_invites")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.used_by) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 409 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    await supabase
      .from("creator_team_invites")
      .update({ used_by: user.id })
      .eq("id", invite.id);

    const now = new Date().toISOString();
    const { data: member } = await supabase
      .from("creator_team_members")
      .insert({
        creator_id: invite.creator_id,
        user_id: user.id,
        role: invite.role,
        permissions: invite.permissions,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    return NextResponse.json({ ok: true, member });
  } catch (err) {
    console.error("[team/invites/accept] POST:", err);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
