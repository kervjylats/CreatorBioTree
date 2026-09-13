/**
 * OverviewStatCards — 4 stat cards: Total Sales, Total Fans, Page Views,
 * Subscribers. Fetches creator data from GET /api/creator/my-app.
 */
"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, Eye, Heart } from "lucide-react";

interface Stats {
  totalSales: number;
  totalFans: number;
  pageViews: number;
  subscribers: number;
}

export function StatCards() {
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalFans: 0,
    pageViews: 0,
    subscribers: 0,
  });

  useEffect(() => {
    fetch("/api/creator/my-app")
      .then((r) => r.json())
      .then((data) => {
        const items = data?.items ?? [];
        const totalSales = items.reduce(
          (sum: number, item: Record<string, unknown>) => sum + ((item.price as number) ?? 0),
          0,
        );
        setStats({
          totalSales,
          totalFans: data?.fans_count ?? 0,
          pageViews: data?.page_views ?? 0,
          subscribers: data?.subscribers_count ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: "Total Sales",
      value: `$${(stats.totalSales / 100).toFixed(2)}`,
      icon: DollarSign,
    },
    { label: "Total Fans", value: stats.totalFans, icon: Users },
    { label: "Page Views", value: stats.pageViews, icon: Eye },
    { label: "Subscribers", value: stats.subscribers, icon: Heart },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <c.icon size={16} />
            <span className="text-xs font-medium">{c.label}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
