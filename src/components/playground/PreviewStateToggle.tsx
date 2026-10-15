/**
 * PreviewStateToggle — the phone bezel strip: an honest status beacon + the
 * Deploy button (playground.md Part 1b, founder reversal 2026-10-15). The old
 * Draft|Live pills were a DEAD control — PhonePreview never consumed that
 * state, the phone always rendered the draft, yet two pills read as two
 * preview modes ("which one am I looking at?"). Now the strip tells the
 * truth: 🟠 "Draft — not live yet" while changes pend, 🟢 "What fans see now"
 * when the draft matches the server. Width follows the frame (w-full) — must
 * fit the ~229px worst-case width (iPhone SE).
 */
"use client";

import { useState } from "react";
import { CheckCircle2, CloudUpload } from "lucide-react";

interface PreviewStateToggleProps {
  hasChanges: boolean;
  deploying: boolean;
  onDeploy: () => Promise<void>;
}

export function PreviewStateToggle({ hasChanges, deploying, onDeploy }: PreviewStateToggleProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div
        className="flex items-center justify-between gap-1 border-8 border-b-0 border-foreground/85 rounded-t-[2rem] bg-background px-2 py-2"
      >
        {hasChanges ? (
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" aria-hidden />
            <span className="truncate">Draft — not live yet</span>
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-500">
            <CheckCircle2 size={12} className="shrink-0" aria-hidden />
            <span className="truncate">What fans see now</span>
          </span>
        )}
        <button
          type="button"
          disabled={deploying || !hasChanges}
          onClick={async () => {
            setError(null);
            try {
              await onDeploy();
            } catch {
              setError("Deploy failed — try again.");
            }
          }}
          className="inline-flex min-h-11 min-w-0 shrink items-center gap-1.5 rounded-full bg-emerald-600 px-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          <CloudUpload size={12} className="shrink-0" />
          <span className="truncate">
            {deploying ? "Deploying…" : hasChanges ? "Deploy" : "Deployed"}
          </span>
        </button>
      </div>
      {error && (
        <div className="w-full px-2">
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}
    </div>
  );
}
