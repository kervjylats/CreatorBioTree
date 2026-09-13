# WiredLater — Specs Only (Blueprints for the Wiring Pass)

This folder contains **ONLY spec `.md` files** — the blueprints. No code lives here.

**The one rule: everything outside this folder is OLD code.** When we build (Phase F wiring pass), we base ONLY on these specs. Code files are viewed only when a spec tells us to look at them.

**The parts archive lives at `src/old-code/`** — 101 code files (73 reusable components/hooks + 28 old-screen backups) moved there on 2026-08-03 so `wiredLater/` stays pure spec. Specs reference them as "old code, reference only" — copy the pattern, never wire from them directly.

---

## Spec Index

**How this is organized (founder decision 2026-08-05):** the specs are grouped by WHAT THEY ARE, not numbered 1-22 like screens. Four categories:

- **`screens/creator-dashboard/`** — the 4 major sidebar screens a creator navigates daily
- **`screens/admin/`** — platform owner + staff control room (separate from the creator dashboard)
- **`screens/fan-shell/`** — what fans experience (`/[username]`)
- **`screens/public/`** — outside the app, no sidebar (pre-login pages + offline)
- **`features/`** — **cross-cutting**: not standalone screens — they live AS TABS/SECTIONS inside the major screens (wiring homes TBD per feature). Includes the My App editor-tab stubs
- **Top-level** — `screens.md` (walkthrough index), plus `monetization/` (pricing rules home) and `ai/` (post-launch)

### Screens — Creator Dashboard (4 major screens)

| Spec | What it covers |
|---|---|
| [overview.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\creator-dashboard\overview\overview.md) | Dashboard Overview `/dashboard` — stats cards, activity timeline, QR, fan email export |
| [network.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\creator-dashboard\network\network.md) | Dashboard Network `/dashboard/network` — **3-section anchored layout (DECIDED):** left rail (Discover + Affiliates), center detail, right rail = **My Peeps** (Partners / Fans / Staffs umbrella). In-app collabs (friend-request), discoverability toggle, affiliates (scope + trigger + type deal config) |
| [my-app.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\creator-dashboard\my-app\my-app.md) | My App `/dashboard/my-app` (formerly "Playground" + "My Page" + "View my page") — **the one surface for seeing + editing the fan shell**: full-screen phone view (guest-first, swipeable 5 surfaces), tap-to-edit brand popovers, editor sheet (8 tabs, 16 content types, funnels, scheduling), 4 editor options A/B/C/D specced for A/B test, PWA separated, all features free in v1 |
| [settings.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\creator-dashboard\settings\settings.md) | Dashboard Settings `/dashboard/settings` — account/security, payments, notifications, your page, messaging & privacy, danger zone |

### Screens — Admin (platform owner + staff)

| Spec | What it covers |
|---|---|
| [admin.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\admin\admin.md) | Admin `/admin` — platform stats, RBAC, audit log, founder setup. Staff team access spec'd in `features/team.md` |

### Screens — Fan Shell (what fans experience)

| Spec | What it covers |
|---|---|
| [fan-shell.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\fan-shell\fan-shell.md) | Fan shell `/[username]` — 4-layer account model, three gates, guest vs fan views, 4 tabs (Home / Content / Connect / Settings), The Bell, push broadcasts. **Connect tab (DECIDED):** Billboard (deal partners 2× rotation) + names of all partners, All Partners (left) / Followed (right) columns, Community + Artist Links bottom, empty state |

### Screens — Public (outside the app, no sidebar)

| Spec | What it covers |
|---|---|
| [landing.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\public\landing.md) | Landing page `/` — **DEFERRED** (post-launch polish pass). Embeds the shared search component (`features/search.md`) |
| [login.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\public\login.md) | Login `/login` — creator email + password sign-in (mock: any email/password works). One door for owner/staff/creators |
| [onboarding.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\public\onboarding.md) | Onboarding `/onboarding` — **WIRED 2026-08-10 (Sheet 7)**; education copy + design polish deferred to post-launch. Handles partnership invites `?invite=CODE` (`features/partnership.md`) |
| [offline.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens\public\offline.md) | Offline `/offline` — App Shell for all 3 PWAs, tiny-pocket storage, local-first sync, downloads-with-permission |

### Features — Cross-Cutting (NOT standalone screens)

Live as tabs/sections inside the major screens above. **Wiring homes: ALL DECIDED (2026-08-05)** — see the per-spec rows below (Network = My Peeps right rail for relationships/team/partnership; Messaging = floating inbox + Home tab; Branding = fan shell + My App; Partner page = Connect tab; Search = public + embedded). None have their own sidebar entry.

| Spec | What it covers | Likely home (TBD) |
|---|---|---|
| [messaging.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\messaging.md) | Messaging — FREE WhatsApp-style chat: floating inbox (both sides), 1-on-1 (creator↔creator / creator↔fan / fan↔partner / guest contact), requests + block + toggles, group chats + announcements, files. **Part 3 = Community (DECIDED):** chat channels only, free, Home-tab section, per-channel gates, roles, creator-only moderation, all 3 join rules, guest CTA | Floating inbox = every screen; Community = fan Home tab |
| [branding.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\branding.md) | Branding — single home for the full rebrand system: 2-layer theme model (preset + override), the 9 presets, the resolver (`resolveBranding`), the global set (colors + font + button style + PWA), what the theme does NOT control (messaging inbox, partner page = partner's own, dashboard/platform), 7 easy-win v1 extensions (branded 404/share/loading/empty states, status bar, font pairs, saved palettes), 5 touch-native later extensions (haptics, swipe, transitions, long-press, splash), 4 safety rules (validation / fallback / performance / accessibility), 7-day lock on App Name + Icon + Display Name | Fan shell (every page); editor in My App Design tab + tap-to-edit popovers; Preview state toggle in My App + on owner's "View My App" |
| [relationships.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\relationships.md) | Relationships — **"My Peeps"** (umbrella): fan/client list (table + filters + CSV export), per-person profile drawer (purchases + messages via ChatShell + notes), referred-by/source, consent flags. Collabs → network.md, community → messaging.md Part 3, staff → team.md | **Network page — My Peeps right rail, anchored (DECIDED)** |
| [team.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\team.md) | Team — creator staff access: Model A identity (members are regular accounts, can be creators too), permission toggles per person, invite flow, context switcher, audit log | **My Peeps → Staffs row (DECIDED)** |
| [partnership.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\partnership.md) | Partnership — inviting creators from OUTSIDE the app via `?invite=CODE` link → auto-connected on signup. Built on old code. Shared `partnerships` table + `source` flag | **My Peeps → Partners row (DECIDED)** |
| [partner-page.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\partner-page.md) | Partner page `/[username]/partner/[partnerUsername]` — fan-only bottom modal, Follow / + / unfollow. Reached from the Connect tab (fan shell) | Fan Connect tab |
| [search.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\search.md) | Search — unique @handle, discoverable-only, featured first, "Did you mean?" on zero results. One component, three placements: `/search` page, landing page, Network search | Public `/search` + embedded (landing, Network) |

### Features — My App Editor-Tab Stubs (merged, reference only)

These were merged into `my-app.md` as editor tabs. Kept as stubs pointing at their new home. Founder decision: keep in `features/` for now — some may move elsewhere later.

| Spec | Merged into |
|---|---|
| [catalog-roadmap.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\catalog-roadmap.md) | My App Catalog tab |
| [funnel.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\funnel.md) | My App Catalog tab |
| [integrations.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\integrations.md) | My App Integrations tab |
| [email-campaigns.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\email-campaigns.md) | My App Email tab |
| [media-kit.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\media-kit.md) | My App Media Kit tab |
| [affiliates.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\affiliates.md) | Network Affiliates section |

### Top-Level Specs

| Spec | What it covers |
|---|---|
| [screens.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\screens.md) | Walkthrough of every screen (grouped by the same categories as this index) + which specs apply to each |
| [monetization/index.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\monetization\index.md) | Monetization — **split into 3 files (2026-08-05):** `index.md` (pointer) + `owner.md` (platform money: THE RULE everything free until end-of-dev, decision levers, locked pricing placeholder) + `creators.md` (creator money: catalog sales + full affiliate deal model — 5 types × 2 scopes × 6 triggers, asymmetric, no min/max, platform trust layer) |
| [ai-features.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\ai\ai-features.md) | AI features (full spec) — post-launch |
| [ai-agents.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\ai\ai-agents.md) | AI agent workforce (placeholder) — post-launch |

---

## Parts Archive (`src/old-code/`)

All 101 code files extracted from the old app live here, **outside** `wiredLater/`, and are treated as old code:

- `src/old-code/*` — 56 reusable components/hooks/libs (Sidebar, PhonePreview, catalog editors, useAutoSave, …)
- `src/old-code/catalog/*` — 17 catalog editors (single-item-type → single-editor pattern)
- `src/old-code/integrations/social-scrape-route-old.ts` — unwired social scrape route (live returns 503)
- `src/old-code/allScreens/<name>/*-old.tsx` — 28 old screen/API backups (page-old.tsx, FanAppShell-old.tsx, api/*-route-old.ts, …)

**When a spec says "see old code for the pattern," read the file here. Never wire directly from this folder — rebuild from the spec, using the old code as reference.**
