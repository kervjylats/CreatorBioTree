/**
 * GET /api/creator/staff/activity — audit log for staff actions (staff.md Part 5).
 * Returns empty array in mock; owner only.
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

    const { data: myActivity } = await supabase
      .from("creator_staff_activity")
      .select("*")
      .eq("creator_id", user.id);
    return NextResponse.json({ activity: myActivity ?? [] });
  } catch (err) {
    console.error("[staff/activity] GET:", err);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
