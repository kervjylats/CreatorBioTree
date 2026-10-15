/**
 * usePlaygroundForm — the Playground editor's draft manager (playground.md
 * Part 4a/b + 1e). Loads creator + catalog from /api/creator/playground, keeps
 * a localStorage draft (`playground_draft_${creatorId}`, 3s debounce, survives
 * browser close), deploys via PUT. Catalog saves immediately — only theme/
 * profile/identity edits draft. Draft set: theme (incl. app identity), bio,
 * banner, connect text, social links, display_name, avatar_url (identity
 * drafts since 2026-10-15; the server 409 cooldown guards Deploy).
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { ContentItem, Creator, PlaygroundTheme } from "@/types";
import { DEFAULT_ACCENT } from "@/lib/branding";

export interface PlaygroundDraft {
  custom_theme: PlaygroundTheme;
  bio: string | null;
  banner_url: string | null;
  connect_empty_text: string | null;
  social_links: Record<string, string>;
  display_name: string | null;
  avatar_url: string | null;
}

const EMPTY_THEME: PlaygroundTheme = {
  fontStyle: "sans",
  buttonStyle: "rounded",
  accent: DEFAULT_ACCENT,
  borderRadius: "lg",
  colors: { background: "#fafafa", card: "#ffffff", text: "#111111", accent: DEFAULT_ACCENT, backgroundImage: null },
  profile: { appName: "", appIconUrl: "" },
};

/** Build the canonical draft snapshot from a creator row — the ONE copy the
 *  hook (load/reset) and the live-page OwnerDraftBanner both use, so their
 *  "are there unpublished changes?" answers can never drift apart. */
export function creatorToDraft(creator: Creator): PlaygroundDraft {
  return {
    custom_theme: creator.custom_theme ?? EMPTY_THEME,
    bio: creator.bio,
    banner_url: creator.banner_url,
    connect_empty_text: creator.connect_empty_text,
    social_links: (creator.social_links ?? {}) as Record<string, string>,
    display_name: creator.display_name,
    avatar_url: creator.avatar_url,
  };
}

/** Merge a restored (possibly older-shaped) localStorage draft over the server
 *  snapshot — picks ONLY known keys in a fixed order (stale keys from
 *  pre-2026-10-15 drafts are dropped). Used identically by the hook's
 *  onRestore and the OwnerDraftBanner, so both reach the same verdict. */
export function mergeRestoredDraft(restored: unknown, server: PlaygroundDraft): PlaygroundDraft {
  if (!restored || typeof restored !== "object") return server;
  const r = restored as Partial<PlaygroundDraft>;
  return {
    custom_theme: r.custom_theme ?? server.custom_theme,
    bio: r.bio !== undefined ? r.bio : server.bio,
    banner_url: r.banner_url !== undefined ? r.banner_url : server.banner_url,
    connect_empty_text: r.connect_empty_text !== undefined ? r.connect_empty_text : server.connect_empty_text,
    social_links: r.social_links ?? server.social_links,
    display_name: r.display_name !== undefined ? r.display_name : server.display_name,
    avatar_url: r.avatar_url !== undefined ? r.avatar_url : server.avatar_url,
  };
}

interface UsePlaygroundFormResult {
  loading: boolean;
  creatorId: string | null;
  baseCreator: Creator | null;
  serverItems: ContentItem[];
  draft: PlaygroundDraft;
  serverDraft: PlaygroundDraft | null;
  hasChanges: boolean;
  patch: (partial: Partial<PlaygroundDraft>) => void;
  reset: () => void;
  deploy: () => Promise<void>;
  deploying: boolean;
  /** Re-read the creator row (stamp refresh after a 409 lock at Deploy). */
  refreshCreator: () => Promise<void>;
}

/** Deep-compare the draft against the last server snapshot (JSON — both sides plain). */
function draftEquals(a: PlaygroundDraft, b: PlaygroundDraft | null): boolean {
  if (!b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function usePlaygroundForm(): UsePlaygroundFormResult {
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [baseCreator, setBaseCreator] = useState<Creator | null>(null);
  const [serverItems, setServerItems] = useState<ContentItem[]>([]);
  const [serverDraft, setServerDraft] = useState<PlaygroundDraft | null>(null);
  const [draft, setDraft] = useState<PlaygroundDraft>({
    custom_theme: EMPTY_THEME,
    bio: null,
    banner_url: null,
    connect_empty_text: null,
    social_links: {},
    display_name: null,
    avatar_url: null,
  });
  const [deploying, setDeploying] = useState(false);
  const loadedOnce = useRef(false);

  const { clear } = useAutoSave({    key: creatorId ? `playground_draft_${creatorId}` : "playground_draft_pending",
    data: draft,
    enabled: Boolean(creatorId) && loadedOnce.current && !deploying,
    onRestore: (restored) => {
      if (!restored || typeof restored !== "object") return;
      // Merge the restored draft over the server snapshot — hasChanges turns
      // true, and the Draft beacon + Unsaved modal reappear on reload.
      // Identity keys restore TOO (Part 1e law change, 2026-10-15): a restored
      // display_name/avatar_url is an honest pending change, and Deploy's
      // server-side 409 cooldown still blocks any lock bypass.
      setDraft((prev) => mergeRestoredDraft(restored, prev));
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/creator/playground");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load");
        if (cancelled) return;
        const creator = json.creator as Creator;
        const items = (json.items ?? []) as ContentItem[];
        const snapshot = creatorToDraft(creator);
        setCreatorId(creator.id);
        setBaseCreator(creator);
        setServerItems(items);
        setDraft(snapshot);
        setServerDraft(snapshot);
        loadedOnce.current = true;
      } catch {
        if (!cancelled) toast.error("Couldn't load Playground — refresh to retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((partial: Partial<PlaygroundDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    if (serverDraft) {
      setDraft(serverDraft);
      clear();
    }
  }, [serverDraft, clear]);

  // Stamp refresh after a 409 lock at Deploy: re-read the creator row so the
  // note renders the dated lock immediately. Best-effort — never throws.
  const refreshCreator = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/playground");
      if (!res.ok) return;
      const json = await res.json();
      if (json?.creator) setBaseCreator(json.creator as Creator);
    } catch {
      /* best-effort */
    }
  }, []);

  const deploy = useCallback(async () => {
    setDeploying(true);
    try {
      // Deploy sends an explicit allow-list — exactly the Part 1e draft set.
      // display_name + avatar_url ARE deployable now (the 📌 note owns them);
      // the server 409 cooldown (lockOnRealChange) still guards real changes.
      // Blank name → null (the DB value; renderers fall back to username).
      const deployable = {
        custom_theme: draft.custom_theme,
        bio: draft.bio,
        banner_url: draft.banner_url,
        connect_empty_text: draft.connect_empty_text,
        social_links: draft.social_links,
        display_name: draft.display_name?.trim() ? draft.display_name.trim() : null,
        avatar_url: draft.avatar_url,
      };
      const res = await fetch("/api/creator/playground", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deployable),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Deploy failed");
      setServerDraft(draft);
      clear();
      toast.success("Deployed — your fan app is live");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deploy failed");
      // 409 = a cooldown the UI hadn't seen (another tab) — refresh stamps now.
      await refreshCreator();
      throw err;
    } finally {
      setDeploying(false);
    }
  }, [draft, clear, refreshCreator]);

  const hasChanges = useMemo(() => !draftEquals(draft, serverDraft), [draft, serverDraft]);

  return { loading, creatorId, baseCreator, serverItems, draft, serverDraft, hasChanges, patch, reset, deploy, deploying, refreshCreator };
}