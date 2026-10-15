/**
 * IdentityNote — the 📌 "Who I am" sticky note (playground.md Part 1e, founder
 * decision 2026-10-15): the shared-identity quick editor. Sticky trigger at the
 * top-left of the Playground (both views) → small corner modal so the preview
 * stays visible while fields paint live. Every field edits the Playground DRAFT
 * (Local until you Deploy); Deploy publishes them and the server's 409
 * cooldown guards the 7-day locks (name / photo / app name / app icon).
 */
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/shared/Avatar";
import type { PlaygroundProfile, Creator } from "@/types";
import type { PlaygroundDraft } from "@/hooks/usePlaygroundForm";
import { BILLBOARD_LIMITS, IDENTITY_COOLDOWN_DAYS } from "@/lib/limits";
import { DEFAULT_ACCENT } from "@/lib/branding";

const COOLDOWN_MS = IDENTITY_COOLDOWN_DAYS * 86_400_000;
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/tiff,image/bmp";

/** Unlock ISO for a last-change stamp, or null when the field isn't locked. */
function unlockAt(changedAt?: string | null): string | null {
  if (!changedAt) return null;
  const t = Date.parse(changedAt);
  if (!Number.isFinite(t)) return null;
  return Date.now() < t + COOLDOWN_MS ? new Date(t + COOLDOWN_MS).toISOString() : null;
}

/** "Oct 16, 2026" for a locked-state helper line. */
function unlockLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** The muted "where this lands" line under each field (visibility map). */
function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-micro text-muted-foreground">
      <span aria-hidden>↳ </span>
      {children}
    </p>
  );
}

type UploadKind = "avatar" | "banner" | "app_icon";

interface IdentityNoteProps {
  draft: PlaygroundDraft;
  patch: (partial: Partial<PlaygroundDraft>) => void;
  /** Creator row from GET — carries the four cooldown stamps. */
  baseCreator: Creator;
  /** True while anything in the draft awaits Deploy (renders the muted line). */
  dirty: boolean;
}

export function IdentityNote({ draft, patch, baseCreator, dirty }: IdentityNoteProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const nameUnlock = unlockAt(baseCreator.display_name_changed_at);
  const avatarUnlock = unlockAt(baseCreator.avatar_changed_at);
  const appNameUnlock = unlockAt(baseCreator.app_name_changed_at);
  const appIconUnlock = unlockAt(baseCreator.app_icon_changed_at);

  const profile: PlaygroundProfile = draft.custom_theme.profile ?? { appName: "", appIconUrl: "" };
  const setProfile = (partial: Partial<PlaygroundProfile>) =>
    patch({ custom_theme: { ...draft.custom_theme, profile: { ...profile, ...partial } } });

  // Upload → public URL → draft only (no PUT). Deploy publishes it; until then
  // the preview already shows the new file (the phone renders the draft).
  const upload = async (file: File, kind: UploadKind): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", kind);
    try {
      const up = await fetch("/api/creator/upload", { method: "POST", body: fd });
      const body = (await up.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!up.ok || !body?.url) throw new Error(body?.error || "Upload failed.");
      return body.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      return null;
    }
  };

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: UploadKind,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(kind);
    try {
      const url = await upload(file, kind);
      if (!url) return;
      if (kind === "avatar") patch({ avatar_url: url });
      else if (kind === "banner") patch({ banner_url: url });
      else setProfile({ appIconUrl: url });
      toast.success(kind === "app_icon" ? "App icon set — Deploy to publish" : "Uploaded — Deploy to publish");
    } finally {
      setUploading(null);
    }
  };

  return (
    <>
      {/* Sticky trigger — top-left, both views (Part 1e). */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-tl="IdentityNoteTrigger"
        className="shrink-0"
      >
        <span aria-hidden>📌</span> Who I am
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Small corner modal (NOT fullscreen) — light backdrop so the preview
            stays visible behind; top-left anchor via self-start + mr-auto. */}
        <DialogContent
          overlayClassName="bg-background/40"
          className="max-w-[24rem] self-start mr-auto mt-6 p-5 max-h-[86dvh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Who I am</DialogTitle>
            <DialogDescription>
              Your shared identity — shows across fan page, billboard and sponsors.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Display name — 7-day lock */}
            <div className="space-y-1">
              <Input
                label="Display name"
                value={draft.display_name ?? ""}
                onChange={(e) => patch({ display_name: e.target.value })}
                placeholder="Your display name"
                maxLength={80}
                disabled={nameUnlock !== null}
              />
              {nameUnlock && (
                <p className="text-micro text-muted-foreground">
                  You can change this again on {unlockLabel(nameUnlock)}.
                </p>
              )}
            </div>

            {/* Photo — 7-day lock */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Photo</span>
              <div className="flex flex-wrap items-center gap-2">
                <Avatar
                  src={draft.avatar_url}
                  name={draft.display_name || baseCreator.username}
                  size="h-12 w-12"
                  textClass="text-sm"
                />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={AVATAR_ACCEPT}
                  className="hidden"
                  onChange={(e) => void handleFile(e, "avatar")}
                  disabled={avatarUnlock !== null}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={avatarUnlock !== null || uploading !== null}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {uploading === "avatar" ? "Uploading..." : draft.avatar_url ? "Replace photo" : "Upload photo"}
                </Button>
                {draft.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={avatarUnlock !== null || uploading !== null}
                    onClick={() => patch({ avatar_url: null })}
                  >
                    Remove
                  </Button>
                )}
                {avatarUnlock && (
                  <span className="text-micro text-muted-foreground">
                    You can change this again on {unlockLabel(avatarUnlock)}.
                  </span>
                )}
              </div>
            </div>

            {/* The retained Part 13 rule-helper line (settings.md pointer stub). */}
            <p className="text-micro text-muted-foreground">
              Your name &amp; photo appear on your fan page, Discover, landing and messages —
              changes show everywhere immediately. Each can be changed once every 7 days.
            </p>

            {/* Bio — from the Billboard view (one edit home moved here). */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="note-bio">
                Bio
              </label>
              <textarea
                id="note-bio"
                value={draft.bio ?? ""}
                onChange={(e) => patch({ bio: e.target.value })}
                placeholder="A short bio about you and your audience..."
                rows={2}
                maxLength={BILLBOARD_LIMITS.bio}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
              <Hint>Shows on: your fan page, your billboard and your media kit.</Hint>
            </div>

            {/* Banner — was orphaned (no door anywhere until now). */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Banner</span>
              <div className="flex flex-wrap items-center gap-2">
                {draft.banner_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- uploaded URL, preview-only thumbnail
                  <img
                    src={draft.banner_url}
                    alt="Banner preview"
                    className="h-10 w-24 rounded border border-border object-cover"
                  />
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept={AVATAR_ACCEPT}
                  className="hidden"
                  onChange={(e) => void handleFile(e, "banner")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading !== null}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {uploading === "banner" ? "Uploading..." : draft.banner_url ? "Replace banner" : "Upload banner"}
                </Button>
                {draft.banner_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading !== null}
                    onClick={() => patch({ banner_url: null })}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Hint>Top of your fan page.</Hint>
            </div>

            {/* App name — 7-day lock (Part 2a law, enforced server-side). */}
            <div className="space-y-1">
              <Input
                label="App name"
                value={profile.appName}
                onChange={(e) => setProfile({ appName: e.target.value })}
                placeholder="Falls back to your display name"
                maxLength={60}
                disabled={appNameUnlock !== null}
              />
              {appNameUnlock && (
                <p className="text-micro text-muted-foreground">
                  You can change this again on {unlockLabel(appNameUnlock)}.
                </p>
              )}
              <Hint>On fans&apos; phones after their app updates.</Hint>
            </div>

            {/* App icon — 7-day lock. Always renders the REAL icon fans get
                (uploaded icon, else the platform default) — never the photo,
                which used to read as "the icon changed itself" (founder report
                2026-10-15). */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">App icon</span>
              <div className="flex flex-wrap items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded URL or static public icon, preview-only */}
                <img
                  src={profile.appIconUrl || "/icons/icon-192x192.png"}
                  alt="App icon preview"
                  className="h-12 w-12 rounded-xl border border-border object-cover"
                />
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleFile(e, "app_icon")}
                  disabled={appIconUnlock !== null}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={appIconUnlock !== null || uploading !== null}
                  onClick={() => iconInputRef.current?.click()}
                >
                  {uploading === "app_icon" ? "Uploading..." : profile.appIconUrl ? "Replace icon" : "Upload icon"}
                </Button>
                {appIconUnlock && (
                  <span className="text-micro text-muted-foreground">
                    You can change this again on {unlockLabel(appIconUnlock)}.
                  </span>
                )}
              </div>
              <Hint>
                {profile.appIconUrl
                  ? "Your custom icon — on fans' phones after their app updates."
                  : "Fans see the default icon until you upload one; updates land on their phones after an app refresh."}
              </Hint>
            </div>

            {/* Status bar color — no lock (low-risk, defaults to accent). */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Status bar color</span>
                <Hint>Defaults to your accent color.</Hint>
              </div>
              <input
                type="color"
                aria-label="Status bar color"
                value={profile.statusBarColor || draft.custom_theme.accent || DEFAULT_ACCENT}
                onChange={(e) => setProfile({ statusBarColor: e.target.value })}
                className="h-9 w-14 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5"
              />
            </div>

            {/* Save-style honesty (Part 1e, founder option A). */}
            <p className="text-micro text-muted-foreground">
              {dirty ? "Local until you Deploy." : "All saved & deployed."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
