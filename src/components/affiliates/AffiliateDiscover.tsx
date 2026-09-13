"use client";

/**
 * Affiliate discover — browse open affiliate deals from other creators
 * and create a link to promote them (network.md §7). Fetches from
 * GET /api/creator/affiliates/discover.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  owner_id: string;
  promoter_id: string;
  scope: string;
  item_id: string | null;
  deal_type: string;
  trigger: string;
  rate: number | null;
  custom_terms: string | null;
  status: string;
  created_at: string;
}

function formatRate(deal: Deal): string {
  if (deal.deal_type === "percentage") return `${deal.rate ?? 0}%`;
  if (deal.deal_type === "fixed") return `$${((deal.rate ?? 0) / 100).toFixed(2)}`;
  if (deal.deal_type === "free") return "Free cross-promo";
  return deal.custom_terms?.slice(0, 50) ?? "Custom";
}

export function AffiliateDiscover() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingLink, setCreatingLink] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch("/api/creator/affiliates/discover");
        if (res.ok) {
          const json = await res.json();
          setDeals(json.deals ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  async function handleCreateLink(dealId: string) {
    setCreatingLink(dealId);
    try {
      const res = await fetch("/api/creator/affiliates/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId }),
      });
      if (res.ok) {
        setDeals((prev) => prev.filter((d) => d.id !== dealId));
      }
    } finally {
      setCreatingLink(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading available deals...
        </CardContent>
      </Card>
    );
  }

  if (deals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No affiliate deals available right now. Check back later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Available Deals</h2>
      {deals.map((deal) => (
        <Card key={deal.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{formatRate(deal)}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{deal.deal_type}</Badge>
                <Badge variant="secondary">{deal.trigger}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span>Scope: {deal.scope}</span>
                {deal.item_id && <span className="ml-2">• Item: {deal.item_id}</span>}
              </div>
              <Button
                size="sm"
                onClick={() => handleCreateLink(deal.id)}
                disabled={creatingLink === deal.id}
              >
                {creatingLink === deal.id ? "Creating..." : "Create link"}
              </Button>
            </div>
            {deal.custom_terms && (
              <p className="mt-2 text-xs text-muted-foreground">{deal.custom_terms}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
