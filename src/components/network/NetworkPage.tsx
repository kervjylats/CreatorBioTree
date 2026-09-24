/**
 * NetworkPage — hub for the creator Network (network.md Layout): LEFT rail
 * (Billboard + Affiliates), CENTER = Discover grid (search creators + Connect /
 * Visit). My Peeps + collabs/fans/staff live in their own sub-screens via the
 * floating MyPeeps dock. Mock + real ready.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

import { BillboardPreview } from "./BillboardPreview";
import { BillboardEditor, type BillboardSettings } from "./BillboardEditor";
import { AffiliateDiscover } from "@/components/affiliates/AffiliateDiscover";
import { EarningsSummary } from "@/components/affiliates/EarningsSummary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  is_featured: boolean | null;
}

const EMPTY_BILLBOARD: BillboardSettings = {
  display_name: "",
  username: "",
  avatar_url: null,
  tagline: "",
  tags: [],
  collab_style: "",
  is_discoverable: true,
  bio: "",
  rate_card: { post: "", story: "", video: "" },
  media_kit_message: "",
};

export function NetworkPage() {
  const [billboard, setBillboard] = useState<BillboardSettings>(EMPTY_BILLBOARD);
  const [billboardLoading, setBillboardLoading] = useState(true);
  const [billboardSaving, setBillboardSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [connectState, setConnectState] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    fetch("/api/creator/partners/billboard")
      .then((r) => r.json())
      .then((d) =>
        setBillboard({
          display_name: d.display_name ?? "",
          username: d.username ?? "",
          avatar_url: d.avatar_url ?? null,
          tagline: d.tagline ?? "",
          tags: d.tags ?? [],
          collab_style: d.collab_style ?? "",
          is_discoverable: d.is_discoverable ?? true,
          bio: d.bio ?? "",
          rate_card: d.rate_card ?? { post: "", story: "", video: "" },
          media_kit_message: d.media_kit_message ?? "",
        })
      )
      .catch(() => { toast.error("Failed to load billboard"); })
      .finally(() => setBillboardLoading(false));
  }, []);

  const handleBillboardChange = useCallback((partial: Partial<BillboardSettings>) => {
    setBillboard((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleBillboardSave = useCallback(async () => {
    setBillboardSaving(true);
    try {
      const res = await fetch("/api/creator/partners/billboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: billboard.tagline,
          tags: billboard.tags,
          collab_style: billboard.collab_style,
          is_discoverable: billboard.is_discoverable,
          bio: billboard.bio,
          rate_card: billboard.rate_card,
          media_kit_message: billboard.media_kit_message,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setBillboard((prev) => ({
          ...prev,
          tagline: d.tagline ?? "",
          tags: d.tags ?? [],
          collab_style: d.collab_style ?? "",
          is_discoverable: d.is_discoverable ?? true,
          bio: d.bio ?? "",
          rate_card: d.rate_card ?? prev.rate_card,
          media_kit_message: d.media_kit_message ?? "",
        }));
      }
    } finally {
      setBillboardSaving(false);
    }
  }, [billboard]);

  const handleToggleVisibility = useCallback(async () => {
    const next = !billboard.is_discoverable;
    setBillboard((prev) => ({ ...prev, is_discoverable: next }));
    await fetch("/api/creator/partners/billboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_discoverable: next }),
    });
  }, [billboard.is_discoverable]);

  const handleConnect = useCallback(async (creator: SearchResult) => {
    if (connectState[creator.id] === "loading") return;
    setConnectState((prev) => ({ ...prev, [creator.id]: "loading" }));
    try {
      const res = await fetch("/api/creator/partners/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: creator.id }),
      });
      const data = await res.json();
      if (res.ok || data.error === "Request already pending") {
        setConnectState((prev) => ({ ...prev, [creator.id]: "requested" }));
      } else {
        setConnectState((prev) => ({ ...prev, [creator.id]: "connected" }));
      }
    } catch {
      setConnectState((prev) => ({ ...prev, [creator.id]: "error" }));
    }
  }, [connectState]);

  const doSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search/creators?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Network</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover creators, form collabs, and manage your connections.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
        {/* LEFT RAIL — Billboard + Affiliates */}
        <aside className="order-2 space-y-6 lg:order-1">
          {billboardLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BillboardPreview
              displayName={billboard.display_name}
              username={billboard.username}
              avatarUrl={billboard.avatar_url}
              tagline={billboard.tagline}
              tags={billboard.tags}
              collabStyle={billboard.collab_style}
              isVisible={billboard.is_discoverable}
              onToggleVisibility={handleToggleVisibility}
            />
          )}
          <BillboardEditor
            settings={billboard}
            onFieldChange={handleBillboardChange}
            onSave={handleBillboardSave}
            saving={billboardSaving}
          />
          <AffiliateDiscover />
          <EarningsSummary />
        </aside>

        {/* CENTER — Discover grid */}
        <section className="order-1 lg:order-2">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
              placeholder="Search creators by name or username..."
              className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-foreground"
            />
            {searchLoading && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Discover
          </h2>

          {searchQuery.trim() === "" ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm font-medium text-foreground">Find creators to collab with</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Search by name or link address, then send a Connect request.
              </p>
            </div>
          ) : searchResults.length === 0 && !searchLoading ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No creators match &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {searchResults.map((c) => {
                const state = connectState[c.id] ?? "";
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold text-foreground overflow-hidden">
                      {c.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatar_url} alt={c.display_name} className="h-full w-full object-cover" />
                      ) : (
                        c.display_name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-foreground">{c.display_name}</span>
                        {c.is_featured && (
                          <Badge variant="secondary" className="text-micro">Featured</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">@{c.username}</span>
                      {c.tagline && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground/70">{c.tagline}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <Button
                        size="sm"
                        variant={state === "connected" ? "outline" : "default"}
                        disabled={["loading", "requested", "connected"].includes(state)}
                        onClick={() => handleConnect(c)}
                      >
                        {state === "loading"
                          ? "…"
                          : state === "requested"
                            ? "Requested"
                            : state === "connected"
                              ? "Connected"
                              : "Connect"}
                      </Button>
                      <Link
                        href={`/${c.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 text-xs font-medium text-primary"
                      >
                        Visit <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}