/**
 * GET /api/creator/team/members — list team members with roles for the
 * authenticated creator (team.md Part 4).
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

    const { data: myMembers } = await supabase
      .from("creator_team_members")
      .select("*")
      .eq("creator_id", user.id);

    const enriched = await Promise.all(
      (myMembers ?? []).map(async (m) => {
        const { data: account } = await supabase
          .from("creators")
          .select("id, display_name, email, avatar_url")
          .eq("id", m.user_id)
          .maybeSingle();
        return { ...m, user: account };
      }),
    );

    return NextResponse.json({ members: enriched });
  } catch (err) {
    console.error("[team/members] GET:", err);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
