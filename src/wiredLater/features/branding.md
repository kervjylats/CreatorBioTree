# Branding — Vision & Spec

## Concept

**One creator brand = platform × preset × override.** The creator's visual identity is a single resolved object that renders across the entire fan experience — guest page, 4 tabs, item detail, checkout, community, partner modal header, share cards, 404, loading skeletons, PWA icon, status bar.

The system is **read at render time** by one resolver — `resolveBranding(creator)` in `src/lib/branding.ts`. The platform tokens in `src/styles/globals.css` are the **unchanging default**; per-creator values live in the `creators.custom_theme` JSONB column and are applied via inline `style` attributes or scoped CSS variables. Nothing in `globals.css` is rewritten per creator.

**The 4 safety rules (without breaking anything):** every extension to the brand system must lock **validation** (pre-upload checks, bouncer-at-the-club), **fallback** (backup-generator, auto-pick if missing), **performance** (max file size + format + lazy-load, moving-truck weight limit), and **accessibility** (WCAG contrast + 44px touch + motion-reduce, wheelchair-ramp at a fancy hotel). Details in Part 11.

---

## Part 1: The Two-Layer Theme Model

| Layer | Type | Where it lives | When it wins |
|---|---|---|---|
| **Layer 1 — Preset** | `Theme` (one of 9 built-ins) | `creators.theme_id` (string ID) | When `custom_theme` is empty — gives every new creator a clean default |
| **Layer 2 — Override** | `MyAppTheme` (per-creator JSONB) | `creators.custom_theme` | Wins over the preset when set; controls the fine-grained fields |
| **Layer 0 — Platform default** | Hardcoded in `branding.ts:24-25` | `THEME_CONFIGS.minimal` | Final fallback when neither preset nor override resolves |

**Resolver chain (read top to bottom, first hit wins):**
```
custom_theme (override)  →  theme_id preset  →  platform default (THEME_CONFIGS.minimal)
```

**Data model (already in `src/types/index.ts`):**
- `Creator.theme_id: string` — one of: `minimal`, `dark`, `coffee_shop`, `neon_nightlife`, `clean_editorial`, `ocean`, `rose`, `emerald`, `gold`
- `Creator.custom_theme: MyAppTheme | null` — JSONB; full set of fine-grained values
- `MyAppTheme` (line 70): `fontStyle`, `buttonStyle`, `accent`, `borderRadius`, `colors`, `profile`
- `MyAppColors` (line 44): `background`, `card`, `text`, `accent`, `backgroundImage`, `backgroundGradient`, `backgroundOpacity`, `backgroundBlend`, `fillType`, `gradientType`, `gradientAngle`
- `MyAppProfile` (line 36): `appName`, `appIconUrl`
- `Theme` (line 288): preset `id`, name, `config: ThemeConfig` (colors + fonts + layout + borderRadius + buttonStyle)

---

## Part 2: The Global Set (what the theme controls)

The theme controls the **creator's page** (`/{username}`) and everything inside it. The full set:

| Field | What it affects | Where applied |
|---|---|---|
| **Page background** (solid / gradient / image) | Every page canvas inside the fan shell | Shell frame + 3-layer view + all tabs + item detail + checkout + community |
| **Accent color** | Buttons, links, highlights, badges, active states, focus ring, checkout CTAs, the "← Back to @you" link in the partner modal | Every interactive element |
| **Text color** | All typography | Every text node in the fan shell |
| **Card color** | Cards, modals, surfaces, sheets | Catalog cards, partner modal, settings rows, community cards |
| **Font** (Sans / Serif / Modern) | All body and heading typography | Every text node in the fan shell |
| **Button style** (Rounded / Sharp / Pill / Squircle / Outline) | Buttons, inputs, cards, modal corners, sheet edges | Every button + every rounded element |
| **Border radius** (derived from button style) | Cards, inputs, modals | Per `buttonStyle` enum (Part 9) |
| **App name** | PWA home-screen title | `manifest.json` + install prompt |
| **App icon** | PWA home-screen icon | `manifest.json` + iOS splash |
| **Banner image** | Guest page + Content tab header | 3-layer view (Header layer) |
| **Background opacity + blend mode** | Background image blending | Page canvas |
| **Custom status bar color (PWA)** | Phone status bar when the app is open | PWA manifest `theme_color` |

---

## Part 3: What the theme does NOT control

| Surface | Why it stays neutral | Replaces |
|---|---|---|
| **Partner content page** (`/{username}/partner/{partnerUsername}`) | The partner is a different creator with their own brand | Renders the **partner's** brand via `resolveBranding(partner)` — not the host creator's |
| **Messaging floating inbox** (💬 icon + full inbox) | The inbox is a platform-level surface shared across all conversations | Neutral WhatsApp-style UI; the OTHER person's avatar + name + community name appear, but the surface itself doesn't rebrand |
| **Dashboard** (`/dashboard/*`) | The creator's workbench is a platform tool, not a fan page | Platform UI, no per-creator theming |
| **Login** (`/login`) | One door for everyone | Platform UI |
| **Landing** (`/`) | Marketing site for CreatorBioTree | Platform UI |
| **Search** (`/search`) | Platform-wide search | Platform UI |
| **Offline** (`/offline`) | Generic offline fallback (unless branded — see Part 9) | Platform UI, with optional creator rebrand |
| **Admin** (`/admin`) | Internal tool | Platform UI |
| **Network search** (within `/dashboard/network`) | Cross-creator directory | Platform UI; individual creator cards show THAT creator's brand |

---

## Part 4: The Resolver

**Location:** `src/lib/branding.ts`

**Function:** `resolveBranding(creator: Creator): CreatorBranding`

**Returns a `CreatorBranding` object (lines 30-67) with all 12+ resolved values:**
- `appName` — falls back to `"Creator App"`
- `appIconUrl` — falls back to `/icons/icon-192x192.png`
- `description` — falls back to creator's bio or `"Exclusive content from {display_name}"`
- `backgroundColor`, `accentColor`, `textColor`, `cardColor` — preset → override → platform default
- `fontFamily` — `FONT_MAP[fontStyle] ?? FONT_MAP.sans` (lines 13-17)
- `buttonStyle`, `borderRadius` — override → derived from button style (line 93-94)
- `creatorUsername`, `creatorId`, `avatarUrl`, `displayName`, `bannerUrl`
- `backgroundCSS` (gradient or image URL), `backgroundOpacity`, `aiSummary`

**Fallback chain (always runs, never throws):**
1. `custom_theme.colors.background` → wins
2. Else `THEME_CONFIGS[theme_id].background` → wins
3. Else `THEME_CONFIGS.minimal.background` → final default

The resolver NEVER returns `undefined` for any field. The page can render with `style={{ backgroundColor: creatorBranding.backgroundColor }}` without conditional checks.

**Who imports it:** the fan shell frame, the 3-layer view, item detail pages, checkout, community, partner modal, share card generator, PWA manifest generator, install prompts — anyone who needs the resolved brand.

---

## Part 5: How the theme is applied at render

The platform stays safe because **the resolver + `globals.css` never change** — only the per-creator `custom_theme` JSONB grows. The application pattern:

**Inline `style` attributes** (the most common):
```tsx
<div style={{
  backgroundColor: branding.backgroundColor,
  color: branding.textColor,
  fontFamily: branding.fontFamily,
  borderRadius: branding.borderRadius,
}}>
  {/* creator content */}
</div>
```

**Scoped CSS custom properties** (for nested elements that need access without prop-drilling):
```tsx
<div style={{
  '--brand-accent': branding.accentColor,
  '--brand-bg': branding.backgroundColor,
  '--brand-radius': branding.borderRadius,
} as React.CSSProperties}>
  <button className="bg-[var(--brand-accent)]">Buy</button>
</div>
```

**`className` flips** (for button styles — 5 enum values map to 5 CSS classes):
```tsx
<button className={BUTTON_STYLE_CLASS[branding.buttonStyle]}>
  Subscribe
</button>
```

**Platform tokens (`globals.css:7-23`) stay untouched.** They define the FALLBACK VALUES — what you see when `resolveBranding` returns the platform default. If a creator never customized, the page still renders cleanly using those tokens.

---

## Part 6: Inner-Screen Coverage

| Surface | Inherits the theme? |
|---|---|
| **Guest page** (`/{username}` — logged-out view) | ✅ Full theme |
| **Fan shell frame** (FanAppShell — bottom nav, bell, account button) | ✅ Full theme (per `fan-shell.md:98` — "renders the creator's branding") |
| **Home tab** (activity hub) | ✅ Full theme |
| **Content tab** (the 3-layer view) | ✅ Full theme — same as guest page |
| **Connect tab** (connection hub — self-gating Billboard / Followed / Community / Artist Links) | ✅ Full theme |
| **Settings tab** (account hub) | ✅ Full theme |
| **Item detail pages** (tap a catalog item) | ✅ Full theme |
| **Checkout flow** | ✅ Full theme |
| **Community** (Home tab section, clubhouse channels) | ✅ Full theme + community-level branding (name + icon) |
| **Partner modal** (`/{username}/partner/{partnerUsername}`) | The PARTNER'S theme inside the modal; the "← Back to @you" link uses the HOST's accent color (per `features/partner-page.md:32`) |
| **Notifications panel** (bell → notifications) | ✅ Full theme |
| **Messaging floating inbox** | ❌ Neutral — see Part 3 |
| **Dashboard** | ❌ Neutral — see Part 3 |

---

## Part 7: The 9 Presets

Each preset is a named bundle of: background + card + text + accent + font + button style. The creator picks one as a starting point, then customizes on top via the My App Design tab (or the tap-to-edit popovers — `my-app.md` Part 1a). From old-code `GlobalSettingsEditor.tsx:14-22`:

| # | ID | Name | Background | Card | Text | Accent | Font | Button |
|---|---|---|---|---|---|---|---|---|
| 1 | `minimal` | Minimal | `#ffffff` | `#f9fafb` | `#111827` | `#6366f1` | sans | rounded |
| 2 | `dark` | Dark | `#0f0f0f` | `#1a1a1a` | `#f5f5f5` | `#a78bfa` | sans | rounded |
| 3 | `coffee_shop` | Coffee Shop | `#f5f0eb` | `#e8dfd6` | `#3d2b1f` | `#c4956a` | serif | pill |
| 4 | `neon_nightlife` | Neon Nightlife | `#0a0a1a` | `#1a1a2e` | `#e0e0ff` | `#ff00ff` | mono | sharp |
| 5 | `clean_editorial` | Clean Editorial | `#fafafa` | `#f0f0f0` | `#1a1a1a` | `#2563eb` | serif | rounded |
| 6 | `ocean` | Ocean | `#eef2ff` | `#e0e7ff` | `#1e1b4b` | `#3b82f6` | sans | rounded |
| 7 | `rose` | Rose | `#fff1f2` | `#ffe4e6` | `#4c0519` | `#e11d48` | serif | pill |
| 8 | `emerald` | Emerald | `#ecfdf5` | `#d1fae5` | `#064e3b` | `#059669` | sans | rounded |
| 9 | `gold` | Gold | `#fefce8` | `#fef9c3` | `#713f12` | `#ca8a04` | serif | pill |

**Storage:** the 7 missing presets (coffee_shop, neon_nightlife, clean_editorial, ocean, rose, emerald, gold) currently live in old-code `GlobalSettingsEditor.tsx` only. At wiring, promote them into a `theme_presets` data file (e.g., `src/lib/themePresets.ts`) or a DB table, and expand `branding.ts:21-26` to include all 9.

---

## Part 8: The Editor (My App Design tab)

The full editor lives in `screens/creator-dashboard/my-app/my-app.md` Part 2b. This spec only documents the controls — cross-ref for full UI.

| Control | What it sets | Notes |
|---|---|---|
| **Fill type** | Solid / Gradient / Image | Switches which sub-controls appear |
| **Color picker (background + accent)** | `colors.background`, `colors.accent` | `react-colorful@5.7.0` (installed) — Figma-style RGB/HSL/hex/alpha/eyedropper. Already free choice, not just presets |
| **9 theme presets** | Resets `custom_theme` to the preset | Pick from Part 7 list above |
| **Gradient controls** | Linear/Radial toggle, angle slider, live preview | Sets `colors.backgroundGradient`, `colors.gradientType`, `colors.gradientAngle` |
| **Background image upload** | `colors.backgroundImage` | Pre-upload validation: image format + size cap + dimension check (Part 11) |
| **Opacity slider** | `colors.backgroundOpacity` | 0-1 |
| **Blend mode select** | `colors.backgroundBlend` | CSS blend modes |
| **Contrast checker** | Validates text-on-background contrast | Pass/fail badge (WCAG AA 4.5:1) |
| **"Surprise Me" button** | Random palette from the 9 presets | One-tap; randomized selection |
| **Font picker** | Sans / Serif / Modern | 3 choices (founder decision, 2026-08-05) — see Part 10 |
| **Button style** | 5 choices (founder decision) | Rounded / Sharp / Pill / Squircle / Outline — see Part 10 |
| **AI Copilot** | LLM-generated palettes | Uses the unified AI assistant (`ai/ai-features.md`); vibe chips + text prompt → palette |

**Auto-save:** every change is auto-saved to `localStorage` every 3 seconds (per `my-app.md:4a — draft system`). The DB-deploy happens via the deploy button (Part 4c).

---

## Part 9: Easy-Win Rebrand Extensions (v1)

These extend the brand system with new creator-controlled surfaces. All safe to add in v1 (no breaking changes — they ADD fields, the resolver gracefully handles missing values).

| # | Extension | Where it appears | Spec |
|---|---|---|---|
| 1 | **Branded 404 / offline page** | When a fan follows a dead link or goes offline | Renders the creator's theme + their custom "page not found" / "you went offline" copy. Empty `custom_404` falls back to platform default copy with the creator's theme applied. Spec: a new `custom_404` field in `MyAppTheme` (title + body + button label + button URL) |
| 2 | **Branded share card (OG meta + image)** | When a fan shares the page in WhatsApp / iMessage / Twitter | The `<meta property="og:title">`, `og:description`, `og:image` use the creator's name, bio, and avatar. Optional `custom_share_card` field lets the creator upload a 1200×630 image. Empty = auto-generated from avatar + bio |
| 3 | **Branded loading skeletons** | Every loading state in the fan shell | Skeleton bars use `colors.card` + `colors.accent` (low-opacity) instead of generic grey. No new fields — just the resolver outputs already |
| 4 | **Custom status bar color (PWA)** | Phone status bar when the app is open | `manifest.json` `theme_color` = `colors.accent`. iOS + Android respect this. No new field — uses `colors.accent` |
| 5 | **Branded empty states** | "No items yet" / "No partners yet" / "No posts yet" / "No messages yet" / "No community channels" / "No notifications" | The empty illustration background + accent + text color use the creator's theme. No new fields — resolver outputs. Empty-state copy stays platform default unless overridden. **Creator-overridable empty copy:** the Connect tab's all-empty message is a new field `connect_empty_text` (max 200 chars, editable anytime — spec in `my-app.md` Part 2a; shown per `fan-shell.md` Part 4c) |
| 6 | **Font pair 1-click presets** | A new section in the Design tab: "Font pairs" with 5 named pairs | One tap applies both font + accent + bg combinations curated for that style. New field: `MyAppColors.fontPair?: string` (one of `editorial` / `bold` / `soft` / `tech` / `classic`) |
| 7 | **Creator-saved color palettes** | A "My palettes" section in the Design tab | Creator can save 2-3 of their own palettes and switch between them. New field: `MyAppTheme.savedPalettes?: MyAppColors[]` (array of color sets, 2-3 entries) |

**Font pair presets (Part 9 #6):**

| Pair | Name | Font combo | Vibe |
|---|---|---|---|
| 1 | `editorial` | Editorial | Playfair Display + Inter | Magazine, refined |
| 2 | `bold` | Bold | Bebas Neue + Roboto | Strong, modern, statement |
| 3 | `soft` | Soft | Caveat + Inter | Handwritten, friendly, personal |
| 4 | `tech` | Tech | Space Grotesk + Inter | Geometric, futuristic, clean |
| 5 | `classic` | Classic | Lora + Lato | Traditional, warm, trustworthy |

**Storage for extensions:** all Part 9 extensions add fields to `MyAppTheme` in `src/types/index.ts`. The resolver extends to include them. Missing values = platform default.

---

## Part 10: Touch-Native Rebrand Extensions (later, not v1)

Touch-first extensions that work well on PWAs. **Deferred to wiring-phase decision** (build later, don't include in v1):

| # | Extension | What it does | Library / API |
|---|---|---|---|
| 1 | **Tap haptics** | Subtle vibration on tap of buttons (Android: full support, iOS: limited) | `navigator.vibrate(10)` — must respect `prefers-reduced-motion` and accessibility settings |
| 2 | **Swipe between tabs** | Swipe left/right in the fan shell to switch tabs | Native touch events; already swipe-able for spotlight. Spec'd as opt-in toggle in settings |
| 3 | **Custom tab transitions** | Spring-physics transitions between Home / Content / Connect / Settings | CSS transitions + Framer Motion (or similar); opt-in toggle |
| 4 | **Long-press previews** | Hold a card → quick preview before committing | `touchstart` + `touchend` handlers; opt-in per card type |
| 5 | **Branded splash screen** | The screen fans see when launching the PWA, branded with the creator's colors + logo | PWA `manifest.json` `splash_screen` + iOS launch storyboard (or just the existing PWA splash with custom colors) |

**Skipped (mobile/PWA-first lens — do NOT build in any version):**
- ❌ Custom cursor (no mouse on phones)
- ❌ Custom hover effects (no hover on touch)
- ❌ Custom click sounds (no "click" on touch — use haptics if anything)
- ❌ Custom favicon (browsers show it on the bookmark bar; fans use home-screen icon, which IS the App Icon)
- ❌ Background music auto-play (battery + accessibility disaster)
- ❌ Animated video backgrounds (battery + perf on mobile)

---

## Part 11: The 4 Safety Rules (without breaking anything)

Every extension to the brand system MUST lock these 4 rules. Plain-English explanations + technical implementation.

### Rule 1: Validation (Bouncer at the club)
**What it means:** check inputs BEFORE saving. Reject anything that breaks the page or violates platform rules.

| Field | Validation |
|---|---|
| **Image uploads** (banner, app icon, background image, share card) | Format: PNG, JPEG, WebP, AVIF. Max size: banner 5MB / icon 256KB / share card 1MB. Dimensions: icon 192×192 or 512×512, banner 16:9 ratio, share card 1200×630 |
| **Color picker** (background, accent, text, card) | Must be a valid hex / rgb / hsl. Contrast checker: text-on-background must be ≥ 4.5:1 (WCAG AA normal text) or ≥ 3:1 (large text + UI) |
| **Font choice** | Only the 3 curated fonts (Sans / Serif / Modern) in v1 — no upload. Curated set is pre-validated for readability |
| **App name** | Max 30 chars. No special characters. Cannot match platform reserved names |
| **Display name** | Max 50 chars |
| **Bio** | Max 280 chars (Twitter-like) |
| **Connect tab empty text** (`connect_empty_text`) | Max 200 chars. Optional — empty = platform default "More to come — check back soon" |

**UI feedback:** inline tooltip on the upload control (format + size + dimensions), real-time validation on file select, contrast-checker badge next to the color picker, error message in red. Catch problems BEFORE save.

### Rule 2: Fallback (Backup generator)
**What it means:** if a creator's value is missing or invalid, the page still renders with a sensible default. Never breaks.

**The chain (always runs, never throws):**
1. `custom_theme` (what creator saved)
2. `theme_id` preset (Minimal / Dark / etc.)
3. Platform default in `globals.css` (the platform tokens at lines 7-23 — `--color-background`, etc.)

**What this means for a brand-new creator:**
- They see the Minimal preset (white bg, indigo accent, Inter font, rounded buttons) — looks clean
- The full-screen My App view shows the same Minimal theme
- Fans visiting `/{username}` see the same Minimal theme
- The deployed PWA uses the same Minimal defaults for app name, icon, colors

**Invisible to the user.** The fallback never shows a "missing theme" error — the page just works.

### Rule 3: Performance (Moving truck with a weight limit)
**What it means:** every brand element has a max weight (file size, format, count). No single creator can break the page for their fans.

| Element | Limit | Why |
|---|---|---|
| **Background image** | 5MB max, WebP/AVIF/PNG | Compressed; `next/image` auto-optimizes |
| **App icon** | 256KB max, PNG only, 192×192 or 512×512 | PWA spec requires these exact sizes |
| **Banner image** | 5MB max, 16:9 ratio, WebP/AVIF/PNG | Banner crop; auto-compress |
| **Share card image** | 1MB max, 1200×630, PNG/JPEG | OG meta image spec |
| **Fonts** | 3 fixed (no extra load) | 0 extra bundle weight |
| **Saved palettes** | Max 3 (Part 9 #7) | Storage limit |
| **Custom 404 copy** | Max 200 chars | Tiny text |
| **Catalog items on a page** | Max 50 visible (paginated) | Mobile scroll limit |

**Globally applied:** these limits use the same infrastructure as the rest of the project (R2 in `src/lib/r2.ts`, `next/image` in pages, `next/font` in Next.js). The brand spec just sets the per-element numbers; the project has the machinery.

### Rule 4: Accessibility (Wheelchair ramp at the fancy hotel)
**What it means:** the creator's theme changes the DECOR; accessibility changes the RULES. Both apply, always.

| Rule | What enforces it | Where |
|---|---|---|
| **Color contrast ≥ 4.5:1** | Contrast checker at save time | Design tab |
| **Touch targets ≥ 44px** | `.touch-target` utility | `globals.css:164-167` |
| **Visible keyboard focus** | `:focus-visible` style | `globals.css:127-131` (uses `--color-primary` — auto-adapts to creator's accent) |
| **`prefers-reduced-motion`** | OS-level, browser handles | All animations + transitions |
| **Screen reader labels** | Code review rules + `aria-label` on icon buttons | All interactive elements |
| **Font readability** | Curated 3 fonts (Sans / Serif / Modern) | Part 8 |

**Globally enforced:** every surface in the project respects these rules (dashboard, fan shell, item detail, checkout, settings, admin, every page). The brand spec adds the creator-side contrast check; the project-wide rules live in the codebase.

---

## Part 12: The 7-Day Lock Rule

Per the identity model decision (`my-app.md` 2a):

| Field | Change frequency | Lock | Notes |
|---|---|---|---|
| **Link Address** (username) | ONCE at signup, never | Permanent, no exceptions, no redirects (per identity decision) | Hidden backend UUID anchors data |
| **App Name** | Any time, with **7-day lock** between changes | 7-day cooldown | Existing installs keep old name until phone refresh |
| **App Icon** | Any time, with **7-day lock** | 7-day cooldown | Existing installs keep old icon |
| **Display Name** | Any time, with **7-day lock** | 7-day cooldown | Static note: frequent changes confuse fans |
| **Bio** | Any time, no lock | None | Lightweight text |

**Why locks:** prevents abuse (rapid rename for scam) and confusion (fans see different names on different phones).

---

## Part 13: PWA Integration

The brand powers the **installed PWA** on the fan's phone (and the creator's own dogfood install per `overview.md:110`).

| PWA spec field | Source | Effect |
|---|---|---|
| `name` | `custom_theme.profile.appName` ?? `display_name` ?? `"Creator App"` | Home-screen title |
| `short_name` | `display_name` (truncated to 12 chars) | Home-screen title (short) |
| `icons[].src` | `custom_theme.profile.appIconUrl` ?? `/icons/icon-192x192.png` | Home-screen icon |
| `theme_color` | `colors.accent` | Phone status bar color (iOS + Android) |
| `background_color` | `colors.background` | Splash screen background |
| `start_url` | `/{username}` | Where the app opens |
| `scope` | `/{username}/` | What URLs the app controls |
| `display` | `standalone` | Looks like a native app |
| `description` | `creator.bio` ?? `"Exclusive content from {display_name}"` | PWA install prompt subtitle |

**Production notes:** the `manifest.json` route is generated per creator at request time (per `src/app/[username]/manifest.json/route.ts` already wired). iOS splash requires a storyboard — fallback to the standard AppleLaunchImage if not provided.

---

## Part 14: Existing Code Reference

| File | What's there | Reuse plan at wiring |
|---|---|---|
| `src/lib/branding.ts` | `resolveBranding()` resolver + `CreatorBranding` interface (lines 30-67) + `FONT_MAP` (lines 13-17) + 2 hardcoded presets `minimal`, `dark` (lines 24-25) | Promote to canonical. Add the 7 missing presets (Part 7). Extend with Part 9 fields |
| `src/styles/globals.css` | Platform design tokens: `--color-background`, `--color-foreground`, `--color-border`, `--color-primary`, `--color-secondary`, `--color-muted`, `--color-card`, `--radius-card`, `--radius-item`, `--shadow-card`, text clamps, font stack, focus ring, scrollbar, `.content-grid`, `.touch-target`, `.min-h-screen-safe` | Keep as platform defaults; never re-write per creator |
| `src/types/index.ts` (lines 36-78, 117-118, 275-289) | `MyAppTheme`, `MyAppColors`, `MyAppProfile`, `Theme`, `ThemeConfig`, `ThemeColors`, `ThemeFonts`, `FontStyle`, `ButtonStyle`, `BorderRadius`, `Creator.custom_theme`, `Creator.theme_id`, `Creator.remove_branding` | Source of truth for the data shape. Extend with Part 9 fields |
| `src/old-code/GlobalSettingsEditor.tsx` (parts archive) | Old Design tab editor with the **9 preset definitions** in code (lines 14-22) | Reuse the 7 missing preset definitions; rebuild the editor per `my-app.md` 2b |
| `src/old-code/MyAppForm*` (parts archive) | Old draft + auto-save hooks (`useAutoSave`, `useMyAppForm`) | Reuse `useAutoSave` pattern for the Design tab |
| `package.json` (line 31) | `react-colorful@5.7.0` already installed | Reuse for the Figma-style color picker |

---

## Part 15: Production Notes

| Concern | Mock | Production |
|---|---|---|
| **Font loading** | `fontFamily` returned as a string from `FONT_MAP` but no actual font files loaded | `next/font/google` (self-hosts Inter, Playfair Display, Poppins) + `font-display: swap` |
| **Image CDNs** | `appIconUrl`, `bannerUrl`, `backgroundImage` stored as URLs as-is | Cloudflare Images or R2 (`src/lib/r2.ts` already wired) — resizing, WebP/AVIF conversion, signed URLs |
| **Contrast validation** | Manual in the editor (the "Contrast checker (pass/fail badge)") | Server-side WCAG AA check on save (4.5:1 normal, 3:1 large); block save on fail |
| **PWA manifest** | Generated per request (route already exists) | Same; add the splash storyboard for iOS |
| **CSP / SRI** | None | If loading Google Fonts directly, allowlist the font CDN; otherwise self-host to avoid CSP work |
| **Image size limits** | Client-side check (pre-upload toast) | Server-side check on upload — reject files exceeding the per-element limits (Part 11) |
| **Custom share card image** | Auto-generated from avatar | Optional 1200×630 override; max 1MB |
| **Empty state illustrations** | Generic text | Per-creator branded copy (Part 9 #5) — empty state strings from a new table keyed by `theme_id` |

---

## Part 16: Decisions

| # | Topic | Status |
|---|---|---|
| 1 | One spec file (`features/branding.md`) as the single home for the full rebrand system | ✅ Decided 2026-08-05 |
| 2 | Two-layer theme model (preset + override) + platform default | ✅ Decided — already implemented in `branding.ts` |
| 3 | Free color choice via `react-colorful` (already installed) + 9 presets as starting points + AI Copilot | ✅ Decided 2026-08-05 |
| 4 | Fonts: 3 fixed (Sans / Serif / Modern) — no Google Fonts picker, no custom upload | ✅ Decided 2026-08-05 |
| 5 | Button style: 5 total — Rounded / Sharp / Pill / Squircle / Outline | ✅ Decided 2026-08-05 |
| 6 | 7 easy-win rebrand extensions in v1 (Part 9) | ✅ Decided 2026-08-05 |
| 7 | 5 touch-native extensions deferred to later (Part 10) | ✅ Decided 2026-08-05 |
| 8 | Skipped for v1: cursor, hover, click sounds, favicon, music, video backgrounds (mobile/PWA-first) | ✅ Decided 2026-08-05 |
| 9 | 4 safety rules: validation, fallback, performance, accessibility — enforced globally | ✅ Decided 2026-08-05 |
| 10 | 7-day lock on App Name + Icon + Display Name (per identity decision) | ✅ Decided (earlier) |
| 11 | Preview state toggle (Draft / Live) in My App (full-screen editor) + on the owner's live `/{username}` view | ✅ Decided 2026-08-05 (orange dot on Draft only when un-deployed; default to Live). **Updated 2026-08-05:** Playground + "View My App" merged into ONE surface — My App (`my-app.md` Part 1b); the toggle renders at the top of the full-screen page and (same component) on the live page when the owner visits it |
| 12 | Font pair 1-click presets (5 pairs: editorial / bold / soft / tech / classic) | ✅ Decided 2026-08-05 |
| 13 | Saved palette limit: 3 per creator | ✅ Decided 2026-08-05 |
| 14 | Empty states: 6 surfaces (catalog / no partners / no posts / no messages / no community / no notifications) | ✅ Decided 2026-08-05 |
| 15 | "View My App" preview toggle default: **Live** (so creators see "what fans see" first) | ✅ Decided 2026-08-05 |
| 16 | **Tap-to-edit popovers** are the primary brand-editing mechanism in My App (Part 1a): tap any visible element (background / text / font / button / card / link) → floating popover with that element's controls; changes are global across all surfaces. The Design tab remains as the richer non-tap editor for the same data | ✅ Decided 2026-08-05 |
| 17 | **PWA integration separated from on-page editing** — App Name, App Icon, status bar color live in the Identity tab's App sub-section (`my-app.md` Part 2a), NOT on the page | ✅ Decided 2026-08-05 |
