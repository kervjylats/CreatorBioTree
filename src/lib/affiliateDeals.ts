/**
 * Shared affiliate-deal server helpers — ONE copy each for the Batch B rules
 * (2026-10-12): `hasActivePartnership` is the partners-only gate checked at
 * deal creation AND at chat-proposal accept (creators.md 2b2), and
 * `proposalCooldownUntil` is the 7-day post-resolve cooldown (messaging.md
 * Part 2b).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const COOLDOWN_DAYS = 7;

/**
 * True when a non-ended `partnerships` row (collab or invited) links two
 * creators. Fetches MY non-ended rows (the same proven query shape as
 * `/api/creator/partners/list`) and checks the other side in JS — safe for
 * the mock's `.or()` parser at any nesting.
 */
export async function hasActivePartnership(
  supabase: SupabaseClient,
  a: string,
  b: string,
): Promise<boolean> {
  if (!a || !b || a === b) return false;
  const { data } = await supabase
    .from("partnerships")
    .select("*")
    .neq("status", "ended")
    .or(`creator_a.eq.${a},creator_b.eq.${a}`);
  return (data ?? []).some(
    (p: { creator_a?: string | null; creator_b?: string | null }) =>
      p.creator_a === b || p.creator_b === b,
  );
}

interface ResolvedProposalRow {
  status?: string;
  resolved_at?: string | null;
}

interface ExpirableProposalRow {
  status?: string;
  expires_at?: string | null;
}

/**
 * Lazy 7-day expiry (messaging.md Part 2b): true when a proposal is still
 * `pending` but past its window. One copy — the thread GET uses it for the
 * display status and the accept/decline routes to flip the row `expired`.
 */
export function proposalStatusExpired(p: ExpirableProposalRow): boolean {
  return p.status === "pending" && Date.parse(String(p.expires_at)) < Date.now();
}

/** One-line text summary — the proposal card's timeline-message body. */
export function dealSummaryText(
  dealType: string,
  rate: number | null,
  terms: string | null,
): string {
  if (dealType === "percentage") return `Deal proposal: ${rate ?? 0}% of my sales for you`;
  if (dealType === "fixed") return `Deal proposal: $${rate ?? 0} per conversion for you`;
  if (dealType === "free") return "Deal proposal: free cross-promo";
  if (dealType === "tiered") return `Deal proposal: tiered — ${terms || "see card"}`;
  return `Deal proposal: ${terms || "custom terms — see card"}`;
}

/**
 * The unlock time for sending a NEW proposal to `partnerId`: the latest
 * accepted/declined resolve among this direction's proposals + 7 days, or
 * null when no cooldown applies. Canceled proposals don't trigger it
 * (messaging.md Part 2b: "accepted OR declined").
 */
export function proposalCooldownUntil(
  proposals: ResolvedProposalRow[],
  now: Date,
): Date | null {
  let latest: number | null = null;
  for (const p of proposals) {
    if (p.status !== "accepted" && p.status !== "declined") continue;
    const at = p.resolved_at ? Date.parse(p.resolved_at) : NaN;
    if (!Number.isNaN(at) && (latest === null || at > latest)) latest = at;
  }
  if (latest === null) return null;
  return new Date(latest + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
}

/** ISO timestamp `days` from now — proposal expiry (`expires_at`). */
export function plusDaysISO(now: Date, days: number): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
