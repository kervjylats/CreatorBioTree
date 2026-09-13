/** Requests inbox (network.md) — pending collab requests (incoming + outgoing). Accept/decline buttons for incoming. */
"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RequestRow {
  id: string;
  partner_info: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    tagline: string | null;
  } | null;
  direction: "incoming" | "outgoing";
}

interface InboxRequestsProps {
  onAccepted?: () => void;
}

export function InboxRequests({ onAccepted }: InboxRequestsProps) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchRequests = () => {
    fetch("/api/creator/partners/list")
      .then((r) => r.json())
      .then((d) => {
        const all = d.partnerships ?? [];
        setRequests(all);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const respond = async (partnershipId: string, action: "accept" | "decline") => {
    setActing(partnershipId);
    try {
      const res = await fetch("/api/creator/partners/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnership_id: partnershipId, action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== partnershipId));
        if (action === "accept") onAccepted?.();
      }
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">No collab requests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Requests
      </h2>
      {requests.map((r) => {
        const p = r.partner_info;
        if (!p) return null;
        return (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold text-foreground overflow-hidden">
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatar_url} alt={p.display_name} className="h-full w-full object-cover" />
              ) : (
                p.display_name
                  .split(/[\s@._-]+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? "")
                  .join("")
              )}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-foreground">{p.display_name}</span>
              <span className="text-xs text-muted-foreground">@{p.username}</span>
            </div>
            <Badge variant="outline" className="text-micro">
              {r.direction === "incoming" ? "Incoming" : "Pending"}
            </Badge>
            {r.direction === "incoming" && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={acting === r.id}
                  onClick={() => respond(r.id, "decline")}
                >
                  <X size={14} />
                </Button>
                <Button
                  size="sm"
                  disabled={acting === r.id}
                  onClick={() => respond(r.id, "accept")}
                >
                  <Check size={14} />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
