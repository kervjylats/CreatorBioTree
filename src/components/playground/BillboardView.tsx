/**
 * BillboardView — Playground's Billboard view (playground.md Part 1d): the
 * result-preview card (how Discover renders you — no actions, no pencils, no
 * visibility pill) above the billboard DESIGN editors moved from the Network
 * rail. Owns GET/PUT /api/creator/partners/billboard; after a save that
 * changes bio it calls onBioSaved so the Fans view's playground data can be
 * synced (bio renders on both surfaces). Visibility switches stay in Network.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/shared/Avatar";
import { Spinner } from "@/components/shared/Spinner";
import { fetchJson } from "@/lib/fetchJson";
import { toast } from "sonner";
import { LABEL_CLASS } from "@/lib/ui-constants";
import { BillboardEditor, type BillboardSettings } from "./BillboardEditor";

const EMPTY_SETTINGS: BillboardSettings = {
  display_name: "",
  username: "",
  avatar_url: null,
  is_featured: false,
  tagline: "",
  tags: [],
  collab_style: "",
  bio: "",
  rate_card: { post: "", story: "", video: "" },
  media_kit_message: "",
};

interface BillboardViewProps {
  /** Fired after a save where bio actually changed — parent syncs the fan preview. */
  onBioSaved?: (bio: string) => void;
}

export function BillboardView({ onBioSaved }: BillboardViewProps) {
  const [settings, setSettings] = useState<BillboardSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchJson<Partial<BillboardSettings>>("/api/creator/partners/billboard")
      .then((d) => {
        if (!alive) return;
        setSettings({
          display_name: d.display_name ?? "",
          username: d.username ?? "",
          avatar_url: d.avatar_url ?? null,
          is_featured: d.is_featured ?? false,
          tagline: d.tagline ?? "",
          tags: d.tags ?? [],
          collab_style: d.collab_style ?? "",
          bio: d.bio ?? "",
          rate_card: d.rate_card ?? { post: "", story: "", video: "" },
          media_kit_message: d.media_kit_message ?? "",
        });
      })
      .catch(() => toast.error("Failed to load your billboard"))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleFieldChange = useCallback((partial: Partial<BillboardSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const prevBio = settings.bio;
      const d = await fetchJson<Partial<BillboardSettings>>("/api/creator/partners/billboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: settings.tagline,
          tags: settings.tags,
          collab_style: settings.collab_style,
          bio: settings.bio,
          rate_card: settings.rate_card,
          media_kit_message: settings.media_kit_message,
        }),
      }).catch(() => null);
      if (d) {
        const nextBio = d.bio ?? "";
        setSettings((prev) => ({
          ...prev,
          tagline: d.tagline ?? "",
          tags: d.tags ?? [],
          collab_style: d.collab_style ?? "",
          bio: nextBio,
          rate_card: d.rate_card ?? prev.rate_card,
          media_kit_message: d.media_kit_message ?? "",
        }));
        if (prevBio !== nextBio) onBioSaved?.(nextBio);
        toast.success("Billboard saved");
      } else {
        // Silently returning the button to "Save" used to read as success
        // (2026-10-01 audit).
        toast.error("Couldn't save your billboard — try again");
      }
    } finally {
      setSaving(false);
    }
  }, [settings, onBioSaved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={16} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Result-preview — exactly as Discover renders you. No actions, no
          pencils, no visibility pill (switches live in Network). Undesigned =
          the plain standard: avatar + name + @handle only. */}
      <Card className="p-4 space-y-3">
        <p className={LABEL_CLASS}>As Discover shows you</p>
        <div className="flex items-center gap-3">
          <Avatar src={settings.avatar_url} name={settings.display_name} size="h-12 w-12" textClass="text-sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-foreground">
                {settings.display_name || "Your Name"}
              </span>
              {settings.is_featured && (
                <Badge variant="secondary" className="text-micro">Featured</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">@{settings.username}</span>
          </div>
        </div>
        {settings.tagline && (
          <p className="text-xs text-muted-foreground/70 italic">
            &ldquo;{settings.tagline}&rdquo;
          </p>
        )}
        {settings.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {settings.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-foreground/10 px-2 py-0.5 text-micro font-semibold text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {settings.collab_style && (
          <p className="text-caption text-muted-foreground line-clamp-2">
            {settings.collab_style}
          </p>
        )}
      </Card>

      <BillboardEditor
        settings={settings}
        onFieldChange={handleFieldChange}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
