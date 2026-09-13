/** Admin fans list — returns all fan_accounts for a given creator. Admin only. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccount } from "@/lib/admin-permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabase
      .from("fan_accounts")
      .select("email, created_at, referred_by")
      .eq("creator_id", id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Admin fans error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}