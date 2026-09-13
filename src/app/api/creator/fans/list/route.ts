/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = createServiceClient();
    const { data: fans, error } = await serviceSupabase
      .from("fan_accounts")
      .select("email, created_at, referred_by")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(fans ?? []);
  } catch (err) {
    console.error("Fan list error:", err);
    return NextResponse.json({ error: "Failed to fetch fans" }, { status: 500 });
  }
}