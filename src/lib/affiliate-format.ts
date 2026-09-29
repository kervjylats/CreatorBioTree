/**
 * affiliate-format.ts — shared display formatting for affiliate deals.
 * Single source for rate/label strings so Discover and Your Deals never drift
 * (2026-09-29 bug: Discover divided a dollar amount by 100 — a $5 deal showed "$0.05").
 */

interface DealRateFields {
  deal_type: string;
  rate?: number | null;
  custom_terms?: string | null;
}

/** Human-readable deal label: "10%", "$5.00", "Free cross-promo", custom terms, or the deal type. */
export function formatDealRate(deal: DealRateFields): string {
  if (deal.deal_type === "free") return "Free cross-promo";
  if (deal.deal_type === "percentage") return `${deal.rate ?? 0}%`;
  if (deal.deal_type === "fixed") return `$${(deal.rate ?? 0).toFixed(2)}`;
  if (deal.custom_terms) return deal.custom_terms.slice(0, 50);
  return deal.deal_type;
}
