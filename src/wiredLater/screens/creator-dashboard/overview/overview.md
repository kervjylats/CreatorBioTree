# Dashboard Overview — Vision & Spec

## Concept

The overview (`/dashboard`) is the landing page a creator sees after logging in. It answers two questions in one glance: **"where do I stand?"** (money, traffic, fans, content) and **"what should I do next?"** (setup checklist, quick actions, alerts).

Designed from competitor research (Gumroad home, Stan Store funnel, Linktree Insights, Patreon membership health) — but with **App installs** as our unique metric, since no competitor has a PWA-install story.

Two states:
- **Creator** → their own stats (revenue, views, installs, fans, content)
- **Admin** → platform-wide totals (creators, fans, revenue) instead of personal stats

**One page, zero navigation** — everything on it links deeper (My App, settings) or is actionable in place (share, QR, checklist buttons).

---

## Part 1: Stat Cards

A row of 5 cards, top of page. Each shows the number for the selected period + icon.

| Card | Metric | Icon |
|---|---|---|
| Revenue | `total_revenue` for period | 💰 |
| Page views | `view_count` for period | 👁 |
| App installs | `install_count` for period | 📲 |
| Fans | `fan_count` for period | 👥 |
| Content items | `content_count` (lifetime — not period-filtered) | 📦 |

**Date-range filter** (top-right of the row): **7 days / 30 days / All time** — 30 days default. Content items stays lifetime regardless of filter.

**Admin variant:** Revenue → platform revenue, Page views → total views, Fans → total fans, Content → total creators; App installs → total installs. Same cards, platform data.

---

## Part 2: Money Section

Gumroad-style balance summary + best sellers.

| Piece | Shows |
|---|---|
| Balance cards | **Revenue now** (period) · **Last 7 days** · **Last 28 days** · **Lifetime** |
| Top-selling items | Top 3 items by revenue in period — thumbnail, name, sales count, revenue |

**Empty state:** "No sales yet — your first fan is out there. Share your page link." + Share button.

---

## Part 3: Live Activity Feed

Merged, chronological timeline of the last 10 events (Gumroad's feed, but adapted to our event types):

| Event type | Line shown |
|---|---|
| New sale | "💰 {email} bought {item} for $X" |
| New fan | "👥 {email} signed up" |
| New subscriber | "🔁 {email} subscribed to {membership}" |
| New install | "📲 Someone installed your app" |
| New follower (partner page) | "🤝 {name} followed your partner page" |
| New message | "💬 {name} messaged you" (from the fan/guest inbox — see `messaging.md`) |

Empty state: "Your activity will show up here — sales, signups, installs."

---

## Part 4: Setup Checklist

Gumroad-style **dismissible** checklist — 5 steps, each with a done-state. Dismiss button hides it forever (per-user flag).

| # | Step | Done when | Action when not done |
|---|---|---|---|
| 1 | Custom App Branding | display_name + bio + avatar set | "Setup branding →" → `/dashboard/my-app` |
| 2 | First Content | `content_count` > 0 | "Add content +" → `/dashboard/my-app` |
| 3 | Bio Link Traffic | `view_count` > 0 | Share page button |
| 4 | First Fan | `fan_count` > 0 | "Share your page" |
| 5 | First Sale | `total_revenue` > 0 | "Share your page" |

Steps 1–3 are the original three from the old version; 4–5 added (first fan, first sale) per founder decision.

---

## Part 5: Funnel Strip (the Stan moment)

When data exists, a compact funnel: **Page views → Product views → Purchases → Conversion rate** for the selected period.

- Product views: content items viewed in the catalog feed
- Conversion rate: purchases ÷ product views
- Only rendered when at least one metric > 0 (a 0-data creator doesn't need a funnel)

---

## Part 6: Audience Snapshot (Patreon health)

| Metric | Shows |
|---|---|
| Fans | Total fans |
| New this period | Fans gained in the selected range |
| Cancelled | Subscriptions cancelled in the selected range |

One line summary style — not a full analytics page. Deep-dive lives elsewhere (future analytics screen, per `docs/HOW_IT_WORKS.md` roadmap).

---

## Part 7: Quick Actions

| Action | Behavior |
|---|---|
| Share page | Copy page link (custom domain if set, else `host/username`) |
| QR code | QR card of the page link (for real-life promo) |
| Edit My App | → `/dashboard/my-app` — the full-screen My App editor (guest-first, swipeable, tap-to-edit). **This replaces the old "View my fan page" quick action** — My App is now the one surface for both seeing and editing the fan shell (founder decision 2026-08-05; see `my-app.md` Part 1). Popping out to the real live `/{username}` still works via the "Deployed — view it live" link after a deploy, and via the share action |
| Install my fan app | **Optional.** Same install flow as a fan (`/[username]/manifest.json`) → installs their branded fan-shell PWA next to the Dashboard PWA → **2 apps on their phone** (Dashboard = workbench, fan app = what fans get). This is how creators dogfood their own app. See `fan-shell.md` |
| Add content | → `/dashboard/my-app` (opens the editor sheet with the Catalog tab — Part 1c mapping) |
| Messages | → `/dashboard/messages` — inbox for fan/guest conversations, replies happen here (see `messaging.md` Part 2) |

### Persistent sidebar actions

**My App** is the sidebar entry itself (alongside Overview · Network · Settings) — no separate "View my fan page" action anymore; the full-screen editor IS the fan shell view (founder decision 2026-08-05). **Install my fan app** and **Messages** stay as persistent sidebar actions — a creator can install their own app or open their inbox from anywhere in the dashboard. (Facebook "view my profile"-style access, minus the duplicate.)

---

## Part 8: Alerts

| Context | Alert |
|---|---|
| Mock | None (no real services) |
| Production | PayPal verification errors, missing payout details, tax form download notice (Gumroad-style) |

Alerts render as a dismissible banner above the stat cards.

---

## Part 9: Admin Variant

Admins see platform totals instead of personal stats:

- Stat cards: total revenue, total views, total installs, total fans, total creators
- Money section: platform revenue + top creators by revenue
- Activity feed: platform-wide events (any creator's sale/signup/install)
- Checklist, funnel, audience snapshot: **hidden** (not relevant to admins)
- Quick actions: unchanged (admins still have their own page)

---

## Part 10: Empty State (brand-new creator)

A brand-new creator (no content, no fans, no views) sees:

1. Welcome header
2. Stat cards — all 0
3. Setup checklist — steps 1–2 pulsing, rest gray
4. Share page + QR (so they can start driving traffic immediately)
5. Activity feed — empty message
6. No money section numbers, no funnel (hidden until data exists)

Goal: the page never feels broken at 0 — it always points at the next action.

---

## Part 11: Production Notes

| Piece | Mock | Production |
|---|---|---|
| Stats | `get_creator_stats` RPC (mock returns zeros until events recorded) | Real RPC over `creator_page_views`, `install_events`, `fan_purchases`, `subscriptions` tables |
| Sales events | Mock purchase records (`fan_purchases`) | PayPal webhook → `fan_purchases` rows |
| Install events | `install_count` RPC counter | `install_events` table incremented by fan app |
| Checklist dismissal | Per-user flag in mock auth user | `creator_settings` / user prefs column |
| Date-range filters | Client-side filter over mock data | Server-side date-bucketed analytics |
| Alerts | None | PayPal verification + payout readiness checks |
| Admin stats | `get_admin_stats` RPC | Real aggregation queries |

---

## Part 12: Decisions

| Topic | Status |
|---|---|
| #1 Stat cards + date-range filter (7/30/all, 30 default) | ✅ Decided — 5 cards, content stays lifetime |
| #2 Money section (balance + top-selling items) | ✅ Decided — Gumroad-style |
| #3 Live activity feed (merged events, last 10) | ✅ Decided |
| #4 Setup checklist — 5 steps, dismissible | ✅ Decided — 3 old + first fan + first sale |
| #5 Funnel strip (views → product views → purchases → conversion) | ✅ Decided — hidden at 0 data |
| #6 Audience snapshot (fans / new / cancelled) | ✅ Decided — one-line summary style |
| #7 Quick actions (share, QR, view page, add content) | ✅ Decided |
| #8 Alerts (mock: none / production: PayPal + tax) | ✅ Decided |
| #9 Admin variant | ✅ Decided — platform totals, checklist/funnel/audience hidden |
| #10 Empty state | ✅ Decided — always points at next action |
| #11 AI plain-language insights | ⏳ **Deferred** — lives in `ai/ai-features.md`, future phase |

---

## Part 13: Existing Code Reference

### LIVE (still working)

| Piece | What it does |
|---|---|
| `src/app/dashboard/page.tsx` | Naked skeleton — renders empty container |

### Backups (in `src/old-code/allScreens/dashboard-overview/` — old code, reference forever, do NOT delete)

| File | State | Reuse plan |
|---|---|---|
| `page-old.tsx` | Old full version (214 lines) | Reference only — rebuild per this spec; the old widget wiring (StatCard, FanStatsCard, QRCodeCard, FanExportButton) may be reused |

Plus in `src/old-code/` root: `AnalyticsWidgets.tsx` (StatCard), `FanStatsCard.tsx`, `CreatorManagementWidgets.tsx` (QRCodeCard, FanExportButton, SharePageButton).
