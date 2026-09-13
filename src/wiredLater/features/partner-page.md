# Partner Content Page — Vision & Spec

## Concept

The partner content page is the **fan-facing surface of a partnership**. When a creator (Alex) and another creator (partner) are connected via the Network, Alex's fans can view the partner's content **inside Alex's fan shell** — a bottom modal that swipes up to ~3/4 of the screen, branded with the **partner's** identity.

It is **fan-only**: guests never see it. It's reached exclusively from the **Connect tab** (see `fan-shell.md` Part 4c). Because the fan is always already authenticated inside the 4-tab shell, **no signup or account creation ever happens on this page** — for the partner or anyone.

**The layout rule:** the partner page shows the partner's own view — Header → Spotlight → Artist Links → Catalog Feed (the **partner's** artist links stay; the host's guest page + Content tab dropped artist links to the Connect tab — `fan-shell.md` Part 3). Only the top-right action differs: follow / + / subscribe.

---

## Part 1: Access & Entry Points

| Entry | How |
|---|---|
| Connect tab → billboard name | Tap a partner's name underneath the billboard |
| Connect tab → Followed list | Tap a followed partner |
| Direct URL | `/{username}/partner/{partnerUsername}` — fan-auth required; guests/logged-out → redirect to `/{username}` |

**Fan-auth gate:** if the visitor has no fan account for the creator → redirect to the guest page (no account → no partner page, per founder decision).

---

## Part 2: The Bottom Modal (sheet)

| Piece | Behavior |
|---|---|
| Open | Sheet slides up from bottom of the screen (within the fan shell) |
| Height | Covers ~3/4 of the screen when fully swiped up |
| Close | Swipe down / tap backdrop / back button |
| Header | Partner's branding: name, avatar, "← Back to @{link-address}" (creator's accent color) — partner renders their own theme via `resolveBranding(partner)`; the host creator's accent is used for the back link. See `features/branding.md` for the theme system |

The sheet contains the partner's full content page — the 3-layer view (see `fan-shell.md` Part 3 + `my-app.md` Part 3).

---

## Part 3: Content (the partner's 3-layer view)

| Layer | Source |
|---|---|
| **Header** | Partner's branding (display name, avatar, bio, social icons — `resolveBranding` on the partner; full theme system in `features/branding.md`) |
| **Spotlight** | Partner's curated spotlight (from their own My App — same carousel component, normal speed) |
| **Artist Links** | Partner's artist links as rich cards |
| **Catalog Feed** | Partner's catalog items with the Three Gates applied (`fan-shell.md` Part 2) |

The partner's items use **their own** content — "logically, the partner also designed their My App" (per founder). Purchases/checkout behave exactly like the creator's (email model, receipt = access).

---

## Part 4: Top-Right Actions

| Action | Behavior |
|---|---|
| **Follow** | Instant toggle using the fan's existing Alex-shell account (`fan_follows` table, `/api/fan/follow` — live). No signup, no new account |
| **+ / Subscribe** | Separate action — join the partner's **membership tier** (paying, same email model as the creator's checkout) |
| **Unfollow** | From the modal (top-right toggles to "Following ✓") and from the Followed list |

Follow and Subscribe are **independent** — following does not subscribe; subscribing implies following (to be confirmed at wiring).

---

## Part 5: The Followed Relationship

| Rule | Behavior |
|---|---|
| Followed by | Any fan with an account on the creator's shell |
| Stored in | `fan_follows` (fan account + partner creator id) — reuse `/api/fan/follow` |
| Shown in | Connect tab → Followed list (own section) |
| **Survives partnership endings** | If Alex ends the partnership, the partner **stays** in Michel's Followed list. Partnership (network.md) ≠ fan follows — independent data |
| Unfollow | Removes from Followed list + reverts modal button |

**Follower-identity note (2026-08-08):** the Follower tier (`fan-shell.md` Part 1, no-password `fan_accounts` row) shares the **same** `fan_accounts`/`fan_follows` model — one identity, one relationship per creator. Following a partner still requires a **shell account** (the partner page is fan-only, and followers never see the 4-tab app); an email-only Follower who wants to follow partners first upgrades to a Fan by setting a password.

---

## Part 6: Edge Cases

| Case | Behavior |
|---|---|
| Partner deleted account | Followed entry shows placeholder; modal → "no longer available" |
| Creator has 0 partners | **Billboard section is hidden** (Connect tab self-gating rule — `fan-shell.md` Part 4c) — no empty state, no hint |
| Fan follows 0 partners | **Followed section is hidden** — no empty state |
| Creator has no community | **Community card is hidden** — no empty state |
| Creator has no artist links | **Artist Links section is hidden** — no empty state |
| Connect tab entirely empty (all 4 above) | Shows the creator's `connect_empty_text` message (`my-app.md` Part 2a); falls back to "More to come — check back soon" when unset |
| Partnership ended while modal open | Modal closes gracefully; partner stays in Followed |
| Guest hits direct URL | Redirect to `/{username}` guest page |

---

## Part 7: Deferred

| Feature | Note |
|---|---|
| Guest newsletter capture | Skipped for now — founder decision (may return as the guest-side alternative to signup) |
| Auto-follow on subscribe | Pending wiring decision |

---

## Part 8: Mock ↔ Production Notes

| Piece | Mock | Production |
|---|---|---|
| Fan follows | In-memory `fan_follows` via mockSupabase | Same table real |
| Partner content | Mock catalog data per creator | Real catalog rows |
| Subscribe (membership) | Mock checkout flow | PayPal subscription per partner (PayPal-first rail) |
| Partner branding | `resolveBranding` (mock creators) | Real creator rows |

---

## Part 9: Decisions

| Topic | Status |
|---|---|
| #1 Fan-only access (guests redirected) | ✅ Decided |
| #2 Bottom modal — swipe up, ~3/4 screen | ✅ Decided |
| #3 Partner's own 3-layer view + branding | ✅ Decided |
| #4 Top-right: Follow + Subscribe separate | ✅ Decided |
| #5 No signup/account creation ever | ✅ Decided — fan always authenticated |
| #6 Follows survive partnership endings | ✅ Decided — independent of network.md |
| #7 Reached from Connect tab (billboard + followed) | ✅ Decided — see fan-shell.md Part 4c |
| #8 Guest newsletter capture | ⏳ Deferred |

---

## Part 10: Existing Code Reference

### LIVE (still working)

| Piece | What it does |
|---|---|
| `src/app/[username]/partner/[partnerUsername]/page.tsx` | Naked skeleton |
| `/api/fan/follow` | Follow/unfollow route (live) |

### Backups (in `src/old-code/allScreens/partner-page/` — old code, reference forever, do NOT delete)

| File | State | Reuse plan |
|---|---|---|
| `page-old.tsx` | Old placeholder (74 lines): fan-auth gate, partner branding, "coming soon" | Reuse the auth gate + branding resolution; rebuild content per Part 3 |

Plus in `src/old-code/` root: `FollowButton.tsx` (follow/unfollow toggle for partner creators) — reuse for Part 4.
