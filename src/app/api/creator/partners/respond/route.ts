/** Accept or decline a pending collab request. Accept sets status=active; decline deletes the row. */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();
    const { partnership_id, action } = await req.json();

    if (!partnership_id || typeof partnership_id !== "string") {
      return NextResponse.json({ error: "partnership_id is required" }, { status: 400 });
    }
    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("partnerships")
      .select("id")
      .eq("id", partnership_id)
      .eq("creator_b", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "accept") {
      const { data: updated } = await supabase
        .from("partnerships")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", partnership_id)
        .select()
        .single();
      return NextResponse.json({ partnership: updated });
    }

    await supabase.from("partnerships").delete().eq("id", partnership_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
