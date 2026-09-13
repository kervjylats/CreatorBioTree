# Screen Specs — Walkthrough

Each screen is documented here as we walk through it. The specs from `src/wiredLater/` that apply to each screen are listed. Old code referenced below lives in the parts archive at `src/old-code/` — reference only, never wire from it directly.

**How this is organized (founder decision 2026-08-05):** screens are grouped by WHAT THEY ARE, not numbered 1-22:

| Category | What it is | Screens |
|---|---|---|
| **Creator Dashboard** | The 4 major sidebar screens | Overview, Network, My App, Settings |
| **Admin** | Platform owner + staff control room | Admin (separate from the creator dashboard) |
| **Fan Shell** | What fans experience at `/[username]` | Guest page + 4-tab app (Home, Content, Connect, Settings) |
| **Public** | Outside the app, no sidebar | Landing, Login, Onboarding, Offline |
| **Features** | Cross-cutting — live AS tabs/sections inside the above | Search, Messaging, Relationships, Team, Partnership, Partner Page |

> **A feature is NOT a sidebar screen.** Messaging, Relationships, Team, Partnership, Partner Page, and Search have no sidebar entries of their own — each lives inside one or more of the major screens (wiring home per feature is marked TBD where undecided).

---

# Creator Dashboard (4 major screens)

## Dashboard Overview `/dashboard`

Stats cards (views, installs, content, fans, revenue), activity timeline (branding → content → traffic), QR code, fan email export.

**Full spec: `screens/creator-dashboard/overview/overview.md`**

Parts archive (old code) available:
- [DashboardTimeline.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\DashboardTimeline.tsx)
- [AnalyticsWidgets.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\AnalyticsWidgets.tsx)
- [CreatorManagementWidgets.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\CreatorManagementWidgets.tsx)
- Backup: [dashboard-overview/page-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\dashboard-overview\page-old.tsx)

---

## Dashboard Network `/dashboard/network`

**3-section anchored layout (DECIDED 2026-08-05):** left rail (Discover + Affiliates) · center (detail of the selected row) · right rail = **My Peeps** (the anchored people umbrella — Partners / Fans / Staffs rows; see `features/relationships.md`).

- **Discover** — creator directory: search, billboard cards, collab requests inbox, visibility settings
- **Affiliates** — My Earnings / Discover / My Links + the deal config form (scope: per-item vs per-creator · trigger: purchase/follow/subscribe/tip/signup/any · type: %/fixed/free/tiered/custom; asymmetric, no min/max — economics in `monetization/creators.md` Part 2)
- **My Peeps (right rail)** — Partners row (collab list + partnership invites), Fans row (fan list), Staffs row (team list)

**Full spec: `screens/creator-dashboard/network/network.md`** (friend-request style, discovery directory, discoverability toggle, affiliates §7)

Cross-cutting features that live here (**wiring homes DECIDED**): **Partnership** → My Peeps → Partners row (`features/partnership.md`), **Relationships/My Peeps** → right rail (`features/relationships.md`), **Team** → My Peeps → Staffs row (`features/team.md`).

Parts archive (old code) available for the discovery directory:
- [CreatorCard.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\CreatorCard.tsx)
- [CreatorSearchInput.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\CreatorSearchInput.tsx)
- [DiscoverCreators.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\DiscoverCreators.tsx)
- [useCreatorSearch.ts](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\useCreatorSearch.ts)
- [search-utils.ts](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\search-utils.ts)
- Backups: [network/page-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\network\page-old.tsx), [network-page-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\network\network-page-old.tsx), [PartnerInviteCard-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\network\PartnerInviteCard-old.tsx), [partnershipService-old.ts](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\network\partnershipService-old.ts), `src/old-code/allScreens/network/api/*-route-old.ts`

---

## My App (formerly "Playground") `/dashboard/my-app`

**The one place where a creator sees + edits their entire fan shell** (replaces both the old Playground editor and the old "View my fan page" action — founder decision 2026-08-05). Full spec at `screens/creator-dashboard/my-app/my-app.md` (file was renamed from `playground.md` 2026-08-05; "My App" is the user-facing name).

- Opens **full-screen** phone view, **guest page first**, swipe Guest → Home → Content → Connect → Settings
- **Tap-to-edit popovers** = the brand layer (background / text / font / button / card / link — universal across all surfaces; Part 1a)
- **Editor sheet** with the 8 tabs: Identity, Design, Catalog (16 item types + funnels + link scheduling), Artist Links (rich social embeds), Integrations (Auto-DM + Commerce), Email (campaigns), Media Kit (brand kit), Spotlight — 4 editor options (A sheet default / B replace / C drawer / D in-place) all specced for A/B test at wiring (Part 1c)
- **PWA separated** — App Name, App Icon, status bar color live in Identity → App sub-section, NOT on-page
- Includes: draft system, unsaved-changes guard, deploy button, **all features free in v1** (no Free/Pro tier gate — see `monetization/owner.md` Part 1). **Preview state toggle (Draft / Live)** at top of the full-screen view — see Part 1b.

**Cross-cutting: Branding** — the Design tab is the editor; the full theme system (2-layer model, 9 presets, resolver, 4 safety rules, 7 v1 extensions, 5 later extensions, 7-day lock) lives in `features/branding.md` (single home for the entire rebrand system).

My App editor-tab stub specs (merged, reference only — in `features/`): [catalog-roadmap.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\catalog-roadmap.md), [funnel.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\funnel.md), [integrations.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\integrations.md), [email-campaigns.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\email-campaigns.md), [media-kit.md](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\wiredLater\features\media-kit.md)

---

## Dashboard Settings `/dashboard/settings`

Money, identity, and permissions — never page design (branding/content live in My App; analytics in Overview).

**Full spec: `screens/creator-dashboard/settings/settings.md`** (account/security, payments/payouts, billing, notifications, messaging & privacy, your page, integrations stub, danger zone)

Parts archive (old code) available:
- [StripeConnectPanel.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\StripeConnectPanel.tsx)

---

# Admin (platform owner + staff)

## Admin `/admin`

Platform stats, creator table with sort/feature toggle, admin account management (RBAC), AI agent API key generation.

Built during Phase E. Three tabs: Overview, Admins, API Keys.

**Full spec: `screens/admin/admin.md`** (founder setup, audit log, staff invites, subdomain-ready)

Staff access for creators (their own team members) is a separate cross-cutting feature: `features/team.md`.

Parts archive (old code) available:
- Backup: [dashboard-admin/page-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\dashboard-admin\page-old.tsx)

---

# Fan Shell (what fans experience)

## Fan Shell `/[username]`

**Full spec: `screens/fan-shell/fan-shell.md`** (account model, three gates, guest vs fan views, 4 tabs, auth).

Guest view: PublicCreatorPage (3-layer storefront + signup/login entry).
Auth view: 4-tab PWA (Home activity hub, Content catalog feed, Connect partners hub, Settings account hub).

**Connect tab = the connection hub** (DECIDED layout: **Billboard** rotating deal partners at 2× weight + names of all partners underneath · **All Partners** left column · **Followed** right column with "Following ✓" badges · **Community** + **Artist Links** bottom; self-gating sections, no placeholders, creator-configurable all-empty message; follow toggle lives in the partner modal only — `fan-shell.md` Part 4c). Artist links were **moved from the Content tab to the Connect tab** as rich cards — the Content tab is now a true 3-layer view (Header → Spotlight → Catalog Feed).

**Messaging:** the fan shell carries the floating 💬 inbox (logged-in fans) and the guest contact button (logged-out visitors) — see `features/messaging.md` Part 1.

**Community:** the Home tab carries the Community section (channel list + join/leave); the guest page carries the "Join the community" CTA card — see `features/messaging.md` Part 3.

**Partner page:** the Connect tab opens the partner modal — see `features/partner-page.md`.

Parts archive (old code) available:
- Generic utilities: [SocialLinks.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\SocialLinks.tsx), [LoadingSpinner.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\LoadingSpinner.tsx), [EmptyState.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\EmptyState.tsx), [ErrorBoundary.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\ErrorBoundary.tsx)
- Fan components: [FanAppShell-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\fan-page\FanAppShell-old.tsx), [PublicCreatorPage-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\fan-page\PublicCreatorPage-old.tsx), [page-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\fan-page\page-old.tsx), `tabs/` (`HomeTab-old`, `ContentTab-old`, `ConnectTab-old`, `SettingsTab-old`) — plus generic parts: [FanAuthModal.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\FanAuthModal.tsx), [FanBottomNav.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\FanBottomNav.tsx), [CreatorHeader.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\CreatorHeader.tsx), [GuestPageContent.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\GuestPageContent.tsx), [FollowButton.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\FollowButton.tsx), [PoweredByFooter.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\PoweredByFooter.tsx), [FanStatsCard.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\FanStatsCard.tsx)

---

# Public (outside the app, no sidebar)

## Landing `/`

Sections needed: Header, Hero, Features, Testimonials, Demo, CTA, Footer

**Full spec: `screens/public/landing.md`** — **DEFERRED** (post-launch polish pass). The first screen people who haven't joined see when clicking a creator's link or visiting the site. Embeds the shared search component (`features/search.md`).

WiredLater files available:
- [LandingHeader.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\LandingHeader.tsx)
- [HeroSection.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\HeroSection.tsx)
- [FeaturesSection.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\FeaturesSection.tsx)
- [TestimonialsSection.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\TestimonialsSection.tsx)
- [DemoSection.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\DemoSection.tsx)
- [CTASection.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\CTASection.tsx)
- [Footer.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\Footer.tsx)

---

## Login `/login`

Creator sign-in with email + password. Uses Supabase auth; mock mode sets `mock_auth_uid` + `mock_auth_email` cookies. **WIRED 2026-08-10 (Sheet 6).**

**Full spec: `screens/public/login.md`** — one door for everyone (owner, staff, creators, fans use separate fan auth).

Live files:
- [AuthCard.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\components\auth\AuthCard.tsx)
- [LoginForm.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\components\auth\LoginForm.tsx)
- `src/screens/public/login/Screen.tsx` (server component)

---

## Onboarding `/onboarding`

**WIRED 2026-08-10 (Sheet 7)** — Link Address (permanent, never changeable) with live debounced availability check, display name, email, password, permanence confirm dialog. Supports `?invite=` param for partnership invites (spec: `features/partnership.md`). **Design/education copy deferred** to the post-launch polish pass, like the landing page.

Live files:
- [OnboardingForm.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\components\auth\OnboardingForm.tsx)
- [AuthCard.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\components\auth\AuthCard.tsx)
- `POST /api/creator/register` · `GET /api/creator/check-username`

---

## Offline `/offline`

PWA offline fallback: "You're Offline" message + "Try Again" button, served by the service worker when navigation fails. Full spec in `screens/public/offline.md` — covers the App Shell pattern for all 3 PWAs (landing, dashboard, fan apps), tiny-pocket storage rules, local-first server-synced drafts/saved items, and downloads-with-permission.

---

# Features (cross-cutting — NOT sidebar screens)

Each of these lives inside one or more of the screens above. Wiring home per feature is TBD where marked.

## Search (feature)

Public creator discovery: unique Link Address handle (user-facing name; code/docs keep `username` — permanent, set once at signup) + display name, discoverable-only, featured first, "Did you mean?" typo suggestions on zero results. Full spec in `features/search.md`. **One component, three placements:** the `/search` page, the landing page (built later with the deferred landing), and the Network search. Landing page embeds the same search component.

---

## Messaging (feature — floating inbox, every screen)

**Full spec: `features/messaging.md`** — FREE WhatsApp-style chat for every party.

Surfaces:
- **Dashboard** `/dashboard/messages` — creator inbox (fan/guest/collab conversations, unread-count badge in the sidebar; see `overview.md` Part 7)
- **Fan shell** — header chat icon (top-right) + floating bottom-right 💬 inbox on every screen (see `fan-shell.md` FanAppShell); guest contact button for logged-out visitors
- **Network** — chat icons next to creator names (creator↔creator, before/after collabbing; see `network.md` §5)
- **Partner page** — chat icon next to partner names (fan↔partner)
- **Offline** — messages queue locally and sync (see `screens/public/offline.md`)

No new screen route beyond `/dashboard/messages` — the rest lives inside the fan shell frame and existing screens. Full data model, requests/block/toggles, group chats + announcements, Community (Part 3), and the single-file `ChatShell.tsx` plan are all in `messaging.md`. **Status: WIRED 2026-08-17 (Sheet 12)** — `src/components/chat/ChatShell.tsx` + `src/lib/chat.ts` + 12 `/api/chat/*` routes; Community (Part 3) remains unbuilt.

---

## My Peeps / Relationships (feature — Network right rail, DECIDED)

**Full spec: `features/relationships.md`** — **"My Peeps"**: the anchored right rail of the Network page, an umbrella over Partners / Fans / Staffs.

- **Partners row** — collab list + partnership invites + "Invite a partner" (see Partnership below)
- **Fan list** — email, joined, referred-by, status chip, lifetime value, last purchase + quick filters + CSV export (replaces the old fan-export widget)
- **Profile drawer** — per fan: purchases, subscription, installs/activity, **message history (ChatShell reuse)**, creator notes, actions
- **Staffs row** — the team list (see Team below)
- **Consent** — do-not-contact flag, email opt-out flag, GDPR note
- Collabs → `network.md`; community members → `messaging.md` Part 3

**Wiring home DECIDED (2026-08-05)** — Network page → **My Peeps right rail, anchored (Layout B)**. Not an own tab, not Overview.

Old code (reference): [FanStatsCard.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\FanStatsCard.tsx) (old fan modal table), [CreatorManagementWidgets.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\CreatorManagementWidgets.tsx) (`FanExportButton`), backup [dashboard-overview/page-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\dashboard-overview\page-old.tsx).

---

## Team (feature — My Peeps → Staffs row, DECIDED)

**Full spec: `features/team.md`** — creator staff access (Model A identity).

- **Invite flow** — owner invites by email → 7-day expiry link → signup/login → permission toggles granted
- **Permission toggles** — Content · Stats · Relationships · Messages · Community · Network · Settings · Money — all OFF by default, owner ticks per person
- **Context switcher** — team members switch between their own dashboard and managed ones (members can be creators themselves)
- **Audit log** — `creator_team_activity`, owner-only visibility
- **Wiring home DECIDED (2026-08-05)** — Network page → My Peeps → **Staffs row**

No parts-archive reference — this feature was never built, wires fresh from the spec.

---

## Partnership (feature — My Peeps → Partners row, DECIDED)

**Full spec: `features/partnership.md`** — inviting creators from OUTSIDE the app to become partners.

- **Invite** — creator generates a 7-day single-use `?invite=CODE` link (My Peeps → Partners row, "Invite a partner")
- **Join** — outsider completes normal onboarding ("Join your partner") → post-signup route auto-connects them (`partnerships` row, `source: "invited"`)
- **No request/accept** — the link IS the mechanism
- **One shared data model** — `partnerships` + `source` flag (`collab` | `invited`); `partner_invites` table
- **Terminology split (founder decision)** — outside-app invite = **Partnership**; in-app creator↔creator = **Collabs** (`network.md`)
- **Wiring home DECIDED (2026-08-05)** — Network page → My Peeps → **Partners row**

Old code (reference): [PartnerInviteCard-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\network\PartnerInviteCard-old.tsx), [creator-partners-invite-route-old.ts](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\network\api\creator-partners-invite-route-old.ts), [creator-partners-onboarding-route-old.ts](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\network\api\creator-partners-onboarding-route-old.ts).

---

## Partner Page (feature — reached from the fan Connect tab)

**Full spec: `features/partner-page.md`** — fan-only bottom modal (~3/4 screen) reached from the Connect tab: partner's own view (Header → Spotlight → Artist Links → Catalog Feed) + branding, top-right Follow / + (subscribe) / unfollow. No signup ever. Follows survive collab endings. Guests redirect to `/{username}`.

Also: `screens/fan-shell/fan-shell.md` Part 3 (3 similar layouts) + Part 4c (Connect tab — the connection hub: Billboard rotating deal partners at 2× + names of all partners, All Partners / Followed columns, Community + Artist Links, creator-configurable empty state).

Currently a naked skeleton. Old placeholder kept at [src/old-code/allScreens/partner-page/page-old.tsx](vscode://file/C:\Users\rowlu\Documents\creatorpwa\src\old-code\allScreens\partner-page\page-old.tsx) (reuse its fan-auth gate + branding resolution).
