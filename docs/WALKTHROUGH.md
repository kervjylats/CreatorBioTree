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
| 03  | Onboarding (signup + Link Address)               | `/onboarding`                | ✅      |
| 04  | The Frame — shell (sidebar / bottom bar / dock)  | `/dashboard`                 | ✅      |
| 05  | Overview                                         | `/dashboard`                 | ✅      |
| 06  | Playground (phone preview + deploy)                  | `/dashboard/playground`          | ⬜      |
| 07  | Network hub (Discover + affiliate rail)          | `/dashboard/network`         | ✅      |
| 08  | Circle → Partners                                | `/dashboard/circle/partners` | ⬜      |
| 09  | Circle → Fans                                    | `/dashboard/circle/fans`     | ⬜      |
| 10  | Circle → Staff                                   | `/dashboard/circle/staff`    | ⬜      |
| 11  | Circle → Messages                                | `/dashboard/circle/messages` | ⬜      |
| 12  | Settings                                         | `/dashboard/settings`        | ⬜      |
| 13  | Admin                                            | `/admin`                     | ⬜      |
| 14  | Fan side — guest page → fan shell → partner page | `/{username}...`             | ⬜      |
| 15  | Offline + the 3 PWAs                             | `/offline`                   | ⬜      |
| 16  | Earnings (the money screen — wired 2026-10-10) | `/dashboard/earnings` | ✅  |

---

## 📖 The Dictionary — jargon → plain terms

> **How to use:** a two-way translator. Left = the word you'll see in code or docs.
> Middle = what it means in everyday words (**no tech terms allowed**).
> Right = what to say when talking to other developers.
> Every new stop adds its new words here FIRST — if you meet a word you don't
> know, it belongs in this table.

### 🔩 The screen layers

| You'll see/hear | What it means (no jargon)                       | The analogy                                                     | Devs call it     |
| --------------- | ------------------------------------------------ | --------------------------------------------------------------- | ---------------- |
| `page.tsx`      | The door — the web address's front entrance. One folder = one URL; it usually just points at the real code behind it. | The shop's front door with a sign: "everything through here"     | route / page     |
| `Screen.tsx`    | The manager — decides what the screen shows, grabs the data, sets the tab title. | The store manager ordering stock and greeting you               | server component |
| `components/`   | The pixels — the buttons, cards and forms you actually see. | The goods on the shelves                                        | React components |
| `/api/…`        | The kitchen — cooks data on request and hands it to the front-of-house. | The kitchen line behind the counter                              | API routes       |
| `src/lib/mocks/`| The fake fridge — pretend data + pretend companies, so everything runs with no real accounts (until the real ones are wired). | Stage-prop food for rehearsals                                  | mock layer       |
| `src/proxy.ts`  | The bouncer — runs before every page; no sign-in badge on `/dashboard`? Straight to `/login`. | Club bouncer with a guest list                                  | middleware        |
| `(public)` / `(shell)` / `(fan)` folders | Invisible address dividers — they organize code but never show up in the URL. | Back-of-house doors with no street sign                         | route groups     |
| Design tokens / `branding.ts` | One shared paint palette for the platform's own pages; fan pages get their OWN colors from the creator's brand. | The lobby follows house style; tenants paint their own rooms    | design tokens / theming |

### 🍳 Working with data

| You'll see/hear               | What it means (no jargon)                                                                                                                                               | The analogy                                                       | Devs call it   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------- |
| `async` / `await` / loaders   | The kitchen phones the supplier and WAITS for delivery before plating — you only ever see the finished dish.                                                             | Ordering takeaway and waiting at the counter                      | async fetching |
| `.catch → []`                 | "If the delivery never arrives, just skip that tray" — built to fail quietly so the whole page never crashes.                                                             | The shop still opens when one delivery is late                    | error fallback |
| `upsert`                      | Write this row — and if there isn't one yet, make it. One command, both jobs.                                                                                            | "Save as… or new file"                                            | upsert         |
| `Zod`                         | The paperwork checker at the kitchen door — nothing gets cooked until the forms are filled in correctly.                                                                  | The form inspector checking your forms                            | schema validation |
| `sanitize` / "strip"          | Scrubbing input with a wire brush — bad characters get removed before anything uses them ("My Name!" → `myname`).                                                          | Washing hands before food prep                                    | input sanitization |
| 404 / 409 / 500               | Three shrugs: **404** "no such page here" · **409** "clashes with something already there" (name taken) · **500** "our kitchen caught fire — our fault, not yours."        | Shop signs: "no such product" / "already sold" / "closed, broken oven" | HTTP status codes |
| UUID / hidden ID              | The passport number everything actually hangs off — your nice nickname (Link Address) is just the label on the suitcase.                                                  | Passport number vs the nickname friends use                       | UUID / key     |
| `[username]` catch-all route  | One folder that catches ANY name — `/alice`, `/bob`, `/zoe` all land in the same place and sort themselves out.                                                          | The mail sorter who accepts any name on the envelope              | dynamic route  |
| Server vs client (`"use client"`) | Default = the kitchen does the work for you (server). The flag = a waiter running orders back and forth — only needed when a button reacts to clicks.               | Kitchen works vs table service                                    | server/client components |
| `?? 0` (a fallback)         | **The silent liar.** The widget asked for a number, didn't get it, and printed `0` instead of saying "unknown" — so a broken card looks like a real answer. (2026-10-01: 15+ of these were hiding permanently-empty cards.) | A waiter guessing "no show-ups" instead of telling you the booking sheet is missing | fallback default |
| The Three Gates | Free / email / paid. A closed paid gate hides the media **and strips its file URL server-side** — hiding a button isn't enough if the link is still in the page. | The bouncer plus a locked cloakroom, not just a rope across the door | content gating |
| "Coming soon" badge | A control that has no backend yet, saying so. The rule: **never toast success for something that didn't happen.** (2026-10-01 replaced 6 fake-success controls.) | A shop sign reading "closed" instead of a dummy taking your money | honest disabled state |

### 🎫 Accounts & auth

| You'll see/hear             | What it means (no jargon)                                                                                                                                     | The analogy                                                         | Devs call it                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------- |
| Sign-in cookie (`mock_auth_uid`) | The cloakroom ticket your browser keeps after signing in — show it and the bouncer remembers you.                                                        | Coat-check stub                                                     | session cookie                |
| `USE_MOCKS`                 | The practice-mode switch. On = stage props + fake fridge; Off = real companies run everything.                                                                 | Arcade "free play" vs the real deal                                 | environment flag              |
| `signUp` vs `signIn`        | Creating an account vs unlocking one you already have.                                                                                                         | Joining the gym vs swiping your card                                | auth methods                  |
| Account enumeration         | The desk never reveals whether an email has an account: "if it exists, they'll hear from us."                                                                 | Never confirming whether someone lives there                        | enumeration protection        |
| Gumroad-style errors        | Say the specific truth ("wrong password" / "no account with that email") instead of a vague "login failed."                                                   | A doctor naming the illness instead of "you're unwell"             | error copy                    |
| Link Address                | Your permanent fan-facing URL name — picked ONCE at signup, never changeable, no redirects.                                                                  | Your house number                                                   | username / subdomain          |
| `?next=` deep-link          | "After you sign in, drop me back where I was" — the breadcrumb back to the page that bounced you.                                                             | A cloakroom ticket that also says "then home"                       | redirect param                |
| Open redirect               | The bouncer refusing to send you OUTSIDE the shop after login — only inside pages allowed (that's why `//evil.com` gets blocked).                              | Never letting a taxi drive you to a rival club                      | open-redirect protection      |

### ⏱️ Being nice to servers

| You'll see/hear   | What it means (no jargon)                                                                                                     | The analogy                     | Devs call it   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------- |
| Debounce          | Wait-and-see typing — the check fires 400ms AFTER you stop typing, not on every keystroke.                                     | Not interrupting someone mid-sentence | debounced input |
| Rate limit / 429  | "Too fast, breathe." A temporary speed bump per IP — coolant, not a ban.                                                       | Speed bump at the entrance      | rate limiting  |

### 📐 Planning & shipping

| You'll see/hear          | What it means (no jargon)                                                                                                                                            | The analogy                                            | Devs call it      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------- |
| Spec / `wiredLater` / phase gate | The blueprints folder — `.md` plans with ZERO code. Plans get written AND approved before anything gets built; the gate stops building from a half-finished plan. | Architects' drawings before the builders arrive         | spec docs         |
| `metadata` (SEO)         | The tab label + the search-engine nameplate for a page.                                                                                                              | The shop's signboard                                   | page metadata / SEO |
| PWA / manifest           | "Install to home screen" — a website that behaves like a real phone app (own icon, full-screen, works offline).                                                       | A website that installs like an app                    | progressive web app |
| `min-h-screen-safe`      | Full-screen height that dodges the phone's notch/chin so nothing hides underneath.                                                                                    | Cutting around the camera bump                         | safe-area units   |
| Dialog / popover         | A card that pops over the page instead of sending you somewhere new (e.g. Sign in from the landing hero).                                                              | The host flipping a page at the podium, not walking you to a table | modal / dialog    |
| Marquee / keyframes      | The auto-scrolling showcase strip — a looping animation that pauses on hover and respects reduced-motion.                                                             | The mall's scrolling light board                      | CSS animation     |

### 🧭 This walkthrough's own words

| You'll see/hear | What it means (no jargon)                                                                                                          | The analogy                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 🧠 Gotchas      | The traps we already stepped on while building/fixing this screen — read them first, spare yourself the same sting.                 | The creaky stair everyone warns you about |
| Stop 00/01/…    | One chapter of the tour = one screen/URL, researched from the real files before it's written here.                                  | A guided museum tour — one exhibit at a time |
| ✅ / ⬜          | Written and checked vs not visited yet.                                                                                             | —                                     |

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

### 🗺️ The Map — every screen and where its pieces live

**Two naming laws** (decided 2026-10-01, after the wing-name confusion):

> **🪽 Wings (the 4 big folders) = WHO** → `screens/creator` · `screens/fan` · `screens/admin` · `screens/public`
> **🍃 Leaves (the folders inside) = the URL's own word** → `network`, `playground`, `settings`, `circle`, `guest`, `home`…

So `/dashboard/network` → screen folder `screens/creator/network` (leaf matches exactly; the wing says *whose* side you're on — search either word and you find it).

| URL | 🚪 Door | 🧠 Manager | 🎨 Pixels | 🔧 Kitchen | 📐 Blueprint |
|---|---|---|---|---|---|
| `/` | `app/(public)/page.tsx` | `screens/public/landing` | `components/landing/` | showcase loader | `public/landing.md` |
| `/login` | `app/(public)/login/page.tsx` | `screens/public/login` | `components/auth/LoginForm` | auth (Supabase) | `public/login.md` |
| `/onboarding` | `app/(public)/onboarding/page.tsx` | `screens/public/onboarding` | `components/auth/OnboardingForm` | `creator/check-username`, `creator/register` | `public/onboarding.md` |
| `/forgot-password` | `app/(public)/forgot-password/page.tsx` | `screens/public/forgot-password` | `components/auth/ForgotPasswordForm` | `creator/forgot-password` | `public/login.md` Part 4 |
| `/offline` | `app/(public)/offline/page.tsx` | `screens/public/offline` | — (static shell) | — | `public/offline.md` |
| `/dashboard` | `app/(shell)/dashboard/page.tsx` | `screens/creator/overview` | `components/overview/` (5 widgets) | `creator/playground`, `creator/activity`, `creator/fans/export` | `creator-dashboard/overview/overview.md` |
| `/dashboard/playground` | `…/playground/page.tsx` | `screens/creator/playground` | `components/playground/` (+ `catalog/`) | `creator/playground` GET/PUT, `creator/upload` | `creator-dashboard/playground/playground.md` |
| `/dashboard/network` | `…/network/page.tsx` | `screens/creator/network` | `components/network/` | `creator/billboard`, `discover/creators`, `creator/affiliates/*` | `creator-dashboard/network/network.md` |
| `/dashboard/circle/partners` | `…/circle/partners/page.tsx` | `screens/creator/circle/partners` | `components/circle/partners/` (+ collab widgets in `network/`) | `creator/partners/*` | `features/partnership.md` |
| `/dashboard/circle/fans` | `…/circle/fans/page.tsx` | `screens/creator/circle/fans` | `components/circle/fans/` | `creator/fans/*` | `features/relationships.md` |
| `/dashboard/circle/staff` | `…/circle/staff/page.tsx` | `screens/creator/circle/staff` | `components/circle/staff/` | `creator/staff/*` | `features/staff.md` |
| `/dashboard/settings` | `…/settings/page.tsx` | `screens/creator/settings` | `components/settings/` | `creator/playground` | `creator-dashboard/settings/settings.md` |
| `/dashboard/earnings` | `…/earnings/page.tsx` | `screens/creator/earnings` | `components/earnings/` (EarningsPage + §1/§2/§2b/§3; EarningsSummary + PaymentsPanel moved in 2026-10-10 — **plus `AffiliateDealForm` + `YourDealsCard` + `AffiliateDiscover` + `AffiliateLinks` + the new `AffiliateDealsSection`, moved in from `components/network/` 2026-10-12 (A1)**) | `creator/earnings/sales`, `creator/earnings/paypal`, `creator/affiliates/earnings` (+`?badge=1`), `creator/affiliates/conversions/[id]/settle`, `creator/affiliates/{deals,discover,links}`, `admin/disputes*`, `fan/hop` | `creator-dashboard/earnings/earnings.md` |
| `/admin` | `app/(shell)/admin/page.tsx` | `screens/admin` | `components/admin/` | `admin/*` | `screens/admin/admin.md` |
| `/{username}` | `app/(fan)/[username]/page.tsx` | — *signpost* → `/guest` | — | — | — |
| `/{username}/guest` | `…/guest/page.tsx` | `screens/fan/guest` | `components/fan-pwa/GuestPageContent` | `creator/pageview`, `fan/*` | `fan-shell.md` Part 3 |
| `/{username}/home` | `…/home/page.tsx` | `screens/fan/home` | `components/fan-pwa/FanHomeTab` | `fan/partners`, `fan/content/list` | `fan-shell.md` Part 4a |
| `/{username}/content` | `…/content/page.tsx` | `screens/fan/content` | `components/fan-pwa/FanContentTab` | `fan/content/list` | `fan-shell.md` Part 4b |
| `/{username}/connect` | `…/connect/page.tsx` | `screens/fan/connect` | `components/fan-pwa/FanConnectTab` | `fan/partners`, `messages/communities` | `fan-shell.md` Part 4c |
| `/{username}/settings` | `…/settings/page.tsx` | `screens/fan/settings` | `components/fan-pwa/FanSettingsTab` | `fan/purchases`, `fan/logout` | `fan-shell.md` Part 4d |
| `/{username}/partner/[name]` | `…/partner/[partnerUsername]/page.tsx` | `screens/fan/partner` | `components/fan-pwa/PartnerPageContent` | `fan/partner-data`, `fan/follow` | `features/partner-page.md` |

**Chrome shared by many screens** (not a screen of their own):

| Folder | Serves |
|---|---|
| `components/layout/` | The frame: sidebar + phone bottom bar, the My Peeps/💬 dock |
| `components/messages/` | Messages engine (`MessagesShell` + inbox popover) — dashboard **and** fan shell |
| `components/fan-pwa/` | The fan app's pixels — **also rendered inside the Playground phone preview** (one copy, both surfaces) |
| `components/analytics/` | `PageViewTracker` (fan pages) |
| `components/shared/` · `components/ui/` | Reusable odds-and-ends · the shadcn kit |

**Doors with no manager** — and that's fine, they have no logic to manage:
`app/(fan)/[username]/app/` = old URL that redirects · `…/dashboard/overview/` = old URL, 307s via the `proxy.ts` legacy table · `manifest.json/` = a generated PWA file, not a page.

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

**🧠 Gotchas:** _the traps we already stepped on while building/fixing this screen — read them first, spare yourself the same sting._

- **Phase 4 (2026-09-29) added data + components** — it's no longer "100% static":
  - Two **never-throwing loaders** (lines 39, 62): `getShowcaseCreators` (all creators with a username — Featured pinned + the rest shuffled per load, max 12, `landing.md` lineup rules; pool de-gated 2026-10-09) and `getYourCreators` (`fan_session` cookie → email → `fan_accounts` → creators). Both `.catch → []` so the page can never 500.
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
| Which creators show in the showcase | loader `getShowcaseCreators` (line 39) — all creators with a username (pool de-gated 2026-10-09: the "Show me in search" flag no longer exists) |
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

**🧠 Gotchas:** _the traps we already stepped on while building/fixing this screen — read them first, spare yourself the same sting._

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

## ✍️ Stop 03 — Onboarding `/onboarding`

**🎯 What it is:** the Creator signing-up desk — creates the account AND picks the
**Link Address** (their permanent fan-facing URL). Also doubles as the partnership
landing when someone arrives with an invite link.

**🗂️ The chain:**

| Layer      | File                                                      | Role |
| ---------- | --------------------------------------------------------- | ---- |
| 🚪 Door    | `src/app/(public)/onboarding/page.tsx`                    | 2 lines: re-exports `@/screens/public/onboarding` |
| 🧠 Manager | `src/screens/public/onboarding/Screen.tsx` (46 lines)     | Server: sanitizes `?invite=`, bounces logged-in users to `/dashboard/playground`, picks title ("Join your partner" vs "Create your account"), renders AuthCard |
| 🎨 Pixels  | `src/components/auth/OnboardingForm.tsx` (254)            | The form — Link Address + live availability, display name, email, password, permanence dialog, signup + redirect |
| 🔧 Kitchen | `POST /api/creator/register` (57)                         | Server-side truth: re-validates format + availability (excluding self, 409), writes `username` + `display_name` (upsert by user id) |
|            | `GET /api/creator/check-username` (30)                    | Anonymous availability lookup, **20/min rate limit** — also used by Playground's identity editor |
| 🧊 Fridge  | `@/lib/mocks/mockSupabaseClient.ts`                       | Mock signup auto-creates the creators row (email-prefix username); register then renames it |
| 📐 Spec    | `src/wiredLater/screens/public/onboarding.md`             | The blueprint (wired 2026-08-10, Sheet 7) |

**🧠 Gotchas:** _the traps we already stepped on while building/fixing this screen — read them first, spare yourself the same sting._

- **Link Address is FOREVER.** 3–20 lowercase letters/numbers/underscores, never
  changeable, no redirects. Backend data anchors to the hidden UUID — the Link
  Address is just the public label. Why the confirm dialog ("Your Link Address is
  permanent") + the live "Available — {rootDomain}/{link}" hint exist.
- **Availability is checked LIVE, debounced 400ms** (`checkAvailability`, line 50):
  bad-format letters reject instantly with NO network call; then a stale-response
  guard (`requestSeq`) makes sure a slow old reply can't overwrite a newer one.
  `cleanUsernameInput` (`src/lib/username.ts`) lowercases + strips non-alphabet as
  you type — "My Name!" → `myname`. The pattern lives in ONE place (`lib/username`),
  shared by the form + both routes (duplication audit #11).
- **Client shows, server decides.** Submit only unlocks at `available`, but
  `/api/creator/register` re-checks everything server-side (format, whitespace-only
  display name, availability excluding self → 409). Client gate = UX; route = truth.
- **Rate limit on the checker:** 20/min per IP (dev = everyone shares one "unknown"
  IP) — burst past it and you get 429 → form shows "Couldn't check availability".
  Not broken — coolant.
- **Mock chicken-and-egg:** mock `signUp` pre-creates a `creators` row with the
  email-prefix as username (e.g. `google-test` — may even violate the pattern).
  Register then **renames** it via upsert-by-id. Real mode: signUp creates NO row,
  register's upsert creates it. Same route, two lives.
- **Mock = any email + password works**, `setMockSession()` sets the same two
  cookies login uses (`mock_auth_uid` + `mock_auth_email`, 1h).
- **`?invite=CODE` = partnership only.** Sanitized server-side (`[a-zA-Z0-9_-]`,
  ≤100 chars) then saved into account metadata (`invite_code`). The auto-connect
  route (`POST /api/creator/partners/onboarding`) is wired but the form does NOT
  call it — no live trigger connects the partnership today (see `partnership.md`).
  Staff/admin invitees DON'T come here — their accept screen `/accept?token=…` is
  spec'd, not built (Stop 02's "one door, three keycards").
- **Already logged in?** Screen.tsx redirects (line 28) AND the form re-checks
  client-side via `supabase.auth.getUser()` (line 45) — double net.

**🛠️ Common edits:**

| You want to change...                  | Touch                                                            |
| -------------------------------------- | ---------------------------------------------------------------- |
| Card title / subtitle                  | `onboarding/Screen.tsx` lines ~35–43 (invite vs normal branch)   |
| Link Address rules (pattern/cleaner)   | `src/lib/username.ts` (shared by form + both routes)            |
| Availability check speed / behavior    | `checkAvailability`, OnboardingForm line 50 (debounce 400 + `requestSeq`) |
| "Available — URL" hint + permanence box| OnboardingForm lines ~170–194 + dialog lines ~235–251             |
| Where signup lands you                 | `performSignUp`, OnboardingForm line 154 (`/dashboard/playground`)    |
| What gets written on register          | `api/creator/register/route.ts` (username + display_name upsert)  |
| Checker rate limit                     | `api/creator/check-username` — `enforceRateLimit(...)` line 9      |

---

## 🖼️ Stop 04 — The Frame (the shell) `/dashboard`

**🎯 What it is:** NOT a screen — the wall every dashboard screen hangs on. One
shared layout draws the sidebar (desktop) / bottom bar (phone), the floating dock,
and the security gates — for **every** page under `/dashboard` *and* `/admin`.

**🗂️ The chain:**

| Layer      | File                                                        | Role                                                                                                                                              |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🚪 Door    | `src/app/(shell)/dashboard/page.tsx` (2 lines)              | The Overview screen itself — a 2-line address-book entry to `src/screens/creator/overview/`. Old `/dashboard/overview` links **307 back here** via the `LEGACY_ROUTES` table in `proxy.ts` |
| 🧠 Frame   | `src/app/(shell)/layout.tsx` (67 lines)                     | THE FRAME — auth gate → `/login`, onboarding gate → `/onboarding`, admin gate → `/dashboard`; renders sidebar + main + the dock stack              |
| 🎨 Pixels  | `components/layout/DashboardSidebar.tsx` (149)            | Desktop left rail (`w-60`, `md:flex`) + phone bottom bar (`md:hidden`) — same nav items in both. The identity block = **Avatar photo** + name/@handle + **✏️** → `ProfileEditDialog` → Settings → Profile (2026-10-09 — phones have no identity block, so their gateway is the billboard's) |
|            | `components/layout/MyPeeps.tsx` (94)                        | The 3 dock buttons (Partners · Fans · Staff) + red count badges — position-less, no placement of their own                                         |
|            | `MessageInboxPopover` (`components/messages/MessagesShell.tsx`) | The 💬 bubble at the bottom of the dock stack                                                                            |
| 🔧 Kitchen | none of its own                                              | But the layout calls `supabase.auth.getUser()` + the creators lookup **server-side per request**; MyPeeps polls `GET /api/creator/peeps` every 30s |
| 🧊 Fridge  | `mock_auth_uid` + `mock_auth_email` cookies                 | How the gate recognizes you in mock mode (set by login/onboarding, `src/lib/mockSession.ts`)                                                       |
| 📐 Spec    | `features/responsive.md` (§ shell rules: `w-60`, `md:` switch, dock formula) + `screens.md` My Peeps dock section | No dedicated shell spec — the frame was built directly from those rules                                     |

**🧠 Gotchas:** _the traps we already stepped on while building/fixing this screen — read them first, spare yourself the same sting._

- **Two DIFFERENT things are called "layout" — don't mix them up:**
  1. **`layout.tsx`** is a Next.js magic file: it automatically wraps every page in
     its folder. `src/app/(shell)/layout.tsx` is **the frame** — it draws the
     sidebar + dock + gates around all dashboard/admin pages.
  2. **`src/components/layout/`** is just a folder **we** invented for "furniture
     bolted to the dashboard walls" (DashboardSidebar, MyPeeps). It is *not* a
     framework concept — those two components could live anywhere.
- **The frame is a LAYOUT, not a page.** `layout.tsx` wraps every `/dashboard/*` +
  `/admin` URL — change it once and all 9 pages change. The gates live here too
  (one security desk for the whole wing): no login (line 34) → `/login` · logged
  in but no creators row (line 42) → `/onboarding` · `/admin` without an admin
  (line 49) → `/dashboard`. That last one is **defense-in-depth** — `proxy.ts`
  is the primary bouncer; this is the second lock on the same door.
- **One canonical link: Overview lives AT `/dashboard`** (founder decision
  2026-09-30) — it used to live at `/dashboard/overview`. Today `/dashboard`
  *is* the Overview screen, and the old URL doesn't exist as a file at all:
  `proxy.ts` `LEGACY_ROUTES` 307s it (one redirect table for the whole
  platform — the old 6-line "we've moved" signpost file was deleted when the
  table landed), so old bookmarks, open tabs, and `?next=` bounces still land
  correctly. The sidebar's active-highlight needed a matching fix — a plain
  `startsWith("/dashboard")` would light "Overview" on *every* dashboard page,
  so the root compares **exactly** (`DashboardSidebar.tsx:38`).
- **Nav items = ONE list feeding BOTH bars.** `lib/nav-config.ts` `DASHBOARD_NAV_ITEMS`
  (Overview · Network · Playground · **Earnings** · Settings + **Admin Panel** only for admins — Earnings added 2026-10-10, Sheet 23) feeds
  the desktop sidebar AND the phone bottom bar. Add or rename a link → edit
  nav-config, both bars update. No sign-out here by design — it lives in Settings.
- **Sidebar ↔ bottom bar flips at 768px (`md:`).** `hidden md:flex` aside vs
  `md:hidden` fixed bar; `<main>` reserves `pb-20` on phones so content never
  hides under the bar. Creators get a **5th cell** ("Earnings"), admins a
  **6th** ("Admin Panel") on the phone bar too — deliberate, not an oversight.
- **The dock = ONE stack, mounted ONCE** (`layout.tsx:61`):
  `fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-6 md:right-6`.
  Children (MyPeeps + 💬) are **position-less** — neither may carry its own
  `fixed`. Today's offsets come from **one spec'd formula** (responsive.md) — and
  the `md:` variant must stay in sync with the 768px nav switch.
- **MyPeeps hides completely on `/admin`** (`MyPeeps.tsx:69` — admin path renders
  zero buttons), so the dock there shows the 💬 bubble alone.
- **Badge math** (`badgeFor`, `MyPeeps.tsx:27`): **Partners** = pending collab
  requests + partner unread · **Fans** = fan unread · **Staff** = pending invites
  + staff unread. One combined pill per button (`CountPill`, "99+" cap, hidden
  at 0), refreshed by a **30s poll** of `GET /api/creator/peeps` (line 57).
- **Active highlight:** `pathname.startsWith(href)` — except Overview also
  lights up on the bare `/dashboard` (`isActive`, sidebar line 38).
- **The dashboard has its own PWA manifest:** layout exports
  `manifest: "/dashboard-manifest.json"` — you can install the dashboard as a
  second app (PWA #2 — full story in Stop 15). It is **one shared app for every
  platform-side user**: creator, staff, and admin all install the *identical*
  "CB Dashboard" (one static file, `public/dashboard-manifest.json`, scope
  `/dashboard`). The account type only changes what you see *inside* (admin gets
  the 5th nav cell; staff see only their granted sections) — **never the icon or
  app name**. The **per-creator** unique PWAs are on the *fan* side (PWA #3):
  that's where each creator gets their own name, icon, and link.

**🛠️ Common edits:**

| You want to change...                          | Touch                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| Add / rename a sidebar or bottom-bar link      | `src/lib/nav-config.ts` (`DASHBOARD_NAV_ITEMS` — feeds both bars)      |
| Who sees the Admin Panel entry                 | nav-config `adminOnly` + `getVisibleNavItems(isAdmin)`                 |
| Where bare `/dashboard` lands                  | `dashboard/page.tsx` line 5                                            |
| Login / onboarding / admin bounce rules        | `layout.tsx` lines 34 / 42 / 49                                        |
| Dock position, order, or contents              | `layout.tsx` lines 61–64 (**the ONLY place placement is defined**)     |
| Dock badge math                                | `MyPeeps.tsx` `badgeFor` (line 27) + `GET /api/creator/peeps`          |
| Dock poll speed                                | `MyPeeps.tsx` line 57 (`30000` ms)                                     |
| Sidebar width / colors                         | `DashboardSidebar.tsx` + `globals.css` tokens                          |
| Active-highlight rules                         | `DashboardSidebar.tsx` `isActive` (line 38)                            |

---

## 📊 Stop 05 — Overview `/dashboard`

**🎯 What it is:** the dashboard's home screen — four stat cards, recent activity,
one quick action, your share link, and a fan CSV export. It doesn't sit *inside*
`/dashboard`, it **is** `/dashboard`: the door file is a 2-line address-book entry,
the layout (Stop 04) draws the walls around it.

**🗂️ The chain:**

| Layer      | File                                                     | Role                                                                                                                                                                                          |
| ---------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🚪 Door    | `src/app/(shell)/dashboard/page.tsx` (2 lines)           | Address-book entry → `src/screens/creator/overview/`. Old `/dashboard/overview` **307s here** via `proxy.ts` `LEGACY_ROUTES` (the signpost file is gone)                                       |
| 🧠 Screen  | `src/screens/creator/overview/Screen.tsx` (36)           | Server component: `h1` + FanExportButton, StatCards, then a grid — ActivityTimeline + QuickActions span 2 of 3 columns, QrCard sits right (`md:grid-cols-2 lg:grid-cols-3`)                   |
| 🎨 Widgets | `components/overview/StatCards.tsx` (84)                 | 4 cards — Total Sales · Total Fans · Page Views · Content items. Every number arrives **pre-computed** from `GET /api/creator/playground`; `money()` formats, server picks the currency        |
|            | `components/overview/ActivityTimeline.tsx` (81)          | `GET /api/creator/activity` → the route's `describe()` turns raw `{type, email\|amount}` rows into `{action, description, created_at}`; 10 newest, one icon per action                          |
|            | `components/overview/QuickActions.tsx` (27)              | The single "do something" card: one button → `/dashboard/playground`                                                                                                                          |
|            | `components/overview/QrCard.tsx` (65)                    | "Share Your Page": `origin/username` + copy button + an honest note (no scannable QR yet)                                                                                                     |
|            | `components/overview/FanExportButton.tsx` (52)           | The screen's only raw `fetch`: downloads the CSV **blob** from `GET /api/creator/fans/export`, filename parsed from `Content-Disposition`                                                      |
| 🔧 Kitchen | `GET /api/creator/playground`                            | The same route the Playground editor uses for read+deploy — it also serves these stats + `creator.username` (one fetch for both)                                                               |
|            | `GET /api/creator/activity` · `GET /api/creator/fans/export` | Raw RPC rows → described sentences · filter-aware CSV (server-built, incl. `do_not_contact`)                                                                                            |
| 📐 Spec    | `screens/creator-dashboard/overview/overview.md`         | Sheet 10 blueprint (stats, activity, quick actions, share, export)                                                                                                                            |

**🧠 Gotchas:** _the traps we already stepped on while building/fixing this screen — read them first, spare yourself the same sting._

- **This screen is where the "API computes, the widget displays" law was born.**
  The 2026-10-01 audit found: Total Sales summed catalog **price tags** (not
  sales), and Fans/whatever read `fans_count`/`subscribers_count` fields the
  route never sent — masked by `?? 0`, so they showed 0 *forever*. All four
  cards now display route-computed fields only (`total_sales` = **completed**
  purchases, `total_sales_currency`, `fans_count`, `page_views`,
  `items.length`). New number → compute it in the route, never in the card.
- **The stats piggyback on the Playground editor's endpoint — on purpose (for
  now).** `GET /api/creator/playground` returns `creator` + `items` (editor)
  **and** the four stats in one payload, so Overview and QrCard share a single
  fetch. A dedicated `GET /api/creator/stats` is specced (overview.md Part 11)
  but **parked** — founder said wait. Known stopgap, not an accident; don't
  "fix" it without the go-ahead.
- **Activity descriptions are built SERVER-side.** The RPC answers raw rows
  (`{type, email|amount}`); `describe()` in `/api/creator/activity` writes the
  sentence ("A fan spent $9.00") and the widget renders `description`
  verbatim. Pre-audit the widget read a field the RPC never sent → every row
  rendered blank.
- **QrCard tells the truth.** It used to draw `Math.random()` noise as a "QR
  code" and offer a download that scanned to nothing (founder policy: **never
  fake a success**) — fake grid + download deleted 2026-10-01, replaced by the
  real link + copy + an honest note. Want a real QR? Add an encoder (e.g.
  `qrcode` package) — the URL to encode is already on screen.
- **`/dashboard/overview` is not a page anymore.** The 6-line signpost file
  was deleted the day the central `LEGACY_ROUTES` table landed in `proxy.ts`
  (2026-10-01): old URL → 307 `/dashboard`; logged-out visitors route through
  `/login?next=/dashboard`. Never re-create the signpost file — extend the
  table instead.
- **SetupChecklist is gone** (unmounted long ago, file deleted 2026-09-28).
  If you remember a checklist widget here: QuickActions is the only
  action card now.
- **FanExportButton bypasses `fetchJson` on purpose** — it needs the response
  as a **blob** (CSV), not JSON, and only toasts "downloaded" *after* the
  browser actually received the file (no faking success). The CSV itself is
  one server-side exporter, filter-aware, shared app-wide.
- **Currency is data, not decoration:** `money(total_sales,
  total_sales_currency)` — the route decides the currency; the widget never
  hardcodes `$`.

**🛠️ Common edits:**

| You want to change...                 | Touch                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Add a new stat card                    | Compute the field in `GET /api/creator/playground` → display-only line in `StatCards.tsx`       |
| Fix a stat's math                      | Same route (the route is the accountant — never sum inside the widget)                          |
| Activity wording or icons              | `describe()` in `/api/creator/activity` + `ACTION_ICONS` in `ActivityTimeline.tsx`              |
| Add a quick action                     | `QuickActions.tsx` (today: one link → Playground)                                              |
| Bring back a real QR code              | Add a QR encoder; render in `QrCard.tsx` (URL already computed)                                |
| CSV columns / filters                  | `/api/creator/fans/export` (the app's one exporter)                                            |
| Where the cards' numbers come from     | `StatCards.tsx` fetch + the stats block in `GET /api/creator/playground`                       |
| Old `/dashboard/overview` behavior     | `proxy.ts` `LEGACY_ROUTES` (add table entries — never re-add signpost files)                   |

---

## 🌐 Stop 07 — Network `/dashboard/network`

**🎯 What it is:** the collab HQ — find other creators (Discover) and pitch
yourself (your billboard). Two columns at `md+`
(rail left, Discover right); one column on phones with Discover first. **My Peeps
does not live here** — its dock buttons open `/dashboard/circle/*` (2026-09-27).
**The affiliate block left for the Earnings screen §2b on 2026-10-12** (A1 — the
rail is the billboard mirror only; Network = social).

**🗂️ The chain:**

| Layer      | File                                                     | Role                                                                                                                                                                                          |
| ---------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🚪 Door    | `src/app/(shell)/dashboard/network/page.tsx` (2 lines)   | Address-book entry → `src/screens/creator/network/`. Old sub-pages `/dashboard/network/{partners,fans,staff}` **307 to `/dashboard/circle/*`** via `proxy.ts` `LEGACY_ROUTES`                |
| 🧠 Screen  | `src/screens/creator/network/Screen.tsx` (15)            | Server component: tab title + thin `<main>` wrapper around the hub (the pattern from Stop 00)                                                                                                 |
| 🎨 Hub     | `components/network/NetworkPage.tsx` (`use client`)        | The whole screen. Holds ALL state: `billboard` (rail mirror + switch data), `connectState` (per-creator button states), `defaultList` (shuffled collab list), `visibleCount` (24-card batches + Show more, both views), `modalCreator`/`nudgeOpen` (Modal A + first-time nudge). **The affiliate state (`showDealForm`/`dealsKey`/`handleDealSubmit`) moved to `AffiliateDealsSection` on 2026-10-12** (Earnings §2b). **⇄ Shuffle button** — right-aligned directly above the card list (below the switch card; founder placement fix 2026-10-09), feed only, rerolls `defaultList` in place — grid `md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]`, rail `order-2 md:order-1`, center `order-1 md:order-2` |
| 🔍 Search trio | `components/shared/SearchBox.tsx` (43)                | The visible box (shared body — also worn by admin CreatorsTable). **Never greys since 2026-10-09** — the `disabled` prop had one caller (the old `show_in_search` OFF rule) and is now unused                                                     |
|            | `hooks/useCreatorSearch.ts` (71)                          | The brain: 300ms debounce → `GET /api/discover/creators?q=…`. Worn by NetworkPage + AffiliateDealForm (results now carry `open_to_collab`)                                                      |
|            | `GET /api/discover/creators/route.ts` (130)               | Speed bump (60/min, anonymous) → **no visibility filter since 2026-10-09** (search = full directory) → **the searcher is excluded from their own results** (self-Connect is a guaranteed 400) → score/rank: exact @handle (1000) → handle-prefix (500) → name-prefix (400) → contains → featured boost (+100) → newest. Rows carry `open_to_collab` (collab-feed pool filter + the card's disabled "Not open to collabs" state) |
| 🪟 Modal A  | `components/network/CreatorBillboardModal.tsx` (172)     | Click any Discover card → this overlay paints the seed instantly, then `GET /api/discover/creators/[id]` for tagline/tags/collab style/bio/rate card/media kit + Connect/Visit (2026-10-07)       |
|            | `GET /api/discover/creators/[id]/route.ts` (63)           | Billboard-modal detail: same rate limit — answers for **any creator with a username** (404 only unknown/username-less ids; the hidden-creator 404 died with the switch, 2026-10-09)                                                                                  |
| 🔍 Switch  | `components/network/NetworkSettings.tsx`                | The ONE instant-save switch (**Accept collab requests**) in its own card **inside the Discover section**, under the heading (moved from the rail 2026-10-09; second switch removed same day — FB model). When OFF, a subtle muted line appears above the feed: *"You're not in this list…"* — informational only, list stays visible (NetworkPage) |
| 🪞 Rail    | `components/network/BillboardPreview.tsx` (131)           | The mirror: how you look to others (avatar, name, @handle, tagline, tags, collab style) + the **status-only** badge — relabelled **Open/Closed to collabs** 2026-10-09 (mirrors the one switch; toggle = the switch card in Discover). **Two pencils, two rows:** header ✏️ (beside the title) = design → Playground → Billboard view · name-row ✏️ = identity gateway #2 → `ProfileEditDialog` → Settings                                                              |
| 💼 Affiliate | ~~the rail's affiliate block~~ → **moved to the Earnings screen §2b, 2026-10-12 (`components/earnings/`)** | `AffiliateDealForm` (283) · `YourDealsCard` (152) · `AffiliateDiscover` (120) · `AffiliateLinks` (157) all `git mv`'d to `components/earnings/` and composed by the new `AffiliateDealsSection` — **see Stop 16 (Earnings)**. The rail is billboard-only now                 |
| 🔧 Kitchen | `GET+PUT /api/creator/partners/billboard`                 | Reads + saves the billboard (bio 600 / rate card / media-kit 300 + `is_featured` for the preview badge) — one PUT serves the Playground Save button (`BillboardView`) and the Network instant switches                                                              |
|            | `POST /api/creator/partners/request`                      | The Connect button (403 when the other creator's `open_to_collab` is OFF)                                                                                                                     |
|            | `POST+GET /api/creator/affiliates/{deals,earnings,discover,links}` + `GET /ref/[code]` | The deal maker + the affiliate widgets' data (**UI home = the Earnings screen §2b since 2026-10-12**; `/affiliates/earnings` also feeds **§2** — Sheet 23, incl. the cheap `?badge=1` sidebar-dot branch). `/ref/<code>` = Door 1: counts the click, writes attribution, redirects to the **deal owner's** page — **Door 2 = the in-app hop** (`POST /api/fan/hop` + `lib/hopAttribution.ts`, wired 2026-10-10: partner surface open → attribution row + `aff_attr` cookie, no deal = plain navigation)                                                                                                        |
|            | `src/lib/affiliateAttribution.ts` (151)                  | The Deal Rules engine (2026-10-09): `/ref` click → `affiliate_attributions` + 30-day `aff_attr` cookie; `POST /fan/purchases/complete` → `computeDealCuts` (percentage/fixed; free/tiered/custom → 0) → one `affiliate_conversions` row per sale per deal (`pending`) — idempotent, replays heal, no cookie = no conversion          |
| 📐 Spec    | `screens/creator-dashboard/network/network.md`            | Blueprint — **note:** its "right rail = My Peeps" is the old Layout B plan; My Peeps moved to the dock + `/dashboard/circle/*` (see gotchas)                                                   |

**🧠 Gotchas:** _the traps we already stepped on while building/fixing this screen — read them first, spare yourself the same sting._

- **Search and Discover are ONE thing.** "Search" = the box you type into;
  "Discover" = the section where results land (same words as the API
  `/api/discover/creators`). **Two views since 2026-10-07, pools revised
  2026-10-09:** empty query = the **collab list** (willing creators only —
  `open_to_collab` — shuffled each load, Featured pinned, never blank);
  typed query = search across **ALL creators** (FB-style directory — a closed
  creator is still findable, their card just shows the disabled button).
  Clearing the box returns to the list.
- **Search NEVER greys (FB model, 2026-10-09).** The old `show_in_search`
  switch + its mutual blind rule (box disabled, list replaced by a banner with
  [Turn on]) were **removed entirely** — no disabled box, no banner, no
  self-blanking, ever. The one switch left (**Accept collab requests**, in its
  card under the DISCOVER heading) only decides: (a) do I appear in the
  default collab feed, (b) can people Connect with me. Typed search ignores
  it — everyone stays findable by name. `creators.show_in_search` is parked
  (column kept, zero reads).
- **The billboard nudge fires once, on first sight — not on a toggle.**
  (Trigger retargeted 2026-10-09 with the switch removal.) When you land on
  Network with an **undesigned** billboard, a modal *"🎉 Design your billboard
  … (~2 min)"* offers [Design my billboard] (jumps to
  `/dashboard/playground?view=billboard`) / [Maybe later]; the flag lives in
  localStorage `billboard_nudge_seen_<username>`. No repeat — the permanent
  edit door is the **✏️ pencil in the My Billboard card header** (always
  visible since 2026-10-09; the Discover-header button + its flag gating were
  removed). The design editing itself lives in Playground (founder rule
  2026-10-09: *Network = see + toggle · Playground = design*).
- **Modal A = card click.** Both card types open `CreatorBillboardModal`
  (popup over the dimmed hub — your OWN billboard is edited in Playground →
  Billboard view, never in a modal; a second "your own billboard" modal was
  rejected). Connect/Visit
  live in a `stopPropagation` wrapper — without it, clicking Connect would
  ALSO open the modal.
- **"Not open to collabs" is a disabled button, not an error-after-click.**
  Search cards whose target closed their `open_to_collab` show the closed
  sign up front (the old flow only answered 403 *after* you pressed Connect).
- **The private-collab path is the invite link — and it now works logged-in.**
  Two collabs-OFF creators (out of the default feed — typed search still
  finds them since 2026-10-09) connect via `partnership.md`'s `?invite=`
  link; the `/onboarding` Screen consumes the code for an already-logged-in
  creator (shared `lib/partnerInvites.ts` with `POST /partners/onboarding`)
  and lands on `/dashboard/circle/partners` with a `?joined=` toast (or
  `?invite_error=1` → "Invite invalid or expired"). Pre-2026-10-07 it dropped
  the code, forcing a logout first.
- **The tablet column-inversion trap (fixed 2026-09-26).** The grid appears at
  `md:` but the order swap used to fire at `lg:` — grid placement uses
  *order-modified* document order, so every tablet (768–1023px) had the rail
  and Discover **flipped**. Law: the `order-*` swap must fire at the **same**
  breakpoint as the grid it serves (`order-2 md:order-1` for a `md:` grid).
- **`show_in_search` is a parked column (2026-10-09).** NULL-equals-visible
  logic mattered when the switch existed (2026-10-01 audit fixed a strict
  `eq(true)` that hid ON-by-default creators) — the switch + filter are now
  gone; nothing reads the column anymore (network.md §3).
- **The Connect button is a 4-word state machine** — `Connect → … → Requested →
  Connected`, tracked per creator id, disabled once sent. Server answers are
  mapped honestly: "Request already pending"/"Already connected" land on
  friendly states; pre-audit, *any* failure showed a fake "Connected" (fixed
  2026-10-01).
- **Two save styles on the billboard, on purpose.** Switches save **instantly**
  (optimistic flip → server; on failure it flips BACK + toasts — no silent
  disagreement with Discover). Text fields batch into one **Save** button —
  otherwise every keystroke would hit the server. A save that silently failed
  used to read as success (fixed 2026-10-01: error toast).
- **`dealsKey` is one shared refresh bell.** Creating a deal bumps a single
  number → all the affiliate widgets refetch together. Pre-fix they could
  disagree ("Your Deals" showed the new deal while links/discover showed stale
  data) until a full reload. (Earnings used to be a fourth — it moved to
  `/dashboard/earnings`, 2026-10-10; **the bell itself moved with the widgets
  to `AffiliateDealsSection` on 2026-10-12**.)
- **A conversion needs an attribution COOKIE — Door 1 is /ref, Door 2 is the
  in-app hop (mock).** `GET /ref/<code>` counts the click, writes an
  `affiliate_attributions` row + a 30-day `aff_attr` cookie, and redirects to
  the **deal owner's** storefront — NOT the promoter who created the link (the
  product lives with the owner; pre-fix the redirect used `link.creator_id`).
  Door 2 (**wired 2026-10-10**): opening a partner modal/page calls
  `firePartnerHop` (`lib/hopAttribution.ts` — module-level dedupe so each
  pair tags once) → `POST /api/fan/hop` writes the same cookie when an
  active owner↔host deal exists — purchases can complete inside the modal,
  so tagging fires on OPEN; no deal = `{tagged:false}` = plain navigation.
  `POST /fan/purchases/complete` reads the cookie → validates the
  deal (active, validity window, **creator-only**, trigger) → writes ONE
  `affiliate_conversions` row per sale per deal (`pending`, `due_at` = +14d).
  Replaying the purchase heals a missed row (idempotent); buying with **no
  cookie** writes nothing — the conservative side. Math lives in
  `lib/affiliateAttribution.ts`. Settlement *marking* (receipt protocol:
  Mark paid → Confirm/Dispute + 14-day ladder + Red Card) **shipped with the
  Earnings screen 2026-10-10** (`lib/settlement.ts` + `…/conversions/[id]/settle`
  + the earnings GET). Still open: `?ref=`
  passthrough, follow/subscribe/signup trigger writers, real PayPal webhook
  (route is mock-only).
- **The result card is INLINE in NetworkPage — that's the extraction rule
  working.** One card, one screen → stays inside the body. Avatar, Badge,
  Button, EmptyState, Spinner come from `shared/` because many screens wear
  them. Extract on the *second* use, never before.
- **The spec's third column never shipped.** `network.md` describes Layout B
  (left rail / center / right rail = My Peeps); the 2026-09-26 rebuild dropped
  the right rail and the 2026-09-27 rename moved My Peeps to the global dock →
  `/dashboard/circle/*`. The dock is shell chrome (Stop 04), not part of this
  screen.
- **Discover cards go 2-up only at `lg`.** Viewport breakpoints (`sm:grid-cols-2`)
  can't see the container; at tablet widths the center column is ~252px and
  cards squeezed to ~104px cells (fixed: `grid-cols-1 lg:grid-cols-2`).

**🛠️ Common edits:**

| You want to change...                | Touch                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Search ranking, fields, "who's findable" | `GET /api/discover/creators/route.ts` (the scorer + self-exclusion; pools: feed = client-side willingness, typed = everyone — landing marquee rides the same all-creators pool) |
| How fast search reacts               | `useCreatorSearch(debounceMs)` (default 300)                                                |
| The search box's look                | `components/shared/SearchBox.tsx` (worn by 2 screens — Network + admin CreatorsTable)   |
| Billboard popup contents             | `CreatorBillboardModal.tsx` (the seed paint + the `[id]` fetch mapping)                 |
| The billboard nudge (copy / flag)    | `dismissNudge` in `NetworkPage.tsx` + the localStorage key `billboard_nudge_seen_<username>` |
| Add a billboard field                | `components/playground/BillboardEditor.tsx` + `BillboardSettings` type + PUT body in `BillboardView.tsx` + the PUT route (the collab switch is NOT here — it lives in `NetworkSettings`) |
| Instant-switch behavior              | `handleInstantToggle` in `NetworkPage.tsx` (keep the rollback on failure); the card is `components/network/NetworkSettings.tsx` (the billboard nudge is a separate effect — first undesigned visit, not a toggle flip) |
| Add/fix an affiliate widget          | `components/earnings/*` (the 4 widgets + `AffiliateDealsSection` — refresh through its `dealsKey`, don't fetch on mount-only; **moved from `components/network/` 2026-10-12**) |
| Affiliate math / conversion rules    | `lib/affiliateAttribution.ts` (`computeDealCuts`, `dealCoversPurchase` — `scopeMatches` died with creator-only deals, 2026-10-10) + the writer calls in `purchases/complete` |
| Receipts / Red Card / the ladder    | **Earnings screen** — `screens/creator-dashboard/earnings/earnings.md` + `components/earnings/` + `POST /api/creator/affiliates/conversions/[id]/settle` + `computeRedCard` (one impl: deals POST 403 · engine pause · banner) |
| Money screen contents (sales, PayPal handle) | `components/earnings/EarningsPage.tsx` + `GET /api/creator/earnings/sales` + `PUT /api/creator/earnings/paypal` (Sheet 23)        |
| Create/manage affiliate deals (UI) | **Earnings §2b** — `components/earnings/AffiliateDealsSection.tsx` (+ the 4 widgets it composes — moved from `components/network/` 2026-10-12; `EarningsPage` order = Sales → Affiliate → **Deals** → Payments) |
| The Connect flow                     | `handleConnect` in NetworkPage + `POST /api/creator/partners/request`                       |
| Partner invite accept logic          | `lib/partnerInvites.ts` (`consumePartnerInvite` — ONE copy: API route + `/onboarding` Screen) |
| Old network sub-page URLs            | `proxy.ts` `LEGACY_ROUTES` (add a row — never re-create signpost files)                     |
| Which folder a widget lives in       | `components/network/` = network-domain only (billboard + Discover chrome); collab widgets (CollabList/Detail/InboxRequests) deliberately sit here too and are worn by `/dashboard/circle/partners`; **the affiliate widgets left for `components/earnings/` on 2026-10-12** |

---

*(Remaining stops (06, 08–15) get appended here as we walk.)*
