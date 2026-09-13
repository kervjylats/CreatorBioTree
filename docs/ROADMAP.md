# Project Roadmap

> As-of: 2026-08-19. Updated as phases complete.

---

## Phase 0 ✅ Foundation
- [x] `scripts/check-docs.py` — docstring compliance checker
- [x] `docs/ROADMAP.md` — this file
- [x] AGENTS.md updated with docstring maintenance rule

> ℹ️ `docs/handbook/` and `docs/pages/` (earlier stubs) no longer exist — documentation lives in `docs/HOW_IT_WORKS.md`, `docs/CODEBASE.md`, and `docs/EXTERNAL_SERVICES.md`.

## Phase A ✅ 11 Bug Fixes
Standardize error handling, fix visual bugs, and resolve data integrity issues found during code review.

| Priority | Bug | Status |
|----------|-----|--------|
| P1 | Deploy/publish button missing | ✅ DONE |
| P1 | Draft content wiped on page load | ✅ DONE |
| P1 | Uncaught throw in `useMyAppForm` | ✅ DONE |
| P1 | Opacity style on root element fading text | ✅ DONE |
| P2 | Sidebar unsaved-changes guard broken | ✅ DONE |
| P2 | Partnership duplicates on rapid click | ✅ DONE |
| P3 | FanStatsCard has dead fetch | ✅ DONE |
| P3 | Service worker throw not audited | ✅ DONE |
| P3 | Stripe mock coverage gaps | ✅ DONE |
| P4 | check-username auth bypass | ✅ DONE |
| P5 | Minor typos across codebase | ✅ DONE (none found) |

## Phase B ✅ Component Library Extraction
Create a reusable UI component library. Barrel files + docstrings. Outcome ultimately superseded by the restructure (Phase D) — the library barrel was moved to the parts archive; `src/components/ui/` (12 shadcn primitives) is the live set.

- [x] ~~Button, Input, Select, Textarea variants from shadcn~~ → superseded: live in `src/components/ui/`
- [x] Shared layout components (Header, Footer, etc.) → superseded by the parts archive
- [x] Utility components (LoadingSpinner, EmptyState, ErrorBoundary) → archived for Phase F reuse
- [x] Barrel file with clean public API → removed (dead barrel deleted 2026-08-07)
- [x] Each component gets a purpose docstring

## Phase E ✅ Admin System (Option C: Full RBAC)
Complete admin system with `admin_accounts` table and permission tiers.

| Tier | Permissions | Status |
|------|------------|--------|
| `super_admin` | Everything: manage admins, delete platform data, view all | ✅ |
| `support_admin` | View creators/fans, impersonate, manage disputes | ✅ |
| `content_admin` | Moderate content, flag/review, approve/reject | ✅ |
| `agent` | AI agent API keys, read-only stats, content list | ✅ |

- [x] `admin_accounts` table in mock data store
- [x] Admin API routes (CRUD admins, login, session)
- [x] Admin UI pages (dashboard, users, content moderation)
- [x] Permission middleware (check role before access)
- [x] AI agent API key generation & validation
- [x] `admin.md` spec written (founder setup, audit log, staff invites, subdomain-ready) — 2026-07-31

## Phase D ✅ Page-by-Page Walk — Skeleton Conversion + Spec Writing (User-Driven)
Walk every screen with the user, back up old code, write design-intent specs. The original "Phase C audit" was folded into this work.

### Skeleton conversion (all screens naked) ✅
- [x] All old screens/pages/tabs backed up to `src/old-code/allScreens/<name>/page-old.tsx`
- [x] All screens replaced with naked skeletons (`return <main className="min-h-screen bg-background" />`)
- [x] 56+ components/hooks moved to `src/old-code/` (parts archive — old code, reference only)
- [x] All 101 code files moved out of `wiredLater/` → `wiredLater/` is now SPECS ONLY (.md); index: `wiredLater.md` (2026-08-03)
- [x] Social scrape route unwired → backed up to `src/old-code/integrations/social-scrape-route-old.ts`, live returns 503
- [x] `useMediaQuery` hook created, typography tokens + `content-grid` added to `globals.css`
- [x] **A1/A1.5/A2 restructure (2026-08-07):** `src/app/` = thin address book (route groups `(public)/ (fan)/[username]/ (creator)/dashboard/ (admin)/admin/` + 2 redirects), new `src/screens/` middleman (15 screen folders, one `index.ts` + `Screen.tsx` per screen). Every page.tsx = 2-line re-export. All checks green.

### Specs written ✅
| Spec | Status |
|---|---|
| `screens/creator-dashboard/my-app/my-app.md` — MEGA spec (8 tabs: Identity, Design, Catalog + 16 types + funnels + scheduling, Artist Links, Integrations, Email, Media Kit, Spotlight; fan 3-layer display; free/pro tiers; build priority) | ✅ |
| `screens/creator-dashboard/network/network.md` — search, billboard, visibility, friend-request collabs, **affiliates** (Section 7) | ✅ |
| `screens/admin/admin.md` — founder setup (token-gated), RBAC, audit log, staff invites, API keys, subdomain-ready | ✅ |
| `ai/ai-features.md` — creator AI assistant (floating widget) | ✅ |
| `ai/ai-agents.md` — AI workforce placeholder (heads-up only) | ✅ |
| `screens/public/landing.md` — landing page | ✅ (deferred) |
| `screens/public/onboarding.md` — onboarding | ✅ (deferred, like landing — signup only; education lives in the deferred landing/demo) |
| `screens/fan-shell/fan-shell.md` — fan shell (guest page + 4 tabs, account model, three gates, bell/notifications, partner hub) | ✅ |
| `features/partner-page.md` — partner content page (fan-only bottom modal) | ✅ |
| `screens/creator-dashboard/overview/overview.md` — dashboard overview (stats, money, checklist, funnel, alerts, admin variant) | ✅ |
| `screens/creator-dashboard/settings/settings.md` — dashboard settings (account/security, payments, notifications, your page) | ✅ |
| `screens/public/login.md` — login | ✅ |
| `features/search.md` — public creator search (unique handle, did-you-mean, two surfaces) | ✅ |
| `screens/public/offline.md` — offline fallback + App Shell for all 3 PWAs, local-first sync | ✅ |
| `screens.md` — all-screen walkthrough index | ✅ |
| `features/messaging.md` — FREE WhatsApp-style chat (floating inbox both sides, requests/block/toggles, groups + announcements, files) + **Part 3 Community** (chat channels only, roles, join rules) | ✅ |
| `features/relationships.md` — **"My Peeps"** umbrella: fan list (filters + CSV), profile drawer (purchases + chat), consent flags. Wiring home DECIDED: Network right rail | ✅ |
| `features/team.md` — creator staff access (Model A, permission toggles, audit log). Wiring home DECIDED: My Peeps → Staffs row | ✅ |
| `monetization/` — split into `index.md` + `owner.md` (platform money: THE RULE everything free until end-of-dev, levers, locked pricing) + `creators.md` (creator money: catalog sales + affiliate deal model) | ✅ |
| `features/partnership.md` — outside-app invite flow (`?invite=CODE` → auto-partnership, shared `partnerships` + `source` flag). Wiring home DECIDED: My Peeps → Partners row | ✅ |

> **2026-08-05:** `wiredLater/` restructured — specs grouped by category (`screens/creator-dashboard/`, `screens/admin/`, `screens/fan-shell/`, `screens/public/`, `features/`). Features = cross-cutting, NOT sidebar screens. **2026-08-05 (later):** all feature wiring homes decided — Network = 3-section anchored layout (left rail Discover+Affiliates / center detail / right rail **My Peeps**); Relationships/Team/Partnership live inside My Peeps; monetization split into owner/creators files.

- [x] Old spec files merged into my-app.md / network.md (catalog-roadmap, funnel, integrations, email, media-kit, affiliates → stub pointers)
- [x] `SCREEN_INVENTORY.md` deleted (superseded by screens.md)
- [x] Competitor research (Linktree, Stan Store, Beacon) informed catalog + AI vision

## Phase F 🔵 Wiring Pass (NEXT)

Rebuild every screen from its spec (`wiredLater/`, .md only). Old code is reference-only in `src/old-code/` — copy patterns, never wire from it directly.

> **The execution map is `WIRING_PLAN.md` at the repo root** — 23 connection-map sheets in order (foundation → screens → features → fan shell). Wire one sheet at a time, run the 3 checks after each.

- [x] **Foundation prep (2026-08-07):** adopted `api-utils`/`api-error`/`requireAuth` → `src/lib/` (G6) · renamed `Playground*` → `MyApp*` types + added messaging/team/affiliate/relationships types · added 9 brand presets to `branding.ts` · added 14 mock tables · deleted 5 dead files · added 5 missing rate limits + pageview migrated to the shared limiter
- [x] **Sheet 6 (2026-08-10) — Login:** AuthCard + LoginForm (mock auto-signup fallback, mock social buttons, root-cause error copy, `?next=`) + `/api/creator/check-username` relaxed to anonymous
- [x] **Sheet 7 (2026-08-10) — Onboarding:** OnboardingForm (Link Address availability + permanence dialog) + `/api/creator/register` + `/api/creator/forgot-password` + forgot-password page
- [x] **Sheet 19-V1 (2026-08-11→13) — My App:** full-screen phone preview, Identity/Design/Catalog/Artist Links tabs, **all 16 catalog item types** + generic ItemEditor + PricingEditor, Draft/Live/Deploy, auto-save, tap-to-edit, theme presets/fonts/button styles/radius (2026-08-12 theme pass), **device file uploads** for video/image/audio/pdf + product cover + course lessons (2026-08-19 upload pass)
- [x] **Sheet 21-V1 (2026-08-11) — Fan Shell:** guest 3-layer page + 4-tab fan app, email-only follow, mock PayPal checkout, receipts, install trio, no-password render rule
- [x] **Sheet 12 (2026-08-17) — Messaging:** full chat engine (12 `/api/chat/*` routes + ChatShell — floating inbox both sides, requests/block/toggles, groups + announcements, attachments)
- [ ] Rebuild fan page from fan-shell.md (guest page + 4-tab PWA) — **DONE as Sheet 21-V1** (see above); remaining spec parts: community CTA polish, claim purchases
- [ ] Rebuild My App from my-app.md (formerly Playground — full-screen guest-first phone view, swipeable 5 surfaces, tap-to-edit brand popovers, editor sheet with 8 tabs, draft system, deploy, A/B test of the 4 editor options) — **core DONE as Sheet 19-V1** (Option A sheet; 4 live tabs; Integrations/Email/MediaKit/Spotlight = soon placeholders)
- [ ] Rebuild Network from network.md (3-section anchored layout: Discover + Affiliates left rail, center detail, My Peeps right rail — collabs, affiliates, partnerships, team, fans)
- [ ] Wire cross-cutting features per their specs (messaging/community, My Peeps/relationships, team, partnership, partner page, search) — **messaging DONE (Sheet 12); community + the rest remain** (wiring homes decided: Network = My Peeps right rail for relationships/team/partnership)
- [ ] Rebuild Admin from admin.md (founder setup, RBAC, audit log)
- [ ] Rebuild remaining screens (landing, overview, settings, search, offline) — login/onboarding/forgot-password **DONE** (Sheets 6-7); landing + onboarding **specs deferred** to the post-launch polish pass
- [ ] Wire AI assistant per ai-features.md
- [ ] Run `check-docs.py` and fix all gaps
- [ ] Final typecheck + lint pass

## Phase G — Post-Launch Features (Deferred)
Listed for awareness, not actively planned until Phase F is done.

- [ ] PDF export (`jspdf`)
- [ ] Static site generator for creator pages
- [ ] Custom domains (Vercel alias or reverse proxy)
- [ ] Real Stripe Connect integration
- [ ] Real Groq AI integration
- [ ] Real Resend email integration
- [ ] Founder setup page + audit log (spec'd in admin.md)
- [ ] AI agent workforce (sticky note in ai-agents.md)
- [ ] Real push notifications, real analytics, coupon codes, follow-source tracking

## Pre-Launch Security Hardening

- [ ] Rate limiting on auth endpoints (login, signup, password reset)
- [ ] CSRF tokens on state-changing POST routes
- [ ] Plan for rotating the Supabase service-role key on a schedule
- [ ] Content-Security-Policy header (start in report-only mode)
- [ ] Wire Upstash for production rate limiting (replace in-memory)
