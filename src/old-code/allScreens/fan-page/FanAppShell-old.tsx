/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect } from "react";
import type { CreatorBranding } from "@/lib/branding";
import type { FanViewId } from "@/types";
import { Button } from "@/components/ui/button";
import { FanBottomNav } from "./FanBottomNav";
import { FanHomeTab } from "./FanHomeTab";
import { FanContentTab } from "./FanContentTab";
import { FanConnectTab } from "./FanConnectTab";
import { FanSettingsTab } from "./FanSettingsTab";
import { FanAuthModal } from "./FanAuthModal";
import { InAppBrowserWarning } from "../pwa-install/InAppBrowserWarning";
import { InstallBanner } from "../pwa-install/InstallBanner";
import { IOSInstallGuide } from "../pwa-install/IOSInstallGuide";
import { UpdateToast } from "../pwa-install/UpdateToast";
import { PageViewTracker } from "./PageViewTracker";



interface FanAppShellProps {
  branding: CreatorBranding;
  fanId: string | null;
  creatorId: string;
}

export function FanAppShell({ branding, fanId: initialFanId, creatorId }: FanAppShellProps) {
  const [activeTab, setActiveTab] = useState<FanViewId>("home");
  const [isInstalled, setIsInstalled] = useState(false);
  const [fanId, setFanId] = useState<string | null>(initialFanId);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    if ("clearAppBadge" in navigator) {
      (navigator as any).clearAppBadge?.();
    }
  }, []);

  const handleAuthSuccess = (newFanId: string) => {
    setFanId(newFanId);
    setShowAuthModal(false);
    window.location.reload();
  };

  const handleLogout = () => {
    document.cookie = "fan_session=; path=/; max-age=0";
    setFanId(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        color: branding.textColor,
        fontFamily: branding.fontFamily,
      }}
    >
      <div className="fixed inset-0 -z-10" style={{
        backgroundColor: branding.backgroundColor,
        backgroundImage: branding.backgroundCSS,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: branding.backgroundOpacity ?? 1,
      }} />
      <PageViewTracker creatorId={creatorId} />
      <UpdateToast branding={branding} />
      <InAppBrowserWarning />

      <div className="relative">
        <div className="absolute top-4 right-4 z-20">
          {fanId ? (
            <Button
              onClick={() => setActiveTab("settings")}
              size="sm"
              styleColor={branding.accentColor}
            >
              My Account
            </Button>
          ) : (
            <Button
              onClick={() => setShowAuthModal(true)}
              size="sm"
              styleColor={branding.accentColor}
            >
              Sign Up / Login
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === "home" && (
          <FanHomeTab branding={branding} />
        )}
        {activeTab === "content" && (
          <FanContentTab branding={branding} />
        )}
        {activeTab === "connect" && (
          <FanConnectTab branding={branding} />
        )}
        {activeTab === "settings" && (
          <FanSettingsTab
            branding={branding}
            fanId={fanId}
            onLoginClick={() => setShowAuthModal(true)}
            onLogout={handleLogout}
          />
        )}
      </div>

      <FanBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        branding={branding}
      />

      {!isInstalled && (
        <>
          <InstallBanner branding={branding} />
          <IOSInstallGuide branding={branding} />
        </>
      )}

      {showAuthModal && (
        <FanAuthModal
          creatorId={creatorId}
          creatorUsername={branding.creatorUsername}
          accentColor={branding.accentColor}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
