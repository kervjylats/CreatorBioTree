/**
 * ProfileEditDialog — the ✏️ gateway explainer (settings.md Part 13, founder
 * decision 2026-10-09 option B). Opened from the dashboard sidebar identity block
 * and the BillboardPreview card: shows the identity rules + sends the creator to
 * Settings → Profile, the one edit home. Deliberately shows on EVERY press — it is
 * the explainer + gateway, not a one-time tip.
 */
"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const router = useRouter();

  const goToSettings = () => {
    onOpenChange(false);
    router.push("/dashboard/settings");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit your name &amp; photo</DialogTitle>
          <DialogDescription>
            Your display name and photo appear on your fan page, Discover, landing and messages —
            changes show everywhere immediately. ⚠️ You can change each once every 7 days.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button type="button" onClick={goToSettings}>
            Open Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
