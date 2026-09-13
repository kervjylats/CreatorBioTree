/** TODO: Add purpose docstring. */
"use client";

import { useEffect, useState } from "react";
import { InAppBrowserWarning } from "../pwa-install/InAppBrowserWarning";
import { InstallBanner } from "../pwa-install/InstallBanner";
import { IOSInstallGuide } from "../pwa-install/IOSInstallGuide";
import type { CreatorBranding } from "@/lib/branding";

const PLATFORM_BRANDING: CreatorBranding = {
  appName: "BioTree",
  appIconUrl: "/icons/icon-192x192.png",
  description: "Premium PWA SaaS platform for creators",
  backgroundColor: "#F7F5F0",
  accentColor: "#5A6A4A",
  textColor: "#3D3A35",
  cardColor: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
  buttonStyle: "rounded",
  borderRadius: "lg",
  creatorUsername: "",
  creatorId: "",
  avatarUrl: "/icons/icon-192x192.png",
  displayName: "BioTree",
  bannerUrl: null,
};

export function LandingPWA() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);
  }, []);

  return (
    <>
      <InAppBrowserWarning />
      {!isInstalled && (
        <>
          <InstallBanner branding={PLATFORM_BRANDING} />
          <IOSInstallGuide branding={PLATFORM_BRANDING} />
        </>
      )}
    </>
  );
}
