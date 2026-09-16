# How the App Works — Complete Reference

> As-of: August 2026. Running in **mock mode** (`USE_MOCKS=true`). All external services are in-memory mocks. **Wired so far (Phase F):** login, onboarding, forgot-password, the My App editor (all 16 catalog item types incl. device file uploads), the fan shell (guest + 4-tab app, mock PayPal checkout), the full messaging engine, dashboard overview, network, settings, search, admin, and all feature families (partnerships, team, relationships, affiliates, community). Landing page is the only unwired screen. "Mock-as-Draft Philosophy" below explains the mock system.

---

## 1. The Big Idea

Creators get their own **installable phone app** (PWA) that fans add to their home screen. No app store. The creator customizes it in a dashboard — branding, content, collabs. Fans install, sign up, and access paid/free content.

### Three installable PWAs on one domain

| PWA | What it is | URL |
|---|---|---|
| **#1 Main Platform** | Landing page, login, onboarding | `/` scope `/` |
| **#2 Creator Dashboard** | Manage your creator app | `/dashboard/*` |
| **#3 Fan Shell** (per-creator) | The app fans use | `/[username]/*` |

Each has its own `manifest.json` — browsers treat them as separate installable apps.

---

## 2. The Visitor (Landing Page — `/`)

A basic marketing page with hero section, "How it works" steps, feature comparison vs Linktree, and CTA to sign up. **Status: Skeleton.** Will be enhanced later.

---

## 3. The Login & Onboarding (`/login`, `/onboarding`)

**Login:** Enter email + password. In mock mode, any email/password creates a new account.

**Onboarding (for new creators):** Display name, email, password (min 8 chars). Optional `?invite=XXX` param for partnership referral. After onboarding, redirected to `/dashboard/my-app`.

---

## 4. The Creator Dashboard (`/dashboard/*`) — PWA #2

### 4.1 Sidebar

**Sidebar (≥`md`):** visible on tablet/desktop. On phones, a bottom bar (Overview/Network/My App/Settings + More → drawer) replaces the sidebar. A floating 💬 **chat inbox bubble** (the messaging engine) sits bottom-right on every `/dashboard/*` page.

The planned sidebar (when the dashboard shell is wired) is:

| Link | What it does |
|---|---|
| **Overview** | Home page — stats, action center, link/QR, export |
| **Network** | Partner discovery & collaboration |
| **My App** | See + edit your fan shell in one full-screen surface (formerly "Playground" + "View My App") |
| **Settings** | Account/security, payments, notifications, messaging & privacy |
| **Admin Panel** | (Admin only) Platform management |
| **Install my fan app** | (persistent) Installs your branded fan PWA on your phone |
| **Messages** | (persistent, badge) Fan/guest conversations |
| **Visit CreatorBioTree** | Opens main platform in a new tab |

### 4.2 Overview (`/dashboard/overview`)

**WIRED (Sheet 10, 2026-08-30).** 4 stat cards (Page views, Content items, Fans, Revenue), activity timeline, setup checklist, quick actions (Edit My App, View my page, Install my fan app), share page button + QR code card + fan CSV export (includes total spent). Spec: `screens/creator-dashboard/overview/overview.md`.

### 4.3 My App (`/dashboard/my-app`)

The one surface for seeing + editing the fan shell (founder decision 2026-08-05 — replaces the old Playground editor and the old "View My App" action). **WIRED (Sheet 19-V1, 2026-08-11 + upload pass 2026-08-19).** Full-screen phone preview with the **guest page first**; swipe Guest → Home → Content → Connect → Settings (they render the REAL fan components). **Tap any visible element** (background / text / button / card / header) to edit the brand layer via a floating popover. Editor sheet with 4 live tabs — Identity, Design, Catalog, Artist Links (Integrations / Email / Media Kit / Spotlight = "soon" placeholders).

| Tab | What it does |
|---|---|
| **Identity** | Link Address (read-only, permanent), app name, display name, app icon, status bar color |
| **Design** | 9 presets + Surprise me, colors (Background/Cards/Text/Accent), font (Sans/Serif/Mono), button style, corner radius, Reset to default |
| **Catalog** | All **16 item types** (link, video, audio, image, pdf, product, course, session, membership, physical, tip jar, bundle, live, messaging, newsletter, page) + pricing + scheduling. **Video/Image/Audio/PDF + product cover + course lessons use real device file uploads** (via `/api/creator/upload`) |
| **Artist Links** | Social URLs → shown in the preview's Connect tab |

- **Tap-to-edit:** tapping any visible element (background, text, button, card, header) opens a floating popover with that element's brand controls — changes apply globally to every surface (`my-app.md` Part 1a)
- **Editor option A (slide-up sheet)** was built (default from the A/B/C/D spec, `my-app.md` Part 1c — no A/B test was run)
- **Deploy:** one click makes everything live. Draft system (localStorage auto-save, ~3s debounce, restore-on-mount) + Draft/Live toggle with an orange dot when un-deployed changes exist. (No unsaved-changes modal — not built.)

Full spec: `src/wiredLater/screens/creator-dashboard/my-app/my-app.md`.

### 4.4 Network (`/dashboard/network`)

**Full spec: `src/wiredLater/screens/creator-dashboard/network/network.md`. WIRED (Sheet 18, 2026-08-30).**

Creator-to-creator discovery + collab + people hub (B2B — fans never see it). **3-section anchored layout (DECIDED 2026-08-05):** left rail (Discover + Affiliates) · center detail · right rail = **My Peeps** (Partners / Fans / Staffs umbrella — the home of `features/relationships.md`, `features/team.md`, `features/partnership.md`):
- **Visibility switch** — `is_discoverable` toggle
- **Billboard** — tagline (60 chars), up to 3 tags, collab style
- **Search** — by display name / username, featured float to top
- **Collabs** — friend-request style: send → accept/decline → connected. No commission required (agreements optional, done later)
- **Affiliates** (Section 7) — connected partners can promote each other's catalog items **or whole catalogs** for commission: deal scope (item/creator), trigger (purchase/follow/subscribe/tip/signup/any), deal type (% / fixed / free / tiered / custom), asymmetric per-side config, no min/max — economics in `monetization/creators.md` Part 2; My Earnings / Discover / My Links sub-tabs
- **Deal Maker deferred to end of development** (messaging is already wired — see Section on chat; it no longer belongs to Network's deferred list)

### 4.5 Settings (`/dashboard/settings`)

**WIRED (Sheet 9, 2026-08-30).** Account/security, PayPal connect panel (PayPal-first since 2026-08-10 — `paypal_account_id`; Stripe Connect = deferred Atlas reference), notifications, messaging & privacy, danger zone. Spec: `screens/creator-dashboard/settings/settings.md`.

### 4.6 Admin Panel (`/admin`)

**Full spec: `src/wiredLater/screens/admin/admin.md`. WIRED (Sheet 8, 2026-08-30).** 5-tab panel: Overview (stats), Creators (search + feature toggle), Staff Accounts (invite/role/revoke), Audit Log (placeholder), API Keys.

Platform owner's control room. One door, different keycards:
- **Founder setup** (planned) — `/founder/setup?token=...`, one-time, token-gated. The owner claims the platform once; after that, logs in at `/login` like everyone else
- **Overview** — platform-wide stats (creators, fans, revenue) + activity feed + staff status strip
- **Admins tab** — invite staff by email + role, custom permission toggles per person, revoke, last-active
- **Roles:** super_admin / support_admin / content_admin / agent (permission tiers in `src/types/index.ts`)
- **Audit log** (planned) — every admin action recorded (`admin_activity_log`)
- **API keys** — for AI agent accounts

---

## 5. The Fan Shell (`/[username]`) — PWA #3

### Guest view (not logged in) — `PublicCreatorPage`

**WIRED (Sheet 21-V1, 2026-08-11).** 3-layer page: Header (banner, avatar, display name, @username, bio, fan count) → Spotlight → Catalog Feed (interactive cards per item type — all 16 types render, gates apply). Artist Links live in the **Connect tab only** (`fan-shell.md` Part 4c). Guest view is **identical** to the fan Content tab — the only differences: signup/login buttons + PWA install prompt live on the guest page, and gate buttons show "Sign up to unlock" / "Buy — $X" / "Join membership" instead of "Purchased ✓" / "Unlocked ✓".

**Render rules (no-password rule):** visitors get `/{username}/guest` (Fans 307 to `/home`); a no-password session (email-only Follower) stays on the guest page with "Following ✓" + notify toggle; only password-holding Fans get the 4-tab app.

### Authenticated view (fan signed up) — `FanAppShell`

Four bottom tabs (all wired):

| Tab | Component | Status |
|---|---|---|
| **Home** | `FanHomeTab` | Wired — activity hub: Spotlight, New from creator, Updates from partners you follow, Your activity, Upcoming |
| **Content** | `FanContentTab` | Wired — storefront 3-layer + three gates + purchased badges |
| **Connect** | `FanConnectTab` | Wired — Artist Links + Follow box; partner billboard + community sections hidden when empty (Sheet 20 done) |
| **Settings** | `FanSettingsTab` | Wired — account hub: identity (email), receipts, notify toggle, install, sign out |

Full spec in `screens/fan-shell/fan-shell.md` (account model, gates, tabs, guest layout, auth).

### How fans authenticate

1. Visit `/{username}/guest` (redirect from `/{username}`) → see guest page (identical layout to fan view)
2. Click "Sign Up" → `FanAuthModal` opens → enter email + password (email + password ONLY — no social login for fans, founder decision 2026-08-08)
3. `fan_session` cookie set (opaque token, 365-day expiry)
4. Page reloads → authenticated view (badges update: "Purchased ✓" when purchase email matches account email)

Follower (email-only, no password) vs Fan (with password): the same `fan_accounts` row — setting a password upgrades the session. A "no password set" login attempt returns 401 and the modal auto-switches to the forgot-password path.

Fan data is tied to **email**, not device. Fan accounts are **per-creator** (`fan_accounts.email` + `creator_id`): the same email can have accounts under Kevin AND Shakiro, each with its own session. Installing both creators' PWAs puts two separate apps (icons) on the phone — each with its own manifest, name, and scope.

### Guest checkout & the account model

Guests buy with **email only** — no account needed (Stan Store style). Checkout runs through the **mock PayPal rail** (`/api/paypal/checkout` — PayPal-first, 2026-08-10; Stripe stays the deferred Atlas reference). The receipt email IS the access key. An **"Also send me updates?" checkbox (default OFF)** is the ONLY bridge from buyer → follower — buying never auto-follows. **Claim purchases** (enter purchase email → verification code → merge) is NOT built yet (deferred). All 4 layers are v1 (spec: `fan-shell.md` Part 1).

---

## 6. Collabs (in-app) + Partnerships (outside invites)

**In-app collabs — friend-request style (spec: `network.md`). WIRED (Sheet 18, 2026-08-30).**

### Request flow

```
Creator A searches for Creator B → sends simple request (no commission, no notes)
    ↓
Creator B sees pending request → accepts or declines
    ↓
Collab is ACTIVE (connected)
    ↓
(Optional, later) Deal Maker — commission splits / revenue share inside the collab
(Optional) Affiliates — collabs promote each other's items for commission
```

**Outside invites — partnerships:** inviting a non-user via `?invite=XXX` auto-creates the partnership link on their signup (spec: `partnership.md`). Terminology: in-app connections = **collabs**; invited-from-outside connections = **partnerships**. One shared `partnerships` table + `source` flag.

## 6b. Messaging (WIRED — Sheet 12, 2026-08-17)

Free WhatsApp-style chat engine (spec: `features/messaging.md`). **Creators:** floating 💬 inbox on every `/dashboard/*` page + full screen at `/dashboard/messages`. **Fans:** header chat icon + floating inbox in the fan shell. **Guests:** "Contact {creator}" email capture → creates a Follower row + a direct conversation.

- Conversations (newest-first), threads, unread badges (6s polling in mock), edit/delete with tombstones, file attachments (≤8MB via `/api/chat/upload`)
- **Requests folder** + "Allow anyone" toggle (per-party privacy, TT/Reddit-style); **block** in both directions
- **Groups:** creators create; announcements-only mode (only the host posts)
- **Community (Part 3)** — wired (2026-08-30): creator clubhouse with chat channels, roles (Member/VIP/Partner), join rules (open/fans-only/invite-only)
- Real-time: polling in mock, Supabase Realtime planned in prod

---

## 7. The Content Catalog System

**WIRED (Sheet 19-V1 + upload pass 2026-08-19).** All 16 item types are buildable in the My App Catalog tab and render in the fan shell. Editors live in `src/components/my-app/catalog/`; the fan-side cards in `src/components/fan-pwa/ItemCards.tsx`. File-backed types (video, image, audio, pdf + product cover + course lessons) use **real device file uploads** via `POST /api/creator/upload` (50MB cap, per-type MIME validation) — no URL fields for file types.

### Content types

| Category | Types |
|---|---|
| **Media** | video, audio, image, pdf |
| **Links** | link |
| **Commerce** | product, physical, bundle, tip_jar |
| **Engagement** | course, session, live, messaging |
| **Recurring** | membership, newsletter |
| **Page** | rich text / custom page |

Plus: per-item **scheduling** (scheduled publish/unpublish — wired, `fanData.ts` `isScheduledVisible`). **Not built:** funnels (buy/skip/upsell/downsell chains), free/pro tiers (tentative, NOT enforced in v1 — `monetization/owner.md`).

---

## 8. What's Skeleton / Placeholder

**Phase F wiring is nearly complete** (map: `WIRING_PLAN.md`, repo root — 23 sheets; Sheets 6–12, 18–22 done). Landing page is the only unwired screen. Specs for all screens live in `src/wiredLater/` (specs only — the parts archive `src/old-code/` is reference-only).

| Screen | Current state | Spec |
|---|---|---|
| Landing page (`/`) | Not wired (deferred) | `screens/public/landing.md` (deferred) |
| Login (`/login`) | ✅ Wired (Sheet 6) — AuthCard + LoginForm, `?next=` redirect, mock-only social buttons | `screens/public/login.md` (full) |
| Onboarding (`/onboarding`) | ✅ Wired (Sheet 7) — Link Address availability check + permanence dialog + register route | `screens/public/onboarding.md` (full) |
| Forgot-password (`/forgot-password`) | ✅ Wired — anonymous, no enumeration, mock logs reset link | `screens/public/login.md` Part 4 |
| Dashboard Overview (`/dashboard/overview`) | ✅ Wired (Sheet 10) | `screens/creator-dashboard/overview/overview.md` (full) |
| My App (`/dashboard/my-app`, formerly Playground) | ✅ Wired (Sheet 19-V1) — full editor, 16 types, uploads, draft/deploy | `screens/creator-dashboard/my-app/my-app.md` (full) |
| Dashboard Network | ✅ Wired (Sheet 18) | `screens/creator-dashboard/network/network.md` (full) |
| Dashboard Messages (`/dashboard/messages`) | ✅ Wired (Sheet 12) — full chat screen + floating inbox | `features/messaging.md` (full) |
| Admin (`/admin`) | ✅ Wired (Sheet 8) — 5-tab panel | `screens/admin/admin.md` (full) |
| Dashboard Settings | ✅ Wired (Sheet 9) | `screens/creator-dashboard/settings/settings.md` (full) |
| Fan page (`/{username}` guest/home/content/connect/settings) | ✅ Wired (Sheet 21-V1) — guest 3-layer + 4-tab app + mock PayPal checkout | `screens/fan-shell/fan-shell.md` (full) |
| Search page (`/search`) | ✅ Wired (Sheet 11) | `features/search.md` (full) |
| Offline (`/offline`) | ✅ Wired (Sheet 22) | `screens/public/offline.md` (full — fallback + App Shell) |
| Push notifications | Subscribe saves to DB; broadcast send is a no-op | — |
| Analytics | Removed as its own page — part of Overview / Media Kit | — |
| AI assistant (creator) | Not built (route spec'd) | `ai/ai-features.md` (full) |
| AI agent workforce | Not designed — heads-up only | `ai/ai-agents.md` (placeholder) |

---

## 9. What's Fully Working (live code, not backed up)

| Feature | Detail |
|---|---|---|
| **Creator signup + login** | Email + password, mock auth via cookie (`mock_auth_uid`); session cookie required — visiting `/dashboard*` without one redirects to `/login` |
| **Onboarding** | Link Address availability + permanence dialog, display name, register route |
| **Forgot-password** | Creator + fan routes, anonymous, no account enumeration |
| **Fan auth** | Email + password only (no magic link — founder decision 2026-08-08), session cookie (per-creator accounts), Follower (email-only) → Fan (password) upgrade |
| **Admin RBAC system** | `admin_accounts` table, 4 roles, permission checks (`canPerform`) — fully wired (Sheet 8, 2026-08-30) |
| **My App editor** | Full-screen preview, Identity/Design/Catalog/Artist Links, 16 item types + device uploads, auto-save, draft/live/deploy, tap-to-edit |
| **Fan shell** | Guest 3-layer page, 4-tab fan app, item cards for all 16 types, gates, receipts, install trio, update toast |
| **Messaging engine** | 12 `/api/chat/*` routes + ChatShell (floating inbox, requests, groups, announcements, block, attachments) |
| **Catalog API routes** | item CRUD + my-app + fan data + purchases + upload + paypal + chat families live |
| **Content service** | Shared infrastructure stays live |
| **File uploads** | Images/files saved to `/public/mock-uploads/` via `/api/creator/upload` (50MB, per-type MIME check) |
| **Mock checkout** | Mock PayPal rail (`/api/paypal/checkout`), success → `?payment=success`, email-keyed receipts |
| **Fan session resilience** | Data tied to email — survives cookie clear / device change |
| **Mock system** | Full in-memory DB, auth, payments, AI, email, RPC mocks |

**Not wired yet:** landing page — spec'd in `src/wiredLater/screens/public/landing.md`.

---

## 10. Why Mock Mode Exists

The mock system is your **design canvas**. Every change you make to the mock is free — no real Supabase database to reconfigure, no Stripe API limits, no AI token costs, no email deliverability headaches. You can break everything and it costs nothing.

**The mock IS the spec for production.** When you're ready to migrate to real services, your job is translation, not redesign. The mock defines the exact function signatures, return types, and edge cases that the real implementation must match.

**Mocks stay in the codebase forever.** Even after migration, mock files remain as reference documentation. See the Mock ↔ Production Mapping table below.

---

## 11. The Mock-as-Draft Philosophy

**"Translate + enhance" — not copy-cat.**

The mock defines the **minimum contract** (what data shape must be returned). But real services offer much more. When migrating:

1. Read the mock file to understand the contract (function signature, return type)
2. Write the real call to return the **same shape**
3. **Add enhancements** that the real service provides natively
4. Look for `// PRODUCTION-NOTE:` comments in mock files — they list what the real service adds

### Example: PayPal checkout (PayPal-first rail, 2026-08-10)

| Aspect | Mock | Real PayPal |
|---|---|---|
| Return shape | `{ id, url }` | `{ id, url }` — same! |
| Tax handling | None | PayPal handles (merchant-account level) |
| Fraud detection | None | PayPal's fraud filters |
| Order expiry | None | `payment_source` + order expiry options |
| Customer info | None | `payer.email`, capture metadata |

The mock's return shape is the **contract**. The extra fields are **enhancements** you add during migration.

---

## 12. Mock ↔ Production Mapping

| Real Service | Mock File(s) | Real Client File(s) | What to Add on Migration |
|---|---|---|---|
| **Supabase** | `mockSupabaseClient.ts` + `mockDataStore.ts` | `src/lib/supabase/server.ts`, `admin.ts` | SQL migrations (CREATE TABLE), RLS policies, storage buckets |
| **PayPal** | `mockPayments.ts` | `src/lib/paypal.ts` (future — v1 rail; Stripe stays deferred, the Atlas path, `monetization/creators.md` 1b) | cards accepted without a buyer account, Order capture webhook (`checkout.order.approved`), settlement splits for affiliates (2e2) |
| **Paddle** | `mockPayments.ts` (mockPaddle) | `src/lib/paddle.ts` | Real webhook signature verification, sandbox/production env switching |
| **Resend (email)** | `mockResend.ts` | `src/lib/email.ts` | Real API key, bounce webhooks, domain authentication (SPF/DKIM), attachment limits |
| **Groq (AI)** | `mockAI.ts` | Inline in API routes | Real `GROQ_API_KEY`, prompt engineering, retries on rate limit, error handling for null responses |
| **Cloudflare R2/Stream** | Inline in `mockSupabaseClient.ts` `makeStorageApi()` | Not yet created | Real R2 bucket config, Stream account, video processing |

---

## 13. Migration Recipe

When ready to migrate from mock to real:

1. **Open the relevant mock file** — e.g., `mockResend.ts` for email
2. **Find the function you're replacing** — e.g., `mockResendSend()`
3. **Write the real call** — return the **same data shape** the mock returns
4. **Add enhancements** — check `// PRODUCTION-NOTE:` comments in the mock file for what the real service adds (tax, fraud, billing features, etc.)
5. **Flip `USE_MOCKS=false`** and verify

Each library file follows the same pattern: `if (USE_MOCKS) return mock; else call real service`.

### Migration checklist

- [ ] Change `USE_MOCKS=false` in `.env.local`
- [ ] Add real Supabase URL + anon key
- [ ] Run SQL migrations to create tables
- [ ] Add real API keys for PayPal, Resend, Groq, Paddle
- [ ] Test each service side-by-side (mock returns X → real returns X)
- [ ] Mock files stay as reference — never delete them

---

## 14. PRODUCTION-NOTE Comments

Every mock file has `// PRODUCTION-NOTE:` comments marking what the real service provides that the mock skips. These are your **migration checklist** — read them all before starting production migration.

---

## 15. Mock Mode Reference

### How to Access Mock Mode

1. Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` (already done).
2. Run `npm run dev`.
3. Open `http://localhost:3000/login` — sign in with any email + password (if the email doesn't exist, it creates a new account automatically).
4. Or go to `http://localhost:3000/onboarding` to create a new creator account with a Link Address.
5. Admin: login at `/login` with `admin@creatorpwa.app` (any password).

> **Mock starts empty.** Create accounts at `/onboarding` (creator) or `/login` (admin: `admin@creatorpwa.app`). Everything else you create exists in memory only and resets on server restart. Uploaded files go to `public/mock-uploads/`. Sent emails are logged to `temp_emails.log`.

### What Mock Mode Covers

| Layer | Covered? | How |
|---|---|---|
| **Database (all CRUD)** | ✅ Full | In-memory mock store with all tables (29). No seeds — create test data via the UI. |
| **Auth (creator login)** | ✅ Full | Any email+password works. Sets `mock_auth_uid` cookie. |
| **Auth (fan session)** | ✅ Full | Fan registers → gets `fan_session` cookie (365-day expiry). |
| **File uploads** | ✅ Full | Written to `public/mock-uploads/`, servable from `/mock-uploads/`. |
| **RPC (stored procedures)** | ✅ Full | 7 RPCs mocked: stats, analytics, activity, partnerships, admin. |
| **AI (Groq)** | ✅ Mock | Deterministic JSON responses for palettes and summaries. |
| **PayPal checkout** | ✅ Mock | Fake session URL with `?payment=success` param (PayPal-first rail, 2026-08-10). |
| **PayPal connect** | ❌ Stub | Fake connect button — `paypal_account_id` field (Stripe Connect = deferred Atlas reference). |
| **Paddle webhook** | ✅ Mock | Processes `transaction.completed` with mock data. |
| **Resend email** | ✅ Mock | All emails captured to console + `temp_emails.log`. |
| **Cloudflare Stream** | ⚠️ Stub | Fake stream URLs — no video processing. |
| **Push notifications** | ⚠️ Stub | Subscribe saves to DB; send is a no-op. |
| **Page view tracking** | ✅ Mock | API accepts requests, mock stores count. |
| **Real PayPal/payments** | ❌ No | No actual money moves. |
| **Real email delivery** | ❌ No | All emails logged, not sent. |
| **HTTPS / PWA install on phone** | ⚠️ Partial | Works on Chrome/Edge localhost; requires deployment for real phones. |

### What Persists vs Resets

| Data | Persistence |
|---|---|
| In-memory DB (creators, content, fans, etc.) | **Resets on server restart** |
| Changes during a session | Persist **until server restart** (stored on `globalThis`) |
| Uploaded files (`public/mock-uploads/`) | Persist on disk across restarts |
| Emails (`temp_emails.log`) | Appended to file across restarts |
| Cookies (`mock_auth_uid`, `fan_session`) | Persist in browser across restarts |

### Quick Reference: Routes by Role

| Route | Admin | Creator | Fan | Guest |
|---|---|---|---|---|
| `/` (landing) | ✅ | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/onboarding` | ✅ (new) | ✅ (new) | ❌ | ❌ |
| `/dashboard` | REDIRECT → `/dashboard/overview` | ✅ (new) | ✅ (new) | ❌ | ❌ |
| `/dashboard/overview` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard/my-app` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard/network` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard/settings` | ✅ | ✅ | ❌ | ❌ |
| `/admin` | ✅ | ❌ | ❌ | ❌ |
| `/founder/setup` (planned) | — | — | — | token-gated one-time |
| `/[username]` (public) | ✅ | ✅ | ✅ | ✅ |
| `/{username}/guest` → `/{username}/settings` (fan tabs) | ✅ | ✅ | ✅ | fan session |
| `/{username}/app` (auth, legacy) | ✅ | ✅ | ✅ | ❌ |
| `/{username}/partner/[partnerUsername]` | ✅ | ✅ | ✅ | ✅ |
| `/search` | ✅ | ✅ | ✅ | ✅ |

---

## 16. Future Production Items

### Spec'd — design locked, ready to build (wiring pass)

These have full specs in `src/wiredLater/`:

| Item | Spec | Status |
|---|---|---|
| **My App rebuild** (formerly Playground) — full-screen guest-first shell + tap-to-edit brand popovers + editor sheet + 16 item types + device uploads + draft/deploy | `screens/creator-dashboard/my-app/my-app.md` | ✅ DONE (Sheet 19-V1) |
| **Fan page rebuild** — guest page + 4-tab PWA (account model, gates, activity hub, settings hub) + mock PayPal checkout | `screens/fan-shell/fan-shell.md` (+ `my-app.md` Part 3 for display layers) | ✅ DONE (Sheet 21-V1) |
| **Messaging** — floating inbox both sides, requests/blocks/toggles, groups + announcements, attachments | `features/messaging.md` | ✅ DONE (Sheet 12); Part 3 Community NOT built |
| **Network rebuild** — search, billboard, collabs, affiliates | `screens/creator-dashboard/network/network.md` | ✅ DONE (Sheet 18) |
| **Admin rebuild** — founder setup, RBAC, audit log, API keys | `screens/admin/admin.md` | ✅ DONE (Sheet 8) |
| **AI personal assistant** (creator-facing floating widget) | `ai/ai-features.md` | 🔵 Not built |
| **AI agent workforce** (heads-up only — design TBD) | `ai/ai-agents.md` | ⚪ Not designed |
| **Landing page** | `screens/public/landing.md` | ⚪ Deferred |

### Production migration (P1)

- Replace mockSupabaseClient with real Supabase (SQL migrations, RLS, storage buckets)
- Replace mockResend → real Resend (SPF/DKIM, bounce webhooks)
- Replace mockGroq → real Groq (rate limits, retries)
- Replace mock PayPal → real PayPal Checkout (PayPal-first rail; Stripe Connect deferred — the Atlas path)
- Follow the **Migration Recipe** (section 13) and **Mock ↔ Production Mapping** (section 12)

### Other future items

| Item | Notes |
|---|---|
| **Founder setup page** | Spec'd in admin.md — one-time, token-gated |
| **Audit log table** | Spec'd in admin.md — `admin_activity_log` |
| **Push notifications (real)** | Real Web Push API + VAPID keys, per-creator routing |
| **Analytics (real)** | Per-creator views, installs, traffic sources, retention |
| **Custom domains (premium)** | Creator's own domain instead of `creatorbiotree.com/username` |
| **Coupon codes** | Discount codes for items/bundles |
| **Follow-source tracking** | `follow_sources` table (referral cookie alternative) |
| **Account settings (creators)** | Email/password change, danger zone |
| **Per-creator settings: consolidated fan view** | All creators a fan follows in one place |
| **Walkthrough overlay** | Beacon-style first-visit tour of My App **+ Figma-style contextual tips/coach-marks** — part of the post-launch polish pass, batches with landing, onboarding, and AI features |
| **Platform updates feed** | "What's new at CreatorBioTree" — small strip in dashboard Overview + small link in fan Settings; built with the landing page (deferred); no competitor does in-app platform news (they all use blogs/email) |
| **Deal Maker** | Commission agreements between partners (network.md) |
| **Community (Part 3)** | ✅ DONE | Creator clubhouse — chat channels on the messaging engine (messaging.md Part 3) — wired 2026-08-30 |
| **External brand affiliates** | Self-serve brand deals marketplace — v2 |
| **Per-tab theming** | Premium upsell — individual colors per fan tab |

---

> **Status legend:** ✅ DONE — Implemented | 🟡 IN PROGRESS — Being worked on now | 🔵 PLANNED — Locked design, ready to build | ⚪ DEFERRED — Acknowledged but no design yet | 🔴 BLOCKED — Waiting on external dependency
