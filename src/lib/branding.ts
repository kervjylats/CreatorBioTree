/**
 * Creator Branding — Single Source of Truth
 * 
 * Every visual identity value (app name, icon, colours, fonts) is resolved here.
 * The landing page, PWA manifest, fan app shell, and install prompts all import
 * from this module — never from a raw Creator row or `as any` casts.
 */

import type { Creator, MyAppTheme, ButtonStyle } from "@/types";

// ─── Font mapping ────────────────────────────────────────────────────────────

export const FONT_MAP: Record<string, string> = {
  sans:  "Inter, system-ui, sans-serif",
  serif: "Playfair Display, Georgia, serif",
  mono:  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

// ─── Theme presets (9) ───────────────────────────────────────────────────────
//
// The 9 preset designs creators can pick in My App → Design. `resolveBranding()`
// uses these when a creator has NOT overridden a value in `custom_theme`.

export interface BrandPreset {
  /** Preset id — matches a `theme_id` value a creator can select. */
  id: string;
  /** Human-friendly preset name shown in the Design tab. */
  name: string;
  background: string;
  card: string;
  text: string;
  accent: string;
  font: "sans" | "serif" | "mono";
  button: ButtonStyle;
}

export const BRAND_PRESETS: BrandPreset[] = [
  { id: "minimal",        name: "Default",        background: "#ffffff", card: "#f9fafb", text: "#111827", accent: "#6366f1", font: "sans",  button: "rounded" },
  { id: "dark",           name: "Dark",           background: "#0f0f0f", card: "#1a1a1a", text: "#f5f5f5", accent: "#a78bfa", font: "sans",  button: "rounded" },
  { id: "coffee-shop",    name: "Coffee Shop",    background: "#f5f0eb", card: "#e8dfd6", text: "#3d2b1f", accent: "#c4956a", font: "serif", button: "pill" },
  { id: "neon-nightlife", name: "Neon Nightlife", background: "#0a0a1a", card: "#1a1a2e", text: "#e0e0ff", accent: "#ff00ff", font: "mono",  button: "sharp" },
  { id: "clear-editorial",name: "Minimal",        background: "#fbf7f0", card: "#f2ece1", text: "#2b2620", accent: "#2563eb", font: "serif", button: "rounded" },
  { id: "ocean",          name: "Ocean",          background: "#eef2ff", card: "#e0e7ff", text: "#1e1b4b", accent: "#3b82f6", font: "sans",  button: "rounded" },
  { id: "rose",           name: "Rose",           background: "#fff1f2", card: "#ffe4e6", text: "#4c0519", accent: "#e11d48", font: "serif", button: "pill" },
  { id: "emerald",        name: "Emerald",        background: "#ecfdf5", card: "#d1fae5", text: "#064e3b", accent: "#059669", font: "sans",  button: "rounded" },
  { id: "gold",           name: "Gold",           background: "#fefce8", card: "#fef9c3", text: "#713f12", accent: "#ca8a04", font: "serif", button: "pill" },
];

/** Default accent color — used as fallback across the app when no preset is selected. */
export const DEFAULT_ACCENT = "#6366f1";

/** Look up a preset by id — falls back to the Minimal preset. */
function presetById(id: string | null): BrandPreset {
  return BRAND_PRESETS.find((p) => p.id === id) ?? BRAND_PRESETS[0];
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface CreatorBranding {
  /** PWA name shown on the fan's home-screen icon */
  appName: string;
  /** Square app icon shown on the fan's phone */
  appIconUrl: string;
  /** Meta description for SEO + PWA manifest */
  description: string;
  /** Main page background colour */
  backgroundColor: string;
  /** Accent colour — buttons, links, highlights */
  accentColor: string;
  /** Primary text colour */
  textColor: string;
  /** Card / surface background colour */
  cardColor: string;
  /** CSS font-family string for body text */
  fontFamily: string;
  /** Button style — rounded, sharp, or pill */
  buttonStyle: string;
  /** Border radius — sm, md, lg, or pill */
  borderRadius: string;
  /** Creator's username (for URL building) */
  creatorUsername: string;
  /** Creator's UUID (for API calls) */
  creatorId: string;
  /** Avatar URL — fallback to platform icon */
  avatarUrl: string;
  /** Display name — fallback to username */
  displayName: string;
  /** Banner image URL (nullable) */
  bannerUrl: string | null;
  /** PWA status-bar colour — resolves to the accent colour unless overridden */
  statusBarColor: string;
  /** Combined CSS background value (gradient + image + blend) */
  backgroundCSS?: string;
  /** Background opacity 0-1 */
  backgroundOpacity?: number;
  /** AI-generated summary of what the creator offers */
  aiSummary?: string | null;
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Resolves all branding values from a raw Creator row.
 *
 * Handles every fallback chain in one place so no other file needs to do
 * `(creator.custom_theme as any)?.profile?.appName || ...` ever again.
 *
 * Identity (display_name, bio, avatar, banner) comes from Profile.
 * Design (app icon, colours, fonts) comes from My App (`custom_theme`).
 *
 * Resolution order: `custom_theme` override → the 9 presets → the minimal preset.
 */
export function resolveBranding(creator: Creator): CreatorBranding {
  const ct      = (creator.custom_theme as MyAppTheme) ?? ({} as MyAppTheme);
  const profile = ct.profile ?? ({} as MyAppTheme["profile"]);
  const colors  = ct.colors  ?? ({} as MyAppTheme["colors"]);
  const preset  = presetById(creator.theme_id);

  // App name: My App override → fallback (never leaks profile data)
  const appName    = profile.appName || "Creator App";
  const appIconUrl = profile.appIconUrl || "/icons/icon-192x192.png";
  const avatarUrl  = creator.avatar_url || "/icons/icon-192x192.png";

  // CSS font string: pick the resolved font style (override → preset → sans)
  const resolvedFont = (ct.fontStyle ?? preset.font ?? "sans") as keyof typeof FONT_MAP;
  const finalAccentColor = colors.accent || ct.accent || preset.accent;
  const fontFamily = FONT_MAP[resolvedFont] ?? FONT_MAP.sans;
  const buttonStyle = ct.buttonStyle ?? preset.button ?? "rounded";
  const borderRadius = ct.borderRadius
    ?? (buttonStyle === "sharp" ? "sm" : buttonStyle === "pill" ? "pill" : buttonStyle === "squircle" ? "2xl" : "lg");
  const statusBarColor = profile.statusBarColor || finalAccentColor;

  return {
    appName,
    appIconUrl,
    description:     creator.bio || `Exclusive content from ${creator.display_name || creator.username}`,
    backgroundColor: colors.background || preset.background,
    accentColor:     finalAccentColor,
    textColor:       colors.text || preset.text,
    cardColor:       colors.card || preset.card,
    fontFamily,
    buttonStyle,
    borderRadius,
    creatorUsername: creator.username,
    creatorId:       creator.id,
    avatarUrl,
    displayName:     creator.display_name || creator.username,
    bannerUrl:       creator.banner_url || null,
    statusBarColor,
    backgroundCSS:   colors.backgroundGradient || (colors.backgroundImage ? `url(${colors.backgroundImage})` : undefined),
    backgroundOpacity: colors.backgroundOpacity,
    aiSummary:       creator.ai_summary ?? null,
  };
}