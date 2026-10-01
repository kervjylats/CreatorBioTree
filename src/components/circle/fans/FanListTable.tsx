/**
 * Fan list with quick filters, search, and CSV export (relationships.md Part 2).
 */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetchJson";
import { formatDate, money } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";

interface FanRow {
  id: string;
  email: string;
  created_at: string;
  referred_by: string | null;
  do_not_contact: boolean;
  /** Server-derived: password set → Fan, null → Follower (never the hash itself). */
  has_password: boolean;
  total_spent: number;
}

type Filter = "all" | "new" | "paid" | "subscribers" | "followers";

interface FanListTableProps {
  onSelectFan?: (fanId: string) => void;
}

/**
 * Fan status per relationships.md Part 2: any completed spend → Paid, otherwise a
 * password-less account is a Follower and "New". This used to test
 * `do_not_contact` — a CONSENT flag — so flipping it silently relabelled a fan's
 * identity (2026-10-01 audit).
 */
function statusFor(fan: FanRow): { label: string; variant: "default" | "secondary" | "outline" } {
  if (fan.total_spent > 0) return { label: "Paid", variant: "default" };
  if (!fan.has_password) return { label: "New", variant: "secondary" };
  return { label: "Follower", variant: "outline" };
}

/** Fan list with quick filters and CSV export (relationships.md Part 2). */
export function FanListTable({ onSelectFan }: FanListTableProps) {
  const [fans, setFans] = useState<FanRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJson<unknown>("/api/creator/fans/list")
      .then((data) => {
        if (Array.isArray(data)) {
          setFans(
            data.map((f: Record<string, unknown>) => ({
              id: f.id as string,
              email: f.email as string,
              created_at: f.created_at as string,
              referred_by: (f.referred_by as string) ?? null,
              do_not_contact: Boolean(f.do_not_contact),
              has_password: Boolean(f.has_password),
              total_spent: (f.total_spent as number) ?? 0,
            })),
          );
        }
      })
      .catch(() => { toast.error("Failed to load fans"); });
  }, []);

  const filtered = fans.filter((f) => {
    if (search && !f.email.toLowerCase().includes(search.toLowerCase())) return false;
    const status = statusFor(f);
    if (filter === "new" && status.label !== "New") return false;
    if (filter === "paid" && status.label !== "Paid") return false;
    if (filter === "followers" && status.label !== "Follower") return false;
    return true;
  });

  // The CSV is built by GET /api/creator/fans/export — the one exporter, with
  // proper quoting and the do-not-contact column. This used to assemble a second,
  // unquoted 5-column file in the browser that ignored the active filter
  // (2026-10-01 audit). The filter travels as a query param so the file matches
  // what the creator is looking at.
  const handleExport = () => {
    window.location.href = `/api/creator/fans/export?status=${filter}`;
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "paid", label: "Paid" },
    { key: "followers", label: "Followers" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 py-2.5">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" />
          CSV
        </Button>
      </div>
      <Input
        placeholder="Search by email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="sticky top-0 bg-muted/50 px-4 py-2.5">Email</th>
              <th className="sticky top-0 bg-muted/50 px-4 py-2.5">Joined</th>
              <th className="sticky top-0 bg-muted/50 px-4 py-2.5">Referred</th>
              <th className="sticky top-0 bg-muted/50 px-4 py-2.5">Status</th>
              <th className="sticky top-0 bg-muted/50 px-4 py-2.5 text-right">LTV</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    variant="inline"
                    title="No fans found."
                    className="py-4!"
                  />
                </td>
              </tr>
            )}
            {filtered.map((fan) => {
              const status = statusFor(fan);
              return (
                <tr
                  key={fan.id}
                  className="cursor-pointer border-b last:border-0 hover:bg-accent/30"
                  onClick={() => onSelectFan?.(fan.id)}
                >
                  <td className="px-4 py-2.5 font-medium">{fan.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatDate(fan.created_at)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{fan.referred_by ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {money(fan.total_spent)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
