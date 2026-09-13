/** TODO: Add purpose docstring. */
"use client";

import { useEffect } from "react";

export function PartnerOnboarding() {
  useEffect(() => {
    // Check if we need to link a partnership from an invite code
    const checkOnboarding = async () => {
      try {
        await fetch("/api/creator/partners/onboarding", { method: "POST" });
      } catch (err) {
        // Silently fail, it's a background enhancement
        console.error("Partner onboarding failed", err);
      }
    };
    
    checkOnboarding();
  }, []);

  return null; // Invisible component
}
