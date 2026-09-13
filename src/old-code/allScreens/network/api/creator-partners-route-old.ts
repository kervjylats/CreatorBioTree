/** Backup — GET/POST /api/creator/partners. Uses partnershipService from wiredLater. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* partnershipService was imported here — moved to wiredLater */

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    /* was: partnershipService.getForCreator(user.id, supabase) */
    const { data } = await supabase.from("partnerships").select("*").or(`creator_a.eq.${user.id},creator_b.eq.${user.id}`);
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch partnerships" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { target_creator_id, notes, commission_pct } = await req.json();
    if (!target_creator_id) return NextResponse.json({ error: "Target creator ID is required" }, { status: 400 });
    const userId = user.id;
    if (userId === target_creator_id) return NextResponse.json({ error: "Cannot partner with yourself" }, { status: 400 });
    /* was: partnershipService.getForCreator + partnershipService.request */
    const { data: existing } = await supabase.from("partnerships").select("id").eq("creator_a", userId).eq("creator_b", target_creator_id).limit(1).single();
    if (existing) {
      return NextResponse.json({ error: "You already have a partnership or pending request with this creator" }, { status: 400 });
    }
    await supabase.from("partnerships").insert({
      creator_a: userId,
      creator_b: target_creator_id,
      status: "pending",
      notes: notes ?? null,
      commission_pct: commission_pct ?? 10,
    });
    return NextResponse.json({ ok: true, message: "Partnership request sent successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create partnership request" }, { status: 500 });
  }
}
