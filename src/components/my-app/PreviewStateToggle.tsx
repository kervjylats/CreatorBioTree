/**
 * PreviewStateToggle — Draft / Live toggle + Deploy button.
 * Renders as a thin bar that sits directly above the phone frame,
 * matching its width and border styling. Uses w-full so the bar
 * automatically matches the phone width (max 390px from parent).
 */
"use client";

import { useState } from "react";
import { CloudUpload } from "lucide-react";

export type PreviewState = "draft" | "live";

interface PreviewStateToggleProps {
  state: PreviewState;
  onChange: (state: PreviewState) => void;
  hasChanges: boolean;
  deploying: boolean;
  onDeploy: () => Promise<void>;
}

export function PreviewStateToggle({ state, onChange, hasChanges, deploying, onDeploy }: PreviewStateToggleProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div
        className="flex items-center justify-between border-8 border-b-0 border-foreground/85 rounded-t-[2rem] bg-background px-3 py-2"
      >
        <div className="flex rounded-full border border-input p-0.5">
          {(["draft", "live"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={`relative rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                state === s ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {s}
              {s === "draft" && hasChanges && state === s && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={deploying || !hasChanges}
          onClick={async () => {
            setError(null);
            try {
              await onDeploy();
              onChange("live");
            } catch {
              setError("Deploy failed — try again.");
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          <CloudUpload size={12} /> {deploying ? "Deploying…" : hasChanges ? "Deploy" : "Deployed"}
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
