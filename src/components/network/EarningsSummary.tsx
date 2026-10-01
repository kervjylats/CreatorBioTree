"use client";

/**
 * Affiliate earnings summary — settled vs pending for what this creator EARNS
 * from deals they promote, plus what they OWE on deals they own
 * (network.md §7, monetization/creators.md Part 2e2). The two are different
 * numbers with opposite meanings; the route used to blend them into one "Total
 * earned" (2026-10-01 audit).
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/format";
import { fetchJson } from "@/lib/fetchJson";

interface Totals {
  settled: number;
  pending: number;
  disputed: number;
}

interface EarningsData extends Totals {
  earned: Totals;
  owed: Totals;
  conversions: Array<{
    id: string;
    deal_id: string;
    sale_id: string;
    owner_cut: number;
    promoter_cut: number;
    settlement_status: string;
    settled_at: string | null;
  }>;
}

export function EarningsSummary({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<EarningsData>("/api/creator/affiliates/earnings")
      .then(setData)
      .catch(() => { setError("Could not load earnings"); })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading earnings...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  // `earned` = promoter cut on deals this creator promotes. `owed` = the same
  // cut on deals this creator owns (money leaving the account).
  const earned = data?.earned ?? { settled: 0, pending: 0, disputed: 0 };
  const owed = data?.owed ?? { settled: 0, pending: 0, disputed: 0 };
  const earnedTotal = earned.settled + earned.pending + earned.disputed;
  const owedTotal = owed.settled + owed.pending + owed.disputed;
  const conversionCount = data?.conversions?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Earnings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-center">
          <div className="min-w-[100px] flex-1">
            <p className="text-2xl font-bold text-green-600 truncate">{money(earned.settled)}</p>
            <p className="text-xs text-muted-foreground">Settled</p>
          </div>
          <div className="min-w-[100px] flex-1">
            <p className="text-2xl font-bold text-amber-600 truncate">{money(earned.pending)}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="min-w-[100px] flex-1">
            <p className="text-2xl font-bold text-red-600 truncate">{money(earned.disputed)}</p>
            <p className="text-xs text-muted-foreground">Disputed</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total conversions</span>
          <Badge variant="secondary">{conversionCount}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total earned</span>
          <span className="font-semibold">{money(earnedTotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Owed on your deals</span>
          <span className="font-semibold">{money(owedTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
