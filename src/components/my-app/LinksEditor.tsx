/**
 * LinksEditor — merged editor for manual social links + platform connections.
 * Replaces the old ArtistLinksTab and Integrations tab. Manual URLs are
 * displayed on the fan shell Connect tab. Platform connect buttons (mock mode)
 * auto-add the platform link and mark it as connected. Deploy pushes to fans.
 */
"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, Check } from "lucide-react";
import type { MyAppDraft } from "@/hooks/useMyAppForm";

interface LinksEditorProps {
  draft: MyAppDraft;
  patch: (partial: Partial<MyAppDraft>) => void;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "shopify", label: "Shopify", icon: "🛍️" },
  { id: "spotify", label: "Spotify", icon: "🎧" },
];

export function LinksEditor({ draft, patch }: LinksEditorProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const links = Object.entries(draft.social_links ?? {});

  const addManualLink = () => {
    if (!label.trim() || !url.trim()) return;
    patch({ social_links: { ...draft.social_links, [label.trim()]: url.trim() } });
    setLabel("");
    setUrl("");
  };

  const removeLink = (key: string) => {
    const next = { ...draft.social_links };
    delete next[key];
    patch({ social_links: next });
  };

  const connectPlatform = (platform: { id: string; label: string }) => {
    if (draft.social_links?.[platform.label]) return;
    patch({
      social_links: {
        ...draft.social_links,
        [platform.label]: `https://${platform.id}.com/your-handle`,
      },
    });
  };

  const isConnected = (label: string) => Boolean(draft.social_links?.[label]);

  return (
    <div className="space-y-4">
      {/* Empty state text */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Empty state text
        </label>
        <input
          value={draft.connect_empty_text ?? ""}
          onChange={(e) => patch({ connect_empty_text: e.target.value })}
          maxLength={200}
          placeholder="More to come — check back soon"
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
        />
        <p className="mt-1 text-caption text-muted-foreground">
          Shown when Connect has no links or partners yet.
        </p>
      </div>

      {/* Manual links */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Your links
        </label>
        <div className="mt-1 flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Instagram)"
            className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <button
            type="button"
            onClick={addManualLink}
            className="rounded-lg bg-foreground px-3 text-background"
            aria-label="Add link"
          >
            <Plus size={16} />
          </button>
        </div>

        {links.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {links.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{key}</p>
                  <p className="truncate text-xs text-muted-foreground">{value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(key)}
                  className="rounded-full p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${key}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-input p-3 text-center text-xs text-muted-foreground">
            No links yet — add one above or connect a platform below.
          </p>
        )}
      </div>

      {/* Platform connections */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Connect platforms
        </label>
        <p className="mt-1 text-caption text-muted-foreground">
          Connect a platform to auto-add its link to your Connect tab.
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          {PLATFORMS.map((p) => {
            const connected = isConnected(p.label);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => connectPlatform(p)}
                disabled={connected}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  connected
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-input bg-background text-foreground hover:bg-accent/30"
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <span className="flex-1">{p.label}</span>
                {connected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold">
                    <Check size={12} /> Connected
                  </span>
                ) : (
                  <ExternalLink size={14} className="text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
