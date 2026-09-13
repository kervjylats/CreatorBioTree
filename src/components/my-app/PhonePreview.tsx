/**
 * PhonePreview — the full-screen phone frame (my-app.md Part 1): renders the
 * REAL fan components against draft data, swipeable Home → Content → Connect →
 * Settings with a mock FanBottomNav. In editMode every element is a
 * tap-to-edit target (onEdit → ElementPopover in MyAppForm).
 */
"use client";

import { useRef, useState, type ReactNode } from "react";
import type { FanViewId } from "@/types";
import type { FanShellData } from "@/components/fan-pwa/fanData";
import type { EditModeTarget } from "@/components/fan-pwa/GuestPageContent";
import { FanHomeTab } from "@/components/fan-pwa/FanHomeTab";
import { FanContentTab } from "@/components/fan-pwa/FanContentTab";
import { FanConnectTab } from "@/components/fan-pwa/FanConnectTab";
import { FanSettingsTab } from "@/components/fan-pwa/FanSettingsTab";
import { FanBottomNav } from "@/components/fan-pwa/FanBottomNav";

interface PhonePreviewProps {
  data: FanShellData;
  editMode: boolean;
  onEdit?: (target: EditModeTarget) => void;
}

const SURFACES: FanViewId[] = ["home", "content", "connect", "settings"];

export function PhonePreview({ data, editMode, onEdit }: PhonePreviewProps) {
  const [tab, setTab] = useState<FanViewId>("home");
  const touchX = useRef<number | null>(null);

  const surface: ReactNode = (() => {
    switch (tab) {
      case "home":
        return <FanHomeTab data={data} editMode={editMode} onEdit={onEdit} />;
      case "content":
        return <FanContentTab data={data} editMode={editMode} onEdit={onEdit} />;
      case "connect":
        return <FanConnectTab data={data} editMode={editMode} onEdit={onEdit} />;
      case "settings":
        return <FanSettingsTab data={data} />;
    }
  })();

  const swipe = (delta: number) => {
    if (Math.abs(delta) < 60) return;
    const idx = SURFACES.indexOf(tab);
    const next = delta < 0 ? idx + 1 : idx - 1;
    if (next >= 0 && next < SURFACES.length) setTab(SURFACES[next]);
  };

  return (
    <div className="w-full max-w-lg">
      {/* Phone frame — the transform makes inner `fixed` elements (bottom nav)
          anchor to the frame instead of the viewport. */}
      <div
        className="overflow-hidden rounded-[2rem] border-8 border-foreground/85 bg-background shadow-2xl"
        style={{ transform: "translateZ(0)" }}
      >
        <div
          className="relative flex h-[700px] flex-col overflow-y-auto"
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current != null) {
              swipe(e.changedTouches[0].clientX - touchX.current);
              touchX.current = null;
            }
          }}
        >
          <div className="pointer-events-none sticky top-0 z-50 mx-auto mt-1 h-5 w-24 rounded-full bg-black/80" />
          <div className="flex-1">{surface}</div>
          <FanBottomNav
            activeTab={tab}
            branding={data.branding}
            onTabChange={setTab}
          />
        </div>
      </div>
      <p className="mt-2 text-center text-caption text-muted-foreground">
        {editMode ? "Tap anything to edit it — changes are global." : "Swipe or tap to flip between fan surfaces."}
      </p>
    </div>
  );
}