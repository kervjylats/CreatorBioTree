/**
 * affiliateAttribution.ts — server-side affiliate attribution + conversion writer
 * (monetization/creators.md Part 2e2, the Deal Rules & Settlement Engine). The /ref
 * click route stores an affiliate_attributions row and hands the visitor a short-lived
 * cookie; at purchase time this module validates the deal rules, computes both cuts,
 * and inserts an immutable affiliate_conversions row (pending settlement). Best-effort
 * by design: a ledger failure logs and never fails the fan's purchase receipt.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateAttribution, AffiliateConversion, AffiliateDeal } from "@/types";
import { settlementDue } from "@/lib/limits";
import { computeRedCard } from "@/lib/settlement";

/** Handoff cookie from a /ref click to the eventual fan action (30 days). */
export const AFF_ATTRIBUTION_COOKIE = "aff_attr";
export const AFF_ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 30; // seconds

interface CookieStoreLike {
  get(name: string): { value: string } | undefined;
}

interface PurchaseContext {
  saleId: string;
  /** Creator whose storefront the fan bought from — must be the deal owner. */
  creatorId: string;
  itemId: string;
  itemType: string;
  /** amount_paid for this sale, in the platform's default currency (dollars). */
  amount: number;
  fanId: string | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compute both cuts per the deal rules at sale time (Part 2e2): percentage → rate%
 * of the sale; fixed → rate dollars (the platform stores dollars everywhere,
 * 2026-09-29); free → nothing; tiered/custom → free text the engine can't price
 * (promoter cut 0 — the owner settles those manually per the ledger, Part 2e2
 * "Never auto-creates money"). Cuts never exceed the sale itself, even though
 * deal creation has no min/max validation (creators.md Part 2 decision).
 */
export function computeDealCuts(
  deal: Pick<AffiliateDeal, "deal_type" | "rate">,
  amount: number,
): { ownerCut: number; promoterCut: number } {
  const total = Math.max(0, round2(amount));
  let promoterCut = 0;
  if (deal.deal_type === "percentage") {
    promoterCut = (total * Math.max(0, Number(deal.rate ?? 0))) / 100;
  } else if (deal.deal_type === "fixed") {
    promoterCut = Math.max(0, Number(deal.rate ?? 0));
  }
  promoterCut = Math.min(round2(promoterCut), total);
  return { ownerCut: round2(total - promoterCut), promoterCut };
}

function dealCoversPurchase(deal: AffiliateDeal, ctx: PurchaseContext): boolean {
  if (deal.status !== "active") return false;
  const now = Date.now();
  if (deal.valid_from && Date.parse(deal.valid_from) > now) return false;
  if (deal.valid_until && Date.parse(deal.valid_until) < now) return false;
  if (deal.trigger === "tip") return ctx.itemType === "tip_jar";
  if (deal.trigger === "purchase" || deal.trigger === "any") return true;
  // follow/subscribe/signup read their own event tables (future writers).
  return false;
}

/**
 * Read the /ref attribution cookie and, when the deal rules match this purchase,
 * write the affiliate_conversions row (Part 2e2). Called from the mock purchase
 * webhook AFTER the fan_purchases insert (so sale_id exists) — idempotent per sale
 * + deal, and never throws: purchase receipts must not fail on ledger errors.
 */
export async function recordAffiliateConversion(
  supabase: SupabaseClient,
  cookieStore: CookieStoreLike,
  ctx: PurchaseContext,
): Promise<void> {
  try {
    const attributionId = cookieStore.get(AFF_ATTRIBUTION_COOKIE)?.value;
    if (!attributionId) return; // no click → no attribution → no conversion

    const { data: attributionRow } = await supabase
      .from("affiliate_attributions")
      .select("*")
      .eq("id", attributionId)
      .maybeSingle();
    const attribution = attributionRow as AffiliateAttribution | null;
    if (!attribution?.deal_id) return;

    const { data: dealRow } = await supabase
      .from("affiliate_deals")
      .select("*")
      .eq("id", attribution.deal_id)
      .maybeSingle();
    const deal = dealRow as AffiliateDeal | null;
    // Creator-only deals since 2026-10-10 (earnings.md §1): a deal only converts
    // on its OWN owner's storefront — the per-item scope branch is gone.
    if (!deal || !dealCoversPurchase(deal, ctx) || deal.owner_id !== ctx.creatorId) return;

    // Lock ② (earnings.md Part 4): while the deal owner is in Red Card arrears,
    // their deals convert nothing — the same effect as a pause, enforced at the
    // engine so the race window before the lazy status flip can't accrue debt.
    const redCard = await computeRedCard(supabase, deal.owner_id);
    if (redCard.red) {
      console.info(`[affiliate/conversion] skipped — deal owner ${deal.owner_id} is in Red Card`);
      return;
    }

    // Idempotency — one conversion per sale per deal.
    const { data: existingRow } = await supabase
      .from("affiliate_conversions")
      .select("id")
      .eq("sale_id", ctx.saleId)
      .eq("deal_id", deal.id)
      .maybeSingle();
    const existing = existingRow as Pick<AffiliateConversion, "id"> | null;
    if (existing) return;

    const { ownerCut, promoterCut } = computeDealCuts(deal, ctx.amount);

    // Backfill who converted and on what — attribution rows start anonymous
    // (fan_id and item_id are unknown at click time, Part 2f).
    await supabase
      .from("affiliate_attributions")
      .update({ fan_id: ctx.fanId, item_id: ctx.itemId })
      .eq("id", attributionId);

    // Auto-split is the default rail (mocked in dev; PayPal Orders API in
    // production) — the row stays pending until the Settlement Engine runs.
    // due_at starts the 14-day window (earnings.md Part 4) that drives the
    // ladder and the Red Card.
    const { error } = await supabase.from("affiliate_conversions").insert({
      deal_id: deal.id,
      sale_id: ctx.saleId,
      owner_cut: ownerCut,
      promoter_cut: promoterCut,
      settle_method: "auto_split",
      settlement_status: "pending",
      due_at: settlementDue(),
      reminders_sent: 0,
    });
    if (error) console.error("[affiliate/conversion] insert failed:", error);
    else {
      console.info(
        `[affiliate/conversion] ${promoterCut} promoter cut on deal ${deal.id} (sale ${ctx.saleId})`,
      );
    }
  } catch (err) {
    // Best-effort by design — the fan's receipt already succeeded.
    console.error("[affiliate/conversion]", err);
  }
}

// PRODUCTION-NOTE: real mode runs this inside the PayPal webhook transaction
// (single DB transaction with the fan_purchases insert), and attribution should
// ALSO accept a persistent `?ref=` param passthrough so it survives cookie
// clearing (creators.md Part 2e — "server-side is the source of truth").
