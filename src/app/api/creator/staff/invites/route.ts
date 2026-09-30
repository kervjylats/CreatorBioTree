/**
 * GET /api/creator/staff/invites — list pending invites for the authenticated
 * creator (staff.md Part 4).
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
      .from("creator_staff_invites")
      .select("*")
      .eq("creator_id", user.id);
    return NextResponse.json({ invites: myInvites ?? [] });
  } catch (err) {
    console.error("[staff/invites] GET:", err);
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}
