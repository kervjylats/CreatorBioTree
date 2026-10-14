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
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/shared/Avatar";
import { Spinner } from "@/components/shared/Spinner";
import { fetchJson } from "@/lib/fetchJson";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { LABEL_CLASS } from "@/lib/ui-constants";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { BillboardEditor, type BillboardSettings } from "./BillboardEditor";
import type { HeroMedia } from "@/lib/spotlightHero";
import { BillboardHero } from "@/components/network/BillboardHero";

/** Editor settings + the read-only preview hero (chosen by featuring a
 *  catalog item — never edited here; network.md §2 one-edit-home rule). */
type ViewSettings = BillboardSettings & { featured_item: HeroMedia | null };

const EMPTY_SETTINGS: ViewSettings = {
  display_name: "",
  username: "",
  avatar_url: null,
  is_featured: false,
  primary_field: "",
  tagline: "",
  tags: [],
  collab_style: "",
  bio: "",
  rate_card: { post: "", story: "", video: "" },
  media_kit_message: "",
  featured_item: null,
};

interface BillboardViewProps {
  /** Fired after a save where bio actually changed — parent syncs the fan preview. */
  onBioSaved?: (bio: string) => void;
}

export function BillboardView({ onBioSaved }: BillboardViewProps) {
  const [settings, setSettings] = useState<ViewSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { copy } = useCopyToClipboard();

  // v1 media-kit door (playground.md Part 2g, 2026-10-14): the public
  // read-only link lives in the same room as the fields it shares.
  const copyMediaKitLink = useCallback(() => {
    if (!settings.username) return;
    const link = `${window.location.origin}/${settings.username}/media-kit`;
    void copy(link).then((ok) => {
      if (ok) toast.success("Media-kit link copied — send it to sponsors");
    });
  }, [copy, settings.username]);

  useEffect(() => {
    let alive = true;
    fetchJson<Partial<ViewSettings>>("/api/creator/partners/billboard")
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
          primary_field: (d as Partial<BillboardSettings>).primary_field ?? "",
          featured_item: d.featured_item ?? null,
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
          primary_field: settings.primary_field,
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
          primary_field: (d as Partial<BillboardSettings>).primary_field ?? "",
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
        {/* Hero mirror (network.md §2, 2026-10-14): your spotlight as Modal A
            shows it. The tagline line hides while the hero headlines it. */}
        <BillboardHero
          media={settings.featured_item}
          eyebrow={settings.primary_field || undefined}
          headline={settings.tagline || undefined}
        />
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
        {settings.tagline && !settings.featured_item && (
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

      <Button
        type="button"
        variant="outline"
        onClick={copyMediaKitLink}
        disabled={!settings.username}
        className="w-full"
      >
        <Link2 size={14} />
        Copy media-kit link
      </Button>
    </div>
  );
}
