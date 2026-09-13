/** Fan creator header — banner, avatar, name, social links (inline). */
"use client";

import Image from "next/image";
import type { CreatorBranding } from "@/lib/branding";

interface Props {
  branding: CreatorBranding;
  fanCount?: number;
  socialLinks?: Record<string, string> | null;
}

const SOCIAL_PLATFORMS: Array<{
  key:   string;
  label: string;
  icon:  React.ReactNode;
  color: string;
  buildUrl: (val: string) => string;
}> = [
  {
    key: "instagram", label: "Instagram", color: "#E1306C",
    buildUrl: (v) => v.startsWith("http") ? v : `https://instagram.com/${v.replace("@", "")}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    key: "tiktok", label: "TikTok", color: "#010101",
    buildUrl: (v) => v.startsWith("http") ? v : `https://tiktok.com/@${v.replace("@", "")}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.78a8.17 8.17 0 004.78 1.52V6.83a4.85 4.85 0 01-1.01-.14z" />
      </svg>
    ),
  },
  {
    key: "youtube", label: "YouTube", color: "#FF0000",
    buildUrl: (v) => v.startsWith("http") ? v : `https://youtube.com/@${v.replace("@", "")}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "twitter", label: "X / Twitter", color: "#000000",
    buildUrl: (v) => v.startsWith("http") ? v : `https://x.com/${v.replace("@", "")}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export function CreatorHeader({ branding, fanCount, socialLinks }: Props) {
  const activeSocials = socialLinks ? SOCIAL_PLATFORMS.filter((p) => socialLinks[p.key]) : [];

  return (
    <header className="relative">
      {branding.bannerUrl ? (
        <div className="relative h-32 w-full overflow-hidden">
          <Image src={branding.bannerUrl} alt="" fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : (
        <div className="h-24 w-full" style={{ backgroundColor: branding.accentColor, opacity: 0.15 }} />
      )}

      <div className="mx-auto max-w-lg px-4">
        <div className="flex flex-col items-center pb-6 pt-4 text-center">
          <div className="relative -mt-14 mb-4">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60 scale-110 animate-pulse" style={{ backgroundColor: branding.accentColor }} />
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center">
              {branding.avatarUrl ? (
                <Image src={branding.avatarUrl} alt={branding.displayName} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: branding.accentColor }}>
                  {(branding.displayName || "C")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: branding.fontFamily, color: branding.textColor }}>
            {branding.displayName}
          </h1>
          <p className="text-[10px] uppercase tracking-wider opacity-50 font-bold mt-0.5" style={{ color: branding.textColor }}>
            @{branding.creatorUsername}
          </p>

          {branding.description && (
            <p className="mt-3 max-w-xs text-xs leading-relaxed opacity-75 font-medium" style={{ color: branding.textColor }}>
              {branding.description}
            </p>
          )}

          {(fanCount ?? 0) > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold border" style={{ backgroundColor: branding.accentColor + "15", borderColor: branding.accentColor + "25", color: branding.accentColor }}>
              👥 {fanCount} fan{fanCount !== 1 ? "s" : ""}
            </div>
          )}

          {activeSocials.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5 flex-wrap justify-center">
              {activeSocials.map((platform) => {
                const handle = socialLinks![platform.key]!;
                const url = platform.buildUrl(handle);
                return (
                  <a
                    key={platform.key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
                    style={{ backgroundColor: platform.color + "15", color: platform.color }}
                  >
                    {platform.icon}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
