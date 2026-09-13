# Partnership — Vision & Spec

## Concept

**Inviting people from OUTSIDE the app to become your partner.** A creator generates a shareable invite link → an outsider clicks it → signs up through the normal onboarding → **auto-becomes the creator's partner** (both sides connected, no request/accept needed).

This is the "Invite a Collab" flow from old code (see Part 7), now properly spec'd with its own name.

**Terminology (founder decision 2026-08-04):** there are TWO different creator↔creator relationships, with two names:

| Name | What it is | Where it lives |
|---|---|---|
| **Partnership** | You invite someone from OUTSIDE the app via link → they join → auto-connected to you | THIS FILE |
| **Collab** | Creators find each other INSIDE the app (Network discovery + friend-request) | `network.md` |

Same relationship type under the hood (one `partnerships` table), different entry points. A `source` flag records how each partnership started (`invited` vs `collab`).

**Why it matters (free advertising engine):** the invited person becomes a creator themselves — they see how the app works from the inside, and they're connected to you. Same win-win as team members who become creators (`team.md`).

---

## Part 1: The Invite (creator side)

### Where it lives

The creator generates invites from **My Peeps → Partners row → "Invite a partner"** on the Network page — **✅ DECIDED (2026-08-05)**: Network → My Peeps → Partners row (`relationships.md` Part 1, `network.md` top layout). Alongside the collab list.

### Flow

1. Creator taps **"Invite a partner"**
2. System creates a `partner_invites` row with a UUID token + 7-day expiry
3. Creator gets a shareable link: `host/onboarding?invite=CODE`
4. Creator shares it anywhere — WhatsApp, SMS, email, copy-paste (the link IS the mechanism; email/phone are just delivery channels)

### Share card

Old code (`PartnerInviteCard-old.tsx`) had a ready-made share card: invite code display + copy button + WhatsApp share with a default message — *"Hey! I'm using CreatorBioTree to run my creator page. Join my collab network and we'll split commissions: {link}"* — rebuild per this spec at wiring.

---

## Part 2: The Join (outsider side)

1. Outsider clicks the link → **normal onboarding page**, title switches to **"Join your partner"** (`onboarding.md`)
2. The invite code rides along: saved to the account (user metadata, `invite_code`)
3. Outsider completes normal signup — Link Address, display name, email, password
4. After signup → a post-signup route runs (old code: `creator-partners-onboarding-route-old.ts`):
   - Looks up the invite by code → validates: exists, not used, not expired
   - Marks it used (`used_by`, `used_at`)
   - **Auto-inserts a `partnerships` row** linking the inviter ↔ the new creator, `status: "active"`, `source: "invited"`
5. Done — both sides are partners automatically. No request, no accept. The new creator lands in their dashboard like any new creator.

**Single-use:** one invite code = one partner. Expired (7 days) → the inviter re-generates.

**Edge cases:**
- Already-logged-in creator clicks an invite link → redirect to dashboard (no double signup)
- Invite link clicked by someone who's already a creator → accept flow converts to auto-partnership (creates the row; no new account)
- Invalid/expired/used code → generic "invite invalid or expired" message, not an error page

---

## Part 3: The Resulting Partnership

Same as any partnership (`network.md` collab mechanics apply once connected):

- Both creators see each other in their relationship lists (the shared `partnerships` table)
- Chat icon works (before AND after — `messaging.md`)
- Optional Deal Maker / commission splits can be set up later (`network.md` §6 — "we'll split commissions" from the old WhatsApp message)
- Affiliates can extend it (`network.md` §7)
- Ending: either side can end the partnership (same as collabs)

The ONLY difference from a collab: the relationship was created by an outside invite instead of an in-app friend request.

---

## Part 4: Data Model (one shared relationship)

Founder decision: **one shared `partnerships` table** — the invite is an entry point, not a separate relationship type.

| Table | Columns | Notes |
|---|---|---|
| `partnerships` | id, creator_a, creator_b, status, source (`invited` / `collab` — NEW column), created_at | Shared by BOTH flows (`network.md` collabs + this file). `source` records the entry point |
| `partner_invites` | id, from_creator_id, invite_code (UUID), used_by, used_at, expires_at, created_at | Existing table (old code used it) — spec'd properly here |

No new tables. One `source` column added to `partnerships`.

---

## Part 5: API Routes

| Route | Purpose |
|---|---|
| `GET /api/creator/partners/invite` | Get/create my invite code (old code: `creator-partners-invite-route-old.ts`) |
| `POST /api/creator/partners/onboarding` | Post-signup: validate code → mark used → auto-create partnership (old code: `creator-partners-onboarding-route-old.ts`) |

(These ride the existing `/api/creator/partners/*` route family — routes stay as-is per founder decision; only the user-facing terminology changed.)

---

## Part 6: Existing Code Reference

Old code (parts archive — reference only, rebuild from this spec):

| File | State | Reuse plan |
|---|---|---|
| `src/old-code/allScreens/network/PartnerInviteCard-old.tsx` | Full share-card UI (61 lines) | Rebuild the share card from it |
| `src/old-code/allScreens/network/api/creator-partners-invite-route-old.ts` | Full invite route (43 lines) | Rebuild as-is (mock: generate code; production: DB row) |
| `src/old-code/allScreens/network/api/creator-partners-onboarding-route-old.ts` | Full auto-partnership route (58 lines) | Rebuild as-is (+ `source: "invited"`) |
| `src/old-code/OnboardingForm.tsx` / `allScreens/onboarding/page-old.tsx` | Invite-code capture + "Join your partner" title | Reuse at wiring (`onboarding.md`) |

---

## Part 7: Production Notes

| Piece | Mock | Production |
|---|---|---|
| Invite code | In-memory `partner_invites` row | Real table + token, hashed at rest |
| Invite email | Logged to console | Sent via Resend |
| Auto-partnership | Mock insert | Real insert + webhook/activity event |
| Expiry cleanup | Lazy check on use | Cron cleanup of expired invites |

---

## Part 8: Decisions

| Topic | Status |
|---|---|
| #1 Own spec file | ✅ Decided — the outside-app invite gets its own `partnership.md` (it was only a broken one-liner in `onboarding.md` pointing at `network.md`, which never covered it) |
| #2 Naming | ✅ Decided — outside-app invite = **Partnership**; in-app creator↔creator = **Collabs** (`network.md` renamed). Old code's "Invite a Collab" naming retired |
| #3 Data model | ✅ Decided — ONE shared `partnerships` table + `source` flag (`invited` / `collab`); no duplicate tables |
| #4 Share mechanism | ✅ Decided — the link IS the mechanism; email/phone are delivery channels only |
| #5 Wiring home | ✅ **Decided 2026-08-05 — Network page → My Peeps right rail → Partners row** ("Invite a partner" button + invite list; see `relationships.md` Part 1) |
