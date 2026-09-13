/**
 * GET /api/creator/team/contexts — list managed dashboards for the context
 * switcher (team.md Part 3). Returns own context plus any team memberships.
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

    const { data: me } = await supabase
      .from("creators")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const contexts = [
      {
        id: user.id,
        name: me?.display_name ?? "My dashboard",
        role: "owner",
      },
    ];

    const { data: myRoles } = await supabase
      .from("creator_team_members")
      .select("creator_id, role")
      .eq("user_id", user.id);

    for (const role of myRoles ?? []) {
      const { data: creator } = await supabase
        .from("creators")
        .select("id, display_name")
        .eq("id", role.creator_id)
        .maybeSingle();
      contexts.push({
        id: role.creator_id,
        name: creator?.display_name ?? "Managed dashboard",
        role: role.role,
      });
    }

    return NextResponse.json({ contexts });
  } catch (err) {
    console.error("[team/contexts] GET:", err);
    return NextResponse.json({ error: "Failed to fetch contexts" }, { status: 500 });
  }
}
