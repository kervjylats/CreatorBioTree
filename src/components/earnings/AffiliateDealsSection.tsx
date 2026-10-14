"use client";

/**
 * AffiliateDealsSection (earnings.md §2b) — the affiliate management block:
 * ＋ New deal → AffiliateDealForm → YourDealsCard → AffiliateLinks, sharing
 * one dealsKey. Relocated VERBATIM from the Network rail 2026-10-12 (founder
 * "A1": Network = social, Earnings = money); AffiliateDiscover died the same
 * day with Batch B (deals are negotiated in Circle/chat, never browsed).
 */
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LABEL_CLASS } from "@/lib/ui-constants";
import { AffiliateDealForm, type DealFormData } from "./AffiliateDealForm";
import { YourDealsCard } from "./YourDealsCard";
import { AffiliateLinks } from "./AffiliateLinks";

export function AffiliateDealsSection() {
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealsKey, setDealsKey] = useState(0);

  const handleDealSubmit = useCallback(async (deal: DealFormData) => {
    const res = await fetch("/api/creator/affiliates/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deal),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(typeof d.error === "string" ? d.error : "Couldn't create the deal.");
    }
    toast.success("Deal created");
    setShowDealForm(false);
    setDealsKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className={LABEL_CLASS}>Affiliate deals</h2>
        <Button
          size="sm"
          variant={showDealForm ? "secondary" : "default"}
          onClick={() => setShowDealForm((v) => !v)}
        >
          {showDealForm ? "Cancel" : "+ New deal"}
        </Button>
      </div>
      {showDealForm && (
        <AffiliateDealForm onSubmit={handleDealSubmit} onCancel={() => setShowDealForm(false)} />
      )}
      {/* One dealsKey for the whole block: a new deal must refresh Your Deals
          and Links together (2026-10-01 audit fix — carried over from the
          Network rail unchanged). */}
      <YourDealsCard refreshKey={dealsKey} />
      <AffiliateLinks refreshKey={dealsKey} />
    </div>
  );
}
