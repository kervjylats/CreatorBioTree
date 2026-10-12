/**
 * ProfileSection — Settings' top card: avatar + display name, the ONE edit home
 * for identity (settings.md Part 13, founder decision 2026-10-09). Avatar uploads
 * go through POST /api/creator/upload (type=avatar → public URL); both fields save
 * via PUT /api/creator/playground, which enforces the per-field 7-day cooldown
 * (409 + dated message; identical-value saves never lock). Tagline/bio/rates live
 * in the Billboard (GET/PUT /api/creator/partners/billboard — the tagline input
 * that used to sit here was removed 2026-10-01 because that route never accepted it).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/shared/Avatar";
import { fetchJson } from "@/lib/fetchJson";
import { IDENTITY_COOLDOWN_DAYS } from "@/lib/limits";

type IdentityPayload = {
  creator?: {
    display_name?: string | null;
    avatar_url?: string | null;
    display_name_changed_at?: string | null;
    avatar_changed_at?: string | null;
  };
};

type SaveResponse = {
  success?: boolean;
  display_name_changed_at?: string | null;
  avatar_changed_at?: string | null;
};

const COOLDOWN_MS = IDENTITY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/** Unlock ISO for a last-change stamp, or null when the field isn't locked. */
function unlockAt(changedAt?: string | null): string | null {
  if (!changedAt) return null;
  const t = Date.parse(changedAt);
  if (!Number.isFinite(t)) return null;
  return Date.now() < t + COOLDOWN_MS ? new Date(t + COOLDOWN_MS).toISOString() : null;
}

/** "Oct 16, 2026" for the locked-state helper line. */
function unlockLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/tiff,image/bmp";

export function ProfileSection() {
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nameChangedAt, setNameChangedAt] = useState<string | null>(null);
  const [avatarChangedAt, setAvatarChangedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // load() doubles as the post-409 refresh (a lock discovered by the server must
  // render immediately — it re-reads both stamps from GET).
  const load = async () => {
    try {
      const data = await fetchJson<IdentityPayload>("/api/creator/playground");
      const c = data?.creator;
      if (!c) return;
      const name = c.display_name ?? "";
      setDisplayName(name);
      setOriginalName(name);
      setAvatarUrl(c.avatar_url ?? null);
      setNameChangedAt(c.display_name_changed_at ?? null);
      setAvatarChangedAt(c.avatar_changed_at ?? null);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const nameUnlock = unlockAt(nameChangedAt);
  const avatarUnlock = unlockAt(avatarChangedAt);
  const nameLocked = nameUnlock !== null;
  const avatarLocked = avatarUnlock !== null;
  const trimmed = displayName.trim();
  const dirty = trimmed !== originalName;

  const saveIdentity = async (payload: Record<string, unknown>): Promise<SaveResponse> =>
    fetchJson<SaveResponse>("/api/creator/playground", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  const handleSave = async () => {
    if (!trimmed || !dirty) return;
    setSaving(true);
    try {
      const res = await saveIdentity({ display_name: trimmed });
      setNameChangedAt(res.display_name_changed_at ?? null);
      setOriginalName(trimmed);
      toast.success("Profile saved");
    } catch (err) {
      // 409 = server found a lock this screen hadn't seen yet (another tab) —
      // refresh stamps so the dated lock renders.
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const persistAvatar = async (url: string | null, successMsg: string) => {
    const res = await saveIdentity({ avatar_url: url });
    setAvatarUrl(url);
    setAvatarChangedAt(res.avatar_changed_at ?? new Date().toISOString());
    toast.success(successMsg);
  };

  const handleFile = async (file: File) => {
    if (avatarLocked) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "avatar");
      const up = await fetch("/api/creator/upload", { method: "POST", body: fd });
      const body = (await up.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!up.ok || !body?.url) throw new Error(body?.error || "Upload failed.");
      await persistAvatar(body.url, "Photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      await load();
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (avatarLocked || !avatarUrl) return;
    setUploading(true);
    try {
      await persistAvatar(null, "Photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
      await load();
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar — instant save (upload → PUT avatar_url), own 7-day lock */}
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={avatarUrl} name={trimmed || "Creator"} size="h-16 w-16" textClass="text-lg" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={avatarLocked || uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : avatarUrl ? "Replace photo" : "Upload photo"}
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={avatarLocked || uploading}
                onClick={() => void handleRemove()}
              >
                Remove
              </Button>
            )}
            {avatarLocked && avatarUnlock && (
              <span className="text-xs text-muted-foreground">
                You can change this again on {unlockLabel(avatarUnlock)}.
              </span>
            )}
          </div>
        </div>

        {/* Display name — Save button, own 7-day lock */}
        <div className="space-y-1.5">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            maxLength={80}
            disabled={nameLocked}
          />
          {nameLocked && nameUnlock && (
            <p className="text-xs text-muted-foreground">
              You can change this again on {unlockLabel(nameUnlock)}.
            </p>
          )}
        </div>

        {/* Spec rule-helper line (settings.md Part 13) */}
        <p className="text-xs text-muted-foreground">
          Your name &amp; photo appear on your fan page, Discover, landing and messages — changes
          show everywhere immediately. Each can be changed once every 7 days.
        </p>
        <p className="text-xs text-muted-foreground">
          Your tagline, bio and rates live in the Billboard — Network tab.
        </p>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || nameLocked || !dirty || !trimmed}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
