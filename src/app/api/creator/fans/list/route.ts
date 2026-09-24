/**
 * GET /api/creator/fans/list — all fans for the authenticated creator with
 * profile fields the table needs: id, email, created_at, referred_by,
 * do_not_contact, and total_spent summed from completed purchases.
 */
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
      .select("id, email, created_at, referred_by, do_not_contact")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ids = (fans ?? []).map((f) => f.id as string);
    const spentByFan = new Map<string, number>();
    if (ids.length > 0) {
      const { data: purchases } = await serviceSupabase
        .from("fan_purchases")
        .select("fan_id, amount_paid, status")
        .eq("creator_id", user.id)
        .in("fan_id", ids);
      for (const p of purchases ?? []) {
        if (p.status !== "completed") continue;
        spentByFan.set(
          p.fan_id as string,
          (spentByFan.get(p.fan_id as string) ?? 0) + (p.amount_paid ?? 0),
        );
      }
    }

    const enriched = (fans ?? []).map((f) => ({
      ...f,
      do_not_contact: Boolean(f.do_not_contact),
      total_spent: spentByFan.get(f.id as string) ?? 0,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("Fan list error:", err);
    return NextResponse.json({ error: "Failed to fetch fans" }, { status: 500 });
  }
}