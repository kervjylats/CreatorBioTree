"use client";

/**
 * Affiliate earnings summary — displays settled vs pending amounts and
 * conversion count fetched from GET /api/creator/affiliates/earnings
 * (network.md §7, monetization/creators.md Part 2e2).
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EarningsData {
  settled: number;
  pending: number;
  disputed: number;
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

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function EarningsSummary() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await fetch("/api/creator/affiliates/earnings");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Could not load earnings");
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

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

  const settled = data?.settled ?? 0;
  const pending = data?.pending ?? 0;
  const disputed = data?.disputed ?? 0;
  const total = settled + pending + disputed;
  const conversionCount = data?.conversions?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Earnings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(settled)}</p>
            <p className="text-xs text-muted-foreground">Settled</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(pending)}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(disputed)}</p>
            <p className="text-xs text-muted-foreground">Disputed</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total conversions</span>
          <Badge variant="secondary">{conversionCount}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total earned</span>
          <span className="font-semibold">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
