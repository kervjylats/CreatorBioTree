/** Admin platform stats — total creators, fans, revenue. Admin only. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccount } from "@/lib/admin-permissions";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabase.rpc("get_admin_stats");
    if (error) {
      console.error("Admin stats rpc error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}