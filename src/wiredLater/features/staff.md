# Staff — Vision & Spec

## Concept

**Creator staff access.** A creator invites trusted people (staff, family, friends, collaborators) to access their dashboard with controlled or full permissions. The owner holds all keys; every invitee gets exactly the access the creator grants — nothing more.

Built on the platform admin pattern (`admin.md` Part 4) — same "one door, different keycards" principle: **there is NO separate staff login.** Everyone signs in at `/login`; the account determines what's visible afterward.

> **Naming law (founder decision 2026-09-29):** exactly three account types, each with one word, everywhere (UI + code + spec): **Creator** (self-signup, gets a fan page), **Staff** (a creator's invited helpers — this spec; dock button "Staff", `/dashboard/circle/staff`, `/api/creator/staff/*`), **Admin** (the platform's staff — the founder's invitees; `admin.md`). "Staff" NEVER means platform staff; "Admin" NEVER means creator staff.

**Identity model (founder decision, from competitor research):** **Model A — personal account first, role grants.** Staff members are REGULAR accounts — they sign in with their own identity, and the creator grants them a role on their dashboard. There are no "pure staff" logins (Meta/Facebook, Patreon, Substack, Canva, Notion all work this way; only Shopify-style business tooling provisions org-scoped logins — wrong fit for family/friend helpers).

**Our upgrade over Patreon:** Patreon's Team Accounts forbid teammates from being creators themselves. We deliberately ALLOW it — a person can be staff on someone's dashboard AND have their own creator page. They see how the app works from the inside, and if they like it, they become a creator → free advertising for the platform.

**Acting identity:** inside the managed dashboard, the staff member acts "as the creator" (replies to fans as the creator, edits their content). Everywhere else, they are themselves. The audit log (Part 5) records which real person did what.

---

## Part 1: Roles & Permissions

### Owner (the creator)

- Full access to everything on their own dashboard — always. Can never be revoked or demoted (self-guard).
- The only one who can: invite/revoke staff members, change permission toggles.

### Staff member (invited)

No preset role ladder in v1 — **permission toggles only** (founder decision). The creator ticks on/off each area per person:

| Toggle | What it grants |
|---|---|
| Content | My App (formerly Playground): create/edit/publish catalog items, artist links, spotlight, media kit |
| Overview & stats | View dashboard stats, money section, activity feed (read-only) |
| Relationships | View fan list + profile drawers, do-not-contact flag, export CSV |
| Messages | Inbox: read + reply to fan/guest/collab conversations (acts as the creator) |
| Community | Community admin controls (channels, roles, members, moderation) |
| Network | Collabs, discovery, affiliate management |
| Settings | Account, billing, custom domain — **default OFF**, warning shown when enabled |
| Money | Payouts, PayPal, refunds — **default OFF**, warning shown when enabled (Patreon hard-blocks this entirely; we let the creator decide — founder call) |

**Defaults:** every toggle OFF except none — a new invite starts with zero access until the creator explicitly grants areas. One-click **"Full access"** preset exists for convenience (turns everything on — except it leaves Settings/Money at OFF unless the creator explicitly enables them, with the warning).

**Why toggles, not roles:** the creator's mental model is "I want Priya to handle my content and messages" — not "Priya is an Editor." Toggles map 1:1 to that. Roles can be added later as named presets over the same toggle system (no redesign — a role is just a saved toggle combination).

---

## Part 2: Invite Flow (link-first — the inviter never needs the email)

1. **Owner** → My Peeps → **Staffs** row → **Invite member**
2. Form: tick the permission toggles + role, and *optionally* type the person's email — **email is optional** (it only pre-fills their signup form; skip it when you don't know it or might typo it) → **Create invite link**
3. System creates a `creator_staff_invites` row with a UUID token (7-day expiry)
4. Owner shares the **link** however they like — message, email, in person, inside the app. **You never need to know their email up front** (founder decision 2026-09-29)
5. Invitee opens the link → the shared **accept screen** `/accept?token=…` (a PUBLIC page — no account needed yet; defined in `login.md` "one door, three keycards") → they **sign up with their own email + password** (or sign in if they already have an account). **No Link Address, no creator onboarding** — staff are helpers, not creators (founder decision 2026-08-08)
6. On accept → account created/reused, minimal `creators` row silently created (`username = null`), `creator_staff_members` row inserted with the invited permissions → **auto-activated**
7. Redirect → `/dashboard` — context switcher shows "My dashboard ↔ [Creator]'s dashboard" (Part 3)

**Invite expiry:** 7 days (Shopify/Canva pattern). Expired → owner creates a fresh link.

**Wired status (2026-09-29):** invite API + 7-day token + invite list are LIVE (`/api/creator/staff/invite`), but the live form still *requires* an email and the accept step still requires an existing account — the `/accept` screen is **spec'd, not built** (phase gate). The link-first flow above is the target behavior; the live form is the pre-accept-screen state.

> **Terminology note (founder decision 2026-08-04):** staff invites are NOT partnerships. Partnership invites (inviting an outsider to become a connected creator) flow through onboarding via `?invite=CODE` — see `partnership.md`. Staff invites are staff access only, direct-accept, never auto-connect as partners.

**Invite to existing creator:** if the invitee already has a creator account, they accept and get a **context switcher** — their own dashboard AND the managed dashboard(s). They pick whose dashboard to open (Part 3).

---

## Part 3: The Managed Dashboard (context switching)

**Entry:** a staff member with access to one or more managed dashboards sees a **switcher** (like Instagram account switching / Meta Business Suite asset dropdown): "My dashboard" ↔ "[Creator's name]'s dashboard".

**Inside a managed dashboard:**
- Branding/banner: "You're managing [creator]'s page — limited access"
- Only the toggled areas are visible; everything else hidden (not greyed — hidden)
- Every action is logged (Part 5)
- No access to the owner's personal settings/account page, ever (owner-only surface)

**Multi-manage:** one person can hold roles on several creator dashboards (the agency/freelancer future — Canva/Notion pattern). Each dashboard is a separate entry in the switcher.

---

## Part 4: Manage Staff (owner surface)

| Piece | Behavior |
|---|---|
| Staff list | Name, email, role badge ("Owner" / "Member"), granted toggles, last active, joined date |
| Edit permissions | Change toggles anytime — takes effect immediately |
| Revoke | Remove member → access dies instantly. Their own account (if any) is untouched — they just lose access to your dashboard |
| Re-invite | Re-send an expired invite |
| Self-guard | Owner cannot revoke/demote themselves; owner cannot be removed |

**Where it lives: ✅ DECIDED (2026-08-05)** — Network page → **My Peeps right rail → Staffs row** (`relationships.md` Part 1, `network.md` top layout). Not an own tab, not Settings.

---

## Part 5: Audit Log (in v1 — founder decision)

An `creator_staff_activity` table recording every staff action — the black box for managed dashboards (mirrors `admin_activity_log` from `admin.md`).

**Recorded per action:**
- Who (real user id + email)
- What (action type: edit_content, publish, reply_message, export_fans, change_settings, delete_item, …)
- Where (which area/item)
- When (timestamp)

**Visible to:** the owner only.

**Why:** accountability for delegated access — "who changed my store" is answerable instantly. Also protects the staff member (an honest log proves what they did and didn't do).

---

## Part 6: Data Model & API Routes

### Data model (additions — no auth changes)

| Table | Columns |
|---|---|
| `creator_staff_members` | id, creator_id (owner), user_id (member), permissions (`Record<string, boolean>` — same shape as admin `permissions`), created_at, last_active_at |
| `creator_staff_invites` | id, creator_id, email, token (UUID), permissions snapshot, status (pending / accepted / expired / revoked), expires_at, created_at |
| `creator_staff_activity` | id, creator_id, user_id, action, target, created_at (Part 5 audit log) |

**Identity reuse:** members are `creators`-table accounts (or future unified users) — same `mock_auth_uid`/Supabase auth as everyone else. A member who is also a creator has BOTH a `creators` row and a `creator_staff_members` row.

> **Wiring note (2026-08-08):** a staff member accepted via the lightweight screen needs a minimal `creators`-table row to hold their identity — created silently with `username = null` (no Link Address, no fan URL). They only pick a Link Address later if they ever choose to become a creator themselves.

### API routes

| Route | Purpose |
|---|---|
| `POST /api/creator/staff/invite` | Create invite (owner only) |
| `GET /api/creator/staff/invites` | List invites + status |
| `POST /api/creator/staff/invites/accept` | Accept invite (token) — auto-grants access |
| `GET /api/creator/staff/members` | Staff list (owner) |
| `PATCH /api/creator/staff/members/[id]` | Change permission toggles / revoke |
| `DELETE /api/creator/staff/members/[id]` | Revoke member |
| `GET /api/creator/staff/activity` | Audit log (owner only) |
| `GET /api/creator/staff/contexts` | My managed dashboards (switcher list for staff members) |

Auth: owner-only for management routes; member routes check `creator_staff_members` membership + the specific permission toggle before every action.

---

## Part 7: Deferred Features (end of development)

| Feature | Notes |
|---|---|
| **Paid seats** | Extra seats as premium → decided in `monetization/owner.md` (everything free until then) |
| **Named role presets** | Saved toggle combos ("Editor", "Mod", "Analyst") over the same toggle system — not a redesign |
| **2FA for staff members** | Same optional TOTP as creators (`admin.md` Part 1) |
| **AI staff members** | Agents as staff members — same invite flow, `agent` persona (`ai/ai-agents.md`) |
| **Single sign-on / organization accounts** | Enterprise-level — not v1 |

---

## Part 8: Decisions

| Topic | Status |
|---|---|
| #1 Identity model | ✅ Decided — Model A: regular accounts, role grants, context switcher. Staff members may ALSO be creators (our upgrade over Patreon — free advertising engine) |
| #2 Permissions | ✅ Decided — toggle grid per person, all OFF by default, creator decides everything. Settings/Money default OFF + warning (unlike Patreon's hard block, creator may enable — founder call) |
| #3 Pricing | ✅ Decided — free in v1; paid seats deferred to `monetization/owner.md` |
| #4 Money access | ✅ Decided — same toggle system, default OFF + warning |
| #5 Audit log | ✅ Decided — IN v1 (`creator_staff_activity`), owner-only visibility |
| #6 Wiring home | ✅ **Decided 2026-08-05 — Network page → My Peeps right rail → Staffs row** (alongside Partners and Fans; see `relationships.md` Part 1) |
