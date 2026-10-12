# Dashboard Settings — Vision & Spec

## Concept

Settings (`/dashboard/settings`) is where creators manage **money, identity, and permissions** — never page design. Branding, content, and appearance live in Playground; analytics live in the Overview. Settings answers: *"who am I, how do I get paid, and what is my account allowed to do?"*

Designed from competitor research (Stan Store Settings, Gumroad Settings, Beacons Account Settings, Patreon Billing & payouts): account/security → payments → billing → notifications → advanced/danger is the universal order.

**Deliberately NOT here:** branding/appearance (Playground owns it), content (Playground), analytics (Overview), Link Address (permanent — set once at signup, never editable, see `playground.md` Part 2a).

---

## Part 1: Account & Security

| Setting | Behavior |
|---|---|
| Email | Current login email — change with current-password confirm |
| Password | Change password (current + new + confirm) |
| Two-Factor Authentication | Toggle ON/OFF — consistent with `admin.md` Part 1 (2FA recommended for money-handling accounts) |
| Linked auth methods | Show what's connected (production: Google/Facebook OAuth, if ever added) |

**Mock:** email/password change works against the mock auth user (cookie); 2FA toggle stores a flag (no real TOTP in mock — production note below).

---

## Part 2: Payments & Payouts — ➡️ MOVED (2026-10-10)

> **This section moved to the Earnings screen** — `screens/creator-dashboard/earnings/earnings.md` **§3** (founder decision 2026-10-10: one dedicated money screen). PayPal.me handle editing, the honest Connect-PayPal card, payout method/schedule, and the settlement ledger all live there now. **Part numbering is kept** (this stub stays Part 2) so cross-references never break.
>
> - `PaymentsPanel` → `git mv` → `components/earnings/` (renders inside Earnings §3)
> - Settings keeps: Profile (Part 13) · Account & Security · Billing · Notifications · Messaging & Privacy · Your Page · Integrations stub · Danger Zone
> - Money-related *toggles* (e.g., "New sale" email) stay in Notifications (Part 4) — they're preferences, not balances

---

## Part 3: Billing & Plan

| Piece | Shows / does |
|---|---|
| Current plan | Plan name + price + billing cycle |
| Upgrade path | "Upgrade" / "Downgrade" / "Cancel" buttons |
| Payment method | Card on file management |

**Mock:** plan rows are static (e.g., Free / Pro), upgrade buttons show "Not available in mock" toast — no real checkout.

**Production:** Paddle subscription billing (Flow 3 processor — `owner.md`), upgrade/downgrade proration, cancel-at-period-end.

---

## Part 4: Notifications

Per-event toggles (email + push where applicable):

| Toggle | Fires on |
|---|---|
| New sale | A fan purchases an item |
| New fan | A fan signs up (fan account or email capture) |
| New subscriber | A fan subscribes to membership |
| New install | Someone installs the PWA |
| New message | A fan/guest sends a message (see `messaging.md` Part 2) |
| Weekly digest | Weekly summary of views, fans, sales |

**Mock:** toggles persist per user; nothing is actually sent (mockResend logs to console).

---

## Part 5: Messaging & Privacy

Who can start a conversation with this creator (see `messaging.md` Part 2 for the full model):

| Setting | Default | Behavior |
|---|---|---|
| Allow messages from anyone | ON | Fans/guests can start a 1-on-1 conversation without approval (TT/Reddit-style "Allow anyone" toggle) |
| Allow messages from collabs | ON | Collab accounts can message you before/after a collab (separate from the anyone-toggle) |

- OFF → incoming messages land in a **Requests folder** — creator accepts/rejects per sender (`messaging.md` Part 2)
- Block list is managed per-conversation (`messaging.md` Part 2 — block is available to every party, creators and fans alike)
- **Messaging is completely free** — no paywalls, no gated DMs, ever (`messaging.md` Part 1)

---

## Part 6: Your Page

| Setting | Behavior |
|---|---|
| Custom domain | Input for `custom_domain` (stored on creator row) — used in page URL resolution |
| Page link | Read-only display of the canonical URL + copy button (custom domain if set, else `host/username`) |

**Username editing deliberately NOT here** — the Link Address is **permanent by founder decision**: set once at onboarding, read-only everywhere, never editable (shown as a display row in Playground → Identity tab too, `playground.md` Part 2a).

---

## Part 7: Integrations (stub)

No UI beyond a placeholder card: "Integrations — pixels, email tools, and more are planned for production."

- Points to `src/wiredLater/integrations/integrations.md` as the spec home
- Nothing wired in v1 or mock

---

## Part 8: Danger Zone

| Action | Flow |
|---|---|
| Delete account | Button → confirm modal (type email or "DELETE") → deletes creator + data |

**Mock:** deletes the mock creator row + clears auth cookie.

**Production notes:** real account deletion + data export option before deletion.

---

## Part 9: Edge States

| State | Behavior |
|---|---|
| Not logged in | Redirect to `/login` |
| Logged in, no creator | Redirect to `/onboarding` |
| PayPal not connected | ➡️ Handled on the **Earnings screen §3** (`earnings.md`) — the honest "Coming soon" connect card moved there 2026-10-10 |
| 2FA mid-setup | Show pending state (production: verification code entry) |
| Deleting account | Confirm modal; after delete → `/login` |

---

## Part 10: Production Notes

| Piece | Mock | Production |
|---|---|---|
| PayPal connect + payout method/schedule (Part 2) | ➡️ MOVED 2026-10-10 → `earnings.md` §3 (honest connect card + PayPal.me handle) | Real PayPal OAuth connect + multiparty split at migration; Payoneer = rail-swap at the engine boundary |
| Billing & plan | Static rows + toast | Paddle subscriptions, proration (Flow 3 — `owner.md`) |
| Notifications | Persisted toggles, console logs | Resend emails + push via fan app infra |
| 2FA | Stored flag only | Real TOTP (authenticator app) + recovery codes |
| Custom domain | Stored string | DNS verification + HTTPS cert |
| Messaging privacy | Persisted toggles | Real delivery rules per conversation (`messaging.md`) |

---

## Part 11: Decisions

| Topic | Status |
|---|---|
| #1 Account & Security (email, password, 2FA) | ✅ Decided — 2FA consistent with admin.md |
| #2 Payments & Payouts (PayPal connect + payout) | ✅ Decided 2026-08-10 → **moved 2026-10-10** to the Earnings screen (`earnings.md` §3 — one money screen; this Part 2 is the pointer stub) |
| #3 Billing & Plan | ✅ Decided — UI shell, no-op in mock |
| #4 Notifications (5 toggles) | ✅ Decided |
| #5 Messaging & Privacy (allow-anyone toggle, partner toggle, requests folder) | ✅ Decided — messaging is free for everyone (`messaging.md`) |
| #6 Your Page (custom domain + link, NO Link Address editing) | ✅ Decided — Link Address permanent at signup; link shown read-only; **display name + avatar editable in Settings → Profile (Part 13)** (moved out of "Playground Identity" by founder decision 2026-10-09); app name/icon stay in Playground Identity |
| #7 Integrations stub | ✅ Decided — points to `integrations.md`, nothing wired |
| #8 Danger Zone (delete account) | ✅ Decided |
| #9 Profile (display name + avatar — cooldown + ✏️ gateways) | ✅ Decided 2026-10-09 — **(A) cooldown:** each field locks itself for 7 days after a real change (`display_name_changed_at` / `avatar_changed_at`; identical-value saves never lock) · **(B) ✏️ gateways:** sidebar identity block + BillboardPreview → `ProfileEditDialog` → Settings · **both fields** covered |

---

## Part 12: Existing Code Reference

### LIVE (still working)

| Piece | What it does |
|---|---|
| `src/app/dashboard/settings/page.tsx` | Naked skeleton — renders empty container |

### Notes

- Old backup `allScreens/dashboard-settings/page-old.tsx` **deleted by founder decision** (it was only a StripeConnectPanel wrapper — this spec fully replaces it).
- `src/old-code/StripeConnectPanel.tsx` is **deferred reference** (the Atlas path, `creators.md` Part 1b). The PayPal-first panel it would have been replaced by now lives on the **Earnings screen §3** (`earnings.md`, 2026-10-10).

---

## Part 13: Profile — display name & avatar

> **Renders FIRST on the settings screen** (top card, above Account & Security). The **one and only** place a creator edits their display name and photo (founder decisions 2026-10-09). Everything else that shows identity — fan page, Discover, landing, messages, sidebar — only *reads* it.

| Piece | Behavior |
|---|---|
| Avatar | Circular preview (photo, or initials fallback). **Upload photo** → file picker → `POST /api/creator/upload` (`type=avatar` → public URL) → saves `avatar_url`. **Remove** → back to initials. Both save **instantly** (no Save button) |
| Display name | Text input (cap 80) + **Save changes** button |
| Rule helper | Static line under the fields: *"Your name & photo appear on your fan page, Discover, landing and messages — changes show everywhere immediately. Each can be changed once every 7 days."* |
| Locked state | Per field, independent: changed within the last 7 days → that field's input/buttons disabled + *"You can change this again on {date}."* |

**7-day cooldown (founder decision 2026-10-09 — option A: cooldown, not deadline):**
- A real change stamps `display_name_changed_at` / `avatar_changed_at` on the creator row → that field locks for `IDENTITY_COOLDOWN_DAYS` (7) — shared constant in `lib/limits.ts`.
- **The lock fires only when the value actually CHANGES** — an identical-value save passes without locking (otherwise Playground Deploy, which PUTs these fields in the same payload, would trip locks).
- Enforced **server-side** in `PUT /api/creator/playground` → `409 { error, retry_at }`; `GET /api/creator/playground` returns both timestamps so the UI renders lock state.

**One row → every screen (propagation):** fan page + guest header · Network Discover cards + billboard modal · your billboard preview · landing marquee + returning-fan row · sidebar profile block · partner/staff lists + message conversation titles · admin Creators table. Save once → every surface shows the new value on next load. No per-surface editors (the billboard *displays* identity; it never edits it).

**✏️ gateway buttons (founder decision 2026-10-09 — option B):** exactly two spots where a creator sees their OWN identity carry a small ✏️:
1. **Dashboard sidebar identity block** (desktop only — the phone bottom bar has no identity block; phones reach editing via Settings nav)
2. **BillboardPreview card** on the Network rail — the name/photo pencil, *distinct* from the existing ✏️ Edit billboard header button (that one focuses the rail editor)

Press → **`ProfileEditDialog`**: *"Your display name and photo appear on your fan page, Discover, landing and messages — changes show everywhere immediately. ⚠️ You can change each once every 7 days."* → **[Open Settings]** → `/dashboard/settings` · [Not now]. The dialog shows on **every** press — it is the explainer + gateway, not a one-time tip.

**Data model:** 2 nullable timestamp columns on `creators` — `display_name_changed_at`, `avatar_changed_at` (mock now; real-DB migration at the migration pass).

**Out of scope:** banner image · App Name / App Icon (their 7-day locks stay specced in `playground.md` Part 2a — same dialog pattern when the Identity tab ships) · Link Address (permanent, no editor) · bio (lives in the Billboard).
