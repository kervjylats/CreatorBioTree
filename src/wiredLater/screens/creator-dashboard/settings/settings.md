# Dashboard Settings — Vision & Spec

## Concept

Settings (`/dashboard/settings`) is where creators manage **money, identity, and permissions** — never page design. Branding, content, and appearance live in My App; analytics live in the Overview. Settings answers: *"who am I, how do I get paid, and what is my account allowed to do?"*

Designed from competitor research (Stan Store Settings, Gumroad Settings, Beacons Account Settings, Patreon Billing & payouts): account/security → payments → billing → notifications → advanced/danger is the universal order.

**Deliberately NOT here:** branding/appearance (My App owns it), content (My App), analytics (Overview), Link Address (permanent — set once at signup, never editable, see `my-app.md` Part 2a).

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

## Part 2: Payments & Payouts

| Piece | Shows / does |
|---|---|
| PayPal connect panel | Connect/disconnect PayPal, status badge (Connected / Needs attention / Not connected) — PayPal-first rail (founder decision 2026-08-10, `monetization/creators.md` Part 1a) |
| Payout method | Where money lands: **PayPal balance** (v1 default) — **Payoneer hold** noted as the rail-swap option (`creators.md` 2e2) |
| Payout schedule | Automatic (e.g., weekly/monthly) vs manual — production only |
| Settlement ledger (affiliates) | Read-only summary of affiliate cuts settled via the Deal Rules & Settlement Engine (auto-split vs manual-PayPal.me pending) — links into Network → Affiliates → My Earnings (`network.md` §7) |

**Mock:** panel renders connected-state UI against `paypal_account_id` on the creator row; no real PayPal calls. Payout method/schedule sections show as disabled placeholders with a "Production" tag.

**Production notes:** real PayPal OAuth connect flow (OAuth 2.0 + PayPal identity), payout method via PayPal balance, schedule stored per creator. The old Stripe Connect panel (`StripeConnectPanel.tsx` in old-code) is **deferred reference** — the Atlas path (`creators.md` Part 1b) — not wired.

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

**Username editing deliberately NOT here** — the Link Address is **permanent by founder decision**: set once at onboarding, read-only everywhere, never editable (shown as a display row in My App → Identity tab too, `my-app.md` Part 2a).

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
| PayPal not connected | Payments section shows "Connect PayPal" CTA (mock: fake connect button) |
| 2FA mid-setup | Show pending state (production: verification code entry) |
| Deleting account | Confirm modal; after delete → `/login` |

---

## Part 10: Production Notes

| Piece | Mock | Production |
|---|---|---|
| PayPal connect | Fake connect button + `paypal_account_id` field | Real PayPal OAuth connect + PayPal Checkout webhooks |
| Payout method/schedule | Disabled placeholders | PayPal balance payouts per creator (Payoneer = rail-swap option at the Settlement Engine boundary) |
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
| #2 Payments & Payouts (PayPal connect + payout) | ✅ Decided 2026-08-10 — PayPal-first (founder decision; `creators.md` 1a); PayPal-compatible panel replaces the deferred StripeConnectPanel |
| #3 Billing & Plan | ✅ Decided — UI shell, no-op in mock |
| #4 Notifications (5 toggles) | ✅ Decided |
| #5 Messaging & Privacy (allow-anyone toggle, partner toggle, requests folder) | ✅ Decided — messaging is free for everyone (`messaging.md`) |
| #6 Your Page (custom domain + link, NO Link Address editing) | ✅ Decided — Link Address permanent at signup; link shown read-only, display name/app name/icon editable in My App Identity |
| #7 Integrations stub | ✅ Decided — points to `integrations.md`, nothing wired |
| #8 Danger Zone (delete account) | ✅ Decided |

---

## Part 12: Existing Code Reference

### LIVE (still working)

| Piece | What it does |
|---|---|
| `src/app/dashboard/settings/page.tsx` | Naked skeleton — renders empty container |

### Notes

- Old backup `allScreens/dashboard-settings/page-old.tsx` **deleted by founder decision** (it was only a StripeConnectPanel wrapper — this spec fully replaces it).
- `src/old-code/StripeConnectPanel.tsx` is **deferred reference** (the Atlas path, `creators.md` Part 1b) — Part 2 is a PayPal-first panel built from this spec, not a Stripe re-wire.
