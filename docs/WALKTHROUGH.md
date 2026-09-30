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
| 🧠 Manager | `src/screens/public/onboarding/Screen.tsx` (46 lines)     | Server: sanitizes `?invite=`, bounces logged-in users to `/dashboard/my-app`, picks title ("Join your partner" vs "Create your account"), renders AuthCard |
| 🎨 Pixels  | `src/components/auth/OnboardingForm.tsx` (254)            | The form — Link Address + live availability, display name, email, password, permanence dialog, signup + redirect |
| 🔧 Kitchen | `POST /api/creator/register` (57)                         | Server-side truth: re-validates format + availability (excluding self, 409), writes `username` + `display_name` (upsert by user id) |
|            | `GET /api/creator/check-username` (30)                    | Anonymous availability lookup, **20/min rate limit** — also used by My App's identity editor |
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
| Where signup lands you                 | `performSignUp`, OnboardingForm line 154 (`/dashboard/my-app`)    |
| What gets written on register          | `api/creator/register/route.ts` (username + display_name upsert)  |
| Checker rate limit                     | `api/creator/check-username` — `enforceRateLimit(...)` line 9      |

---

*(Stops 04–15 get appended here as we walk.)*
