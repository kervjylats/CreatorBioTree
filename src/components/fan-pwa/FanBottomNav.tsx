/** FanBottomNav — branded 4-tab bottom bar (fan-shell.md Part 3; my-app.md Part 1 strip uses the same tabs). */
"use client";

import { Home, Package, Users, Settings } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import type { FanViewId } from "@/types";

interface FanBottomNavProps {
  activeTab: FanViewId;
  onTabChange: (tab: FanViewId) => void;
  branding: CreatorBranding;
}

const TABS: { id: FanViewId; label: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "content", label: "Content", Icon: Package },
  { id: "connect", label: "Connect", Icon: Users },
  { id: "settings", label: "Settings", Icon: Settings },
];

/** The 4-tab bottom nav shown inside the fan shell (and mocked on the My App phone frame). */
export function FanBottomNav({ activeTab, onTabChange, branding }: FanBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg border-t pb-[env(safe-area-inset-bottom)]"
      style={{ backgroundColor: branding.cardColor, borderColor: branding.textColor + "1A" }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-caption"
            style={{ color: active ? branding.accentColor : branding.textColor + "66" }}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
            <span
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: active ? branding.accentColor : "transparent" }}
            />
          </button>
        );
      })}
    </nav>
  );
}