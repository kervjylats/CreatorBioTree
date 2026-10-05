/**
 * ProfileSection — display name edit for the creator profile.
 * Reads from GET /api/creator/playground, saves via PUT /api/creator/playground.
 * The tagline input that used to live here was removed (2026-10-01 audit): the
 * deploy route never selected or accepted `tagline`, so the field rendered blank
 * and its edits were silently discarded while a "Profile saved" toast fired. The
 * tagline has exactly one editor — the Billboard on the Network tab (which
 * writes it through /api/creator/billboard and shares BILLBOARD_LIMITS.tagline).
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/fetchJson";

export function ProfileSection() {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJson<{ creator?: { display_name?: string | null } }>("/api/creator/playground")
      .then((data) => {
        const c = data?.creator;
        if (c) setDisplayName(c.display_name ?? "");
      })
      .catch(() => { toast.error("Failed to load profile"); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchJson("/api/creator/playground", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
        }),
      });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
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
      <CardContent className="space-y-4">
        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
        />
        <p className="text-xs text-muted-foreground">
          Your tagline, bio and rates live in the Billboard — Network tab.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
