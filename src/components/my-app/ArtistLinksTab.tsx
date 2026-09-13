/**
 * ArtistLinksTab — the Connect-tab artist links editor (my-app.md Part 2d):
 * add/edit/remove label + URL rows, saved to creators.social_links via Deploy.
 */
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { MyAppDraft } from "@/hooks/useMyAppForm";

interface ArtistLinksTabProps {
  draft: MyAppDraft;
  patch: (partial: Partial<MyAppDraft>) => void;
}

export function ArtistLinksTab({ draft, patch }: ArtistLinksTabProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const links = Object.entries(draft.social_links ?? {});

  const addLink = () => {
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

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Links fans see on the Connect tab — your socials, shop, or anything else. Only visible after Deploy.
      </p>

      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Empty state text</label>
        <input
          value={draft.connect_empty_text ?? ""}
          onChange={(e) => patch({ connect_empty_text: e.target.value })}
          maxLength={200}
          placeholder="More to come — check back soon"
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
        />
        <p className="mt-1 text-caption text-muted-foreground">Shown when Connect has no links or partners yet (200 chars).</p>
      </div>

      <div className="flex gap-2">
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
          onClick={addLink}
          className="rounded-lg bg-foreground px-3 text-background"
          aria-label="Add link"
        >
          <Plus size={16} />
        </button>
      </div>

      {links.length === 0 ? (
        <p className="rounded-xl border border-dashed border-input p-4 text-center text-xs text-muted-foreground">
          No links yet — add your first one above.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {links.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2">
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
      )}
    </div>
  );
}