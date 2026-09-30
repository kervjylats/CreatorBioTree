# WALKTHROUGH — The App, One Screen at a Time

> **What this is:** a living, screen-by-screen tour of CreatorBioTree — what each
> URL is, which files build it, what they do, and what to touch to change things.
> Written in plain terms (sandwiches, kitchens, fridges) — no CS degree required.
> 
> **How we walk:** one stop at a time, in journey order (Landing → … → Offline).
> Each stop is researched from the real files before it's written here.
> **Status legend:** ✅ written · ⬜ not visited yet.
> 
> **Companion docs:** `docs/HOW_IT_WORKS.md` (how the machine works),
> `docs/CODEBASE.md` (exhaustive file reference). This one is the guided tour.

---

## 🗺️ The route (14 stops)

| #   | Stop                                             | URL                          | Status |
| --- | ------------------------------------------------ | ---------------------------- | ------ |
| 00  | Primer — how to read any screen                  | —                            | ✅      |
| 01  | Landing                                          | `/`                          | ✅      |
| 02  | Login                                            | `/login`                     | ✅      |
| 03  | Onboarding (signup + Link Address)               | `/onboarding`                | ⬜      |
| 04  | The Frame — shell (sidebar / bottom bar / dock)  | `/dashboard`                 | ⬜      |
| 05  | Overview                                         | `/dashboard/overview`        | ⬜      |
| 06  | My App (phone preview + deploy)                  | `/dashboard/my-app`          | ⬜      |
| 07  | Network hub (Discover + affiliate rail)          | `/dashboard/network`         | ⬜      |
| 08  | Circle → Partners                                | `/dashboard/circle/partners` | ⬜      |
| 09  | Circle → Fans                                    | `/dashboard/circle/fans`     | ⬜      |
| 10  | Circle → Staff                                   | `/dashboard/circle/staff`    | ⬜      |
| 11  | Circle → Messages                                | `/dashboard/circle/messages` | ⬜      |
| 12  | Settings                                         | `/dashboard/settings`        | ⬜      |
| 13  | Admin                                            | `/admin`                     | ⬜      |
| 14  | Fan side — guest page → fan shell → partner page | `/{username}...`             | ⬜      |
| 15  | Offline + the 3 PWAs                             | `/offline`                   | ⬜      |

---

## 🧠 Stop 00 — The Primer: how to read ANY screen

**Nutshell:** every screen is a **3-layer sandwich**. Once you see it, you can't unsee it:

```
🚪 page.tsx          → the door (URL). Usually just 2 lines pointing downstairs.
🧠 Screen.tsx        → the manager (src/screens/...). Chooses what shows, grabs data, sets page title.
🎨 components/       → the pixels (buttons, cards). The actual stuff you see.
🔧 /api/...          → the kitchen (routes that cook data)
🧊 lib/mocks/        → the fake fridge (in-memory data until real Supabase)
```

### The folder dictionary

| Folder            | Analogy        | What it holds                                                                                                          |
| ----------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/app/`        | 📮 Post office | Every folder = a URL. `(public)` / `(shell)` / `(fan)` are **invisible** in the URL — they just organize related pages |
| `src/screens/`    | 🧠 Managers    | One `Screen.tsx` per page — the real logic lives here                                                                  |
| `src/components/` | 🎨 Pixels      | Reusable UI. Folder named after the screen/button it serves (the "product-name folder rule")                           |
| `src/app/api/`    | 🔧 Kitchen     | Data endpoints (`/api/messages/*`, `/api/creator/peeps`, `/api/discover/creators`, …)                                  |
| `src/lib/`        | 🧰 Toolbox     | Helpers: `messages.ts`, `branding.ts`, `fanSession.ts`, `mocks/`                                                        |
| `src/wiredLater/` | 📐 Blueprints  | **Specs only, zero code** — the plans for what gets built                                                              |
| `src/old-code/`   | 🏛️ Museum     | Old code kept for reference — **never wire from it**                                                                   |
| `docs/`           | 📖 Guidebooks  | `HOW_IT_WORKS`, `CODEBASE`, and this walkthrough                                                                       |

### 3 primer facts that apply everywhere

1. **URL = folder mirror:** `/dashboard/circle/staff` →
   `src/app/(shell)/dashboard/circle/staff/page.tsx`
   (the `(shell)` group never appears in the URL)
2. **The bouncer = `src/proxy.ts`:** middleware that runs before every page.
   Visit `/dashboard` with no login cookie → bounced to `/login`.
   It also maps `yourname.creatorpwa.app` → your page, and gates `/admin` to admins.
3. **Colors = design tokens:** classes like `bg-background`, `text-primary`,
   `border-border` pull from ONE palette defined in `src/styles/globals.css`
   (cream + forest green = the platform look). **Fan pages don't use these** —
   creators get their own colors through `branding.ts` (inline styles).

---

## 🚪 Stop 01 — Landing `/`

**🎯 What it is:** the shop sign. Public marketing homepage — no login required.

**🗂️ The chain:**

| Layer      | File                                                           | Role                                                                                                                                              |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🚪 Door    | `src/app/(public)/page.tsx`                                    | 2 lines: re-exports `@/screens/public/landing`                                                                                                    |
| 🧠 Manager | `src/screens/public/landing/Screen.tsx` (254 lines, **async**) | The page shell — nav, hero, "How it works", features grid, comparison table, footer. Loads data first (see below)                                 |
| 🎨 Pixels  | `src/components/landing/` (4 files)                            | `CreatorShowcase` · `LandingAuthModal` · `LandingInstallButton` · `YourCreatorsRow` + tiny local `FeatureCard` / `TableRow` helpers in Screen.tsx |
| 🔧 Kitchen | none                                                           | But Screen.tsx **reads** the mock DB server-side (two loaders, lines 39 + 62)                                                                     |
| 📐 Spec    | `src/wiredLater/screens/public/landing.md`                     | The blueprint (un-parked 2026-09-29)                                                                                                              |

**🧠 Gotchas:**

- **Phase 4 (2026-09-29) added data + components** — it's no longer "100% static":
  - Two **never-throwing loaders** (lines 39, 62): `getShowcaseCreators` (creators with `show_in_search`, featured-first, max 12) and `getYourCreators` (`fan_session` cookie → email → `fan_accounts` → creators). Both `.catch → []` so the page can never 500.
  - **Privacy rule:** `YourCreatorsRow` renders **only** when the visitor has a recognized fan cookie — never for anonymous visitors.
  - **Showcase hides below 2 creators** (marquee needs a full loop).
- **Marquee CSS** lives in `src/styles/globals.css` (`.showcase-*` + `@keyframes showcase-marquee`, hover-pause + `prefers-reduced-motion`) — not in Screen.tsx.
- **Sign in opens a dialog** (`LandingAuthModal` wraps the real `LoginForm`) — sign-up stays a link to `/onboarding`.
- **`export const metadata`** (line 19) = SEO / tab title — lives in Screen.tsx, NOT page.tsx
- **"See a live demo"** (line 133) → ``/${NEXT_PUBLIC_DEMO_USERNAME ?? "rowin"}``
- `min-h-screen-safe` = phone-safe full-screen height (responsive pattern from `wiredLater/features/responsive.md`)

**🛠️ Common edits:**

| You want to change...               | Touch                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| Hero headline / subtext / CTAs      | `Screen.tsx` hero `<section>` (lines ~120–145)                                   |
| Demo link target                    | line 133 (or set `NEXT_PUBLIC_DEMO_USERNAME`)                                    |
| Which creators show in the showcase | loader `getShowcaseCreators` (line 39) + each creator's "Show me in search" flag |
| The fan "Your creators" row         | `components/landing/YourCreatorsRow.tsx`                                         |
| Sign-in dialog                      | `components/landing/LandingAuthModal.tsx`                                        |
| Marquee speed / pause behavior      | `src/styles/globals.css` (`.showcase-track`)                                     |
| Page title / SEO                    | `metadata` block, line 19                                                        |
| Platform colors (affects ALL pages) | `src/styles/globals.css` tokens                                                  |

---

## 🔐 Stop 02 — Login `/login`

**🎯 What it is:** the front door for **creators, staff, and admins** (fans don't log
in here — they get the auth modal inside a creator's app). One card: email + password.

**🗂️ The chain:**

| Layer      | File                                             | Role                                                                                                                             |
| ---------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 🚪 Door    | `src/app/(public)/login/page.tsx`                | 2 lines: re-exports `@/screens/public/login`                                                                                     |
| 🧠 Manager | `src/screens/public/login/Screen.tsx` (38 lines) | Validates `?next=` deep-link (line 13), bounces already-logged-in users to `/dashboard` (line 27), renders the card              |
| 🎨 Pixels  | `components/auth/AuthCard.tsx` (30)              | Centered card shell: logo, title, subtitle, children slot                                                                        |
|            | `components/auth/LoginForm.tsx` (199)            | The actual form — email, password, errors, social buttons, links                                                                 |
|            | `components/auth/ForgotPasswordForm.tsx` (89)    | Serves `/forgot-password` (email-only sibling screen)                                                                            |
| 🔧 Kitchen | **none for login itself**                        | Auth runs client-side (mock client in mock mode, real Supabase in prod). Sibling: `POST /api/creator/forgot-password` (rate 3/m) |
| 📐 Spec    | `src/wiredLater/screens/public/login.md`         | The blueprint (Sheets 6+7)                                                                                                       |

**🧠 Gotchas:**

- **Mock mode = any email+password logs in.** If sign-in finds no account, `USE_MOCKS`
  falls back to **signUp** (line 64) — so signup and login are the same button in dev.
  On success, `setMockSession()` (`src/lib/mockSession.ts`) writes the
  `mock_auth_uid` + `mock_auth_email` cookies (1h) — the whole mock session system
  hangs off those two cookies.
- **`?next=` is validated server-side** (`isInternalPath`, line 13): must start with
  `/`, not `//` → no open redirects. `src/proxy.ts` adds `?next=` when it bounces
  you from `/dashboard` (lines 30, 86), so you land back where you were.
- **Gumroad-style error copy** (production only, lines 80–95): wrong password vs.
  no account vs. deleted account — it looks the account up to say the *right* thing
  (no generic "login failed").
- **Social buttons are mock-only** (Google/TikTok/Instagram/Facebook, `USE_MOCKS`
  block line 156) with "Test login: X" tooltips — they just provision a session.
- **Forgot password = no account enumeration.** `/forgot-password` always says
  "If an account exists…" — and in mock mode the reset link is logged to the
  console + `temp_emails.log` (`POST /api/creator/forgot-password`).
  **There's no creator reset-password *page* yet** — real mode uses Supabase's own
  recovery email (tracked in WIRING_PLAN Sheet 6).
- **Already logged in?** Screen.tsx redirects you to `/dashboard` before the form
  ever renders (line 27).
- **One door, three keycards (naming law, 2026-09-29).** Everyone on the platform
  side signs in HERE — the account type decides what opens:
  **Creator** → `/dashboard` (self-signup via `/onboarding`) · **Staff** →
  `/dashboard` too, but only the sections their creator granted (they arrive via an
  invite link, never `/onboarding`) · **Admin** → `/admin` (founder setup or an
  admin invite). "Staff" = a creator's helpers, "Admin" = the platform's staff —
  never overlap the words. The shared invite-accept screen `/accept?token=…` for
  staff + admin invites is **spec'd, not built** (phase gate) — today new accounts
  only come from `/onboarding` or this form's mock signup fallback.

**🛠️ Common edits:**

| You want to change...           | Touch                                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| Card title / subtitle           | `login/Screen.tsx` lines 32–33 (passed into `AuthCard`)           |
| Tab title / SEO                 | `metadata`, Screen.tsx line 9                                     |
| Error messages                  | `LoginForm.tsx` lines 80–95                                       |
| Where you land after login      | `LoginForm.tsx` line 53 (`next ?? "/dashboard"`)                  |
| Deep-link rules                 | `isInternalPath`, Screen.tsx line 13                              |
| Social buttons                  | `MOCK_SOCIALS` in `LoginForm.tsx`                                 |
| Forgot-password copy / behavior | `ForgotPasswordForm.tsx` + `api/creator/forgot-password/route.ts` |
| Session cookie shape            | `src/lib/mockSession.ts`                                          |

---

*(Stops 03–15 get appended here as we walk.)*
