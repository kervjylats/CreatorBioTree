/**
 * PhonePreview — the full-screen phone frame (my-app.md Part 1): renders the
 * REAL fan components against draft data, swipeable Home → Content → Connect →
 * Settings with a mock FanBottomNav. In editMode every element is a
 * tap-to-edit target (onEdit → ElementPopover in MyAppForm).
 *
 * Device preview toggle: Phone (390px) / Tablet (820px) / Desktop (1280px).
 * Desktop shows the real top nav instead of bottom nav.
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
import { Smartphone, Tablet, Monitor } from "lucide-react";

interface PhonePreviewProps {
  data: FanShellData;
  editMode: boolean;
  onEdit?: (target: EditModeTarget) => void;
}

const SURFACES: FanViewId[] = ["home", "content", "connect", "settings"];

type DeviceMode = "phone" | "tablet" | "desktop";

const DEVICE_WIDTHS: Record<DeviceMode, number> = {
  phone: 390,
  tablet: 820,
  desktop: 1280,
};

const DEVICE_HEIGHTS: Record<DeviceMode, number> = {
  phone: 640,
  tablet: 820,
  desktop: 720,
};

const DEVICE_ICONS: Record<DeviceMode, typeof Smartphone> = {
  phone: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const DEVICE_LABELS: Record<DeviceMode, string> = {
  phone: "Phone",
  tablet: "Tablet",
  desktop: "Desktop",
};

export function PhonePreview({ data, editMode, onEdit }: PhonePreviewProps) {
  const [tab, setTab] = useState<FanViewId>("home");
  const [device, setDevice] = useState<DeviceMode>("phone");
  const touchX = useRef<number | null>(null);
  const { branding } = data;

  const isDesktop = device === "desktop";
  const frameWidth = DEVICE_WIDTHS[device];
  const frameHeight = DEVICE_HEIGHTS[device];

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

  const handleTabChange = (t: FanViewId) => {
    if (t !== tab) setTab(t);
  };

  const navigate = (t: FanViewId) => {
    if (t !== tab) setTab(t);
  };

  return (
    <div data-tl="PhonePreview" className="w-full max-w-lg">
      {/* Device toggle */}
      <div className="mb-3 flex items-center justify-center gap-1">
        {(["phone", "tablet", "desktop"] as DeviceMode[]).map((mode) => {
          const Icon = DEVICE_ICONS[mode];
          const active = device === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setDevice(mode)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {DEVICE_LABELS[mode]}
            </button>
          );
        })}
      </div>

      {/* Frame — scaled to fit editor column */}
      <div
        className="mx-auto overflow-hidden rounded-[2rem] border-8 border-foreground/85 bg-background shadow-2xl"
        style={{
          width: frameWidth,
          height: frameHeight,
          maxWidth: "100%",
          transform: frameWidth > 400 ? `scale(min(1, ${(400) / frameWidth}))` : undefined,
          transformOrigin: "top center",
        }}
      >
        <div
          className="relative flex flex-col overflow-y-auto"
          style={{ height: frameHeight }}
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
          {/* Dynamic island notch — phone only */}
          {device === "phone" && (
            <div className="pointer-events-none sticky top-0 z-50 mx-auto mt-1 h-5 w-24 rounded-full bg-black/80" />
          )}

          {/* Desktop top nav — replaces bottom nav */}
          {isDesktop && (
            <header
              className="safe-top px-4 py-3 backdrop-blur-md"
              style={{ backgroundColor: branding.backgroundColor + "DD" }}
            >
              <div className="mx-auto flex w-full items-center justify-between">
                <span className="text-sm font-bold" style={{ color: branding.textColor }}>
                  {branding.appName}
                </span>
                <nav className="flex gap-1">
                  {SURFACES.map((t) => {
                    const active = tab === t;
                    const label = t.charAt(0).toUpperCase() + t.slice(1);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => navigate(t)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          color: active ? branding.accentColor : branding.textColor + "88",
                          backgroundColor: active ? branding.accentColor + "15" : "transparent",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </header>
          )}

          <div className="flex-1">{surface}</div>

          {/* Bottom nav — phone + tablet only */}
          {!isDesktop && (
            <FanBottomNav
              activeTab={tab}
              branding={branding}
              onTabChange={handleTabChange}
            />
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-caption text-muted-foreground">
        {editMode ? "Tap anything to edit it — changes are global." : "Swipe or tap to flip between fan surfaces."}
      </p>
    </div>
  );
}
