# Team — Vision & Spec

## Concept

**Creator team access.** A creator invites trusted people (staff, family, friends, collaborators) to access their dashboard with controlled or full permissions. The owner holds all keys; every invitee gets exactly the access the creator grants — nothing more.

Built on the platform admin pattern (`admin.md` Part 4) — same "one door, different keycards" principle: **there is NO separate team login.** Everyone signs in at `/login`; the account determines what's visible afterward.

**Identity model (founder decision, from competitor research):** **Model A — personal account first, role grants.** Team members are REGULAR accounts — they sign in with their own identity, and the creator grants them a role on their dashboard. There are no "pure staff" logins (Meta/Facebook, Patreon, Substack, Canva, Notion all work this way; only Shopify-style business tooling provisions org-scoped logins — wrong fit for family/friend helpers).

**Our upgrade over Patreon:** Patreon's Team Accounts forbid teammates from being creators themselves. We deliberately ALLOW it — a team member can be a staff role on someone's dashboard AND have their own creator page. They see how the app works from the inside, and if they like it, they become a creator → free advertising for the platform.

**Acting identity:** inside the managed dashboard, the team member acts "as the creator" (replies to fans as the creator, edits their content). Everywhere else, they are themselves. The audit log (Part 5) records which real person did what.

---

## Part 1: Roles & Permissions

### Owner (the creator)

- Full access to everything on their own dashboard — always. Can never be revoked or demoted (self-guard).
- The only one who can: invite/revoke team members, change permission toggles.

### Team member (invited)

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

## Part 2: Invite Flow

1. **Owner** → My Peeps → **Staffs** row → **Invite member**
2. Enter email + tick the permission toggles → **Invite**
3. System creates a `creator_team_invites` row with a UUID token
4. Email invite sent (mock: logged to console) — link like `host/dashboard/team/accept?token=...`
5. Invitee clicks → **dedicated lightweight accept screen** (email + password only — **no Link Address, no creator onboarding**; team members are helpers, not creators — founder decision 2026-08-08). If the invitee already has an account: they sign in and accept directly
6. On accept → account is granted the invited role on the owner's dashboard → **auto-activated**
7. Redirect → the managed dashboard (with a "You're managing [creator]" banner)

**Invite expiry:** 7 days (Shopify/Canva pattern). Expired → owner re-sends.

> **Terminology note (founder decision 2026-08-04):** team invites are NOT partnerships. Partnership invites (inviting an outsider to become a connected creator) flow through onboarding via `?invite=CODE` — see `partnership.md`. Team invites are staff access only, direct-accept, never auto-connect as partners.

**Invite to existing creator:** if the invitee already has a creator account, they accept and get a **context switcher** — their own dashboard AND the managed dashboard(s). They pick whose dashboard to open (Part 3).

---

## Part 3: The Managed Dashboard (context switching)

**Entry:** a team member with access to one or more managed dashboards sees a **switcher** (like Instagram account switching / Meta Business Suite asset dropdown): "My dashboard" ↔ "[Creator's name]'s dashboard".

**Inside a managed dashboard:**
- Branding/banner: "You're managing [creator]'s page — limited access"
- Only the toggled areas are visible; everything else hidden (not greyed — hidden)
- Every action is logged (Part 5)
- No access to the owner's personal settings/account page, ever (owner-only surface)

**Multi-manage:** one person can hold roles on several creator dashboards (the agency/freelancer future — Canva/Notion pattern). Each dashboard is a separate entry in the switcher.

---

## Part 4: Manage Team (owner surface)

| Piece | Behavior |
|---|---|
| Team list | Name, email, role badge ("Owner" / "Member"), granted toggles, last active, joined date |
| Edit permissions | Change toggles anytime — takes effect immediately |
| Revoke | Remove member → access dies instantly. Their own account (if any) is untouched — they just lose access to your dashboard |
| Re-invite | Re-send an expired invite |
| Self-guard | Owner cannot revoke/demote themselves; owner cannot be removed |

**Where it lives: ✅ DECIDED (2026-08-05)** — Network page → **My Peeps right rail → Staffs row** (`relationships.md` Part 1, `network.md` top layout). Not an own tab, not Settings.

---

## Part 5: Audit Log (in v1 — founder decision)

An `creator_team_activity` table recording every team action — the black box for managed dashboards (mirrors `admin_activity_log` from `admin.md`).

**Recorded per action:**
- Who (real user id + email)
- What (action type: edit_content, publish, reply_message, export_fans, change_settings, delete_item, …)
- Where (which area/item)
- When (timestamp)

**Visible to:** the owner only.

**Why:** accountability for delegated access — "who changed my store" is answerable instantly. Also protects the team member (an honest log proves what they did and didn't do).

---

## Part 6: Data Model & API Routes

### Data model (additions — no auth changes)

| Table | Columns |
|---|---|
| `creator_team_members` | id, creator_id (owner), user_id (member), permissions (`Record<string, boolean>` — same shape as admin `permissions`), created_at, last_active_at |
| `creator_team_invites` | id, creator_id, email, token (UUID), permissions snapshot, status (pending / accepted / expired / revoked), expires_at, created_at |
| `creator_team_activity` | id, creator_id, user_id, action, target, created_at (Part 5 audit log) |

**Identity reuse:** members are `creators`-table accounts (or future unified users) — same `mock_auth_uid`/Supabase auth as everyone else. A member who is also a creator has BOTH a `creators` row and a `creator_team_members` row.

> **Wiring note (2026-08-08):** a team member accepted via the lightweight screen needs a minimal `creators`-table row to hold their identity — created silently with `username = null` (no Link Address, no fan URL). They only pick a Link Address later if they ever choose to become a creator themselves.

### API routes

| Route | Purpose |
|---|---|
| `POST /api/creator/team/invite` | Create invite (owner only) |
| `GET /api/creator/team/invites` | List invites + status |
| `POST /api/creator/team/invites/accept` | Accept invite (token) — auto-grants access |
| `GET /api/creator/team/members` | Team list (owner) |
| `PATCH /api/creator/team/members/[id]` | Change permission toggles / revoke |
| `DELETE /api/creator/team/members/[id]` | Revoke member |
| `GET /api/creator/team/activity` | Audit log (owner only) |
| `GET /api/creator/team/contexts` | My managed dashboards (switcher list for team members) |

Auth: owner-only for management routes; member routes check `creator_team_members` membership + the specific permission toggle before every action.

---

## Part 7: Deferred Features (end of development)

| Feature | Notes |
|---|---|
| **Paid seats** | Extra seats as premium → decided in `monetization/owner.md` (everything free until then) |
| **Named role presets** | Saved toggle combos ("Editor", "Mod", "Analyst") over the same toggle system — not a redesign |
| **2FA for team members** | Same optional TOTP as creators (`admin.md` Part 1) |
| **AI team members** | Agents as team members — same invite flow, `agent` persona (`ai/ai-agents.md`) |
| **Single sign-on / organization accounts** | Enterprise-level — not v1 |

---

## Part 8: Decisions

| Topic | Status |
|---|---|
| #1 Identity model | ✅ Decided — Model A: regular accounts, role grants, context switcher. Team members may ALSO be creators (our upgrade over Patreon — free advertising engine) |
| #2 Permissions | ✅ Decided — toggle grid per person, all OFF by default, creator decides everything. Settings/Money default OFF + warning (unlike Patreon's hard block, creator may enable — founder call) |
| #3 Pricing | ✅ Decided — free in v1; paid seats deferred to `monetization/owner.md` |
| #4 Money access | ✅ Decided — same toggle system, default OFF + warning |
| #5 Audit log | ✅ Decided — IN v1 (`creator_team_activity`), owner-only visibility |
| #6 Wiring home | ✅ **Decided 2026-08-05 — Network page → My Peeps right rail → Staffs row** (alongside Partners and Fans; see `relationships.md` Part 1) |
