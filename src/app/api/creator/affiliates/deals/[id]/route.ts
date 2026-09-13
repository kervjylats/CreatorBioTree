/**
 * PATCH/DELETE /api/creator/affiliates/deals/[id] — update deal status
 * (active|paused|expired|revoked) or revoke a deal (network.md §7).
 * Deals are immutable aside from status changes.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

const patchSchema = z.object({
  status: z.enum(["active", "paused", "expired", "revoked"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, supabase } = await requireAuth();
    const body = await req.json();
    const validation = patchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: deal } = await supabase
      .from("affiliate_deals")
      .select("id, owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    if (deal.owner_id !== user.id) {
      return NextResponse.json({ error: "Only the deal owner can update status" }, { status: 403 });
    }

    await supabase.from("affiliate_deals").update({ status: validation.data.status }).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, supabase } = await requireAuth();

    const { data: deal } = await supabase
      .from("affiliate_deals")
      .select("id, owner_id")
      .eq("id", id)
      .maybeSingle();

    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    if (deal.owner_id !== user.id) {
      return NextResponse.json({ error: "Only the deal owner can revoke" }, { status: 403 });
    }

    await supabase.from("affiliate_deals").update({ status: "revoked" }).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to revoke deal" }, { status: 500 });
  }
}
