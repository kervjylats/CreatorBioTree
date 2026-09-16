# CreatorBioTree — Spec ↔ Codebase Audit

> **What this is:** a per-file verdict (KEEP / DELETE / ADD / MERGE / EXTEND / ADOPT) for every live code file, based on what the `wiredLater/` specs actually say. The specs are the law — this audit is the scorecard of how the current code matches them.
>
> **The two maps now on disk:**
> - `CODEBASE_INVENTORY.md` — *where everything lives* (the "what is X?" map)
> - `CODEBASE_AUDIT.md` (this file) — *what to do with each file* (the "keep/delete/add/merge" plan)
>
> **Audit date:** 2026-08-07 (after the A1 / A1.5-strict / A2 screen-skeleton work; `src/app/` address book + `src/screens/` middleman live).
>
> ⚠️ **SNAPSHOT NOTICE (2026-08-19):** this audit describes the pre-Phase-F codebase. Since then, WIRING_PLAN Sheets 6, 7, 12, 19-V1, 21-V1 are **done**: login/onboarding/forgot-password wired, My App editor live (all 16 catalog types + device uploads), fan shell wired, messaging engine (12 `/api/chat/*` routes + ChatShell) built, theme/branding system shipped. **Current counts (2026-08-19):** 84 API route files + 2 manifests · 21 pages · 17 screen folders · 30 mock tables · 6 hooks · ~20 live fan-pwa files. Items below marked 🆕 ADD are therefore mostly **DONE** — cross-check against `WIRING_PLAN.md` before acting on any verdict. A full line-by-line refresh of this file happens at the end of Phase F.

---

## 1. How to read this

Every item below is judged against the `src/wiredLater/` specs only. Old code in `src/old-code/` is **reference-only** (AGENTS.md: never wire from it directly, never delete it) — it appears only as "pattern source."

Verdicts:
- ✅ **KEEP** — live, working, spec-confirmed
- ❌ **DELETE** — dead / stale / duplicate
- 🆕 **ADD** — spec'd but not yet built (Phase F work)
- 🔀 **MERGE** — consolidate duplicates (at wiring)
- 📤 **ADOPT** — lives in old-code, move into live `src/` per G6
- ➕ **EXTEND** — exists, add fields/logic per spec

---

## 2. Summary scorecard

| Area | Verdict |
|---|---|
| Screen skeleton (`src/app/` + `src/screens/`) | ✅ KEEP — naked stubs, wire in Phase F |
| API routes (~44) | ✅ KEEP — live and spec-confirmed |
| `src/lib/` + `lib/mocks/` + `lib/supabase/` (21) | ✅ KEEP — extend 2 (branding.ts, mock store) |
| `src/services/` (4) | ✅ KEEP |
| `src/types/` (2) | ✅ KEEP — contains naming drift to fix (`Playground*` → `MyApp*`) |
| `src/components/` (20) | ✅ KEEP (12 ui + SW register + 6 fan-pwa stubs) — **delete 1 empty barrel** |
| `src/hooks/` (1), `src/styles/` (1), `proxy.ts` | ✅ KEEP |
| Dead files | ❌ 5 confirmed + 1 candidate |
| New API routes (Phase F) | 🆕 ~32 |
| New components (Phase F) | 🆕 4 (ChatShell, PreviewStateToggle, ElementPopover, shared search) |
| New mock tables (Phase F) | 🆕 14 |
| Merge clusters | 🔀 7 |
| Adopt helpers (G6) | 📤 3 |
| Naming drift | Fix 2 items |

---

## 3. KEEP — live, working, spec-confirmed

### 3.1 The screen skeleton (built in the A1/A1.5/A2 restructure)

`src/app/` is now a thin address book — every major screen = one `page.tsx` (2-line re-export) — and `src/screens/` is the working middleman (one folder per screen, `index.ts` + `Screen.tsx`). All naked `<main>` stubs. No spec conflict.

| Screens (naked, wire in Phase F) | Page.tsx in | Screen folder in |
|---|---|---|
| Landing `/`, Login, Onboarding, Offline, Search | `(public)/` | `screens/public/` |
| Guest, Home, Content, Connect, Settings (fan) | `(fan)/[username]/` | `screens/fan/` |
| Overview, Network, My App, Settings (creator) | `(creator)/dashboard/` | `screens/creator/` |
| Admin | `(admin)/admin/` | `screens/admin/` |

Non-naked infrastructure in `app/` (all ✅ KEEP):
- `(creator)/dashboard/layout.tsx` — real auth guard (no user → `/login`, no creator → `/onboarding`) — spec-confirmed
- `(fan)/[username]/page.tsx`, `(creator)/dashboard/page.tsx` — the 2 redirect stubs I added in Step A... **review**: Overview and Guest were moved to subfolders; keep the redirects to preserve spec URLs (override in section 4.2).
- `app/layout.tsx` — root layout (TooltipProvider + ServiceWorkerRegister + viewport) ✅
- `app/favicon.ico` — static, spec says "skipped for v1" ✅
- `manifest.json/route.ts` — platform PWA (PWA #1) ✅
- `[username]/manifest.json/route.ts` — dynamic per-creator PWA (PWA #3), uses `resolveBranding()` ✅ (EXTEND: point `start_url` at `/[username]/guest` in Phase F)
- ~~`auth/fan/route.ts`~~ — magic-link landing — **deleted 2026-08-08** (founder decision: fans use email + password only)
- `(fan)/[username]/partner/[partnerUsername]/page.tsx` — naked but URL confirmed by `partner-page.md` ✅

### 3.2 API routes (44 live, spec-confirmed)

| Group | Routes | Spec |
|---|---|---|
| **Fan auth (6)** | `fan/register`, `login`, `forgot-password`, `reset-password` (live) + `magic-link`/`auth/fan` (deleted 2026-08-08) | fan-shell.md |
| **Fan data (4)** | `fan/dashboard`, `install`, `follow`, `content/access` | fan-shell.md, partner-page.md (follow) |
| **Fan content (3)** | `fan/content/list`, `content/[id]/comments`, `content/[id]/reactions` | fan-shell.md |
| **Creator catalog (7)** | `creator/catalog`, `catalog/[itemId]`, `modules`, `modules/[moduleId]`, `lessons`, `modules/[moduleId]/lessons`, `...(lessons)/[lessonId]` | my-app.md, catalog-roadmap.md |
| **Creator tooling (4)** | `creator/upload`, `check-username`, `pageview`, `activity` | overview.md, my-app.md, integrations.md |
| **Creator fans (2)** | `creator/fans/list`, `fans/export` | relationships.md (export gets EXTEND) |
| **Creator AI (2)** | `creator/ai-summary`, `creator/playground/ai` | ai-features.md (→ renames to `my-app/ai` at wiring) |
| **Admin (6)** | `admin/stats`, `creators`, `creators/[id]`, `creators/[id]/fans`, `accounts`, `accounts/[id]`, `api-keys` | admin.md |
| **Stripe (3)** | `stripe/checkout`, `connect`, `webhook` | creators.md |
| **Paddle (1)** | `webhooks/paddle` | creators.md |
| **Push (2)** | `push/subscribe`, `push/send` | fan-shell.md (add rate limits, G7) |

### 3.3 The library, services, mocks & infra (all live, spec-confirmed)

| File | Verdict | Note |
|---|---|---|
| `lib/branding.ts` | ✅ KEEP + ➕ EXTEND | `resolveBranding()` is the single source of truth (G16); add 7 missing presets + Part 9 fields at wiring |
| `lib/admin-permissions.ts` | ✅ KEEP | `canPerform()`/`getAdminAccount()` — admin.md says "live" |
| `lib/fanSession.ts` | ✅ KEEP | per-creator fan session + SHA-256 hashing |
| `lib/rate-limiter.ts` | ✅ KEEP | the singleton; G7 victim? add missing rate limits at wiring |
| `lib/queue.ts` | ✅ KEEP | mock DirectQueue; prod QStash commented |
| `lib/email.ts` | ✅ KEEP | the `emailSender` singleton (E-merge target) |
| `lib/stripe.ts` | ✅ KEEP | mock Stripe proxy + prod real |
| `lib/paddle.ts` | ✅ KEEP | mock + prod |
| `lib/vapid.ts` | ✅ KEEP | `urlBase64ToUint8Array` |
| `lib/urls.ts` | ✅ KEEP | update `getFanAppUrl` (if `/app` is deleted) |
| `lib/colorExtraction.ts` | ✅ KEEP | palette extraction for AI Copilot |
| `lib/utils.ts` | ✅ KEEP | `cn()` |
| `lib/mocks/useMocks.ts` | ✅ KEEP | the single master switch (G1) |
| `lib/mocks/mockDataStore.ts` | ✅ KEEP + ➕ EXTEND | add new tables to `TableName` (14 new) |
| `lib/mocks/mockSupabaseClient.ts` | ✅ KEEP + ➕ EXTEND | add JOIN_REGISTRY + RPC handlers for new tables |
| `lib/mocks/mockResend.ts` | ✅ KEEP | design draft for Resend |
| `lib/mocks/mockPayments.ts` | ✅ KEEP | design draft for Stripe/Paddle |
| `lib/mocks/mockAI.ts` | ✅ KEEP | design draft for Groq (superseded by ai-features.md assistant) |
| `lib/supabase/server.ts` / `client.ts` / `admin.ts` | ✅ KEEP | the three clients |
| `services/creatorService.ts` | ✅ KEEP | `getByUsername`/`getById` |
| `services/contentService.ts` | ✅ KEEP | strips system fields (G20) |
| `services/fanService.ts` | ✅ KEEP | dashboard data + install tracking |
| `services/profileUpdateService.ts` | ✅ KEEP | 14-field allow-list (G20) |
| `types/index.ts` | ✅ KEEP + ➕ EXTEND | **rename `Playground*` → `MyApp*`** + add feature types |
| `types/contentTypes.ts` | ✅ KEEP + ➕ EXTEND | add `affiliate_enabled`/`affiliate_rate` to ContentItem |
| `components/ui/*` (12) | ✅ KEEP | shadcn, docstring-exempt |
| `components/ServiceWorkerRegister.tsx` | ✅ KEEP | PWA-ready |
| `components/fan-pwa/*` (6) | ✅ KEEP (as pattern) | naked stubs → wire from fan-shell.md or delete + rebuild in `screens/fan/` (see 4.2) |
| `hooks/useMediaQuery.ts` | ✅ KEEP | the only hook in live code |
| `styles/globals.css` | ✅ KEEP | platform design tokens, never re-written per creator |
| `proxy.ts` | ✅ KEEP | the front door: subdomain rewrite + auth guards |

### 3.4 `src/old-code/` (101 files)

✅ **KEEP forever — reference only.** AGENTS.md: never wire from it directly, never delete. Specs point to it with "see old code for the pattern." Groups: 56 root components/hooks (Sidebar, PhonePreview, catalog editors, useAutoSave, …), 17 catalog editors, 1 integrations route (`social-scrape-route-old.ts`), 27 allScreens backups (incl. 7 old partner API routes).

---

## 4. Adopt / Delete / Merge / Add — the Phase F plan

### 4.1 📤 ADOPT — helpers live in old-code, move into live `src/` at wiring (G6)

| Helpder | Current home | Move to | Note |
|---|---|---|---|
| `api-utils.ts` | `src/old-code/` | `src/lib/api-utils.ts` | `ok()/fail()/wrapHandler()` — live routes currently hand-roll `NextResponse.json` |
| `api-error.ts` | `src/old-code/` | `src/lib/api-error.ts` | `NotFoundError` etc. |
| `requireAuth.ts` | `src/old-code/` | `src/lib/requireAuth.ts` | `requireAuth()` / `requireAuthAdmin()` — live routes currently inline auth |

### 4.2 ❌ DELETE (dead / stale / duplicate, flagged by spec or inventory)

| File / key | Why | Ref |
|---|---|---|
| `api/creator/content/upload/route.ts` | Duplicate of `api/creator/upload` — same job, second door | inventory §D |
| `api/fan/session/route.ts` | Misnamed — actually a CSV export, duplicated by `creator/fans/export` | inventory §F |
| `src/components/library/index.ts` | Empty `export {}` barrel | inventory §7 |
| `public/*.svg` (next, vercel, file, window, globe) | Stock boilerplate, unused | inventory §7 |
| `playground_banner_dismissed` localStorage key | Old name → rename `my-app_banner_dismissed` (G21) | my-app.md |
| **Candidate:** `(fan)/[username]/app/page.tsx` | Legacy gated-fan-app redirect. If deleted: point per-creator `manifest.json` `start_url` at `/{username}/guest`. Keep the redirect only if you want `/{username}/app` → guest alive | fan-shell.md, inventory (pending founder decision) |

### 4.3 🔀 MERGE (consolidate duplicates at wiring)

| Cluster | Files | Merge into | Spec |
|---|---|---|---|
| I | `CreatorCard` + `CreatorResultCard` | one directory card | search.md |
| J | `CreatorSearchInput` + `SearchFilters` | `SearchFilters` (URL-sync wins) | search.md |
| L | `InstallBanner` + `InstallButton` + `IOSInstallGuide` + `InAppBrowserWarning` + `usePWAInstall` | one consolidated install component/hook | offline.md |
| M | `AppIdentityEditor` + `GlobalSettingsEditor` | Identity + Design tabs in the My-App 8-tab sheet | my-app.md |
| B + N | `FanAuthModal` + `AuthCard` | one auth-modal pattern | login.md, fan-shell.md |
| C | `pageview` custom Map → `rate-limiter.ts` singleton | one rate limiter (G7) | — |
| E | `email.ts` + direct `mockResendSend` calls (paddle webhook, fan auth emails) | one `emailSender` singleton | — |

### 4.4 🆕 ADD (Phase F work — spec'd, not yet built)

**New API routes (~31):**

| Feature | Route | Spec |
|---|---|---|
| **Messaging (11)** | `chat/conversations`, `chat/conversations/[id]/messages`, `chat/messages/[id]`, `chat/conversations/[id]/read`, `chat/conversations/[id]/members` (+DELETE), `chat/conversations/[id]` (PATCH), `chat/upload`, `chat/requests`, `chat/block`, `chat/blocks`, `chat/unread`, `chat/preferences` | messaging.md Part 7 |
| **Team (8)** | `creator/team/invite`, `invites`, `invites/accept`, `members`, `members/[id]` (PATCH+DELETE), `activity`, `contexts` | team.md Part 6 |
| **Affiliates (7)** | `creator/affiliates/deals` (GET+POST), `deals/[id]` (PATCH+DELETE), `earnings`, `discover`, `link`, `links`, `links/[id]` | network.md §7 |
| **Relationships (3)** | `creator/fans/[id]` (GET + PATCH), `creator/relationships` (My Peeps umbrella) | relationships.md |
| **Partnership (2)** | `creator/partners/invite`, `creator/partners/onboarding` — rebuild from old-code as-is (+`source: invited`) | partnership.md |
| **AI (1, post-launch)** | `ai/assistant` | ai-features.md |
| **Rebuild (1)** | `creator/social/scrape` — currently 503 stub, rebuild from `integrations.md` + `old-code/integrations/social-scrape-route-old.ts` | integrations.md |

**New components (4):**
| Component | Spec |
|---|---|
| `src/components/ChatShell.tsx` (single file → useChat, ChatInboxPopover, ChatThread, MessageList, MessageBubble, MessageComposer, AttachmentPreview, ChatIcon, useUnreadBadge) | messaging.md — build 100% fresh, no old-code ref |
| `PreviewStateToggle`, `ElementPopover` | my-app.md Part 1a/1b — new |
| One shared search component (3 placements: `/search`, landing, Network search) | search.md |
| Consolidated PWA install component | offline.md |

**New mock tables (extend `mockDataStore.ts` `TableName` + `mockSupabaseClient.ts`):**

| Feature | Tables | Spec |
|---|---|---|
| Messaging (7) | `conversations`, `conversation_members`, `messages`, `message_attachments`, `message_requests`, `blocked_users`, `communities` | messaging.md Part 5 |
| Team (3) | `creator_team_members`, `creator_team_invites`, `creator_team_activity` | team.md |
| Affiliates (4) | `affiliate_deals`, `affiliate_attributions`, `affiliate_conversions`, `affiliate_links` | monetization/creators.md Part 2f |

**New columns on existing tables:**

| Table | New columns | Spec |
|---|---|---|
| `fan_accounts` | `do_not_contact`, `notes`, `last_seen_at` | relationships.md |
| `partnerships` | `source` (`invited` / `collab`) | partnership.md, G18 |
| `content_items` | `affiliate_enabled`, `affiliate_rate`, `scheduled_publish_at`, `scheduled_unpublish_at` | network.md, my-app.md |
| `creators.custom_theme` | Part 9 fields via `branding.md` (`connect_empty_text`, status bar color, etc.) | branding.md |

### 4.5 ➕ EXTEND (existing live files, add fields/logic)

| File | Add | Spec |
|---|---|---|
| `src/lib/branding.ts` | 7 missing presets (from `old-code/GlobalSettingsEditor.tsx` lines 14-22) + `Part 9 fields` | branding.md |
| `src/types/index.ts` | Rename `PlaygroundTheme/Colors/Profile` → `MyAppTheme/Colors/Profile`; add messaging/team/affiliate/relationships types | branding.md, feature specs |
| `api/creator/fans/export` | New columns: LTV, referred-by, consent flag | relationships.md |
| `api/creator/pageview` | Migrate custom Map → `rate-limiter` singleton | G7 |
| `mockDataStore.ts` | Add new tables to `TableName` (14 above) | feature specs |
| `mockSupabaseClient.ts` | JOIN_REGISTRY entries + RPC handlers | feature specs |

### 4.6 ➕ Add missing rate limits (G7)

Routes with NO rate limit — add at wiring: `creator/check-username`, `fan/follow`, `fan/install`, `fan/forgot-password`, `push/subscribe`.

---

## 5. Naming drift / hygiene (fix at wiring)

| What | Current | Fix | Spec |
|---|---|---|---|
| Type names | `PlaygroundTheme/Colors/Profile` | `MyAppTheme/Colors/Profile` | branding.md acknowledges the drift |
| localStorage banner key | `playground_banner_dismissed` | `my-app_banner_dismissed` | G21 |
| Route folder | `api/creator/playground/ai` | `api/creator/my-app/ai` | my-app.md |
| localStorage draft | `playground_draft_*` | `my-app_draft_*` | **already renamed in A1.5 ✅** |
| Manifest `start_url` | `/{username}/app` | `/{username}/guest` (if `/app` deleted) | fan-shell.md |
| `urls.getFanAppUrl` | `/username/app` | sync with guest URL change | fan-shell.md |

---

## 6. What the specs say is "DEFERRED / FREE / NOT-BUILT" (don't build in Phase F)

- **Landing page** (`landing.md`) — DEFERRED (post-launch polish). Keep naked; old-code 9-piece kit stays in archive.
- **Onboarding** (`onboarding.md`) — DEFERRED (signup only, post-launch).
- **AI assistant + agent workforce** (`ai-features.md`, `ai-agents.md`) — post-launch.
- **Messaging realtime** — polling in mock, Supabase Realtime in prod, Ably as scale-out.
- **Pricing / monetization decisions** (`owner.md`) — everything free until end-of-dev; all pricing decided in ONE end-of-dev pass.
- **Messaging group chat + community** — Part 3 of messaging.md is spec'd; the free messaging factor is confirmed (not a revenue feature).

---

## 7. Testing checklist after Phase F work (always green)

1. `cmd /c "npm run typecheck"` — 0 errors
2. `cmd /c "npm run lint"` — 0 errors (pre-existing warnings in unchanged files OK)
3. `python scripts/check-docs.py` — all pass (every .ts/.tsx has a purpose docstring)
4. Mock mode on (`USE_MOCKS=true`). Manual: `/login` (any email+password), `/onboarding`, `/dashboard/my-app`.

---

*This audit is the plan. When the founder says "go" on a piece of Phase F (the single end wiring pass), wire the screen/route/table per its spec, using old-code only as a pattern. Update this file + `CODEBASE_INVENTORY.md` as files change.*