# Creator Monetization — Vision & Spec

> **Split 2026-08-05:** the old mixed `monetization.md` is now TWO files. This one is **the creators' money** (Flows 1 + 2 — catalog sales + affiliate deals). The platform owner's money (Flow 3 — how CreatorBioTree gets paid) lives in `owner.md`. See `index.md`.

## Concept

Two money flows belong to creators. The platform takes **0% of either in v1** (minus the payment provider's own processing fees, which the provider takes, not the platform):

| # | Flow | Who pays | Who gets | Status |
|---|---|---|---|---|
| 1 | **Creator ↔ Fan** | Fan | Creator (via PayPal — see Part 1) | Active — creators set their own prices per catalog item |
| 2 | **Creator ↔ Creator** (affiliates) | Fan (via Creator A's catalog) | Creator B (promoter) + Creator A (owner) per the deal terms | Active — full freedom, see Part 2 |

**Flow #3 (Creator → Platform)** is the platform's money — NOT this file. See `owner.md`.

---

## Part 1: Creator ↔ Fan (catalog sales)

- **Creators set their own prices per catalog item** — free, email-gated, paid (`"Buy — $X"`), or subscription (`"Join membership"`). See `fan-shell.md` Part 2 (the Three Gates) for the fan-facing rules.
- **16 item types** in the My App Catalog tab (`my-app.md` Part 2c — the 16-type table) — every type can carry any of the pricing states above.
- **Payments route through PayPal — PayPal-first (founder decision 2026-08-10).** Guest checkout = email only, no account required (`fan-shell.md` Part 1, Layer 1). In dev: mock PayPal (`USE_MOCKS=true`, fake checkout sessions — `src/lib/mocks/mockPayments.ts` is the design draft). `src/lib/stripe.ts` is the deferred **Atlas path**; Paddle is the future Flow-3 processor, not a draft rail — see `owner.md`.
- **Refunds + access control** — production: creator-managed via PayPal (`settings.md` payments); mocked in v1.
- **GDPR / receipts** — purchase records in `fan_purchases`; the receipt email IS the access key (`fan-shell.md` Part 1, Layer 2).
- **The creator's share:** 100% of every sale minus PayPal's own processing fees. No platform take rate in v1 (`owner.md` Part 1 #3).
- **No revenue-sharing with collabs unless a deal exists** — a collab is just a relationship; money moves only when the two creators agree on affiliate terms (Part 2).

### 1a. Why PayPal-first (founder decision 2026-08-10)

- **The founder's own bank/region (Mauritius) — Stripe and Paddle are unreliable/unavailable there.** PayPal is verified and works. Real money must land somewhere the founder can actually push to.
- PayPal Checkout accepts **cards (Visa/MC/Amex, debit + credit) cross-border without the buyer needing a PayPal account** — fans pay with a card, the creator gets paid into their PayPal. Guest checkout (email-only, no account) is preserved: the fan's email at checkout is the receipt key (`fan-shell.md` Part 1).
- **Payout rail is PayPal too** — the fan's payment settles into the **creator's PayPal balance** (via PayPal Smart Payment Buttons / Orders API + `CREATE_ORDER` capture). No bank-account/KYC routing needed at launch.

### 1b. The Atlas path (deferred Stripe — stays as a documented option)

- **Stripe is NOT wired — deferred.** `src/lib/stripe.ts` + `api/stripe/*` remain as reference for a later pass (post-launch, resolved by the founder when banking allows it).
- **Paddle is the Flow-3 (platform) processor** — see `owner.md` (Paddle = merchant of record, handles VAT/tax globally; verified in the founder's region).

### 1c. External-link quarantine (NEW 2026-08-10)

- Per-item, a creator may set **"Payment: External link"** (e.g., a direct PayPal.me / Stripe Payment Link / Gumroad URL) instead of the in-app checkout (`my-app.md` Catalog editor). That item's fan-facing card still says "Buy — $X" — the tap opens the external URL in a new tab.
- **Quarantine rule:** external-link items are **excluded from affiliate deals (`network.md` §7)** — the platform cannot see, verify, or split a transaction it doesn't process. The deal editor warns the creator when an item has an external link ("this item won't — payments happen off-platform"). No silent partial sums — a deal covers only in-app-processed items.

---

## Part 2: Creator ↔ Creator — Affiliates (deal freedom + platform trust)

**Decision (2026-08-05):** Affiliate deals between creators are **free-form, creator-defined, and protected by the platform as the trust layer.** The platform doesn't take a cut in v1.

### 2a. What creators can do

When two creators are collabed (in-app or via partnership), either side can offer the other an affiliate deal. **ANY deal structure is allowed** — no restrictions imposed by the platform:

| Deal type | Example | Notes |
|---|---|---|
| **Percentage** | "I'll give you 10% of every sale you drive" | The standard. 0%-100% allowed. |
| **Fixed amount** | "I'll pay you $5 per sale" | Good for low-priced items where % is too small |
| **Free cross-promo** | "Just share my stuff — you get 0%, I get 0%, it's all about the relationship" | Valid deal. Logged, just no money moves |
| **Tiered** | "5% on first 10 sales, then 10% after" | Volume bonuses, retention deals |
| **Custom terms** | "You get 15% but only on your VIPs, expires in 30 days" | Free-text terms; platform records them immutably |

**Creator choice is total.** No defaults forced. No "platform recommends 10%". **No minimums or maximums** — no validation on rates or amounts. If two creators want to agree to "you pay me $1,000 if I send you 100 fans," that's a valid deal.

### 2b. Scope — what the deal covers (NEW 2026-08-05)

A deal can target a specific item **or** a creator's whole catalog:

| Scope | What it covers | UI |
|---|---|---|
| **Per-item** | One specific catalog item ("10% on Alex's Launch Course") | Deal created from the item's editor (Affiliate section) |
| **Per-creator** | The creator's entire catalog ("5% on everything") | Deal created from the Network/My Peeps collab view |

A creator can hold per-item deals on several items AND a per-creator deal — the more specific scope wins on a sale (per-item beats per-creator). Both are allowed to coexist.

### 2c. Triggers — what counts as a conversion (NEW 2026-08-05)

Beyond sales, a deal can pay on other fan actions. The trigger is part of the deal terms:

| Trigger | Meaning |
|---|---|
| **Purchase** | Fan buys the item (default) |
| **Follow** | Fan follows the promoted creator (or the item's creator) |
| **Subscribe** | Fan joins the promoted creator's membership |
| **Tip** | Fan sends a tip |
| **Signup** | Fan creates an account via the promoter's link |
| **Any** | Any of the above — per the terms |

The trigger is declared in the deal (`trigger` field). Attribution + payout logic checks the trigger on every conversion event.

### 2d. Asymmetric deals (NEW 2026-08-05)

**Each side configures their OWN deal independently.** Creator A offers "10% on my course" to Creator B; Creator B might offer "free cross-promo" back — or nothing. There is no forced symmetry, no one deal object shared between two creators.

- Each creator owns their `affiliate_deals` rows (the offer they make to their collabs).
- A collab can have zero, one, or several deals across the two sides, each with its own terms.
- Money flows **from the deal's owner to the promoter** for each conversion: "I (owner) will give YOU (promoter) $5 every time one of MY fans follows YOU" — the owner pays the promoter out of the revenue the fan generated (or their own pocket, per the terms).

### 2e. What the platform does (the trust layer)

Even though the platform doesn't take a cut, **the platform is the trust and distribution layer.** This is the value-add that prevents creators from being scammed by the other party:

| Mechanism | What it does |
|---|---|
| **Immutable audit log** | Every affiliate deal = a row in `affiliate_deals` with both creator IDs, deal terms (type/scope/trigger), timestamp. Neither party can retroactively edit or delete. The platform owns this ledger |
| **Automatic attribution** | When a fan clicks an affiliate link, the `ref` param is captured server-side (not just cookie — server-side is the source of truth). Attribution survives ad-blockers, cookie clearing, private browsing |
| **Deal Rules + Settlement Engine** | See **2e2 below** — the platform's headed distribution: every in-app sale pays the owner's PayPal balance; per-deal cuts are settled via PayPal splits automatically, or via manual settlement (PayPal.me link) when the parties opt out. Either way the platform logs the settlement immutably |
| **Dispute resolution** | If one party claims the other manipulated the deal, scammed, or under-reported, the platform's admin team (see `admin.md`) can pull the audit log + the attribution chain + the settlement records. Evidence-based resolution |
| **Transparency for both sides** | Each creator sees their own dashboard (clicks, conversions, revenue earned/owed) but NOT the other side's view. Each side can download their own transaction log as CSV. Privacy is preserved; trust is via platform |
| **Deal expiry + renewal** | Deals can have a `valid_from` / `valid_until` range. Expired deals don't attribute conversions. Creator can re-issue with new terms. No silent deal changes |

**Fan experience is unchanged and INVISIBLE** — fans never see affiliate labels, deal terms, or that a deal exists at all. Attribution is a silent `ref` param. (Founder decision 2026-08-05.)

**In v1 (no platform take rate):** the platform provides the audit + attribution + settlement + dispute layer for free. This is the platform's value-add to make collabs safe and easy.

**At end of dev (if platform adds a take rate):** the **Settlement Engine becomes the take-rate mechanism** — the platform's cut is deducted in the same settlement pass that routes owner + promoter cuts (`owner.md` Part 2). If PayPal-only rails ever bind, the engine can settle via Payoneer or another rail without redesigning attribution or the ledger. The audit log + attribution stay the same.

### 2e2. The Deal Rules & Settlement Engine (NEW 2026-08-10)

**Model:** all fan payments for in-app items land in **the creator's PayPal balance** (Part 1a). "Distribution" is therefore: **fan pays owner's PayPal** → **owner settles promoter per the deal terms** — and the platform makes that settlement visible, verifiable, and partly automatic:

| Piece | How it works |
|---|---|
| **Deal Rules** | Each deal's terms are stored as rules on the deal row (type/scope/trigger/rate/amount/custom-terms). The engine evaluates the rule on every `fan_purchases` write (trigger = purchase by default; follow/subscribe/tip/signup read their own event tables) |
| **Settlement record** | Every conversion writes a `affiliate_conversions` row: deal_id, sale_id, owner_cut, promoter_cut, computed per the rules at sale time — logged before any money moves (immutable, matches the audit ledger) |
| **Auto-split (default, where possible)** | PayPal **splits** the captured payment (owner receives the funds; `promoter_cut` pushed to the promoter's PayPal) — via the PayPal Orders API in production, mocked in dev |
| **Manual settlement (creator opt-out)** | If the owner prefers (e.g., PayPal splits unavailable in the promoter's region, or the deal is "free cross-promo"), the platform records the owed cut as a **pending balance** and issues a one-click **"Settle via PayPal.me"** action. The platform marks it `settled_manually` on confirmation. No silent skips — a conversion stays `pending` until settled either way |
| **Pending dashboard** | Both sides see their own settlement status per conversion (settled / pending / disputed). The promoter's "My Earnings" shows settled vs pending exactly like PayPal's own payout ledger |
| **Never auto-creates money** | The engine never creates a payment out of thin air — it only records computed cuts + splits real captured funds. A "custom terms" deal that says "$1,000 if you send 100 fans" is still honored: the engine sums the conversions and the owner settles the agreed amount manually per the ledger |

**External-link quarantine (Part 1c) applies here:** the engine only sees in-app processed payments. Items selling via external links are excluded from deals — the rule builder warns, and conversions never reference off-platform sales.

**Fan experience is unchanged and INVISIBLE** — fans never see affiliate labels, deal terms, or that a deal exists at all. Attribution is a silent `ref` param. (Founder decision 2026-08-05.)

### 2f. Data model (for Phase F)

```ts
affiliate_deals (immutable ledger — owner side configures, see network.md §7 for UI):
  id,
  owner_id (Creator A — the one paying), promoter_id (Creator B — the one promoting),
  scope: 'item' | 'creator',
  item_id?,              // required when scope = 'item'
  deal_type: 'percentage' | 'fixed' | 'free' | 'tiered' | 'custom',
  trigger: 'purchase' | 'follow' | 'subscribe' | 'tip' | 'signup' | 'any',
  rate?,                 // percentage: 0-100; fixed: amount in cents
  custom_terms?,         // free text for 'custom' or 'tiered'
  valid_from?, valid_until?,
  created_at, status: 'active' | 'paused' | 'expired' | 'revoked'

affiliate_attributions (server-side, survives cookie clearing):
  id, ref_code, fan_id?, item_id, deal_id, attributed_at

affiliate_conversions:
  id, deal_id, sale_id, owner_cut, promoter_cut,
  settle_method: 'auto_split' | 'manual' | null,
  settlement_status: 'pending' | 'settled' | 'disputed',
  settled_at?, settled_manually?,        // manual settlement confirmation
  distributed_at?, paypal_transfer_id?,   // auto-split reference (production)
```

> Settlement fields (`settle_method`, `settlement_status`, `settled_at`) are the Settlement Engine's state machine (2e2). `paypal_transfer_id` replaces the old draft's `stripe_transfer_id` — PayPal-first rails. External-link items never produce conversions (quarantined, Part 1c).

### 2g. What this means for v1 wiring

- **No platform take rate code** — don't add a `platform_fee` field to the conversion table
- **Settlement Engine, not a fixed rail** — the platform computes both cuts per the deal rules and settles via PayPal split OR manual settlement (`settle_method`/`settlement_status` on `affiliate_conversions`); mocked for now, real PayPal in production. Never hard-code a single rail (Payoneer/other rails are replacements at the engine boundary, per 2e2)
- **Audit log = the trust** — every deal, attribution, conversion, settlement logged immutably; admin can read
- **No "minimum deal amount" / "maximum rate" validation** — the spec allows any deal the two creators agree to (scope/trigger/type/amount all creator-chosen)
- **Asymmetric** — each side's deals are their own rows; no pairing/echoing on the other side
- **External-link quarantine** — external-link items never enter the engine; deal editor warns the creator (Part 1c + `network.md` §7)
- **Fan experience unchanged** — affiliate attribution is invisible (`ref` param only); payment rail (PayPal) is invisible to fans too

**The affiliate UI (deal editors, Discover, My Links, earnings) is spec'd in `network.md` §7 — this file owns the economics; that file owns the screens.**

---

## Part 3: Flow 3 — Creator → Platform

The platform's money is `owner.md`, not this file. In one line: **locked at 0% until end-of-dev** (no subscription, no take rate, no gates). When the founder runs the end-of-dev decision pass, the locked table goes into `owner.md` Part 4.

---

## Part 4: Decisions

| Topic | Status |
|---|---|
| #1 Free until end-of-dev | ✅ Decided — no money gates in v1 |
| #2 Creator↔Fan sales | ✅ Decided — creator sets prices per item; **PayPal routes** (PayPal-first, 2026-08-10); creator keeps 100% minus PayPal fees |
| #3 Affiliate deal freedom | ✅ Decided 2026-08-05 — ANY deal structure: 5 deal types, no min/max validation, custom terms allowed |
| #4 Deal scope | ✅ Decided 2026-08-05 — per-item AND per-creator deals; more specific scope wins on a sale |
| #5 Conversion triggers | ✅ Decided 2026-08-05 — purchase / follow / subscribe / tip / signup / any, declared per deal |
| #6 Asymmetric deals | ✅ Decided 2026-08-05 — each side configures their own deals independently; no forced symmetry |
| #7 Platform trust layer | ✅ Decided 2026-08-05 — immutable audit log + server-side attribution + **Deal Rules & Settlement Engine (2026-08-10)** + dispute resolution |
| #8 Fan invisibility | ✅ Decided 2026-08-05 — fans never see any affiliate UI/labels; silent `ref` attribution only |
| #9 Economics vs UI homes | ✅ Decided 2026-08-05 — economics here (Part 2); UI in `network.md` §7 |
| #10 PayPal-first payout rail | ✅ Decided 2026-08-10 — fans pay via PayPal (cards accepted, no account needed); creator's PayPal is the payout rail; Stripe deferred (the Atlas path, 1b) |
| #11 Deal Rules & Settlement Engine | ✅ Decided 2026-08-10 — cuts computed per deal rules; settled via PayPal split or manual settlement; `settle_method`/`settlement_status` state machine; the future take-rate hook (2e2) |
| #12 External-link quarantine | ✅ Decided 2026-08-10 — per-item "External link" payment opt-in; quarantined from affiliate deals; the rule builder warns (1c + `network.md` §7) |
