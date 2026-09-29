/**
 * NetworkPage — hub for the creator Network (network.md Layout): LEFT rail
 * (Billboard + Affiliates), CENTER = Discover grid (search creators + Connect /
 * Visit). My Peeps + collabs/fans/staff live in their own sub-screens via the
 * floating MyPeeps dock. Mock + real ready.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/shared/Avatar";
import { fetchJson } from "@/lib/fetchJson";
import { useCreatorSearch, type CreatorSearchResult } from "@/hooks/useCreatorSearch";
import { SearchBox } from "@/components/shared/SearchBox";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";

import { BillboardPreview } from "./BillboardPreview";
import { BillboardEditor, type BillboardSettings } from "./BillboardEditor";
import { AffiliateDiscover } from "@/components/network/AffiliateDiscover";
import { EarningsSummary } from "@/components/network/EarningsSummary";
import { AffiliateLinks } from "@/components/network/AffiliateLinks";
import { AffiliateDealForm, type DealFormData } from "@/components/network/AffiliateDealForm";
import { YourDealsCard } from "@/components/network/YourDealsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LABEL_CLASS } from "@/lib/ui-constants";

const EMPTY_BILLBOARD: BillboardSettings = {
  display_name: "",
  username: "",
  avatar_url: null,
  tagline: "",
  tags: [],
  collab_style: "",
  show_in_search: true,
  open_to_collab: true,
  bio: "",
  rate_card: { post: "", story: "", video: "" },
  media_kit_message: "",
};

export function NetworkPage() {
  const [billboard, setBillboard] = useState<BillboardSettings>(EMPTY_BILLBOARD);
  const [billboardLoading, setBillboardLoading] = useState(true);
  const [billboardSaving, setBillboardSaving] = useState(false);

  const [showDealForm, setShowDealForm] = useState(false);
  const [dealsKey, setDealsKey] = useState(0);

  const { query, setQuery, results: searchResults, loading: searchLoading, search } = useCreatorSearch();
  const [connectState, setConnectState] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchJson<Partial<BillboardSettings>>("/api/creator/partners/billboard")
      .then((d) =>
        setBillboard({
          display_name: d.display_name ?? "",
          username: d.username ?? "",
          avatar_url: d.avatar_url ?? null,
          tagline: d.tagline ?? "",
          tags: d.tags ?? [],
          collab_style: d.collab_style ?? "",
          show_in_search: d.show_in_search ?? true,
          open_to_collab: d.open_to_collab ?? true,
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
      const d = await fetchJson<Partial<BillboardSettings>>("/api/creator/partners/billboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: billboard.tagline,
          tags: billboard.tags,
          collab_style: billboard.collab_style,
          show_in_search: billboard.show_in_search,
          open_to_collab: billboard.open_to_collab,
          bio: billboard.bio,
          rate_card: billboard.rate_card,
          media_kit_message: billboard.media_kit_message,
        }),
      }).catch(() => null);
      if (d) {
        setBillboard((prev) => ({
          ...prev,
          tagline: d.tagline ?? "",
          tags: d.tags ?? [],
          collab_style: d.collab_style ?? "",
          show_in_search: d.show_in_search ?? true,
          open_to_collab: d.open_to_collab ?? true,
          bio: d.bio ?? "",
          rate_card: d.rate_card ?? prev.rate_card,
          media_kit_message: d.media_kit_message ?? "",
        }));
      }
    } finally {
      setBillboardSaving(false);
    }
  }, [billboard]);

  // Visibility switches save instantly (independent of the Save Billboard button).
  const handleInstantToggle = useCallback(
    async (field: "show_in_search" | "open_to_collab") => {
      setBillboard((prev) => ({ ...prev, [field]: !prev[field] }));
      await fetch("/api/creator/partners/billboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !billboard[field] }),
      });
    },
    [billboard],
  );

  const handleDealSubmit = useCallback(async (deal: DealFormData) => {
    const res = await fetch("/api/creator/affiliates/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deal),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(typeof d.error === "string" ? d.error : "Couldn't create the deal.");
    }
    toast.success("Deal created");
    setShowDealForm(false);
    setDealsKey((k) => k + 1);
  }, []);

  const handleConnect = useCallback(async (creator: CreatorSearchResult) => {
    if (connectState[creator.id] === "loading") return;
    setConnectState((prev) => ({ ...prev, [creator.id]: "loading" }));
    try {
      const res = await fetch("/api/creator/partners/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: creator.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setConnectState((prev) => ({ ...prev, [creator.id]: "requested" }));
      } else if (data.error === "Request already pending") {
        setConnectState((prev) => ({ ...prev, [creator.id]: "requested" }));
      } else if (data.error === "Already connected") {
        setConnectState((prev) => ({ ...prev, [creator.id]: "connected" }));
      } else {
        setConnectState((prev) => ({ ...prev, [creator.id]: "error" }));
        toast.error(typeof data.error === "string" ? data.error : "Couldn't send the request.");
      }
    } catch {
      setConnectState((prev) => ({ ...prev, [creator.id]: "error" }));
      toast.error("Couldn't send the request.");
    }
  }, [connectState]);

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Network</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover creators, form collabs, and manage your connections.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]">
        {/* LEFT RAIL — Billboard + Affiliates */}
        <aside className="order-2 space-y-6 md:order-1">
          {billboardLoading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner size={16} />
            </div>
          ) : (
            <BillboardPreview
              displayName={billboard.display_name}
              username={billboard.username}
              avatarUrl={billboard.avatar_url}
              tagline={billboard.tagline}
              tags={billboard.tags}
              collabStyle={billboard.collab_style}
              showInSearch={billboard.show_in_search}
              onToggleVisibility={() => handleInstantToggle("show_in_search")}
            />
          )}
          <BillboardEditor
            settings={billboard}
            onFieldChange={handleBillboardChange}
            onSave={handleBillboardSave}
            saving={billboardSaving}
            onInstantToggle={handleInstantToggle}
          />
          {/* Affiliate block (network.md §7): deal maker → your deals → earnings → discover → links */}
          <div className="flex items-center justify-between gap-2">
            <h2 className={LABEL_CLASS}>
              Affiliates
            </h2>
            <Button
              size="sm"
              variant={showDealForm ? "secondary" : "default"}
              onClick={() => setShowDealForm((v) => !v)}
            >
              {showDealForm ? "Cancel" : "+ New deal"}
            </Button>
          </div>
          {showDealForm && (
            <AffiliateDealForm onSubmit={handleDealSubmit} onCancel={() => setShowDealForm(false)} />
          )}
          <YourDealsCard refreshKey={dealsKey} />
          <EarningsSummary />
          <AffiliateDiscover />
          <AffiliateLinks />
        </aside>

        {/* CENTER — Discover grid */}
        <section className="order-1 md:order-2">
          <SearchBox
            value={query}
            onChange={(v) => {
              setQuery(v);
              search(v);
            }}
            loading={searchLoading}
            className="mb-4"
          />

          <h2 className={`mb-3 ${LABEL_CLASS}`}>
            Discover
          </h2>

          {query.trim() === "" ? (
            <EmptyState
              title="Find creators to collab with"
              hint="Search by name or link address, then send a Connect request."
            />
          ) : searchResults.length === 0 && !searchLoading ? (
            <EmptyState title={`No creators match \u201C${query}\u201D`} />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {searchResults.map((c) => {
                const state = connectState[c.id] ?? "";
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/30"
                  >
                    <Avatar src={c.avatar_url} name={c.display_name} />
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
