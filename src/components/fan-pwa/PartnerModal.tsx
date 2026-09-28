/**
 * PartnerModal.tsx — bottom-sheet modal (~3/4 height) that shows the partner
 * content (partner-page.md Part 2: "bottom modal, not a standalone page").
 * Renders the SAME shared PartnerBody used by the full partner page inside a
 * swipeable/draggable frame with a backdrop overlay. Follow toggle is a REAL
 * fan_follows write via usePartnerFollow (not cosmetic).
 */
"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { X } from "lucide-react";
import type { FanShellData } from "./fanData";
import { contrastText } from "./themeStyles";
import { PartnerBody, usePartnerFollow } from "./PartnerBody";

interface PartnerModalProps {
  /** The partner's username (for API calls + follow toggle). */
  partnerUsername: string;
  /** Host creator's username (for back link + follow API). */
  hostUsername: string;
  /** The branding to render inside (use host's theme for consistency). */
  data: FanShellData;
  onClose: () => void;
}

export function PartnerModal({ partnerUsername, hostUsername, data, onClose }: PartnerModalProps) {
  const { branding } = data;
  const sheetRef = useRef<HTMLDivElement>(null);
  const [partnerBranding, setPartnerBranding] = useState<typeof branding | null>(null);
  const [partnerItems, setPartnerItems] = useState<FanShellData["items"]>([]);
  const [partnerLinks, setPartnerLinks] = useState<{ label: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const { following, toggleFollow } = usePartnerFollow(partnerUsername, hostUsername);

  // Fetch partner data from their public page.
  useEffect(() => {
    setLoading(true);
    fetch(`/api/fan/partner-data?username=${encodeURIComponent(partnerUsername)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setPartnerBranding(d.branding ?? null);
          setPartnerItems(d.items ?? []);
          setPartnerLinks(d.artistLinks ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [partnerUsername]);

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on backdrop click.
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const pb = partnerBranding ?? branding;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
        style={{
          height: "75dvh",
          backgroundColor: pb.backgroundColor,
          fontFamily: pb.fontFamily,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Close + Follow bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2.5"
          style={{ borderColor: pb.textColor + "22", backgroundColor: pb.backgroundColor }}>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: pb.accentColor }}
          >
            <X size={16} /> Close
          </button>
          <button
            type="button"
            onClick={() => void toggleFollow()}
            className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
            style={{
              backgroundColor: following ? pb.textColor + "11" : pb.accentColor,
              color: following ? pb.textColor : contrastText(pb.accentColor),
            }}
          >
            {following ? "Following ✓" : "Follow"}
          </button>
        </div>

        {/* Content — shared PartnerBody */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm" style={{ color: pb.textColor + "66" }}>Loading…</span>
            </div>
          ) : !partnerBranding ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm" style={{ color: pb.textColor + "66" }}>Partner not found.</span>
            </div>
          ) : (
            <PartnerBody branding={pb} items={partnerItems} socialLinks={partnerLinks} />
          )}
        </div>
      </div>
    </div>
  );
}