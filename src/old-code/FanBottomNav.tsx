/** TODO: Add purpose docstring. */
"use client";

import { Home, Package, Users, Settings } from "lucide-react";
import type { FanViewId } from "@/types";
import type { CreatorBranding } from "@/lib/branding";

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

export function FanBottomNav({ activeTab, onTabChange, branding }: FanBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t safe-area-bottom"
      style={{
        backgroundColor: branding.cardColor,
        borderColor: branding.textColor + "10",
      }}
    >
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const { Icon } = tab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 transition"
              style={{
                color: isActive ? branding.accentColor : branding.textColor + "60",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}