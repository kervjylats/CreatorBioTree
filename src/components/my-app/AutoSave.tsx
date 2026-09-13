/** My App draft chrome — "changes are local until you deploy" indicator + Unsaved Changes modal (my-app.md Parts 4b/4d). */
"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Small amber pill shown when un-deployed changes exist (my-app.md Part 4d
 * "Unsaved badge (amber pill)"). Duplicates the orange Draft dot on the
 * PreviewStateToggle for editors who are inside the sheet.
 */
export function AutoSaveStatus({ hasChanges, saving }: { hasChanges: boolean; saving: boolean }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        Saving…
      </span>
    );
  }
  if (!hasChanges) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Unsaved — local until you deploy
    </span>
  );
}

interface UnsavedChangesModalProps {
  open: boolean;
  onCancel: () => void;
  onLeaveWithoutSaving: () => void;
  onSaveAndLeave: () => void;
}

/**
 * Shown when navigating away with un-deployed changes (my-app.md Part 4b).
 * Wired by the My App screen: listens for the `my-app:unsaved-leave` CustomEvent
 * (dispatched by the sidebar nav guard with the pending href) and lets the user
 * Save & Leave / Leave without saving / Cancel. "Don't ask again" preference is
 * persisted locally in this component's parent.
 */
export function UnsavedChangesModal({ open, onCancel, onLeaveWithoutSaving, onSaveAndLeave }: UnsavedChangesModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>You have unsaved changes</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Your edits are saved in this browser until you deploy. Leave now and they&apos;ll still be
          here next time.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={onSaveAndLeave}>Save &amp; Leave</Button>
          <Button variant="outline" onClick={onLeaveWithoutSaving}>
            Leave without saving
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}