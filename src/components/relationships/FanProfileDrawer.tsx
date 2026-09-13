/**
 * Slide-out drawer showing fan profile: identity, purchases, consent toggle,
 * and notes (relationships.md Part 3).
 */
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface FanProfile {
  fan: {
    id: string;
    email: string;
    created_at: string;
    do_not_contact: boolean;
    notes: string | null;
  };
  total_spent: number;
  last_purchase_at: string | null;
  purchase_count: number;
  install_count: number;
}

interface FanProfileDrawerProps {
  fanId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Slide-out drawer showing fan profile: identity, purchases, consent toggle, and notes (relationships.md Part 3). */
export function FanProfileDrawer({
  fanId,
  open,
  onOpenChange,
}: FanProfileDrawerProps) {
  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fanId || !open) {
      setProfile(null);
      return;
    }
    setLoading(true);
    fetch(`/api/creator/fans/${fanId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.fan) setProfile(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fanId, open]);

  const handleToggleDNC = async (checked: boolean) => {
    if (!fanId) return;
    await fetch(`/api/creator/fans/${fanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ do_not_contact: checked }),
    });
    setProfile((prev) =>
      prev ? { ...prev, fan: { ...prev.fan, do_not_contact: checked } } : prev,
    );
  };

  const handleNotesChange = async (notes: string) => {
    if (!fanId) return;
    await fetch(`/api/creator/fans/${fanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes || null }),
    });
    setProfile((prev) =>
      prev ? { ...prev, fan: { ...prev.fan, notes: notes || null } } : prev,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fan Profile</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        )}
        {profile && (
          <div className="space-y-4 py-2">
            <div>
              <h4 className="text-sm font-semibold">Identity</h4>
              <p className="text-sm">{profile.fan.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(profile.fan.created_at).toLocaleDateString()}
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold">Purchases</h4>
              <div className="flex gap-4 text-sm">
                <span>{profile.purchase_count} purchases</span>
                <span>${profile.total_spent.toFixed(2)} total</span>
              </div>
              {profile.last_purchase_at && (
                <p className="text-xs text-muted-foreground">
                  Last: {new Date(profile.last_purchase_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold">Activity</h4>
              <p className="text-sm">{profile.install_count} app installs</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Do not contact</h4>
                <p className="text-xs text-muted-foreground">
                  Honored across all channels
                </p>
              </div>
              <Switch
                checked={profile.fan.do_not_contact}
                onChange={handleToggleDNC}
              />
            </div>
            <Separator />
            <div>
              <h4 className="mb-1 text-sm font-semibold">Notes</h4>
              <Textarea
                placeholder="Add a note about this fan..."
                value={profile.fan.notes ?? ""}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
