/**
 * POST /api/messages/deals/[id]/decline — the recipient declines a pending
 * deal proposal (messaging.md Part 2b). Lazy 7-day expiry enforced here; the
 * resolve feeds the 7-day re-propose cooldown (lib/affiliateDeals).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMessageIdentity } from "@/lib/messages";
import { proposalStatusExpired } from "@/lib/affiliateDeals";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can decline deals" }, { status: 403 });
    }

    const { data: proposal } = await supabase
      .from("affiliate_deal_proposals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.partner_id !== me.key) {
      return NextResponse.json({ error: "Only the partner this was sent to can decline it." }, { status: 403 });
    }
    if (proposal.status !== "pending") {
      return NextResponse.json({ error: `This proposal was already ${proposal.status}.` }, { status: 409 });
    }
    const nowIso = new Date().toISOString();
    if (proposalStatusExpired(proposal)) {
      await supabase
        .from("affiliate_deal_proposals")
        .update({ status: "expired", resolved_at: nowIso })
        .eq("id", id);
      return NextResponse.json({ error: "This proposal expired." }, { status: 409 });
    }

    const { error } = await supabase
      .from("affiliate_deal_proposals")
      .update({ status: "declined", resolved_at: nowIso })
      .eq("id", id);
    if (error) {
      console.error("[messages/deals/decline] update failed:", error);
      return NextResponse.json({ error: "Couldn't decline the proposal" }, { status: 500 });
    }
    return NextResponse.json({ status: "declined" });
  } catch (err) {
    console.error("[messages/deals/decline] POST:", err);
    return NextResponse.json({ error: "Failed to decline proposal" }, { status: 500 });
  }
}
