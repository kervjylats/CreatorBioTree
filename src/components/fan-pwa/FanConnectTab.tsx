/**
 * FanConnectTab.tsx — the Connect tab (fan-shell.md Part 4c): smart live-stack
 * — Partner Billboard → All Partners/Followed → Community → Artist Links → empty state.
 * Sections render ONLY when they have data; no empty placeholders.
 * Partner cards open a bottom-sheet modal (partner-page.md Part 2).
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import type { FanShellData } from "./fanData";
import { PartnerModal } from "./PartnerModal";
import { cardRadius } from "./themeStyles";

interface Partner {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string | null;
  dealWeight?: number;
}

interface FanConnectTabProps {
  data: FanShellData;
  editMode?: boolean;
  onEdit?: (target: { kind: "background" | "header" | "text" | "button" | "card" | "link" | "links"; itemId?: string }) => void;
}

export function FanConnectTab({ data, editMode, onEdit }: FanConnectTabProps) {
  const { branding } = data;
  const links = data.artistLinks ?? [];
  const [partners, setPartners] = useState<Partner[]>([]);
  const [followed, setFollowed] = useState<Partner[]>([]);
  const [billboardIndex, setBillboardIndex] = useState(0);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const fetchPartners = useCallback(() => {
    fetch(`/api/fan/partners?username=${encodeURIComponent(branding.creatorUsername)}`)
      .then((r) => r.json())
      .then((d) => {
        setPartners(d.partners ?? []);
        setFollowed(d.followed ?? []);
      })
      .catch(() => {});
  }, [branding.creatorUsername]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Deal-weighted billboard rotation — partners with deals get 2× appearance.
  const weightedPartners = partners.flatMap((p) =>
    p.dealWeight && p.dealWeight > 1 ? [p, p] : [p],
  );

  useEffect(() => {
    if (partners.length <= 1) return;
    const timer = setInterval(() => {
      setBillboardIndex((i) => (i + 1) % weightedPartners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [partners.length, weightedPartners.length]);

  const openPartner = useCallback((username: string) => {
    setSelectedPartner(username);
  }, []);

  const closePartner = useCallback(() => {
    setSelectedPartner(null);
    // Re-fetch to reflect any follow state changes.
    fetchPartners();
  }, [fetchPartners]);

  return (
    <div className="min-h-full w-full" style={{ backgroundColor: branding.backgroundColor, fontFamily: branding.fontFamily }}>
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-extrabold" style={{ color: branding.textColor }}>
          Connect
        </h1>
      </div>

      {/* Partner Billboard — taps open the partner modal (deal-weighted rotation) */}
      {partners.length > 0 && (() => {
        const currentPartner = weightedPartners[billboardIndex % weightedPartners.length];
        return (
          <section className="px-4 pt-4">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
              Partners
            </h2>
            <button
              type="button"
              onClick={() => openPartner(currentPartner.username)}
              className={cardRadius(branding, "block w-full p-4 text-left transition-all")}
              style={{ backgroundColor: branding.cardColor }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold overflow-hidden"
                  style={{ backgroundColor: branding.accentColor + "22", color: branding.textColor }}
                >
                  {currentPartner.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentPartner.avatar_url ?? ""}
                      alt={currentPartner.display_name ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    currentPartner.display_name
                      .split(/[\s@._-]+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? "")
                      .join("")
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold" style={{ color: branding.textColor }}>
                    {currentPartner.display_name}
                  </span>
                  {currentPartner.tagline && (
                    <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: branding.textColor + "aa" }}>
                      {currentPartner.tagline}
                    </p>
                  )}
                </div>
              </div>
            </button>
            {partners.length > 1 && (
              <div className="mt-2 flex justify-center gap-1.5">
                {partners.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: i === (billboardIndex % partners.length) ? branding.accentColor : branding.textColor + "22" }}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* All Partners + Followed two-column layout */}
      {partners.length > 0 && (
        <section className="px-4 pt-4">
          <div className="flex gap-4">
            {/* All Partners (left column) */}
            <div className="flex-1 min-w-0">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
                All Partners
              </h2>
              <div className="flex flex-col gap-1.5">
                {partners.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPartner(p.username)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
                    style={{ backgroundColor: branding.cardColor }}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-micro font-bold overflow-hidden"
                      style={{ backgroundColor: branding.accentColor + "22", color: branding.textColor }}
                    >
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt={p.display_name} className="h-full w-full object-cover" />
                      ) : (
                        p.display_name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
                      )}
                    </span>
                    <span className="block truncate text-xs font-semibold" style={{ color: branding.textColor }}>
                      {p.display_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Followed (right column) */}
            {followed.length > 0 && (
              <div className="flex-1 min-w-0">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
                  Followed
                </h2>
                <div className="flex flex-col gap-1.5">
                  {followed.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openPartner(p.username)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
                      style={{ backgroundColor: branding.cardColor }}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-micro font-bold overflow-hidden"
                        style={{ backgroundColor: branding.accentColor + "22", color: branding.textColor }}
                      >
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p.display_name} className="h-full w-full object-cover" />
                        ) : (
                          p.display_name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
                        )}
                      </span>
                      <span className="block truncate text-xs font-semibold" style={{ color: branding.textColor }}>
                        {p.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Community card (messaging.md Part 3 — deep-links to Home tab) */}
      {data.community && (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Community
          </h2>
          <Link
            href="/home"
            className={cardRadius(branding, "flex items-center gap-3 p-4")}
            style={{ backgroundColor: branding.cardColor }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: branding.accentColor + "22" }}>
              {data.community.icon ?? "🏠"}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold" style={{ color: branding.textColor }}>
                {data.community.name}
              </span>
              <span className="text-xs" style={{ color: branding.textColor + "77" }}>
                {data.community.isMember ? `${data.community.channels.length} channels` : "Open community"}
              </span>
            </div>
            <Users size={16} style={{ color: branding.accentColor }} />
          </Link>
        </section>
      )}

      {/* Artist Links — tappable in edit mode */}
      {(links.length > 0 || editMode) && (
        <section
          className="px-4 pt-4"
          onClick={editMode ? () => onEdit?.({ kind: "links" }) : undefined}
          role={editMode ? "button" : undefined}
          tabIndex={editMode ? 0 : undefined}
          onKeyDown={editMode ? (e) => { if (e.key === "Enter" || e.key === " ") onEdit?.({ kind: "links" }); } : undefined}
        >
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: branding.textColor + "88" }}>
            Artist links
          </h2>
          {links.length > 0 ? (
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { if (editMode) e.preventDefault(); }}
                  className={cardRadius(branding, "flex items-center justify-between px-4 py-3")}
                  style={{ backgroundColor: branding.cardColor, color: branding.textColor }}
                >
                  <span className="text-sm font-semibold">{link.label}</span>
                  <ExternalLink size={15} style={{ color: branding.accentColor }} />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: branding.textColor + "66" }}>
              No links yet — tap to add your first one.
            </p>
          )}
          {editMode && (
            <p className="mt-2 text-xs italic" style={{ color: branding.textColor + "44" }}>
              Tap to edit links and integrations
            </p>
          )}
        </section>
      )}

      {/* Partner modal (bottom-sheet) */}
      {selectedPartner && (
        <PartnerModal
          partnerUsername={selectedPartner}
          hostUsername={branding.creatorUsername}
          data={data}
          onClose={closePartner}
        />
      )}
    </div>
  );
}
