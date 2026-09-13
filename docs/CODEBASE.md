# Codebase Structure & Walkthrough

> As-of: August 2026. Running in **mock mode** (`USE_MOCKS=true`). All external services are in-memory mocks. Phase F wiring is **nearly complete** — login, onboarding, forgot-password, My App (16 item types + device uploads), fan shell, messaging, dashboard overview, network, settings, search, admin, and all feature families are wired (WIRING_PLAN Sheets 6–12, 18–22 done). Landing page is the only unwired screen.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js App Router                        │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ PWA #1        │  │ PWA #2        │  │ PWA #3          │  │
│  │ Main Platform │  │ Creator       │  │ Fan Shell       │  │
│  │ /manifest.json│  │ Dashboard     │  │ /[username]     │  │
│  │               │  │ /dashboard/*  │  │                 │  │
│  │ Landing       │  │ Overview      │  │ Guest view OR   │  │
│  │ Login         │  │ My App       │  │ Fan app (4 tab) │  │
│  │ Onboarding    │  │ Network       │  └─────────────────┘  │
│  │               │  │ Admin         │                       │
│  │               │  └───────────────┘  ┌─────────────────┐  │
│  │               │                     │ /api/**         │  │
│  │               │                     │ REST routes     │  │
│  └───────────────┘                     └─────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              Mock System (USE_MOCKS=true)                ││
│  │  mockSupabaseClient.ts  mockDataStore.ts  mockPayments   ││
│  │  mockAI.ts              mockResend.ts                    ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Core idea

- **Creators** sign up, customize their PWA app (theme, bio, catalog), and get a public URL like `creatorbiotree.com/username`
- **Fans** visit that URL, install the PWA, sign up, view content, make purchases
- **Admin** manages all creators, sees platform-wide analytics

### Three installable PWAs

| PWA | URL | Who installs it |
|---|---|---|
| **Main Platform** (PWA #1) | `/manifest.json`, scope `/` | Anyone visiting |
| **Creator Dashboard** (PWA #2) | `/dashboard/manifest.json`, scope `/dashboard` | Creators managing their page |
| **Fan Shell** (PWA #3) | `/[username]/manifest.json`, scope `/[username]` | Fans of each creator |

---

## 2. src/ Folder — The Mall Analogy

Every folder in `src/` is a different part of a mall:

| Folder | Mall Analogy | What Goes In There |
|---|---|---|
| `src/app/` | **Mall blueprints + store layouts** | Every **route and page** (`/login`, `/dashboard`, `/search`). Also **plumbing** (API routes under `/api/`). |
| `src/components/` | **Pre-built store fixtures** (shelves, counters, signs) | Reusable UI pieces — buttons, sidebars, cards, filters. Subfolders group by *who uses them*. |
| `src/hooks/` | **Power tools** (drills, saws) | Reusable logic that multiple components can use. |
| `src/lib/` | **Utility closet** — wires, pipes, fuse box | Library code — mocks, DB clients, external services, helpers. |
| `src/services/` | **Back-office staff** (accounting, maintenance) | Business logic that's too big for a component but isn't an API route. |
| `src/styles/` | **Paint and wallpaper** | Global CSS — fonts, base colors, utility classes. |
| `src/types/` | **Blueprint legend** — defines what symbols mean | TypeScript type definitions. |
| `src/proxy.ts` | **Mall security guard** | Auth middleware — checks if you're logged in before letting you into certain areas. |

---

## 3. Complete Directory Structure

```
src/
├── app/                          # Next.js App Router pages & API routes — THIN pages only
│   ├── layout.tsx                # Root layout (HTML shell, SW register, themeColor)
│   ├── favicon.ico               # Platform favicon
│   ├── manifest.json/route.ts    # PWA #1 manifest
│   │
│   ├── (public)/                 # Outside the app, no sidebar
│   │   ├── page.tsx              # Landing "/" (stub — DEFERRED spec)
│   │   ├── login/                # /login (wired)
│   │   ├── onboarding/           # /onboarding (wired)
│   │   ├── forgot-password/      # /forgot-password (wired)
│   │   ├── offline/              # /offline
│   │   └── search/               # /search
│   │
│   ├── (creator)/dashboard/      # Creator Dashboard (PWA #2)
│   │   ├── layout.tsx            # Auth guard (no user → /login, no creator → /onboarding) + floating ChatInboxPopover
│   │   ├── page.tsx              # REDIRECT → /dashboard/overview
│   │   ├── overview/             # /dashboard/overview (wired)
│   │   ├── my-app/               # /dashboard/my-app (see + edit fan shell — WIRED)
│   │   ├── messages/             # /dashboard/messages (full chat screen — WIRED)
│   │   ├── network/              # /dashboard/network (wired)
│   │   └── settings/             # /dashboard/settings (wired)
│   │
│   ├── (fan)/[username]/         # Per-creator fan app (PWA #3) — WIRED
│   │   ├── page.tsx              # REDIRECT → ./guest
│   │   ├── guest/                # /{username}/guest (guest page)
│   │   ├── home/                 # /{username}/home
│   │   ├── content/              # /{username}/content
│   │   ├── connect/              # /{username}/connect
│   │   ├── settings/             # /{username}/settings
│   │   ├── partner/[partnerUsername]/  # partner content page (stub)
│   │   ├── app/                  # */app → redirect (legacy — deletion pending founder decision)
│   │   └── manifest.json/route.ts # Per-creator PWA manifest
│   │
│   ├── (admin)/admin/            # /admin — platform control room (wired, 5-tab panel)
│   │
│   └── api/                      # REST API routes (84 route files — 84 api + 2 manifests)
│       ├── admin/                # Platform admin APIs (RBAC)
│       ├── chat/                 # Messaging engine (12 routes — WIRED)
│       ├── creator/              # Creator CRUD, upload, catalog, my-app, fans, partners, team, affiliates, AI
│       ├── fan/                  # Fan auth, content, follow, purchases
│       ├── paypal/               # Mock PayPal checkout (v1 rail)
│       ├── push/                 # Push notification subscribe/send
│       ├── search/               # Creator search
│       ├── stripe/               # Stripe checkout, connect, webhooks (deferred Atlas reference)
│       └── webhooks/             # Paddle webhook
│   │
├── screens/                      # ⚠️ THE MIDDLEMAN — one folder per screen (index.ts barrel + Screen.tsx)
│   ├── public/                   # landing, login, onboarding, forgot-password, offline, search
│   ├── fan/                      # guest, home, content, connect, settings, partner-page
│   ├── creator/                  # overview, network, my-app, settings
│   └── admin/                    # admin
│                                 # (login/onboarding/forgot-password + fan screens + dashboard screens are wired; landing is deferred)
│
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui components (12 files)
│   ├── auth/                     # AuthCard, LoginForm, ForgotPasswordForm, OnboardingForm (wired)
│   ├── chat/                     # ChatShell.tsx — the whole messaging engine (wired)
│   ├── fan-pwa/                  # Fan app: shells, tabs, cards, guest page (wired — 20 files)
│   ├── my-app/                   # Editor: PhonePreview, DesignTab, ItemEditor, AddItemPicker, FileUploadField…
│   └── ServiceWorkerRegister.tsx  # SW registration
│
├── wiredLater/                   # ⚠️ SPECS ONLY — .md blueprints (read before anything else)
│   ├── wiredLater.md             # Index of ALL spec files (read this first)
│   ├── screens.md                # Walkthrough of every screen, grouped by category
│   ├── screens/                  # SCREENS — grouped by what they are
│   │   ├── creator-dashboard/     # The 4 major sidebar screens (overview, network, my-app, settings)
│   │   ├── admin/                 #   Platform owner + staff control room
│   │   ├── fan-shell/             #   What fans experience (/{username})
│   │   └── public/                #   Outside the app, no sidebar (landing, login, onboarding, offline)
│   ├── features/                 # FEATURES — cross-cutting: live AS tabs/sections inside the major screens
│   │                             #   (messaging, relationships, team, partnership, partner-page, search +
│   │                             #   merged My App editor-tab stubs: catalog-roadmap, funnel, integrations,
│   │                             #   email-campaigns, media-kit, affiliates)
│   ├── monetization/               # Money specs (split 2026-08-05): index + owner (platform) + creators (affiliates)
│   ├── ai/                         # AI assistant + AI agents specs
│   └── (catalog/, integrations/, email/, media-kit/, affiliates/ merged into features/ — 2026-08-05)
│
├── old-code/                     # ⚠️ PARTS ARCHIVE — old code, reference only (specs point here)
│   ├── allScreens/               # 27 old screen/API backups (page-old.tsx, *-old.tsx, *-route-old.ts)
│   ├── catalog/                  # 17 catalog item editors (CatalogManager, PricingEditor, CourseEditor…)
│   ├── integrations/             # Social scrape route backup
│   └── *.ts(x)                   # 56 reusable components/hooks (Sidebar, PhonePreview, useAutoSave…)
│
├── hooks/                        # Custom React hooks (6 live: useMediaQuery, useMyAppForm, useAutoSave, usePWAInstall, useFanSession, useCreatorSearch)
├── lib/                          # Libraries, utilities, and ALL mocks
│   ├── mocks/                    # Mock system (fake external services)
│   ├── supabase/                 # Supabase client variants
│   ├── api-utils.ts              # Shared API response helpers (adopted G6)
│   ├── api-error.ts              # Typed error classes (adopted G6)
│   ├── requireAuth.ts            # Auth guards (adopted G6)
│   ├── admin-permissions.ts      # Role permission helpers (live)
│   └── *.ts                      # Utilities (branding, fanSession, stripe, etc.)
│
├── services/                     # Business logic layer
├── styles/                       # Global CSS
├── types/                        # TypeScript type definitions
└── ServiceWorkerRegister.tsx     # Client-side SW registration
```

---

## 4. Entry Points & Routing

### Middleware (`proxy.ts`)

Auth middleware that runs on **every request**. Reads `mock_auth_uid` cookie (mock mode) or real Supabase session (production) and decides: "Is this person allowed in?"

### Route map

| URL | What it is | Auth required |
|---|---|---|
| `/` | Landing page (stub) | No |
| `/login` | Login page (wired) | No |
| `/onboarding` | New creator signup (wired) | No |
| `/forgot-password` | Creator forgot-password (wired) | No |
| `/dashboard` | REDIRECT → `/dashboard/overview` | Yes (creator/admin) |
| `/dashboard/overview` | Dashboard home (stats, activity, checklist) — **wired** | Yes (creator/admin) |
| `/dashboard/my-app` | See + edit your fan shell — full-screen, tap-to-edit (wired) | Yes (creator/admin) |
| `/dashboard/messages` | Full chat screen (wired) | Yes (creator/admin) |
| `/dashboard/network` | Partner management (Discover/Affiliates/My Peeps) — **wired** | Yes (creator/admin) |
| `/dashboard/settings` | Payout setup — **wired** | Yes (creator/admin) |
| `/admin` | Platform management (was `/dashboard/admin`) — **wired** (5-tab panel) | Yes (admin only) |
| `/search` | Creator search | No |
| `/[username]` | REDIRECT → `/{username}/guest` | No/fan session |
| `/{username}/guest` | Fan guest page (identical to fan view) | No |
| `/{username}/home` | Fan Home tab (activity hub) | Fan session |
| `/{username}/content` | Fan Content tab (catalog + gates) | Fan session |
| `/{username}/connect` | Fan Connect tab (partners + artist links) | Fan session |
| `/{username}/settings` | Fan Settings tab (account hub) | Fan session |
| `/{username}/app` | Legacy fan-app redirect (deletion pending) | Fan session |
| `/{username}/partner/[user]` | Partner preview | No |

---

## 5. API Routes

### 5.1 Creator API (`/api/creator/**`)

| Route | Method | Purpose |
|---|---|---|
| `check-username/` | GET | Check if username is available (rate-limited 20/min) |
| `activity/` | GET | Creator activity stats |
| `ai-summary/` | POST | Generate AI summary of bio (mocked) |
| `my-app/ai/` | POST | AI prompt for theme/branding (mocked) |
| `register/` | POST | Onboarding: set Link Address + display name on the mock-created row |
| `forgot-password/` | POST | Anonymous reset email (no enumeration, 3/min) |
| `my-app/` | GET/PUT | Read + deploy the fan app (branding, theme, items, links) |
| `my-app/icon/` | POST | App icon upload |
| `catalog/` | GET/POST | List/create catalog items |
| `catalog/[itemId]/` | GET/PATCH/DELETE | Single item CRUD (variants, booking slots, lessons, scheduling…) |
| `catalog/[itemId]/modules/` | GET/POST | Course modules |
| `catalog/[itemId]/modules/[moduleId]/` | GET/PATCH/DELETE | Single module CRUD |
| `catalog/[itemId]/modules/[moduleId]/lessons/` | GET/POST | List/create lessons |
| `catalog/[itemId]/lessons/` | GET | Bulk fetch all lessons |
| `fans/list/` | GET | List your fans |
| `fans/[id]/` | GET | Single fan profile |
| `fans/export/` | GET | Export fans as CSV |
| `relationships/` | GET | My Peeps umbrella data |
| `partners/*` | — | 6 routes: billboard, discoverable, invite, onboarding, request, respond |
| `team/*` | — | 8 routes: members, invites, accept, activity, contexts |
| `affiliates/*` | — | 9 routes: deals, links, discover, earnings |
| `pageview/` | POST | Record a page view (rate-limited 5/IP/min, silent 200) |
| `social/scrape/` | POST | Scrape social media metadata (removed — did not exist) |
| `upload/` | POST | Upload file to storage (50MB cap, per-type MIME validation, mock storage → `public/mock-uploads/`) |

> ⚠️ **Removed at wiring prep (2026-08-07):** `content/upload/` (duplicate of `upload`), `api/fan/session` (stale CSV dup). The old `partners/*` archive is superseded by the current stubs (rebuilt from `partnership.md` during Phase F).

### 5.1b Chat API (`/api/chat/**`) — WIRED (Sheet 12)

| Route | Method | Purpose |
|---|---|---|
| `conversations/` | GET/POST | List conversations (unread) / find-or-create direct + create group (creators only) |
| `conversations/[id]/` | GET/PATCH | Thread + messages / rename, pin, announcements toggle |
| `conversations/[id]/messages/` | GET/POST | List messages / send (announcements-only rule + block check both directions) |
| `conversations/[id]/read/` | POST | Mark thread read |
| `conversations/[id]/members/` | GET/DELETE | Members / leave or remove (body `{ member_key }`) |
| `messages/[id]/` | PATCH/DELETE | Edit / delete (tombstones + `edited_at`) |
| `requests/` | GET/POST | List requests / approve + ignore (approve delivers the queued first message) |
| `block/` · `blocks/` | POST/GET | Block a user / list blocked |
| `unread/` | GET | Unread count for the floating badge |
| `preferences/` | GET/POST | Allow-anyone toggle |
| `upload/` | POST | Chat attachments (≤8MB, 10/min, `chat-attachments` bucket) |

### 5.2 Fan API (`/api/fan/**`)

| Route | Method | Purpose |
|---|---|---|
| `register/` | POST | Fan signup (email + password) |
| `login/` | POST | Fan login |
| `forgot-password/` | POST | Anonymous reset email (3/min) |
| `reset-password/` | POST | Set password with reset token |
| `follow/` | POST | Follow a creator (rate-limited 10/min) |
| `follow-creator/` | POST | Guest email-only follow → no-password Follower row + `fan_session` cookie |
| `logout/` | POST | Clear the fan session |
| `purchases/` | GET | Receipts for the session email |
| `purchases/complete/` | POST | Idempotent mock checkout webhook (email-keyed receipts) |
| `install/` | POST | Record PWA installation (rate-limited 10/min) |
| `content/list/` | GET | List creator's published content |
| `content/access/` | GET | Check if fan can access an item |
| `content/[id]/comments/` | GET/POST | Comments on content |
| `content/[id]/reactions/` | GET/POST | Reactions on content |
| `dashboard/` | GET | Fan's personal dashboard |

### 5.3 Admin API (`/api/admin/**`)

| Route | Method | Purpose |
|---|---|---|
| `creators/` | GET | List all creators |
| `creators/[id]/` | PATCH | Update creator |
| `creators/[id]/fans/` | GET | List fans for a creator |
| `stats/` | GET | Platform-wide stats |

### 5.4 Payment APIs

| Route | Method | Purpose |
|---|---|---|
| `paypal/checkout/` | POST | **v1 rail (mock)** — checkout session, success → `?payment=success` (PayPal-first, 2026-08-10) |
| `stripe/checkout/` | POST | Create Stripe Checkout session (mocked) — **deferred Atlas reference since 2026-08-10** (`monetization/creators.md` Part 1b) |
| `stripe/connect/` | POST | Stripe Connect onboarding link |
| `stripe/webhook/` | POST | Stripe webhook handler (mocked) |
| `webhooks/paddle/` | POST | Paddle webhook handler (mocked — Flow-3 processor) |

### 5.5 Push Notifications

| Route | Method | Purpose |
|---|---|---|
| `push/subscribe/` | POST | Save push subscription |
| `push/send/` | POST | Send push to all subscribers (mocked — no-op send) |

### 5.6 Auth

> ⚠️ **2026-08-08:** the fan magic-link flow was removed (founder decision — fans use email + password only). The `auth/fan` landing and `/api/fan/magic-link` route were deleted. Fan auth family: register · login · forgot-password · reset-password.

---

## 6. Components (`src/components/`)

> **Phase F wiring is in progress** — the parts archive `src/old-code/` is reference-only; specs in `src/wiredLater/` (index: `wiredLater.md`). Live component families: `ui/` (shadcn), `auth/`, `chat/`, `fan-pwa/`, `my-app/`.

### 6.1 ui/ — shadcn UI Primitives (12 files — LIVE)

Button, Input, Textarea, Select, Switch, Sonner (toast), Tooltip, Avatar, Card, Badge, Dialog, Tabs. Generated by `npx shadcn`. Some have been edited with custom props (`styleColor`, `styleTextColor`, `error`, `label`, `onChange` alias).

### 6.2 auth/ — Login & Onboarding (WIRED, Sheets 6-7)

`AuthCard` (centered wrapper), `LoginForm` (`?next=` redirect, root-cause error copy, mock-only social buttons, mock auto-signup fallback), `ForgotPasswordForm`, `OnboardingForm` (Link Address availability + permanence dialog).

### 6.3 chat/ — ChatShell.tsx (WIRED, Sheet 12)

Single-file messaging engine per messaging.md: `useChat` (6s polling), `useUnreadBadge`, `ChatInboxPopover` (floating 💬), `ChatShell`, `ChatThread`, `MessageList`, `MessageBubble`, `MessageComposer`, `AttachmentPreview`, `ChatIcon`, `GuestContactModal`. Neutral platform styling — never creator-themed.

### 6.4 fan-pwa/ — Fan App (WIRED, Sheet 21-V1, 20 files)

| File | Purpose |
|---|---|
| `GuestPageContent` | 3-layer guest view (Header → Spotlight → Catalog) + Follow gate + `?payment=success` handoff |
| `PublicCreatorPage` | Guest wrapper (server) |
| `FanAppShell` | Authenticated app — bottom nav + 4 tabs |
| `FanHomeTab` / `FanContentTab` / `FanConnectTab` / `FanSettingsTab` | The 4 tabs |
| `ItemCards` | Per-type item cards (all 16 types) + CheckoutModal + newsletter/tip-jar inline |
| `FollowBox` | Email-only follow |
| `FanAuthModal` | Set-password / login modal (auto-switches to forgot-password on "no password set") |
| `FanBottomNav` | 4-tab nav, accent dot, uniform stroke widths |
| `CreatorHeader`, `PageViewTracker`, `PoweredByFooter`, `InstallBanner`, `IOSInstallGuide`, `InAppBrowserWarning`, `UpdateToast` | Shell chrome |
| `fanData.ts` | `FanShellData`/`FanIdentity`/`ItemGate` + `computeItemGate` (three gates) + `isScheduledVisible` |
| `themeStyles.ts` | Theme-aware button/card styles (contrast-aware text) |

Server-side resolver: `src/lib/fanShellData.ts` (creator → branding → items → fan_session identity → purchases). The no-password render rule (Follower/visitor → `/guest`) is enforced there.

### 6.5 my-app/ — My App Editor (WIRED, Sheet 19-V1)

`PhonePreview` (full phone frame, real fan components via `previewData.ts`), `ElementPopover` (tap-to-edit), `PreviewStateToggle` (Draft/Live + orange dot + Deploy), editor sheet Option A (`IdentityTab`/`DesignTab`/`CatalogTab`/`ArtistLinksTab`; Integrations/Email/MediaKit/Spotlight = "soon"), `catalog/` — `AddItemPicker` (3 sections: Upload from your device / Links / Everything else), `ItemEditor` (per-type + `PricingEditor` + scheduling + external-link quarantine), `FileUploadField` (device uploads → `/api/creator/upload`).

### 6.6 Parts archive (all in `src/old-code/` — old code, reference only)

- **root:** Sidebar, SidebarContent, PhonePreview, MyAppInfoBanner, GlobalSettingsEditor, BottomEditor, AppIdentityEditor, CreatorManagementWidgets, FanStatsCard, AnalyticsWidgets, CreatorSearchInput, CreatorCard, StripeConnectPanel, HelpButton, CreatorHeader, FanAuthModal, FanBottomNav, GuestPageContent, LandingPage, LandingPWA, PageViewTracker, FollowButton, PoweredByFooter, InstallBanner, InstallButton, IOSInstallGuide, InAppBrowserWarning, UpdateToast, LandingHeader, HeroSection, FeaturesSection, TestimonialsSection, DemoSection, CTASection, Footer, AuthCard, LoginForm, OnboardingForm, PartnerOnboarding, CreatorResultCard, DiscoverCreators, SocialLinks, LoadingSpinner, EmptyState, ErrorBoundary, useCreatorSearch, search-utils, DashboardTimeline, useMyAppForm, useAutoSave, usePWAInstall
- **catalog/:** CatalogManager, AddItemPicker, PricingEditor, CoverUploader, CountdownField, FileEditor, LinkEditor, SessionEditor, LiveEditor, MessagingEditor, MembershipEditor, PhysicalEditor, ProductEditor, CourseEditor, TipJarEditor, BundleEditor, NewsletterEditor
- **allScreens/:** 27 old screen/API backups — `allScreens/<name>/page-old.tsx` (pre-skeleton page versions), `*-old.tsx` (components), `allScreens/network/api/*-route-old.ts` (API routes)
- **integrations/:** social-scrape-route-old.ts (unwired — live returns 503)

> 📤 **Adopted into live code (2026-08-07):** `api-error.ts`, `api-utils.ts`, `requireAuth.ts` → now live in `src/lib/` (G6 — use them in new routes instead of inline `NextResponse.json`).
> 📤 **Promoted to live (Phase F, 2026-08-10→):** AuthCard, LoginForm, OnboardingForm, ForgotPasswordForm, useMyAppForm, useAutoSave, usePWAInstall, PhonePreview, UpdateToast, CreatorHeader, GuestPageContent, FanAuthModal, FanBottomNav, PageViewTracker — see their wired homes above. Archive copies remain as reference.

### 6.7 Spec files (blueprints — `src/wiredLater/`, specs ONLY)

Grouped by category (founder decision 2026-08-05). Read `wiredLater.md` first — it is the full index.

**Screens** (grouped by what they are):
| Spec | What it covers |
|---|---|
| `screens/creator-dashboard/my-app/my-app.md` | My App (formerly "Playground") — MEGA: full-screen shell, tap-to-edit brand popovers, 8 editor tabs, fan 3-layer display, free/pro tiers, build priority |
| `screens/creator-dashboard/network/network.md` | Network search, billboard, collabs, affiliates |
| `screens/creator-dashboard/overview/overview.md` | Dashboard Overview — stats, activity, quick actions |
| `screens/creator-dashboard/settings/settings.md` | Dashboard Settings — money, identity, permissions |
| `screens/admin/admin.md` | Founder setup, RBAC, audit log, staff invites |
| `screens/fan-shell/fan-shell.md` | Fan shell — account model (4 layers), three gates, guest vs fan views, 4 tabs, auth |
| `screens/public/landing.md` | Landing page (deferred) |
| `screens/public/login.md` | Login |
| `screens/public/onboarding.md` | Onboarding (deferred, signup only) |
| `screens/public/offline.md` | Offline App Shell + local-first sync |
| `screens.md` | Walkthrough of every screen, grouped by the same categories |

**Features** (cross-cutting — live inside the screens above, NOT sidebar screens):
| Spec | What it covers |
|---|---|
| `features/messaging.md` | FREE chat — floating inbox both sides, 1-on-1s, requests/block, groups + announcements, Community (Part 3) |
| `features/relationships.md` | **"My Peeps"** — umbrella hub (Partners/Fans/Staffs rows), fan list + profile drawer + consent. Wiring home: Network right rail |
| `features/team.md` | Creator staff access — permission toggles, audit log. Wiring home: My Peeps → Staffs row |
| `features/partnership.md` | Outside-app invite flow (`?invite=CODE`). Wiring home: My Peeps → Partners row |
| `features/partner-page.md` | Fan-only partner modal (Connect tab) |
| `features/search.md` | Search — `/search` page + landing + Network placements |
| `features/catalog-roadmap.md`, `funnel.md`, `integrations.md`, `email-campaigns.md`, `media-kit.md`, `affiliates.md` | Merged My App/Network-tab stubs (reference only) |

**Other:** `monetization/index.md` + `owner.md` + `creators.md` (money specs — split 2026-08-05) · `ai/ai-features.md` + `ai/ai-agents.md` (post-launch)

---

## 7. Hooks (`src/hooks/`)

| Hook | Purpose |
|---|---|
| `useMediaQuery` | Reactive `matchMedia` wrapper |
| `useMyAppForm` | My App draft buffer (`my-app_draft_${creatorId}`, 3s debounce) + deploy + hasChanges |
| `useAutoSave` | Debounced save helper used by `useMyAppForm` |
| `usePWAInstall` | Install state / triggerInstall / dismiss |
| `useFanSession` | Fan session helpers |
| `useCreatorSearch` | Creator search hook |

---

## 8. Lib (`src/lib/`)

### 8.1 mocks/ — The Mock System

The **entire local development infrastructure**. When `USE_MOCKS=true`, all external services are replaced with in-memory equivalents.

| File | What it mocks | How it works |
|---|---|---|
| `useMocks.ts` | The `USE_MOCKS` flag | Reads env — single source of truth |
| `mockDataStore.ts` | In-memory database | All 30 tables in `globalThis` Map. Seeds: test creator + admin auto-provision (see proxy.ts). |
| `mockSupabaseClient.ts` | Supabase client | Intercepts all `from().select().eq()` calls. Includes RPC handlers + `seedMockAdmin()` / `seedMockTestCreator()`; cookie-authoritative auth (no cookie → session reset — fix 2026-08-17). |
| `mockPayments.ts` | PayPal + Stripe + Paddle | Mock checkout sessions (PayPal v1 rail), payment intents, connect accounts |
| `mockAI.ts` | Groq AI | Canned summaries + palettes instead of real AI |
| `mockResend.ts` | Resend email | Logs emails to console + `temp_emails.log` |

**How the mock switch works:** Each library file checks `USE_MOCKS` and returns mock data if true.

### 8.2 supabase/ — Supabase Client Variants

| File | Purpose |
|---|---|
| `server.ts` | Server client — uses `cookies()` for session-based auth |
| `admin.ts` | Service role client (bypasses RLS) — for server-side ops |
| `client.ts` | Browser client — uses `localStorage` for session |

All three check `USE_MOCKS` and return the mock client when enabled.

### 8.3 Other Utilities

| File | Purpose |
|---|---|
| `branding.ts` | Resolves creator brand settings (colors, fonts, icon). Exports `BRAND_PRESETS` (9) + `presetById()`. |
| `themePresets.ts` | My App design preset definitions |
| `fanSession.ts` | Fan auth system: reads `fan_session` cookie → looks up token in DB |
| `fanShellData.ts` | Server resolver for the fan shell (creator → branding → items → identity → purchases) |
| `previewData.ts` | My App phone-preview data (creator data → fan components) |
| `chat.ts` | Messaging helpers: chat identity, participant names, block checks, prefs, existing conversations |
| `search-utils.ts` | Creator search utilities |
| `stripe.ts` | Stripe SDK wrapper — checks USE_MOCKS first (deferred Atlas reference) |
| `paddle.ts` | Paddle SDK wrapper for subscriptions |
| `email.ts` | Resend email sender — checks USE_MOCKS first |
| `queue.ts` | Background job queue for async tasks |
| `rate-limiter.ts` | Rate limiting for API routes (InMemory mock; Upstash for production) |
| `vapid.ts` | Converts VAPID keys for browser Push API |
| `colorExtraction.ts` | Extracts color palettes from images |
| `urls.ts` | URL helpers (creator page URLs, absolute URLs) |
| `utils.ts` | `cn()` helper for Tailwind class merging |

---

## 9. Services (`src/services/`)

Services sit between API routes and Supabase. They contain reusable business logic.

| Service | Methods | Purpose |
|---|---|---|
| `creatorService` | `getByUsername()`, `getById()` | Look up creators (throws on error and not-found) |
| `contentService` | `getForCreator()`, `getAllForCreator()`, `getById()`, `save()`, `delete()` | Full CRUD for content items |
| `fanService` | `getDashboardData()`, `trackInstall()` | Fan dashboard + install tracking |
| `profileUpdateService` | `updateProfile()` | Safe profile field updater (whitelisted fields, throws on error) |

> ⚠️ `partnershipService` moved to the archive (`src/old-code/partnershipService-old.ts`) — rebuilt from `features/partnership.md` during Phase F.

---

## 10. Types (`src/types/`)

| File | What it contains |
|---|---|
| `index.ts` | All domain types: Creator, ContentItem, FanAccount, Partnership, PageView, API helpers + messaging/team/affiliate/relationships types (added 2026-08-07) |
| `contentTypes.ts` | Content type definitions, Zod schemas, type registries |

---

## 11. Styles (`src/styles/`)

| File | What it is |
|---|---|
| `globals.css` | Global CSS — Tailwind directives, base colors, utility classes, fonts |

---

## 12. How Everything Connects

```
Browser (React components)
    │  fetch("/api/...")
    ▼
API Routes (Next.js)
    │  validate with Zod, call services
    ▼
Services (business logic)
    │  call supabase client
    ▼
Supabase (mockSupabaseClient or real Supabase)
    │
    ▼
mockDataStore.ts (in-memory Map)
    or real Supabase database
```

### Data Flow Diagram

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Components  │───→│  API Routes  │───→│   Services   │
│  (React)     │    │  (Next.js)   │    │  (logic)     │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                                │
                                          ┌─────▼──────┐
                                          │  Supabase   │
                                          │  (mock/real)│
                                          └─────┬──────┘
                                                │
                                     ┌──────────▼──────────┐
                                     │   mockDataStore.ts   │
                                     │   (in-memory Map)    │
                                     │   or real Supabase   │
                                     └─────────────────────┘
```

- **Components**: The UI. Call `fetch()` to hit API routes.
- **API Routes**: The waiters. Receive HTTP requests, validate input with Zod, call services.
- **Services**: The chefs. Business logic (look up creator, save content, strip system fields).
- **Supabase**: The pantry. Mock (in-memory) or real database.
- **mockDataStore.ts**: The mock pantry. In-memory Map on `globalThis`.

---

## 13. Request Flows

### Auth Flow (Mock Mode)

```
Browser visits /dashboard
    ↓
proxy.ts reads mock_auth_uid cookie
    ↓
No cookie + mock mode → AUTO-PROVISION the test creator
    (seedMockTestCreator: test@creatorpwa.app, Link Address "test",
     cookie set on request AND response — 1h)
    ↓
Dashboard layout calls supabase.auth.getUser()
    ↓
Mock client returns user based on mock_auth_uid cookie
    ↓
Layout loads creator profile from mockDataStore
    ↓
Wired pages render (My App editor, Messages; floating chat inbox everywhere)
```

> ⚠️ **Remove the auto-provision block in `src/proxy.ts` before real-mode migration** (WIRING_PLAN.md Sheet 6 warning). `/admin*` auto-provisions the seeded admin instead.

### Fan Session Flow

```
Fan visits /[username] for the first time
    ↓
No fan_session cookie → shows PublicCreatorPage (guest view)
    ↓
Fan clicks "Sign up" → FanAuthModal → POST /api/fan/register
    ↓
Mock creates fan_accounts + fan_sessions rows
    ↓
Sets fan_session cookie (opaque token, 365 days)
    ↓
Page reloads → FanAppShell renders (authenticated view)
```

---

## 14. Current State & What's Left

**Phase: Phase F wiring NEARLY COMPLETE** — Sheets 6–12, 18–22 done; landing page (Sheet 23) is the only unwired screen (map: `WIRING_PLAN.md`, repo root).

### History (July → August 2026)

- All old screens backed up to `src/old-code/allScreens/<name>/page-old.tsx`; every page became a naked skeleton
- All 101 code files moved out of `wiredLater/` to `src/old-code/` (parts archive) — `wiredLater/` is now specs only (index: `wiredLater.md`)
- Specs written for every screen (my-app → formerly Playground, network, admin, landing, screens index)
- Social scrape route removed (did not exist)
- **A1/A1.5/A2 restructure (2026-08-07):** `src/app/` became a thin address book — route groups `(public)/`, `(fan)/[username]/`, `(creator)/dashboard/`, `(admin)/admin/` — and a new `src/screens/` middleman was created (17 screen folders, one `index.ts` + `Screen.tsx` each). Every page.tsx is a 2-line re-export. Planning + audit docs at repo root: `WIRING_PLAN.md`, `CODEBASE_AUDIT.md`, `CODEBASE_INVENTORY.md`.
- **Foundation prep (2026-08-07):** adopted `api-utils`/`api-error`/`requireAuth` into `src/lib/`; added messaging/team/affiliate types + 14 mock tables + 9 brand presets; killed 5 dead files; added 5 missing rate limits.
- **Wiring (2026-08-10 → 2026-08-31):** Sheets 6-7 (login/onboarding/forgot-password), Sheet 19-V1 (My App — 16 item types + device uploads), Sheet 21-V1 (fan shell + mock PayPal checkout), Sheet 12 (messaging engine — 12 routes + ChatShell), Sheets 8-11 + 13-16 + 18 + 20 + 22 (admin, settings, overview, search, partnerships, relationships, team, affiliates, network, partner page, offline — all wired 2026-08-30). 18 API routes rewritten from mock store to Supabase clients. Dead code removed (Stripe, Paddle, playground/ai, ai-summary, unused deps).

### What's LIVE vs EXTRACTED

| Area | Live | Extracted (old-code parts archive) |
|---|---|---|
| Pages | login, onboarding, forgot-password, my-app, messages, fan shell (6 tabs), overview, network, settings, search, admin, dashboard layout + chat popover | `allScreens/<name>/page-backup.tsx` backups |
| UI primitives | `components/ui/` (12 shadcn) | — |
| Fan shell | `components/fan-pwa/` (20 files — full implementation) | Pre-wiring versions |
| My App editor | `components/my-app/` (PhonePreview, DesignTab, editors, FileUploadField…) + hooks | Old playground versions |
| Messaging | `components/chat/ChatShell.tsx` + `lib/chat.ts` + 12 routes | — (wired fresh from spec) |
| Catalog | CRUD + my-app + upload routes; 16 editors live in `catalog/` | 17 old editors + manager |
| Hooks | 6 live (useMediaQuery, useMyAppForm, useAutoSave, usePWAInstall, useFanSession, useCreatorSearch) | Archive copies |
| Admin RBAC | Roles, permissions, API routes, `admin-permissions.ts` + 5-tab admin UI | — |
| API helpers (G6) | `src/lib/api-utils.ts`, `api-error.ts`, `requireAuth.ts` (adopted) | — |
| External services | All mocked | `docs/EXTERNAL_SERVICES.md` = the migration checklist |

### Deferred items (LATER)

| Item | Notes |
|---|---|
| Main platform demos/tabs | Stanstore-like enhancements |
| Creator dashboard PWA polish | 64x64 icon, splash screen, iOS meta tags |
| Seed data rebuild | User will create when ready |
| Migration readiness | Flip `USE_MOCKS=false`, add real keys |
| AI agent workforce | Sticky note spec only (`ai/ai-agents.md`) |

---

## 15. Migration Readiness

When ready to migrate from mock to real:

1. Change `USE_MOCKS=false` in `.env.local`
2. Add real Supabase URL + anon key
3. Run the database migrations to create tables
4. Add real API keys for PayPal (v1 rail), Resend, Groq, Paddle
5. The mock files stay as reference — don't delete them

See `HOW_IT_WORKS.md` sections 11-14 for the full Mock-as-Draft Philosophy, Mock ↔ Production Mapping table, and Migration Recipe. The external-service migration checklist lives in `docs/EXTERNAL_SERVICES.md`.
