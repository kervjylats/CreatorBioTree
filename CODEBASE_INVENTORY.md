# CreatorBioTree — Complete Codebase Inventory

> **What this is:** one giant, ADHD-friendly map of EVERY folder, file, and page in this project — what it is, what it does, what it's like in plain English, what looks like what, and how the `wiredLater/` specs map to the existing code.
>
> **The one rule of this project:** `src/wiredLater/` = specs only (blueprints). Everything else = OLD code (the parts archive at `src/old-code/` + a live but mostly-naked skeleton). When we build (Phase F), we wire FROM THE SPECS ONLY, and open old code only when a spec says "see old code for the pattern."
>
> Last verified: 2026-08-07.
>
> ⚠️ **SNAPSHOT NOTICE (2026-08-19):** this inventory reflects the pre-Phase-F codebase. **Current counts (verified 2026-08-19):** 21 pages (login/onboarding/forgot-password/my-app/messages/fan shell wired; overview/network/settings/admin/search/landing/offline still stubs) · **84 API route files + 2 manifests** (was 77) · **17 screen folders** (was 15) · ~20 wired fan-pwa files (was 6 naked) · **6 hooks** (was 1) · **30 mock tables** (was 29 — messaging = 8 incl. `chat_prefs`) · 4 auth components live (was archive-only) · messaging engine fully built (was "nothing but tables registered"). The detailed rows below are historical; cross-check status against `WIRING_PLAN.md` before trusting any of them. Full refresh at the end of Phase F.

---

## 1. The Big Map (one glance)

```
creatorpwa/  (Next.js 16 + React 19 + Tailwind 4, TypeScript, mock-mode on)
│
├── src/
│   ├── wiredLater/        ⚠️ SPECS ONLY — 30 .md files (28 specs + 2 indexes)
│   │   ├── wiredLater.md  ← the index (start here)
│   │   ├── screens.md     ← the walkthrough (start here too)
│   │   ├── screens/       (creator-dashboard: overview, network, my-app, settings
│   │   │                   · admin/admin.md · fan-shell/fan-shell.md
│   │   │                   · public: landing, login, onboarding, offline)
│   │   ├── features/      (messaging, branding, relationships, team, partnership,
│   │   │                   partner-page, search + 6 My-App-tab stubs)
│   │   ├── monetization/  (index = pointer · owner.md = platform money
│   │   │                   · creators.md = creator money + affiliates)
│   │   └── ai/            (ai-features.md full spec + ai-agents.md placeholder — post-launch)
│   │
│   ├── app/               ⚠️ LIVE CODE — the THIN ADDRESS BOOK (19 pages + 77 routes)
│   │   ├── (public)/      page (/) · login · onboarding · offline · search — NAKED
│   │   ├── (admin)/       admin/page.tsx — NAKED (/admin)
│   │   ├── (creator)/     dashboard/ (page = REDIRECT → overview · overview · my-app ·
│   │   │                   network · settings) — NAKED
│   │   ├── (fan)/         [username]/ (page = REDIRECT → guest · guest · home · content ·
│   │   │                   connect · settings · app = REDIRECT · partner/[partnerUsername])
│   │   ├── auth/fan/route.ts      ← the ONLY working fan login flow
│   │   ├── api/                   41 API routes — MOSTLY LIVE (real logic, mock DB)
│   │   ├── manifest.json/route.ts  ← platform PWA (PWA #1)
│   │   └── (fan)/[username]/manifest.json/route.ts  ← per-creator PWA (PWA #3)
│   │
│   ├── screens/           ⚠️ THE MIDDLEMAN — 15 screens × (index.ts re-export + Screen.tsx stub)
│   │                       (public 5: landing/login/onboarding/offline/search · fan 5:
│   │                       guest/home/content/connect/settings · creator 4: overview/network/
│   │                       my-app/settings · admin 1). Every page.tsx re-exports from here.
│   ├── components/        ⚠️ 19 files: 12 shadcn ui/ + 6 NAKED fan-pwa + 1 SW register
│   ├── hooks/             useMediaQuery (the ONLY hook)
│   ├── lib/               24 utilities: 15 core + 6 mocks + 3 supabase clients
│   │                       (core now includes adopted api-utils/api-error/requireAuth — G6 ✅)
│   ├── services/          4 write-services (strip system fields, allow-list)
│   ├── types/             index.ts (628 lines, ALL domain types) + contentTypes.ts (16 types)
│   ├── styles/            globals.css (the whole design system lives here)
│   ├── proxy.ts           subdomain rewrite + auth guard (dashboard, admin)
│   └── old-code/          📦 PARTS ARCHIVE — 101 files (56 root + 17 catalog editors
│                           + 1 integrations + 27 allScreens backups). NEVER wire from here.
│
├── public/                sw.js (service worker, scope "/") + dashboard-manifest.json +
│                          favicon.ico + icons/ (2) + mock-uploads/ (stock SVGs DELETED)
├── docs/                  HOW_IT_WORKS.md · CODEBASE.md · ROADMAP.md · EXTERNAL_SERVICES.md
├── scripts/               check-docs.py (docstring police)
└── root configs           package.json · next.config.ts · tsconfig.json · eslint.config.mjs · .env.example
```

**Counts:** 30 spec files · 19 pages (16 naked + 3 redirects) · 77 route files (75 api + 2 manifests) · 15 screens × 2 files · 19 components (12 shadcn) · 1 hook · 24 lib (15 core + 6 mocks + 3 supabase) · 4 services · 2 type files · 101 old-code files · 4 docs.

---

## 2. Global Rules (G1–G25) — the laws every screen/file/page/tab follows

These are the rules extracted from the existing code. When we wire Phase F, we follow these — they ARE the de-facto constitution.

| # | Rule | Where it lives / why |
|---|---|---|
| **G1** | **Mock mode always on.** `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`. Every interceptor reads the single constant, never re-checks the env var | `src/lib/mocks/useMocks.ts:11` |
| **G2** | **Every .ts/.tsx needs a purpose docstring in the first 10 lines** (except shadcn ui/ and barrels). Route files use a `Route:` prefix convention | `scripts/check-docs.py` |
| **G3** | **NO Free/Pro tier gate in v1.** No `is_pro` checks anywhere. Every feature free for every creator | founder decision 2026-08-05, `monetization/owner.md` |
| **G4** | **NO platform take rate in v1.** Creators keep 100% minus Stripe's own fees. `platform_fee` column stays untouched | `monetization/owner.md` |
| **G5** | **Types are single-sourced in `@/types`.** No type re-declared in services/routes. `contentTypes.ts` derives from it | `src/types/index.ts:4-16` |
| **G6** | **Use the shared API helpers** (`api-utils.ts`, `api-error.ts`, `requireAuth.ts`) — **ADOPTED ✅ 2026-08-07** into `src/lib/` (they also remain in old-code as archive). New routes must use them; no more inline `NextResponse.json` everywhere | `src/lib/api-utils.ts`, `src/lib/api-error.ts`, `src/lib/requireAuth.ts` |
| **G7** | **Rate-limit public POSTs.** register 5/min · login 5/min · checkout 10/min · pageview 5/min (shared singleton) · check-username 20/min · fan/follow 10/min · fan/install 10/min · forgot-password 3/min · push/subscribe 10/min — **all added ✅ 2026-08-07** (magic-link limit removed with the route, 2026-08-08) | `src/lib/rate-limiter.ts` |
| **G8** | **Per-creator fan identity.** Fans are not global users — `fan_accounts` rows are keyed by (email, creator_id); session = `fan_session` cookie token | `src/lib/fanSession.ts` |
| **G9** | **Mock auth hydration via cookies.** Server routes read `mock_auth_uid` + `mock_auth_email` cookies so client logins survive to the server | `src/lib/supabase/server.ts:14-15`, `src/proxy.ts:23-28` |
| **G10** | **HMR-safe data.** All mock state lives on `globalThis.__MOCK_DATA_STORE__` so hot reloads never wipe your session data | `src/lib/mocks/mockDataStore.ts:59-68` |
| **G11** | **Async route params.** Next 15+/16 style — `params: Promise<{ username: string }>` + `await params` | every dynamic route |
| **G12** | **Service worker scope is `/`** — one SW for all 3 PWAs (landing, dashboard, fan apps). Caches `/offline` as the nav fallback | `public/sw.js`, `src/components/ServiceWorkerRegister.tsx` |
| **G13** | **The 3-layer fan view (Header → Spotlight → Catalog Feed) appears in EXACTLY 2 places:** guest page + fan Content tab. Never a third | `fan-shell.md` |
| **G14** | **Self-gating sections.** No placeholders, no "0 partners yet" stubs — a section renders ONLY if it has data | Connect tab rule, `fan-shell.md` Part 4c |
| **G15** | **Fan invisibility.** Affiliate deals, deal weights, take rates — NEVER shown to fans. No labels anywhere fan-facing | `monetization/creators.md`, `fan-shell.md` |
| **G16** | **`resolveBranding()` is the single source of truth** for every visual identity value. Never `(creator.custom_theme as any)?.profile?.appName` inline. Now includes 9 presets (override → preset → default chain) | `src/lib/branding.ts:80` |
| **G17** | **Mock = design draft.** The mock's exported function shape, return type and edge cases ARE the contract. Real implementation must return the SAME shape but may ADD features. Look for `// PRODUCTION-NOTE:` comments | `docs/HOW_IT_WORKS.md` → Migration Recipe |
| **G18** | **ONE shared `partnerships` table** for both Collabs (in-app) and Partnerships (invite links). A `source` flag (`collab` \| `invited`) records the entry point | `features/partnership.md`, `features/network.md` |
| **G19** | **Admin RBAC** via `getAdminAccount()` + `canPerform()` — all 7 admin routes check it. Role-gate: `super_admin` for accounts/api-keys, `admin` for creators/stats | `src/lib/admin-permissions.ts` |
| **G20** | **Write services protect the DB.** `contentService` strips system fields (`id`, `created_at`, `updated_at`, `creators`); `profileUpdateService` allow-lists 14 fields | `src/services/*.ts` |
| **G21** | **Cookie/localStorage naming:** `fan_session`, `my-app_draft_${creatorId}` (renamed from `playground_draft_` in types). ❗ stale `playground_banner_dismissed` key only exists in old-code — nothing live to rename | `my-app.md`, `usePlaygroundForm.ts` (old) |
| **G22** | **16 catalog content types** defined in `CONTENT_TYPES` (video, audio, image, pdf, page, link, product, physical, membership, newsletter, messaging, session, live, course, bundle, tip jar) | `src/types/contentTypes.ts:39` |
| **G23** | **NAKED placeholder pattern** for unwired routes: 4-line page with `/** X — NAKED. Old content in … */` docstring + empty `<main className="min-h-screen bg-background" />` | every naked page |
| **G24** | **No `as any` in business logic.** Cast at the mock/real boundary once (mock client casts to `SupabaseClient`), never inside components/routes | `mockSupabaseClient.ts:11-16` |
| **G25** | **Push notifications use web-push + VAPID.** `urlBase64ToUint8Array()` shared between SW and subscribe flow; branding icon used as notification icon | `src/lib/vapid.ts`, `api/push/send` |

---

## 3. Live Code (everything outside `wiredLater/` + `old-code/`)

### 3.1 Root configs (the house rules)

| File | What it is | Vibe |
|---|---|---|
| `package.json` | Next 16.2.1, React 19.2.4, Tailwind 4, zod, stripe, paddle, resend, web-push, @supabase/ssr, uuid, sonner, lucide, dnd-kit, react-colorful, AWS S3/R2 SDKs | The shopping list for the whole build — every lib you'll need at wiring is ALREADY installed |
| `next.config.ts` | Turbopack on, image remotePatterns for supabase.co / r2.dev / cloudflarestream, `Cache-Control: no-cache` header on `/sw.js` | "The image whitelist + the SW must never be cached" |
| `tsconfig.json` | Strict mode, `@/*` → `./src/*` alias, **excludes `src/old-code`** | "The archive doesn't compile and that's fine" |
| `eslint.config.mjs` | next core-web-vitals + typescript, ignores `.next`, `out`, `build`, **`src/old-code/**`**; globally OFF: no-explicit-any, no-unused-vars, set-state-in-effect, no-unescaped-entities | "Lint the live code hard, leave the archive alone" |
| `postcss.config.mjs` | Tailwind 4 via `@tailwindcss/postcss` | — |
| `components.json` | shadcn config (base-nova style, neutral base color, lucide icons) | — |
| `.env.example` | All env vars documented: Supabase, Stripe, Resend, VAPID, R2, Cloudflare Stream, Paddle, `NEXT_PUBLIC_USE_MOCKS`, support WhatsApp/email — **external-service refs point to `docs/EXTERNAL_SERVICES.md`** | The checklist for real-mode later |
| `src/proxy.ts` (not a root config) | **The front door.** 1) wildcard subdomain rewrite (`username.creatorpwa.app` → `/[username]`) 2) mock-mode dashboard auth guard (cookie → redirect to /login, admin gate) 3) real-mode Supabase auth guard for `/dashboard` + admin role check | "The bouncer at the club: checks your ticket before you enter any room" |

### 3.2 Pages (19 — 16 NAKED skeletons + 3 redirects)

Since the A2 restructure (2026-08-07), `src/app/` is a **thin address book**: every `page.tsx` is a 2-line re-export from `src/screens/<group>/<screen>/` (the middleman — 15 screens × `index.ts` + `Screen.tsx`). The Screen.tsx files are naked placeholders awaiting Phase F. Pattern: docstring saying what it was + `min-h-screen bg-background` empty main.

| Route | App file → screens file | Naked docstring points to |
|---|---|---|
| `/` | `(public)/page.tsx` → `screens/public/landing` | `allScreens/landing/page-old.tsx` (landing is DEFERRED spec) |
| `/login` | `(public)/login/page.tsx` → `screens/public/login` | `allScreens/login/page-old.tsx` |
| `/onboarding` | `(public)/onboarding/page.tsx` → `screens/public/onboarding` | `allScreens/onboarding/page-old.tsx` (DEFERRED spec) |
| `/offline` | `(public)/offline/page.tsx` → `screens/public/offline` | `allScreens/offline/page-old.tsx` |
| `/search` | `(public)/search/page.tsx` → `screens/public/search` | `allScreens/search/page-old.tsx` |
| `/dashboard` | `(creator)/dashboard/page.tsx` | **REDIRECT → `/dashboard/overview`** (live) |
| `/dashboard/overview` | `(creator)/dashboard/overview/page.tsx` → `screens/creator/overview` | `allScreens/dashboard-overview/page-old.tsx` |
| `/dashboard/network` | `(creator)/dashboard/network/page.tsx` → `screens/creator/network` | `allScreens/network/page-old.tsx` (spec: network.md) |
| `/dashboard/my-app` | `(creator)/dashboard/my-app/page.tsx` → `screens/creator/my-app` | `allScreens/dashboard-playground/page-old.tsx` (spec: my-app.md) |
| `/dashboard/settings` | `(creator)/dashboard/settings/page.tsx` → `screens/creator/settings` | `allScreens/dashboard-settings/page-old.tsx` (backup actually lives in dashboard-overview folder — see note in §7) |
| `/admin` | `(admin)/admin/page.tsx` → `screens/admin` | `allScreens/dashboard-admin/page-old.tsx` |
| `/{username}` | `(fan)/[username]/page.tsx` | **REDIRECT → `/{username}/guest`** (live) |
| `/{username}/guest` | `(fan)/[username]/guest/page.tsx` → `screens/fan/guest` | `allScreens/fan-page/page-old.tsx` |
| `/{username}/home` | `(fan)/[username]/home/page.tsx` → `screens/fan/home` | `allScreens/fan-page/tabs/HomeTab-old.tsx` |
| `/{username}/content` | `(fan)/[username]/content/page.tsx` → `screens/fan/content` | `allScreens/fan-page/tabs/ContentTab-old.tsx` |
| `/{username}/connect` | `(fan)/[username]/connect/page.tsx` → `screens/fan/connect` | `allScreens/fan-page/tabs/ConnectTab-old.tsx` |
| `/{username}/settings` | `(fan)/[username]/settings/page.tsx` → `screens/fan/settings` | `allScreens/fan-page/tabs/SettingsTab-old.tsx` |
| `/{username}/app` | `(fan)/[username]/app/page.tsx` | **REDIRECT → `/{username}`** (live, legacy fan-app gate) |
| `/{username}/partner/[partnerUsername]` | `(fan)/[username]/partner/[partnerUsername]/page.tsx` → (no screens folder — wired inline) | `allScreens/partner-page/page-old.tsx` |

**The only non-naked files in app root:** `layout.tsx` (root layout — TooltipProvider + ServiceWorkerRegister + themeColor viewport) and `(creator)/dashboard/layout.tsx` (auth guard: no user → /login, no creator row → /onboarding; exports `manifest: "/dashboard-manifest.json"` = PWA #2).

### 3.3 API routes (44 route files — 41 under `/api/` + 3 non-API routing hooks)

All route handlers are REAL logic (zod validation, rate limiting, auth checks) running on the mock DB. Grouped:

**Fan auth (4 live, 2 deleted 2026-08-08):**
| Route | What it does |
|---|---|
| `api/fan/register` | Creates `fan_account` (SHA-256 hashed password via `hashPassword`), rate-limited 5/min, idempotent (existing email → just re-session). Sets `fan_session` cookie, returns `redirect: /{username}/settings` |
| `api/fan/login` | Verifies password hash, 5/min limit, 401s with clear messages. Same session-set logic |
| `api/fan/forgot-password` | Generates reset token; **in mock mode returns it directly in the response**. 3/min limit ✅ |
| `api/fan/reset-password` | Accepts token + new password → updates hash |
| ~~`api/fan/magic-link`~~ | **DELETED 2026-08-08** — founder decision: fans use email + password only (was: email a 1-hour access link) |
| ~~`auth/fan/route.ts`~~ | **DELETED 2026-08-08** — the magic-link token landing page |

**Fan data (4):**
| Route | What it does |
|---|---|
| `api/fan/dashboard` | Fan's personal dashboard: linked creators, purchased items with joins, referrals |
| `api/fan/install` | Records a fan app install (session-cookie identified). 10/min ✅ |
| `api/fan/follow` | Follow/unfollow a partner creator (fan_session cookie). 10/min ✅ |
| `api/fan/content/access` | Unlock check: is this fan entitled (purchase/subscription) to this content item? |

**Fan content (3):**
| Route | What it does |
|---|---|
| `api/fan/content/list` | Public catalog feed for a creator (published only, sorted). Has `Array.isArray` guard from Phase A fix |
| `api/fan/content/[id]/comments` | Comments on content items |
| `api/fan/content/[id]/reactions` | Reactions on content items |

**Creator catalog (7 — the CRUD family):**
| Route | What it does |
|---|---|
| `api/creator/catalog` | GET list + POST create (zod: type/title/description, auto sort_order = count+1) |
| `api/creator/catalog/[itemId]` | PATCH / DELETE single item |
| `api/creator/catalog/[itemId]/modules` | Course modules list + create |
| `api/creator/catalog/[itemId]/modules/[moduleId]` | Module PATCH / DELETE |
| `api/creator/catalog/[itemId]/lessons` | Lessons list + create (flat, no module) |
| `api/creator/catalog/[itemId]/modules/[moduleId]/lessons` | Lessons under a module |
| `api/creator/catalog/[itemId]/modules/[moduleId]/lessons/[lessonId]` | Single lesson PATCH / DELETE |

**Creator utility (4):**
| Route | What it does |
|---|---|
| `api/creator/upload` | File upload (mock → mock storage; real → R2). **THE one upload door** — its duplicate was deleted ✅ |
| `api/creator/check-username` | Username uniqueness check. 20/min ✅ |
| `api/creator/pageview` | Page view counter, 5/min per IP per creator, **silently 200s** rate-limited requests — uses the SHARED rate-limiter singleton (custom Map removed ✅) |
| `api/creator/activity` | Activity timeline events for the Overview page |

**Creator fans (2):**
| Route | What it does |
|---|---|
| `api/creator/fans/list` | Fan list with stats (status, LTV, last purchase) — the My Peeps fan data source |
| `api/creator/fans/export` | CSV export — includes "Total Spent ($)" column (Phase A enhancement) |

**Creator AI (2):**
| Route | What it does |
|---|---|
| `api/creator/ai-summary` | Groq → creator bio summary (mock: keyword templates in `mockAiSummary`), writes `ai_summary` |
| `api/creator/playground/ai` | **AI Copilot** — Groq Llama 3.3 70B → 3 theme palettes (mock: `mockAiPalettes` returns 3 normalized palettes). Route will move to `/api/creator/my-app/ai` at wiring |

**Stripe (3) + Paddle (1):**
| Route | What it does |
|---|---|
| `api/stripe/checkout` | Full checkout flow: zod, 10/min limit, loads item via contentService, creates Stripe session (mock → localhost success URL with `?payment=success`), handles `referred_by`/commission metadata |
| `api/stripe/connect` | Stripe Connect onboarding for creator payouts (accounts.create + accountLinks.create) |
| `api/stripe/webhook` | `checkout.session.completed` → writes `fan_purchases` row (mock mode: `mockStripeCheckoutEvent` helper for testing) |
| `api/webhooks/paddle` | Paddle `transaction.completed` → same purchase path (alternative provider) |

**Push (2):**
| Route | What it does |
|---|---|
| `api/push/subscribe` | Saves a `push_subscriptions` row. 10/min ✅ |
| `api/push/send` | Creator broadcast: resolves branding for the icon, loops web-push to all subscribers, returns `{ sent: n }` |

**Admin (7 — all RBAC-gated):**
| Route | What it does |
|---|---|
| `api/admin/stats` | Platform totals: creators, fans, revenue |
| `api/admin/creators` | All non-admin creators + stats |
| `api/admin/creators/[id]` | PATCH features/plan for a creator |
| `api/admin/creators/[id]/fans` | All fan_accounts for one creator |
| `api/admin/accounts` | GET list + POST create admin (super_admin only) |
| `api/admin/accounts/[id]` | PATCH role / DELETE (super_admin only) |
| `api/admin/api-keys` | Creates an admin account with `role=agent` — the AI-agent automation door |

**Unwired (1):**
| Route | What it does |
|---|---|
| `api/creator/social/scrape` | **503 stub** — "unwired, see `old-code/integrations/social-scrape-route-old.ts`" |

**Non-API routes (3):**
| Route | What it does |
|---|---|
| `app/manifest.json/route.ts` | Platform PWA manifest (PWA #1) |
| `app/(fan)/[username]/manifest.json/route.ts` | **Dynamic per-creator manifest** — name/icon/colors from `resolveBranding()`, `start_url` at the fan app (PWA #3). This is the fan app on the phone |

### 3.4 Components (19)

**`components/ui/` (12 — shadcn, exempt from docstrings):** button, input, textarea, select, switch, dialog, card, badge, avatar, tabs, tooltip, sonner (toasts). All installed, all themed via `globals.css`.

**`components/fan-pwa/` (6 — NAKED, the 4 tabs + shell + guest page only keep their interfaces):**
| File | State |
|---|---|
| `FanAppShell.tsx` | NAKED (props already typed: branding, fanId, creatorId) |
| `PublicCreatorPage.tsx` | NAKED |
| `FanHomeTab.tsx` / `FanContentTab.tsx` / `FanConnectTab.tsx` / `FanSettingsTab.tsx` | NAKED (the 4 tabs, all stubs awaiting the fan-shell spec) |

**Other:**
| File | What it is |
|---|---|
| `ServiceWorkerRegister.tsx` | Registers `/sw.js` with scope `/` on every page (root layout) — the app is PWA-ready |

> The old `library/index.ts` empty barrel was **DELETED** ✅ (2026-08-07).

### 3.5 Hooks (1)

`hooks/useMediaQuery.ts` — reactive `matchMedia` wrapper. The only hook in live code. Everything else that was a hook (usePlaygroundForm, useCreatorSearch, usePWAInstall, useAutoSave) is in the archive.

### 3.6 Lib (24 files: 15 core + 6 mocks + 3 supabase)

**Core (15 — 12 original + 3 adopted helpers):**
| File | What it is | Vibe |
|---|---|---|
| `lib/branding.ts` | `resolveBranding()` + `presetById()` + **9 BRAND_PRESETS + override → preset → default chain** | "The one true color bible — every page asks this file 'what color am I?'" |
| `lib/fanSession.ts` | Fan session: SHA-256 hashing, cookie token ↔ `fan_sessions` table, set/clear/get, 1-year cookie | "The per-creator fan passport" |
| `lib/rate-limiter.ts` | `IRateLimiter` + in-memory `InMemoryRateLimiter` singleton + commented Upstash prod version | "The bouncer's clipboard — counts knocks per minute" |
| `lib/queue.ts` | `IQueue` + `DirectQueue` (runs handlers immediately) + `onJob()` registry + commented QStash prod version | "The to-do list that does tasks instantly instead of later" |
| `lib/email.ts` | `IEmailSender` + `MockEmailSender` (routes through `mockResendSend`) + commented Resend prod version | "The post office that prints every letter to the console" |
| `lib/stripe.ts` | Real Stripe client OR a Proxy that mocks checkout.sessions/accounts/accountLinks/webhooks/transfers | "A fake cash register that accepts anything and says 'paid!'" |
| `lib/paddle.ts` | Real Paddle SDK (sandbox/prod switch) OR `mockPaddle` | "Stripe's backup singer" |
| `lib/vapid.ts` | `urlBase64ToUint8Array()` — VAPID key decoder for Web Push | "The decoder ring for push notifications" |
| `lib/colorExtraction.ts` | `extractPaletteFromImage()` — canvas sampling, 32-step quantization, luminance-aware text/card/accent | "The eye that looks at your banner and says 'nice palette'" |
| `lib/urls.ts` | `getCreatorPageUrl` (custom domain → origin → env fallback chain), `getPartnerContentUrl`, `getFanAppUrl` | "The address book" |
| `lib/admin-permissions.ts` | `getPermissionsForRole`, `hasPermission`, `canPerform`, `getAdminAccount` (auto-seeds admin accounts) | "The bouncer's VIP list" |
| `lib/utils.ts` | `cn()` class merger (clsx + tailwind-merge) | "The glue" |
| `lib/api-utils.ts` | **ADOPTED ✅** `ok()`, `fail()`, `wrapHandler()` (NotFoundError → 404, else 500) | "The washroom attendant — everyone's same response shape" |
| `lib/api-error.ts` | **ADOPTED ✅** Typed error classes (`NotFoundError` etc.) for `instanceof` checks | "The error types" |
| `lib/requireAuth.ts` | **ADOPTED ✅** `requireAuth()` → user or 401; `requireAdmin()` → admin or 403 | "The guard for route handlers" |

**Mocks (6 — the design drafts, NEVER delete):**
| File | What it is |
|---|---|
| `mocks/useMocks.ts` | `USE_MOCKS` constant — the single master switch (line 11) |
| `mocks/mockDataStore.ts` | HMR-safe relational store on `globalThis.__MOCK_DATA_STORE__`, **29 tables now (15 original + 14 new: messaging 7 + team 3 + affiliates 4)** (`TableName` union = the schema), `uuid()` helper, starts EMPTY |
| `mocks/mockSupabaseClient.ts` | **The crown jewel (1,139 lines).** Fluent fake Supabase: query surface, auth, storage, 7 mocked RPCs. Join resolution via `JOIN_REGISTRY` (no SQL parser) |
| `mocks/mockResend.ts` | Resend stand-in — logs emails + appends full payloads to `temp_emails.log` (gitignored) so reset URLs are copyable |
| `mocks/mockPayments.ts` | Stripe checkout session mock (returns success URL pointing back at the creator page) + Paddle mock + event factory helpers |
| `mocks/mockAI.ts` | `mockAiSummary` (7 niche templates + fallback) + `mockAiPalettes` (4 keyword presets × 3 palettes each, normalized) |

**Supabase trio (3):**
| File | What it is |
|---|---|
| `lib/supabase/server.ts` | `createClient()` for server components/routes — mock: hydrates from `mock_auth_uid`/`mock_auth_email` cookies; real: SSR client with cookie setAll try/catch |
| `lib/supabase/client.ts` | `createClient()` for browser — mock: plain mock; real: `createBrowserClient` |
| `lib/supabase/admin.ts` | `createServiceClient()` — service role, bypasses RLS. Mock: same |

### 3.7 Services (4 — the safe-write layer)

| File | What it is |
|---|---|
| `services/creatorService.ts` | `getByUsername` / `getById` — throws on miss, lowercases usernames |
| `services/contentService.ts` | Read: published-only for fans, all for dashboard. Write: **strips system fields** (`id`, `created_at`, `updated_at`, `creators`) from payloads. Also exports types for re-export compatibility |
| `services/fanService.ts` | `getDashboardData(fanEmail)` — two targeted queries (accounts with creator join → completed purchases with item + creator joins). Never exposes billing data on fan refs |
| `services/profileUpdateService.ts` | **Allow-list of 14 fields** (display_name, bio, username, tags, theme_id, metadata, avatar_url, banner_url, custom_theme, social_links, social_screenshots, push_notifications_enabled, is_discoverable) — anything else silently dropped. Throws on DB error |

### 3.8 Types (2 — the single source of truth)

| File | What it is |
|---|---|
| `types/index.ts` (628 lines) | ALL domain types: Plan, FontStyle/ButtonStyle/BorderRadius, FanViewId, **MyAppProfile/Colors/Theme** (renamed from Playground*), Creator (full column list, now **+tagline, collab_style, connect_empty_text**), ContentItem (now **+affiliate_enabled, scheduled_publish_at, scheduled_unpublish_at**), ContentType, PricingModel, FileSubtype, BillingCycle, AccessType, Partnership (**+source: PartnershipSource**), FanAccount (**+do_not_contact, notes**), FanPurchase, AdminRole/AdminAccount/ADMIN_PERMISSIONS, TYPE_VALUES, **plus the new feature families: Messaging (Conversation/Member/Message/Attachment/Request/BlockedUser/CommunityChannel), Team (TeamMember/Invite/Activity), Affiliates (AffiliateDeal/Attribution/Conversion/Link + DealType/Scope/Trigger), FanProfile**, etc. |
| `types/contentTypes.ts` (259 lines) | `ContentTypeMeta` + `CONTENT_TYPES` — the 17-type catalog registry: label, emoji icon, default pricing, allowed pricing models, editor component name, file subtypes, metadata keys, `supports` flags |

### 3.9 Styles + Public + Scripts

| File | What it is |
|---|---|
| `styles/globals.css` | Tailwind 4 theme — CSS vars for bg/foreground/primary/accent/card etc. + `min-h-screen-safe` utility. The whole design system |
| `public/sw.js` | Service worker: pre-caches `/offline`, network-first with offline fallback for navigations, push notification handler + notification click → open URL |
| `public/dashboard-manifest.json` | PWA #2 manifest (dashboard installable) — name/icon/colors, scope `/dashboard` |
| `public/icons/icon-192x192.png` + `icon-512x512.png` | Platform icons (also the branding fallback in `resolveBranding`) |
| `public/mock-uploads/.gitkeep` | Mock file-upload storage dir |
| `public/favicon.ico` | Platform favicon |
| ~~`public/*.svg` (next, vercel, file, window, globe)~~ | **DELETED** ✅ (2026-08-07) |
| `scripts/check-docs.py` | Docstring police: scans `src/`, flags files missing JSDoc in first 10 lines, `--fix` inserts placeholders. Exit 0 = all clean |

### 3.10 Docs (4 living docs + plan/audit maps at root)

| File | What it is |
|---|---|
| `docs/HOW_IT_WORKS.md` | The product explained: mock↔production mapping table, Migration Recipe, Future Production Items §16 |
| `docs/CODEBASE.md` | Folder map + walkthrough (sections 6.3/6.4 updated for wiredLater/old-code split) |
| `docs/ROADMAP.md` | Phase A→F. **Phase F = the single wiring pass** — currently unchecked, waits for every spec to be written AND approved |
| `docs/EXTERNAL_SERVICES.md` | **NEW 2026-08-07** — the external-service assessment: planned list, free-tier map, stay-in-code list, migration-flow reminder. Replaced the ghost refs `EXTERNAL_INTEGRATION_ROADMAP.md` + `SETUP_GUIDE.md` |
| `WIRING_PLAN.md` (root) | The Phase F execution map — 23 connection-map sheets in order (see §8) |
| `CODEBASE_AUDIT.md` (root) | Read-the-verdicts map — what the archive holds, what's dead, what to adopt |
| `CODEBASE_INVENTORY.md` (root) | This file |

---

## 4. The Parts Archive — `src/old-code/` (101 files, reference ONLY)

Never wire from here. Specs say "see old code for the pattern" → come here. Grouped by purpose:

### 4.1 My App / Playground editor (the old 3-panel editor → now `my-app.md`)
| File | What it is |
|---|---|
| `usePlaygroundForm.ts` | The old theme form hook — auto-save, validation, `playground_draft_` key. Renamed in specs to `useMyAppForm` |
| `useAutoSave.tsx` | Unsaved-changes guard + debounced autosave (became part of the draft system) |
| `PhonePreview.tsx` | The cramped 260×520 phone preview — replaced by the full-screen phone in the spec |
| `PlaygroundInfoBanner.tsx` | "Playground is live" banner (renamed `MyAppInfoBanner` in specs) |
| `PageViewTracker.tsx` | Fire-and-forget page view poster (calls `/api/creator/pageview`) |
| `BottomEditor.tsx` / `BottomPanel.tsx` | The old side/bottom editor panels — ancestor of the 8-tab editor sheet |
| `AppIdentityEditor.tsx` | App Name/Icon editor — ancestor of Identity → App sub-section |
| `GlobalSettingsEditor.tsx` | Theme/design editor — ancestor of the Design tab. **Was the keeper of the 9 real presets** — now copied into `lib/branding.ts` as `BRAND_PRESETS` ✅ |

### 4.2 Fan shell parts (→ `fan-shell.md`)
| File | What it is |
|---|---|
| `GuestPageContent.tsx` | Old guest storefront view |
| `CreatorHeader.tsx` | Banner + avatar + name + social links header |
| `FanStatsCard.tsx` | Fan modal stats table (used by old dashboard) |
| `FanBottomNav.tsx` | Old 4-tab bottom nav for the fan app |
| `FanAuthModal.tsx` | Signup/login modal for fans |
| `FollowButton.tsx` | Follow toggle |
| `PoweredByFooter.tsx` | "Powered by CreatorBioTree" strip |
| `SocialLinks.tsx` | Social icon buttons (IG, TikTok, YT, X) with auto-generated URLs |

### 4.3 PWA install kit (→ offline.md + fan-shell.md)
`InstallBanner.tsx`, `InstallButton.tsx`, `IOSInstallGuide.tsx`, `InAppBrowserWarning.tsx`, `usePWAInstall.ts` — the 5-piece install flow. The spec wants these consolidated into one shared hook/component.

### 4.4 Network & search (→ network.md + search.md)
| File | What it is |
|---|---|
| `CreatorCard.tsx` | Directory card |
| `CreatorResultCard.tsx` | Search result card (near-duplicate of CreatorCard) |
| `CreatorSearchInput.tsx` | Debounced search input |
| `SearchFilters.tsx` | Search bar + filters with URL sync |
| `useCreatorSearch.ts` | Search hook (fetch discoverable creators) |
| `search-utils.ts` | Query-building helpers |
| `DiscoverCreators.tsx` | Search bar + results grid combo |

### 4.5 Landing page kit (→ landing.md, DEFERRED)
`LandingHeader.tsx`, `HeroSection.tsx`, `FeaturesSection.tsx`, `TestimonialsSection.tsx`, `DemoSection.tsx`, `CTASection.tsx`, `Footer.tsx`, `LandingPage.tsx`, `LandingPWA.tsx`

### 4.6 Auth kit (→ login.md + onboarding.md)
`AuthCard.tsx` (shared shell), `LoginForm.tsx`, `OnboardingForm.tsx` (with invite-code support), `PartnerOnboarding.tsx`

### 4.7 Dashboard widgets (→ overview.md)
`AnalyticsWidgets.tsx`, `DashboardTimeline.tsx`, `CreatorManagementWidgets.tsx` (incl. `FanExportButton`), `FanStatsCard.tsx`

### 4.8 Settings/integrations (→ settings.md)
`StripeConnectPanel.tsx`, `HelpButton.tsx` (WhatsApp/email support), `UpdateToast.tsx`

### 4.9 Generic UI (reusable anywhere)
`ErrorBoundary.tsx`, `EmptyState.tsx`, `LoadingSpinner.tsx`

### 4.10 Auth/API helpers (→ G6 — ADOPTED, also live in `src/lib/`)
| File | What it is |
|---|---|
| `api-utils.ts` | Centralized response helpers — `ok()`, `fail()`, `wrapHandler()` (NotFoundError → 404, else 500). **Live copy now in `src/lib/api-utils.ts`** |
| `api-error.ts` | Typed error classes (`NotFoundError` etc.) for `instanceof` checks. **Live copy now in `src/lib/api-error.ts`** |
| `requireAuth.ts` | `requireAuth()` → user or 401; `requireAdmin()` → admin or 403. **Live copy now in `src/lib/requireAuth.ts`** |

### 4.11 Catalog editors (17 — one editor per content type)
`CatalogManager.tsx` (the list/dashboard) · `AddItemPicker.tsx` (type chooser) · `CoverUploader.tsx` (shared) · `PricingEditor.tsx` (shared pricing block) · `CountdownField.tsx` (shared) · then one per type: `FileEditor` (video/audio/image/pdf/ebook), `LinkEditor`, `ProductEditor`, `PhysicalEditor`, `MembershipEditor`, `NewsletterEditor`, `MessagingEditor`, `SessionEditor`, `LiveEditor`, `CourseEditor` (modules+lessons), `BundleEditor`, `TipJarEditor`.

### 4.12 Integrations (1)
`integrations/social-scrape-route-old.ts` — the old social scraping route (the 503 stub's future body). Spec: `features/integrations.md`.

### 4.13 allScreens backups (27 — full old screens, for reference only)
- **landing** `page-old.tsx` · **login** `page-old.tsx` · **onboarding** `page-old.tsx` · **offline** `page-old.tsx` · **search** `page-old.tsx` (SSR + inline cards)
- **dashboard-overview** `page-old.tsx` · **dashboard-playground** `page-old.tsx` (phone preview + branding + deploy + unsaved modal) · **dashboard-admin** `page-old.tsx` (3 tabs: Overview/Admins/API Keys)
- **network** `page-old.tsx` (naked), `network-page-old.tsx` (full partner discovery + collab management), `PartnerInviteCard-old.tsx`, `partnershipService-old.ts`, `api/` (7 old partner routes: fan-partners, fan-partner-content, creator-partners, creator-partners-stats, creator-partners-onboarding, creator-partners-invite, creator-partners-id)
- **partner-page** `page-old.tsx` (placeholder w/ fan-auth gate + branding)
- **fan-page** `page-old.tsx` (guest ↔ fan switch), `PublicCreatorPage-old.tsx`, `FanAppShell-old.tsx`, `tabs/` (`HomeTab-old`, `ContentTab-old`, `ConnectTab-old`, `SettingsTab-old`)

---

## 5. Spec ↔ Code Mapping (every spec: what already exists)

Status: 🟢 exists / 🟡 partial / 🔴 nothing.

| Spec | Status | What already exists (live + archive) |
|---|---|---|
| **overview.md** | 🟡 | Page naked; API: `pageview`, `activity`, `fans/export` live. Archive: AnalyticsWidgets, DashboardTimeline, CreatorManagementWidgets, dashboard-overview/page-old |
| **network.md** | 🟡 | Page naked; Archive: full old network page + partnershipService + 7 partner routes + CreatorCard/search kit. Affiliate code = tables + types only (new, no UI) |
| **my-app.md** | 🟡 | Page **at `/dashboard/my-app`** (route moved ✅); API: `playground/ai` live (rename to `my-app/ai` at wiring); Archive: full old playground page + PhonePreview + usePlaygroundForm + 17 catalog editors + useAutoSave |
| **settings.md** | 🟡 | Page naked; API: `stripe/connect` live; Archive: StripeConnectPanel, dashboard-settings backup (missing — see §7 note) |
| **admin.md** | 🟡 | Page naked (3-tab old version in archive); API: all 7 admin routes + RBAC live; Archive: dashboard-admin/page-old |
| **fan-shell.md** | 🟡 | Page naked + 6 fan-pwa components naked; API: register/login/forgot/reset/dashboard/install/follow/content-access live (magic-link + auth/fan **deleted 2026-08-08** — email + password only); manifests live; Archive: full old fan page + 4 tabs + FanAuthModal + FollowButton + GuestPageContent + CreatorHeader + FanBottomNav + PoweredByFooter |
| **landing.md** | 🔴 | Page naked (DEFERRED). Archive: complete 9-piece kit |
| **login.md** | 🟡 | Page naked; mock auth infra live (cookies, proxy guard). Archive: AuthCard + LoginForm |
| **onboarding.md** | 🟡 | Page naked (DEFERRED); dashboard/layout redirects no-creator → /onboarding. Archive: AuthCard + OnboardingForm + PartnerOnboarding |
| **offline.md** | 🟡 | Page naked; sw.js + /offline caching LIVE (basic); Archive: offline/page-old. Spec adds tiny-pocket storage + local-first sync (new) |
| **messaging.md** | 🟡 | Nothing but **tables registered** (conversations, conversation_members, messages, message_attachments, message_requests, blocked_users, communities in `mockDataStore.ts`) + all types in `types/index.ts`. No API, no ChatShell — wires 100% fresh from spec |
| **branding.md** | 🟡 | `resolveBranding()` + FONT_MAP live; manifest route uses it; **9 presets now in `branding.ts`** ✅; `connect_empty_text` + `buttonStyle`/`borderRadius` **now in types** ✅ |
| **relationships.md** | 🟡 | API: `creator/fans/list` + `fans/export` live; Archive: FanStatsCard, CreatorManagementWidgets. `do_not_contact` + `notes` now in `FanAccount` ✅; message history, profile drawer = new |
| **team.md** | 🟡 | **Tables registered** (creator_team_members/invites/activity) + TeamMember/Invite/Activity types live. No routes, never built |
| **partnership.md** | 🟡 | Archive: PartnerInviteCard + 7 partner routes + partnershipService (the whole old flow). `partnerships` + `source` (PartnershipSource type) ✓; `partner_invites` table registered ✓ |
| **partner-page.md** | 🔴 | Page naked; Archive: partner-page/page-old (fan-auth gate + branding pattern to reuse) |
| **search.md** | 🟡 | Page naked; Archive: complete search kit (SearchFilters, useCreatorSearch, search-utils, CreatorSearchInput, CreatorResultCard) |
| **catalog-roadmap.md** (stub) | 🟡 | Merged into My App Catalog tab; 17 editors + catalog API family live |
| **funnel.md** (stub) | 🔴 | Merged into My App Catalog tab — funnels never built |
| **integrations.md** (stub) | 🟡 | social/scrape = 503 stub; old route in archive; R2/Stream env vars ready |
| **email-campaigns.md** (stub) | 🟡 | Email infra live (mockResend + emailSender) but no campaign UI |
| **media-kit.md** (stub) | 🔴 | Nothing |
| **affiliates.md** (stub) | 🔴 | No UI — **but all 4 tables (affiliate_deals/attributions/conversions/links) + types registered** ✅; economics in monetization/creators.md Part 2 |
| **monetization/ (3 files)** | 🟢 | Pure economics — no code needed (v1 locks: no gates, no take rate) |
| **ai-features.md** | 🟡 | `ai-summary` + `playground/ai` live with mockAI; full spec is post-launch |
| **ai-agents.md** | 🔴 | Placeholder only |

---

## 6. Similarity Clusters (things that look alike — merge decisions at wiring)

| Cluster | Members | Verdict |
|---|---|---|
| **A. Naked 4-line pages** | All 13 pages | All same pattern — wire each from its own spec |
| **B. Fan modal trigger** | FanAuthModal, AuthCard, partner modal spec | One auth-modal pattern for fans |
| **C. Rate limiting** | `rate-limiter.ts` singleton vs pageview's custom Map | **MIGRATED ✅** — pageview now uses the singleton |
| **D. Upload endpoints** | `creator/upload` vs `creator/content/upload` | **DONE ✅** — `content/upload` deleted; one door |
| **E. Email senders** | `email.ts` vs `mockResendSend` called directly (paddle webhook, fan auth emails) | Consolidate on `emailSender` singleton at wiring |
| **F. Fan list/stats** | `admin/creators/[id]/fans` · `creator/fans/list` · `creator/fans/export` · `api/fan/session` (stale CSV) | **DONE ✅** — `api/fan/session` deleted; keep the other three |
| **G. Admin route pattern** | 7 admin routes | All follow getAdminAccount/canPerform — keep as the template |
| **H. Catalog CRUD family** | 7 catalog routes | Identical shape — one pattern |
| **I. Creator cards** | CreatorCard vs CreatorResultCard | Merge into one at wiring (search.md spec) |
| **J. Search inputs** | CreatorSearchInput vs SearchFilters | Use SearchFilters (URL sync wins) |
| **K. Auth forms** | LoginForm vs OnboardingForm | Both sit in AuthCard — keep |
| **L. PWA install kit** | InstallBanner, InstallButton, IOSInstallGuide, InAppBrowserWarning, usePWAInstall | Consolidate into ONE install component/hook per offline.md |
| **M. Theme editors** | AppIdentityEditor vs GlobalSettingsEditor | Become Identity + Design tabs in the 8-tab sheet |
| **N. Fan auth shells** | FanAuthModal vs AuthCard | Similar — decide at wiring |
| **O. Dashboard widgets** | AnalyticsWidgets, DashboardTimeline, CreatorManagementWidgets, FanStatsCard | Overview spec re-skins them |
| **P. Auth routes** | register, login, forgot-password, reset-password (magic-link + auth/fan deleted 2026-08-08) | 4 live routes, one coherent family — hashing/session shared in fanSession.ts |
| **Q. Supabase clients** | server.ts / client.ts / admin.ts | 3 variants, one switch each — keep |
| **R. API helpers unused** | api-utils.ts, api-error.ts, requireAuth.ts | **ADOPTED ✅** — live copies in `src/lib/` (G6) |
| **S. Footers** | Footer (landing) vs PoweredByFooter (fan) | Different jobs — keep both |

---

## 7. Dead / Dormant Files (flag before Phase F)

| File | Why it's dead | Action |
|---|---|---|
| ~~`src/components/library/index.ts`~~ | Empty `export {}` barrel | **DELETED ✅** |
| ~~`api/creator/content/upload`~~ | Duplicate of `api/creator/upload` | **DELETED ✅** |
| ~~`api/fan/session`~~ | Stale CSV export dup of `fans/export` | **DELETED ✅** |
| ~~`public/*.svg` (next/vercel/file/window/globe)~~ | Stock boilerplate | **DELETED ✅** |
| `api/creator/social/scrape` | 503 stub | Rebuild from `integrations.md` + old route |
| `playground_banner_dismissed` localStorage key | Old name — only in old-code now | Rename `my-app_*` at wiring (G21), no live rename needed |
| `dashboard/settings` docstring → `dashboard-settings/page-old.tsx` | Backup file doesn't exist | Fix docstring at wiring |
| ~~`EXTERNAL_INTEGRATION_ROADMAP.md`, `SETUP_GUIDE.md`~~ | Never existed; refs were ghosts | **REPOINTED ✅ — all refs now point to `docs/EXTERNAL_SERVICES.md`** |

---

## 8. Final Wiring Checklist (Phase F preview)

1. Run `cmd /c "npm run typecheck"` + `cmd /c "npm run lint"` + `python scripts/check-docs.py` — all must stay green (G2).
2. ~~Adopt `api-utils.ts` / `api-error.ts` / `requireAuth.ts` (G6)~~ — **DONE ✅ 2026-08-07** — now in `src/lib/`.
3. ~~Kill dead files (§7)~~ — **DONE ✅** — `content/upload`, `api/fan/session`, empty barrel, stock SVGs all deleted.
4. ~~Migrate `pageview` to the shared rate limiter (C)~~ — **DONE ✅** — plus the 5 missing rate limits (G7) all added.
5. ~~Rename route `/dashboard/playground` → `/dashboard/my-app`~~ — **DONE ✅** — route lives at `/dashboard/my-app`; localStorage key `my-app_draft_*` in types; remaining: `playground/ai` API route → `my-app/ai`.
6. ~~Add new tables from specs (messaging: conversations/members/messages/attachments/requests/blocked + communities; team: creator_team_*; affiliates: affiliate_deals/attributions/conversions/links)~~ — **DONE ✅** — all 14 registered in `mockDataStore.ts` (29 total).
7. Rebuild `social/scrape` from spec; consolidate email on `emailSender` (E) and PWA install kit into one component (L).
8. Wire screens in WIRING_PLAN.md sheet order — specs only, old code as pattern reference.
9. Every feature lands in its DECIDED wiring home (Network 3-section layout; My Peeps right rail; Connect tab redesign; floating inbox).
10. External services: use `docs/EXTERNAL_SERVICES.md` as the migration map (planned vs new vs stay-in-code).

---

## 9. File Counts (verified 2026-08-07)

| Area | Count |
|---|---|
| `wiredLater/` spec .md | **30** (28 specs + 2 indexes) |
| Pages (`page.tsx`) | **19** (16 naked + 3 redirects) — all thin re-exports to `src/screens/` |
| `screens/` middleman | **30** files = 15 screens × (index.ts + Screen.tsx) — public 5 · fan 5 · creator 4 · admin 1 |
| Route files (`route.ts`) | **44** (41 under `/api/` + 3 non-API: manifest, fan manifest, auth/fan) |
| `components/` | **19** (12 shadcn ui + 6 naked fan-pwa + ServiceWorkerRegister) |
| Hooks | 1 |
| `lib/` | **24** (15 core incl. 3 adopted helpers + 6 mocks + 3 supabase) |
| Services | 4 |
| Types | 2 (index.ts 628 lines + contentTypes.ts 259) |
| Mock tables (`TableName`) | **29** (15 original + 14 new: 7 messaging + 3 team + 4 affiliates) |
| `old-code/` | **101** (56 root + 17 catalog + 1 integrations + 27 allScreens) |
| Docs | **4** living (`docs/`) + 3 maps at root (WIRING_PLAN, CODEBASE_AUDIT, this file) |
| Public | 6 files (sw.js + dashboard-manifest + favicon + 2 icons + mock-uploads) |
| Root configs | 7 (package.json, next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs, components.json, .env.example) + `src/proxy.ts` |
