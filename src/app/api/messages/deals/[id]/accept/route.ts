/**
 * POST /api/messages/deals/[id]/accept — the recipient accepts a pending deal
 * proposal (messaging.md Part 2b): creates the affiliate_deals row (owner =
 * proposer, promoter = accepter) and flips the proposal accepted + deal_id.
 * Lazy 7-day expiry, the partnership re-check, and the proposer's Red Card
 * (earnings.md Part 4 — same lock as the direct deals POST) are enforced here.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMessageIdentity } from "@/lib/messages";
import { hasActivePartnership, proposalStatusExpired } from "@/lib/affiliateDeals";
import { computeRedCard } from "@/lib/settlement";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can accept deals" }, { status: 403 });
    }

    const { data: proposal } = await supabase
      .from("affiliate_deal_proposals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.partner_id !== me.key) {
      return NextResponse.json({ error: "Only the partner this was sent to can accept it." }, { status: 403 });
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
    // The partnership may have ended since proposing (creators.md 2b2).
    if (!(await hasActivePartnership(supabase, proposal.proposer_id, proposal.partner_id))) {
      return NextResponse.json({ error: "This partnership has ended." }, { status: 409 });
    }
    // Lock ① (earnings.md Part 4, audit fix 2026-10-12): the new deal's OWNER
    // is the proposer — a Red-Card proposer can't sign new deals, the same
    // lock the direct POST enforces (otherwise this deal would be created
    // active and instantly auto-paused as owner_red on their next Earnings view).
    const redCard = await computeRedCard(supabase, proposal.proposer_id as string);
    if (redCard.red) {
      return NextResponse.json(
        {
          error:
            "The creator who proposed this has overdue affiliate payments. They need to settle them in Earnings first.",
        },
        { status: 403 },
      );
    }

    const { data: deal, error: dealErr } = await supabase
      .from("affiliate_deals")
      .insert({
        owner_id: proposal.proposer_id,
        promoter_id: proposal.partner_id,
        deal_type: proposal.deal_type,
        rate: proposal.rate ?? undefined,
        custom_terms: proposal.custom_terms ?? undefined,
        trigger: "purchase",
        status: "active",
        created_at: nowIso,
      })
      .select("id")
      .single();
    if (dealErr || !deal) {
      console.error("[messages/deals/accept] deal insert failed:", dealErr);
      return NextResponse.json({ error: "Couldn't create the deal" }, { status: 500 });
    }

    await supabase
      .from("affiliate_deal_proposals")
      .update({ status: "accepted", resolved_at: nowIso, deal_id: deal.id })
      .eq("id", id);

    return NextResponse.json({ deal_id: deal.id, status: "accepted" });
  } catch (err) {
    console.error("[messages/deals/accept] POST:", err);
    return NextResponse.json({ error: "Failed to accept proposal" }, { status: 500 });
  }
}
