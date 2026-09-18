/**
 * BillboardEditor — controlled form for editing billboard settings (tagline,
 * tags, collab style) and Media Kit fields (bio, rate card, custom message).
 * State is lifted to the parent (NetworkPage) so the preview card updates live.
 * No internal data fetching.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Copy, Check, Loader2 } from "lucide-react";

export interface BillboardSettings {
  display_name: string;
  username: string;
  avatar_url: string | null;
  tagline: string;
  tags: string[];
  collab_style: string;
  is_discoverable: boolean;
  // Media Kit
  bio: string;
  rate_card: { post: string; story: string; video: string };
  media_kit_message: string;
}

interface BillboardEditorProps {
  settings: BillboardSettings;
  onFieldChange: (partial: Partial<BillboardSettings>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

function Section({ title, badge, defaultOpen = false, children }: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-input">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-semibold text-muted-foreground">
              {badge}
            </span>
          )}
          {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </span>
      </button>
      {open && <div className="border-t border-input px-3 py-3">{children}</div>}
    </Card>
  );
}

export function BillboardEditor({ settings, onFieldChange, onSave, saving }: BillboardEditorProps) {
  const [copied, setCopied] = useState(false);
  const mediaKitUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${settings.username}/media-kit`
    : `/${settings.username}/media-kit`;

  const copyUrl = () => {
    navigator.clipboard.writeText(mediaKitUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      {/* Billboard fields */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Tagline</label>
        <Input
          value={settings.tagline}
          onChange={(e) => onFieldChange({ tagline: e.target.value.slice(0, 60) })}
          placeholder="One-liner pitch (max 60 chars)"
          className="mt-1"
        />
        <p className="mt-1 text-right text-micro text-muted-foreground">
          {settings.tagline.length}/60
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Tags (up to 3)</label>
        <div className="mt-1 flex gap-2">
          {[0, 1, 2].map((i) => (
            <Input
              key={i}
              value={settings.tags[i] ?? ""}
              onChange={(e) => {
                const newTags = [...settings.tags];
                if (e.target.value) {
                  newTags[i] = e.target.value;
                } else {
                  newTags.splice(i, 1);
                }
                onFieldChange({ tags: newTags.slice(0, 3) });
              }}
              placeholder={`Tag ${i + 1}`}
              className="flex-1"
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Collab style</label>
        <Textarea
          value={settings.collab_style}
          onChange={(e) => onFieldChange({ collab_style: e.target.value })}
          placeholder="What kind of collab are you looking for?"
          rows={2}
          className="mt-1"
        />
      </div>

      <Button onClick={onSave} disabled={saving} className="w-full">
        {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Billboard"}
      </Button>

      {/* Media Kit — expandable */}
      <Section title="Media Kit" badge="for sponsors">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bio for sponsors</label>
            <Textarea
              value={settings.bio}
              onChange={(e) => onFieldChange({ bio: e.target.value })}
              placeholder="A short bio about you and your audience..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Rate card</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <div>
                <label className="text-micro text-muted-foreground">Post</label>
                <Input
                  value={settings.rate_card.post}
                  onChange={(e) => onFieldChange({ rate_card: { ...settings.rate_card, post: e.target.value } })}
                  placeholder="$100"
                />
              </div>
              <div>
                <label className="text-micro text-muted-foreground">Story</label>
                <Input
                  value={settings.rate_card.story}
                  onChange={(e) => onFieldChange({ rate_card: { ...settings.rate_card, story: e.target.value } })}
                  placeholder="$50"
                />
              </div>
              <div>
                <label className="text-micro text-muted-foreground">Video</label>
                <Input
                  value={settings.rate_card.video}
                  onChange={(e) => onFieldChange({ rate_card: { ...settings.rate_card, video: e.target.value } })}
                  placeholder="$200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Custom message</label>
            <Textarea
              value={settings.media_kit_message}
              onChange={(e) => onFieldChange({ media_kit_message: e.target.value })}
              placeholder="Let's work together!"
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Shareable URL</label>
            <div className="mt-1 flex gap-2">
              <Input value={mediaKitUrl} readOnly className="flex-1 text-xs text-muted-foreground" />
              <Button type="button" variant="outline" size="sm" onClick={copyUrl}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            <p className="mt-1 text-micro text-muted-foreground">
              Share this link with sponsors to show your media kit.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
