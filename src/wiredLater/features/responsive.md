/**
 * responsive.md — Platform-wide responsive + adaptive design spec.
 *
 * Principles: content stays stable across devices; only the frame (navigation
 * + background) adapts. Every surface must look intentional at 360/768/1024/1440.
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

| Name | Min-width | Tailwind prefix | Typical device |
|---|---|---|---|
| Phone | 0 | (base) | iPhone SE, Pixel 7 |
| Large phone | 640px | `sm:` | iPhone 14/15 |
| Tablet | 768px | `md:` | iPad (classic), iPad 10th |
| Desktop | 1024px | `lg:` | Laptop, small monitor |
| Wide | 1280px | `xl:` | Desktop HD, large monitor |

Rules:
- Mobile-first: base styles target phones; `sm/md/lg/xl` add upward.
- Never skip a breakpoint in a responsive chain (e.g. don't go `base → lg` without `md`).
- `2xl` (1536px) is not used; content caps before it.

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
| Phone (<`md`) | Bottom bar (Overview/Network/My App/Settings + More → drawer) | `flex-1 pt-14 md:pt-0` |
| Tablet/Desktop (≥`md`) | Sidebar (w-60, full nav) | `flex-1` |

- Mobile top bar (fixed h-14) removed; replaced by bottom bar.
- "More" button opens the existing drawer overlay (Messages, Install, View page, Admin, Sign out).
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

| Device width | Fan shell | Dashboard | Admin | Landing | Login |
|---|---|---|---|---|---|
| 360px (phone) | bottom nav, 1-col | bottom nav + More, 1-col | bottom nav + More | 1-col hero, stacked | centered card |
| 768px (tablet) | bottom nav, 1-col | sidebar, 2-col possible | sidebar | 2-col features | centered card |
| 1024px (desktop) | **top nav**, 1-col | sidebar, 3-col network | sidebar, 5-tab strip | 3-col features | centered card |
| 1440px (wide) | top nav, 1-col | sidebar, 3-col network | sidebar, 5-tab | 3-col, max-width capped | centered card |

No horizontal page scroll at any width. No content hidden behind fixed bars. All primary buttons ≥ 44px. Safe areas respected on notched iPhones.
