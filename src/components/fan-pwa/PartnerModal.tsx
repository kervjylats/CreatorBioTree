/**
 * PartnerModal.tsx — bottom-sheet modal (~3/4 height) that shows the partner
 * content (partner-page.md Part 2: "bottom modal, not a standalone page").
 * Renders PartnerPageContent inside a swipeable/draggable frame with a
 * backdrop overlay. Follow toggle is persisted via /api/fan/follow.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { FanShellData } from "./fanData";
import { contrastText } from "./themeStyles";

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
  const [following, setFollowing] = useState(false);
  const [partnerBranding, setPartnerBranding] = useState<typeof branding | null>(null);
  const [partnerItems, setPartnerItems] = useState<FanShellData["items"]>([]);
  const [partnerLinks, setPartnerLinks] = useState<{ label: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

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
          setFollowing(d._isFollowed ?? false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [partnerUsername]);

  // Check follow state from the fan_follows table.
  useEffect(() => {
    fetch(`/api/fan/partners?username=${encodeURIComponent(hostUsername)}`)
      .then((r) => r.json())
      .then((d) => {
        const followedList = d.followed ?? [];
        setFollowing(followedList.some((p: { username: string }) => p.username === partnerUsername));
      })
      .catch(() => {});
  }, [hostUsername, partnerUsername]);

  const handleFollow = useCallback(async () => {
    const method = following ? "DELETE" : "POST";
    const res = await fetch("/api/fan/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_username: partnerUsername, current_creator_username: hostUsername }),
    });
    if (res.ok) {
      const d = await res.json();
      setFollowing(d.followed);
    }
  }, [following, partnerUsername, hostUsername]);

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
        className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl overflow-hidden"
        style={{
          height: "75vh",
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
            onClick={handleFollow}
            className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
            style={{
              backgroundColor: following ? pb.textColor + "11" : pb.accentColor,
              color: following ? pb.textColor : contrastText(pb.accentColor),
            }}
          >
            {following ? "Following ✓" : "Follow"}
          </button>
        </div>

        {/* Content */}
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
            <>
              {/* Partner identity */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold overflow-hidden"
                    style={{ backgroundColor: pb.cardColor, color: pb.textColor }}
                  >
                    {pb.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pb.avatarUrl} alt={pb.displayName} className="h-full w-full object-cover" />
                    ) : (
                      pb.displayName.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
                    )}
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold" style={{ color: pb.textColor }}>{pb.displayName}</h2>
                    <p className="text-sm" style={{ color: pb.textColor + "88" }}>@{partnerUsername}</p>
                  </div>
                </div>
              </div>

              {/* Artist links */}
              {partnerLinks.length > 0 && (
                <section className="px-4 pb-3">
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: pb.textColor + "88" }}>Links</h3>
                  <div className="flex flex-col gap-1.5">
                    {partnerLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl px-3 py-2.5"
                        style={{ backgroundColor: pb.cardColor, color: pb.textColor }}
                      >
                        <span className="text-sm font-semibold">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Catalog */}
              {partnerItems.length > 0 && (
                <section className="px-4 pb-24">
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: pb.textColor + "88" }}>Content</h3>
                  <div className="flex flex-col gap-2">
                    {partnerItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl p-3"
                        style={{ backgroundColor: pb.cardColor, color: pb.textColor }}
                      >
                        <h4 className="text-sm font-bold">{item.title}</h4>
                        {item.description && (
                          <p className="mt-1 text-xs" style={{ color: pb.textColor + "aa" }}>{item.description}</p>
                        )}
                        {item.price > 0 && item.access_type === "paid" && (
                          <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: pb.accentColor, color: contrastText(pb.accentColor) }}>
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {partnerItems.length === 0 && partnerLinks.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm" style={{ color: pb.textColor + "88" }}>No content yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
