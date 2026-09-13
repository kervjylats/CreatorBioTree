/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect } from "react";
import type { CreatorBranding } from "@/lib/branding";
import { GuestPageContent } from "./GuestPageContent";
import { FanAuthModal } from "./FanAuthModal";
import { InstallBanner } from "../pwa-install/InstallBanner";
import { IOSInstallGuide } from "../pwa-install/IOSInstallGuide";

interface PublicCreatorPageProps {
  branding: CreatorBranding;
}

export function PublicCreatorPage({ branding }: PublicCreatorPageProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);
  }, []);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    window.location.reload();
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
      <div className="flex-1">
        <GuestPageContent
          branding={branding}
          onSignUpClick={() => setShowAuthModal(true)}
        />
      </div>

      {!isInstalled && (
        <>
          <InstallBanner branding={branding} />
          <IOSInstallGuide branding={branding} />
        </>
      )}

      {showAuthModal && (
        <FanAuthModal
          creatorId={branding.creatorId}
          creatorUsername={branding.creatorUsername}
          accentColor={branding.accentColor}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
