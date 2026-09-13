/**
 * useMyAppForm — the My App editor's draft manager (my-app.md Part 4a/b).
 * Loads the creator row + catalog from /api/creator/my-app, keeps a draft
 * buffer auto-saved to localStorage (`my-app_draft_${creatorId}`, 3s debounce,
 * survives browser close), and deploys via PUT. Catalog items save
 * immediately through the catalog API — only theme/profile/link edits draft.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { ContentItem, Creator, MyAppTheme } from "@/types";
import { DEFAULT_ACCENT } from "@/lib/branding";

export interface MyAppDraft {
  custom_theme: MyAppTheme;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  connect_empty_text: string | null;
  social_links: Record<string, string>;
}

const EMPTY_THEME: MyAppTheme = {
  fontStyle: "sans",
  buttonStyle: "rounded",
  accent: DEFAULT_ACCENT,
  borderRadius: "lg",
  colors: { background: "#fafafa", card: "#ffffff", text: "#111111", accent: DEFAULT_ACCENT, backgroundImage: null },
  profile: { appName: "", appIconUrl: "" },
};

interface UseMyAppFormResult {
  loading: boolean;
  creatorId: string | null;
  baseCreator: Creator | null;
  serverItems: ContentItem[];
  draft: MyAppDraft;
  serverDraft: MyAppDraft | null;
  hasChanges: boolean;
  patch: (partial: Partial<MyAppDraft>) => void;
  reset: () => void;
  deploy: () => Promise<void>;
  deploying: boolean;
}

/** Deep-compare the draft against the last server snapshot (JSON — both sides plain). */
function draftEquals(a: MyAppDraft, b: MyAppDraft | null): boolean {
  if (!b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useMyAppForm(): UseMyAppFormResult {
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [baseCreator, setBaseCreator] = useState<Creator | null>(null);
  const [serverItems, setServerItems] = useState<ContentItem[]>([]);
  const [serverDraft, setServerDraft] = useState<MyAppDraft | null>(null);
  const [draft, setDraft] = useState<MyAppDraft>({
    custom_theme: EMPTY_THEME,
    display_name: null,
    bio: null,
    avatar_url: null,
    banner_url: null,
    connect_empty_text: null,
    social_links: {},
  });
  const [deploying, setDeploying] = useState(false);
  const loadedOnce = useRef(false);

  const fromCreator = useCallback((creator: Creator): MyAppDraft => {
    return {
      custom_theme: creator.custom_theme ?? EMPTY_THEME,
      display_name: creator.display_name ?? creator.username,
      bio: creator.bio,
      avatar_url: creator.avatar_url,
      banner_url: creator.banner_url,
      connect_empty_text: creator.connect_empty_text,
      social_links: (creator.social_links ?? {}) as Record<string, string>,
    };
  }, []);

  const { clear } = useAutoSave({    key: creatorId ? `my-app_draft_${creatorId}` : "my-app_draft_pending",
    data: draft,
    enabled: Boolean(creatorId) && loadedOnce.current && !deploying,
    onRestore: (restored) => {
      if (!restored || typeof restored !== "object") return;
      // Merge the restored draft over the server snapshot — hasChanges turns
      // true, and the orange Draft dot + Unsaved modal reappear on reload.
      setDraft((prev) => ({ ...prev, ...(restored as Partial<MyAppDraft>) }));
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/creator/my-app");
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
        if (!cancelled) toast.error("Couldn't load My App — refresh to retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromCreator]);

  const patch = useCallback((partial: Partial<MyAppDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    if (serverDraft) {
      setDraft(serverDraft);
      clear();
    }
  }, [serverDraft, clear]);

  const deploy = useCallback(async () => {
    setDeploying(true);
    try {
      const res = await fetch("/api/creator/my-app", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
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

  return { loading, creatorId, baseCreator, serverItems, draft, serverDraft, hasChanges, patch, reset, deploy, deploying };
}