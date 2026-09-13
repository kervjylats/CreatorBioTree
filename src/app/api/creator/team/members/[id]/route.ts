/**
 * PATCH/DELETE /api/creator/team/members/[id] — update permission toggles or
 * remove a team member (team.md Part 4). Owner only, cannot remove self.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { permissions } = await request.json();
    if (!permissions || typeof permissions !== "object") {
      return NextResponse.json({ error: "Permissions object required" }, { status: 400 });
    }

    const { data: member } = await supabase
      .from("creator_team_members")
      .select("*")
      .eq("id", id)
      .eq("creator_id", user.id)
      .maybeSingle();
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { data: updated } = await supabase
      .from("creator_team_members")
      .update({ permissions, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    return NextResponse.json({ ok: true, member: updated });
  } catch (err) {
    console.error("[team/members] PATCH:", err);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data: member } = await supabase
      .from("creator_team_members")
      .select("user_id")
      .eq("id", id)
      .eq("creator_id", user.id)
      .maybeSingle();
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.user_id === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await supabase.from("creator_team_members").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[team/members] DELETE:", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
