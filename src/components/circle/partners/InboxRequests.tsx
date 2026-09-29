/** Requests inbox (network.md) — PENDING collab requests (incoming + outgoing). Accept/decline buttons for incoming. */
"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { LABEL_CLASS } from "@/lib/ui-constants";

interface RequestRow {
  id: string;
  status: string;
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
    fetchJson<{ partnerships?: RequestRow[] }>("/api/creator/partners/list")
      .then((d) => {
        const all = (d.partnerships ?? []) as RequestRow[];
        setRequests(all.filter((p) => p.status === "pending"));
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
        <Spinner size={16} />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState title="No collab requests yet" className="p-6!" />
    );
  }

  return (
    <div className="space-y-2">
      <h2 className={LABEL_CLASS}>
        Requests
      </h2>
      {requests.map((r) => {
        const p = r.partner_info;
        if (!p) return null;
        return (
          <Card
            key={r.id}
            className="flex items-center gap-3 p-3"
          >
            <Avatar src={p.avatar_url} name={p.display_name} />
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
          </Card>
        );
      })}
    </div>
  );
}
