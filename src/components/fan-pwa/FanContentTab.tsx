/**
 * FanContentTab.tsx — the Content tab of the fan app: the SAME 3-layer view as
 * the guest page (Header → Spotlight → Catalog, fan-shell.md Part 4b), because
 * the player is the page. Renders the FAN perspective only — no Follow gate,
 * no creator header (the shell supplies that) — so real fans get a clean
 * catalog. The visitor perspective lives on the preview's Guest tab instead
 * (founder decision 2026-09-25: the old Guest/Fan toggle was redundant with
 * that tab, and its pills leaked into the real fan app through this file).
 */
"use client";

import type { FanShellData } from "./fanData";
import { GuestPageContent, type EditModeTarget } from "./GuestPageContent";

interface FanContentTabProps {
  data: FanShellData;
  editMode?: boolean;
  onEdit?: (target: EditModeTarget) => void;
}

export function FanContentTab({ data, editMode, onEdit }: FanContentTabProps) {
  return (
    <div>
      <div className="mx-auto w-full max-w-lg">
        <GuestPageContent
          data={data}
          editMode={editMode}
          onEdit={onEdit}
          showFollowGate={false}
          hideHeader
        />
      </div>
    </div>
  );
}
