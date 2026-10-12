/**
 * GET /api/creator/affiliates/earnings — settlement read side (earnings.md
 * Parts 2/4/5): earned/owed totals, receipt-enriched conversions, Red Card,
 * lazy 14-day ladder (emails + reminders_sent bits), and locks ②/③ (pause
 * owner-side deals while red; hold/re-date receivables). `?badge=1` = cheap
 * sidebar-dot branch (action_required + red_card only, no side effects).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";
import { computeRedCard, debtorLadderHits, promoterLadderHits, type LadderHit, type SettlementConvRow } from "@/lib/settlement";
import { settlementDue } from "@/lib/limits";
import { emailSender } from "@/lib/email";
import { money } from "@/lib/format";

interface DealRow {
  id: string;
  owner_id: string;
  promoter_id: string;
  status?: string;
  paused_reason?: string | null;
  deal_type?: string;
  rate?: number;
  trigger?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface CounterpartyRow {
  id: string;
  display_name: string | null;
  username: string | null;
  paypal_handle?: string | null;
  email?: string | null;
}

interface SaleRow {
  id: string;
  amount_paid: number;
  currency: string | null;
}

function emptyTotals() {
  return { settled: 0, pending: 0, disputed: 0 };
}

function accumulate(target: ReturnType<typeof emptyTotals>, amount: number, status: string | undefined) {
  if (status === "settled") target.settled += amount;
  else if (status === "disputed") target.disputed += amount;
  else target.pending += amount;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const NOTICE_COPY: Record<LadderHit["stage"], (amount: number, who: string, due: string) => { subject: string; body: string }> = {
  due: (amount, who, due) => ({
    subject: `You received ${money(amount)} — payment due ${due}`,
    body: `${who} promoted your sale and earned ${money(amount)}. Send it within 14 days (by ${due}) to keep your account clear.`,
  }),
  reminder_3: (amount, who, due) => ({
    subject: `Reminder: ${money(amount)} owed to ${who}`,
    body: `${money(amount)} to ${who} is due ${due}. A late payment triggers the Red Card and pauses your affiliate deals.`,
  }),
  reminder_7: (amount, who, due) => ({
    subject: `Red Card in 7 days: ${money(amount)} owed to ${who}`,
    body: `${money(amount)} to ${who} is due ${due}. One week left before your account goes red and your deals pause.`,
  }),
  overdue: (amount, who, due) => ({
    subject: `Red Card: ${money(amount)} overdue to ${who}`,
    body: `Your payment of ${money(amount)} to ${who} was due ${due}. New deals are blocked and your active deals are paused until you settle.`,
  }),
  earned: (amount, who, due) => ({
    subject: `You earned ${money(amount)} from ${who}`,
    body: `${who}'s sale credited ${money(amount)} to your earnings. It settles within 14 days (by ${due}).`,
  }),
  held: (amount, who, due) => ({
    subject: `Payment overdue: ${money(amount)} from ${who}`,
    body: `${who}'s ${money(amount)} payment was due ${due} and hasn't arrived. It shows as overdue on their account.`,
  }),
};

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();
    const badgeOnly = request.nextUrl.searchParams.get("badge") === "1";

    // ── Red Card + lock ②/③ lazy state (skipped on the cheap badge branch) ──
    const redCard = await computeRedCard(supabase, user.id);

    const { data: ownedDealRows } = await supabase
      .from("affiliate_deals")
      .select("*")
      .eq("owner_id", user.id);
    const { data: promotedDealRows } = await supabase
      .from("affiliate_deals")
      .select("*")
      .eq("promoter_id", user.id)
      .neq("owner_id", user.id);
    const ownedDeals = (ownedDealRows ?? []) as DealRow[];
    const promotedDeals = (promotedDealRows ?? []) as DealRow[];
    const ownedIds = new Set(ownedDeals.map((d) => d.id));
    const promotedIds = promotedDeals.map((d) => d.id);
    const allDealIds = [...ownedIds, ...promotedIds];

    if (badgeOnly) {
      const { data: allConvs } = allDealIds.length
        ? await supabase.from("affiliate_conversions").select("*").in("deal_id", allDealIds)
        : { data: [] as SettlementConvRow[] };
      const now = Date.now();
      let actionRequired = 0;
      for (const row of (allConvs ?? []) as SettlementConvRow[]) {
        const mine = ownedIds.has(String(row.deal_id));
        if (mine && row.settlement_status === "pending" && Number(row.promoter_cut ?? 0) > 0 && !row.held_since) {
          const due = row.due_at ? Date.parse(row.due_at) : Date.parse(String(row.created_at ?? 0)) + 14 * DAY_MS;
          if (due < now) actionRequired += 1;
        }
        if (!mine && row.settlement_status === "awaiting_confirm") {
          const paidAt = row.owner_paid_at ? Date.parse(row.owner_paid_at) : now;
          if (now - paidAt < 14 * DAY_MS) actionRequired += 1;
        }
      }
      return NextResponse.json({ action_required: actionRequired, red_card: redCard.red });
    }

    // ── Lock ② lazy flip: pause/restore my active deals from the Red Card ──
    if (redCard.red) {
      for (const deal of ownedDeals) {
        if (deal.status === "active") {
          await supabase.from("affiliate_deals").update({ status: "paused", paused_reason: "owner_red" }).eq("id", deal.id);
          deal.status = "paused";
          deal.paused_reason = "owner_red";
        }
      }
    } else {
      for (const deal of ownedDeals) {
        if (deal.status === "paused" && deal.paused_reason === "owner_red") {
          await supabase.from("affiliate_deals").update({ status: "active", paused_reason: null }).eq("id", deal.id);
          deal.status = "active";
          deal.paused_reason = null;
        }
      }
    }

    if (allDealIds.length === 0) {
      return NextResponse.json({
        ...emptyTotals(),
        earned: emptyTotals(),
        owed: emptyTotals(),
        conversions: [],
        red_card: redCard,
        notices: [],
        action_required: 0,
        deal_count: 0,
      });
    }

    const { data: convRows } = await supabase
      .from("affiliate_conversions")
      .select("*")
      .in("deal_id", allDealIds);
    const rows = (convRows ?? []) as SettlementConvRow[];

    // ── Enrichment joins: deals (all already fetched), counterparties, sales ──
    const dealsById = new Map<string, DealRow>();
    for (const d of [...ownedDeals, ...promotedDeals]) dealsById.set(d.id, d);

    const counterpartyIds = new Set<string>();
    const saleIds = new Set<string>();
    for (const row of rows) {
      const deal = dealsById.get(String(row.deal_id));
      if (!deal) continue;
      counterpartyIds.add(ownedIds.has(deal.id) ? deal.promoter_id : deal.owner_id);
      if (row.sale_id) saleIds.add(String(row.sale_id));
    }

    const [counterpartiesRes, salesRes] = await Promise.all([
      counterpartyIds.size
        ? supabase.from("creators").select("id, display_name, username, paypal_handle, email").in("id", [...counterpartyIds])
        : Promise.resolve({ data: [] as CounterpartyRow[] }),
      saleIds.size
        ? supabase.from("fan_purchases").select("id, amount_paid, currency").in("id", [...saleIds])
        : Promise.resolve({ data: [] as SaleRow[] }),
    ]);
    const counterparties = new Map<string, CounterpartyRow>(
      ((counterpartiesRes.data ?? []) as CounterpartyRow[]).map((c) => [c.id, c]),
    );
    const sales = new Map<string, SaleRow>(
      ((salesRes.data ?? []) as SaleRow[]).map((s) => [s.id, s]),
    );

    // ── Lock ③ — receivable holds: rows I OWE whose receiver is in arrears ──
    // Receiver red + I'm not → held (their clock pauses via held_since; a hold
    // never blocks a payment clearing MY own arrears — settle route enforces).
    const receiverRedCache = new Map<string, boolean>();
    const now = Date.now();

    const outgoing: SettlementConvRow[] = rows.filter((r) => ownedIds.has(String(r.deal_id)));
    for (const row of outgoing) {
      if (row.settlement_status !== "pending" || Number(row.promoter_cut ?? 0) <= 0) continue;
      const deal = dealsById.get(String(row.deal_id));
      const receiverId = deal?.promoter_id;
      if (!receiverId) continue;
      if (!receiverRedCache.has(receiverId)) {
        receiverRedCache.set(receiverId, (await computeRedCard(supabase, receiverId)).red);
      }
      const receiverRed = receiverRedCache.get(receiverId)!;
      if (receiverRed) {
        if (!row.held_since) {
          const stamped = new Date().toISOString();
          row.held_since = stamped;
          await supabase.from("affiliate_conversions").update({ held_since: stamped }).eq("id", row.id);
        }
      } else if (row.held_since) {
        // Hold released → re-date the payer's clock: fresh 14 days from now.
        const freshDue = settlementDue();
        row.held_since = null;
        row.due_at = freshDue;
        await supabase.from("affiliate_conversions").update({ held_since: null, due_at: freshDue }).eq("id", row.id);
      }
      // Legacy rows created before due_at existed → backfill once.
      if (!row.due_at && row.created_at) {
        const due = settlementDue(new Date(String(row.created_at)));
        row.due_at = due;
        await supabase.from("affiliate_conversions").update({ due_at: due }).eq("id", row.id);
      }
    }

    // ── The 14-day ladder: evaluate, email, set bits (idempotent) ──
    const incoming = rows.filter((r) => !ownedIds.has(String(r.deal_id)));
    const hits: LadderHit[] = [
      ...debtorLadderHits(outgoing.filter((r) => !r.held_since)),
      ...promoterLadderHits(incoming),
    ];

    const notices: Array<LadderHit & { who: string }> = [];
    const bitsByConv = new Map<string, number>();
    for (const hit of hits) {
      const deal = dealsById.get(hit.deal_id);
      const counterpartyId = hit.role === "debtor" ? deal?.promoter_id : deal?.owner_id;
      const counterparty = counterpartyId ? counterparties.get(counterpartyId) : null;
      const who = counterparty ? (counterparty.display_name || counterparty.username || "a creator") : "your partner";
      const recipient = hit.role === "debtor" ? user.email : counterparty?.email;
      const due = String(hit.due_at).slice(0, 10);
      const copy = NOTICE_COPY[hit.stage](hit.amount, hit.role === "debtor" ? who : "you", due);
      if (recipient) {
        emailSender.send(recipient, copy.subject, `<p>${copy.body}</p>`).catch((err) => {
          console.error("[earnings/ladder] email failed:", err);
        });
      }
      bitsByConv.set(hit.conversion_id, (bitsByConv.get(hit.conversion_id) ?? 0) | hit.bit);
      notices.push({ ...hit, who });
    }
    for (const [conversionId, bits] of bitsByConv) {
      if (!conversionId) continue;
      const row = rows.find((r) => r.id === conversionId);
      const next = Number(row?.reminders_sent ?? 0) | bits;
      if (row) row.reminders_sent = next;
      await supabase
        .from("affiliate_conversions")
        .update({ reminders_sent: next, last_reminder_at: new Date().toISOString() })
        .eq("id", conversionId);
    }

    // ── Totals (flat keys stay for the existing tiles) ──
    const earned = emptyTotals();
    const owed = emptyTotals();
    for (const row of rows) {
      const promoterCut = Number(row.promoter_cut ?? 0);
      accumulate(ownedIds.has(String(row.deal_id)) ? owed : earned, promoterCut, row.settlement_status);
    }

    // ── Badge inputs: overdue owed-to-me + confirms waiting on me ──
    let actionRequired = 0;
    for (const row of rows) {
      const mine = ownedIds.has(String(row.deal_id));
      if (mine && row.settlement_status === "pending" && Number(row.promoter_cut ?? 0) > 0 && !row.held_since) {
        const due = row.due_at ? Date.parse(String(row.due_at)) : Date.parse(String(row.created_at ?? 0)) + 14 * DAY_MS;
        if (due < now) actionRequired += 1;
      }
      if (!mine && row.settlement_status === "awaiting_confirm") {
        const paidAt = row.owner_paid_at ? Date.parse(String(row.owner_paid_at)) : now;
        if (now - paidAt < 14 * DAY_MS) actionRequired += 1;
      }
    }

    // ── Receipt-enriched conversion rows for §2 ──
    const conversions = rows.map((row) => {
      const deal = dealsById.get(String(row.deal_id));
      const isOwner = ownedIds.has(String(row.deal_id));
      const counterpartyId = deal ? (isOwner ? deal.promoter_id : deal.owner_id) : null;
      const counterparty = counterpartyId ? counterparties.get(counterpartyId) : null;
      const sale = row.sale_id ? sales.get(String(row.sale_id)) : null;
      const ghost =
        row.settlement_status === "awaiting_confirm" &&
        row.owner_paid_at != null &&
        now - Date.parse(String(row.owner_paid_at)) >= 14 * DAY_MS;
      return {
        ...row,
        direction: isOwner ? "owed" : "earned",
        deal: deal
          ? { deal_type: deal.deal_type, rate: deal.rate, trigger: deal.trigger, custom_terms: deal.custom_terms ?? null, status: deal.status, created_at: deal.created_at }
          : null,
        counterparty: counterparty
          ? { id: counterparty.id, display_name: counterparty.display_name, username: counterparty.username, paypal_handle: counterparty.paypal_handle ?? null }
          : null,
        sale: sale ? { amount_paid: sale.amount_paid, currency: sale.currency ?? "USD" } : null,
        held: row.held_since != null,
        ghost,
      };
    });

    return NextResponse.json({
      ...earned,
      earned,
      owed,
      conversions,
      red_card: redCard,
      notices,
      action_required: actionRequired,
      deal_count: allDealIds.length,
    });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to load earnings" }, { status: 500 });
  }
}
