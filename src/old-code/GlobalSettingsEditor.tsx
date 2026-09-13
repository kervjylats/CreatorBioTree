/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import Image from "next/image";
import { HexColorPicker } from "react-colorful";
import { Select } from "@/components/ui/select";
import type { PlaygroundTheme, PlaygroundColors } from "@/types";
import { extractPaletteFromImage } from "@/lib/colorExtraction";

const VIBE_CHIPS = ["cozy", "neon", "minimal", "editorial"];

const THEME_PRESETS = [
  { name: "Minimal", bg: "#ffffff", card: "#f9fafb", text: "#111827", accent: "#6366f1", font: "sans" as const, button: "rounded" as const },
  { name: "Dark", bg: "#0f0f0f", card: "#1a1a1a", text: "#f5f5f5", accent: "#a78bfa", font: "sans" as const, button: "rounded" as const },
  { name: "Coffee Shop", bg: "#f5f0eb", card: "#e8dfd6", text: "#3d2b1f", accent: "#c4956a", font: "serif" as const, button: "pill" as const },
  { name: "Neon Nightlife", bg: "#0a0a1a", card: "#1a1a2e", text: "#e0e0ff", accent: "#ff00ff", font: "mono" as const, button: "sharp" as const },
  { name: "Clean Editorial", bg: "#fafafa", card: "#f0f0f0", text: "#1a1a1a", accent: "#2563eb", font: "serif" as const, button: "rounded" as const },
  { name: "Ocean", bg: "#eef2ff", card: "#e0e7ff", text: "#1e1b4b", accent: "#3b82f6", font: "sans" as const, button: "rounded" as const },
  { name: "Rose", bg: "#fff1f2", card: "#ffe4e6", text: "#4c0519", accent: "#e11d48", font: "serif" as const, button: "pill" as const },
  { name: "Emerald", bg: "#ecfdf5", card: "#d1fae5", text: "#064e3b", accent: "#059669", font: "sans" as const, button: "rounded" as const },
  { name: "Gold", bg: "#fefce8", card: "#fef9c3", text: "#713f12", accent: "#ca8a04", font: "serif" as const, button: "pill" as const },
];

function hexToLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.substring(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return "#" + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

interface GlobalSettingsEditorProps {
  theme: PlaygroundTheme;
  onColorsChange: (colors: Partial<PlaygroundColors>) => void;
  onFontStyleChange: (fontStyle: PlaygroundTheme["fontStyle"]) => void;
  onButtonStyleChange: (buttonStyle: PlaygroundTheme["buttonStyle"]) => void;
  onBgUploadStart: (file: File) => Promise<string | null>;
  onAiPaletteGenerated: (palette: Record<string, string>) => void;
  scrapedData?: { title?: string; image?: string } | null;
}

const FONT_STYLES = [
  { key: "sans" as const, label: "Sans" },
  { key: "serif" as const, label: "Serif" },
  { key: "mono" as const, label: "Modern" },
] as const;

const BUTTON_STYLES = [
  { key: "rounded" as const, label: "Rounded", cls: "rounded-xl" },
  { key: "sharp" as const, label: "Sharp", cls: "rounded-none" },
  { key: "pill" as const, label: "Pill", cls: "rounded-full" },
] as const;

const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "soft-light", "hard-light"];

export function GlobalSettingsEditor({
  theme, onColorsChange, onFontStyleChange, onButtonStyleChange, onBgUploadStart, onAiPaletteGenerated, scrapedData,
}: GlobalSettingsEditorProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [gen, setGen] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [aiPalettes, setAiPalettes] = useState<Record<string, string>[] | null>(null);

  const fillType = theme.colors.fillType || "solid";
  const gradientType = theme.colors.gradientType || "linear";
  const angle = theme.colors.gradientAngle ?? 135;
  const opacity = theme.colors.backgroundOpacity ?? 1;
  const blend = theme.colors.backgroundBlend || "normal";
  const setC = onColorsChange;

  const handleAi = async () => {
    if (!aiPrompt.trim()) return;
    setGen(true);
    setAiPalettes(null);
    try {
      const res = await fetch("/api/creator/playground/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiPrompt.trim() }) });
      const d = await res.json();
      if (Array.isArray(d.palettes)) {
        setAiPalettes(d.palettes);
        onAiPaletteGenerated(d.palettes[0]);
      }
    } catch {}
    setGen(false);
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploadingBg(true);
    const url = await onBgUploadStart(f);
    if (url) setC({ backgroundImage: url, fillType: "image" });
    setUploadingBg(false);
  };

  return (
    <div className="space-y-4">
      {/* ── Color Panel (Figma-style compact) ── */}
      <div>
        <button onClick={() => setShowColorPanel(!showColorPanel)}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700 mb-2">
          <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: theme.colors.background }} />
          Color
          <svg className={`w-3 h-3 transition-transform ${showColorPanel ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {showColorPanel && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-3">
            {/* Fill type tabs */}
            <div className="grid grid-cols-3 gap-1 bg-white rounded-lg p-0.5 border border-gray-100">
              {(["solid", "gradient", "image"] as const).map((ft) => (
                <button key={ft} onClick={() => setC({ fillType: ft })}
                  className={`py-1 text-[10px] rounded-md font-medium capitalize ${fillType === ft ? "bg-gray-900 text-white" : "text-gray-500"}`}>
                  {ft}
                </button>
              ))}
            </div>

            {/* Color picker (solid + gradient share color picks) */}
            {(fillType === "solid" || fillType === "gradient") && (
              <>
                <HexColorPicker color={theme.colors.background} onChange={(hex) => {
                  const ac = theme.colors.accent;
                  const grad = fillType === "gradient" ? (gradientType === "linear"
                    ? `linear-gradient(${angle}deg, ${hex}, ${ac})`
                    : `radial-gradient(circle, ${hex}, ${ac})`) : null;
                  setC({ background: hex, backgroundGradient: grad });
                }} />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-400">HEX</span>
                  <input type="text" value={theme.colors.background} onChange={(e) => {
                    const hex = e.target.value.startsWith("#") ? e.target.value : "#" + e.target.value;
                    const ac = theme.colors.accent;
                    const grad = fillType === "gradient" ? (gradientType === "linear"
                      ? `linear-gradient(${angle}deg, ${hex}, ${ac})`
                      : `radial-gradient(circle, ${hex}, ${ac})`) : null;
                    setC({ background: hex, backgroundGradient: grad });
                  }} className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-mono" />

                  {/* Accent color dot */}
                  <input type="color" value={theme.colors.accent} onChange={(e) => {
                    const ac = e.target.value;
                    const bg = theme.colors.background;
                    const grad = fillType === "gradient" ? (gradientType === "linear"
                      ? `linear-gradient(${angle}deg, ${bg}, ${ac})`
                      : `radial-gradient(circle, ${bg}, ${ac})`) : null;
                    setC({ accent: ac, backgroundGradient: grad });
                  }} className="w-6 h-6 rounded cursor-pointer border-0" title="Accent color" />
                </div>
              </>
            )}

            {/* Starter kits */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              {THEME_PRESETS.map((preset) => (
                <button key={preset.name} onClick={() => {
                  setC({ background: preset.bg, card: preset.card, text: preset.text, accent: preset.accent });
                  onFontStyleChange(preset.font);
                  onButtonStyleChange(preset.button);
                }}
                  className="flex items-center gap-1 p-1 rounded-lg border border-gray-200 hover:border-gray-400 transition-all text-left">
                  <div className="flex gap-px">
                    {[preset.bg, preset.card, preset.accent, preset.text].map((c, i) => (
                      <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[8px] text-gray-500 truncate">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Gradient-specific controls */}
            {fillType === "gradient" && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setC({ gradientType: "linear" })}
                    className={`text-[9px] px-2 py-0.5 rounded ${gradientType === "linear" ? "bg-gray-900 text-white" : "bg-white text-gray-500"}`}>Linear</button>
                  <button onClick={() => setC({ gradientType: "radial" })}
                    className={`text-[9px] px-2 py-0.5 rounded ${gradientType === "radial" ? "bg-gray-900 text-white" : "bg-white text-gray-500"}`}>Radial</button>
                  {gradientType === "linear" && (
                    <div className="flex items-center gap-1 ml-auto">
                      <input type="range" min={0} max={360} value={angle} onChange={(e) => {
                        const a = parseInt(e.target.value);
                        const bg = theme.colors.background; const ac = theme.colors.accent;
                        setC({ gradientAngle: a, backgroundGradient: `linear-gradient(${a}deg, ${bg}, ${ac})` });
                      }} className="w-16 h-1 accent-primary" />
                      <span className="text-[9px] text-gray-400 w-7">{angle}°</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image upload */}
            {fillType === "image" && (
              <div className="flex items-center gap-2">
                {theme.colors.backgroundImage && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                    <Image src={theme.colors.backgroundImage} alt="" width={56} height={56} className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="cursor-pointer px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-[10px] rounded-lg">
                  {uploadingBg ? "..." : theme.colors.backgroundImage ? "Change" : "Upload"}
                  <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                </label>
                {theme.colors.backgroundImage && (
                  <button onClick={() => setC({ backgroundImage: null, fillType: "solid" })}
                    className="text-[10px] text-red-500">Remove</button>
                )}
              </div>
            )}

            {/* Opacity + Blend (below gradient/image) */}
            {(fillType === "gradient" || fillType === "image") && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between"><span className="text-[9px] text-gray-400">Opacity</span><span className="text-[9px] text-gray-500">{Math.round(opacity * 100)}%</span></div>
                  <input type="range" min={0} max={100} value={Math.round(opacity * 100)}
                    onChange={(e) => setC({ backgroundOpacity: parseInt(e.target.value) / 100 })}
                    className="w-full h-1 accent-primary" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Blend</label>
                  <select
                    value={blend}
                    onChange={(e) => setC({ backgroundBlend: e.target.value === "normal" ? null : e.target.value })}
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                  >
                    {BLEND_MODES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Card, text, accent fine-tune */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-gray-200">
              {(["card", "text", "accent"] as const).map((k) => (
                <div key={k}>
                  <div className="flex items-center gap-1">
                    <input type="color" value={theme.colors[k]} onChange={(e) => setC({ [k]: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0" />
                    <span className="text-[9px] text-gray-400 capitalize">{k}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Contrast badges */}
            <div className="flex items-center gap-2 pt-0.5">
              {(["background", "card"] as const).map((bg) => {
                const ratio = getContrastRatio(theme.colors.text, theme.colors[bg]);
                const pass = ratio >= 4.5;
                return (
                  <span key={bg} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    text/{bg} {pass ? "✓" : "✗"} {ratio.toFixed(1)}:1
                  </span>
                );
              })}
            </div>

            {/* Surprise-me button */}
            <button onClick={() => {
              const hue = Math.floor(Math.random() * 360);
              const sat = 40 + Math.floor(Math.random() * 40);
              const bgLight = 85 + Math.floor(Math.random() * 10);
              const cardLight = Math.max(70, bgLight - 15);
              const textLight = bgLight > 70 ? 12 : 92;
              const accentLight = 45 + Math.floor(Math.random() * 20);

              const bg = hslToHex(hue, sat, bgLight);
              const card = hslToHex(hue, sat - 5, cardLight);
              let text = hslToHex(hue, 10, textLight);
              const accent = hslToHex(hue, Math.min(100, sat + 20), accentLight);

              if (getContrastRatio(text, bg) < 4.5) {
                text = hslToHex(hue, 10, textLight > 50 ? 8 : 92);
              }
              setC({ background: bg, card, text, accent });
            }}
              className="w-full py-1.5 text-[10px] font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Surprise Me
            </button>

            {/* Gradient preview */}
            {fillType === "gradient" && theme.colors.backgroundGradient && (
              <div className="h-8 rounded-lg border border-gray-200" style={{
                background: theme.colors.backgroundGradient,
                opacity: opacity,
                backgroundBlendMode: blend !== "normal" ? blend : undefined,
              }} />
            )}
          </div>
        )}
      </div>

      {/* Extract colors from scraped photo */}
      {scrapedData?.image && (
        <button onClick={async () => {
          setExtracting(true);
          try {
            const palette = await extractPaletteFromImage(scrapedData.image!);
            onColorsChange(palette);
          } catch {}
          setExtracting(false);
        }} disabled={extracting}
          className="w-full py-1.5 text-[10px] font-medium rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-40">
          {extracting ? "Extracting..." : " Use colors from this photo"}
        </button>
      )}

      {/* ── Font Style ── */}
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700 mb-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
          Font
        </div>
        <div className="grid grid-cols-3 gap-1">
          {FONT_STYLES.map((f) => (
            <button key={f.key} onClick={() => onFontStyleChange(f.key)}
              className={`py-1.5 text-[10px] rounded-lg border transition-all ${theme.fontStyle === f.key ? "border-primary bg-primary/10 text-primary font-medium" : "border-gray-200 text-gray-600"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* ── Button Style ── */}
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700 mb-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} /></svg>
          Buttons
        </div>
        <div className="grid grid-cols-3 gap-1">
          {BUTTON_STYLES.map((b) => (
            <button key={b.key} onClick={() => onButtonStyleChange(b.key)}
              className={`py-1.5 border-2 text-[10px] font-medium ${b.cls} ${theme.buttonStyle === b.key ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-600"}`}>{b.label}</button>
          ))}
        </div>
      </div>

      {/* ── AI Copilot ── */}
      <div>
        <button onClick={() => setShowAi(!showAi)}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:text-primary/80">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          AI Copilot
        </button>
        {showAi && (
          <div className="mt-1.5 space-y-1.5">
            {/* Vibe chips */}
            <div className="flex gap-1 flex-wrap">
              {VIBE_CHIPS.map((chip) => (
                <button key={chip} onClick={() => setAiPrompt(chip)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all ${aiPrompt === chip ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {chip}
                </button>
              ))}
            </div>
            {/* Prompt input */}
            <div className="flex gap-1.5">
              <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAi()}
                placeholder="Describe your style..." className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-[10px]" />
              <button onClick={handleAi} disabled={gen || !aiPrompt.trim()}
                className="px-3 py-1.5 bg-primary disabled:opacity-40 text-white text-[10px] rounded-lg">{gen ? "..." : "Go"}</button>
            </div>
            {/* Multiple palette results */}
            {aiPalettes && aiPalettes.length > 1 && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {aiPalettes.map((p, idx) => (
                  <button key={idx} onClick={() => onAiPaletteGenerated(p)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:border-primary transition-all text-left">
                    <div className="flex gap-0.5 mb-1">
                      {(["background", "card", "accent", "text"] as const).map((k) => (
                        <div key={k} className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: p[k] }} />
                      ))}
                    </div>
                    <p className="text-[8px] text-gray-400 capitalize">{p.font || "sans"} · {p.buttonStyle || "rounded"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
