/**
 * Earnings screen at /dashboard/earnings — the one money screen (earnings.md):
 * §1 Sales, §2 Affiliate earnings (receipts + Red Card), §3 Payments.
 * Auth guard via requireAuth() in the dashboard layout.
 */
import type { Metadata } from "next";
import { EarningsPage } from "@/components/earnings/EarningsPage";

export const metadata: Metadata = {
  title: "Earnings",
};

export default function EarningsScreen() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-sm text-muted-foreground">
          What fans paid you and what you owe your affiliates — report only, no balance held.
        </p>
      </div>
      <EarningsPage />
    </main>
  );
}
