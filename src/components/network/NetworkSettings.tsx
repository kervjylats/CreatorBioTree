/**
 * NetworkSettings — the Network Discover card holding the ONE instant-save
 * switch, "Accept collab requests" (network.md §3 — the only switch since
 * 2026-10-09; "Show me in search" was removed with the FB model). Extracted
 * from BillboardEditor 2026-10-09 when the design-field editors moved to
 * Playground's Billboard view (playground.md Part 1d): Network sees + toggles,
 * the Playground designs.
 */
"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LABEL_CLASS } from "@/lib/ui-constants";

interface NetworkSettingsProps {
  openToCollab: boolean;
  /** Instant-save toggle — parent PUTs the single field. */
  onToggle: (field: "open_to_collab") => void;
}

export function NetworkSettings({ openToCollab, onToggle }: NetworkSettingsProps) {
  return (
    <Card className="p-4">
      <p className={LABEL_CLASS}>Collab requests</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">Accept collab requests</span>
          <span className="block text-xs text-muted-foreground">
            Show you in the collab feed and let creators Connect.
          </span>
        </span>
        <Switch
          checked={openToCollab}
          onCheckedChange={() => onToggle("open_to_collab")}
          aria-label="Accept collab requests"
        />
      </div>
    </Card>
  );
}
