# Earnings Screen — Vision & Spec

> **NEW 2026-10-10 (founder decision — "one dedicated money screen").** Every competitor has exactly one (Stan Store → Income, Patreon → earnings dashboard). Ours is **Earnings**: what fans paid you + what affiliates owe you and what you owe affiliates — report + receipt + prompt, in one place.

## Concept

Two founding rules:

| Rule | Meaning |
|---|---|
| **Report-only** | The screen shows what the immutable ledger says. No balance, no Cash Out button, no invented numbers — the API computes, the widget displays (2026-10-01 law) |
| **0% in v1** | The platform takes nothing (`owner.md` Part 1). Every figure here is 100% the creator's, minus PayPal's own fees (which PayPal takes, not the platform) |

**Where money actually sits (v1):** fan payments land in the **owner's PayPal balance** at capture (`creators.md` Part 1a) — the platform never holds cash. An affiliate cut is a **debt the deal owner owes the promoter**, computed and logged by the Deal Rules & Settlement Engine (`creators.md` 2e2). This screen makes those debts visible, actionable, and enforceable: **receipts + the prompt ladder + the Red Card.** Zero PayPal code in v1 ($0, no licence) — pressure does the work; PayPal's multiparty split automates it after migration (`creators.md` 2e2 production note).

---

## Part 1: Location & navigation

| Piece | Detail |
|---|---|
| URL | `/dashboard/earnings` |
| Icon | `DollarSign` (lucide) |
| Sidebar position | **after Playground**, before Settings (founder 2026-10-10 — order: Overview · Network · Playground · **Earnings** · Settings · Admin) |
| Phone bottom bar | gains a cell → 5 items + More drawer (admin phones = 6) — **verify labels fit at 375px** (`responsive.md`; truncate/hide per the existing rule if they don't) |
| Entry chain | `app/(shell)/dashboard/earnings/page.tsx` (2-line address book) → `screens/creator/earnings/Screen.tsx` → `components/earnings/EarningsPage.tsx` |

**What moves here (founder decisions 2026-10-10, extended 2026-10-12 — "A1", one money home):**

- **`EarningsSummary`** left the Network rail (2026-10-10) → this screen's §2.
- **The whole affiliate management block follows it (2026-10-12):** `＋ New deal` (the `AffiliateDealForm`) → `YourDealsCard` → `AffiliateDiscover` → `AffiliateLinks` move from the Network rail → **§2b** (`git mv` → `components/earnings/`). Rationale: Network = social (billboard + Discover); Earnings = everything money — create the deal where its money shows up. **No behavior change** — same form, same API, same `dealsKey` refresh bell (founder explicitly deferred all deal-logic work — negotiation cards, partners-only rules, cancel semantics — to the money batch).
- **`PaymentsPanel`** left Settings → §3 (`settings.md` Part 2 is a moved-pointer stub — numbering untouched).
- Overview is unchanged (its stat cards stay; this screen is the deep dive).

---

## Part 2: The three sections

### §1 Sales — what fans paid you

| Piece | Behavior |
|---|---|
| Headline | **Total sales** — completed `fan_purchases` where creator = me, currency from the server (`money()`; never sum client-side) |
| Table | Recent sales: date · item · fan email · amount · status |
| Empty | "No sales yet" → link to Playground → Catalog |
| Source | **NEW `GET /api/creator/earnings/sales`** |

### §2 Affiliate earnings — money between you and your collabs

Two directions, **always split** — never one blended "total" (the 2026-10-01 earned-vs-owed rule):

| Card | Who owes whom | Figure |
|---|---|---|
| **You earned** | You promoted others' deals → they owe **you** | Σ `promoter_cut` of not-yet-settled conversions where I'm the promoter |
| **You owe** | Your sales had a promoter → **you** owe them | Σ `promoter_cut` of not-yet-settled conversions where I'm the owner |

Under each card: **receipt rows** (one per conversion), newest first:

| Column | Content |
|---|---|
| Counterparty | Display name + @handle (+ their PayPal.me handle on rows where I must pay — see §3) |
| Deal / sale | Deal terms (rate/type) + the sale it came from + amount |
| Status chip | `⏳ Due {date}` · `🟩 Clean` · `🟥 In arrears` · `👁 Awaiting confirm` · `🧑‍⚖️ Awaiting verdict` · `✅ Settled` · `⚠️ Disputed` |
| Action | Role-dependent (Part 3) |

**Empty states:** no deals yet → "No affiliate deals yet — create one below" (the form lives in §2b on this same screen since 2026-10-12). Deals but no conversions → "No conversions yet — share your partner's work."

**Status source:** `GET /api/creator/affiliates/earnings` (EXTEND — rows carry the receipt fields + `red_card` + ladder notices; evaluation happens here, lazily — Part 5).

### §2b Affiliate deals & links — the management block (moved from the Network rail 2026-10-12)

Rendered directly under §2 (same `space-y-6` stack, no outer card — each widget keeps its own card, byte-identical to the rail build):

| Piece | Behavior |
|---|---|
| Heading row | **Affiliate deals** label + `＋ New deal` button (toggles the form) |
| `AffiliateDealForm` | Opens under the heading on `＋ New deal` / closes on Cancel — unchanged (creator-only scope, @username resolver) |
| `YourDealsCard` | Status pills + Pause/Resume/Revoke |
| `AffiliateDiscover` | Browse other creators' open deals → Create link |
| `AffiliateLinks` | Your links + copy + active toggle |
| Refresh | One shared `dealsKey` bumps after a create → all three cards refetch (the 2026-10-01 audit fix — preserved verbatim) |

> **Not in this batch (money batch, parked 2026-10-12):** partners-only creation, chat-negotiated deal cards in Circle Partners, `Make a deal` per partner row, cancel-future-only semantics, `AffiliateDiscover`'s retirement. This batch is a **relocation only**.

### §3 Payments — where money lands

| Piece | Behavior |
|---|---|
| **PayPal.me handle** | One input: *"Get paid — your PayPal.me handle"* (`paypal_handle`, 3–77 chars, letters/digits/`-`/`_`/`.`). Live preview `paypal.me/{handle}` + Save. This is what debtors' **[Pay now]** opens — the one edit home for it (not Settings) |
| **Connect PayPal** | The honest **"Coming soon — production: OAuth connect"** card stays below (moved with `PaymentsPanel`; no fake connect) |
| Payout note | Static line: *"Fan payments land directly in your PayPal balance — the platform never holds your money."* |

---

## Part 3: Receipt protocol (the actions)

One conversion = one short conversation. Both sides always see the same row, with different buttons:

```
pending ──[Mark as paid]──▶ awaiting_confirm ──[Confirm received]──▶ settled ✅
   │                              │
   │ (14d overdue)                └──[Dispute]──▶ disputed ⚠️ ──admin verdict──▶ settled | back to pending
   └──▶ 🟥 Red Card + ladder notices
```

| Row I'm looking at | Buttons I get | What it writes |
|---|---|---|
| **I owe** (I'm the owner) | **[Pay now]** → opens `paypal.me/{promoter_handle}` in a new tab (no handle → copy-paste instructions + still allow marking) · **[Mark as paid]** | `owner_paid_at` → status `awaiting_confirm` |
| **I'm owed** (I'm the promoter), not yet paid | none (⏳ Due chip + the ladder does the reminding) | — |
| **I'm owed**, owner marked paid | **[Confirm received]** · **[Dispute]** (+ optional reason) | `confirmed_at` → `settled` · or `disputed_at` → `disputed` |
| Either side, after 14d promoter silence on a marked row | none — chip **🧑‍⚖️ Awaiting verdict** | row enters the admin verdict queue (below) |

**Idempotent + immutable:** actions are role-checked server-side (mark = owner only; confirm/dispute = promoter only), replay-safe, and never rewrite the computed cuts.

**Admin verdict (the backstop):** disputes + ghost rows land in an admin queue (`GET /api/admin/disputes` + `POST /api/admin/disputes/[id]/resolve { verdict: "settled" | "reopen" }`) — admins read the immutable ledger + attribution chain and decide (`creators.md` 2e dispute resolution). Spec'd here (the protocol's home), wired on Sheet 23.

**Mutual debts (display-only):** if A owes B and B owes A, each side's cards show one hint line — *"You owe each other — about $N net"* — **informational only**, never auto-netted (the ledger stays per-conversion).

---

## Part 4: The Red Card 🟥 (the guarantee)

**Trigger:** a creator is 🟥 when they have **any outgoing debt unpaid past 14 days** OR **any disputed conversion they're a party to**. One glance on this screen: a banner above §2 + a status chip on the nav item.

| # | While 🟥 — what locks | Why |
|---|---|---|
| 1 | **No new deals, any role** (server 403 on deal create) | Why would anyone sign a deal with someone in arrears? |
| 2 | **Owner-side deals pause** (engine stops writing new conversions on deals they pay) | The existing engine already refuses non-active deals — set them `paused`, auto-restore on clear |
| 3 | **Receivables held** — people who owe 🟥 see *"Hold this payment — releases automatically"*, their due-clock **pauses** (they stay 🟩) | Money must not flow into a red account ahead of its own creditors |
| 4 | **Clears only by paying** — self-unlock when no outgoing debt is overdue and no dispute is open | Paying is the cure; nothing else is |

**Grace-cure exception (the deadlock fix, founder-approved):** *a hold never blocks a payment that would clear the payer's own 🟥 state.* In mutual-debt jams (A 🟥 to B, B 🟥 to A) both cures are always allowed — never block someone from paying their way out.

**Escape hatches:**
- **Ghost promoter:** owner marked paid + promoter silent 14 days → 🧑‍⚖️ **Awaiting verdict** → admin decides (never a stuck row).
- **Admin = backstop** on everything — the ledger is immutable, so a verdict only flips status fields, never history.
- **Hold release:** when the red creator clears, holds release automatically and each held payer's due-date shifts forward by the hold duration (their clock truly paused).

**Honest limit (v1):** these are protocol-level holds — ledger + record + operation pressure. The platform cannot physically hold PayPal cash (no licence — `owner.md` Part 2 lever). Real holding/escrow = end-of-dev decision + Bank of Mauritius NPS Act §9 check. **Transfer guarantee = pressure today, automatic at migration** (PayPal multiparty split at capture — Part 5 production note).

---

## Part 5: Prompt ladder + notifications

**Window: 14 days everywhere (Option A, founder 2026-10-10).** Due date = conversion `created_at` + `SETTLEMENT_DUE_DAYS` (14) — a shared constant in `lib/limits.ts`, stamped as `due_at` on the row.

| When | The debtor (owes) sees | The promoter (owed) sees |
|---|---|---|
| **T0** (conversion written) | Prompt: *"You received $10 — $1 is owed to @z. Pay now"* (their PayPal.me + **[Mark as paid]**) — in-app row + activity + email | *"You earned $1 on @x's sale"* — badge + activity + email |
| **T+3** | Amber reminder (in-app + email) | — |
| **T+7** | Final notice: *"Red Card in 7 days"* (in-app + email) | — |
| **T+14** | 🟥 Red Card fires (Part 4) | *"@x's payment is overdue — held"* (badge + activity + email) + dispute available |
| Owner clicked **Mark as paid** | — | *"@x marked $1 paid — confirm or dispute"* (+ 14d silence → 🧑‍⚖️ verdict) |

**How v1 evaluates:** lazily inside `GET /api/creator/affiliates/earnings` (idempotent via `reminders_sent` counter + `last_reminder_at` — each notice fires at most once per stage). **PRODUCTION-NOTE:** replace with a cron/queue at migration (no cron in mock).

**Channels v1 (founder 2026-10-10):**

| Channel | Where | State |
|---|---|---|
| **Earnings badges** | section chips + the sidebar nav dot when action is required (overdue owed-to-me, awaiting confirm) | v1 — source of truth |
| **Overview activity feed** | extend `get_creator_activity` (mock RPC) + `describe()` in `GET /api/creator/activity` with affiliate events: `affiliate_earned`, `payment_due`, `payment_overdue`, `payment_marked`, `payment_confirmed`, `dispute_opened` | v1 |
| **Email** | existing `mockResendSend` contract (`src/lib/mocks/mockResend.ts` — mock logs the send; real Resend at migration) — templates: earned / owed / T+3 / T+7 / overdue / marked / verdict | v1 |
| **Bell (fan-app push) + dashboard push** | deferred — the creator Notifications settings already say so honestly (no fake toggles) | ⏳ deferred |

---

## Part 6: Data model + API

```ts
creators:
  paypal_handle?,              // NEW 2026-10-10 — PayPal.me username, edited in §3

affiliate_conversions:         // EXTEND — receipt protocol (Part 3)
  ...,                         // (deal_id, sale_id, cuts, settle_method, settlement_status — creators.md 2f)
  due_at,                      // created_at + SETTLEMENT_DUE_DAYS (14) — holds shift it on release
  owner_paid_at?,              // debtor clicked "Mark as paid"
  confirmed_at?,               // promoter confirmed receipt
  disputed_at?, dispute_reason?,
  reminders_sent: number, last_reminder_at?   // ladder idempotence (Part 5)
```

| Route | Method | Purpose |
|---|---|---|
| `/api/creator/earnings/sales` | GET | §1 sales list + server-side total |
| `/api/creator/affiliates/earnings` | GET | **EXTEND** — both directions + receipt fields + `red_card` + ladder evaluation (lazy notices) |
| `/api/creator/affiliates/conversions/[id]/settle` | POST | `{ action: "mark_paid" \| "confirm" \| "dispute" }` — role-checked, idempotent (Part 3) |
| `/api/creator/earnings/paypal` | PUT | Save `paypal_handle` (§3) |
| `/api/admin/disputes` + `/api/admin/disputes/[id]/resolve` | GET/POST | Admin verdict queue (Part 3) |

**Server-side helper:** `computeRedCard(userId)` in `lib/` (pure read over conversions) — one implementation shared by the deals POST (lock ① 403), the engine (lock ② pause), and the earnings GET (banner).

---

## Part 7: Component concepts

```
EarningsPage
├── SalesSection (§1)
├── AffiliateSection (§2)
│   ├── EarnedCard  (owed to you → receipt rows)
│   ├── OwedCard    (you owe → Pay now / Mark as paid)
│   ├── ReceiptRow  (counterparty · terms · status chip · role action)
│   └── RedCardBanner (when 🟥 — the 4 locks + what clears it)
├── AffiliateDealsSection (§2b — moved from the Network rail 2026-10-12)
│   ├── ＋ New deal → AffiliateDealForm (git mv from components/network/)
│   ├── YourDealsCard      (git mv)
│   ├── AffiliateDiscover  (git mv)
│   └── AffiliateLinks     (git mv)   — all four share one dealsKey
└── PaymentsSection (§3)
    ├── PayPalHandleCard (input + live preview + Save)
    └── PaymentsPanel    (honest "Coming soon" connect card — git mv from settings/)
```

**Moves:** `git mv components/network/EarningsSummary.tsx → components/earnings/` (extended into §2) · `git mv components/settings/PaymentsPanel.tsx → components/earnings/` · **2026-10-12 (A1):** `git mv` `AffiliateDealForm` + `YourDealsCard` + `AffiliateDiscover` + `AffiliateLinks` → `components/earnings/`, composed by a new `AffiliateDealsSection` · folder = the product name = the URL (`earnings`), per the folder rule.

**Removed from Network:** the rail keeps only the billboard mirror — the whole affiliate block left 2026-10-12 (`network.md` §7).

---

## Part 8: Decisions

| Topic | Status |
|---|---|
| #1 One dedicated Earnings screen | ✅ Decided 2026-10-10 — `/dashboard/earnings`, DollarSign, after Playground; §1 Sales · §2 Affiliate earnings · §3 Payments; EarningsSummary + PaymentsPanel move here |
| #2 Report-only, 0% | ✅ Decided 2026-10-10 — no balance/Cash Out; platform takes nothing in v1 |
| #3 Receipt protocol | ✅ Decided 2026-10-10 — mark paid → confirm/dispute → verdict; role-checked, idempotent, immutable ledger underneath |
| #4 The Red Card | ✅ Decided 2026-10-10 (founder's design + grace-cure deadlock fix) — 4 locks, self-unlock, ghost escape, admin backstop, mutual-debt net hint display-only |
| #5 14-day window + prompt ladder (Option A) | ✅ Decided 2026-10-10 — T0/3/7/14, both sides notified, `SETTLEMENT_DUE_DAYS = 14` in `lib/limits.ts` |
| #6 Notifications v1 | ✅ Decided 2026-10-10 — Earnings badges + Overview activity + email (`mockResendSend`); bell/push deferred with honest labels |
| #7 Guarantee layering | ✅ Decided 2026-10-10 — v1 = pressure (ledger + ladder + Red Card + verdict, $0, no licence); production = PayPal multiparty split at capture (re-checked at migration — buy only PayPal's licence) |
| #8 Affiliate block relocation ("A1") | ✅ Decided 2026-10-12 — the whole management block (`＋ New deal` · Your deals · Discover · Links) leaves the Network rail → **§2b here**; Network = social (billboard + Discover). **Relocation only** — no deal-logic changes (that batch is parked: Circle Partners `Make a deal`, chat deal cards, partners-only, cancel-future-only) |
