/**
 * usePlaygroundForm — the Playground editor's draft manager (playground.md Part 4a/b).
 * Loads the creator row + catalog from /api/creator/playground, keeps a draft
 * buffer auto-saved to localStorage (`playground_draft_${creatorId}`, 3s debounce,
 * survives browser close), and deploys via PUT. Catalog items save
 * immediately through the catalog API — only theme/profile/link edits draft.
 * The draft holds ONLY deployable fields — identity (display_name/avatar_url)
 * lives in Settings → Profile (settings.md Part 13) and never travels here.
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
}

const EMPTY_THEME: PlaygroundTheme = {
  fontStyle: "sans",
  buttonStyle: "rounded",
  accent: DEFAULT_ACCENT,
  borderRadius: "lg",
  colors: { background: "#fafafa", card: "#ffffff", text: "#111111", accent: DEFAULT_ACCENT, backgroundImage: null },
  profile: { appName: "", appIconUrl: "" },
};

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
  /** Merge a bio saved on the Billboard view (playground.md Part 1d) — bio
   *  renders on both surfaces, so the fan preview must agree after a save. */
  syncBio: (bio: string) => void;
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
  });
  const [deploying, setDeploying] = useState(false);
  const loadedOnce = useRef(false);

  const fromCreator = useCallback((creator: Creator): PlaygroundDraft => {
    return {
      custom_theme: creator.custom_theme ?? EMPTY_THEME,
      bio: creator.bio,
      banner_url: creator.banner_url,
      connect_empty_text: creator.connect_empty_text,
      social_links: (creator.social_links ?? {}) as Record<string, string>,
    };
  }, []);

  const { clear } = useAutoSave({    key: creatorId ? `playground_draft_${creatorId}` : "playground_draft_pending",
    data: draft,
    enabled: Boolean(creatorId) && loadedOnce.current && !deploying,
    onRestore: (restored) => {
      if (!restored || typeof restored !== "object") return;
      // Merge the restored draft over the server snapshot — hasChanges turns
      // true, and the orange Draft dot + Unsaved modal reappear on reload.
      // Pick ONLY current draft keys: old localStorage drafts may still carry
      // removed identity fields (display_name/avatar_url) — never restore those
      // (they'd poison hasChanges and the preview with a stale identity).
      setDraft((prev) => {
        const r = restored as Partial<PlaygroundDraft>;
        return {
          custom_theme: r.custom_theme ?? prev.custom_theme,
          bio: r.bio !== undefined ? r.bio : prev.bio,
          banner_url: r.banner_url !== undefined ? r.banner_url : prev.banner_url,
          connect_empty_text: r.connect_empty_text !== undefined ? r.connect_empty_text : prev.connect_empty_text,
          social_links: r.social_links ?? prev.social_links,
        };
      });
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
        const snapshot = fromCreator(creator);
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
  }, [fromCreator]);

  const patch = useCallback((partial: Partial<PlaygroundDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    if (serverDraft) {
      setDraft(serverDraft);
      clear();
    }
  }, [serverDraft, clear]);

  const syncBio = useCallback(
    (bio: string) => {
      // Server truth updates unconditionally; the draft only follows when the
      // user hasn't diverged on bio here (an unsaved Fans-view bio edit wins).
      setDraft((d) => (serverDraft && d.bio === serverDraft.bio ? { ...d, bio } : d));
      setServerDraft((s) => (s ? { ...s, bio } : s));
      setBaseCreator((c) => (c ? { ...c, bio } : c));
    },
    [serverDraft]
  );

  const deploy = useCallback(async () => {
    setDeploying(true);
    try {
      // Deploy sends an explicit allow-list: display_name + avatar_url are NOT
      // deployable — Settings → Profile owns them and their 7-day cooldown
      // (settings.md Part 13, founder decision 2026-10-09). Without this strip a
      // stale localStorage draft could revert (or falsely trip the cooldown on)
      // an identity field during an unrelated theme deploy.
      const deployable = {
        custom_theme: draft.custom_theme,
        bio: draft.bio,
        banner_url: draft.banner_url,
        connect_empty_text: draft.connect_empty_text,
        social_links: draft.social_links,
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
      throw err;
    } finally {
      setDeploying(false);
    }
  }, [draft, clear]);

  const hasChanges = useMemo(() => !draftEquals(draft, serverDraft), [draft, serverDraft]);

  return { loading, creatorId, baseCreator, serverItems, draft, serverDraft, hasChanges, patch, reset, deploy, deploying, syncBio };
}