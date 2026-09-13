/**
 * GET /api/creator/relationships — My Peeps umbrella: returns counts of
 * partners, fans, and staff for the authenticated creator (relationships.md Part 1).
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

    const { count: partners } = await supabase
      .from("partnerships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .or(`creator_a.eq.${user.id},creator_b.eq.${user.id}`);

    const { count: fans } = await supabase
      .from("fan_accounts")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id);

    const { count: staff } = await supabase
      .from("creator_team_members")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id);

    return NextResponse.json({ partners: partners ?? 0, fans: fans ?? 0, staff: staff ?? 0 });
  } catch (err) {
    console.error("[relationships] GET:", err);
    return NextResponse.json({ error: "Failed to fetch relationships" }, { status: 500 });
  }
}
