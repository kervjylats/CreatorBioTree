"use client";

/**
 * EarningsPage — root of /dashboard/earnings (earnings.md Part 1): composes
 * §1 Sales, §2 Affiliate earnings (receipts + Red Card), §2b Affiliate deals
 * & links (the management block moved from the Network rail 2026-10-12) and
 * §3 Payments. Each section fetches its own endpoint; AffiliateSection
 * reloads itself after settle actions.
 */
import { SalesSection } from "./SalesSection";
import { AffiliateSection } from "./AffiliateSection";
import { AffiliateDealsSection } from "./AffiliateDealsSection";
import { PaymentsSection } from "./PaymentsSection";

export function EarningsPage() {
  return (
    <div className="space-y-6">
      <SalesSection />
      <AffiliateSection />
      <AffiliateDealsSection />
      <PaymentsSection />
    </div>
  );
}
