/**
 * BillboardEditor — controlled form for the billboard DESIGN fields (primary
 * field, tagline, tags, collab style) + Media Kit fields (bio, rate card,
 * custom message) in Playground's Billboard view (playground.md Part 1d —
 * moved from the Network rail 2026-10-09). Visibility switches stay in
 * Network (the Discover heading row in NetworkPage). State is lifted to the
 * parent (BillboardView) so the result-preview updates live. No data fetching.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { BILLBOARD_LIMITS, PRIMARY_FIELD_BUCKETS } from "@/lib/limits";
import { Spinner } from "@/components/shared/Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BillboardSettings {
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_featured: boolean;
  primary_field: string;
  tagline: string;
  tags: string[];
  collab_style: string;
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
  // Pill-adder draft (network.md §2, 2026-10-13): the input holds unsaved
  // text only — pills ARE settings.tags. Normalization matches the server
  // (lowercase + trim) so pills show their final form, no post-save surprise.
  const [draft, setDraft] = useState("");
  const atCap = settings.tags.length >= BILLBOARD_LIMITS.tags;
  const normalizedDraft = draft.trim().toLowerCase();
  const isDup =
    normalizedDraft.length > 0 &&
    settings.tags.some((t) => t.trim().toLowerCase() === normalizedDraft);

  const addTag = () => {
    if (!normalizedDraft || isDup || atCap) return;
    onFieldChange({ tags: [...settings.tags, normalizedDraft].slice(0, BILLBOARD_LIMITS.tags) });
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onFieldChange({ tags: settings.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-4">
      {/* Billboard fields */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Primary field</label>
        <Select
          value={settings.primary_field || "__none"}
          onValueChange={(v) => onFieldChange({ primary_field: (v as string) === "__none" ? "" : (v as string) })}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="What should creators find you as?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Not set</SelectItem>
            {PRIMARY_FIELD_BUCKETS.map((bucket) => (
              <SelectItem key={bucket} value={bucket}>
                {bucket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-micro text-muted-foreground">
          The one field the Discover filter matches — your tags carry the rest.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Tagline</label>
        <Input
          value={settings.tagline}
          onChange={(e) => onFieldChange({ tagline: e.target.value.slice(0, BILLBOARD_LIMITS.tagline) })}
          placeholder="One-liner pitch (max 60 chars)"
          className="mt-1"
        />
        <p className="mt-1 text-right text-micro text-muted-foreground">
          {settings.tagline.length}/{BILLBOARD_LIMITS.tagline}
        </p>
      </div>

      <div>
        <label htmlFor="tag-input" className="text-xs font-medium text-muted-foreground">
          What do you do? (up to 3 words)
        </label>
        {settings.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {settings.tags.map((tag) => (
              <span
                key={tag}
                className="flex min-h-8 items-center gap-1 rounded-full bg-foreground/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-foreground"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/20 hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <Input
            id="tag-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={atCap ? "3 of 3 — remove one to add another" : "e.g. beats"}
            disabled={atCap}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!normalizedDraft || isDup || atCap}
            className="shrink-0"
          >
            + Add
          </Button>
        </div>
        <p className="mt-1 text-micro text-muted-foreground">
          {atCap
            ? "3 of 3 words — remove one to add another."
            : `${BILLBOARD_LIMITS.tags - settings.tags.length} left. Words creators search — your primary field carries the filter, these carry the rest.`}
        </p>
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
        {saving ? <Spinner size={14} /> : "Save Billboard"}
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
              maxLength={BILLBOARD_LIMITS.bio}
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
              maxLength={BILLBOARD_LIMITS.mediaKit}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
