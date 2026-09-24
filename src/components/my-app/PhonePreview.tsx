/**
 * PhonePreview — the fluid phone frame for the My App editor.
 * Uses CSS width:100% + aspect-ratio:390/640 so the frame automatically
 * fits any screen size. Max width is 390px (set by parent container).
 * Layout mirrors FanAppShell: branded header → scrollable content (pb-20)
 * → absolute bottom nav that overlays content (matches real fixed nav).
 * Guest tab is shown as the first bottom nav tab (red accent).
 * Swipeable between tabs; Guest shows the public landing page,
 * the other 4 tabs show the authenticated fan experience.
 */
"use client";

import { useRef, type ReactNode } from "react";
import type { FanViewId } from "@/types";
import type { FanShellData } from "@/components/fan-pwa/fanData";
import { FAN_TABS } from "@/lib/nav-config";
import { GuestPageContent } from "@/components/fan-pwa/GuestPageContent";
import { FanHomeTab } from "@/components/fan-pwa/FanHomeTab";
import { FanContentTab } from "@/components/fan-pwa/FanContentTab";
import { FanConnectTab } from "@/components/fan-pwa/FanConnectTab";
import { FanSettingsTab } from "@/components/fan-pwa/FanSettingsTab";
import { FanBottomNav } from "@/components/fan-pwa/FanBottomNav";

interface PhonePreviewProps {
  data: FanShellData;
  /** Which tab is currently active — managed by parent (MyAppForm). */
  activeTab: FanViewId;
  /** Tab change handler — managed by parent (MyAppForm). */
  onTabChange: (tab: FanViewId) => void;
}

const ALL_TABS: FanViewId[] = FAN_TABS.map((t) => t.id);

export function PhonePreview({ data, activeTab, onTabChange }: PhonePreviewProps) {
  const touchX = useRef<number | null>(null);
  const { branding } = data;

  const surface: ReactNode = (() => {
    switch (activeTab) {
      case "guest":
        return <GuestPageContent data={data} showFollowGate={false} />;
      case "home":
        return <FanHomeTab data={data} />;
      case "content":
        return <FanContentTab data={data} />;
      case "connect":
        return <FanConnectTab data={data} />;
      case "settings":
        return <FanSettingsTab data={data} />;
    }
  })();

  const swipe = (delta: number) => {
    if (Math.abs(delta) < 60) return;
    const idx = ALL_TABS.indexOf(activeTab);
    const next = delta < 0 ? idx + 1 : idx - 1;
    if (next >= 0 && next < ALL_TABS.length) onTabChange(ALL_TABS[next]);
  };

  return (
    <div
      data-tl="PhonePreview"
      className="overflow-hidden rounded-b-[2rem] border-8 border-t-0 border-foreground/85 bg-background shadow-2xl w-full"
      style={{ aspectRatio: "var(--phone-width) / var(--phone-height)" }}
    >
      <div
        className="relative flex flex-col h-full"
        style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}
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
        {/* Dynamic island notch — cosmetic overlay */}
        <div className="pointer-events-none absolute top-0 left-1/2 z-50 -translate-x-1/2 mt-1 h-5 w-24 rounded-full bg-black/80" />

        {/* Branded header — matches FanAppShell (simplified: no ChatIcon/Bell in preview) */}
        <header
          className="shrink-0 px-4 py-3"
          style={{ backgroundColor: branding.backgroundColor + "DD" }}
        >
          <span className="text-sm font-bold" style={{ color: branding.textColor }}>
            {branding.appName}
          </span>
        </header>

        {/* Scrollable content area — pb-20 matches FanAppShell <main className="pb-20 lg:pb-8"> */}
        <div className="flex-1 overflow-y-auto pb-[var(--bottom-nav-height)] min-h-0">{surface}</div>

        {/* Bottom nav — absolute overlay, matches FanAppShell fixed nav behavior */}
        <FanBottomNav
          activeTab={activeTab}
          branding={branding}
          onTabChange={onTabChange}
          showGuest
          className="absolute inset-x-0 bottom-0 z-40 flex border-t"
        />
      </div>
    </div>
  );
}
