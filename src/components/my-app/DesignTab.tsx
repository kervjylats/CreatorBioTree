/**
 * DesignTab — the theme editor (my-app.md Part 2b), compact layout: color
 * picker at top, one-click presets dropdown (+ Surprise me) with a live swatch
 * strip, font / buttons / card-corner controls, and reset at the bottom.
 * Bio + avatar are edited via the phone preview header tap-to-edit (ElementPopover),
 * not here. Writes to the draft only — Deploy pushes to the fan app.
 */
"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Shuffle } from "lucide-react";
import { BRAND_PRESETS } from "@/lib/branding";
import type { ButtonStyle, FontStyle } from "@/types";
import type { MyAppDraft } from "@/hooks/useMyAppForm";

interface DesignTabProps {
  draft: MyAppDraft;
  patch: (partial: Partial<MyAppDraft>) => void;
}

const FONT_OPTIONS: { id: FontStyle; label: string }[] = [
  { id: "sans", label: "Sans (clean)" },
  { id: "serif", label: "Serif (classic)" },
  { id: "mono", label: "Mono (tech)" },
];

const BUTTON_STYLES: { id: ButtonStyle; label: string }[] = [
  { id: "rounded", label: "Rounded" },
  { id: "sharp", label: "Sharp" },
  { id: "pill", label: "Pill" },
  { id: "squircle", label: "Squircle" },
  { id: "outline", label: "Outline" },
];

const RADII: { id: string; label: string }[] = [
  { id: "sm", label: "Small" },
  { id: "md", label: "Medium" },
  { id: "lg", label: "Large" },
  { id: "2xl", label: "Extra large" },
  { id: "pill", label: "Pill" },
];

type ColorKey = "background" | "card" | "text" | "accent";

const COLOR_TABS: { key: ColorKey; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "card", label: "Cards" },
  { key: "text", label: "Text" },
  { key: "accent", label: "Accent" },
];

/** Find the preset whose full palette matches the draft — "" when the creator has customized colors. */
function presetMatchingDraft(draft: MyAppDraft): string {
  const { colors, fontStyle, buttonStyle } = draft.custom_theme;
  return (
    BRAND_PRESETS.find(
      (p) =>
        p.background === colors.background &&
        p.card === colors.card &&
        p.text === colors.text &&
        p.accent === colors.accent &&
        p.font === fontStyle &&
        p.button === buttonStyle,
    )?.id ?? ""
  );
}

export function DesignTab({ draft, patch }: DesignTabProps) {
  const colors = draft.custom_theme.colors;
  const [presetSel, setPresetSel] = useState<string>(() => presetMatchingDraft(draft));
  const [colorTarget, setColorTarget] = useState<ColorKey>("background");

  const setColor = (key: ColorKey, value: string) =>
    patch({ custom_theme: { ...draft.custom_theme, colors: { ...colors, [key]: value } } });

  const applyPreset = (preset: (typeof BRAND_PRESETS)[number]) => {
    patch({
      custom_theme: {
        ...draft.custom_theme,
        fontStyle: (preset.font as FontStyle) ?? "sans",
        buttonStyle: (preset.button as ButtonStyle) ?? "rounded",
        accent: preset.accent,
        borderRadius: preset.button === "pill" ? "pill" : "lg",
        colors: {
          background: preset.background,
          card: preset.card,
          text: preset.text,
          accent: preset.accent,
          backgroundImage: null,
          backgroundGradient: null,
        },
      },
    });
  };

  const surprise = () => {
    const preset = BRAND_PRESETS[Math.floor(Math.random() * BRAND_PRESETS.length)];
    setPresetSel(preset.id);
    applyPreset(preset);
  };

  const setGradient = (second: string | null) => {
    const first = colors.background;
    patch({
      custom_theme: {
        ...draft.custom_theme,
        colors: { ...colors, backgroundGradient: second ? `linear-gradient(135deg, ${first}, ${second})` : null },
      },
    });
  };

  return (
    <div data-tl="DesignTab" className="space-y-4">
      {/* 1. Colors — one picker, four tabs */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Colors</label>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {COLOR_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setColorTarget(key)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-caption font-semibold ${
                colorTarget === key ? "bg-foreground text-background" : "border border-input text-foreground"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-black/10"
                style={{ backgroundColor: colors[key] }}
              />
              {label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-start gap-2">
          <HexColorPicker color={colors[colorTarget]} onChange={(v) => setColor(colorTarget, v)} style={{ width: "100%", height: 130 }} />
          <input
            value={colors[colorTarget]}
            onChange={(e) => setColor(colorTarget, e.target.value)}
            aria-label={`${colorTarget} hex`}
            className="w-24 rounded-lg border border-input bg-background px-2 py-1.5 text-xs uppercase"
          />
        </div>
      </div>

      {/* 2. Gradient (optional) */}
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <input
            type="checkbox"
            checked={Boolean(colors.backgroundGradient)}
            onChange={(e) => setGradient(e.target.checked ? "#00000022" : null)}
          />
          Gradient — smooth fade from the background color
        </label>
        {colors.backgroundGradient && (
          <div className="mt-2">
            <HexColorPicker
              color={colors.backgroundGradient.split(",")[1]?.trim()?.replace(/\)$/, "") ?? "#00000022"}
              onChange={(v) => setGradient(v)}
              style={{ width: "100%", height: 120 }}
            />
          </div>
        )}
      </div>

      {/* 3. Presets — dropdown + Surprise me + live swatches */}
      <div>
        <div className="flex items-center gap-2">
          <select
            aria-label="One-click presets"
            value={presetSel}
            onChange={(e) => {
              const preset = BRAND_PRESETS.find((p) => p.id === e.target.value);
              if (!preset) return;
              setPresetSel(preset.id);
              applyPreset(preset);
            }}
            className="h-9 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">Choose a preset…</option>
            {BRAND_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={surprise}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-input px-3 text-xs font-semibold text-foreground"
          >
            <Shuffle size={12} /> Surprise me
          </button>
        </div>
        {/* Live swatch strip of the current colors */}
        <div className="mt-2 flex items-center gap-1.5">
          {COLOR_TABS.map(({ key, label }) => (
            <span
              key={key}
              title={label}
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ backgroundColor: colors[key] }}
            />
          ))}
          <span className="ml-1 text-caption text-muted-foreground">Background · Cards · Text · Accent</span>
        </div>
      </div>

      {/* 4. Font + buttons */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Font</label>
          <select
            value={draft.custom_theme.fontStyle}
            onChange={(e) => patch({ custom_theme: { ...draft.custom_theme, fontStyle: e.target.value as FontStyle } })}
            className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Buttons</label>
          <select
            value={draft.custom_theme.buttonStyle}
            onChange={(e) =>
              patch({ custom_theme: { ...draft.custom_theme, buttonStyle: e.target.value as ButtonStyle } })
            }
            className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm"
          >
            {BUTTON_STYLES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Card corners */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Card corners</label>
        <select
          value={draft.custom_theme.borderRadius}
          onChange={(e) => patch({ custom_theme: { ...draft.custom_theme, borderRadius: e.target.value as typeof draft.custom_theme.borderRadius } })}
          className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm"
        >
          {RADII.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* 6. Reset to default */}
      <button
        type="button"
        onClick={() => {
          const preset = BRAND_PRESETS[0];
          setPresetSel(preset.id);
          applyPreset(preset);
        }}
        className="text-caption font-semibold underline text-muted-foreground hover:text-foreground"
      >
        Reset to default
      </button>
    </div>
  );
}
