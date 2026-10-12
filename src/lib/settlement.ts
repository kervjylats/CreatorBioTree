/**
 * settlement.ts — the Settlement Engine's server-side helpers (earnings.md
 * Parts 4-5): the Red Card and the 14-day reminder ladder. ONE implementation
 * shared by every lock: deals POST (lock 1 — 403), the conversion engine
 * (lock 2 — pause owner-side deals), and the earnings GET (banner + lazy
 * notices + lock 3 — receivable hold). Pure logic; callers do the I/O.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SETTLEMENT_DUE_DAYS, settlementDue } from "@/lib/limits";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RedCardState {
  /** 🟥 — outgoing debt older than SETTLEMENT_DUE_DAYS OR any dispute I'm party to. */
  red: boolean;
  /** Unpaid outgoing debts past due (conversions on deals I own). */
  overdue: number;
  /** Disputed conversions where I'm owner or promoter (either side goes 🟥). */
  disputed: number;
}

/** Columns this module reads off an affiliate_conversions row. */
export interface SettlementConvRow {
  id?: string;
  deal_id: string;
  sale_id?: string;
  promoter_cut: number | string;
  settlement_status?: string;
  due_at?: string | null;
  owner_paid_at?: string | null;
  created_at?: string;
  reminders_sent?: number | null;
  /** Lock ③ marker — set while the RECEIVER is in arrears (clock paused). */
  held_since?: string | null;
  [key: string]: unknown;
}

export function emptyRedCard(): RedCardState {
  return { red: false, overdue: 0, disputed: 0 };
}

/** Effective due timestamp: explicit due_at, else created_at + the window. */
export function effectiveDueAt(row: SettlementConvRow): number {
  const explicit = row.due_at ? Date.parse(row.due_at) : NaN;
  if (!Number.isNaN(explicit)) return explicit;
  const created = row.created_at ? Date.parse(row.created_at) : Date.now();
  return created + SETTLEMENT_DUE_DAYS * DAY_MS;
}

/**
 * computeRedCard — the single source of redness. Red = (an outgoing debt past
 * due) OR (any dispute I'm party to). Self-deals count on both sides at once;
 * awaiting_confirm rows never count as overdue (the debtor already marked paid).
 */
export async function computeRedCard(
  supabase: SupabaseClient,
  userId: string,
): Promise<RedCardState> {
  const [owned, promoted] = await Promise.all([
    supabase.from("affiliate_deals").select("id").eq("owner_id", userId),
    supabase.from("affiliate_deals").select("id").eq("promoter_id", userId).neq("owner_id", userId),
  ]);
  const ownedIds = (owned.data ?? []).map((d) => d.id as string);
  const promotedIds = (promoted.data ?? []).map((d) => d.id as string);
  if (ownedIds.length === 0 && promotedIds.length === 0) return emptyRedCard();

  const state = emptyRedCard();
  const now = Date.now();

  if (ownedIds.length > 0) {
    const { data } = await supabase
      .from("affiliate_conversions")
      .select("*")
      .in("deal_id", ownedIds);
    for (const row of (data ?? []) as SettlementConvRow[]) {
      if (row.settlement_status === "disputed") state.disputed += 1;
      else if (
        row.settlement_status === "pending" &&
        Number(row.promoter_cut ?? 0) > 0 &&
        !row.held_since &&
        effectiveDueAt(row) < now
      ) {
        state.overdue += 1;
      }
    }
  }

  if (promotedIds.length > 0) {
    const { data } = await supabase
      .from("affiliate_conversions")
      .select("*")
      .in("deal_id", promotedIds);
    for (const row of (data ?? []) as SettlementConvRow[]) {
      if (row.settlement_status === "disputed") state.disputed += 1;
    }
  }

  state.red = state.overdue > 0 || state.disputed > 0;
  return state;
}

// ─── The 14-day ladder (earnings.md Part 5) ─────────────────────────────────

/**
 * Reminder bitmask stored in `affiliate_conversions.reminders_sent` — one bit
 * per ladder step, so every stage fires exactly once (idempotent under polling).
 * Debtor = the deal OWNER who owes the cut; promoter = the one owed.
 */
export const LADDER_BITS = {
  debtorT0: 1,
  debtorT3: 2,
  debtorT7: 4,
  debtorT14: 8,
  promoterT0: 16,
  promoterOverdue: 32,
} as const;

export type LadderRole = "debtor" | "promoter";
export type LadderStage = "due" | "reminder_3" | "reminder_7" | "overdue" | "earned" | "held";

export interface LadderHit {
  conversion_id: string;
  deal_id: string;
  /** Bitmask to OR into reminders_sent once the notice fires. */
  bit: number;
  role: LadderRole;
  stage: LadderStage;
  /** Dollars: debtor stages = promoter_cut owed; promoter stages = earned. */
  amount: number;
  due_at: string;
}

const DEBTOR_STAGES: Array<{ bit: number; afterDays: number; stage: LadderStage }> = [
  { bit: LADDER_BITS.debtorT0, afterDays: 0, stage: "due" },
  { bit: LADDER_BITS.debtorT3, afterDays: 3, stage: "reminder_3" },
  { bit: LADDER_BITS.debtorT7, afterDays: 7, stage: "reminder_7" },
  { bit: LADDER_BITS.debtorT14, afterDays: SETTLEMENT_DUE_DAYS, stage: "overdue" },
];

/**
 * Debtor-side hits: rows on deals I OWN that are still pending with money owed.
 * Settled/disputed/awaiting_confirm rows never ladder (disputes have their own
 * event; a marked-paid row is already paid).
 */
export function debtorLadderHits(
  rows: SettlementConvRow[],
  now: number = Date.now(),
): LadderHit[] {
  const hits: LadderHit[] = [];
  for (const row of rows) {
    if (row.settlement_status !== "pending") continue;
    if (Number(row.promoter_cut ?? 0) <= 0) continue;
    const bits = Number(row.reminders_sent ?? 0);
    const created = row.created_at ? Date.parse(row.created_at) : now;
    const dueAt = effectiveDueAt(row);
    for (const s of DEBTOR_STAGES) {
      if (bits & s.bit) continue;
      if (now - created >= s.afterDays * DAY_MS) {
        hits.push({
          conversion_id: row.id ?? "",
          deal_id: row.deal_id,
          bit: s.bit,
          role: "debtor",
          stage: s.stage,
          amount: Number(row.promoter_cut),
          due_at: new Date(dueAt).toISOString(),
        });
      }
    }
  }
  return hits;
}

/**
 * Promoter-side hits: rows on deals I PROMOTE — T0 "you earned" when the
 * conversion is written, and the overdue notice once the due date passes with
 * nothing settled (the receivable hold lock).
 */
export function promoterLadderHits(
  rows: SettlementConvRow[],
  now: number = Date.now(),
): LadderHit[] {
  const hits: LadderHit[] = [];
  for (const row of rows) {
    if (row.settlement_status !== "pending") continue;
    if (Number(row.promoter_cut ?? 0) <= 0) continue;
    if (row.held_since) continue; // held = receiver in arrears; the payer's clock (and this notice) is paused
    const bits = Number(row.reminders_sent ?? 0);
    const dueAt = effectiveDueAt(row);
    if (!(bits & LADDER_BITS.promoterT0)) {
      hits.push({
        conversion_id: row.id ?? "",
        deal_id: row.deal_id,
        bit: LADDER_BITS.promoterT0,
        role: "promoter",
        stage: "earned",
        amount: Number(row.promoter_cut),
        due_at: new Date(dueAt).toISOString(),
      });
    }
    if (!(bits & LADDER_BITS.promoterOverdue) && dueAt < now) {
      hits.push({
        conversion_id: row.id ?? "",
        deal_id: row.deal_id,
        bit: LADDER_BITS.promoterOverdue,
        role: "promoter",
        stage: "held",
        amount: Number(row.promoter_cut),
        due_at: new Date(dueAt).toISOString(),
      });
    }
  }
  return hits;
}

// PRODUCTION-NOTE: the ladder runs lazily on the earnings GET (mock). Real mode
// should move it to a daily cron (QStash/Supabase cron) that walks conversions
// with reminders_sent < 63 — same pure functions, scheduled trigger, emails via
// Resend templates.
