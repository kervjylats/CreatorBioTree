/**
 * FanAppShell.tsx — the 4-tab fan app frame (fan-shell.md Part 4b): branded
 * background, sticky bottom nav (FanBottomNav — shown at every width), the PWA
 * install trio (each piece self-hides when not applicable) and the SW
 * UpdateToast. Only fans (password-bearing sessions) ever render this shell —
 * followers stay on the guest page per the no-password render rule
 * (WIRING_PLAN Sheet 21). The header bell is a disabled placeholder until real
 * push subscriptions ship (2026-10-01 audit — it used to fake a toggle).
 */
"use client";

import { type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellOff } from "lucide-react";
import type { CreatorBranding } from "@/lib/branding";
import type { FanViewId } from "@/types";
import { FAN_TAB_BY_PATH } from "@/lib/nav-config";
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
              {/* HONEST DISABLED STATE (2026-10-01 audit): this bell used to write
                  `fan_notify_<id>` to localStorage and toast "Notifications on",
                  but nothing ever called POST /api/push/subscribe and the browser
                  was never asked for permission — so no push could arrive. It now
                  says what it actually does until push is wired. */}
              <span
                className={`${buttonShape(branding)} flex h-11 w-11 items-center justify-center`}
                style={{ color: branding.textColor + "55" }}
                title="Push notifications aren't switched on yet"
              >
                <BellOff size={18} />
              </span>
            </div>
          </div>

        </header>

        {/* PWA install layer — each piece decides its own visibility */}
        <InAppBrowserWarning />
        <InstallBanner branding={branding} />
        <IOSInstallGuide branding={branding} />

        <main className="flex-1 pb-[var(--bottom-nav-height)]">
          {children}
          <PoweredByFooter branding={branding} />
        </main>

        <UpdateToast branding={branding} />
        <PageViewTracker creatorId={creatorId} />
        <div className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] right-[max(1rem,calc(50%-var(--shell-width)/2+1rem))] z-50">
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