"use client";

/**
 * SalesSection (earnings.md §1) — what fans paid you: server-summed total +
 * recent sales table from GET /api/creator/earnings/sales. Never sums
 * client-side (the API computes, the widget displays — 2026-10-01 law).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money, formatDate } from "@/lib/format";
import { fetchJson } from "@/lib/fetchJson";

interface SaleRow {
  id: string;
  title: string;
  fan_email: string | null;
  amount_paid: number;
  currency: string;
  purchased_at: string | null;
}

interface SalesData {
  sales: SaleRow[];
  total: number;
  currency: string;
  count: number;
}

export function SalesSection({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<SalesData>("/api/creator/earnings/sales")
      .then(setData)
      .catch(() => setError("Could not load sales"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Loading sales...</p>}
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {data && (
          <>
            <div>
              <p className="text-3xl font-bold text-foreground truncate">
                {money(data.total, data.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total sales · {data.count} completed
              </p>
            </div>
            {data.sales.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sales yet —{" "}
                <Link href="/dashboard/playground" className="underline text-foreground">
                  add items in Playground
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {data.sales.map((sale) => (
                  <li key={sale.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sale.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {sale.fan_email ?? "Guest"} ·{" "}
                        {sale.purchased_at ? formatDate(sale.purchased_at) : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary">Completed</Badge>
                      <span className="text-sm font-semibold">
                        {money(sale.amount_paid, sale.currency)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
