/**
 * ProfileEditDialog — the ✏️ gateway explainer (settings.md Part 13, founder
 * decision 2026-10-09 option B; target repointed 2026-10-15). Opened from the
 * dashboard sidebar identity block and the BillboardPreview card: shows the
 * identity rules + sends the creator to the Playground's 📌 "Who I am" note,
 * the one edit home (playground.md Part 1e). Deliberately shows on EVERY
 * press — it is the explainer + gateway, not a one-time tip.
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

  const goToPlayground = () => {
    onOpenChange(false);
    router.push("/dashboard/playground");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit your name &amp; photo</DialogTitle>
          <DialogDescription>
            Your display name and photo appear on your fan page, Discover, landing and messages —
            changes show everywhere immediately. ⚠️ You can change each once every 7 days.
            Edit them in the 📌 &quot;Who I am&quot; note (top-left of the Playground).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button type="button" onClick={goToPlayground}>
            Open Playground
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
