/** Collab list (network.md) — shows active collabs with avatar, name, and chat icon. Fetches from GET /api/creator/partners/list. */
"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollabPartner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string | null;
}

interface CollabRow {
  id: string;
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
    fetch("/api/creator/partners/list")
      .then((r) => r.json())
      .then((d) => setCollabs(d.partnerships ?? []))
      .catch(() => setCollabs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (collabs.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">No collabs yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Discover creators and send a collab request to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Collabs
      </h2>
      {collabs.map((c) => {
        const p = c.partner_info;
        if (!p) return null;
        const isSelected = selectedId === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect?.(c.id)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              isSelected
                ? "border-foreground bg-accent/50"
                : "border-border bg-card hover:bg-accent/30"
            }`}
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
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold text-foreground">{p.display_name}</span>
                <Badge variant="outline" className="text-micro border-green-300 text-green-700">
                  Collab
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">Since {new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <MessageCircle size={16} className="shrink-0 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}
