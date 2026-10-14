/**
 * POST /api/messages/deals/[id]/cancel — the PROPOSER withdraws a pending
 * deal proposal (messaging.md Part 2b). Nothing money-related exists at
 * pending, so cancel is purely prospective and does NOT feed the re-propose
 * cooldown (accepted/declined only — lib/affiliateDeals).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMessageIdentity } from "@/lib/messages";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can cancel proposals" }, { status: 403 });
    }

    const { data: proposal } = await supabase
      .from("affiliate_deal_proposals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.proposer_id !== me.key) {
      return NextResponse.json({ error: "Only the sender can cancel this proposal." }, { status: 403 });
    }
    if (proposal.status !== "pending") {
      return NextResponse.json({ error: `This proposal was already ${proposal.status}.` }, { status: 409 });
    }

    const { error } = await supabase
      .from("affiliate_deal_proposals")
      .update({ status: "canceled", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("[messages/deals/cancel] update failed:", error);
      return NextResponse.json({ error: "Couldn't cancel the proposal" }, { status: 500 });
    }
    return NextResponse.json({ status: "canceled" });
  } catch (err) {
    console.error("[messages/deals/cancel] POST:", err);
    return NextResponse.json({ error: "Failed to cancel proposal" }, { status: 500 });
  }
}
