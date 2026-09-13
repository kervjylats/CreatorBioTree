/** TODO: Add purpose docstring. */
"use client";

import { useRef, useState, useEffect } from "react";
import type { PlaygroundTheme, FanViewId } from "@/types";
import { FONT_MAP } from "@/lib/branding";
import { GuestPageContent } from "@/components/fan-pwa/GuestPageContent";
import { FanHomeTab } from "@/components/fan-pwa/FanHomeTab";
import { FanContentTab } from "@/components/fan-pwa/FanContentTab";
import { FanConnectTab } from "@/components/fan-pwa/FanConnectTab";
import { FanSettingsTab } from "@/components/fan-pwa/FanSettingsTab";

export type PhoneSelection = { type: "content"; itemId: string } | { type: "social"; platform: string } | { type: "app-identity" } | null;

const BOTTOM_TABS: { id: FanViewId; label: string }[] = [
  { id: "home", label: "🏠" },
  { id: "content", label: "📦" },
  { id: "connect", label: "🔗" },
  { id: "settings", label: "⚙️" },
];

const MINI_VIEWS: { id: FanViewId; label: string }[] = [
  { id: "guest", label: "Guest" },
  { id: "home", label: "Home" },
  { id: "content", label: "Content" },
  { id: "connect", label: "Connect" },
  { id: "settings", label: "Settings" },
];

interface PhonePreviewProps {
  theme: PlaygroundTheme;
  branding: {
    appName: string; appIconUrl: string; description: string;
    backgroundColor: string; accentColor: string; textColor: string; cardColor: string;
    fontFamily: string; buttonStyle: string; borderRadius: string;
    creatorUsername: string; creatorId: string; avatarUrl: string;
    displayName: string; bannerUrl: string | null;
  };
  selection: PhoneSelection;
  onSelect: (sel: PhoneSelection) => void;
  activeView: FanViewId;
  onViewChange?: (view: FanViewId) => void;
  guestMode: boolean;
  showMiniStrip?: boolean;
}

function MiniPhone({ id, label, theme, isActive, onClick }: {
  id: FanViewId; label: string; theme: PlaygroundTheme;
  isActive: boolean; onClick: () => void;
}) {
  const isGuest = id === "guest";
  const isHome = id === "home";
  const isConnect = id === "connect";
  const isSettings = id === "settings";

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onClick}>
      <div
        className={`w-14 h-24 rounded-lg border-2 overflow-hidden relative flex-shrink-0 transition-all ${isActive ? "shadow-md" : ""}`}
        style={{
          backgroundColor: theme.colors.background,
          borderColor: isActive ? theme.colors.accent : theme.colors.text + "20",
          boxShadow: isActive ? `0 0 0 2px ${theme.colors.accent}` : undefined,
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-gray-900 rounded-b-sm z-10" />
        <div className="h-full flex flex-col pt-2 px-1">
          {isGuest ? (
            <div className="flex flex-col items-center justify-center h-full gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
              <div className="w-6 h-1 rounded-full" style={{ backgroundColor: theme.colors.text + "30" }} />
              <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: theme.colors.text + "20" }} />
            </div>
          ) : isSettings ? (
            <div className="flex flex-col gap-0.5 pt-1">
              <div className="w-full h-1.5 rounded-sm" style={{ backgroundColor: theme.colors.card }} />
              <div className="flex items-center gap-0.5 pt-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                <div className="flex-1 h-0.5 rounded-sm" style={{ backgroundColor: theme.colors.text + "20" }} />
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between pt-0.5">
                  <div className="w-2 h-0.5 rounded-sm" style={{ backgroundColor: theme.colors.text + "20" }} />
                  <div className="w-1.5 h-1 rounded-sm" style={{ backgroundColor: theme.colors.accent + "40" }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="w-full h-1.5 rounded-sm mb-0.5" style={{ backgroundColor: theme.colors.card }} />
              <div className="flex flex-col gap-0.5 flex-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full h-1 rounded-sm" style={{ backgroundColor: theme.colors.text + (isConnect && i === 3 ? "40" : "15") }} />
                ))}
              </div>
            </>
          )}
          {!isGuest && !isSettings && (
            <div className="mt-auto mb-0.5 flex justify-around" style={{ color: theme.colors.text + "30" }}>
              {[1, 2, 3, 4].map((d) => (
                <div key={d} className="w-1 h-0.5 rounded-sm" style={{ backgroundColor: theme.colors.text + "20" }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <span className="text-[7px] font-medium text-gray-400 truncate max-w-14 text-center">{label}</span>
    </div>
  );
}

export function PhonePreview({
  theme, branding, selection, onSelect, activeView, onViewChange, guestMode, showMiniStrip,
}: PhonePreviewProps) {
  const previewFont = FONT_MAP[theme.fontStyle] || FONT_MAP.sans;
  const colors = theme.colors;
  const bgLayers: string[] = [];
  if (colors.fillType === "gradient" && colors.backgroundGradient) bgLayers.push(colors.backgroundGradient);
  if (colors.backgroundImage) bgLayers.push(`url(${colors.backgroundImage})`);
  const bgCSS = bgLayers.length > 0 ? bgLayers.join(", ") : undefined;
  const bgOpacity = colors.backgroundOpacity ?? 1;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const NATIVE_W = 260;
  const NATIVE_H = 520;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / NATIVE_W, height / NATIVE_H, 1.4) || 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col w-full h-full">
      <div ref={wrapperRef} className="flex-1 flex items-center justify-center overflow-hidden">
        <div style={{ width: NATIVE_W, height: NATIVE_H, transform: `scale(${scale})` }} className="flex-shrink-0">
          <div className="w-full h-full rounded-[2rem] border-[6px] border-gray-900 overflow-hidden bg-white shadow-2xl relative"
            style={{ fontFamily: previewFont }}
            onClick={() => onSelect(null)}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-2xl z-30" />
            <div className="absolute inset-0" style={{
              backgroundColor: theme.colors.background, backgroundImage: bgCSS,
              backgroundSize: "cover", backgroundPosition: "center",
              backgroundBlendMode: colors.backgroundBlend || undefined, opacity: bgOpacity,
            }} />
            <div className="relative h-full flex flex-col">
              <div className="flex-1 overflow-y-auto pt-8" style={{ scrollbarWidth: "none" }}>
                {guestMode ? (
                  <GuestPageContent
                    branding={branding}
                    selection={selection}
                    onSelect={onSelect}
                  />
                ) : activeView === "home" ? (
                  <FanHomeTab branding={branding} />
                ) : activeView === "content" ? (
                  <FanContentTab branding={branding} />
                ) : activeView === "connect" ? (
                  <FanConnectTab branding={branding} />
                ) : activeView === "settings" ? (
                  <FanSettingsTab branding={branding} fanId={null} onLoginClick={() => {}} onLogout={() => {}} />
                ) : null}
              </div>
              {!guestMode && (
                <div className="flex items-center justify-around px-2 pb-1 pt-1 border-t border-gray-100"
                  style={{ backgroundColor: theme.colors.card }}>
                  {BOTTOM_TABS.map((tab) => {
                    const isActive = activeView === tab.id;
                    return (
                      <button key={tab.id}
                        onClick={(e) => { e.stopPropagation(); onViewChange?.(tab.id); }}
                        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all text-[11px] cursor-pointer ${isActive ? "scale-110" : "opacity-50"}`}
                        style={{ color: isActive ? theme.colors.accent : theme.colors.text }}>
                        <span>{tab.label}</span>
                        {isActive && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.colors.accent }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMiniStrip && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-lg mx-auto">
            <div className="flex gap-2.5 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: "none" }}>
              {MINI_VIEWS.map((view) => (
                <MiniPhone
                  key={view.id}
                  id={view.id}
                  label={view.label}
                  theme={theme}
                  isActive={activeView === view.id}
                  onClick={() => onViewChange?.(view.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
