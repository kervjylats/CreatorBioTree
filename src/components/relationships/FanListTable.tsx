/**
 * Fan list with quick filters, search, and CSV export (relationships.md Part 2).
 */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

interface FanRow {
  id: string;
  email: string;
  created_at: string;
  referred_by: string | null;
  do_not_contact: boolean;
  total_spent: number;
}

type Filter = "all" | "new" | "paid" | "subscribers" | "followers";

interface FanListTableProps {
  onSelectFan?: (fanId: string) => void;
}

function statusFor(fan: FanRow): { label: string; variant: "default" | "secondary" | "outline" } {
  if (!fan.do_not_contact && fan.total_spent === 0) return { label: "New", variant: "secondary" };
  if (fan.total_spent > 0) return { label: "Paid", variant: "default" };
  return { label: "Follower", variant: "outline" };
}

/** Fan list with quick filters and CSV export (relationships.md Part 2). */
export function FanListTable({ onSelectFan }: FanListTableProps) {
  const [fans, setFans] = useState<FanRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/creator/fans/list")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFans(
            data.map((f: Record<string, unknown>) => ({
              id: f.id as string,
              email: f.email as string,
              created_at: f.created_at as string,
              referred_by: (f.referred_by as string) ?? null,
              do_not_contact: Boolean(f.do_not_contact),
              total_spent: (f.total_spent as number) ?? 0,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const filtered = fans.filter((f) => {
    if (search && !f.email.toLowerCase().includes(search.toLowerCase())) return false;
    const status = statusFor(f);
    if (filter === "new" && status.label !== "New") return false;
    if (filter === "paid" && status.label !== "Paid") return false;
    if (filter === "followers" && status.label !== "Follower") return false;
    return true;
  });

  const handleExport = () => {
    const header = "email,joined,referred_by,status,lifetime_value\n";
    const rows = filtered
      .map((f) => {
        const s = statusFor(f);
        return `${f.email},${f.created_at},${f.referred_by ?? ""},${s.label},${f.total_spent}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fans-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "paid", label: "Paid" },
    { key: "followers", label: "Followers" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gapx-4 py-2.5">
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
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Joined</th>
              <th className="px-4 py-2.5">Referred</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">LTV</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  No fans found.
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
                    {new Date(fan.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{fan.referred_by ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    ${fan.total_spent.toFixed(2)}
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
