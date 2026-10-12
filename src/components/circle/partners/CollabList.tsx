/** Collab list (network.md) — active collabs with avatar, name, badge, and a REAL
 *  MessageIcon quick-thread (2026-10-12, was a decorative glyph). Row = div (the
 *  icon is a button — no nested buttons); the icon click stops at the icon. */
"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/shared/Avatar";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { LABEL_CLASS } from "@/lib/ui-constants";
import { MessageIcon } from "@/components/messages/MessagesShell";

interface CollabPartner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string | null;
}

interface CollabRow {
  id: string;
  status: string;
  partner_info: CollabPartner | null;
  created_at: string;
}

interface CollabListProps {
  onSelect?: (partnerId: string) => void;
  selectedId?: string | null;
}

export function CollabList({ onSelect, selectedId }: CollabListProps) {
  const [collabs, setCollabs] = useState<CollabRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<{ partnerships?: CollabRow[] }>("/api/creator/partners/list")
      .then((d) => {
        const all = (d.partnerships ?? []) as CollabRow[];
        setCollabs(all.filter((c) => c.status === "active"));
      })
      .catch(() => setCollabs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={18} />
      </div>
    );
  }

  if (collabs.length === 0) {
    return (
      <EmptyState
        title="No collabs yet"
        hint="Discover creators and send a collab request to get started."
        className="border-2! p-8!"
      />
    );
  }

  return (
    <div className="space-y-2">
      <h2 className={LABEL_CLASS}>
        Collabs
      </h2>
      {collabs.map((c) => {
        const p = c.partner_info;
        if (!p) return null;
        const isSelected = selectedId === c.id;
        return (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(c.id)}
            onKeyDown={(e) => {
              // Enter/Space on the row itself — ignores keys from the inner icon button.
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(c.id);
              }
            }}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              isSelected
                ? "border-foreground bg-accent/50"
                : "border-border bg-card hover:bg-accent/30"
            }`}
          >
            <Avatar src={p.avatar_url} name={p.display_name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold text-foreground">{p.display_name}</span>
                <Badge variant="outline" className="text-micro border-green-300 text-green-700">
                  Collab
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">Since {formatDate(c.created_at)}</span>
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <MessageIcon otherKey={p.id} otherParty="creator" name={p.display_name} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
