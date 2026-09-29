/** Collab detail panel (network.md) — shows profile info and deal history for a selected collab partner. */
"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatIcon } from "@/components/messages/ChatShell";
import { Avatar } from "@/components/shared/Avatar";
import { fetchJson } from "@/lib/fetchJson";
import { formatDate } from "@/lib/format";
import { Spinner } from "@/components/shared/Spinner";
import { toast } from "sonner";

interface CollabPartner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string | null;
}

interface CollabDetailProps {
  partnershipId: string;
  onBack?: () => void;
}

export function CollabDetail({ partnershipId, onBack }: CollabDetailProps) {
  const [partner, setPartner] = useState<CollabPartner | null>(null);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJson<{ partnerships?: Array<{ id: string; partner_info: CollabPartner | null; created_at: string }> }>(
      "/api/creator/partners/list"
    )
      .then((d) => {
        const row = (d.partnerships ?? []).find((p) => p.id === partnershipId);
        if (row) {
          setPartner(row.partner_info);
          setCreatedAt(row.created_at);
        }
      })
      .catch(() => { toast.error("Failed to load partner"); })
      .finally(() => setLoading(false));
  }, [partnershipId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={18} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Collab not found</p>
        {onBack && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={onBack}>
            Back to list
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-1">
          <ArrowLeft size={14} />
          Back
        </Button>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Avatar src={partner.avatar_url} name={partner.display_name} size="h-14 w-14" textClass="text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 text-base font-bold text-foreground">{partner.display_name}</h3>
              <Badge variant="outline" className="shrink-0 text-micro border-green-300 text-green-700">Collab</Badge>
              {partner.id && (
                <ChatIcon
                  otherKey={partner.id}
                  otherParty="creator"
                  name={partner.display_name}
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground">@{partner.username}</span>
            {partner.tagline && (
              <p className="mt-0.5 text-xs text-muted-foreground/70">{partner.tagline}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Connected since {formatDate(createdAt)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Deal history will appear here.</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Configure affiliate deals from the Affiliates section.
        </p>
      </div>

      <a
        href={`/${partner.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-foreground underline underline-offset-2 hover:text-foreground/80"
      >
        Visit their page
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
