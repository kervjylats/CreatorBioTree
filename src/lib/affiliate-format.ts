/**
 * affiliate-format.ts — shared display formatting for affiliate deals.
 * Single source for rate/label strings so Discover and Your Deals never drift
 * (2026-09-29 bug: Discover divided a dollar amount by 100 — a $5 deal showed "$0.05").
 */
import { money } from "@/lib/format";

interface DealRateFields {
  deal_type: string;
  rate?: number | null;
  custom_terms?: string | null;
}

/**
 * Human-readable deal label: "10%", "$5.00", "Free cross-promo", custom terms, or the deal type.
 * Fixed amounts go through money() so this card matches every other money string
 * on the page (it used to hand-roll `$${rate.toFixed(2)}`). Deals carry no currency
 * column, so the platform default (USD) applies — see docs/AUDIT_REPORT.md #34.
 */
export function formatDealRate(deal: DealRateFields): string {
  if (deal.deal_type === "free") return "Free cross-promo";
  if (deal.deal_type === "percentage") return `${deal.rate ?? 0}%`;
  if (deal.deal_type === "fixed") return money(deal.rate ?? 0);
  if (deal.custom_terms) return deal.custom_terms.slice(0, 50);
  return deal.deal_type;
}
