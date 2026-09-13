# Fan Shell — Vision & Spec

## Concept

The fan shell is everything fans experience at `/[username]`: the guest page, the 4-tab app, authentication, and the account model. One page, two states:

- **Guest** (no account) → the 3-layer view (Header → Spotlight → Catalog Feed) with signup/login entry points
- **Fan** (logged in) → 4-tab PWA — only the **Content tab** shows the same 3-layer view; Home / Connect / Settings each have their own layouts

**The 3-layer view lives in exactly TWO places: the guest page and the Content tab. The shell frame (FanAppShell) never renders it** — it's branding + bottom nav + account button only.

Content shown here is created in My App and served from the shared database. See `my-app.md` Part 3 for the display layers (Spotlight, Catalog Feed) and per-item card types. Artist links are no longer a display layer — they live in the **Connect tab only** (Part 4c).

---

## Part 1: Account Model

**Philosophy:** **The email IS the identity.** Purchases, follows, and subscriptions follow the **email** — not the account. Guests can buy, follow, and subscribe with just an email (Stan Store style). A full account is an optional convenience you grow into, never a requirement.

### The 4 identity tiers (founder decision 2026-08-08)

Every visitor to a creator's app falls into one of these tiers. Each tier adds friction only when the visitor demands value that requires it:

| Tier | Entry | Gets | Stays locked |
|---|---|---|---|
| **Visitor** | just arrives | browse, peek, buy (email checkout) | free-gated / member-only items |
| **Follower** (email-only, NO account) | gives **email only** — via "Follow [creator]", "Subscribe", a free-gate unlock, or the checkout opt-in | follow creators, buy (email checkout), **email + push updates** (push = device permission, not an account), free-gated unlocks, "Your creators" landing row; creator sees them in their follower list | password login, the 4-tab app |
| **Fan** | follower + sets a **password** | everything above + the 4-tab app, persistent login/session, messaging, community, synced purchase history | member-only content |
| **Member** | fan + active subscription | unlocks member-only content | — |

**The fan-only line:** the 4-tab app, messaging, community, and persistent history belong to Fans. **Push is NOT the divider** — it's a device-level permission available to followers and fans alike. Nobody is ever forced to sign up to pay or to follow; the email is enough, and the account grows out of it naturally.

### Layer 1 — Guest checkout (no account needed)

- Guest taps "Buy — $X" → enters **email only** → pays via **PayPal** (card / Apple Pay / Google Pay — cards work cross-border **without a PayPal account**; PayPal-first, founder decision 2026-08-10, see `monetization/creators.md` Part 1a)
- No signup, no password, no account creation
- Tied to the email used at checkout
- Optional **"Also send me updates?"** checkbox at checkout, **default OFF — a purchase NEVER auto-follows**; checking it creates a Follower row for that email (Layer 1b)
- **Settlement is invisible to fans:** the fan pays the creator's PayPal; any affiliate cut (deal terms) is settled **after** capture via the platform's Deal Rules & Settlement Engine (`monetization/creators.md` 2e2) — the fan never sees splits, cuts, or rails

### Layer 1b — Follow with email only (no account)

- Guest taps **"Follow [creator]"** → enters **email only** → a **no-password `fan_accounts` row** is created (a **Follower**) → optional notify permission → **email + push** updates when the creator posts/drops
- No signup, no password, no fan-app access — the person stays on the **guest page**, now personalized (free-gated items unlock, "Following ✓" shows, notify toggle appears)
- The follow sets the same `fan_session` cookie → the follower is **recognized** (guest-page perks + the landing "Your creators" row) without being able to log in
- Reuses the existing no-password-row concept (`/api/fan/register` already returns "No password is set — use Forgot password to set one" for these rows)
- Setting a password later **upgrades the Follower → Fan** (same row, `password_hash` filled in)
- Purchases, follows, free-gate unlocks, and the checkout opt-in all feed the **same** follower relationship — one email, one row, one relationship per creator

### Layer 2 — Receipt = access

- After purchase: thank-you page with direct access + confirmation email containing the product link
- The receipt email IS the key — works forever, no account required
- Same pattern as Stan Store / Gumroad

### Layer 3 — Same-email prompt

- After checkout, prompt: *"Create your account with {email used} so everything's in one place"*
- Encourages fans to use the same email → prevents mismatches before they happen

### Layer 4 — Claim purchases (fan Settings)

- For mismatches (typo'd email, second email, gifts): **Settings → "Claim purchases"**
- Fan enters the purchase email → verification code sent there → fan enters code → purchases merge into their account
- The safety net — turns angry comments into saved fans

**Decision:** all 4 layers + the Follower tier in v1. ✅

---

## Part 2: The Three Gates (item display rules)

Every catalog item falls into one of these states for any visitor:

| Item type | Button / behavior | What happens |
|---|---|---|
| **Free, no gate** | Shown immediately | Instant access |
| **Free, email-gated** | **"Sign up to unlock"** | Email capture (creator's choice) — email creates a **Follower** row → unlocks the item **and starts the follower relationship** |
| **Paid** | **"Buy — $X"** | Email-only guest checkout → "Purchased ✓" |
| **Member-only** | **"Join membership"** | Subscription unlock → "Unlocked ✓" |

**Badge rules:**
- **Guest:** sees "Sign up to unlock" (free gate) / "Buy — $X" (paid) / "Join membership"
- **Follower** (email recognized): sees "Unlocked ✓" on free-gated items they've unlocked + "Following ✓"; can buy — all on the guest page
- **Fan:** "Purchased ✓" appears only when their **account email matches the purchase email** (claim-purchases fixes mismatches)
- **Member:** "Unlocked ✓" when subscription is active

---

## Part 3: The Two Views

### Guest page vs Content tab — IDENTICAL layout

Both show the same 3-layer view: **Header → Spotlight → Catalog Feed** (Artist Links moved to the Connect tab — see Part 4c; the partner modal is the one exception that keeps its own 4-element view including the partner's artist links — see `partner-page.md` Part 3).

**This layout is used in exactly two places: the guest page and the Content tab. No other tab uses it.**

| Element | Guest page | Content tab (fan) |
|---|---|---|
| The 3 layers | ✅ Same | ✅ Same |
| Sign up / Login buttons | ✅ **On this page** (top + gated items) | ❌ Not needed |
| Follow [creator] (email box) | ✅ **On this page** (guest — Layer 1b) | ❌ Already following |
| PWA install prompt | ✅ On this page | ❌ Already installed |
| Badges | Gate CTAs (unlock / buy / join) | Purchased ✓ / Unlocked ✓ |

**Creator-side install (from the dashboard):** creators can optionally install their OWN fan app from the dashboard (`overview.md` Part 7 — "Install my fan app"). It reuses this exact install flow + the `/[username]/manifest.json` route, so their phone shows two apps: the neutral **Dashboard** PWA (workbench) + their **branded fan app** (what fans get) — dogfooding their own product. Optional; never shown to fans.

Signup/login lives on the guest page. Guest logs in → stays on the same page → badges change. One flow, no redesign.

**Guest community CTA:** when the creator has a community, the guest page also shows a **"Join the community" card** (below the 3 layers). Tap → existing fan-auth modal (signup/login) → fan lands on the Home tab community section and can join the open community immediately. Chats stay behind the fan-account wall (`messaging.md` Part 3).

**PWA install is account-free (founder decision 2026-08-08):** anyone can install a creator's fan app — or the platform app (`manifest.json`) — with **no account at all**. An installed guest opens to the guest page. "Installed the app" and "has an account" are completely separate; install + follow-email + push-permission is a perfectly valid combo for a non-account person.

### The 3 similar layouts (same 3-layer view, differ only in the top-right action)

| Page | Who sees it | Top-right action |
|---|---|---|
| **Guest page** | Guests (no account / logged out) | Sign up / Login (visitor) → **Following ✓ + Notify** (recognized follower) |
| **Content tab** | Fans (4-tab shell) | *(nothing)* |
| **Partner content page (bottom modal)** | Fans only — reached from Connect tab | Follow / + / Subscribe |

**Recognized follower rule:** a follower (fan_session cookie for a no-password row) sees the **personalized guest page** — unlocked gates, "Following ✓", and a notify toggle — but NOT the 4-tab fan app. No-password session = follower state, never fan state (wiring rule, Sheet 21).

*(The partner content page is the exception to "same view": it keeps the partner's own Artist Links as a 4th element — `partner-page.md` Part 3. Guest page + Content tab are the 3-layer view above.)*

**Guests NEVER see the partner page** — no Connect tab, no billboard, no partner modal. It exists only inside the fan view, so the fan is always already authenticated (no signup prompts in the modal, ever). See `partner-page.md` for the full modal spec.

### FanAppShell (the frame)

- Renders the creator's branding (background, colors, font) — see `features/branding.md` for the full theme system (resolver, 9 presets, 4 safety rules, 7 v1 extensions)
- Top-right: **Bell** (notify toggle — see Part 4a) + **"My Account"** (fan) / **"Sign Up / Login"** (guest) / **"Following ✓ + Notify"** (recognized follower, on the guest page)
- Bottom nav: 4 tabs — Home, Content, Connect, Settings
- Install banner (when not installed), auth modal, page-view tracking
- The shell ONLY decides which tab is active — it never holds content and never shows the 3-layer view (that lives on the guest page, Content tab, and the partner modal only)
- **The Bell lives in the shell frame, NOT inside any of the 3 similar layouts.** Those layouts' top-right actions stay exactly as the table above says (signup/login · nothing · follow/+/subscribe). The Bell sits in the frame header next to the top-right button and toggles "notify me" about the current creator/partner. **Followers get the same notify wiring on the guest page** — their toggle = email + device push once permission is granted (push is a device-level permission, not an account privilege).
- **Messaging (floating inbox)** — when the fan is logged in, a **chat icon in the shell header (top-right)** + the **bottom-right floating 💬 inbox** (`messaging.md` Part 1) are available on every screen of the shell; the full inbox expands in place. Guests get the guest → creator "Contact" button instead (one‑tapped from deep in messaging.md). Messaging is **completely free** — no paywalls, no gated DMs.

---

## Part 4: The 4 Tabs

### 4a. Home Tab — the activity hub

**STATUS: ✅ DECIDED** — the activity hub, not a news feed clone. Sections top-to-bottom:

| # | Section | Shows |
|---|---|---|
| 1 | **Spotlight** | The creator's carousel (the eye-catcher) — same component as the guest page + Content tab |
| 2 | **New from [creator]** | The creator's recent items as a **horizontal swipeable queue** (Substack reading-queue style) — tap a card to open the item |
| 3 | **Updates from partners you follow** | Recent updates from followed partners, **random order** (no spotlight, no chronological priority) |
| 4 | **Community** | The creator's clubhouse (see `messaging.md` Part 3): community name + branding, join/leave button, and the channel list — open channels read directly, restricted channels show a lock. Guests never see this section |
| 5 | **Your activity** | Payments ✅, subscription status, renewal dates + a quick **"my purchases"** shortcut |
| 6 | **Upcoming** | Live events with countdowns (Stan-style) |
| 7 | **Announcements** | Creator broadcasts (see "Push broadcasts" below) |

**Section details:**

- **Spotlight** — identical carousel, rendered in 3 places total (Home tab, guest page, Content tab). Same data, same component.
- **New from [creator]** — horizontal queue of the creator's most recent published items (one card per item, swipe left to advance, tap to open). Includes a "see all" affordance into the Content tab. Empty state when the creator has no published items.
- **Updates from partners you follow** — pulls updates from the fan's Followed list (Connect tab). **Randomized order on every load** — a serendipity strip, not a ranked feed. Each entry = the partner's newest item + partner name/branding. **Empty state:** "You don't follow any partners yet — check out the Connect tab." (Follow mechanics live in `partner-page.md`; follows survive partnership endings.)
- **Community** — the creator's clubhouse (`messaging.md` Part 3). Logged-in fans see the community card: join/leave + channel list. Open channels open straight into the thread; restricted channels (VIPs, Partner collab) show a lock until the fan holds the role. **Hidden entirely when the creator hasn't set up a community.**
- **Your activity** — the fan's payments ✅ + current subscription status + next renewal date. The "my purchases" shortcut jumps to Settings → Purchases.
- **Upcoming** — the creator's scheduled live events with live countdowns ("Starts in 2h 14m"). Tapping an event opens the event detail/launch surface. Hidden entirely when no events are scheduled.
- **Announcements** — newest creator broadcasts first (see "Push broadcasts" below).

**Push broadcasts (creator → fans):**

- Creators can send a push announcement from their dashboard "whenever they want" — e.g. "New drop is live"
- Fans who have the **Bell on** for that creator receive it (push + it appears in Announcements / the notifications panel); **followers who opted in receive email (+ push when permission granted)** — no extra channels by default
- Delivery is opt-in only: fans via the Bell, followers via the guest-page Notify toggle (Part 1, Layer 1b) — never emailed/spammed without opt-in
- Creator-side sender UI = production pointer (infra exists live: `/api/push/send` mock). Fan-side receive = real push subscription.
- Fans can silence per-category in Settings → Notifications (Part 4d).

**The Bell (notifications panel):**

- Bell = **manual one-tap toggle** — "Notify me about [creator]" (TikTok-style, on the creator's page). Following a partner does **NOT** auto-bell them; the fan bells separately.
- Tapping the Bell when on opens the **notifications panel** (fan only, no account = no bell): recent new drops, lives starting soon, partner updates, and creator broadcasts, newest first.
- Pure visitors never see the Bell — they see "Sign Up / Login" or "Follow". **Recognized followers get a Notify toggle on the guest page** (email + push once permission granted — `fan-shell.md` Part 1, Layer 1b); fans get the Bell in the shell frame.

### 4b. Content Tab — the catalog feed

- The 3-layer view (see Part 3): Spotlight → Catalog Feed (artist links live in the **Connect tab only** — see Part 4c)
- Applies the Three Gates (Part 2)
- Interactive cards per item type (see `my-app.md` Part 3)

### 4c. Connect Tab — the connection hub (smart live stack, billboard + two columns)

**STATUS: ✅ DECIDED** — rebuilt as the connection hub (see `partner-page.md` for the modal). Not a partner-company dashboard — a live stack that adapts to what the creator actually has.

**Render rule (founder decision 2026-08-05):** every section renders **ONLY if it has data**. No placeholders, no "0 partners yet" stubs.

**Layout (founder decision 2026-08-05):**

```
┌──────────────────────────────────────────────────────┐
│  BILLBOARD (top, full width)                         │
│  Rotating partners with ACTIVE AFFILIATE DEALS       │
│  (2x rotation boost on deal items)                   │
│  ── Names of ALL partners underneath ──              │
├─────────────────────┬────────────────────────────────┤
│  ALL PARTNERS       │  FOLLOWED                      │
│  (left column)      │  (right column)                │
│  Mini-spotlight     │  Partners THIS FAN follows     │
│  cards for EVERY    │  ("Following ✓" badge)         │
│  partner            │                                │
├─────────────────────┴────────────────────────────────┤
│  COMMUNITY card  ·  ARTIST LINKS  (bottom)           │
└──────────────────────────────────────────────────────┘
```

| # | Section | Renders if | Shows |
|---|---|---|---|
| 1 | **Billboard** | Creator has ≥1 active partner (collab or invited) | Big auto-rotating carousel **rotating only partners with an active affiliate deal** (a deal = the partner promotes the creator, see `network.md` §7) — each deal item gets a **2× rotation weight** (founder decision 2026-08-05: deals surface more often than non-deal partners). Partners with no deal still appear in the rotation but at 1× weight. **Names of ALL partners underneath the billboard**, clickable |
| 2 | **All Partners** (left column) | Creator has ≥1 active partner | **Compact mini-spotlight cards for EVERY partner** (affiliate deal or not) — avatar, display name, tagline. The complete partner roster in one scrollable column. Tapping a card → the partner modal |
| 3 | **Followed** (right column) | Fan follows ≥1 partner | Partners this fan follows (e.g., Michel follows 2 of Alex's partners → both listed here). Per-fan — each fan's own list. Cards carry the **"Following ✓" badge**; the follow/unfollow toggle itself lives in the partner modal only (founder decision 2026-08-05 — simpler, one place to change it) |
| 4 | **Community** (bottom) | Creator has set up a community | A **card** that deep-links to the Home tab community section (gateway, not a full view — the community itself lives on Home, `messaging.md` Part 3) |
| 5 | **Artist Links** (bottom) | Creator has ≥1 social/external link (`my-app.md` Part 2d) | The creator's artist links as rich interactive cards — **this is the only home for artist links** (removed from Content tab + guest page; see Part 3) |
| 6 | **Empty state** | ALL of the above are empty | ONE message — the creator's own `connect_empty_text` (`my-app.md` Part 2a); falls back to platform default "More to come — check back soon" when unset |

**Interactions:**
- Tapping a partner's name (under the billboard) **or** any partner card (All Partners / Followed) → opens the **bottom modal** = the partner's content page (swipe up to ~3/4 of the screen, partner's branding; see `partner-page.md`)
- **Follow toggle lives ONLY in the partner modal** — cards just show the "Following ✓" badge (founder decision 2026-08-05). Followed list = manage: open modal → unfollow
- **Follows survive collab endings** — Alex ends a collab, Michel still sees the partner under Followed. Collab (network.md) ≠ fan follows (independent)
- **New partners appear silently** — no notification. Fans discover them in the Billboard/All Partners on their next visit (founder decision 2026-08-05). The Billboard is a discovery surface, not an alert
- **Affiliate deals are invisible to fans** — the Billboard rotates deal partners more often, but no affiliate label, no "sponsored" tag, no deal terms anywhere on the fan shell (founder decision 2026-08-05, see `monetization/creators.md` Part 2e)
- **Instant render** — sections appear/disappear immediately with data changes; no entry animations in v1

### 4d. Settings Tab — the account hub

**STATUS: ✅ DECIDED** — the full account hub, not a bare "log out" page.

| Section | Shows |
|---|---|
| **Account** | Email + password login. **No editable fan profile in v1** — fans are identified by email only (no name/avatar editing) |
| **Subscription** | Current plan, upgrade/cancel |
| **Notifications** | 4 simple toggles, default on, all off-able (see below) |
| **Purchases** | Receipts / library + **Claim purchases** (Part 1, Layer 4) + **billing history** |
| **Payment methods** | Production stub (Patreon-style card/PayPal management) |
| **App** | PWA install, "all my creators" (consolidated list) |
| **Logout** | Sign out of this creator's shell |

**Notifications — keep it simple, don't overwhelm either party:**

- **4 toggles, all default ON, all turnable OFF:** New drops · Lives & events · Partner updates · Announcements
- No frequency settings in v1 (no daily/weekly digests) — one bell, four switches
- Off-able per category, never per-item. Turn them all off = the Bell is effectively off too
- Creator etiquette: broadcast rarely ("whenever they want" — their call), fans hold total silencing power

**Purchases:**

- Receipts / library — everything the fan bought from this creator, accessible forever (email is the key, Layer 2)
- **Claim purchases** — Layer 4 safety net (enter purchase email → verification code → merge)
- **Billing history** — chronological list of payments + statuses (Patreon-style); receipts downloadable in production

**Payment methods (production stub):**

- Mock: placeholder section, no-op. Production: add/edit/remove card + PayPal, transfer memberships before deleting a method (Patreon-style)

---

## Part 5: Authentication

### Fan auth (custom-built, live)

- **Email + password only** (founder decision 2026-08-08 — no magic link, no passwordless login; fans are clients with accounts, PWAs, purchases, and push notifications)
- **Independent per-creator accounts (founder decision 2026-08-08):** each creator's app has its OWN fan account — a fan can sign up on Tim's app and Tom's app with the same email, any password, and the two accounts are completely separate. **Fans are never shared between creators** — no cross-creator account sync; the only connection between creators is partnership/collab (creator-to-creator, invisible to fans). Same email on two apps = two independent rows
- **Mock social buttons** (Google / TikTok / Instagram / Facebook — no Apple) on the fan auth modal (founder decision 2026-08-08): log in a test fan now; real providers plug behind the same buttons at production
- Both create a **per-creator fan account** (`fan_accounts.email` + `creator_id`)
- Same email can have accounts under multiple creators — separate rows, separate sessions
- **Followers = no-password fan accounts (founder decision 2026-08-08):** email-only follows, free-gate unlocks, and checkout opt-ins create a `fan_accounts` row with `password_hash = null` — a **Follower**. They can't log in (register/login → "No password is set — use Forgot password to set one"), but they're cookie-recognized for guest-page perks + the landing "Your creators" row. Setting a password **upgrades them to a Fan** (same row). Followers are per-creator too — never shared between creators
- Session cookie is **one `fan_session` cookie**; its server record (`fan_sessions` row) carries the fan email + creator ID — logged into Tim's app AND Tom's app with one key
- Cookie deleted / phone lost → log in again → everything restored (data is email-based, server-side)

### Creator / staff auth

See `admin.md` — Part 1 (Access Surface). Email + password at `/login`; optional 2FA recommended for money-handling accounts.

---

## Part 6: Existing Code Reference

### LIVE (still working)

| Piece | What it does |
|---|---|
| `src/app/[username]/page.tsx` | Server logic: creator lookup, SEO metadata, cookie check, guest/fan decision (wired — renders the real guest/fan components) |
| `src/app/[username]/manifest.json/route.ts` | Per-creator PWA manifest (name, icon, scope) |
| `/api/fan/*` routes | register, login, forgot/reset password, follow, follow-creator (email-only), purchases, logout, install, content list/access |
| `/api/paypal/checkout` | Guest checkout (email only — no account required) — **v1 rail, mock (PayPal-first 2026-08-10)**; the old stripe-named routes stay as the deferred Atlas reference (`stripe/checkout`, etc.) |

### Backups (in `src/old-code/allScreens/fan-page/` — old code, reference forever, do NOT delete)

| File | State | Reuse plan |
|---|---|---|
| `page-old.tsx` | Full logic (90 lines) | Reuse as-is |
| `FanAppShell-old.tsx` | Full frame (141 lines) | Reuse — solid shell |
| `PublicCreatorPage-old.tsx` | Old linktree-style guest page (63 lines) | Reference only — rebuild per Part 3 |
| `tabs/SettingsTab-old.tsx` | Full settings (75 lines) | Reuse + extend (claim purchases, subscription) |
| `tabs/HomeTab-old.tsx` | Placeholder (15 lines) | Build fresh (activity hub) |
| `tabs/ContentTab-old.tsx` | Placeholder (15 lines) | Build fresh (gates + feed) |
| `tabs/ConnectTab-old.tsx` | Placeholder (15 lines) | Build fresh (partner billboard + followed list) |

Plus in `src/old-code/` root: CreatorHeader, FanAuthModal, FanBottomNav, GuestPageContent, PageViewTracker, InstallBanner, IOSInstallGuide, InAppBrowserWarning, UpdateToast, FollowButton, PoweredByFooter.

---

## Part 7: Production Notes

| Piece | Mock | Production |
|---|---|---|
| Guest checkout | Fake PayPal-style session URL (`mockPayments.ts`) | Real PayPal Orders/Checkout (radar-equivalent: PayPal fraud filters; cards no PayPal account needed) |
| Receipt email | Logged to console | Real Resend email with product link |
| Claim purchases code | Logged to console | Real email delivery |
| Purchase records | In-memory | `fan_purchases` table + PayPal webhook (`checkout.order.approved` / capture) |
| Affiliate settlement | Mock accounting | Deal Rules & Settlement Engine → PayPal splits or manual settlement (`creators.md` 2e2) |

---

## Open Decisions (discussed one at a time with the founder)

| Topic | Status |
|---|---|
| #1 Account model | ✅ Decided — all 4 layers (guest checkout, receipt access, same-email prompt, claim purchases) |
| #2 The three gates | ✅ Decided — free / email-gated / paid / member-only table above |
| #3 Home tab (activity hub) | ✅ Decided — Spotlight → New from creator (horizontal queue) → Updates from partners you follow (random) → **Community (when the creator has one — Decision #11)** → Your activity → Upcoming → Announcements |
| #4 Settings tab (account hub) | ✅ Decided — Account, Subscription, Notifications (4 toggles), Purchases + billing history, Payment methods stub, App, Logout |
| #5 Guest layout (signup/login placement) | ✅ Decided — signup/login on guest page, identical layout |
| #6 Notifications (TikTok-style bell) | ✅ Decided — Bell in the shell frame, manual one-tap "notify me" toggle (follow does NOT auto-bell); opens a notifications panel; creator push broadcasts; fans silence per-category in Settings |
| #7 Home partner updates section | ✅ Decided — Home gets "Updates from partners you follow" (random order, no spotlight) |
| #8 New from creator layout | ✅ Decided — horizontal swipeable queue (Substack-style) |
| #9 Fan profile | ✅ Decided — no editable fan profile in v1 (email-identified only) |
| #10 Settings depth | ✅ Decided — deepened: per-category toggles, billing history, payment-methods stub; member profile kept out |
| #11 Community in the shell | ✅ Decided — Home tab gets a Community section (channel list + join/leave); guest page gets a "Join the community" CTA. Full spec in `messaging.md` Part 3 |
| #12 Follower tier (email-only identity) | ✅ Decided 2026-08-08 — 4 tiers Visitor/Follower/Fan/Member; follow/subscribe/free-gate-unlock/checkout-opt-in create no-password `fan_accounts` rows; push is device-level, available to followers AND fans; PWA install is account-free |
| #13 PayPal checkout — invisible to fans | ✅ Decided 2026-08-10 — fans pay via PayPal (cards accepted, no PayPal account needed — email-only checkout unchanged); affiliate settlement (Deal Rules & Settlement Engine) happens post-capture, never shown to fans |
