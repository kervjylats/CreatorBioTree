/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon:        string;
  label:       string;
  value:       number | string;
  sub?:        string;
  change?:     number | null;
  isString?:   boolean;
  accentColor?: string;
  onClick?:    () => void;
}

export function StatCard({
  icon, label, value, sub, change, isString, accentColor, onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-border bg-white p-6 shadow-sm ${onClick ? "cursor-pointer hover:border-[#5A6A4A] transition-colors" : ""}`}
    >
      <div className="mb-3 text-2xl">{icon}</div>
      <div className="text-3xl font-bold text-foreground">
        {isString ? value : (value as number).toLocaleString()}
      </div>
      <div className="mt-1 text-sm text-muted">{label}</div>
      {(sub || change !== null && change !== undefined) && (
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {sub && <span className="text-xs text-gray-400">{sub}</span>}
          {change !== null && change !== undefined && accentColor && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: change >= 0 ? accentColor + "15" : "#fee2e2",
                color:           change >= 0 ? accentColor         : "#dc2626",
              }}
            >
              {change >= 0 ? "↑" : "↓"}{Math.abs(change)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ViewsBarChart ──────────────────────────────────────────────────────────

interface ViewsByDay {
  date: string;
  count: number;
}

export function ViewsBarChart({
  data,
  accentColor,
}: {
  data: ViewsByDay[];
  accentColor: string;
}) {
  const maxBarCount = Math.max(...(data?.map(d => d.count) ?? []), 1);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        No views in this period yet.
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1" style={{ height: "160px" }}>
      {data.map((d, i) => {
        const heightPct = (d.count / maxBarCount) * 100;
        const date = new Date(d.date);
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center gap-1"
          >
            <div className="absolute bottom-full mb-1 hidden rounded-lg bg-gray-900 px-2 py-1 text-center text-[10px] text-white group-hover:block whitespace-nowrap">
              {d.count} view{d.count !== 1 ? "s" : ""}<br />
              {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </div>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height:          `${Math.max(heightPct, 2)}%`,
                  backgroundColor: isToday ? accentColor : accentColor + "55",
                }}
              />
            </div>
            {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
              <span className="text-[9px] text-gray-400">
                {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TopContentList ─────────────────────────────────────────────────────────

interface TopContentItem {
  title: string;
  clicks: number;
  type: string;
}

const CONTENT_TYPE_ICONS: Record<string, string> = {
  link:    "🔗",
  audio:   "🎵",
  video:   "🎬",
  pdf:     "📄",
  product: "🛍️",
  course:  "📚",
  session: "📅",
  image:   "🖼️",
  page:    "📃",
};

export function TopContentList({
  items,
  accentColor,
}: {
  items: TopContentItem[];
  accentColor: string;
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No content views yet.</p>;
  }

  const maxClicks = items[0].clicks || 1;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-base">{CONTENT_TYPE_ICONS[item.type] ?? "📌"}</span>
              <span className="truncate text-xs font-medium text-gray-800">{item.title}</span>
            </div>
            <span className="shrink-0 text-xs font-semibold text-gray-500">
              {item.clicks.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item.clicks / maxClicks) * 100}%`, backgroundColor: accentColor }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ReferrerList ───────────────────────────────────────────────────────────

interface Referrer {
  source: string;
  count: number;
}

export function ReferrerList({ referrers }: { referrers: Referrer[] }) {
  const [accentColor] = useState("#5A6A4A");
  const totalReferrers = referrers.reduce((sum, r) => sum + r.count, 0);

  if (referrers.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No traffic source data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {referrers.map((r, i) => {
        const pct = totalReferrers > 0 ? Math.round((r.count / totalReferrers) * 100) : 0;
        return (
          <div key={i}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-gray-800">{r.source}</span>
              <span className="shrink-0 text-xs font-semibold text-gray-500">
                {r.count} · {pct}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: accentColor + "99" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
