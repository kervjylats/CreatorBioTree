/**
 * GET /api/creator/team/invites — list pending invites for the authenticated
 * creator (team.md Part 4).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: myInvites } = await supabase
      .from("creator_team_invites")
      .select("*")
      .eq("creator_id", user.id);
    return NextResponse.json({ invites: myInvites ?? [] });
  } catch (err) {
    console.error("[team/invites] GET:", err);
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}
