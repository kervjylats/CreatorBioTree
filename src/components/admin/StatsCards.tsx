/**
 * AdminStatsCards — platform-wide stat cards (admin.md Part 3): total creators,
 * total fans, content items, total revenue. Fetches from GET /api/admin/stats.
 */
"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetchJson";
import { money } from "@/lib/format";

interface Stats {
  total_creators?: number;
  total_fans?: number;
  total_content?: number;
  total_revenue?: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    fetchJson<Stats>("/api/admin/stats")
      .then(setStats)
      .catch(() => { toast.error("Failed to load stats"); });
  }, []);

  const cards = [
    { label: "Total Creators", value: stats.total_creators ?? 0, icon: Users },
    { label: "Total Fans", value: stats.total_fans ?? 0, icon: UserCheck },
    { label: "Content Items", value: stats.total_content ?? 0, icon: FileText },
    { label: "Total Revenue", value: money(stats.total_revenue ?? 0), icon: DollarSign },
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
