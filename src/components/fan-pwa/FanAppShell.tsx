/**
 * FanAppShell.tsx — the 4-tab fan app frame (fan-shell.md Part 4b): branded
 * background, sticky bottom nav (FanBottomNav), a bell with a local notify
 * toggle, the PWA install trio (each piece self-hides when not applicable)
 * and the SW UpdateToast. Only fans (password-bearing sessions) ever render
 * this shell — followers stay on the guest page per the no-password render
 * rule (WIRING_PLAN Sheet 21).
 */
"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import type { CreatorBranding } from "@/lib/branding";
import type { FanViewId } from "@/types";
import { FanBottomNav } from "./FanBottomNav";
import { PageViewTracker } from "./PageViewTracker";
import { InstallBanner } from "./InstallBanner";
import { IOSInstallGuide } from "./IOSInstallGuide";
import { InAppBrowserWarning } from "./InAppBrowserWarning";
import { UpdateToast } from "./UpdateToast";
import { ChatIcon, ChatInboxPopover } from "@/components/chat/ChatShell";
import { buttonShape } from "./themeStyles";

interface FanAppShellProps {
  branding: CreatorBranding;
  creatorId: string;
  children: ReactNode;
}

const TAB_BY_PATH: Record<string, FanViewId> = {
  "/home": "home",
  "/content": "content",
  "/connect": "connect",
  "/settings": "settings",
};

export function FanAppShell({ branding, creatorId, children }: FanAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab: FanViewId = TAB_BY_PATH[pathname ?? ""] ?? "home";

  const [notify, setNotify] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(`fan_notify_${creatorId}`) === "1",
  );

  return (
    <div
      data-tl="FanAppShell"
      className="flex min-h-screen-safe w-full flex-col"
      style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 safe-top px-4 py-3 backdrop-blur-md"
        style={{ backgroundColor: branding.backgroundColor + "DD" }}
      >
        <div className="mx-auto flex w-full max-w-lg items-center justify-between">
          <span className="text-sm font-bold" style={{ color: branding.textColor }}>
            {branding.appName}
          </span>
          <div className="flex items-center gap-2">
            <ChatIcon
              otherKey={creatorId}
              otherParty="creator"
              name={branding.displayName}
              accentColor={branding.accentColor}
            />
            <button
              type="button"
              aria-label={notify ? "Mute notifications" : "Turn on notifications"}
              onClick={() => {
                const next = !notify;
                setNotify(next);
                window.localStorage.setItem(`fan_notify_${creatorId}`, next ? "1" : "0");
                toast(next ? "Notifications on" : "Notifications muted");
              }}
              className={`${buttonShape(branding)} p-2`}
              style={{ color: notify ? branding.accentColor : branding.textColor + "88" }}
            >
              {notify ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
          </div>
        </div>

        {/* Desktop top nav — hidden on phone/tablet, visible at lg */}
        <nav className="mx-auto mt-2 hidden max-w-lg gap-1 lg:flex">
          {(["home", "content", "connect", "settings"] as const).map((tab) => {
            const active = activeTab === tab;
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === activeTab) return;
                  if (tab === "home") router.push(`/${branding.creatorUsername}/home`);
                  else router.push(`/${branding.creatorUsername}/${tab}`);
                }}
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
      </header>

      {/* PWA install layer — each piece decides its own visibility */}
      <InAppBrowserWarning />
      <InstallBanner branding={branding} />
      <IOSInstallGuide branding={branding} />

      <main className="flex-1 pb-20 lg:pb-8">{children}</main>

      <UpdateToast branding={branding} />
      <PageViewTracker creatorId={creatorId} />
      <ChatInboxPopover />
      <FanBottomNav
        activeTab={activeTab}
        branding={branding}
        onTabChange={(tab) => {
          if (tab === activeTab) return;
          if (tab === "home") router.push(`/${branding.creatorUsername}/home`);
          else router.push(`/${branding.creatorUsername}/${tab}`);
        }}
      />
    </div>
  );
}