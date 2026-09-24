/**
 * FanBottomNav — branded bottom bar (fan-shell.md Part 3; my-app.md Part 1).
 * In the My App preview, showGuest adds a Guest tab (red accent) so creators
 * can preview the landing page vs the 4 authenticated fan tabs.
 * In the real fan shell, showGuest is never true — only 4 tabs.
 * Tab definitions live in src/lib/nav-config.ts (single source of truth).
 */
"use client";

import { Home } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import type { FanViewId } from "@/types";
import { AUTHENTICATED_FAN_TABS, FAN_TABS, GUEST_TAB_COLOR } from "@/lib/nav-config";

interface FanBottomNavProps {
  activeTab: FanViewId;
  onTabChange: (tab: FanViewId) => void;
  branding: CreatorBranding;
  showGuest?: boolean;
  /** Override positioning classes — e.g. absolute inside a phone frame vs fixed on the real fan shell. */
  className?: string;
}

/** The bottom nav shown inside the fan shell (and mocked on the My App phone frame). */
export function FanBottomNav({ activeTab, onTabChange, branding, showGuest, className }: FanBottomNavProps) {
  const allTabs = showGuest ? FAN_TABS : AUTHENTICATED_FAN_TABS;

  return (
    <nav
      className={className ?? "fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg border-t pb-[env(safe-area-inset-bottom)] lg:hidden"}
      style={{ backgroundColor: branding.cardColor, borderColor: branding.textColor + "1A" }}
    >
      {allTabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        const isGuest = id === "guest";
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium"
            style={{
              color: isGuest
                ? active ? GUEST_TAB_COLOR : GUEST_TAB_COLOR + "88"
                : active ? branding.accentColor : branding.textColor + "66",
            }}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            {label}
            <span
              className="h-1 w-1 rounded-full"
              style={{
                backgroundColor: active
                  ? isGuest ? GUEST_TAB_COLOR : branding.accentColor
                  : "transparent",
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
