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
import { AUTHENTICATED_FAN_TABS, FAN_TAB_BY_PATH } from "@/lib/nav-config";
import { FanBottomNav } from "./FanBottomNav";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { InstallBanner } from "./InstallBanner";
import { IOSInstallGuide } from "./IOSInstallGuide";
import { InAppBrowserWarning } from "./InAppBrowserWarning";
import { UpdateToast } from "./UpdateToast";
import { MessageIcon, MessageInboxPopover, MessageHostProvider } from "@/components/messages/MessagesShell";
import { PoweredByFooter } from "./PoweredByFooter";
import { buttonShape } from "./themeStyles";

interface FanAppShellProps {
  branding: CreatorBranding;
  creatorId: string;
  children: ReactNode;
}

export function FanAppShell({ branding, creatorId, children }: FanAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab: FanViewId = FAN_TAB_BY_PATH[pathname ?? ""] ?? "home";

  const [notify, setNotify] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(`fan_notify_${creatorId}`) === "1",
  );

  return (
    <MessageHostProvider creatorId={creatorId}>
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
              <MessageIcon
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
                className={`${buttonShape(branding)} flex h-11 w-11 items-center justify-center`}
                style={{ color: notify ? branding.accentColor : branding.textColor + "88" }}
              >
                {notify ? <Bell size={18} /> : <BellOff size={18} />}
              </button>
            </div>
          </div>

          {/* Desktop top nav — hidden on phone/tablet, visible at lg */}
          <nav className="mx-auto mt-2 hidden max-w-lg gap-1 lg:flex">
            {AUTHENTICATED_FAN_TABS.map(({ id, label }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id === activeTab) return;
                    router.push(`/${branding.creatorUsername}/${id}`);
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

        <main className="flex-1 pb-[var(--bottom-nav-height)] lg:pb-8">
          {children}
          <PoweredByFooter branding={branding} />
        </main>

        <UpdateToast branding={branding} />
        <PageViewTracker creatorId={creatorId} />
        <div className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] right-[max(1rem,calc(50%-var(--shell-width)/2+1rem))] z-50 lg:bottom-6">
          <MessageInboxPopover />
        </div>
        <FanBottomNav
          activeTab={activeTab}
          branding={branding}
          onTabChange={(tab) => {
            if (tab === activeTab) return;
            router.push(`/${branding.creatorUsername}/${tab}`);
          }}
        />
      </div>
    </MessageHostProvider>
  );
}