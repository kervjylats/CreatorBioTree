/**
 * ElementPopover — tap-to-edit floating control (my-app.md Part 1a): tap any
 * element on the phone preview → this popover opens with that element's
 * controls (background / header / banner / avatar / bio / text / button / card / link / links).
 * All edits are GLOBAL across surfaces and land in the draft until Deploy.
 */
"use client";

import { useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { Upload, X, Dice1 } from "lucide-react";
import type { ButtonStyle, FontStyle } from "@/types";
import type { MyAppDraft } from "@/hooks/useMyAppForm";
import type { EditModeTarget } from "@/components/fan-pwa/GuestPageContent";
import { LinksEditor } from "./LinksEditor";

interface ElementPopoverProps {
  target: EditModeTarget;
  draft: MyAppDraft;
  patch: (partial: Partial<MyAppDraft>) => void;
  onClose: () => void;
}

const TITLES: Record<EditModeTarget["kind"], string> = {
  background: "Page background",
  header: "Display name",
  banner: "Profile",
  avatar: "Profile image",
  bio: "Bio",
  text: "Text color",
  button: "Buttons",
  card: "Cards",
  link: "Artist link",
  links: "Links & Integrations",
};

const BUTTON_STYLES: { id: ButtonStyle; label: string }[] = [
  { id: "rounded", label: "Rounded" },
  { id: "sharp", label: "Sharp" },
  { id: "pill", label: "Pill" },
  { id: "squircle", label: "Squircle" },
  { id: "outline", label: "Outline" },
];

/** Shared hidden-file-input trigger for image uploads. */
function UploadButton({ accept, onFile }: { accept: string; onFile: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/30"
      >
        <Upload size={14} /> Upload
      </button>
    </>
  );
}

/** Upload a file to /api/creator/upload and return the public URL. */
async function uploadFile(file: File, type: "avatar" | "banner"): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  const res = await fetch("/api/creator/upload", { method: "POST", body: form });
  const json = await res.json();
  return res.ok ? json.url : null;
}

export function ElementPopover({ target, draft, patch, onClose }: ElementPopoverProps) {
  const colors = draft.custom_theme.colors;
  const kind = target.kind;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">{TITLES[kind]}</h3>
          <button type="button" onClick={onClose} className="rounded-full px-2 text-muted-foreground">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* ── Background ───────────────────────────────────────── */}
          {kind === "background" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Background</label>
                <div className="mt-1.5 flex items-start gap-3">
                  <HexColorPicker
                    color={colors.background}
                    onChange={(v) =>
                      patch({ custom_theme: { ...draft.custom_theme, colors: { ...colors, background: v } } })
                    }
                    style={{ width: "100%", height: 110 }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  patch({
                    custom_theme: {
                      ...draft.custom_theme,
                      colors: { ...colors, backgroundGradient: null },
                    },
                  })
                }
                className="w-full rounded-full border border-input py-2 text-xs font-semibold text-foreground"
              >
                Remove gradient
              </button>
            </>
          )}

          {/* ── Header (display name — catch-all from tapping the name) ── */}
          {kind === "header" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Display name</label>
              <input
                value={draft.display_name ?? ""}
                onChange={(e) => patch({ display_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                This is your public name on the fan page.
              </p>
            </div>
          )}

          {/* ── Banner ──────────────────────────────────────────── */}
          {kind === "banner" && (
            <div className="space-y-3">
              {/* Display name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Display name</label>
                <input
                  value={draft.display_name ?? ""}
                  onChange={(e) => patch({ display_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Bio</label>
                <textarea
                  value={draft.bio ?? ""}
                  onChange={(e) => patch({ bio: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Tell fans what you're about…"
                />
              </div>

              {/* Banner image */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Banner image</label>
                {draft.banner_url ? (
                  <div className="relative mt-1.5 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.banner_url}
                      alt="Banner preview"
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => patch({ banner_url: null })}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="mt-1.5 flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 text-xs text-muted-foreground"
                  >
                    No banner set — gradient accent shows instead
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <UploadButton
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onFile={async (file) => {
                    const url = await uploadFile(file, "banner");
                    if (url) patch({ banner_url: url });
                  }}
                />
                {draft.banner_url && (
                  <button
                    type="button"
                    onClick={() => patch({ banner_url: null })}
                    className="rounded-lg border border-input px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Recommended: 1200×320px. Shows as a gradient accent when empty.
              </p>
            </div>
          )}

          {/* ── Avatar ──────────────────────────────────────────── */}
          {kind === "avatar" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {draft.avatar_url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.avatar_url}
                      alt="Avatar preview"
                      className="h-16 w-16 rounded-full border-2 border-black/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => patch({ avatar_url: null })}
                      className="absolute -right-1 -top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <UploadButton
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onFile={async (file) => {
                      const url = await uploadFile(file, "avatar");
                      if (url) patch({ avatar_url: url });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => patch({ avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}` })}
                    className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/30"
                  >
                    <Dice1 size={14} /> Randomize
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Square image, displayed as a circle. Falls back to your initials.
              </p>
            </div>
          )}

          {/* ── Bio ─────────────────────────────────────────────── */}
          {kind === "bio" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Bio</label>
              <textarea
                value={draft.bio ?? ""}
                onChange={(e) => patch({ bio: e.target.value })}
                rows={3}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Tell fans what you're about…"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Optional. Shown under your name on the guest page and home tab. Max 500 characters.
              </p>
            </div>
          )}

          {/* ── Text color + Font ───────────────────────────────── */}
          {kind === "text" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Text color</label>
              <div className="mt-1.5">
                <HexColorPicker
                  color={colors.text}
                  onChange={(v) => patch({ custom_theme: { ...draft.custom_theme, colors: { ...colors, text: v } } })}
                  style={{ width: "100%", height: 110 }}
                />
              </div>
              <div className="mt-3">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Font</label>
                <select
                  value={draft.custom_theme.fontStyle}
                  onChange={(e) =>
                    patch({ custom_theme: { ...draft.custom_theme, fontStyle: e.target.value as FontStyle } })
                  }
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="sans">Sans (clean)</option>
                  <option value="serif">Serif (classic)</option>
                  <option value="mono">Mono (tech)</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Buttons ─────────────────────────────────────────── */}
          {kind === "button" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Button style</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {BUTTON_STYLES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        patch({ custom_theme: { ...draft.custom_theme, buttonStyle: b.id } })
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        draft.custom_theme.buttonStyle === b.id
                          ? "bg-foreground text-background"
                          : "border border-input text-foreground"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Accent</label>
                <div className="mt-1.5">
                  <HexColorPicker
                    color={colors.accent}
                    onChange={(v) => patch({ custom_theme: { ...draft.custom_theme, colors: { ...colors, accent: v } } })}
                    style={{ width: "100%", height: 110 }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Card ────────────────────────────────────────────── */}
          {kind === "card" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Card color</label>
              <div className="mt-1.5">
                <HexColorPicker
                  color={colors.card}
                  onChange={(v) => patch({ custom_theme: { ...draft.custom_theme, colors: { ...colors, card: v } } })}
                  style={{ width: "100%", height: 110 }}
                />
              </div>
            </div>
          )}

          {/* ── Link ────────────────────────────────────────────── */}
          {kind === "link" && (
            <p className="text-sm text-muted-foreground">
              Use &ldquo;Links &amp; Integrations&rdquo; to edit all your links.
            </p>
          )}

          {/* ── Links ───────────────────────────────────────────── */}
          {kind === "links" && (
            <LinksEditor draft={draft} patch={patch} />
          )}
        </div>
      </div>
    </div>
  );
}
