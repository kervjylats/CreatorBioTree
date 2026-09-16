# External Services — the "what to migrate later" checklist

> **What this is:** every service/API/library we could plug in from the outside (mostly on free tiers) to reduce codebase work — plus the things that must STAY in our code. Today everything in this file is mocked (`USE_MOCKS=true`), so **nothing here runs yet**. When we go live, we migrate the mocks to these real services following `docs/HOW_IT_WORKS.md` → Migration Recipe.
>
> **Status:** assessment, not commitments. Free-tier limits change; re-check each before migrating.

---

## 1. Already planned (your mocks already have real targets)

These five are mocked today and their real counterpart is already the design draft (see the `// PRODUCTION-NOTE:` comments in each mock file).

| What it does | Mock file | Real service | Free tier | What it removes from code |
|---|---|---|---|---|
| Database + auth | `mockSupabaseClient.ts` + `mockDataStore.ts` | **Supabase** | 500 MB DB, 50k monthly active users, free projects | The entire mock DB + login/session code |
| Email | `mockResend.ts` | **Resend** | 100 emails/day free (3k total) | Custom email sending |
| AI (summaries + color palettes) | `mockAI.ts` | **Groq** | Generous free rate limits (Llama-class models) | Hand-written "AI" keyword matching |
| Payments | `mockPayments.ts` | **PayPal** (PayPal-first rail, 2026-08-10 — cards accepted, no buyer account needed; Stripe = deferred Atlas reference, `creators.md` 1b) | No monthly fee — per-transaction only | Fake checkout/session code |
| Subscriptions + sales tax | `mockPayments.ts` (Paddle half) | **Paddle** | No monthly fee | Paying VAT/GST to creators in every country (Paddle handles it) |
| File uploads | `makeStorageApi()` in `mockSupabaseClient` | **Supabase Storage** or **Cloudflare R2** | Supabase 1 GB free / R2 10 GB egress free | File-save code |
| Video | stub URLs | **Cloudflare Stream** | 100 GB storage free (per Stream free plan) | Video hosting + player |

## 2. NEW wins — things we build by hand today that a free service could do

These are the ones that most shrink the codebase. **Not built yet, not wired — assessment only.**

| # | Area | Built in-code today | Free service to swap in | Savings | Caveat |
|---|---|---|---|---|---|
| 1 | **Push notifications** | `web-push` + VAPID + `push_subscriptions` table + service worker wiring | **OneSignal** (free tier: 10k subscribers, unlimited sends) | HUGE — kills an entire subsystem | OneSignal is a third party; fans' devices go through them |
| 2 | **Background jobs** (scheduled publish, emails, affiliate payouts) | `queue.ts` = `DirectQueue` (runs immediately) | **QStash** (500 msgs/day free) or **Inngest** (10k events/mo free) | Kills queue infra | Both already sit commented-out inside `queue.ts` |
| 3 | **Real-time (chat)** | Polling (**implemented** — 6s polling in `useChat`, ChatShell) | **Supabase Realtime** free | Replaces polling with live push | Deferred decision per `messaging.md` |
| 4 | **Error tracking** | Nothing | **Sentry** free | Debugging speed, not code size | Optional |
| 5 | **Analytics** (views, installs) | Custom tables + RPCs | **PostHog** (10k events/mo free) or keep custom | Optional — your data vs theirs | Keep custom if privacy matters |
| 6 | **Branded share-card images** (OG meta) | Hand-rolled | **@vercel/og** (open-source, free) | Removes image-gen code | Serverless edge, no cost |
| 7 | **Charts** (creator stats) | Custom SVG/divs | **Recharts** (open-source, free) | Removes chart code | Add dependency |
| 8 | **CSV export** (fan list) | Hand-rolled | **PapaParse** (open-source, free) | Removes CSV code | Tiny — maybe keep hand-rolled |
| 9 | **Google / GitHub login** | Email/password only | **Supabase Auth OAuth** | Adds social login, near-zero code | Free |
| 10 | **Search** | DB `ilike` | **Algolia / Typesense** free tiers | Only if search grows big | DB search is fine for v1 |

## 3. The middle — libraries already installed, add low-effort wins

These are free open-source libs that remove hand-writing UI logic:

| Area | Library | Note |
|---|---|---|
| Toast/toast notifications | `sonner` | Already installed + wired in root layout |
| Icons | `lucide-react` | Already installed |
| Drag & drop | `@dnd-kit` | Not installed — remove if no longer needed; was used for catalog reorder |
| Form state | `react-hook-form` | Not installed yet — only if My App forms get complex |
| Date handling | `date-fns` | Not installed — SQL/ISO strings may be enough |

## 4. What STAYS in our code (the secret sauce — don't outsource)

These are your product. Outsourcing them would mean renting out your differentiation:

| Feature | Why it stays |
|---|---|
| **The fan-app builder** (My App designer, catalog editor) | The core product — creator-to-fan publishing |
| **The branding system** (`resolveBranding`, custom themes) | Your look-and-feel, not a service's |
| **The chat engine** (`ChatShell`) | Spec'd custom via `messaging.md`; realtime provider is the only external bit |
| **Affiliate deal ledger + attribution + distribution** | Custom trust layer (`affiliate_*` tables) — the platform's credibility |
| **PWA manifests + install kit** | Ours, per-creator, driven by branding |
| **Payments business logic** | **PayPal handles card rails (v1, PayPal-first — 2026-08-10; Stripe = deferred Atlas path)**; the rules around purchases/claims/settlement stay yours |

## 5. Planned / noted for much later (don't worry now)

| Item | When |
|---|---|
| Custom domains (premium) | Vercel alias or reverse proxy — post-launch |
| PDF export (`jspdf`) | ROADMAP Phase G |
| AI agent workforce | `ai-agents.md` — placeholder only |
| Real push + real analytics + coupon codes | ROADMAP Phase G |

## 6. Migration flow reminder

1. Open the mock file — the function signature / return shape IS the contract.
2. Write the real call returning the **same shape**.
3. **Add** what the real service gives you natively (see `// PRODUCTION-NOTE:` comments).
4. Flip `USE_MOCKS=false` and test side-by-side.
5. Mocks stay in the repo forever (reference + fallback).

Always check free-tier limits before switching anything live — the chart here is a snapshot, not a guarantee.