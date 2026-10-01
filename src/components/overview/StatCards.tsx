/**
 * OverviewStatCards — 4 stat cards: Total Sales, Total Fans, Page Views,
 * Content items. Every number arrives COMPUTED from GET /api/creator/my-app
 * (2026-10-01 audit): this widget used to read `fans_count`/`subscribers_count`
 * — fields the route never sent, masked by `?? 0`, so those cards showed 0
 * forever — and to sum catalog price tags as if they were sales. The API is the
 * brain; this is the mouth.
 */
"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, Eye, Package } from "lucide-react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetchJson";
import { money } from "@/lib/format";

interface Stats {
  totalSales: number;
  totalFans: number;
  pageViews: number;
  contentItems: number;
}

export function StatCards() {
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalFans: 0,
    pageViews: 0,
    contentItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<{
      items?: unknown[];
      fans_count?: number;
      total_sales?: number;
      page_views?: number;
    }>("/api/creator/my-app")
      .then((data) => {
        setStats({
          totalSales: data?.total_sales ?? 0,
          totalFans: data?.fans_count ?? 0,
          pageViews: data?.page_views ?? 0,
          contentItems: data?.items?.length ?? 0,
        });
      })
      .catch(() => { toast.error("Failed to load stats"); })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Total Sales",
      value: money(stats.totalSales),
      icon: DollarSign,
    },
    { label: "Total Fans", value: stats.totalFans, icon: Users },
    { label: "Page Views", value: stats.pageViews, icon: Eye },
    { label: "Content items", value: stats.contentItems, icon: Package },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <c.icon size={16} />
            <span className="text-xs font-medium">{c.label}</span>
          </div>
          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
