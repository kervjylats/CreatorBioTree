/** Send a collab request to another creator. Creates a partnerships row with status=pending, source=collab. */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();
    const { partner_id } = await req.json();

    if (!partner_id || typeof partner_id !== "string") {
      return NextResponse.json({ error: "partner_id is required" }, { status: 400 });
    }

    if (partner_id === user.id) {
      return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
    }

    const { data: partner } = await supabase
      .from("creators")
      .select("id")
      .eq("id", partner_id)
      .maybeSingle();
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("partnerships")
      .select("status")
      .or(`and(creator_a.eq.${user.id},creator_b.eq.${partner_id}),and(creator_a.eq.${partner_id},creator_b.eq.${user.id})`)
      .neq("status", "ended")
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json({ error: "Request already pending" }, { status: 409 });
      }
      return NextResponse.json({ error: "Already connected" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data: row } = await supabase
      .from("partnerships")
      .insert({
        creator_a: user.id,
        creator_b: partner_id,
        status: "pending",
        source: "collab",
        commission_pct: 0,
        notes: null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    return NextResponse.json({ partnership: row }, { status: 201 });
  } catch (e) {
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
