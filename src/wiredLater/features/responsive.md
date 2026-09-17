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
2. **Device-native feel.** Each device gets the layout that feels natural for it — bottom nav on phones, sidebar on tablet/desktop dashboards, top nav on fan desktop.
3. **Preview = reality.** The My App editor can preview Phone/Tablet/Desktop and each shows the real fan shell with the correct frame.
4. **Platform UI uses tokens; fan UI uses creator branding.** Landing, login, search, offline, dashboard, admin = platform tokens from `globals.css`. Fan shell = `resolveBranding()` inline styles.
5. **Touch-first.** Consumer/fan/primary buttons ≥ 44px tap target. Dense admin controls stay compact but padded.
6. **Safe areas everywhere.** `env(safe-area-inset-*)` on all fixed/sticky bars. `100dvh` for full-height sections.

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
| 1024px | `lg:` | Desktop (fan top nav appears) |
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
| Phone (<`lg`) | Bottom bar (`FanBottomNav`) | `max-w-lg` (512px), centered | Creator branding, full-bleed |
| Tablet/Desktop (≥`lg`) | Top bar with 4 tab links (Home/Content/Connect/Settings) | `max-w-lg` (512px), centered | Creator branding, full-bleed |

- Bottom nav hides at `lg:` (`lg:hidden`).
- Top nav appears at `lg:` (`hidden lg:flex`), inside the existing sticky header.
- Content column width is identical at all sizes → preview = reality for content.
- Background is always `branding.backgroundColor` full-bleed.
- Active tab highlighted by `branding.accentColor` in both navs.

### 3b. CreatorShell — `DashboardSidebar.tsx` + `dashboard/layout.tsx`

| Device | Nav | Content |
|---|---|---|
| Phone (<`md`) | Bottom bar (Overview/Network/My App/Settings) | `flex-1 pt-14 md:pt-0` |
| Tablet/Desktop (≥`md`) | Sidebar (w-60, full nav + Admin for admins) | `flex-1` |

- Mobile bottom bar shows 4 tabs only (no More button — Sign out lives in Settings).
- Sidebar shows at `md:` (≥768px).
- Chat FAB repositions above the bottom nav on mobile: `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`.

### 3c. AdminShell — same as CreatorShell

- Admin at `/admin` gets the same shell via `src/app/(admin)/layout.tsx`.
- Admin content inside uses `AdminClient` with its own `max-w-6xl` container + 5-tab strip.

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
| `max-w-6xl` (1152px) | Dashboard content cap | Overview, My App, Admin |
| `max-w-7xl` (1280px) | Wide dashboard grids (large monitors) | Network, optional future |
| Sidebar width | `w-60` (240px) | Dashboard sidebar |
| Rail widths (Network) | `250px` left, `300px` right | NetworkPage at `lg` |

---

## 5. Touch Target Policy

| Surface | Minimum height | Approach |
|---|---|---|
| Consumer/fan CTAs (follow, buy, install, auth submit) | 44px | `size="lg"` (h-11) on `ui/button.tsx` |
| Fan bottom nav tabs | ≥44px | `py-2` + icon (already sufficient) |
| Admin table controls | ~36px acceptable | Compact `size="sm"` or `size="default"` |
| Modal/dialog buttons | ≥44px for primary | `size="lg"` for confirm actions |

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

## 7. My App Device Preview Toggle

Added to `PhonePreview.tsx` / `MyAppForm.tsx`:
- 3-button control: **Phone** (390px) / **Tablet** (820px) / **Desktop** (1280px).
- Preview renders the **real** `FanAppShell` + content components (not an iframe).
- On Desktop, the real `FanAppShell` shows the top nav → preview = reality.
- Widths match the TweakLens `src/lib/devices.js` presets for consistency.
- CSS `transform: scale()` fits the preview into the editor column; 1:1 on Phone.
- Default: Phone.

---

## 8. Overlay Alignment Rule

All fan-shell overlays (install banners, update toast, chat popover) must align to the shell column, not the viewport:
- Fixed overlays use `left-1/2 -translate-x-1/2 w-[min(100%,var(--shell-width))]`.
- Chat bubble (viewport-anchored): `right-[max(1rem,calc(50%-var(--shell-width)/2+1rem))]` so it sits at the column's right edge on desktop and at `1rem` on mobile.
- This ensures overlays visually sit on top of the app content, not scattered across the viewport.

---

## 9. Verification Matrix

After every responsive pass, test each surface at:

| Device width | Category | Fan shell | Dashboard | Admin | Landing | Login |
|---|---|---|---|---|---|---|
| 360px | Small phone | bottom nav, 1-col | bottom nav, 1-col | bottom nav, 1-col | 1-col hero, stacked | centered card |
| 390px | Medium phone | bottom nav, 1-col | bottom nav, 1-col | bottom nav, 1-col | 1-col hero, stacked | centered card |
| 430px | Large phone | bottom nav, 1-col | bottom nav, 1-col | bottom nav, 1-col | 1-col hero, stacked | centered card |
| 768px | Tablet | bottom nav, 1-col | sidebar, 2-col possible | sidebar | 2-col features | centered card |
| 1024px | Desktop | **top nav**, 1-col | sidebar, 3-col network | sidebar, 5-tab strip | 3-col features | centered card |
| 1440px | Wide | top nav, 1-col | sidebar, 3-col network | sidebar, 5-tab | 3-col, max-width capped | centered card |

No horizontal page scroll at any width. No content hidden behind fixed bars. All primary buttons ≥ 44px. Safe areas respected on notched iPhones.

---

## 10. Device Coverage

The 5 device categories cover 100% of phones, tablets, and desktops globally.

### Why width-based categories work

CSS media queries respond to **screen width**, not device identity. A `@media (min-width: 768px)` rule fires on every device with a screen ≥768px — iPhone, Samsung, iPad, Android tablet, laptop, desktop. No device-specific code needed.

### TweakLens testing presets

TweakLens (`src/lib/devices.js`) provides 8 presets mapped to the 5 categories:

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
