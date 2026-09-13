/**
 * FanContentTab.tsx — the Content tab of the fan app: the SAME 3-layer view as
 * the guest page (Header → Spotlight → Catalog, fan-shell.md Part 4b), because
 * the player is the page. A Guest/Fan toggle lets the creator preview both
 * perspectives: Guest view shows the Follow gate (what visitors see), Fan view
 * hides it (what logged-in fans see). Both render the same GuestPageContent.
 */
"use client";

import { useState } from "react";
import type { FanShellData } from "./fanData";
import { GuestPageContent, type EditModeTarget } from "./GuestPageContent";

interface FanContentTabProps {
  data: FanShellData;
  editMode?: boolean;
  onEdit?: (target: EditModeTarget) => void;
}

export function FanContentTab({ data, editMode, onEdit }: FanContentTabProps) {
  const [view, setView] = useState<"guest" | "fan">("fan");

  return (
    <div>
      {/* Guest / Fan view toggle */}
      <div className="flex gap-1 px-4 pt-3">
        <button
          type="button"
          onClick={() => setView("guest")}
          className={`rounded-full px-3 py-1 text-caption font-semibold ${
            view === "guest"
              ? "bg-foreground text-background"
              : "border border-input text-muted-foreground"
          }`}
        >
          Guest view
        </button>
        <button
          type="button"
          onClick={() => setView("fan")}
          className={`rounded-full px-3 py-1 text-caption font-semibold ${
            view === "fan"
              ? "bg-foreground text-background"
              : "border border-input text-muted-foreground"
          }`}
        >
          Fan view
        </button>
      </div>

      <GuestPageContent
        data={data}
        editMode={editMode}
        onEdit={onEdit}
        showFollowGate={view === "guest"}
        hideHeader={view === "fan"}
      />
    </div>
  );
}
