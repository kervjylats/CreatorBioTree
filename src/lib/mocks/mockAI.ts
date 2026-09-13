/** TODO: Add purpose docstring. */
/**
 * mockAI.ts
 *
 * Local replacements for the Groq-powered endpoints:
 *   • `src/app/api/creator/ai-summary/route.ts`     → `mockAiSummary`
 *   • `src/app/api/creator/playground/ai/route.ts`   → `mockAiPalettes`
 *
 * Both return strict, deterministic, OpenAI-shaped JSON so the consuming routes
 * can short-circuit the `fetch("https://api.groq.com/…")` call entirely and
 * continue with the downstream store writes / palette validation as before.
 *
 * PRODUCTION-NOTE: Real Groq API requires:
 *   - GROQ_API_KEY environment variable
 *   - Real prompt engineering (the mock just does keyword matching)
 *   - Retry logic on rate limits (Groq has per-model rate limits)
 *   - Error handling for null/empty responses
 *   - Token usage tracking and cost management
 *   - Model selection (the mock hardcodes llama-3.3-70b-versatile)
 *   - Streaming support for real-time UX
 * When migrating, the returned JSON shape must match, but add the above.
 */

import type { FontStyle, ButtonStyle, BorderRadius } from "@/types";

// ─── AI summary ───────────────────────────────────────────────────────────────

interface AiSummaryInput {
  bio?: string | null;
  contentTitles?: string[];
}

const NICHE_TEMPLATES: Array<{ keywords: string[]; template: string }> = [
  {
    keywords: ["music", "audio", "sample", "beat", "drum", "song"],
    template:
      "A music creator crafting original tracks, samples, and production resources so fans can build their own sound.",
  },
  {
    keywords: ["fitness", "workout", "training", "health", "gym"],
    template:
      "A fitness coach sharing step-by-step training plans and daily routines to help fans move more and feel stronger.",
  },
  {
    keywords: ["wellness", "meditation", "mindfulness", "yoga"],
    template:
      "A wellness guide offering short, calming practices that fit into any busy day.",
  },
  {
    keywords: ["productivity", "system", "course", "workflow", "business"],
    template:
      "A productivity expert teaching repeatable systems for planning, focusing, and getting meaningful work done.",
  },
  {
    keywords: ["art", "design", "draw", "illustration", "creative"],
    template:
      "A visual artist sharing sketches, tutorials, and behind-the-scenes process notes for aspiring creatives.",
  },
  {
    keywords: ["food", "cook", "recipe", "kitchen", "bake"],
    template:
      "A home cook publishing reliable recipes and quick technique breakdowns for everyday meals.",
  },
  {
    keywords: ["travel", "trip", "destination", "explore"],
    template:
      "A travel writer curating itineraries, local tips, and field notes from places worth visiting.",
  },
];

const FALLBACK_SUMMARY =
  "A creator sharing helpful resources, behind-the-scenes content, and the occasional exclusive drop for their community.";

/**
 * Mirrors the Groq summary endpoint: returns a single short paragraph based on
 * keyword lookups in the bio / content titles. Never throws, always returns a
 * non-empty string.
 */
export function mockAiSummary(input: AiSummaryInput): string {
  const haystack = [
    input.bio ?? "",
    ...(input.contentTitles ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const hit = NICHE_TEMPLATES.find((n) =>
    n.keywords.some((k) => haystack.includes(k)),
  );

  return hit ? hit.template : FALLBACK_SUMMARY;
}

// ─── Playground palettes ──────────────────────────────────────────────────────

export interface MockPalette {
  background: string;
  card: string;
  text: string;
  accent: string;
  font: FontStyle;
  buttonStyle: ButtonStyle;
  borderRadius: BorderRadius;
}

/** Resolves a palette object's `borderRadius` from its `buttonStyle`. */
function radii(style: MockPalette["buttonStyle"]): MockPalette["borderRadius"] {
  return style === "sharp" ? "sm" : style === "pill" ? "pill" : "lg";
}

const PALETTE_PRESETS: Array<
  { keywords: string[]; build: () => MockPalette[] }
> = [
  {
    keywords: ["neon", "cyber", "dark", "night"],
    build: () => [
      { background: "#0a0a0f", card: "#15151f", text: "#f5f5f5", accent: "#00f0ff", font: "sans", buttonStyle: "pill",   borderRadius: "pill" },
      { background: "#0d0716", card: "#1a1130", text: "#fdf4ff", accent: "#b026ff", font: "mono", buttonStyle: "sharp",  borderRadius: "sm"   },
      { background: "#06121c", card: "#0f2233", text: "#e0f2fe", accent: "#39ff14", font: "sans", buttonStyle: "rounded",borderRadius: "lg"   },
    ],
  },
  {
    keywords: ["warm", "earth", "cozy", "coffee", "brown", "wood"],
    build: () => [
      { background: "#faf7f2", card: "#fffaf3", text: "#3a2e26", accent: "#c47c4d", font: "serif", buttonStyle: "rounded",borderRadius: "lg"   },
      { background: "#f3ead9", card: "#fff4e3", text: "#5a4a36", accent: "#b98453", font: "sans",  buttonStyle: "pill",   borderRadius: "pill" },
      { background: "#1d1814", card: "#2a221c", text: "#f1e6d4", accent: "#e0a060", font: "serif", buttonStyle: "sharp",  borderRadius: "sm"   },
    ],
  },
  {
    keywords: ["pastel", "soft", "calm", "gentle", "light"],
    build: () => [
      { background: "#fef6fb", card: "#ffffff", text: "#4a3f56", accent: "#f7a8e0", font: "sans",  buttonStyle: "rounded",borderRadius: "lg"   },
      { background: "#eefdf6", card: "#ffffff", text: "#1e4a3c", accent: "#7bdec3", font: "serif", buttonStyle: "pill",   borderRadius: "pill" },
      { background: "#f3f6ff", card: "#ffffff", text: "#33406b", accent: "#a7c0ff", font: "sans",  buttonStyle: "rounded",borderRadius: "lg"   },
    ],
  },
  {
    keywords: ["minimal", "clean", "monochrome", "white", "modern"],
    build: () => [
      { background: "#ffffff", card: "#f7f7f8", text: "#18181b", accent: "#5a6a4a", font: "sans",  buttonStyle: "rounded",borderRadius: "lg"   },
      { background: "#0f0f0f", card: "#1c1c1e", text: "#fafafa", accent: "#f5f5f5", font: "sans",  buttonStyle: "sharp",  borderRadius: "sm"   },
      { background: "#f8f8f5", card: "#ffffff", text: "#222222", accent: "#111111", font: "serif", buttonStyle: "pill",   borderRadius: "pill" },
    ],
  },
];

const FALLBACK_PALETTES: MockPalette[] = [
  { background: "#f8fafc", card: "#ffffff", text: "#0f172a", accent: "#6366f1", font: "sans",  buttonStyle: "rounded", borderRadius: "lg"    },
  { background: "#fffbeb", card: "#fffdf3", text: "#451a03", accent: "#f59e0b", font: "serif", buttonStyle: "pill",    borderRadius: "pill" },
  { background: "#0f172a", card: "#1e293b", text: "#f1f5f9", accent: "#38bdf8", font: "mono",  buttonStyle: "sharp",   borderRadius: "sm"   },
];

/**
 * Mirrors the Groq playground generator: returns exactly 3 distinct, fully
 * normalised palette objects chosen by keyword lookup in the user's prompt.
 *
 * The output already matches the normalised shape that the playground route
 * produces after parsing + validating the LLM's response, so the route can
 * skip its JSON-cleaning block and return these directly.
 */
export function mockAiPalettes(input: { prompt: string }): MockPalette[] {
  const p = (input.prompt ?? "").toLowerCase();
  const preset = PALETTE_PRESETS.find((preset) =>
    preset.keywords.some((k) => p.includes(k)),
  );

  const raw = preset ? preset.build() : FALLBACK_PALETTES;
  // Always ensure borderRadius matches buttonStyle, then trim to 3.
  return raw.slice(0, 3).map((palette) => ({
    ...palette,
    borderRadius: radii(palette.buttonStyle),
  }));
}