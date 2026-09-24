/**
 * SectionTitle — reusable section header for fan shell tabs.
 * Eliminates the 13+ copy-pasted <h2> section headers across
 * FanHomeTab, FanConnectTab, and PartnerPageContent.
 */
import type { CreatorBranding } from "@/lib/branding";

interface SectionTitleProps {
  branding: CreatorBranding;
  children: React.ReactNode;
}

export function SectionTitle({ branding, children }: SectionTitleProps) {
  return (
    <h2
      className="mb-2 text-xs font-bold uppercase tracking-wide"
      style={{ color: branding.textColor + "88" }}
    >
      {children}
    </h2>
  );
}
