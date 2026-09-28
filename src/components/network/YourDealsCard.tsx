"use client";

/**
 * YourDealsCard — Network rail window into the creator's affiliate deals:
 * lists GET /api/creator/affiliates/deals with status pills plus pause/resume
 * (PATCH) and revoke (DELETE) actions, newest first (network.md §7).
 * Refetches when `refreshKey` bumps after a deal is created.
 */
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Deal {
  id: string;
  scope: "item" | "creator";
  deal_type: string;
  trigger: string;
  rate: number | null;
  status: string;
  is_owner?: boolean;
  created_at: string;
  custom_terms?: string | null;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  paused: "secondary",
  expired: "outline",
  revoked: "outline",
};

function dealLabel(deal: Deal): string {
  if (deal.deal_type === "free") return "Free cross-promo";
  if (deal.deal_type === "fixed") return `$${deal.rate ?? 0}`;
  if (deal.deal_type === "percentage") return `${deal.rate ?? 0}%`;
  if (deal.custom_terms) return deal.custom_terms.slice(0, 40);
  return deal.deal_type;
}

export function YourDealsCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/affiliates/deals");
      if (res.ok) {
        const data = await res.json();
        setDeals(Array.isArray(data.deals) ? data.deals : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function setStatus(id: string, status: "active" | "paused") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/creator/affiliates/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(status === "paused" ? "Deal paused" : "Deal resumed");
        await load();
      } else {
        toast.error("Couldn't update the deal");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/creator/affiliates/deals/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deal revoked");
        await load();
      } else {
        toast.error("Couldn't revoke the deal");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your deals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : deals.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No deals yet — hit “New deal” to create your first.
          </p>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-foreground">
                  {dealLabel(deal)} · {deal.trigger}
                </span>
                <Badge
                  variant={STATUS_VARIANT[deal.status] ?? "secondary"}
                  className={`shrink-0 text-micro ${deal.status === "revoked" ? "text-destructive" : ""}`}
                >
                  {deal.status}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {deal.scope === "item" ? "Per-item" : "Per-creator"} ·{" "}
                {new Date(deal.created_at).toLocaleDateString()}
                {!deal.is_owner && " · you promote this"}
              </p>
              {deal.is_owner && (deal.status === "active" || deal.status === "paused") && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={busyId === deal.id}
                    onClick={() => setStatus(deal.id, deal.status === "active" ? "paused" : "active")}
                  >
                    {deal.status === "active" ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-destructive"
                    disabled={busyId === deal.id}
                    onClick={() => revoke(deal.id)}
                  >
                    Revoke
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
