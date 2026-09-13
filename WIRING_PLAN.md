# CreatorBioTree — Wiring Plan (Phase F)

> **What this is:** the per-file, spec-first blueprint for wiring every screen + feature, one at a time. Each block is a **connection map** — what your hands touch (entry, components, hooks, API routes, lib, services, tables, old-code patterns, dependencies) when we wire that screen. No code lives here; this is the map you read before we open the editor.
>
> **The rule (AGENTS.md):** we wire from the `src/wiredLater/` spec ONLY. Old code is opened only where a sheet says "see old-code for the pattern." After EVERY wired piece: `npm run typecheck` + `npm run lint` + `python scripts/check-docs.py` must stay green.
>
> **When (the phase gate):** this plan executes in ONE pass at the very END — **Phase F** (docs/ROADMAP.md), after EVERY spec is written AND approved. Nothing in these sheets gets wired before that. "Go on sheet N" means the final wiring pass has started.
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
> data produced elsewhere; My-App (19) and Fan Shell (21) PRODUCE that data and give the
> founder something to click today. New execution order:
>
> 1. **My-App (Sheet 19) — V1 CORE slice** (Phase 1 scope: phone shell, PreviewStateToggle,
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
| 2 | `types/index.ts` — rename `Playground*`→`MyApp*` + add feature/column types | EXTEND |
| 3 | `lib/branding.ts` — 7 missing presets + Part 9 fields | EXTEND |
| 4 | `mockDataStore.ts` + `mockSupabaseClient.ts` — 14 new tables + RPCs | EXTEND |
| 5 | Delete dead files + add missing rate limits (G7) + `pageview` → singleton | housekeeping |
| **6** | **Login** `/login` | screen — ✅ done 2026-08-10 |
| **7** | **Onboarding** `/onboarding` | screen — ✅ done 2026-08-10 |
| **19-V1** | **My-App** `/dashboard/my-app` — **V1 CORE** (reordered 2026-08-11) | screen — ✅ done 2026-08-11 (editor Option A; B/C/D deferred) · ✅ **ALL 16 CATALOG TYPES wired 2026-08-13 (Stage A of the Connected Loop Pass):** AddItemPicker + ItemEditor per-type sections (course lessons, session booking slots, membership benefits + billing cycle, physical/product variants + stock, bundle picker, live platform/stream, page body) + fan cards render every type with gates (memberships now check out; purchased-before-member gate fix) + PATCH schema gains `variants`/`booking_slots`. Verified end-to-end via curl (create → rich PATCH → fan-page render → delete). · **NOTE (2026-08-13):** real-mode must ENFORCE the 7-day lock server-side for App Name + App Icon + Display Name (specced in `features/branding.md` Part 9 — currently UI-note only, never enforced) |
| **21-V1** | **Fan shell** — Guest · Home · Content · Connect · Settings — **FULLY WIRED** | screens — ✅ done 2026-08-11 (v1 core) · ✅ **Fan shell full spec pass 2026-08-31:** Home tab rebuilt as 7-section activity hub (Spotlight, New from creator, Updates from partners, Community section, Your activity, Upcoming, Announcements) · Community fan UI wired (Home section + guest "Join the community" card + Connect community card) · Connect tab completed (All Partners + Followed two-column layout, deal-weighted billboard rotation, Artist Links) · Partner bottom modal (PartnerModal) replacing full-page navigation, follow toggle persisted to `fan_follows` · Settings completed (Subscription card, 4 notification toggles, payment methods stub) · `fan_follows` table added to mock store |
| **8** | **Admin** `/admin` | screen — ✅ done 2026-08-30 |
| **9** | **Settings** `/dashboard/settings` | screen — ✅ done 2026-08-30 |
| **10** | **Overview** `/dashboard/overview` | screen — ✅ done 2026-08-30 |
| **11** | **Search** `/search` | screen — ✅ done 2026-08-30 |
| **12** | **Messaging** — `ChatShell` + 12 routes + 7 tables | feature — ✅ done 2026-08-17 (engine + inbox) · ✅ **Part 3 Community wired 2026-08-31** (fan Home section + guest CTA + Connect card + channels + join/leave) |
| **13** | **Partnerships** — 2 routes + invite card + `source` column | feature — ✅ done 2026-08-30 |
| **14** | **Relationships / My Peeps** — 3 routes + 3 fan_accounts cols | feature — ✅ done 2026-08-30 |
| **15** | **Team** — 8 routes + 3 tables | feature — ✅ done 2026-08-30 |
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

> **Purpose:** the codebase's single source of truth. Fix the drift the specs flagged: the types were renamed `MyApp*` in the specs but the live code still says `Playground*`. Also sponsor all new feature types so later sheets can reference them.

| Action | Change |
|---|---|
| ~~`RENAME`~~ ✅ | `PlaygroundTheme` → `MyAppTheme`; `PlaygroundColors` → `MyAppColors`; `PlaygroundProfile` → `MyAppProfile` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | messaging types: `Conversation`, `ConversationMember`, `Message`, `MessageAttachment`, `MessageRequest`, `BlockedUser`, `CommunityChannel` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | team types: `TeamMember`, `TeamInvite`, `TeamActivity` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | affiliate types: `AffiliateDeal` (deal_type/scope/trigger/rate/status), `AffiliateAttribution`, `AffiliateConversion`, `AffiliateLink` — **done 2026-08-07** |
| ~~`ADD`~~ ✅ | relationships: `FanAccount` + `do_not_contact`/`notes`; `Partnership` + `source` (`invited`/`collab`); `FanProfile` — **done 2026-08-07** |
| ~~`EXTEND`~~ ✅ | `Creator` → `tagline`, `collab_style` (network.md); `connect_empty_text` (branding.md Part 9 #5) — **done 2026-08-07** |
| ~~`EXTEND`~~ ✅ | `ContentItem` → `affiliate_enabled`, `scheduled_publish_at`, `scheduled_unpublish_at` (affiliate_rate already existed) — **done 2026-08-07** |
| `ADD` | `theme_presets` type (if using standalone `themePresets.ts`) — decide at wiring |
| SPEC | branding.md · network.md · relationships.md · team.md · partnership.md · my-app.md · monetization/creators.md |
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
| `mockDataStore.ts` → `TableName` union | ~~`conversations`, `conversation_members`, `messages`, `message_attachments`, `message_requests`, `blocked_users`, `communities`, `creator_team_members`, `creator_team_invites`, `creator_team_activity`, `affiliate_deals`, `affiliate_attributions`, `affiliate_conversions`, `affiliate_links`~~ — **all 14 done ✅ 2026-08-07 (29 total)** |
| `mockSupabaseClient.ts` | JOIN_REGISTRY entries for each new FK + RPC handlers for affiliate/team/community where the spec calls for them |
| Keep | all 15 existing tables + no `admin_accounts` seeding (starts empty) |
| SPEC | messaging.md Part 5 · team.md · monetization/creators.md Part 2f |
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
| RENAME | localStorage key `playground_banner_dismissed` → `my-app_banner_dismissed` (G21) |
| ~~EXTEND~~ ✅ | missing rate limits (G7): `creator/check-username`, `fan/follow`, `fan/install`, `fan/forgot-password`, `push/subscribe` — **all added 2026-08-07** |
| ~~MERGE~~ ✅ | `api/creator/pageview` throws its own Map → use the `rate-limiter` singleton — **done 2026-08-07** |

---

## SHEET 6 — SCRECO: Login ✅ DONE 2026-08-10

> **MOCK AUTO-LOGIN (2026-08-10):** mock mode now auto-provisions a session in `proxy.ts` — `/dashboard*` logs in as the seeded test creator (`test@creatorpwa.app`, Link Address `test`, id `mock-test-creator`), `/admin*` as the seeded admin (`admin@creatorpwa.app`, id `mock-admin`). `/login` + `/onboarding` are bypassed on purpose while inside-app sheets (8–23) are built. **⚠️ REMOVE the auto-provision block in `proxy.ts` during the final auth pass** (before real-mode migration), then re-test login/onboarding against a clean flow. The `seedMockTestCreator()` seed in `mockSupabaseClient.ts` can stay as sample data. Also fixed: cookie hydration now creates the server-side creators row (mock store split), killing the `/onboarding` ↔ `/dashboard/my-app` redirect loop.
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

> **Wired:** `src/screens/public/onboarding/Screen.tsx` (server: sanitized `?invite=` passthrough — alphanumeric/`_-`, ≤100 chars; already-logged-in redirect to `/dashboard/my-app`) · `src/components/auth/OnboardingForm.tsx` (promoted + Link Address field with debounced live availability, permanence confirm dialog, `?invite=` title + metadata capture) · **NEW** `POST /api/creator/register` (auth-guarded upsert of username+display_name, format+availability validation) · `check-username` relaxed to **anonymous** (Link Address availability is checked pre-signup) + full `^[a-z0-9_]{3,20}$` server validation. Partnership auto-connect deferred to Sheet 13 (route stays 501 stub — spec Part 2). Gates green.

```
SCREEN: Onboarding  ·  /onboarding  ·  spec: onboarding.md (DEFERRED signup)
──────────────────────────────────────────────────────────────────────────
ENTRY       app/(public)/onboarding/page.tsx
            → src/screens/public/onboarding/Screen.tsx
COMPONENTS  OnboardingForm (PROMOTE old-code/OnboardingForm — add ?invite=, Link Address field)
            AuthCard (shared)
ROUTES      POST /api/creator/register (mock cookie) → creates creator row
            ?invite=CODE param → partnership.md flow (built Sheet 13)
            redirect success → /dashboard/my-app
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
TABLES      admin_accounts · admin_activity_log · admin_invites (new audit log if live only)
OLDCODE     dashboard-admin/page-old.tsx · requireAuth.ts
DEPENDS ON  1 2 5 — RBAC+all 7 routes already live; re-skin UI from spec
NOTE        founder setup `/founder/setup?token=` — spec only, skip in Phase F
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

---

## SHEET 10 — Overview

```
SCREEN: Overview ·  /dashboard/overview  ·  spec: overview.md
────────────────────────────────────────────────────────────────
ENTRY       app/(creator)/dashboard/overview/page.tsx
            → src/screens/creator/overview/Screen.tsx
COMPONENTS  StatCards (AnalyticsWidgets) · ActivityTimeline (DashboardTimeline) ·
            SetupChecklist · QuickActions (Edit My-App, Install app) ·
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
ROUTES      GET /api/search/creators    (NEW — search index: is_discoverable, username/display_name ilike)
LIB         search-utils.ts (PROMOTE) · CreatorService (getByUsername already)
TABLES      creators (read — is_discoverable, is_featured, created_at for ranking)
MERGE       CreatorSearchInput vs SearchFilters → ONE (SearchFilters wins)
            CreatorCard vs CreatorResultCard → ONE card
DEPENDS ON  1 2 3 — landing search section deferred (Sheet 23)
```

---

## SHEET 12 — Messaging (engine, consumed everywhere) — ✅ DONE 2026-08-17 (Part 3 Community wired 2026-08-31)

> **Purpose:** THE WhatsApp-style inbox: floating 💬 on every screen, 1-on-1 between all parties, requests + block + toggles, group + announcements, Community (Home tab). Build the engine first; screens reuse it.

> **DONE 2026-08-17 (Stage B of the Connected Loop Pass):** `src/components/chat/ChatShell.tsx` (single file: useChat, useUnreadBadge, ChatInboxPopover, ChatShell, ChatThread, MessageList, MessageBubble, MessageComposer, AttachmentPreview, ChatIcon, GuestContactModal) + 12 routes under `/api/chat/*` + `chat_prefs` table (added to the 7 spec tables) + `src/lib/chat.ts` helpers (getChatIdentity, resolveParticipantNames, isBlocked, getPrefs/setPrefs). Wired: dashboard layout floating inbox + `/dashboard/messages`; fan shell header ChatIcon + floating inbox; fan-page messaging catalog item → ChatIcon (identity) / email-capture unlock box (guest); guest "Contact" button → GuestContactModal (email capture → follow row → direct chat). Verified end-to-end via curl: direct chat fan↔creator, unread + read receipts, allow-anyone gate → Requests folder → approve (queued first message delivered), block both directions, group + announcements-only, upload route. Also fixed two real mock bugs (auth singleton leak across requests; chat_prefs writes silently dropped).
> **✅ Part 3 Community wired 2026-08-31:** `FanCommunitySection.tsx` (Home tab section with join/leave + channel list), guest-page "Join the community" card → FanAuthModal, Connect-tab community card → deep-link Home. `fanShellData.ts` now fetches community + channels + fan membership status server-side. Community join/leave routes already existed from the engine build.

```
FEATURE · MESSAGING  ·  spec: messaging.md (Parts 1–7)
──────────────────────────────────────────────────────────
CONPOC     src/components/ChatShell.tsx — single file → useChat, ChatInboxPopover, ChatThread,
           MessageList, MessageBubble, MessageComposer, AttachmentPreview, ChatIcon, useUnreadBadge
             (fresh build, NO old-code reference)
ROUTES     all under /api/chat/* (11):
           GET/POST  conversations
           GET/POST  conversations/[id]/messages
           PATCH/DEL messages/[id]
           POST      conversations/[id]/read
           POST/DEL  conversations/[id]/members
           PATCH     conversations/[id] (rename/pin/announcements)
           POST      chat/upload (reuse /api/creator/upload)
           GET/POST  chat/requests · POST chat/block · GET chat/blocks
           GET       chat/unread · PATCH chat/preferences
TABLES     conversations · conversation_members · messages · message_attachments ·
           message_requests · blocked_users · communities   (all NEW — #4)
REUSE      guest contact = email capture per Part 2 (no magic link — deleted 2026-08-08)
PLACES     inbox on every dashboard page + fan shell + network chat icons + partner page
DEPENDS ON  1 2 4 (tables) — needs all the table layering from #4
```

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
            subscription, install history, messages via ChatShell)
API ROUTES  GET    /api/creator/fans/list        LIVE (stats)
            GET    /api/creator/fans/export      EXTEND (LTV, ref-by, consent flag)
            PATCH  /api/creator/fans/[id]        NEW (do_not_contact, notes)
            GET    /api/creator/fans/[id]        NEW (profile drawer data)
            GET    /api/creator/relationships   NEW — "MY PEEPS" umbrella (counts + lists)
TABLES      fan_accounts (+ 3 new cols in #2) · fan_installs · fan_purchases ·
            subscriptions · conversations (read for history)
OLDCODE      FanStatsCard.tsx · CreatorManagementWidgets.tsx (FanExportButton)
DEPENDED     #3 #4 (columns) #12 (ChatShell in profile drawer) — builds into Network right rail
```

---

## SHEET 15 — Team (Staffs row, My Peeps)

```
FEATURE: TEAM  ·  spec: team.md  (Model A — regular accounts, permission toggles)
──────────────────────────────────────────────────────────────────────────
COMPONENTS   TeamRow (My Peeps Staffs row) · PermissionsToggles · InviteEmail · ContextSwitcher
ROUTES (8, all NEW, /api/creator/team/*)    POST invite · GET invites · POST invites/accept
           GET members · PATCH/DEL member · GET activity · GET contexts
TABLES       creator_team_members · creator_team_invites · creator_team_activity  (NEW, #4)
AUDIT        audit log IN v1 (owner only)
REUSE       creators table + mock_auth_uid (no auth change)
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

---

## SHEET 17 — Branding display utilities (apply theme)

> **Purpose:** all the "last mile" of the branding system that the fan shell + My App / dashboards consume. Build/apply after the resolver (#3) is extended but before the big screens.

| Item | What |
|---|---|
| `PreviewStateToggle` | Draft/Live toggle component, shared between My App + owner's "View my app" (my-app.md Part 1b) |
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
                   ChatIcon (←12) on each creator line
ROUTES /api/creator/partners/*   request POST · respond POST · list GET · discoverable GET ·
                                   billboard GET/PUT   (NEW — parterride rebuild old routes)
           + fan/creator/fans/export GET (from #14)
TABLES   partnerships · partner_invites · affiliate_* · fan_accounts infra
OLDCODE   allScreens/network/page-old.tsx · network-page-old.tsx · partnershipService-old.ts · creator search kit
DEPENDED  EVERYTHING: 1–5, 11 (search) 12 (chat icons) 13 14 15 16 (rails) 17 (branding)
ORDER     18/23 — the most shelf-heavy (Need Themes like).
```

---

## SHEET 19 — My-App (biggest screen)

> **🔀 2026-08-11 — reordered to FIRST, V1-CORE scope (test-first):** wire Phases 1–2
> of my-app.md Part 6 now; Phases 3–5 deferred. V1-CORE = full-screen phone shell + 5
> swipeable surfaces + PreviewStateToggle + Deploy · ElementPopover tap-to-edit (brand
> layer) · editor sheet **Option A** (8-tab strip) with **Identity, Design, Catalog,
> Artist Links LIVE** + Integrations/Email/Media-Kit/Spotlight "coming later" panels ·
> catalog = **7 core types (link, image, video, product, tip_jar, newsletter, messaging)**
> via CatalogManager+AddItemPicker+PricingEditor · auto-save (3s `my-app_draft_${id}`)
> + Unsaved-Changes modal · NEW GET/PUT `/api/creator/my-app` (creator-row read + deploy).
> **DEFERRED (v1):** item types course/session/membership/physical/bundle/live/pdf/audio/page,
> Spotlight tab, Funnels, Integrations/Auto-DM, Email campaigns, Media kit, AI Copilot,
> editor options B/C/D (all remain spec'd — additive wiring later).

```
SCREEN: My App ·  /dashboard/my-app  ·  spec: my-app.md
│──────────────────────────────────────────────────────────
ENTRY    app/(creator)/dashboard/my-app/page.tsx → src/screens/creator/my-app/Screen.tsx
SUMMARY “THE editor”: full-screen phone preview (guest-first, swipeable 5 surfaces),
       tap-to-edit popovers, editor tab sheet (8 tabs, 16 content types), auto-save,
       Draft/Live state toggle, deploy button
LAYOUT(8 tabs)     Identity · Design · Catalog · Artist-Links · Integrations · Email ·
                    Media Kit · Settings weave (my-app list)
COMPONENTS (mostly PROMOTE from old-code)
   PhonePreview  → full screen phone
   AppIdentityTar · GlobalSettings · BottomPanel|BottomEditor → tabs
   MyAppForm (was usePlaygroundForm) → form+draft
   AutoSave (useAutoSave.tsx)
   17 editors (catalog/* → one per type) via CatalogManager + AddItemPicker + PricingEditor …
   CoverUploader · Customization
NEW (spec) ElementPopover · PreviewStateToggle · (Sheet 17)
API
     GET/POST /api/creator/catalog                LIVE + (add new fields scheduled)
     PATCH/DEL Each /api/creator/catalog/[itemId]   LIVE
     modules/lessons CRUD (7 routes)              LIVE
     POST /api/creator/upload                      LIVE
     POST /api/creator/my-app/ai  (LIVE)
     GET /api/creator/ai-summary                   LIVE
     🆕 payment_handling ('in_app'|'external_link') per item — in-app = PayPal checkout
        (default); external = opt-in with quarantine warning (my-app.md 2c + creators.md 1c)
     🆕 GET/PUT /api/creator/my-app — creator row read + deploy write (auth-guarded)
LOCALSTORAGE   my-app_draft_${creatorId} (G21 — done in A1.5 rename) · banner dismissed fixed in #5
PWA (Sheet 17)   app install/deploy writes constants; manifest generated per f
DEPENDED    #1–5, #12 (chat feature push/fan) → editor tab messaging #2 type items, #16 (item affiliate fields), #17
```

---

## SHEET 20 — Partner page

```
SCREEN: Partner page · /[username]/partner/[partnerUsername] ·  spec: partner-page.md
──────────────────────────────────────────────────────────────────────────────
ENTRY       app/(fan)/[username]/partner/[partnerUsername]/page.tsx
            => src/screens/fan/partner-page/Screen.tsx   (thin page re-export)
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
> claim purchases, billing history.

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
ROUTES (fan APIs)   fan/dashboard GET (fan personal view)
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
STORAGE  NEW small-pocket: localStorage for offline queue + draft auto-save (my-app
         draft key) · outbox for messaging if not left in part 5
DEPENDED
```

## SHEET 19b — Landing (DEFERRED)

```
SCREEN: Landing → /  · spec: landing.md (DEFERRED post-launch)
────────────────────
KEEP NAKED  for now. Wire when the project goes to market (post-launch polish pass).
Archive has the full old kit: LandingHeader, + HeroSection etc — untouched.
When wiring, embed the shared Search component (Sheet 11).
RETURNING-FAN ROW (spec'd 2026-08-08): “Your creators” = fans AND email-only followers
(fan_session cookie → email → all fan_accounts rows; follow-creator route sets the same
cookie — Sheet 21). Query can ship with the fan shell.
DEPENDED  NOT NOW — leave page.tsx naked (`export { default } from screen`).
```

---

## Glossary of statuses used in this plan

`LIVE` already working · `NEW` create it · `EXTEND` add fields/logic · `ADAPT` move from old-code · `PROMOTE` rebuild from old-code · `MERGE` combine duplicates · `DEFERRED` skip (post-launch) · `DELETE` remove.

---

*Both maps live at the root: learn layout at `CODEBASE_INVENTORY.md`, decide what to build at `CODEBASE_AUDIT.md`, and this `WIRING_PLAN.md` is the “how-to sheet” for Phase F. When the founder says “go” on a sheet (in the Phase F pass), I read its spec, wire it, run the three checks, and report back — one at a time.*