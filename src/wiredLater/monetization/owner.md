# Owner Monetization — Vision & Spec

> **Split 2026-08-05:** the old mixed `monetization.md` is now TWO files. This one is **the platform owner's money** (Flow 3 — how CreatorBioTree gets paid). The creators' money (Flows 1 + 2) lives in `creators.md`. See `index.md`.

## Concept

**The rule (founder decision):** everything ships FREE. No trials, no premium tiers, no in-app purchases for creators, no paywalls — until ALL features are built, wired, and reviewed. Monetization decisions happen at the END of development, as one deliberate pass, not feature-by-feature.

**Why this file exists:** it's the single home for every PLATFORM money decision (Flow 3) so they're made coherently at the end — not scattered across specs. When a feature spec says "premium", "paid", or "deferred pricing", it points here.

**The three distinct money flows (don't conflate them):**

| # | Flow | Who pays | Who gets | Spec home |
|---|---|---|---|---|
| 1 | **Creator ↔ Fan** | Fan | Creator (via PayPal — see `creators.md` Part 1) | `creators.md` Part 1 |
| 2 | **Creator ↔ Creator** (affiliates) | Fan (via Creator A's catalog) | Creator B (promoter) + Creator A (owner) per deal terms | `creators.md` Part 2 |
| 3 | **Creator → Platform** | Creator | Platform (subscription or take rate) | **THIS FILE** — ⏳ Locked FREE for now, TBD at end of dev |

**Flow #1 + #2 are the creators' revenue** (not the platform's). **Flow #3 is the platform's revenue** — TBD at the end-of-dev pass. The platform takes **0% of Flows 1 and 2 in v1** (minus PayPal's own processing fees, which PayPal takes, not the platform).

---

## Part 1: The Rule

1. **All features are free during development** — messaging, community, team access, AI, catalog limits, funnels, auto-DM, everything. `USE_MOCKS=true` means no real payments anyway; no feature is gated behind money in mock.
2. **No Free/Pro split for creators in v1** — no `is_pro` / `subscription_tier` check anywhere. Every catalog item limit, every AI query, every team seat = free. The "Free vs Pro" table in `my-app.md` Part 5 is **tentative reference only** — it does NOT exist as a gate in code until the end-of-dev decision pass.
3. **No platform take rate in v1** — PayPal handles payment routing; the creator keeps 100% of their sale (minus PayPal's own processing fees). Platform cut TBD at end of dev — and when it lands, it rides the **Deal Rules & Settlement Engine** (`creators.md` 2e2): the same settlement pass that routes owner + promoter cuts deducts the platform's cut. No new payment architecture needed.
4. **No monetization decisions are locked before the end** — pricing, tiers, trials, IAPs, take rate are ALL deferred.
5. **One decision pass at the end** — after Phase F wiring, the founder decides how the platform gets paid (subscriptions? per-creator plans? transaction fees? IAP?) and THIS FILE records it.
6. Until then, every spec that mentions pricing keeps the phrase "**decided in `monetization/`**".

**Flow 3 processing note (founder decision 2026-08-10):** when the platform eventually takes money (subscriptions, take rate), the processor is **Paddle** — merchant of record, handles VAT/sales tax globally, and is **fully available in the founder's region (Mauritius)** — unlike Stripe, which is deferred (the Atlas path, `creators.md` Part 1b). `src/lib/paddle.ts` + `mockPaddle` stay in the codebase as the design draft for that day.

**During Phase F wiring: do NOT add any pricing gates.** No "you've hit your free limit" toasts. No "upgrade to Pro" banners. No `if (creator.is_pro) { ... }` branches. Build the feature, give it to every creator, decide the business model later.

---

## Part 2: Decision Levers (candidates — NOT decided, NOT committed)

These are the known levers across the platform, collected now so the end decision pass sees them all in one place:

| Levers | Where it lives today | Notes |
|---|---|---|
| **Premium tiers** (Free vs Pro split) | `my-app.md` Part 5 — tentative table: catalog limits, funnels, Auto-DM, affiliates, remove branding, AI quota | Existing tentative split — NOT a gate in v1; re-reviewed at the end |
| **Team seats** | `team.md` Part 7 — paid seats deferred | Extra team members as premium (Shopify/Stan pattern) |
| **Creator IAP / in-app purchases** | — | e.g., "pay to unlock premium features" — nothing specced, option only |
| **Trials / freemium** | — | Option only |
| **Custom domains (premium)** | `docs/HOW_IT_WORKS.md` roadmap | Creator's own domain instead of `creatorbiotree.com/username` |
| **Per-tab theming (premium upsell)** | `docs/HOW_IT_WORKS.md` roadmap | Individual colors per fan tab |
| **Transaction fees / take rate** | — | Platform takes % per sale (Stan/Gumroad model) — v1 = 0%, TBD at end. **Mechanism pre-built:** the Settlement Engine's settlement pass (`creators.md` 2e2) will hold the platform's cut — no new architecture needed at decision time |
| **Platform subscription** | — | Monthly creator plan (Linktree Pro model) — v1 = 0, TBD at end |
| **Payout rails flexibility** | — | PayPal-first for v1 (`creators.md` 1a); Payoneer or another rail can replace PayPal at the engine boundary (2e2) without redesigning attribution/ledger |

**Not a lever:** fan-side messaging, community, guest features, follows — these are FREE FOREVER by spec (`messaging.md` Part 11, Community decisions). That's a product decision, not a pricing one — fans never pay.

**Not a lever:** creator↔creator affiliate deals — creators set the terms freely, platform doesn't take a cut in v1. (See `creators.md` Part 2.)

---

## Part 3: When & How

| When | What happens |
|---|---|
| End of development (after Phase F wiring + review) | Founder makes ONE pass through Part 2 levers + any new ideas |
| Decision made | This file gets the locked pricing table (Part 4) |
| Wiring of pricing | Same Phase F wiring principles — spec-first, then wire |

---

## Part 4: Locked Pricing (placeholder — filled at the end)

*This section is intentionally empty. The founder fills it at the end-of-development decision pass.*

---

## Part 5: Decisions

| Topic | Status |
|---|---|
| #1 Everything free until end-of-dev | ✅ Decided — no gates during build |
| #2 Monetization files as single home | ✅ Decided — all pricing decisions recorded here (`index.md` points at both files) |
| #3 Fan-side free forever | ✅ Decided — messaging, community, guest features, follows never pay (see `messaging.md` Part 11) |
| #4 The actual pricing | ⏳ Deferred to end-of-development decision pass |
| #5 No Free/Pro tier gate in v1 | ✅ Decided 2026-08-05 — `is_pro` checks forbidden during Phase F wiring; all features free until end-of-dev |
| #6 No platform take rate in v1 | ✅ Decided 2026-08-05 — creators keep 100% of their sales (minus **PayPal's** own processing fees — rail updated 2026-08-10); platform cut TBD at end |
| #7 File split (owner vs creators) | ✅ Decided 2026-08-05 — Flow 3 (platform money) here; Flows 1+2 (creator money) in `creators.md` |
| #8 Paddle = Flow 3 processor | ✅ Decided 2026-08-10 — Paddle (merchant of record, VAT included, verified in Mauritius); Stripe deferred (Atlas path) |
| #9 Settlement Engine = the take-rate mechanism | ✅ Decided 2026-08-10 — the engine (`creators.md` 2e2) is the future home of the platform's cut; 0% wired in v1 |
