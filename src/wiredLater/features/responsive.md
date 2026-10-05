/**
 * responsive.md — Platform-wide responsive + adaptive design spec.
 *
 * Principles: content stays stable across devices; only the frame (navigation
 * + background) adapts. Every surface must look intentional at 360/430/768/1024/1440.
 *
 * 5 device categories (small phone, medium phone, large phone, tablet, desktop)
 * cover 100% of devices globally. All phones share one layout; tablet/desktop
 * get their own.
 *
 * This is the single source of truth for breakpoint rules, shell patterns,
 * sizing tokens, touch targets, and overlay alignment across the platform.
 */
# Responsive Design Spec

## 1. Principles

1. **Content stable, frame adaptive.** The content a creator builds is identical on every device. Only the navigation chrome and background presentation change.
2. **Device-native feel (revised 2026-10-01).** Exactly **two** navigation shapes exist product-wide: a **bottom bar** (phones, small tablets) and a **sidebar** (tablets ≥`md`, desktop, larger). The dashboard/admin switch bottom→sidebar at `md:`; the **fan shell keeps its bottom bar at every width** — the founder rejected the desktop top-nav variant, so a creator's app reads as a phone app on a big screen. No third nav shape.
3. **Preview = reality.** The Playground editor can preview Phone/Tablet/Desktop and each shows the real fan shell with the correct frame.
4. **Platform UI uses tokens; fan UI uses creator branding.** Landing, login, search, offline, dashboard, admin = platform tokens from `globals.css`. Fan shell = `resolveBranding()` inline styles.
5. **Touch-first.** Consumer/fan/primary buttons ≥ 44px tap target. Dense admin controls stay compact but padded.
6. **Safe areas everywhere.** `env(safe-area-inset-*)` on all fixed/sticky bars. `100dvh` for full-height sections.
7. **Screen-inside-a-screen (2026-09-25).** The Playground preview is a *narrower container* rendering the *same* fan components as the real shell — a phone frame inside a bigger browser window. Fan content must therefore adapt to its **container width** via flex-wrap (`flex-wrap`, `min-w-0`, `truncate`, `flex-auto`) or container queries (`@container` + `@max-[…]:`), **never** viewport breakpoints: browser width ≠ frame width (the browser can be 1920px wide while the frame is 229px). Rows must wrap before they clip, and elements designed for 390px phones (fixed `w-24` inputs, `buttonClass` padding) must never exceed the narrowest frame (220px). Preview and real shell share ONE copy of these components, so a width-agnostic fix lands in both automatically.

---

## 2. Breakpoint Scale

### 2a. Device Categories

The 5 device categories cover 100% of phones, tablets, and desktops globally.

| Category | Width range | Tailwind prefix | Typical devices |
|---|---|---|---|
| Small phone | 0–374px | (base) | iPhone SE, budget Android (Infinix, Tecno) |
| Medium phone | 375–428px | (base) | iPhone 14/15, Pixel 7, Galaxy S23 |
| Large phone | 429–767px | (base) | iPhone 15 Pro Max, Galaxy Ultra |
| Tablet | 768–1023px | `md:` | iPad (classic), iPad 10th, Android tablets |
| Desktop | 1024px+ | `lg:`+ | Laptop (1280px), Desktop HD (1920px) |

### 2b. Tailwind Breakpoints

| Min-width | Tailwind prefix | Maps to |
|---|---|---|
| 0 | (base) | All phones (small/medium/large) |
| 640px | `sm:` | Large phones + (unused — large phones fall in base) |
| 768px | `md:` | Tablet (sidebar appears) |
| 1024px | `lg:` | Desktop — dashboard content grids widen (nav shape unchanged) |
| 1280px | `xl:` | Wide desktop |

Rules:
- Mobile-first: base styles target phones; `sm/md/lg/xl` add upward.
- Never skip a breakpoint in a responsive chain (e.g. don't go `base → lg` without `md`).
- `2xl` (1536px) is not used; content caps before it.
- All phones (small/medium/large) share the same layout — bottom nav, single-column content. The sub-categories exist for testing guidance, not separate breakpoints.

---

## 3. Shell Patterns

### 3a. FanShell — `FanAppShell.tsx`

| Device | Nav | Content column | Background |
|---|---|---|---|
| **Every width** (phone, tablet, desktop) | Bottom bar (`FanBottomNav`) — one shape, no `lg:` swap | `max-w-lg` (512px), centered | Creator branding, full-bleed |

- The bottom nav is **never** hidden: no `lg:hidden`, no top-nav variant (founder decision 2026-10-01 — only two nav shapes exist product-wide: bottom bar + sidebar; the fan shell is always the bottom bar).
- Content column width is identical at all sizes → preview = reality for content.
- Background is always `branding.backgroundColor` full-bleed.
- Active tab highlighted by `branding.accentColor` in both navs.

### 3b. CreatorShell — `DashboardSidebar.tsx` + `dashboard/layout.tsx`

| Device | Nav | Content |
|---|---|---|
| Phone (<`md`) | Bottom bar (Overview/Network/Playground/Settings) | `flex-1 pt-14 md:pt-0` |
| Tablet/Desktop (≥`md`) | Sidebar (w-60, full nav + Admin for admins) | `flex-1` |

- Mobile bottom bar renders the visible nav items (4 for creators; admins get a 5th "Admin" cell — deliberate, per 2026-09-25). Sign out lives in Settings.
- Sidebar shows at `md:` (≥768px).
- Chat FAB/dock repositions above the bottom nav on mobile: `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`.

### 3c. AdminShell — same as CreatorShell

- Admin at `/admin` gets the same shell via the `(shell)` layout + `DashboardSidebar` (admin sees the sidebar at `md:`, a bottom bar below `md`).
- Admin content inside uses `AdminClient` with its own `max-w-6xl` container + 5-tab strip (`TabsList` wraps at phone widths).

### 3d. PublicShell — centered fluid column

- Login, onboarding, forgot-password, search, offline: centered column, platform tokens.
- `AuthCard`: `p-6 sm:p-10`, `max-w-md`.
- No nav bar; no bottom bar.

---

## 4. Sizing Tokens

| Token | Value | Usage |
|---|---|---|
| `--shell-width` | `512px` | Fan shell content column + overlays (CSS custom property) |
| `max-w-lg` (512px) | Fan content column at all sizes | FanAppShell, GuestPageContent, PartnerPageContent |
| `max-w-2xl` (672px) | Reading column for desktop fan content (future) | Out of scope for initial pass |
| `max-w-6xl` (1152px) | Dashboard content cap | Overview, Playground, Admin |
| `max-w-7xl` (1280px) | Wide dashboard grids (large monitors) | Network, optional future |
| Sidebar width | `w-60` (240px) | Dashboard sidebar |
| Network rail (2026-09-26 hub) | `220px` at `md`, `250px` at `lg`, LEFT only | NetworkPage 2-col — `grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]`; Discover center; no right rail (My Peeps moved to the dock). Inline items wrap/flex-wrap inside the rail; earnings/rate stats `flex-wrap min-w-[100px]` so 3-up collapses to rows when the rail is narrow. |

---

## 5. Touch Target Policy

| Surface | Minimum height | Approach |
|---|---|---|
| Consumer/fan CTAs (follow, buy, install, auth submit) | 44px | `min-h-11` on the button / `buttonClass()` already carries `min-h-[44px]` |
| Fan icon buttons (chat, bell, dismiss) | 44px | `h-11 w-11` / `touch-target` |
| Fan bottom nav tabs | ≥44px | `py-2` + icon (already sufficient) |
| Admin/dashboard/editor controls | ~36–40px | Compact pills (`min-h-9`), tab lists `min-h-11`, auth inputs `min-h-11` |
| Modal/dialog buttons | ≥44px for primary | `min-h-11` for confirm actions (social login, Done, Log out, tip amounts) |

The `.touch-target` utility class (`min-h-11 min-w-11`) should be applied to any interactive element that doesn't naturally reach 44px via its Tailwind sizing.

---

## 6. Safe-Area Rules

- `body` gets `env(safe-area-inset-*)` padding on all 4 sides (already in `globals.css`).
- All fixed/sticky bars use `.safe-bottom` / `.safe-top` or inline `env()` padding.
- Fan bottom nav: `pb-[env(safe-area-inset-bottom)]` (already applied).
- Creator dashboard bottom bar (new): same treatment.
- `min-h-screen-safe` uses `100dvh` (already defined) for full-height sections.
- `viewportFit: 'cover'` is set in the root layout (already applied).

---

## 7. Playground Preview — Fluid Phone Frame (preview-first, 2026-09-24)

The Playground editor is **preview-first**: the ONLY surface is a phone frame (the
editor/catalog UI is deferred). No Phone/Tablet/Desktop toggle, no
`src/lib/devices.js` (that was a stale plan — neither ever shipped).

**Smart fit, never scroll, no device detection.** The frame keeps a true
390:844 phone ratio via a **unitless** aspect-ratio token and is sized to FIT
the available space on any device with pure CSS (`min()`/`max()`):

```css
--phone-ratio-w: 390;            /* unitless — aspect-ratio rejects px! */
--phone-ratio-h: 844;
--phone-max-w:   420px;           /* largest usable frame on desktop */
--phone-min-w:   220px;           /* extreme-viewport floor (landscape/short) */
--preview-chrome: 172px;          /* py-6 top + Draft/Live bar + bottom pad */
@media (min-width: 768px) { :root { --preview-chrome: 116px; } }  /* pb-6 */
```

```tsx
maxWidth: "min(var(--phone-max-w), max(var(--phone-min-w), calc((100dvh - var(--preview-chrome)) * var(--phone-ratio-w) / var(--phone-ratio-h))))"
```

Resulting frame widths (fit = available height × 390/844, capped both ends):

| Viewport | Frame |
|---|---|
| iPhone SE (dvh 667) | ≈229px — fills it, zero scroll |
| iPhone (dvh 844) | ≈310px |
| iPhone 15 Pro Max (932) | ≈351px |
| Laptop (800, ≥768 wide) | ≈316px |
| Desktop (1080) | 420px (cap), zero scroll |
| Landscape / very short | 220px floor — a hair of scroll beats an unusable sliver; `my-auto` centers so nothing clips |

**Preview nav labels (legibility rule):** the frame is a `@container`; labels
inside `FanBottomNav` use `@max-[299px]:text-[9px]` so the 5 preview tabs stay
separated at ~229px, plus a hard `truncate` + `min-w-0` guarantee — labels
elide cleanly, never merge into each other. The real fan shell has no narrow
container, so it always keeps 10px labels. Draft/Live/Deploy paddings are
tuned to fit one row at the 229px worst case.

`aspect-ratio` ONLY accepts a unitless number pair — writing `390px / 844px`
is an INVALID declaration that the browser silently drops (this was the
"shrunken/funny" bug: the ratio fell back to `auto` and the frame collapsed
to its content height). The ratio value must always come from the unitless
`--phone-ratio-*` tokens.

---

## 8. Overlay Alignment Rule

All fan-shell overlays (install banners, update toast, chat popover) must align to the shell column, not the viewport:
- Fixed overlays use `left-1/2 -translate-x-1/2 w-[min(calc(100%-2rem),var(--shell-width))]` and sit ABOVE the bottom nav: `bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+0.5rem)]`.
- Chat bubble (viewport-anchored): `bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)]` on phones and `right-[max(1rem,calc(50%-var(--shell-width)/2+1rem))]` so it sits at the column's right edge on desktop and at `1rem` on mobile.
- The dashboard dock (My Peeps + 💬) clears the mobile bottom bar: `bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-6` — the `md:` variant aligns with the sidebar switch (keep `sm:`/`md:` variants in sync with the nav breakpoint, never skip it).
- This ensures overlays visually sit on top of the app content, not scattered across the viewport.

---

## 9. Verification Matrix

After every responsive pass, test each surface at:

| Device width | Category | Fan shell | Dashboard | Admin | Landing | Login |
|---|---|---|---|---|---|---|
| 360px | Small phone | bottom nav, 1-col | bottom nav, 1-col | bottom nav, 1-col | 1-col hero, stacked | centered card |
| 390px | Medium phone | bottom nav, 1-col | bottom nav, 1-col | bottom nav, 1-col | 1-col hero, stacked | centered card |
| 430px | Large phone | bottom nav, 1-col | bottom nav, 1-col | bottom nav, 1-col | 1-col hero, stacked | centered card |
| 768px | Tablet | bottom nav, 1-col | sidebar, 2-col network | sidebar | 2-col features | centered card |
| 1024px | Desktop | bottom nav, 1-col | sidebar, 2-col network | sidebar, 5-tab strip | 3-col features | centered card |
| 1440px | Wide | bottom nav, 1-col | sidebar, 2-col network | sidebar, 5-tab | 3-col, max-width capped | centered card |

No horizontal page scroll at any width. No content hidden behind fixed bars. All primary buttons ≥ 44px. Safe areas respected on notched iPhones.

---

## 10. Device Coverage

The 5 device categories cover 100% of phones, tablets, and desktops globally.

### Why width-based categories work

CSS media queries respond to **screen width**, not device identity. A `@media (min-width: 768px)` rule fires on every device with a screen ≥768px — iPhone, Samsung, iPad, Android tablet, laptop, desktop. No device-specific code needed.

### TweakLens testing presets

TweakLens provides 8 emulation presets mapped to the 5 categories:

| Category | TweakLens device | Width | Coverage |
|---|---|---|---|
| Small phone | iPhone SE | 375px | All phones 320–374px |
| Medium phone | iPhone 14/15 | 390px | All phones 375–428px |
| Medium phone | Pixel 7 | 412px | Android mid-range |
| Large phone | iPhone 15 Pro Max | 430px | All phones 429–767px |
| Tablet | iPad (classic) | 768px | All tablets 768–1023px |
| Tablet | iPad 10th | 820px | Larger tablets |
| Desktop | Laptop | 1280px | All desktops 1024–1919px |
| Desktop | Desktop HD | 1920px | Wide monitors 1920px+ |

### What TweakLens can't test (5% gap)

TweakLens uses Chrome DevTools emulation, which is pixel-identical for layout but misses:
- **Touch behavior** — Chrome mouse events ≠ real finger taps
- **Safe areas** — no Dynamic Island / notch emulation
- **PWA install flow** — Chrome's prompt differs from iOS Safari's
- **iOS Safari quirks** — rubber banding, viewport units, 50MB service worker cache limit
- **Performance** — desktop Chrome is faster than budget Android phones

**For layout testing: 95%+ accurate.** For PWA behavior: test on 2 real devices (1 iPhone + 1 Android).
