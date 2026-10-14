/**
 * POST /api/messages/deals — propose an affiliate deal in a direct partner
 * thread (messaging.md Part 2b — Batch B 2026-10-12). Creates the
 * `affiliate_deal_proposals` row + a `messages` row anchored via
 * proposal_id. Partners-only, one pending per direction, 7-day cooldown.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMessageIdentity } from "@/lib/messages";
import {
  hasActivePartnership,
  proposalCooldownUntil,
  proposalStatusExpired,
  plusDaysISO,
  dealSummaryText,
} from "@/lib/affiliateDeals";

const proposeSchema = z.object({
  conversation_id: z.string().min(1),
  deal_type: z.enum(["percentage", "fixed", "free", "tiered", "custom"]),
  rate: z.number().min(0).optional(),
  custom_terms: z.string().max(2000).optional(),
});

type ProposalRow = { status?: string; resolved_at?: string | null; expires_at?: string | null };

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me || me.party !== "creator") {
      return NextResponse.json({ error: "Only creators can propose deals" }, { status: 403 });
    }

    const body = await req.json();
    const validation = proposeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid proposal" }, { status: 400 });
    }
    const { conversation_id, deal_type, rate, custom_terms } = validation.data;

    // Direct creator↔creator thread only — exactly 2 live members, other a creator.
    const { data: memberRows } = await supabase
      .from("conversation_members")
      .select("*")
      .eq("conversation_id", conversation_id);
    const mine = (memberRows ?? []).find((m) => m.participant_key === me.key && !m.left_at);
    const others = (memberRows ?? []).filter((m) => m.participant_key !== me.key && !m.left_at);
    if (!mine || others.length !== 1 || others[0].party !== "creator") {
      return NextResponse.json(
        { error: "Deals can only be proposed in a 1-on-1 partner chat." },
        { status: 403 },
      );
    }
    const { data: convo } = await supabase.from("conversations").select("type").eq("id", conversation_id).maybeSingle();
    if (!convo || convo.type !== "direct") {
      return NextResponse.json(
        { error: "Deals can only be proposed in a 1-on-1 partner chat." },
        { status: 403 },
      );
    }
    const partnerKey = others[0].participant_key as string;

    const { data: partnerRow } = await supabase
      .from("creators")
      .select("display_name, username")
      .eq("id", partnerKey)
      .maybeSingle();
    const partnerName = partnerRow?.display_name || partnerRow?.username || "this creator";

    // Partners-only (creators.md 2b2).
    if (!(await hasActivePartnership(supabase, me.key, partnerKey))) {
      return NextResponse.json(
        { error: `You can make deals with your partners only — connect with ${partnerName} first.` },
        { status: 403 },
      );
    }

    // Pair history in BOTH directions (two simple eq queries — mock-parser-proof).
    const [asProposer, asPartner] = await Promise.all([
      supabase.from("affiliate_deal_proposals").select("*").eq("proposer_id", me.key).eq("partner_id", partnerKey),
      supabase.from("affiliate_deal_proposals").select("*").eq("proposer_id", partnerKey).eq("partner_id", me.key),
    ]);
    const pair = [...((asProposer.data ?? []) as ProposalRow[]), ...((asPartner.data ?? []) as ProposalRow[])];

    // Lazy expiry (audit fix 2026-10-12): a pending row past its 7-day window
    // reads "expired" everywhere and the card offers no buttons to flip it —
    // counting it here would block fresh proposals between the pair forever.
    if (pair.some((p) => p.status === "pending" && !proposalStatusExpired(p))) {
      return NextResponse.json(
        { error: `You already have a proposal waiting with ${partnerName}.` },
        { status: 409 },
      );
    }
    const now = new Date();
    const unlock = proposalCooldownUntil(pair, now);
    if (unlock && unlock.getTime() > now.getTime()) {
      return NextResponse.json(
        {
          error: `You can propose another deal to ${partnerName} after ${unlock.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
        },
        { status: 409 },
      );
    }

    const nowIso = now.toISOString();
    const { data: proposal, error: insertErr } = await supabase
      .from("affiliate_deal_proposals")
      .insert({
        conversation_id,
        proposer_id: me.key,
        partner_id: partnerKey,
        deal_type,
        rate: rate ?? null,
        custom_terms: custom_terms ?? null,
        status: "pending",
        created_at: nowIso,
        expires_at: plusDaysISO(now, 7),
      })
      .select("id, expires_at")
      .single();
    if (insertErr || !proposal) {
      console.error("[messages/deals] proposal insert failed:", insertErr);
      return NextResponse.json({ error: "Couldn't create the proposal" }, { status: 500 });
    }

    // The card's timeline anchor: a normal message row flagged with the id.
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id,
      sender_key: me.key,
      body: dealSummaryText(deal_type, rate ?? null, custom_terms ?? null),
      proposal_id: (proposal as { id: string }).id,
      created_at: nowIso,
    });
    if (msgErr) {
      console.error("[messages/deals] anchor message insert failed:", msgErr);
      return NextResponse.json({ error: "Couldn't post the proposal" }, { status: 500 });
    }
    await supabase
      .from("conversations")
      .update({ last_message_at: nowIso, updated_at: nowIso })
      .eq("id", conversation_id);

    return NextResponse.json(
      { proposal: { id: (proposal as { id: string }).id, status: "pending", expires_at: proposal.expires_at } },
      { status: 201 },
    );
  } catch (err) {
    console.error("[messages/deals] POST:", err);
    return NextResponse.json({ error: "Failed to propose deal" }, { status: 500 });
  }
}
