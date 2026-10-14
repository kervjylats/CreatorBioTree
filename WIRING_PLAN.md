# CreatorBioTree — Wiring Plan (Phase F)

> **What this is:** the per-file, spec-first blueprint for wiring every screen + feature, one at a time. Each block is a **connection map** — what your hands touch (entry, components, hooks, API routes, lib, services, tables, old-code patterns, dependencies) when we wire that screen. No code lives here; this is the map you read before we open the editor.
>
> **The rule (AGENTS.md):** we wire from the `src/wiredLater/` spec ONLY. Old code is opened only where a sheet says "see old-code for the pattern." After EVERY wired piece: `npm run typecheck` + `npm run lint` + `python scripts/check-docs.py` must stay green.
>
> **When (the phase gate):** this plan executes in ONE pass at the very END — **Phase F** (docs/archive/ROADMAP.md), after EVERY spec is written AND approved. Nothing in these sheets gets wired before that. "Go on sheet N" means the final wiring pass has started.
>
> **Status legend:**
> - `LIVE` — already working, keep as-is
> - `EXTEND` — exists, add fields/logic per spec
> - `NEW` — spec'd, must be created
> - `ADOPT` — exists in `src/old-code/`, promote into live `src/` (G6)
> - `PROMOTE` — exists in `src/old-code/`, rebuild from it into the screen
> - `MERGE` — consolidate duplicates
> - `DELETE` — dead/stale
> - `DEFERRED` — spec says post-launch, skip in Phase F
>
> **Plan date (authored):** 2026-08-07 (after A1 / A1.5-strict / A2 skeleton; `src/app/` address book + `src/screens/` middleman live).

---

## How to use this

1. **Always wire in this order.** Each sheet's `DEPENDS ON` lists sheets that must be done first.
2. **One sheet = one unit of work.** When you say "go" on sheet N, I read the spec, wire it, run the three checks, report back.
3. **Every screen = thin `page.tsx` → `src/screens/.../Screen.tsx`.** The middleman folder holds the real code. Components/UI it needs live in `src/components/` (shared) or inside the screen folder (local).
4. **Stay inside the sheet.** Don't wire things another sheet owns (e.g. don't build `affiliate` tables while wiring Overview).

---

## Check 0 — Skill builders: verify dependencies to the man

> **🔀 REORDERED 2026-08-11 (founder decision — test-first):** the original end-to-end
> order (8→23) is REPLACED by the **data-producer-first** order. The control-room screens
> (Admin 8, Settings 9, Overview 10) and the network feature family (11–16, 18, 20) read
> data produced elsewhere; Playground (19) and Fan Shell (21) PRODUCE that data and give the
> founder something to click today. New execution order:
>
> 1. **Playground (Sheet 19) — V1 CORE slice** (Phase 1 scope: phone shell, PreviewStateToggle,
>    ElementPopover, editor sheet Option A w/ Identity+Design+Catalog+Artist-Links live,
>    catalog **7 core types**, auto-save + Deploy)
> 2. **Fan Shell (Sheet 21) — V1 CORE slice** (guest 3-layer view, email-only follow,
>    three gates, mock PayPal checkout, 4-tab shell, install)
> 3. **Then, in original order:** 8 Admin → 9 Settings → 10 Overview → 11 Search →
>    12 Messaging → 13–16 features → 18 Network → 20 Partner page → 22 Offline → 23 Landing.
>
> Every deferred item stays tracked in its sheet below — wiring is additive, nothing is
> lost. The v1-core cuts are marked `DEFERRED (v1)`.

| Order | Unit (sheet) | Steps |
|---|---|---|
| 1 | `api-utils.ts` + `api-error.ts` + `requireAuth.ts` → `src/lib/` | ADOPT (G6) 3 helper files |
| 2 | `types/index.ts` — rename `Playground*`→`Playground*` + add feature/column types | EXTEND |
| 3 | `lib/branding.ts` — 7 missing presets + Part 9 fields | EXTEND |
| 4 | `mockDataStore.ts` + `mockSupabaseClient.ts` — 14 new tables + RPCs | EXTEND |
| 5 | Delete dead files + add missing rate limits (G7) + `pageview` → singleton | housekeeping |
| **6** | **Login** `/login` | screen — ✅ done 2026-08-10 |
| **7** | **Onboarding** `/onboarding` | screen — ✅ done 2026-08-10 |
| **19-V1** | **Playground** `/dashboard/playground` — **V1 CORE** (reordered 2026-08-11) | screen — ✅ done 2026-08-11 (editor Option A; B/C/D deferred) · ✅ **ALL 16 CATALOG TYPES wired 2026-08-13 (Stage A of the Connected Loop Pass):** AddItemPicker + ItemEditor per-type sections (course lessons, session booking slots, membership benefits + billing cycle, physical/product variants + stock, bundle picker, live platform/stream, page body) + fan cards render every type with gates (memberships now check out; purchased-before-member gate fix) + PATCH schema gains `variants`/`booking_slots`. Verified end-to-end via curl (create → rich PATCH → fan-page render → delete). · **NOTE (2026-08-13):** real-mode must ENFORCE the 7-day lock server-side for App Name + App Icon + Display Name (specced in `features/branding.md` Part 9 — currently UI-note only, never enforced) |
| **21-V1** | **Fan shell** — Guest · Home · Content · Connect · Settings — **FULLY WIRED** | screens — ✅ done 2026-08-11 (v1 core) · ✅ **Fan shell full spec pass 2026-08-31:** Home tab rebuilt as 7-section activity hub (Spotlight, New from creator, Updates from partners, Community section, Your activity, Upcoming, Announcements) · Community fan UI wired (Home section + guest "Join the community" card + Connect community card) · Connect tab completed (All Partners + Followed two-column layout, deal-weighted billboard rotation, Artist Links) · Partner bottom modal (PartnerModal) replacing full-page navigation, follow toggle persisted to `fan_follows` · Settings completed (Subscription card, 4 notification toggles, payment methods stub) · `fan_follows` table added to mock store |
| **8** | **Admin** `/admin` | screen — ✅ done 2026-08-30 |
| **9** | **Settings** `/dashboard/settings` | screen — ✅ done 2026-08-30 |
| **10** | **Overview** `/dashboard` | screen — ✅ done 2026-08-30 · moved from `/dashboard/overview` 2026-09-30 (one canonical link; old URL is a signpost) |
| **11** | **Search** `/search` | screen — ✅ done 2026-08-30 · ❌ **page removed 2026-09-28** (Network hub Discover is the search home; `GET /api/discover/creators` stays) |
| **12** | **Messaging** — `MessagesShell` + 12 routes + 7 tables | feature — ✅ done 2026-08-17 (engine + inbox) · ✅ **Part 3 Community wired 2026-08-31** (fan Home section + guest CTA + Connect card + channels + join/leave) |
| **13** | **Partnerships** — 2 routes + invite card + `source` column | feature — ✅ done 2026-08-30 |
| **14** | **Relationships / My Peeps** — 3 routes + 3 fan_accounts cols | feature — ✅ done 2026-08-30 |
| **15** | **Staff** — 8 routes + 3 tables | feature — ✅ done 2026-08-30 |
| **16** | **Affiliates** — 7 routes + 4 tables + `content_items` cols | feature — ✅ done 2026-08-30 |
| **17** | **Branding utilities** — shared components (PreviewStateToggle, brand presets applied) | feature — 🔄 partial: PreviewStateToggle + ElementPopover shipped in 19-V1; preset application follows 19-B/20 |
| **18** | **Network** `/dashboard/network` — hosts 13–16 + search | screen — ✅ done 2026-08-30 |
| **20** | **Partner-page** `/[username]/partner/[partnerUsername]` | screen — ✅ done 2026-08-30 · ✅ **Partner modal added 2026-08-31** (bottom-sheet `PartnerModal` in Connect tab + standalone page fallback) |
| **22** | **Offline** `/offline` | screen — ✅ done 2026-08-30 |
| **23** | **Landing** `/` | DEFERRED (keep naked) |

---

## SHEET 01 — Foundation: API helpers (G6)

> **Goal:** stop hand-rolling `NextResponse.json` + inline auth in every route. 3 small helpers leave `src/old-code/` and become shared `src/lib/` code.

```
UNIT 1 · FOUNDATION — adopt shared route helpers (G6)
────────────────────────────────────────────────────────
ADOPT       src/old-code/api-utils.ts     → src/lib/api-utils.ts
            src/old-code/api-error.ts     → src/lib/api-error.ts
            src/old-code/requireAuth.ts   → src/lib/requireAuth.ts
EXPORTS     api-utils: ok() · fail() · wrapHandler() (NotFoundError → 404, else 500)
            api-error: NotFoundError + typed error classes
            requireAuth: requireAuth() → user or 401 · requireAdmin() → admin or 403
APPLY TO    all EXISTING API routes as we touch them (Step 3+), NOT step 1
OLD-CODE    the 3 files themselves (no other spec refs)
DEPENDS ON  none
CHECK       typecheck + lint + check-docs green
```

---

## SHEET 2 — Types (foundation)

> **Purpose:** the codebase's single source of truth. Fix the drift the specs flagged: the types were renamed `Playground*` in the specs but the live code still says `Playground*`. Also sponsor all new feature types so later sheets can reference them.

| Action | Change |
|---|---|
| ~~`RENAME`~~ ✅ | `PlaygroundTheme` → `PlaygroundTheme`; `PlaygroundColors` → `PlaygroundColors`; `PlaygroundProfile` → `PlaygroundProfile` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | messaging types: `Conversation`, `ConversationMember`, `Message`, `MessageAttachment`, `MessageRequest`, `BlockedUser`, `CommunityChannel` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | staff types: `StaffMember`, `StaffInvite`, `StaffActivity` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | affiliate types: `AffiliateDeal` (deal_type/scope/trigger/rate/status), `AffiliateAttribution`, `AffiliateConversion`, `AffiliateLink` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | relationships: `FanAccount` + `do_not_contact`/`notes`; `Partnership` + `source` (`invited`/`collab`); `FanProfile` — **done 2026-08-07** |
| ~~`EXTEND`~~ ✅ | `Creator` → `tagline`, `collab_style` (network.md); `connect_empty_text` (branding.md Part 9 #5) — **done 2026-08-07** |
| ~~`EXTEND`~~ ✅ | `ContentItem` → `affiliate_enabled`, `scheduled_publish_at`, `scheduled_unpublish_at` (affiliate_rate already existed) — **done 2026-08-07** |
| `ADD` | `theme_presets` type (if using standalone `themePresets.ts`) — decide at wiring |
| SPEC | branding.md · network.md · relationships.md · staff.md · partnership.md · playground.md · monetization/creators.md |
| DEPENDS ON | none |

---

## SHEET 3 — Branding resolver (foundation)

> **Purpose:** `resolveBranding()` is already live and is the single source of truth (G16). Now it knows about the 9 preset designs (copied from the old editor) and every new brand field.

| Action | Change |
|---|---|
| ~~`EXTEND`~~ ✅ | `src/lib/branding.ts` — add the 9 missing presets from `old-code/GlobalSettingsEditor.tsx` lines 14–22 — **done 2026-08-07** (`BRAND_PRESETS` + `presetById()`) |
| ~~`EXTEND`~~ ✅ | Part 9 fields: `custom_theme` override → preset → default chain + `connect_empty_text`, `buttonStyle`, `borderRadius`, `backgroundCSS`, `backgroundOpacity`, `aiSummary` — **done 2026-08-07** |
| `KEEP` | resolve order: override (`custom_theme`) → preset (`theme_id`) → default |
| `ADD` (later) | `src/lib/themePresets.ts` OR `theme_presets` table — decide at wiring (spec says either) |
| OLD CODE | `src/old-code/GlobalSettingsEditor.tsx` lines 14–22 (preset designs reference only) |
| DEPENDS ON | none |
| CHECK | reuse existing `manifest.json` + fan-shell branding tests |

---

## SHEET 4 — Mock store (foundation)

> **Purpose:** mock data is the design draft (AGENTS.md). Every new table this feature spec lists already exists nowhere; add them so later sheets have somewhere to read/write.

| Change | Tables added |
|---|---|
| `mockDataStore.ts` → `TableName` union | ~~`conversations`, `conversation_members`, `messages`, `message_attachments`, `message_requests`, `blocked_users`, `communities`, `creator_staff_members`, `creator_staff_invites`, `creator_staff_activity`, `affiliate_deals`, `affiliate_attributions`, `affiliate_conversions`, `affiliate_links`~~ — **all 14 done ✅ 2026-08-07 (29 total)** |
| `mockSupabaseClient.ts` | JOIN_REGISTRY entries for each new FK + RPC handlers for affiliate/staff/community where the spec calls for them |
| Keep | all 15 existing tables + no `admin_accounts` seeding (starts empty) |
| SPEC | messaging.md Part 5 · staff.md · monetization/creators.md Part 2f |
| DEPENDS ON | none |

---

## SHEET 5 — Kill + rate-limit housekeeping

> **Purpose:** the audit's DELETE list and G7 rate-limit gaps — cheap now, poison later.

| Action | Detail |
|---|---|
| ~~DELETE~~ ✅ | `api/creator/content/upload/route.ts` (dup of `api/creator/upload`) — **done 2026-08-07** |
| ~~DELETE~~ ✅ | `api/fan/session/route.ts` (misnamed — dup of `creator/fans/export`) — **done 2026-08-07** |
| ~~DELETE~~ ✅ | `src/components/library/index.ts` (empty barrel) — **done 2026-08-07** |
| ~~DELETE~~ ✅ | `public/*.svg` (stock boilerplate: next, vercel, file, window, globe) — **done 2026-08-07** |
| RENAME | localStorage key `playground_banner_dismissed` → `playground_banner_dismissed` (G21) |
| ~~EXTEND~~ ✅ | missing rate limits (G7): `creator/check-username`, `fan/follow`, `fan/install`, `fan/forgot-password`, `push/subscribe` — **all added 2026-08-07** |
| ~~MERGE~~ ✅ | `api/creator/pageview` throws its own Map → use the `rate-limiter` singleton — **done 2026-08-07** |

---

## SHEET 6 — SCRECO: Login ✅ DONE 2026-08-10

> **MOCK AUTO-LOGIN (2026-08-10):** mock mode now auto-provisions a session in `proxy.ts` — `/dashboard*` logs in as the seeded test creator (`test@creatorpwa.app`, Link Address `test`, id `mock-test-creator`), `/admin*` as the seeded admin (`admin@creatorpwa.app`, id `mock-admin`). `/login` + `/onboarding` are bypassed on purpose while inside-app sheets (8–23) are built. **⚠️ REMOVE the auto-provision block in `proxy.ts` during the final auth pass** (before real-mode migration), then re-test login/onboarding against a clean flow. The `seedMockTestCreator()` seed in `mockSupabaseClient.ts` can stay as sample data. Also fixed: cookie hydration now creates the server-side creators row (mock store split), killing the `/onboarding` ↔ `/dashboard/playground` redirect loop.
> **Goal:** a creator logs in to `/login` with email/password (mock: any email+password works) and lands on the dashboard.
> **Wired:** `src/screens/public/login/Screen.tsx` (server: `searchParams.next` validation + already-logged-in redirect) · `src/components/auth/LoginForm.tsx` (promoted + `?next=`, Gumroad-style error copy incl. creators lookup, mock auto-signup fallback, mock-only social buttons Google/TikTok/Instagram/Facebook with tooltips) · `src/components/auth/AuthCard.tsx` (promoted, now `bg-card`). **Review pass 2026-08-10:** forgot-password wired (link → `/forgot-password` page + `POST /api/creator/forgot-password` — no enumeration, mock console-logs reset link via mockResend, real = Supabase reset email). Open item: no /terms route exists anywhere (landing footer, Sheet 23). Checks green (typecheck/lint/check-docs).

> **Goal:** a creator logs in to `/login` with email/password (mock: any email+password works) and lands on the dashboard.

```
UNIT 6 · LOGIN  ·  /login  ·  spec: screens/public/login.md
──────────────────────────────────────────────────────────
ENTRY       app/(public)/login/page.tsx
            → src/screens/public/login/Screen.tsx
COMPONENTS  LoginForm (PROMOTE from old-code/LoginForm — add ?next=, error copy)
            AuthCard (PROMOTE from old-code/AuthCard — centered wrapper)
HOOKS       none (form is local)
API ROUTES  live fan auth is already there; creator login is the mock cookie path
            POST /api/auth/callback (Supabase real-mode) — not needed in mock
LIB         lib/supabase/server.ts (createClient → getUser), fanSession (mock cookie)
COOKIES     mock_auth_uid · mock_auth_email (already live)
REDIRECTS   logged in → /dashboard (or ?next=) · create account → /onboarding
TABLES      creators (read)
OLD-CODE    LoginForm.tsx · AuthCard.tsx (patterns)
DEPENDS ON  1 (helpers) 2  3 (branding only if you skin it)
NOTE        mock = any email+password signs in; real = Supabase auth
```

---

## SHEET 7 — Onboarding ✅ DONE 2026-08-10

> **Wired:** `src/screens/public/onboarding/Screen.tsx` (server: sanitized `?invite=` passthrough — alphanumeric/`_-`, ≤100 chars; already-logged-in redirect to `/dashboard/playground`) · `src/components/auth/OnboardingForm.tsx` (promoted + Link Address field with debounced live availability, permanence confirm dialog, `?invite=` title + metadata capture) · **NEW** `POST /api/creator/register` (auth-guarded upsert of username+display_name, format+availability validation) · `check-username` relaxed to **anonymous** (Link Address availability is checked pre-signup) + full `^[a-z0-9_]{3,20}$` server validation. Partnership auto-connect deferred to Sheet 13 (route stays 501 stub — spec Part 2). Gates green.

```
SCREEN: Onboarding  ·  /onboarding  ·  spec: onboarding.md (DEFERRED signup)
──────────────────────────────────────────────────────────────────────────
ENTRY       app/(public)/onboarding/page.tsx
            → src/screens/public/onboarding/Screen.tsx
COMPONENTS  OnboardingForm (PROMOTE old-code/OnboardingForm — add ?invite=, Link Address field)
            AuthCard (shared)
ROUTES      POST /api/creator/register (mock cookie) → creates creator row
            ?invite=CODE param → partnership.md flow (built Sheet 13)
            redirect success → /dashboard/playground
TABLES      creators (write) · partnerships (if invite)
OLDCODE     OnboardingForm.tsx · AuthCard.tsx · onboarding/page-old.tsx
DEPENDS ON  1, 2, 3  6 (AuthCard pattern) · partnership rebuild (13) optional to defer invite
NOTE        DEFERRED in spec = signup only; can wire basic form now, polish later
```

---

## SHEET 8 — Admin

```
SCREEN: Admin ·  /admin  ·  spec: admin.md
────────────────────────────────────────────────────────────────
ENTRY       app/(admin)/admin/page.tsx → src/screens/admin/Screen.tsx
COMPONENTS  AdminScreen: StatsCards · CreatorsTable · AccountsTable · AuditLog · APIKeys
            (rebuild from old-code/dashboard-admin/page-old)
ROUTES      GET /api/admin/stats       LIVE
            GET /api/admin/creators    LIVE
            PATCH /api/admin/creators/[id]        LIVE
            GET /api/admin/creators/[id]/fans    LIVE
            GET/POST /api/admin/accounts         LIVE
            PATCH/DEL /api/admin/accounts/[id]   LIVE
            POST /api/admin/api-keys             LIVE
LIB         admin-permissions.ts (canPerform/getAdminAccount) — the guard
TABLES      admin_accounts · admin_activity_log · admin_invites (spec'd — link invite not built)
OLDCODE     dashboard-admin/page-old.tsx · requireAuth.ts
DEPENDS ON  1 2 5 — RBAC+all 7 routes already live; re-skin UI from spec
NOTE        founder setup `/founder/setup?token=` — spec only, skip in Phase F
NOTE        invite model (2026-09-29, spec'd only): link-first — role + optional email
            (pre-fill) → shareable 7-day token → shared PUBLIC accept `/accept?token=…`
            creates account + minimal creators row (username=null) + keycard.
            LIVE form is the pre-/accept state: POST /api/admin/accounts needs an
            EXISTING account (404 "No user found with that email" otherwise).
            `admin_invites` table = spec, not built (phase gate).
```

---

## SHEET 9 — Settings

```
SCREEN: Settings ·  /dashboard/settings  ·  spec: settings.md
────────────────────────────────────────────────────────────────────
ENTRY       app/(creator)/dashboard/settings/page.tsx
            → src/screens/creator/settings/Screen.tsx
COMPONENTS  ProfileSection · PaymentsPanel (PayPal-first — NEW panel per settings.md Part 2;
            StripeConnectPanel = deferred Atlas reference only) · Notifications ·
            MessagingPrivacy · DangerZone
API         profileUpdateService (LIVE allow-list)
            PATCH /api/creator/profile (strum) — or reuse profileUpdateService directly
            GET/PATCH /api/creator/settings (checklist prefs, new)
            PayPal connect: /api/paypal/connect (NEW — OAuth 2.0; mock via mockPayments.ts),
            PUT creator.paypal_account_id
            (stripe/connect stays LIVE as the deferred Atlas path — no new wiring)
TABLES      creators (paypal_account_id — replaces stripe_account_id as the v1 rail) ·
            creator_settings (production)
OLDERS      StripeConnectPanel.tsx (reference only — Atlas path)
DEPENDS     1,2,3 — messaging toggles reference messaging.md Part 2 (built 12)
NOTE        payout rail = creator's PayPal balance; Payoneer = rail-swap at Settlement Engine
            boundary (monetization/creators.md 2e2) · take rate 0% — no platform_fee code
```

> **✅ ADDENDUM (2026-10-09) — Profile identity shipped (settings.md Part 13):** ProfileSection rebuilt = avatar upload/replace/remove (`POST /api/creator/upload` `type=avatar` → PUT `avatar_url`) + display name input + **per-field 7-day lock states** ("You can change this again on {date}"). Server-enforced in `PUT /api/creator/playground` → **409 `{ error, retry_at }`**; stamps `display_name_changed_at` / `avatar_changed_at` on `creators` (mock now; real-DB migration later); `IDENTITY_COOLDOWN_DAYS` lives in `lib/limits.ts`. **Deploy strips identity fields** (`usePlaygroundForm` allow-list) so a stale localStorage draft can't revert or falsely trip a lock — the lock fires only on a real value change. ✏️ gateways: sidebar identity block (now an Avatar photo, not a letter) + `BillboardPreview` → new `ProfileEditDialog` → Settings (founder decision 2026-10-09; **App Name/Icon locks still UI-note only** — Playground Identity tab, when it ships).
>
> **✅ ADDENDUM (2026-10-10) — Payments moved to Sheet 23 (Earnings):** `PaymentsPanel` leaves this sheet → `git mv` → `components/earnings/` (renders in Earnings §3, with the new `paypal_handle` card). Settings Part 2 = pointer stub (numbering kept). This sheet keeps Profile · Account/Security · Billing · Notifications · Messaging · Your Page · Integrations stub · Danger Zone — the PayPal-connect route line above now belongs to Sheet 23.

---

## SHEET 10 — Overview

```
SCREEN: Overview ·  /dashboard  ·  spec: overview.md
────────────────────────────────────────────────────────────────
ENTRY       app/(shell)/dashboard/page.tsx
            → src/screens/creator/overview/Screen.tsx
COMPONENTS  StatCards (AnalyticsWidgets) · ActivityTimeline (DashboardTimeline) ·
            SetupChecklist · QuickActions (Edit Playground, Install app) ·
            QRCard + FanExportButton (CreatorManagementWidgets) — PROMOTE
ROUTES      GET /api/creator/activity       LIVE
            POST /api/creator/pageview      LIVE (migrate rate-limit in #5)
            GET /api/creator/fans/export    LIVE -> EXTEND cols (LTV, referred-by, consent)
RPC         get_creator_stats (mock returns zeros) → stat: sales/fans/views/subscribers
LIB         qr generation (use a small lib or inline) · urls.ts
TABLES      creator_activity (via RPC) · fans / purchases / subscriptions (stats)
OLDERS      AnalyticsWidgets.tsx · DashboardTimeline.tsx · CreatorManagementWidgets.tsx · dashboard-overview/page-old.tsx
DEPENDS ON  1 2 5 6 (login) — data feeds already live
```

---

## SHEET 11 — Search (shared component ships here)

```
SCREEN: Search ·  /search  ·  spec: search.md
────────────────────────────────────────────────────────────────
ENTRY       app/(public)/search/page.tsx → src/screens/public/search/Screen.tsx
COMPONENTS  SearchBar (SearchFilters OLF-MERGE) · CreatorResultCard (MERGE card) —
            build ONE shared component here, reused by Network + landing-later
ROUTES      GET /api/discover/creators    (NEW — search index: is_discoverable, username/display_name ilike)
LIB         search-utils.ts (PROMOTE) · CreatorService (getByUsername already)
TABLES      creators (read — is_discoverable, is_featured, created_at for ranking)
MERGE       CreatorSearchInput vs SearchFilters → ONE (SearchFilters wins)
            CreatorCard vs CreatorResultCard → ONE card
DEPENDS ON  1 2 3 — landing search section deferred (Sheet 19b)
```

> **REMOVED 2026-09-28 (cleanup pass):** the standalone `/search` page stack (`app/(public)/search/`, `screens/public/search/`, `components/search/` incl. SearchBar + CreatorResultCard) was deleted — the Network hub's Discover center (Sheet 18) is the search home now, and the deal form resolves `@usernames` directly. `GET /api/discover/creators` (this sheet's route) stays live. `search-utils.ts` (PROMOTE item) was also removed as unused; `features/search.md` remains the spec for a possible landing-page search section (Sheet 23).

---

## SHEET 12 — Messaging (engine, consumed everywhere) — ✅ DONE 2026-08-17 (Part 3 Community wired 2026-08-31)

> **Purpose:** THE WhatsApp-style inbox: floating 💬 on every screen, 1-on-1 between all parties, requests + block + toggles, group + announcements, Community (Home tab). Build the engine first; screens reuse it.

> **DONE 2026-08-17 (Stage B of the Connected Loop Pass):** `src/components/messages/MessagesShell.tsx` (single file: useMessages, useUnreadBadge, MessageInboxPopover, MessagesShell, MessageThread, MessageList, MessageBubble, MessageComposer, AttachmentPreview, MessageIcon, GuestContactModal) + 12 routes under `/api/messages/*` + `message_prefs` table (added to the 7 spec tables) + `src/lib/messages.ts` helpers (getMessageIdentity, resolveParticipantNames, isBlocked, getPrefs/setPrefs). Wired: dashboard layout floating inbox + `/dashboard/circle/messages`; fan shell header MessageIcon + floating inbox; fan-page messaging catalog item → MessageIcon (identity) / email-capture unlock box (guest); guest "Contact" button → GuestContactModal (email capture → follow row → direct chat). Verified end-to-end via curl: direct chat fan↔creator, unread + read receipts, allow-anyone gate → Requests folder → approve (queued first message delivered), block both directions, group + announcements-only, upload route. Also fixed two real mock bugs (auth singleton leak across requests; message_prefs writes silently dropped).
> **✅ Part 3 Community wired 2026-08-31:** `FanCommunitySection.tsx` (Home tab section with join/leave + channel list), guest-page "Join the community" card → FanAuthModal, Connect-tab community card → deep-link Home. `fanShellData.ts` now fetches community + channels + fan membership status server-side. Community join/leave routes already existed from the engine build.

```
FEATURE · MESSAGING  ·  spec: messaging.md (Parts 1–7)
──────────────────────────────────────────────────────────
CONPOC     src/components/MessagesShell.tsx — single file → useMessages, MessageInboxPopover, MessageThread,
           MessageList, MessageBubble, MessageComposer, AttachmentPreview, MessageIcon, useUnreadBadge
             (fresh build, NO old-code reference)
ROUTES     all under /api/messages/* (11):
           GET/POST  conversations
           GET/POST  conversations/[id]/messages
           PATCH/DEL messages/[id]
           POST      conversations/[id]/read
           POST/DEL  conversations/[id]/members
           PATCH     conversations/[id] (rename/pin/announcements)
           POST      messages/upload (reuse /api/creator/upload)
           GET/POST  messages/requests · POST messages/block · GET messages/blocks
           GET       messages/unread · PATCH messages/preferences
TABLES     conversations · conversation_members · messages · message_attachments ·
           message_requests · blocked_users · communities   (all NEW — #4)
REUSE      guest contact = email capture per Part 2 (no magic link — deleted 2026-08-08)
PLACES     inbox on every dashboard page + fan shell + network chat icons + partner page
DEPENDS ON  1 2 4 (tables) — needs all the table layering from #4
```

> **✅ ADDENDUM (2026-10-12) — Part 2b: deal cards in partner threads (the money batch):**
> New routes `POST /api/messages/deals` (propose — partners-only, direct creator↔creator only, one pending per direction, 7-day cooldown after a resolve) + `POST /api/messages/deals/[id]/{accept,decline,cancel}` (accept creates the `affiliate_deals` row: owner = proposer, promoter = accepter; lazy 7-day expiry; partnership re-checked at accept). Tables: **`affiliate_deal_proposals`** (NEW) + `messages.proposal_id` (nullable anchor); the thread GET joins proposal state and `MessagesShell.tsx` renders the card inline (handshake propose button above the composer, Accept/Decline/Cancel + post-accept "Create link"/"Copy link" for the promoter). Toast + activity row (`describe()` events) on every state change. Spec: `messaging.md` Part 2b + `creators.md` 2b2/2e2.

---

## SHEET 13 — Partnerships (in-app invites + ?invite=)

```
FEATURE: PARTNERSHIP  ·  spec: partnership.md
────────────────────────────────────────────────────────────────
COMPONENTS  InviteCard (PROMOTE old-code/PartnerInviteCard-old.tsx) — share message page
ROUTES      GET  /api/creator/partners/invite       NEW (rebuild old route 1:2)
            POST /api/creator/partners/onboarding    NEW (rebuild old route as-is + source: invited)
TABLES     partnerships (+ NEW source col: invoked/collab)  ·  partner_invites
OLDCODE     allScreens/network/api/creator-partners-invite-route-old.ts  (43 lines)
            allScreens/network/api/creator-partners-onboarding-route-old.ts  (58 lines)
DEPENDENT   4 (table) 12 — rides the existing /api/creator/partners/* family
              wiring home = Network My Peeps → Partners Row (Sheet 18) or onboarding Sheet 7
```

---

## SHEET 14 — Relationships / "My Peeps" right rail

```
FEATURE: RELATIONSHIPS  ·  spec: relationships.md
──────────────────────────────────────────────────────────────────────
COMPONENTS  MyPeeps (umbrella — count card: Partners / Fans / Staff) ·
            Fans: FanList-table (filters + export button) · FanProfileDrawer (purchases,
            subscription, install history, messages via MessagesShell)
API ROUTES  GET    /api/creator/fans/list        LIVE (stats)
            GET    /api/creator/fans/export      EXTEND (LTV, ref-by, consent flag)
            PATCH  /api/creator/fans/[id]        NEW (do_not_contact, notes)
            GET    /api/creator/fans/[id]        NEW (profile drawer data)
            GET    /api/creator/peeps   NEW — "MY PEEPS" umbrella (counts + lists)
TABLES      fan_accounts (+ 3 new cols in #2) · fan_installs · fan_purchases ·
            subscriptions · conversations (read for history)
OLDCODE      FanStatsCard.tsx · CreatorManagementWidgets.tsx (FanExportButton)
DEPENDED     #3 #4 (columns) #12 (MessagesShell in profile drawer) — builds into Network right rail
```

---

## SHEET 15 — Staff (Staffs row, My Peeps)

```
FEATURE: STAFF  ·  spec: staff.md  (Model A — regular accounts, permission toggles)
──────────────────────────────────────────────────────────────────────────
COMPONENTS   StaffRow (My Peeps Staffs row) · PermissionsToggles · InviteEmail · ContextSwitcher
ROUTES (8, all NEW, /api/creator/staff/*)    POST invite · GET invites · POST invites/accept
           GET members · PATCH/DEL member · GET activity · GET contexts
TABLES       creator_staff_members · creator_staff_invites · creator_staff_activity  (NEW, #4)
AUDIT        audit log IN v1 (owner only)
REUSE        creators table + mock_auth_uid (no auth change)
INVITE       link-first (spec'd 2026-09-29): optional email (pre-fill only) → shareable
             7-day token → shared PUBLIC accept `/accept?token=…` (email + password,
             no Link Address, minimal creators row username=null). Same screen as the
             admin invite (admin.md) — ONE accept door for staff + admins.
             LIVE form still requires email + an existing account — pre-/accept state.
DEPENDED     #1 3 4 — wiring home = Network My Peeps → Staff row (Sheet 18)
```

---

## SHEET 16 — Affiliates (cross-creator deals)  ·  spec: network.md §7 + monetization/creators.md Part 2
─────────────────────────────────────────────────────────────────────────────
COMPONENTS   AffiliateDealForm (rule builder: type/scope/trigger/terms + external-link
             quarantine warning) · EarningsSummary (settled vs pending) ·
             AffiliateDiscover (browse deals) · AffiliateLinks (active/my links)
ROUTES (7, ALL NEW /api/creator/affiliates/*
             deals GET/POST · deals/[id] PATCH/DEL · earnings GET · discover GET ·
             link POST · links GET · links/[id] PATCH
TABLES       affiliate_deals · affiliate_attributions · affiliate_conversions
             (+ settle_method/settlement_status/settled_at — state machine per creators.md 2e2) ·
             affiliate_links               (NEW, #4)
EXTEND       content_items → affiliate_enabled, affiliate_rate, PAYMENT_HANDLING
             ('in_app' | 'external_link')  (in #2; external_link = quarantined from deals)
SETTLEMENT   Deal Rules & Settlement Engine: cuts computed at fan_purchases write; PayPal split
             (auto) or manual PayPal.me + confirm (settled_manually); mocked, PayPal real in prod;
             Payoneer = rail-swap at the engine boundary · NEVER platform_fee in v1
RULE (G15)   fan_scap — deal weights, rates, take never shown to fans
DEPENDED     #2 3 4 12 (chat on creator cards) · wiring home = Network left/center (18)
```

> **MOUNTED 2026-09-27 (Network hub rail):** all 4 components live in `src/components/network/` (folder = product-name rule) and render on `/dashboard/network`'s left rail: `＋ New deal` (button-gated AffiliateDealForm — @username promoter resolver + catalog item picker, external-link items filtered) → **YourDealsCard** (NEW: status pills + Pause/Resume/Revoke, `is_owner` from GET) → EarningsSummary → AffiliateDiscover → AffiliateLinks. POST `owner_id` optional (defaults to session); owner-only PATCH/DELETE unchanged.
>
> **✅ ADDENDUM (2026-10-10) — creator-only scope + the money screen moves to Sheet 23:** `EarningsSummary` → `git mv` → `components/earnings/` (Sheet 23). The deal form loses its scope select + item picker (creator-only deals — `creators.md` 2b): drop the `z.enum(["item","creator"])` scope on `POST /api/creator/affiliates/deals`, simplify `scopeMatches` in `lib/affiliateAttribution.ts`, remove the Per-item/Per-creator badges (`YourDealsCard`, `AffiliateDiscover`, `AffiliateLinks`), drop `scope`/`item_id` from the deal types + mock seeds, park the `content_items.affiliate_enabled`/`affiliate_rate` readers (external-link items = automatic non-conversion, no warning UI). The receipt-protocol routes (extended earnings GET, `conversions/[id]/settle`, `earnings/paypal`, admin dispute verdicts), `computeRedCard`, `SETTLEMENT_DUE_DAYS`, and the hop endpoint live on **Sheet 23**.

> **✅ ADDENDUM (2026-10-12) — Batch B: partners-only + the discovery-to-negotiation flip (`creators.md` 2b2):**
> `POST /api/creator/affiliates/deals` **403s** without a non-ended `partnerships` row between owner and promoter (re-checked at proposal-accept). **`GET /api/creator/affiliates/discover` DELETED** with its widget (nothing to browse). `POST /api/creator/affiliates/link` now requires `deal.promoter_id === me`. Revocation documented as **prospective-only** (engine already behaves this way — `creators.md` 2e2; UI toast says so). New creation entry points: Sheet 18's Circle `DealDialog` + Sheet 12's chat proposal cards. Spec `network.md` §7 flow/steps + API table updated.

---

## SHEET 17 — Branding display utilities (apply theme)

> **Purpose:** all the "last mile" of the branding system that the fan shell + Playground / dashboards consume. Build/apply after the resolver (#3) is extended but before the big screens.

| Item | What |
|---|---|
| `PreviewStateToggle` | Draft/Live toggle component, shared between the Playground editor + the owner's live `/{username}` view (playground.md Part 1b) |
| `ElementPopover` | Tap-to-edit floating editor (deferred: My Sheet 19 opens it) |
| brand CSS hooks | `globals.css` stays platform; per-creator — via inline tail, `data-brand` — applied on fan shell pages, never on dashboard/login |
| PWA strings | Manifest route already does this; keep, and start `start_url` → if Joel /app sheet |

---

## SHEET 18 — Network (shell screen hosting #13–#16)

```
SCREEN: Network ·  /dashboard/network  ·  spec: network.md
────────────────────────────────────────────────────────────────
LAYOUT (DECIDED)  3-section anchored: LEFT rail (Discover + Affiliates) · CENTER detail ·
                   RIGHT rail = MY PEEPS (c%24 partners / fans / staff)
COMPONENTS         NetworkPage · MyPeeps · PartnersRow (←13) · FansRow (←14) · StaffsRow (←15) ·
                   CollabList · CollabDetail · Discover · BillboardEditor · BillboardCard ·
                   Affiliates (←16) · AffiliateDealForm · EarningsSummary · AffiliateDiscover ·
                   AffiliateLinks · Inbox/Requests ·
                   MessageIcon (←12) on each creator line
ROUTES /api/creator/partners/*   request POST · respond POST · list GET · discoverable GET ·
                                   billboard GET/PUT   (NEW — parterride rebuild old routes)
           + fan/creator/fans/export GET (from #14)
TABLES   partnerships · partner_invites · affiliate_* · fan_accounts infra
OLDCODE   allScreens/network/page-old.tsx · network-page-old.tsx · partnershipService-old.ts · creator search kit
DEPENDED  EVERYTHING: 1–5, 11 (search) 12 (chat icons) 13 14 15 16 (rails) 17 (branding)
ORDER     18/23 — the most shelf-heavy (Need Themes like).
```

> **✅ DONE 2026-08-30 + ADDENDUM (2026-09-26, `docs/archive/NETWORK_REDESIGN_PLAN.md`) — layout OVERRIDDEN.**
> The 3-section anchored layout is superseded by **hub + floating dock + 3 sub-screens**:
> - **Hub `/dashboard/network`** — 2-col at `lg`: LEFT rail (BillboardPreview/Editor + affiliate block: `＋ New deal` → AffiliateDealForm → YourDealsCard → EarningsSummary → AffiliateDiscover → AffiliateLinks — mounted 2026-09-27, components in `src/components/network/`) · CENTER = **Discover grid** (`/api/discover/creators?q=` + result cards with Visit + Connect buttons). Right rail removed. Mobile order: Discover → Billboard → Affiliates.
> - **3 sub-screens:** `/dashboard/circle/partners` (InboxRequests pending-only + CollabList active-only + CollabDetail w/ MessageIcon + PartnerInviteCard) · `/dashboard/circle/fans` (FanListTable full-width + FanProfileDrawer w/ MessageIcon) · `/dashboard/circle/staff` (pending invites + StaffRow members + PermissionsToggles + InviteEmail + MessageIcon per row). Route chain per sub-screen: `page.tsx` re-export → `screens/creator/circle/<name>/Screen.tsx` → `components/circle/<Name>Page.tsx`.
> - **My Peeps + 💬 = ONE unified dock stack** (`components/layout/MyPeeps.tsx` + `MessageInboxPopover`), mounted in `app/(shell)/layout.tsx` inside the **single** floating wrapper `fixed bottom-20 right-4 z-50 flex flex-col items-center gap-2 sm:bottom-6 sm:right-6` — vertical order top→bottom = Partners · Fans · Staff · Messages. Both components are **position-less** (MyPeeps = fragment of 3 buttons; MessageInboxPopover root = `relative`) — the mount site owns placement, so there is no hardcoded offset to keep in sync. All four buttons are uniform `h-11 w-11` round icon buttons (icon-only every breakpoint, `title` tooltips); active page from `usePathname()`; red combined pill per chip (Partners = pending_requests + unread · Fans = unread · Staff = pending_invites + unread; "99+" cap; hidden at 0); 30s poll. Fan shell wraps its bubble independently in `FanAppShell.tsx` (different surface, not a sync pair).
> - **`GET /api/creator/peeps` re-shaped:** `{ partners, fans, staff, pending_requests, pending_invites, unread: { partners, fans, staff } }` — unread classifies each active direct convo's other participant (fan_accounts → fans · creator_staff_members → staff · non-ended partnership → partners), skipping muted + deleted + own messages.
> - **`GET /api/creator/partners/list`** now returns ALL non-ended rows (active + pending) + computed `direction` (`"incoming"` when `creator_b === user.id`, else `"outgoing"`).
> - **`GET /api/creator/fans/list`** now returns `id`, `do_not_contact`, computed `total_spent` (sum of completed `fan_purchases.amount_paid` per fan).
> - **Billboard GET/PUT** adds `bio` (600) + `rate_card {post,story,video}` + `media_kit_message` (300) on the creators row; dead `/media-kit` shareable-URL block removed from BillboardEditor.
> - **Mock fixes on the spot (2026-09-26):** mock query builder gained `.gt()`, `.is()`, and `select(…, { count })` support (were missing entirely → 500s in mock for relationships / staff+partner invites / count queries).
> - **ADDENDUM (2026-10-09) — billboard DESIGN editing moves to Playground (`playground.md` Part 1d):** rail becomes mirror only — `BillboardEditor`'s design fields (tagline/tags/collab style/bio/rate card/media kit) relocate to `/dashboard/playground?view=billboard` (component home `components/network/` → `components/playground/`); the 2 visibility switches are **extracted into their own card INSIDE the Discover section and STAY in Network** (founder: *"the Playground is just for editing"*; position same-day follow-up: they gate Discover, so they live with it — the rail's pill became a status badge); nudge **[Design my billboard]** + the My Billboard card-header **✏️** → direct jump to that view (no dialog); undesigned standard unchanged (avatar + name + @handle, network.md §3).
> - **ADDENDUM round 2 (2026-10-09, same day) — FB-model simplification:** `show_in_search` is **removed** from UI + logic (founder: search must always be on — no greying, everyone findable by name). Discover card = the **single Accept-collab switch** (default collab feed = willing only; typed search = ALL creators incl. closed ones with a disabled button; landing marquee = all creators); self excluded from own Discover; rail pill relabelled **Open/Closed to collabs** (status only); billboard nudge retargeted → **first Network visit while the billboard is undesigned** (once); `creators.show_in_search` column parked (network.md §1/§3, search.md, landing.md).
> - **ADDENDUM round 3 (2026-10-10) — Earnings leaves the rail (Sheet 23):** `EarningsSummary` unmounts from the left rail → `components/earnings/` (its own screen). The rail's affiliate block = `＋ New deal` → YourDealsCard → AffiliateDiscover → AffiliateLinks — the remaining three keep sharing the `dealsKey` refresh bell. `AffiliateDealForm` loses its scope selector + item picker (creator-only deals); any "My Earnings" affordance becomes a link to `/dashboard/earnings`.
> - **ADDENDUM round 4 (2026-10-12) — the whole affiliate block leaves the rail → Sheet 23 §2b (founder "A1"):** rail = **billboard mirror only** (Network = social). `AffiliateDealForm` + `YourDealsCard` + `AffiliateDiscover` + `AffiliateLinks` `git mv` → `components/earnings/`, composed by a new `AffiliateDealsSection` (owns `showDealForm` + `dealsKey` + `handleDealSubmit`, moved verbatim — no behavior change). Deal-logic work (Circle Partners `Make a deal`, chat deal cards, partners-only, cancel-future-only) stays PARKED.
> - **ADDENDUM round 5 (2026-10-12) — Batch B BUILT (the parked money work):** the rail stays billboard-only; deal creation now lives on **Circle partners rows** — a handshake **"Make a deal"** icon per `CollabList` row → `DealDialog` (prefilled partner, compact composer → the partners-only `POST /affiliates/deals`). Chat **proposal cards** (`messaging.md` Part 2b) are the negotiation path. `network.md` §7 flow step 3 rewritten (discovery via chat, not browsing).
> - **ADDENDUM round 6 (2026-10-13) — find-by-field: specced, then BUILT same day (founder "go").** Two-layer discovery identity: one preset `primary_field` (20 locked buckets — the field-filter target, nullable, edited in Playground → Billboard view) + 3 free-text `tags` (normalized lowercase + trim at save; flavor + search matches, never filtered). Discover gains a single-select **filter-chip row** (`All` + 20, under the search box, AND-combined with typed query; tap-active-clears); feed pool + directory both narrow by `primary_field` (FB rule holds inside the field). Same search box matches wider: names → tags/tagline → bio last. New `creators.primary_field` column (pre-migration = free); prod notes: trigram over tagline/tags/bio + `primary_field` partial index. Build: limits const → Creator type → 4 mock row literals → billboard GET/PUT (bucket-validated, junk ignored) → BillboardEditor dropdown + BillboardView plumbing → discover `?field=` + scorer tiers → shared hook optional field (deal form untouched) → NetworkPage chips + filtered empty states. Smoke: PUT round-trip/validation/normalization · field pools · junk ignored · tagline>bio order · AND-combo · chips in HTML · toggle re-verified. Gates green every wave.
> - **ADDENDUM round 7 (2026-10-13) — SPEC ONLY: tag pill-adder + microcopy (`network.md` §2, `playground.md` Part 1d, `search.md` decision #13). NOT BUILT (phase gate).** Entry = input + [+ Add]/Enter → pill ×, "N left", dup-reject case-insensitive, disables at 3; label "What do you do?", e.g.-placeholders, helper line. 1 primary + 3 tags RETAINED (second field + widening rejected — revisit on real complaints only).
> - **ADDENDUM round 8 (2026-10-14) — billboard hero + The Lineup: specced, then BUILT same day (founder "go").** Hero = the creator's spotlight item (same `content_items.is_featured` row fans see; video muted-loop LED / image poster / honest blank). Renders in Modal A top + Playground preview + Connect Lineup; NOT in feed cards / rail mirror / marquee. Gated media per the 2026-10-01 audit law (cover-only for strangers; per-fan purchases honored on the Lineup). Featuring lives in the catalog editor (Sheet 19), never the billboard editor. Build: `lib/spotlightHero.ts` + `[id]` gated `featured_item` → shared `BillboardHero.tsx` → modal hero → billboard GET own ungated → preview hero → fan/partners gated heroes → Lineup swap ("Partners" → "The Lineup", `billboardIndex` → `lineupIndex`). Smoke: free full · paid stripped+cover (both surfaces) · owner full · both hero types in Lineup payload · gates green every wave.
> - **ADDENDUM round 9 (2026-10-14) — media-kit v1 door + Overview "View my page": specced, then BUILT same day (founder "go").** Media kit = CV for sponsors (bio + rate card + message; sponsors are readers, no accounts — no checkout/ad units, money moves off-platform, 0%). V1 door: public read-only `GET /[username]/media-kit` (new `screens/fan/media-kit/` + address-book page; bio + rate rows + message + gated hero via `toHeroMedia` stranger-view; 404 for unknown) + **Copy media-kit link** outline button in `BillboardView` (below the editor, `useCopyToClipboard`). Overview `QrCard` gains **"View my page →"** beside Copy link (new tab, guest eyes; decision #12). `search.md` Concept softened ("no public creator name-search"). Smoke: page 200 with bio/$500/message/hero/visit-link · unknown 404 · dashboard HTML carries the button · playground 200 · gates green.

---

## SHEET 19 — Playground (biggest screen)

> **🔀 2026-08-11 — reordered to FIRST, V1-CORE scope (test-first):** wire Phases 1–2
> of playground.md Part 6 now; Phases 3–5 deferred. V1-CORE = full-screen phone shell + 5
> swipeable surfaces + PreviewStateToggle + Deploy · ElementPopover tap-to-edit (brand
> layer) · editor sheet **Option A** (8-tab strip) with **Identity, Design, Catalog,
> Artist Links LIVE** + Integrations/Email/Media-Kit/Spotlight "coming later" panels ·
> catalog = **7 core types (link, image, video, product, tip_jar, newsletter, messaging)**
> via CatalogManager+AddItemPicker+PricingEditor · auto-save (3s `playground_draft_${id}`)
> + Unsaved-Changes modal · NEW GET/PUT `/api/creator/playground` (creator-row read + deploy).
> **DEFERRED (v1):** item types course/session/membership/physical/bundle/live/pdf/audio/page,
> Spotlight tab, Funnels, Integrations/Auto-DM, Email campaigns, Media kit, AI Copilot,
> editor options B/C/D (all remain spec'd — additive wiring later).

> **ADDENDUM (2026-10-09) — top-level `Fans | Billboard` switch (playground.md Part 1d):**
> Playground gains a second view: **Fans** = today's phone preview (Draft/Live/Deploy unchanged) ·
> **Billboard** = result-preview card + the billboard editors moved from the Network rail
> (`tagline 60 / 3 tags / collab style / bio 600 / rate_card {post,story,video} / media_kit 300`,
> Save button, loading/saving states — spec moved verbatim from network.md). Existing
> `GET/PUT /api/creator/partners/billboard` serves it — **no new API**. URL `?view=billboard`
> (default `fans`; `?tab=` unchanged — fan-surface deep links inside Fans view). Entry points:
> Network header ✏️ Edit billboard · nudge [Design my billboard] · direct URL. After a bio
> save, refresh `GET /api/creator/playground` so the Fans preview agrees. Visibility switches
> are NOT here (stay in Network rail).

```
SCREEN: Playground ·  /dashboard/playground  ·  spec: playground.md
│──────────────────────────────────────────────────────────
ENTRY    app/(creator)/dashboard/playground/page.tsx → src/screens/creator/playground/Screen.tsx
SUMMARY “THE editor”: full-screen phone preview (guest-first, swipeable 5 surfaces),
       tap-to-edit popovers, editor tab sheet (8 tabs, 16 content types), auto-save,
       Draft/Live state toggle, deploy button
LAYOUT(8 tabs)     Identity · Design · Catalog · Artist-Links · Integrations · Email ·
                    Media Kit · Settings weave (playground list)
COMPONENTS (mostly PROMOTE from old-code)
   PhonePreview  → full screen phone
   AppIdentityTar · GlobalSettings · BottomPanel|BottomEditor → tabs
   PlaygroundForm (was usePlaygroundForm) → form+draft
   AutoSave (useAutoSave.tsx)
   17 editors (catalog/* → one per type) via CatalogManager + AddItemPicker + PricingEditor …
   CoverUploader · Customization
NEW (spec) ElementPopover · PreviewStateToggle · (Sheet 17)
API
     GET/POST /api/creator/catalog                LIVE + (add new fields scheduled)
     PATCH/DEL Each /api/creator/catalog/[itemId]   LIVE
     modules/lessons CRUD (7 routes)              LIVE
     POST /api/creator/upload                      LIVE
     POST /api/creator/playground/ai  (LIVE)
     GET /api/creator/ai-summary                   LIVE
     🆕 payment_handling ('in_app'|'external_link') per item — in-app = PayPal checkout
        (default); external = opt-in with quarantine warning (playground.md 2c + creators.md 1c)
     🆕 GET/PUT /api/creator/playground — creator row read + deploy write (auth-guarded)
LOCALSTORAGE   playground_draft_${creatorId} (G21 — done in A1.5 rename) · banner dismissed fixed in #5
PWA (Sheet 17)   app install/deploy writes constants; manifest generated per f
DEPENDED    #1–5, #12 (chat feature push/fan) → editor tab messaging #2 type items, #16 (item affiliate fields), #17
```

---

## SHEET 20 — Partner page

```
SCREEN: Partner page · /[username]/partner/[partnerUsername] ·  spec: partner-page.md
──────────────────────────────────────────────────────────────────────────────
ENTRY       app/(fan)/[username]/partner/[partnerUsername]/page.tsx
            => src/screens/fan/partner/Screen.tsx   (thin page re-export)
SEARCH?     No — a **modal** from the fan Connect tab. Follow/unfollow + view a collab partner’s catalog.
COMPONENTS    ProfilePage (fan-auth gate + branding resolve + #list featured + social links)
ROUTES         POST /api/fan/follow      LIVE (follow toggle)
LIB            branding.ts (per-partner slash), CreatorService (get partner), fan/follow
TABLES       creators · fan_follows
DEPENDED…    10 (fan login), full fan shell (20) for chick context
```

---

## SHEET 21 — Fan shell (5 screens, one unit of work)

> **✅ 2026-08-31 — Fan shell full spec pass COMPLETE:**
> Home tab rebuilt as 7-section activity hub (Spotlight, New from creator horizontal queue,
> Updates from partners you follow, Community section via `FanCommunitySection`, Your activity,
> Upcoming live events, Announcements) · Community fan UI wired (Home section + guest "Join the
> community" card → FanAuthModal + Connect community card → deep-link Home) · Connect tab
> completed (All Partners + Followed two-column layout, deal-weighted billboard rotation,
> Artist Links) · Partner bottom modal (`PartnerModal`) replacing full-page navigation, follow
> toggle persisted to `fan_follows` table · Settings completed (Subscription card, 4 notification
> toggles — New drops / Lives & events / Partner updates / Announcements, payment methods stub)
> · `fan_follows` table added to mock store + typed + follow route rewritten to persist ·
> `/api/fan/partners` returns real followed list + deal weights for billboard.
>
> **Still deferred:** push broadcasts (Bell/notify = local toggle + `/api/push/subscribe`),
> billing history.
>
> **2026-09-23 (Recognition + Receipts):** fan session = Model B (one `fan_session` cookie,
> per-creator token map — `fanSession.ts`); purchase completion ALWAYS sets the session
> (G1); receipts visible to guest-buyers/followers on the guest page (G2). **Parked as
> future work:** claim purchases (G3 — merge purchases under a different-email account),
> cross-creator purchase hub (G4), real PayPal SDK/webhooks (G5). Money philosophy:
> app stays OUT of creator↔fan money flows — creators process PayPal/Stripe sales and keep
> 100%; platform revenue = creator-paid plans/subscriptions via Paddle/LemonSqueezy/Gumroad
> (decision deferred to end of dev).

```
SCREEN: Fan shell · /[username] ·  spec: fan-shell.md (Parts 1–4)
Detail — 5 surfaces:

    [21a] GUEST     /[username]/guest
          guest view; 3-layer: header / spotlight / house feed; “Sign up to join” for community;
          FOLLOW TIER: “Follow [creator]” email box (email-only → no-password fan_accounts row +
          sets fan_session) — render rule: no-password session = FOLLOWER state (personalized
          guest page), NOT the 4-tab app
    [21b] HOME      /[username]/home
          (fan logged in) Activity Hub: spotlight + catalog feed + community section + updates
    [21c] CONTENT   /[username]/content
          catalog with gates (free / owned / subscribe / lock) + The Bell (notifications)
    [21d] CONNECT   /[username]/connect
          **smart live-stack (DECIDED, 2026-08-05)**: Partner Billboard → All Partners/Followed →
          Community (deep-link Home) → Artist Links → empty-state text (connect_empty_text)
          **(renamed 2026-10-14 + BUILT same day: "Partner Billboard" → "The Lineup",
          content swapped to rotating partner-spotlight heroes — `fan-shell.md` Part 4c;
          mechanism/weights/dots/modal/hop unchanged; `/api/fan/partners` rows carry gated
          `featured_item` (per-fan purchases honored); no-featured partners keep the avatar-card
          slot; `billboardIndex` → `lineupIndex`; button innards div/p → spans (valid HTML))
    [21e] SETTINGS  /[username]/settings
          account, device, the Bell, privacy (allow-anyone toggle) …

SHARED    FanAppShell (frame + logo), FanBottomNav (5 tabs), FanAuthModal, CreatorHeader,
          GuestPageContent, FollowButton, PoweredByFooter, 4 old tabs (HomeTab-old etc.)
API (already live)  register · login · forgot/reset · session · install ·
                     follow · content/access · content/list · comments · reactions
NEW APIs            fan/follow-creator (email-only → no-password row + sets fan_session);
                     push/subscribe accepts EMAIL-KEYED device subscriptions (followers)
                     PAYPAL CHECKOUT (2026-08-10): /api/paypal/* replaces stripe/checkout as the
                     v1 rail — create/capture order + webhook → fan_purchases; guest email-only
                     checkout unchanged; stripe/checkout stays as deferred Atlas reference;
                     settlement runs post-capture via Sheet 16 engine (invisible to fans)
                     🆕 (V1) fan/purchases GET (session email receipts) · fan/purchases/complete
                     POST (mock webhook: records fan_purchases) · fan/logout POST (clearFanSession)
ROUTES (fan APIs)   (fan/dashboard GET removed 2026-09-28 — fanShellData.ts serves the fan view)
NEW hooks           useFanSession? or reuse fanSession cookie
TABLES              fan_accounts (password_hash NULL = Follower) · fan_session ·
                    fan_purchases · content_items · fan_follows · subscriptions ·
                    push_subscriptions
DEPENDED   EVERYTHING: #12 (f feedback/community), #17 branding (looks ~ every page),
           #20 partner modal, #3 theme, fan APIs live. LAST LISTED → consumer.
```

======

## SHEET 22 — Offline

```
SCREEN: Offline ·  /offline  ·  spec: offline.md (PWA app-shell)
────────────────────────────────────────────────────────────────────
ENTRY    app/(public)/offline/page.tsx → src/screens/offline/offline/Screen.tsx
GOAL     the shared /offline fetched screen for all 3 PWAs; SW pre-iscaches already LIVE
COMPON  PAGE offline app-shell (healthy: 3 shells use then) + tiny-pocket storage + queue-flush note
SW      public/sw.js (live) — pre-cache builds caching on the devex; keep
STORAGE  NEW small-pocket: localStorage for offline queue + draft auto-save (playground
         draft key) · outbox for messaging if not left in part 5
DEPENDED
```

## SHEET 19b — Landing (LIVE — base 2026-09-14, Phase 4 extras 2026-09-29)

```
SCREEN: Landing → /  · spec: landing.md (full — un-parked 2026-09-29)
────────────────────
LIVE  base page (hero / how-it-works / features / comparison / footer) +
      Phase 4 extras (components/landing/):
      - CreatorShowcase — marquee of ALL creators (featured first,
        max 12, hidden below 2; CSS loop in styles/globals.css; pool
        de-gated 2026-10-09 with the show_in_search removal)
      - LandingAuthModal — nav Sign in opens LoginForm in a dialog (stays on /)
      - LandingInstallButton — platform PWA #1 install (iOS/in-app show manual steps)
      - YourCreatorsRow — returning-fan row (fan_session → email → fan_accounts
        → creators; renders ONLY when recognized — privacy rule, landing.md)
STILL DEFERRED: landing search section (embed shared Search per Sheet 11).
```

---

## SHEET 23 — Earnings (new money screen)  ·  spec: screens/creator-dashboard/earnings/earnings.md

```
SCREEN: Earnings ·  /dashboard/earnings  ·  spec: earnings.md  (NEW 2026-10-10 — spec'd, NOT wired)
────────────────────────────────────────────────────────────────────
ENTRY       app/(shell)/dashboard/earnings/page.tsx (2-line address book)
            → src/screens/creator/earnings/Screen.tsx
            → src/components/earnings/EarningsPage.tsx
NAV         lib/nav-config.ts — NEW item (DollarSign) AFTER Playground, before
            Settings; phone bottom bar gains a cell (verify labels @375px)
COMPONENTS  EarningsPage (new) · SalesSection (new) · AffiliateSection (new:
            EarnedCard/OwedCard/ReceiptRow/RedCardBanner) · PaymentsSection (new:
            PayPalHandleCard) — PLUS two MOVES:
              git mv components/network/EarningsSummary.tsx  → components/earnings/
              git mv components/settings/PaymentsPanel.tsx   → components/earnings/
            (NetworkPage.tsx drops its EarningsSummary render; settings/Screen.tsx
            drops PaymentsPanel — settings.md Part 2 stays a pointer stub)
ROUTES      NEW   GET  /api/creator/earnings/sales          (§1 list + server total)
            EXTEND GET /api/creator/affiliates/earnings     (both directions + receipt
                 fields + red_card + lazy ladder notices — idempotent via reminders_sent)
            NEW   POST /api/creator/affiliates/conversions/[id]/settle
                 { action: mark_paid | confirm | dispute } — role-checked, idempotent
            NEW   PUT  /api/creator/earnings/paypal         (paypal_handle)
            NEW   GET  /api/admin/disputes · POST /api/admin/disputes/[id]/resolve
LIB         computeRedCard(userId) (NEW — one impl: deals POST 403 · engine pause ·
            earnings banner) · SETTLEMENT_DUE_DAYS = 14 in lib/limits.ts
            ladder evaluation lives in the earnings GET (PRODUCTION-NOTE: cron at
            migration) · emails via mockResendSend (contract = forgot-password)
TABLES      creators + paypal_handle (new, nullable)
            affiliate_conversions + due_at, owner_paid_at?, confirmed_at?,
            disputed_at?, dispute_reason?, reminders_sent, last_reminder_at?
            settlement_status gains 'awaiting_confirm'
            (receipt protocol — earnings.md Part 6 / creators.md 2f)
EXTEND      GET /api/creator/activity — describe() + mock RPC get_creator_activity
            gain affiliate events (affiliate_earned, payment_due/overdue/marked/
            confirmed, dispute_opened) so Overview's timeline shows money moves
DEPENDS ON  16 (deals + conversions + earnings route), 18 (rail unmount), 10 (activity)
NOTE        report-only screen: no balance/Cash Out, platform 0% — wallet language
            forbidden (earnings.md Concept). Red Card = protocol holds only, ZERO
            PayPal code in v1; multiparty split + licence check = migration pass
            (creators.md 2e2 production note). Mobile bar 5 cells (6 for admins).
```

> **Also in this sheet's blast radius (spec-phase decisions 2026-10-10):**
> - **Creator-only scope** drops `scope` everywhere: `AffiliateDealForm` (scope select + item picker) · `POST /api/creator/affiliates/deals` zod (`z.enum(["item","creator"])`) · `scopeMatches` in `lib/affiliateAttribution.ts` · the "Per-item/Per-creator" badges in `YourDealsCard`/`AffiliateDiscover`/`AffiliateLinks` · `AffiliateDeal.type`/`AffiliateConversion`/`Attribution` scope fields in `types/index.ts` · `content_items.affiliate_enabled`/`affiliate_rate` readers (parked). External-link items = automatic non-conversion (no purchase row, no warning UI).
> - **The in-app hop (Door 2):** one small rate-limited endpoint (e.g. `POST /api/fan/hop`) that mirrors `/ref/[code]`'s cookie + attribution write, called on partner-modal / partner-page OPEN; resolves the active host↔promoter deal (creator-only → single lookup; no deal = no-op). Shares `lib/affiliateAttribution.ts` with Door 1.
> - **Deals POST 403** when `computeRedCard` says 🟥 (lock ①) · engine pauses owner-side deals while red (lock ②) · settle route enforces grace-cure (a hold never blocks a payment that clears the payer's own arrears).

> **✅ ADDENDUM (2026-10-12) — §2b: the affiliate management block moves in here ("A1"):**
> `git mv` `AffiliateDealForm` · `YourDealsCard` · `AffiliateDiscover` · `AffiliateLinks` from `components/network/` → `components/earnings/` + NEW `AffiliateDealsSection.tsx` (heading "Affiliate deals" + `＋ New deal` toggle + the four widgets sharing one `dealsKey` — state moved verbatim from NetworkPage). `EarningsPage` order: Sales → AffiliateSection → **AffiliateDealsSection** → Payments. `AffiliateSection`'s "create one in Network" empty-state link → "create one below". Rail on Sheet 18 loses the block (round-4 addendum). **Relocation only** — no deal-logic changes (money batch parked). Smoke 2026-10-12: 4 pages 200 · Network HTML has no `+ New deal`/Affiliates · Earnings has the heading + button · deal POST 201 → list 200 → DELETE cleanup · gates green (typecheck 0 · lint 0 · check-docs 420).

> **✅ ADDENDUM (2026-10-12, later) — Batch B: §2b shrinks + hardens:**
> `AffiliateDiscover` **retired** (component + `GET /api/creator/affiliates/discover` route deleted — deals are negotiated, never browsed); `AffiliateDealForm` gains partner-only helper text (server `POST /affiliates/deals` 403s without a non-ended partnership — Sheet 16/`creators.md` 2b2); `YourDealsCard` revoke toast = *"Deal revoked — future sales no longer earn commission."* (revoke = prospective-only); `AffiliateLinks` empty state points at the chat card; `POST /api/creator/affiliates/link` is now **promoter-only** (was: any creator could mint a `/ref` code for any deal). Companion work on Sheets 12 (proposal cards) + 18 (Circle `DealDialog`).

---

## Glossary of statuses used in this plan

`LIVE` already working · `NEW` create it · `EXTEND` add fields/logic · `ADAPT` move from old-code · `PROMOTE` rebuild from old-code · `MERGE` combine duplicates · `DEFERRED` skip (post-launch) · `DELETE` remove.

---

*Both maps live at the root: learn layout at `CODEBASE_INVENTORY.md`, decide what to build at `CODEBASE_AUDIT.md`, and this `WIRING_PLAN.md` is the “how-to sheet” for Phase F. When the founder says “go” on a sheet (in the Phase F pass), I read its spec, wire it, run the three checks, and report back — one at a time.*