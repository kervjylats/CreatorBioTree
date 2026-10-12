/**
 * NetworkPage — hub for the creator Network (network.md): LEFT rail = the
 * billboard mirror only, CENTER = Discover (collab-switch card + default collab
 * list + typed search, Modal A + billboard nudge 2026-10-07, FB model — search
 * always on, one switch, no greying 2026-10-09; design editors moved to
 * Playground → Billboard view 2026-10-09). **The affiliate block moved to the
 * Earnings screen §2b on 2026-10-12 (A1 — Network = social).** Sub-screens via
 * the MyPeeps dock. Mock + real ready.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Shuffle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/shared/Avatar";
import { fetchJson } from "@/lib/fetchJson";
import { useCreatorSearch, type CreatorSearchResult } from "@/hooks/useCreatorSearch";
import { SearchBox } from "@/components/shared/SearchBox";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";

import { BillboardPreview } from "./BillboardPreview";
import { NetworkSettings } from "./NetworkSettings";
import { CreatorBillboardModal } from "./CreatorBillboardModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LABEL_CLASS } from "@/lib/ui-constants";

/** Fisher–Yates shuffle of the collab list — Featured pinned first (network.md §1,
 *  same pattern as the landing marquee). */
function shuffleCollabList(results: CreatorSearchResult[]): CreatorSearchResult[] {
  const featured = results.filter((c) => c.is_featured);
  const rest = results.filter((c) => !c.is_featured);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...featured, ...rest];
}

/** Discover renders in batches of 24 (feed + search) with a "Show more" button
 *  (network.md §1, founder 2026-10-09 — must scale to many users; production
 *  switches to server-side random batches, ORDER BY random() LIMIT 24). The
 *  list reshuffles on every Network visit/refresh + on-demand via Shuffle. */
const FEED_BATCH = 24;

/** The rail only needs the mirror + switch fields — design fields live in
 *  Playground's Billboard view since 2026-10-09 (playground.md Part 1d).
 *  `show_in_search` is parked (FB model 2026-10-09) — only open_to_collab. */
interface BillboardRailState {
  display_name: string;
  username: string;
  avatar_url: string | null;
  tagline: string;
  tags: string[];
  collab_style: string;
  open_to_collab: boolean;
}

const EMPTY_BILLBOARD: BillboardRailState = {
  display_name: "",
  username: "",
  avatar_url: null,
  tagline: "",
  tags: [],
  collab_style: "",
  open_to_collab: true,
};

export function NetworkPage() {
  const router = useRouter();
  const [billboard, setBillboard] = useState<BillboardRailState>(EMPTY_BILLBOARD);
  const [billboardLoading, setBillboardLoading] = useState(true);

  const { query, setQuery, results: searchResults, loading: searchLoading, search } = useCreatorSearch();
  const [connectState, setConnectState] = useState<Record<string, string>>({});

  // Discover default view + Modal A + billboard nudge (network.md §1/§3;
  // nudge retargeted to "first visit while undesigned" 2026-10-09)
  const [defaultList, setDefaultList] = useState<CreatorSearchResult[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [modalCreator, setModalCreator] = useState<CreatorSearchResult | null>(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  // Batches of FEED_BATCH for both the feed and typed search (fresh batch on
  // every query change; Show more reveals the next 24 from memory).
  const [visibleCount, setVisibleCount] = useState(FEED_BATCH);

  useEffect(() => {
    setVisibleCount(FEED_BATCH);
  }, [query]);

  /** On-demand reroll of the default collab list — same Fisher–Yates, no page
   *  reload (the per-visit reshuffle already happens on Network mount). */
  const handleShuffle = useCallback(() => {
    setDefaultList((prev) => shuffleCollabList(prev));
    setVisibleCount(FEED_BATCH);
  }, []);

  /** Show-more footer for either view — hidden while every card is visible. */
  const renderShowMore = (total: number) =>
    visibleCount < total ? (
      <div className="mt-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVisibleCount((c) => c + FEED_BATCH)}
        >
          Show more
        </Button>
      </div>
    ) : null;

  const nudgeStorageKey = billboard.username ? `billboard_nudge_seen_${billboard.username}` : null;

  // Default collab list: willing creators ONLY (open_to_collab — the search
  // box handles everyone), shuffled per load (Featured pinned). Always fetched
  // since 2026-10-09 (no visibility guard — nothing greys, network.md §3).
  useEffect(() => {
    if (billboardLoading) return;
    let alive = true;
    fetchJson<{ results: CreatorSearchResult[] }>("/api/discover/creators")
      .then((d) => {
        if (!alive) return;
        const willing = (d.results ?? []).filter((c) => c.open_to_collab !== false);
        setDefaultList(shuffleCollabList(willing));
        setListLoading(false);
      })
      .catch(() => {
        if (alive) setListLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [billboardLoading]);

  const dismissNudge = useCallback(
    (design: boolean) => {
      if (nudgeStorageKey) localStorage.setItem(nudgeStorageKey, "1");
      setNudgeOpen(false);
      if (design) router.push("/dashboard/playground?view=billboard");
    },
    [nudgeStorageKey, router]
  );

  // Billboard nudge — first Network visit while the billboard is still
  // undesigned (avatar + name + handle only). The old OFF→ON flip trigger died
  // with the show_in_search switch; same once-ever localStorage flag
  // (network.md §3, retargeted 2026-10-09).
  useEffect(() => {
    if (billboardLoading || !nudgeStorageKey) return;
    const undesigned = !billboard.tagline && billboard.tags.length === 0 && !billboard.collab_style;
    if (!undesigned) return;
    if (localStorage.getItem(nudgeStorageKey) !== "1") setNudgeOpen(true);
  }, [billboardLoading, nudgeStorageKey, billboard.tagline, billboard.tags, billboard.collab_style]);

  useEffect(() => {
    fetchJson<Partial<BillboardRailState>>("/api/creator/partners/billboard")
      .then((d) =>
        setBillboard({
          display_name: d.display_name ?? "",
          username: d.username ?? "",
          avatar_url: d.avatar_url ?? null,
          tagline: d.tagline ?? "",
          tags: d.tags ?? [],
          collab_style: d.collab_style ?? "",
          open_to_collab: d.open_to_collab ?? true,
        })
      )
      .catch(() => { toast.error("Failed to load billboard"); })
      .finally(() => setBillboardLoading(false));
  }, []);

  // The collab switch saves instantly (independent of any Save button — the
  // design fields have their own Save in Playground's Billboard view).
  const handleInstantToggle = useCallback(
    async (field: "open_to_collab") => {
      const next = !billboard[field];
      setBillboard((prev) => ({ ...prev, [field]: next }));
      try {
        await fetchJson("/api/creator/partners/billboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: next }),
        });
      } catch {
        // Put the switch back where the server still has it — otherwise the
        // feed and the toggle disagree with no explanation (2026-10-01 audit).
        setBillboard((prev) => ({ ...prev, [field]: !next }));
        toast.error("Couldn't update that setting");
      }
    },
    [billboard]
  );

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

  /** One Discover card — used by BOTH views; card click opens Modal A,
   *  Connect/Visit stop the bubble so they don't re-trigger it. */
  const renderCard = (c: CreatorSearchResult) => {
    const state = connectState[c.id] ?? "";
    const open = c.open_to_collab !== false;
    return (
      <div
        key={c.id}
        onClick={() => setModalCreator(c)}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/30"
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
        <div onClick={(e) => e.stopPropagation()} className="flex shrink-0 flex-col gap-1.5">
          {open ? (
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
          ) : (
            <Button size="sm" variant="outline" disabled className="text-muted-foreground">
              Not open to collabs
            </Button>
          )}
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
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Network</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover creators, form collabs, and manage your connections.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]">
        {/* LEFT RAIL — the billboard mirror only (the affiliate block moved to
            the Earnings screen §2b on 2026-10-12, earnings.md) */}
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
              openToCollab={billboard.open_to_collab}
              onEditBillboard={() => router.push("/dashboard/playground?view=billboard")}
            />
          )}
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

          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className={LABEL_CLASS}>Discover</h2>
          </div>

          {/* The one switch lives INSIDE Discover (founder decision 2026-10-09 —
              FB model: feed presence + receive Connects; search is never gated). */}
          <div className="mb-4">
            <NetworkSettings
              openToCollab={billboard.open_to_collab}
              onToggle={handleInstantToggle}
            />
          </div>

          {query.trim() === "" ? (
            /* Default view: shuffled collab list (network.md §1) — never blank.
             * The OFF note is informational only — the list stays visible (your
             * switch gates how others see you, never what you see; founder
             * "yes to both" 2026-10-09). */
            <>
              {!billboard.open_to_collab && (
                <p className="mb-3 text-xs text-muted-foreground">
                  You&apos;re not in this list while &quot;Accept collab requests&quot; is off.
                </p>
              )}
              {/* Reroll button sits DIRECTLY above the list, below the switch
                  card (founder placement fix 2026-10-09 — was on the Discover
                  heading row). Feed only: typed search is ranked, not shuffled.
                  Hidden while the list is loading/empty. */}
              {!listLoading && defaultList.length > 0 && (
                <div className="mb-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShuffle}
                    className="text-muted-foreground"
                  >
                    <Shuffle size={14} />
                    Shuffle
                  </Button>
                </div>
              )}
              {listLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner size={20} />
                </div>
              ) : defaultList.length === 0 ? (
                <EmptyState
                  title="No creators open to collabs yet"
                  hint="Check back later — new creators join all the time."
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {defaultList.slice(0, visibleCount).map(renderCard)}
                  </div>
                  {renderShowMore(defaultList.length)}
                </>
              )}
            </>
          ) : searchResults.length === 0 && !searchLoading ? (
            <EmptyState title={`No creators match \u201C${query}\u201D`} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {searchResults.slice(0, visibleCount).map(renderCard)}
              </div>
              {renderShowMore(searchResults.length)}
            </>
          )}
        </section>
      </div>

      {modalCreator && (
        <CreatorBillboardModal
          creator={modalCreator}
          connectState={connectState[modalCreator.id] ?? ""}
          onConnect={handleConnect}
          onClose={() => setModalCreator(null)}
        />
      )}

      {nudgeOpen && (
        <Dialog open onOpenChange={(o) => { if (!o) dismissNudge(false); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Design your billboard (~2 min)</DialogTitle>
              <p className="pt-2 text-sm text-muted-foreground">
                Your billboard is still the default. Tagline, tags, and collab style are
                what make creators hit Connect.
              </p>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" onClick={() => dismissNudge(true)}>
                Design my billboard
              </Button>
              <Button size="sm" variant="outline" onClick={() => dismissNudge(false)}>
                Maybe later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
