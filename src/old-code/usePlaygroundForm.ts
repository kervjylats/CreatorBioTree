/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlaygroundTheme, FanViewId } from "@/types";
import { useAutoSave } from "@/hooks/useAutoSave";
import { FONT_MAP } from "@/lib/branding";

const DEFAULT_THEME: PlaygroundTheme = {
  fontStyle: "sans", buttonStyle: "rounded", accent: "#6366f1", borderRadius: "lg",
  colors: { background: "#ffffff", card: "#f9fafb", text: "#111827", accent: "#6366f1", backgroundImage: null },
  profile: { appName: "", appIconUrl: "" },
};

async function uploadFile(file: File, type: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  try {
    const res = await fetch("/api/creator/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

interface PlaygroundBranding {
  appName: string; appIconUrl: string; description: string;
  backgroundColor: string; accentColor: string; textColor: string; cardColor: string;
  fontFamily: string; buttonStyle: string; borderRadius: string;
  creatorUsername: string; creatorId: string; avatarUrl: string;
  displayName: string; bannerUrl: string | null;
}

export interface PlaygroundForm {
  loading: boolean;
  saving: boolean;
  hasChanges: boolean;
  creatorId: string;
  username: string;
  setUsername: (v: string) => void;
  creatorDisplayName: string;
  setCreatorDisplayName: (v: string) => void;
  creatorBio: string;
  setCreatorBio: (v: string) => void;
  theme: PlaygroundTheme;
  activeView: FanViewId;
  setActiveView: (v: FanViewId) => void;
  previewBranding: PlaygroundBranding;
  updateColors: (c: Partial<PlaygroundTheme["colors"]>) => void;
  handleDeploy: () => Promise<void>;
  onFontStyleChange: (f: string) => void;
  onButtonStyleChange: (b: string) => void;
  onAiPaletteGenerated: (p: Record<string, unknown>) => void;
  onAppNameChange: (name: string) => void;
  onAppIconUpload: (file: File) => Promise<string | null>;
}

export function usePlaygroundForm(): PlaygroundForm {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [creatorId, setCreatorId] = useState("");
  const [username, setUsername] = useState("");
  const [creatorDisplayName, setCreatorDisplayName] = useState("");
  const [creatorBio, setCreatorBio] = useState("");
  const [theme, setTheme] = useState<PlaygroundTheme>(DEFAULT_THEME);
  const [activeView, setActiveView] = useState<FanViewId>("guest");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { creatorService } = await import("@/services/creatorService");
      const creatorData = await creatorService.getById(user.id, supabase);
      if (creatorData) {
        setCreatorId(creatorData.id);
        setUsername(creatorData.username || "creator");
        setCreatorDisplayName(creatorData.display_name || "");
        setCreatorBio(creatorData.bio || "");
        if (creatorData.custom_theme) {
          setTheme(creatorData.custom_theme as PlaygroundTheme);
        }
      }
    } catch (err) { console.error("Failed to load creator data:", err); }
    finally { setLoading(false); }
  }, []);

  const prevCreatorIdRef = useRef("");
  useEffect(() => {
    if (prevCreatorIdRef.current && creatorId && prevCreatorIdRef.current !== creatorId) {
      try { localStorage.removeItem(`playground_draft_${prevCreatorIdRef.current}`); } catch {}
    }
    prevCreatorIdRef.current = creatorId;
  }, [creatorId]);
  useEffect(() => { loadData(); }, [loadData]);

  const { clear: clearDraft } = useAutoSave({
    key: `playground_draft_${creatorId}`,
    delay: 3000,
    data: { theme, username, creatorDisplayName, creatorBio },
    enabled: !loading && !!creatorId && hasChanges,
  });

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }
    setHasChanges(true);
    (window as any).isFormDirty = true;
  }, [theme, username, creatorDisplayName, creatorBio]);
  useEffect(() => { if (!hasChanges) (window as any).isFormDirty = false; }, [hasChanges]);

  const handleDeploy = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { profileUpdateService } = await import("@/services/profileUpdateService");
      await profileUpdateService(supabase, user.id, {
        custom_theme: theme as unknown as Record<string, unknown>,
        display_name: creatorDisplayName,
        bio: creatorBio,
        username,
      });
      setHasChanges(false);
      clearDraft();
    } catch (err) { console.error("Deploy failed:", err); }
    setSaving(false);
  };

  const updateColors = (c: Partial<PlaygroundTheme["colors"]>) =>
    setTheme(p => ({ ...p, colors: { ...p.colors, ...c }, accent: c.accent || p.accent }));

  const previewBranding = {
    appName: theme.profile.appName || "Your App",
    appIconUrl: theme.profile.appIconUrl || "",
    description: creatorBio || "",
    backgroundColor: theme.colors.background,
    accentColor: theme.colors.accent,
    textColor: theme.colors.text,
    cardColor: theme.colors.card,
    fontFamily: FONT_MAP[theme.fontStyle] || FONT_MAP.sans,
    buttonStyle: theme.buttonStyle,
    borderRadius: theme.borderRadius,
    creatorUsername: username || "creator",
    creatorId,
    avatarUrl: "/icons/icon-192x192.png",
    displayName: creatorDisplayName || "Your App",
    bannerUrl: null,
  };

  const onFontStyleChange = (f: string) =>
    setTheme(p => ({ ...p, fontStyle: f as PlaygroundTheme["fontStyle"] }));

  const onButtonStyleChange = (b: string) =>
    setTheme(p => ({
      ...p,
      buttonStyle: b as PlaygroundTheme["buttonStyle"],
      borderRadius: b === "sharp" ? "sm" : b === "pill" ? "pill" : "lg",
    }));

  const onAppNameChange = (name: string) =>
    setTheme(p => ({ ...p, profile: { ...p.profile, appName: name } }));

  const onAppIconUpload = async (file: File): Promise<string | null> => {
    const url = await uploadFile(file, "app_icon");
    if (url) setTheme(p => ({ ...p, profile: { ...p.profile, appIconUrl: url } }));
    return url;
  };

  const onAiPaletteGenerated = (p: Record<string, unknown>) => {
    updateColors({ background: p.background as string, card: p.card as string, text: p.text as string, accent: p.accent as string });
    if (p.font) setTheme(prev => ({ ...prev, fontStyle: p.font as PlaygroundTheme["fontStyle"] }));
    if (p.buttonStyle) {
      setTheme(prev => ({
        ...prev,
        buttonStyle: p.buttonStyle as PlaygroundTheme["buttonStyle"],
        borderRadius: p.buttonStyle === "sharp" ? "sm" as const : p.buttonStyle === "pill" ? "pill" as const : "lg" as const,
      }));
    }
  };

  return {
    loading, saving, hasChanges, creatorId,
    username, setUsername,
    creatorDisplayName, setCreatorDisplayName,
    creatorBio, setCreatorBio,
    theme, activeView, setActiveView,
    previewBranding,
    updateColors, handleDeploy,
    onFontStyleChange, onButtonStyleChange,
    onAiPaletteGenerated, onAppNameChange, onAppIconUpload,
  };
}
