/** NetworkPage — 3-section anchored layout (network.md Layout B): left rail (My Billboard + Affiliates), center detail, right rail (My Peeps). */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";

import { CollabList } from "./CollabList";
import { CollabDetail } from "./CollabDetail";
import { BillboardPreview } from "./BillboardPreview";
import { BillboardEditor, type BillboardSettings } from "./BillboardEditor";
import { InboxRequests } from "./InboxRequests";
import { MyPeeps } from "@/components/relationships/MyPeeps";
import { FanListTable } from "@/components/relationships/FanListTable";
import { FanProfileDrawer } from "@/components/relationships/FanProfileDrawer";
import { AffiliateDiscover } from "@/components/affiliates/AffiliateDiscover";
import { EarningsSummary } from "@/components/affiliates/EarningsSummary";
import { PartnerInviteCard } from "@/components/partnership/PartnerInviteCard";

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
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [peepRow, setPeepRow] = useState<"partners" | "fans" | "staff" | null>(null);
  const [selectedFanId, setSelectedFanId] = useState<string | null>(null);
  const [fanDrawerOpen, setFanDrawerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Billboard state — loaded from API, shared between preview and editor
  const [billboard, setBillboard] = useState<BillboardSettings>(EMPTY_BILLBOARD);
  const [billboardLoading, setBillboardLoading] = useState(true);
  const [billboardSaving, setBillboardSaving] = useState(false);

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
      .catch(() => {})
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

  const doSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search/creators?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
        setSearchOpen(true);
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

      {/* Search bar */}
      <div className="relative mb-6 max-w-xl">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          placeholder="Search creators by name or username..."
          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-foreground"
        />
        {searchLoading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
            {searchResults.map((c) => (
              <Link
                key={c.id}
                href={`/${c.username}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30 first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold text-foreground overflow-hidden">
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt={c.display_name} className="h-full w-full object-cover" />
                  ) : (
                    c.display_name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-foreground">{c.display_name}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">@{c.username}</span>
                </div>
                <span className="text-xs text-primary font-medium">Visit</span>
              </Link>
            ))}
          </div>
        )}
        {searchOpen && searchResults.length === 0 && !searchLoading && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
            No creators match &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>

      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr_300px]"
      >
        {/* LEFT RAIL — My Billboard + Affiliates */}
        <aside className="space-y-6">
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

        {/* CENTER — CollabList or CollabDetail */}
        <section className="min-h-[50vh]">
          {selectedCollab ? (
            <CollabDetail
              partnershipId={selectedCollab}
              onBack={() => setSelectedCollab(null)}
            />
          ) : (
            <CollabList
              key={refreshKey}
              onSelect={setSelectedCollab}
              selectedId={selectedCollab}
            />
          )}
        </section>

        {/* RIGHT RAIL — My Peeps + Partner Invite */}
        <aside className="space-y-6">
          <InboxRequests
            key={refreshKey}
            onAccepted={() => setRefreshKey((k) => k + 1)}
          />

          <MyPeeps
            onSelectRow={(row) => setPeepRow(peepRow === row ? null : row)}
            activeRow={peepRow}
          />

          {peepRow === "fans" && (
            <FanListTable
              onSelectFan={(fanId) => {
                setSelectedFanId(fanId);
                setFanDrawerOpen(true);
              }}
            />
          )}

          {peepRow === "partners" && <PartnerInviteCard />}
        </aside>
      </div>

      <FanProfileDrawer
        fanId={selectedFanId}
        open={fanDrawerOpen}
        onOpenChange={setFanDrawerOpen}
      />
    </div>
  );
}
