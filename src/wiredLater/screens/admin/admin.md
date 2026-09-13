# Admin System — Vision & Spec

## Concept

The Admin system is the platform owner's control room. One surface, one set of doors, role-based keycards. The owner (founder) claims the platform once, invites staff with roles and custom permissions, and can see everything happening across the entire platform — including what staff are doing.

**Core principle — one door, different keycards:** There is NO separate admin login. The owner, staff, and creators all sign in at `/login`. The difference is what the account is allowed to see and do afterward. Same as Facebook/Zuck — the CEO's account is a normal account with elevated privileges.

---

## Part 1: Access Surface

### Where it lives

- **Path:** `/admin` — a top-level route, separate from the creator dashboard shell (admins reach it via the sidebar 👇)
- **Sidebar:** Admins see a 5th nav item — 🔐 "Admin Panel" (`SidebarContent.tsx`). Regular creators see only the 4 tabs (Overview, Network, My App, Settings + Admin only for admins)
- **Overview page difference:** For admins, `/dashboard` shows **platform-wide stats** (all creators, all fans, all revenue) instead of personal stats. Personal stats remain available in My App.

### Who gets in

| Persona | Access |
|---|---|
| **Founder (owner)** | Created via the founder setup page → `super_admin` keycard |
| **Staff (invited)** | Invited via Admins tab → assigned role → keycard per role |
| **AI agents (future)** | Same invite flow with `agent` role + API key |
| **Everyone else** | No admin access — never see the panel |

### Authentication methods (decided)

One door, different keycards — but the credential type differs by role:

| Persona | Signup | Login | Notes |
|---|---|---|---|
| **Fan** | Email + password | Email + password | Frictionless — consumers. See `screens/fan-shell/fan-shell.md` Part 5 |
| **Creator** | Email + password (onboarding) | Email + password at `/login` | Standard credential for daily power users |
| **Staff (invited)** | Invite link → normal signup | Email + password at `/login` | Same door, admin keycard |
| **Founder** | One-time founder setup page | Email + password at `/login` | Claims platform once, then normal door |
| **AI agents** | None | **API key** (machine-to-machine) | Robots don't type passwords |

**2FA (future, optional):** For creators and staff handling money — optional TOTP toggle in settings, off by default, "recommended for accounts with sales." Never forced (industry standard: Patreon, Stan Store, Linktree all optional). Passkeys (face/fingerprint) are a future upgrade — Supabase supports them natively.

### Subdomain-ready (migration note)

The admin panel is built as a **separate surface inside the app** (path-based). It is architected so it can move to its own subdomain later (e.g. `admin.creatorbiotree.com`) with **zero code changes** — DNS + middleware rewrite only.

- **Now (development):** `/admin` inside the app
- **Later (production):** `admin.<domain>` → middleware rewrites to the same route
- The panel code never changes; only the street address does.

---

## Part 2: Founder Setup

### What it is

A one-time, token-gated page that claims ownership of the platform. Ghost CMS / WordPress style.

**URL:** `/founder/setup?token=<CREATORBT_SETUP_TOKEN>`

### How it works

1. **`.env.local`:** The founder sets `CREATORBT_SETUP_TOKEN=some-secret-string` before deploying
2. **Visit:** Founder opens `/founder/setup?token=some-secret-string`
   - Without the token (or with the wrong one) → page shows nothing / "Not found"
   - With the correct token → shows the setup form: **email + password**
3. **Create:** Founder submits → account created → marked `super_admin` in `admin_accounts`
4. **Token consumed:** The setup token is used once, then **self-destructs** — the page now says "Already set up. Sign in."
5. **Redirect:** Founder lands on `/admin`

### Why one-time + token-gated

- **Token-gated:** only the person who deployed the app (knows the secret in `.env.local`) can find the setup door. Strangers can't claim ownership.
- **One-time (self-destructing):** after the platform has an owner, nobody can ever take over via the setup URL. The "claim ownership" door closes forever.

### Day 2+ (every day after)

The founder uses `/login` like everyone else — email + password. The founder never touches the setup URL again. If they lose their password → forgot-password flow, NOT the setup URL.

### What if already set up?

- `?token=...` visited after setup → "Already set up. Sign in." + link to `/login`
- Setup token missing from env → page always "Not found" (setup is disabled)

---

## Part 3: Admin Overview

### Stats (platform-wide)

Big-number cards: Total Creators, Total Fans, Content Items, Total Revenue.

### Activity Feed (the "how does everyone see everything" part)

A live feed on the Admin Overview showing ALL recent platform events:

| Event | Shows |
|---|---|
| New creator signed up | display name, joined date |
| Creator published/deployed content | creator, item count |
| New fan joined | creator, fan count |
| Sale / purchase | creator, item, amount |
| Collab formed | creator A ↔ creator B |
| Admin action | who, what, target |
| AI agent action *(future)* | agent, what it did |

**Admin/Staff status section:** a strip showing every admin account — name, role badge, last active timestamp, active/inactive indicator. This is how the founder "gets updates on staff" — who's active, what they last did, in one glance.

---

## Part 4: Admins Tab (RBAC Management)

### Invite flow (staff, real people, AI agents)

1. Founder goes to Admin Panel → **Admins** tab → **Invite Admin**
2. Enter email + pick role → optionally tick custom permission toggles
3. System creates an `admin_invites` row with a UUID token
4. Invitee clicks the invite link → **dedicated admin accept screen** (see below) → **auto-promoted** to the invited role on first login
5. Invitee now logs in at `/login` every day with their keycard

### Dedicated admin signup (NOT creator onboarding — founder decision 2026-08-08)

Admin staff are **helpers, not creators** — they must NOT go through the creator onboarding (no Link Address, no My App, no fan page). The invite link opens a **minimal accept screen**:

- Fields: **email + password** only (password set here or on first login)
- No Link Address / display name / onboarding steps — staff never pick a public fan URL
- The account is created as a normal platform account, **silently marked with the invited admin role** in `admin_accounts` (`username` stays null on the `creators`-table row — staff only get a fan URL if they ever choose to become a creator separately)
- After accept → redirect to `/login` → they sign in with their keycard → Admin Panel visible in the sidebar

**Who uses which door (summary):** admin staff + team members (`team.md`) = lightweight accept screens; creators + invited partners (`partnership.md`) = full onboarding.

### Roles & permissions

| Role | Permissions |
|---|---|
| **super_admin** | manage_admins, view_all, delete_platform_data, manage_content, manage_support, api_access |
| **support_admin** | view_creators, view_fans, impersonate, manage_disputes |
| **content_admin** | moderate_content, flag_content, approve_content, reject_content |
| **agent** | api_access (API key generated) |

Custom permission toggles: each admin account has a `permissions` field (`Record<string, boolean>`) that can override/extend their role defaults — the "give them whatever access I want" part. Super admins can tick/untick individual permissions per person.

### Manage existing admins

- List: name, email, role badge, last active, created date
- **Edit role:** change someone's role at any time
- **Revoke:** remove an admin → keycard dies instantly. Their creator account (if any) is untouched — they just lose admin powers.
- **Self-guard:** a super_admin cannot revoke themselves (avoid locking out the platform). Also cannot demote the founder... or can, if founder is `super_admin` too — decided at implementation.

### API keys

Generate API keys for agent accounts (`api_...` strings). Shown once, never again. For AI agents to access read-only platform data.

---

## Part 5: Audit Log

### What it is

An `admin_activity_log` table recording every admin action forever. The airplane black box.

**Recorded per action:**
- Who (admin user id + email)
- What (action type: promote, demote, revoke, delete, feature, config change, api-key generated)
- Target (which account/item was acted on)
- When (timestamp)

**Visible to:** super_admins (and role-based subset if useful)
**Why:** rewind any moment — who did what, when. If something goes wrong, you see exactly who to talk to.

---

## Part 6: AI Agents (future)

AI agents can be granted admin access through the **same invite flow** — they're just accounts with the `agent` role + API key. The founder can grant/revoke/track them exactly like staff.

Full AI workforce vision (hierarchy, Telegram/WhatsApp, customer service, bug detection) → **`ai/ai-agents.md`** (placeholder spec).

---

## Part 7: Existing Code (what's already built)

| Piece | Location | Status |
|---|---|---|
| Roles + permission map | `src/types/index.ts` — `AdminRole`, `ADMIN_PERMISSIONS` | Live |
| Permission helpers | `src/lib/admin-permissions.ts` — `canPerform()`, `getAdminAccount()` | Live |
| Admin API routes | `src/app/api/admin/*` (stats, accounts, creators, api-keys, fans) | Live |
| Admin page (3 tabs) | `src/old-code/allScreens/dashboard-admin/page-old.tsx` | Backed up — rebuild from this spec |
| Auth guards | `src/old-code/requireAuth.ts` | Backed up |
| Admin sidebar item | `src/old-code/SidebarContent.tsx` | Backed up |
| Mock auto-promote | `src/lib/mocks/mockDataStore.ts` — `seedAdminAccounts()` | Live (promotes `creators.role === "admin"`) |

---

## Part 8: Production Notes (what changes when real services arrive)

| Piece | Mock | Production |
|---|---|---|
| Founder setup token | Read from env (or mock store) | Real env var; token rotation after use |
| Invite emails | Logged to console | Sent via Resend |
| Admin accounts | In-memory `admin_accounts` table | Supabase `admin_accounts` table |
| Audit log | In-memory table | Supabase `admin_activity_log` table |
| API keys | Fake `api_...` strings | Real keys, hashed at rest |
| Activity feed | Derived from mock tables | Real-time from events table |

---

## Merger Reference

Replaces the 4-line Screen 10 mention in `screens.md` (this file is the full spec).
