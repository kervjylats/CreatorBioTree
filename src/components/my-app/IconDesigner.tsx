/**
 * IconDesigner — the mini app-icon designer (2026-08-13, unified layout):
 * one shared Background (colour + optional gradient) plus a 3-way
 * "What's on the icon" picker — Logo (upload, full-bleed), Emoji, or Initial
 * — radio-style, exactly one active. Full-bleed logos auto-show the Android
 * circle-crop preview so nothing is silently cropped on phones. "Use this
 * icon" uploads the rendered 512px PNG to /api/creator/my-app/icon and
 * returns a real hosted URL — installable, never a data: URL.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";
import type { MyAppIconDesign } from "@/types";
import { DEFAULT_ACCENT } from "@/lib/branding";

interface IconDesignerProps {
  appName: string;
  design: MyAppIconDesign | null;
  onUse: (appIconUrl: string, design: MyAppIconDesign) => void;
  onCancel: () => void;
}

const CANVAS_SIZE = 512;
const RADIUS = CANVAS_SIZE * 0.22;
/** Safe zone for Android maskable icons — inner 80% circle. */
const SAFE_ZONE = 0.8;

const SWATCHES = [
  DEFAULT_ACCENT,
  "#2563eb",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#111111",
  "#f97316",
];

const EMOJIS = ["🔥", "✨", "🎨", "🎵", "🎬", "🎮", "💡", "🎤", "🎧", "📚", "🌟", "💎", "🍀", "🌈", "🚀", "🎯", "🧠", "👑"];

type GlyphColor = "auto" | "white" | "dark";
type Foreground = "logo" | "emoji" | "initial";

interface RenderArgs {
  color: string;
  gradientColor: string | null;
  glyphColor: string;
  mask: boolean;
}

/** Approximate luminance of a hex colour — used for auto glyph contrast. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}

function resolveGlyphColor(mode: GlyphColor, color: string, gradientColor: string | null): string {
  if (mode === "white") return "#ffffff";
  if (mode === "dark") return "#111111";
  return isLight(color) && !gradientColor ? "#111111" : "#ffffff";
}

function newCanvas(): CanvasRenderingContext2D | null {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  return canvas.getContext("2d");
}

function fillBackground(ctx: CanvasRenderingContext2D, color: string, gradientColor: string | null) {
  if (gradientColor) {
    const grad = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    grad.addColorStop(0, color);
    grad.addColorStop(1, gradientColor);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = color;
  }
  ctx.beginPath();
  ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, RADIUS);
  ctx.fill();
}

/** Dim outside the Android circle mask + dashed safe-zone ring (preview only). */
function drawMaskOverlay(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
  ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill("evenodd");
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, (CANVAS_SIZE / 2) * SAFE_ZONE, 0, Math.PI * 2);
  ctx.setLineDash([18, 14]);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 8;
  ctx.stroke();
}

function renderTemplate(args: RenderArgs & { glyph: string; isEmoji: boolean }): string {
  const ctx = newCanvas();
  if (!ctx) return "";
  fillBackground(ctx, args.color, args.gradientColor);
  ctx.fillStyle = args.glyphColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = args.isEmoji
    ? `${CANVAS_SIZE * 0.55}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
    : `bold ${CANVAS_SIZE * 0.5}px sans-serif`;
  ctx.fillText(args.glyph, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + (args.isEmoji ? CANVAS_SIZE * 0.04 : 0));
  if (args.mask) drawMaskOverlay(ctx);
  return ctx.canvas.toDataURL("image/png");
}

/** Full-bleed logo: cover-crop the image to fill the whole 512px tile. */
function renderLogo(img: HTMLImageElement, args: RenderArgs): string {
  const ctx = newCanvas();
  if (!ctx) return "";
  fillBackground(ctx, args.color, args.gradientColor);
  const scale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (CANVAS_SIZE - w) / 2, (CANVAS_SIZE - h) / 2, w, h);
  if (args.mask) drawMaskOverlay(ctx);
  return ctx.canvas.toDataURL("image/png");
}

export function IconDesigner({ appName, design, onUse, onCancel }: IconDesignerProps) {
  const initialForeground: Foreground = design?.source === "upload" ? "logo" : design?.emoji ? "emoji" : "initial";
  const [fg, setFg] = useState<Foreground>(initialForeground);
  const [color, setColor] = useState(design?.color ?? DEFAULT_ACCENT);
  const [gradientColor, setGradientColor] = useState<string | null>(design?.gradientColor ?? null);
  const [glyphColor, setGlyphColor] = useState<GlyphColor>(design?.glyphColor ?? "auto");
  const [emoji, setEmoji] = useState(design?.emoji ?? "✨");
  const [letter, setLetter] = useState((design?.letter ?? (appName.trim().charAt(0) || "A")).toUpperCase());
  const [maskManual, setMaskManual] = useState(false);
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bootstrapped = useRef(false);

  // The Android crop risk is always visible for full-bleed logos.
  const maskOn = fg === "logo" || maskManual;

  // Reopening a logo icon: reload the stored PNG so it stays editable.
  useEffect(() => {
    if (bootstrapped.current || fg !== "logo" || !design?.sourceUrl) return;
    bootstrapped.current = true;
    const img = new Image();
    img.onload = () => setSourceImg(img);
    img.src = design.sourceUrl;
  }, [fg, design?.sourceUrl]);

  const preview = useMemo(() => {
    if (fg === "logo") {
      if (!sourceImg) return design?.sourceUrl ?? "";
      return renderLogo(sourceImg, { color, gradientColor, glyphColor: "#ffffff", mask: maskOn });
    }
    const glyph = fg === "emoji" ? emoji : letter.slice(0, 1) || "A";
    return renderTemplate({
      color,
      gradientColor,
      glyphColor: resolveGlyphColor(glyphColor, color, gradientColor),
      glyph,
      isEmoji: fg === "emoji",
      mask: maskOn,
    });
  }, [fg, sourceImg, color, gradientColor, glyphColor, maskOn, emoji, letter, design?.sourceUrl]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      toast.error("Please choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > 5_000_000) {
      toast.error("Image is too large — keep it under 5 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSourceImg(img);
      setFileName(file.name);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      toast.error("Couldn't read that image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const renderFinal = (): string => {
    if (fg === "logo") {
      if (sourceImg) return renderLogo(sourceImg, { color, gradientColor, glyphColor: "#ffffff", mask: false });
      return design?.sourceUrl ?? "";
    }
    const glyph = fg === "emoji" ? emoji : letter.slice(0, 1) || "A";
    return renderTemplate({
      color,
      gradientColor,
      glyphColor: resolveGlyphColor(glyphColor, color, gradientColor),
      glyph,
      isEmoji: fg === "emoji",
      mask: false,
    });
  };

  const useIcon = async () => {
    const finalPng = renderFinal();
    if (!finalPng) return;
    setUploading(true);
    try {
      const res = await fetch("/api/creator/my-app/icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: finalPng }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Upload failed");
      const nextDesign: MyAppIconDesign =
        fg === "logo"
          ? { source: "upload", color, gradientColor, glyphColor, emoji: null, letter: null, sourceUrl: finalPng }
          : {
              source: "template",
              color,
              gradientColor,
              glyphColor,
              emoji: fg === "emoji" ? emoji : null,
              letter: fg === "initial" ? letter.slice(0, 1) || null : null,
            };
      onUse(json.appIconUrl as string, nextDesign);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-3">
        <img src={preview} alt="Icon preview" className="h-16 w-16 rounded-xl border border-black/10" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Icon preview</p>
          <p className="text-caption text-muted-foreground">
            Renders a 512px PNG and hosts it so the install prompt works — not just a preview.
          </p>
        </div>
      </div>

      {/* Background — shared by every foreground */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Background</label>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Background ${c}`}
              className={`h-6 w-6 rounded-full border border-black/10 ${color === c && !gradientColor ? "ring-2 ring-foreground ring-offset-1" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Background hex"
            className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-xs uppercase"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-caption font-semibold text-foreground">
            <input
              type="checkbox"
              checked={Boolean(gradientColor)}
              onChange={(e) => setGradientColor(e.target.checked ? "#1e293b" : null)}
            />
            Gradient
          </label>
          {gradientColor && (
            <>
              <input
                value={gradientColor}
                onChange={(e) => setGradientColor(e.target.value)}
                aria-label="Gradient second colour hex"
                className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-xs uppercase"
              />
              <span className="text-caption text-muted-foreground">fades from the colour above</span>
            </>
          )}
        </div>
      </div>

      {/* Foreground — exactly one: logo, emoji, or initial */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">What's on the icon</label>
        <div className="mt-1.5 flex gap-1.5">
          {(["logo", "emoji", "initial"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFg(f)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-caption font-semibold ${
                fg === f ? "bg-foreground text-background" : "border border-input text-foreground"
              }`}
            >
              {f === "logo" ? "Logo" : f === "emoji" ? "Emoji" : "Initial"}
            </button>
          ))}
        </div>

        {fg === "logo" ? (
          <div className="mt-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
            >
              <Upload size={14} /> Choose an image
            </button>
            <p className="mt-1 text-caption text-muted-foreground">
              {fileName
                ? `Loaded: ${fileName} — fills the whole icon (the crop preview below shows what phones cut).`
                : "PNG, JPG or WebP, up to 5 MB. Your image fills the whole icon."}
            </p>
          </div>
        ) : fg === "emoji" ? (
          <>
            <div className="mt-2 grid grid-cols-9 gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`rounded-lg p-1 text-lg leading-none ${emoji === e ? "bg-foreground/10 ring-1 ring-foreground" : "hover:bg-foreground/5"}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <GlyphColorPicker glyphColor={glyphColor} setGlyphColor={setGlyphColor} />
          </>
        ) : (
          <>
            <input
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              maxLength={1}
              placeholder="A"
              className="mt-2 w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-bold uppercase"
            />
            <GlyphColorPicker glyphColor={glyphColor} setGlyphColor={setGlyphColor} />
          </>
        )}
      </div>

      {/* Android mask preview */}
      <label className={`flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground ${fg === "logo" ? "" : ""}`}>
        <input
          type="checkbox"
          checked={maskOn}
          disabled={fg === "logo"}
          onChange={(e) => setMaskManual(e.target.checked)}
        />
        Show Android crop — dims everything outside the circle phones cut to
      </label>
      {fg === "logo" && <p className="mt-1 text-caption text-muted-foreground">Always on for full-bleed logos.</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={useIcon}
          disabled={uploading || !preview}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-50"
        >
          <Check size={14} /> {uploading ? "Uploading…" : "Use this icon"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="rounded-lg border border-input px-3 py-2 text-xs font-semibold text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function GlyphColorPicker({
  glyphColor,
  setGlyphColor,
}: {
  glyphColor: GlyphColor;
  setGlyphColor: (g: GlyphColor) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <span className="text-caption text-muted-foreground">Glyph colour</span>
      <div className="flex gap-1">
        {(["auto", "white", "dark"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGlyphColor(g)}
            title={g}
            aria-label={`Glyph colour ${g}`}
            className={`h-6 w-6 rounded-full border border-black/10 ${glyphColor === g ? "ring-2 ring-foreground ring-offset-1" : ""}`}
            style={{
              backgroundColor: g === "white" ? "#ffffff" : g === "dark" ? "#111111" : "#ffffff",
              backgroundImage: g === "auto" ? "linear-gradient(135deg, #ffffff 50%, #111111 50%)" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
