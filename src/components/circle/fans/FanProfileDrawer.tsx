/**
 * Slide-out drawer showing fan profile: identity, purchases, consent toggle,
 * and notes (relationships.md Part 3).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageIcon } from "@/components/messages/MessagesShell";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetchJson";
import { formatDate, money } from "@/lib/format";
import { Spinner } from "@/components/shared/Spinner";

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
    fetchJson<FanProfile>(`/api/creator/fans/${fanId}`)
      .then((data) => {
        if (data.fan) setProfile(data);
      })
      .catch(() => { toast.error("Failed to load fan profile"); })
      .finally(() => setLoading(false));
  }, [fanId, open]);

  const handleToggleDNC = async (checked: boolean) => {
    if (!fanId) return;
    const previous = profile?.fan.do_not_contact ?? false;
    setProfile((prev) =>
      prev ? { ...prev, fan: { ...prev.fan, do_not_contact: checked } } : prev,
    );
    try {
      // Verified optimistic write — a failed PATCH used to look like success
      // (2026-10-01 audit).
      await fetchJson(`/api/creator/fans/${fanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ do_not_contact: checked }),
      });
    } catch {
      setProfile((prev) =>
        prev ? { ...prev, fan: { ...prev.fan, do_not_contact: previous } } : prev,
      );
      toast.error("Couldn't update that flag");
    }
  };

  // Notes save on a debounce, not per keystroke: one PATCH per word instead of one
  // per character, and only the newest value can land last (a slow early request
  // used to be able to overwrite newer text — 2026-10-01 audit).
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesBeforeEdit = useRef<string | null>(null);

  const handleNotesChange = (notes: string) => {
    if (!fanId) return;
    // Remember the server-confirmed value once per burst, so a failed save can
    // restore it instead of blanking the field.
    if (!notesTimer.current) notesBeforeEdit.current = profile?.fan.notes ?? null;
    setProfile((prev) =>
      prev ? { ...prev, fan: { ...prev.fan, notes: notes || null } } : prev,
    );
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      notesTimer.current = null;
      void (async () => {
        try {
          await fetchJson(`/api/creator/fans/${fanId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: notes || null }),
          });
        } catch {
          setProfile((prev) =>
            prev ? { ...prev, fan: { ...prev.fan, notes: notesBeforeEdit.current } } : prev,
          );
          toast.error("Couldn't save those notes");
        }
      })();
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fan Profile</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {profile && (
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Identity</h4>
                {profile.fan.id && (
                  <MessageIcon
                    otherKey={profile.fan.id}
                    otherParty="fan"
                    name={profile.fan.email}
                  />
                )}
              </div>
              <p className="text-sm">{profile.fan.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined {formatDate(profile.fan.created_at)}
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold">Purchases</h4>
              <div className="flex gap-4 text-sm">
                <span>{profile.purchase_count} purchases</span>
                <span>{money(profile.total_spent)} total</span>
              </div>
              {profile.last_purchase_at && (
                <p className="text-xs text-muted-foreground">
                  Last: {formatDate(profile.last_purchase_at)}
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
