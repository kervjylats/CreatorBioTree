/**
 * themeStyles.ts — shared helpers that map a creator's branding (buttonStyle +
 * borderRadius + accentColor from branding.ts) onto inline styles + Tailwind
 * classes. Every branded button and card surface in the fan shell + My App
 * preview routes through these so theme edits (Design tab, tap-to-edit) show
 * up everywhere. buttonClass returns BOTH class and style — the style carries
 * the accent background + contrast-aware text color, so primary buttons are
 * never invisible again.
 */
import type { CSSProperties } from "react";
import type { CreatorBranding } from "@/lib/branding";

/** Dark or light hex text that stays readable on top of `hex` (WCAG-ish luminance). */
export function contrastText(hex: string): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#101010" : "#ffffff";
}

/** Radius class for the creator's `borderRadius` (cards, rows, surfaces, inputs). */
export function cardRadius(branding: CreatorBranding, extra = ""): string {
  const map: Record<string, string> = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    pill: "rounded-3xl",
    "2xl": "rounded-[1.25rem]",
  };
  const base = map[branding.borderRadius] ?? "rounded-2xl";
  return extra ? `${base} ${extra}` : base;
}

/** Radius class for the creator's `buttonStyle` (primary action buttons). */
export function buttonShape(branding: CreatorBranding): string {
  const shape: Record<string, string> = {
    rounded: "rounded-lg",
    sharp: "rounded-none",
    pill: "rounded-full",
    squircle: "rounded-[1.15rem]",
    outline: "rounded-lg",
  };
  return shape[branding.buttonStyle] ?? "rounded-lg";
}

export interface BrandedButton {
  className: string;
  style: CSSProperties;
}

/**
 * Full class + style set for a primary action button: accent background (or an
 * accent ring for the outline style) + contrast-aware text. Spread onto a
 * <button>: `<button type="button" {...buttonClass(branding, "mt-3 w-full")}>`.
 */
export function buttonClass(branding: CreatorBranding, extra = ""): BrandedButton {
  const outline = branding.buttonStyle === "outline";
  const shape = buttonShape(branding);
  const cls = `inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold ${shape}`;
  return {
    className: extra ? `${cls} ${extra}` : cls,
    style: outline
      ? { backgroundColor: "transparent", color: branding.accentColor, boxShadow: `inset 0 0 0 2px ${branding.accentColor}` }
      : { backgroundColor: branding.accentColor, color: contrastText(branding.accentColor) },
  };
}
