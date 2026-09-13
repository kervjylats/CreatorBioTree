/**
 * GET/PATCH /api/creator/fans/[id] — fan profile drawer: read fan data with
 * purchases and install count, and update do_not_contact / notes (relationships.md Part 3/5).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data: fan } = await supabase
      .from("fan_accounts")
      .select("*")
      .eq("id", id)
      .eq("creator_id", user.id)
      .maybeSingle();
    if (!fan) return NextResponse.json({ error: "Fan not found" }, { status: 404 });

    const { data: purchases } = await supabase
      .from("fan_purchases")
      .select("*")
      .eq("fan_id", id)
      .eq("creator_id", user.id);

    const completedPurchases = (purchases ?? []).filter((p) => p.status === "completed");
    const totalSpent = completedPurchases.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);
    const lastPurchase = completedPurchases
      .sort((a, b) => String(b.purchased_at).localeCompare(String(a.purchased_at)))[0];

    const { count: install_count } = await supabase
      .from("fan_installs")
      .select("*", { count: "exact", head: true })
      .eq("fan_id", id)
      .eq("creator_id", user.id);

    return NextResponse.json({
      fan,
      total_spent: totalSpent,
      last_purchase_at: lastPurchase?.purchased_at ?? null,
      purchase_count: completedPurchases.length,
      install_count: install_count ?? 0,
    });
  } catch (err) {
    console.error("[fans/[id]] GET:", err);
    return NextResponse.json({ error: "Failed to fetch fan profile" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const { data: fan } = await supabase
      .from("fan_accounts")
      .select("*")
      .eq("id", id)
      .eq("creator_id", user.id)
      .maybeSingle();
    if (!fan) return NextResponse.json({ error: "Fan not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (typeof body.do_not_contact === "boolean") {
      updates.do_not_contact = body.do_not_contact;
    }
    if (typeof body.notes === "string" || body.notes === null) {
      updates.notes = body.notes;
    }

    const { data: updated } = await supabase
      .from("fan_accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return NextResponse.json({ ok: true, fan: updated });
  } catch (err) {
    console.error("[fans/[id]] PATCH:", err);
    return NextResponse.json({ error: "Failed to update fan" }, { status: 500 });
  }
}
