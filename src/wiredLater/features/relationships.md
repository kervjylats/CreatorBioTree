# My Peeps (Relationships) — Vision & Spec

## Concept

**"My Peeps"** (founder decision 2026-08-05 — the umbrella name for the relationships feature) — the anchored people hub in the Network page right rail. A creator sees everyone connected to their business: **partners/collabs, fans/clients, and staff** — each clickable into a shared person profile.

Built from competitor research (Stan Store Customers, Gumroad Sales, Patreon Relationship Manager, Teachable/Podia/Kajabi CRMs — see Part 8). Every competitor ships a fan/customer table; the rich ones add filters → saved segments → tags → per-person profile drawers. **Our differentiator: nobody merges chat history + purchase history per person** — we have messaging (`messaging.md`), so a fan profile shows purchases AND their conversations in one place.

Three relationship types, three spec homes:

| Type | Spec home |
|---|---|
| **Partners / collabs** | `network.md` — creator discovery, collabs, affiliates. The collab list lives there |
| **Fans / clients** | THIS FILE (Part 2 — the fan list, Part 3 — profile drawer) |
| **Staff (team)** | `team.md` — creator staff access, permission toggles, audit log. The team list lives there |

This spec defines the **umbrella hub (Part 1)**, the **fan/client list** (the gap), the **profile drawer** (shared by all three), and the **consent/privacy layer**. It does NOT duplicate collab, partnership, or team specs — it points at them.

**Wiring home: ✅ DECIDED (2026-08-05)** — My Peeps is the **anchored right rail of the Network page** (`network.md` top layout diagram). The 3 rows of the umbrella = Partners / Fans / Staffs. No own tab, no Overview section.

---

## Part 1: The Concept of "My Peeps"

**The right-rail umbrella.** Three rows, each with a live count. Tap a row → expands in the rail to that group's list; selecting someone opens their detail in the Network center column.

| Row | Shows (row + expanded list) | Clicking opens |
|---|---|---|
| **Partners** | Count of active partners (collabs + partnerships). Expanded: the collab list + partnership invites + "Invite a partner" button (`partnership.md`) | Collab detail (see `network.md`) |
| **Fans** | Count of fan accounts — **grouped: Fans (password) vs Followers (email-only)**. Expanded: the fan list (Part 2) — email, joined, status, LTV | Fan profile (Part 3) |
| **Staffs** | Count of team members. Expanded: the team list + "Invite member" (`team.md` Part 4) | Team member detail (see `team.md`) |

A person who is both a fan and a community member appears ONCE (matched by fan account), showing both badges.

**Why one umbrella:** creators think in people, not tables. Stan and Gumroad force per-transaction thinking; Patreon has separate member/sales views. One hub = less context-switching, and it's the natural home for the profile drawer (Part 3). The right-rail placement (instead of an own tab) keeps it always visible while the rest of Network does discovery.

---

## Part 2: The Fan List

The competitor floor (the table everyone ships) + escape hatch (CSV export).

### Table columns

| Column | Source | Notes |
|---|---|---|
| Email | `fan_accounts.email` | Always shown to the creator (Ko-fi pattern — email is always shared) |
| Joined | `fan_accounts.created_at` | Cohort-friendly |
| Referred by | `fan_accounts.referred_by` | Ties fans → collabs (`network.md`) — "which collab brought this fan?" |
| Status | derived | `follower` (email-only, no password) / `new` (no purchase) / `paid` (has purchase) / `subscriber` (active subscription) — Patreon-style status chip. A Follower = `fan_accounts` row with `password_hash = null`, no new table |
| Lifetime value | derived from `fan_purchases` | Sum of completed purchases (Patreon's Lifetime column) |
| Last purchase | derived | Date of most recent completed purchase — blank for `new` |

### Filters

Quick chips (Patreon-style): **All / New / Paid / Subscribers / Followers / Referred**. Plus a search box (email match). Full combinator filters (country, amount ranges, saved segments) are **deferred** (Part 7).

### CSV export

One button, respects current filter (Patreon/Stan pattern). Columns: email, joined, referred by, status, lifetime value, last purchase date, **do_not_contact flag** (Part 5). Filename `fans-YYYY-MM-DD.csv`.

**Mock:** the export endpoint exists today as `FanExportButton` (`src/old-code/CreatorManagementWidgets.tsx`) → `/api/creator/fans/export` — rebuilt per this spec at wiring (adds lifetime value + referred-by + consent flag columns).

### Existing code reference

- `src/old-code/FanStatsCard.tsx` — old modal table (email / joined / referred-by) — the seed of this list
- `src/old-code/CreatorManagementWidgets.tsx` — `FanExportButton` (CSV export, total-spent column added in Phase A bugfixes)
- `src/old-code/allScreens/dashboard-overview/page-old.tsx` — old wiring

---

## Part 3: The Profile Drawer (the differentiator)

Click any fan (or community member) → a drawer/side panel with their full relationship history. Stan has an Overview page, Patreon has a payment-history drawer, Podia has a profile — **none of them show chat history** because they don't have in-app chat. We do.

### Drawer sections

| Section | Shows |
|---|---|
| **Identity** | Email, joined date, referred-by, status chips (fan / subscriber / VIP / partner) |
| **Purchases** | Chronological list: item, amount, date, status (completed / refunded) — from `fan_purchases` |
| **Subscription** | Current plan, status, next renewal — if any |
| **Installs & activity** | PWA installs (`fan_installs`), last-seen (`fan_sessions`) — is this person actually using my app? |
| **Messages** | Conversation thread with this fan — **reuses `ChatShell`** from `messaging.md` Part 8. One-click "Message them" button. The differentiator |
| **Notes** | Creator-written free-text note per fan (Patreon's Notes column) — "met at LA event", "wants course 2" |
| **Actions** | Message · Export single · (production: grant/revoke access, refund — Stan/Patreon actions, mocked in v1) |

### What it's NOT

Not a fan-editable profile (fans have none in v1 — `fan-shell.md` Part 4d). This is creator-side only, read-only data + creator notes.

---

## Part 4: Referred-by / Source (connects fans → collabs)

`fan_accounts.referred_by` already exists. Surfaces:

- **Fan list column** — "Referred by @collab" per fan
- **Filter** — quick chip "Referred" → all fans brought in by collabs
- **Collab-facing tie-in** — `network.md` collab stats already track referred fans (`get_creator_partnership_stats` RPC, fans_referred)

This is the cohort answer to "is my collab network actually driving fans?" — cheap, already in the data model, no new tables.

---

## Part 5: Consent & Privacy (non-negotiable, competitor-standard)

| Control | Behavior |
|---|---|
| **"Do not contact" flag** | Per-fan, set from the profile drawer. CSV export includes it. Honored everywhere (Gumroad's literal column). In mock: stored flag. **Applies to Followers (email-only) too** — they're `fan_accounts` rows like any fan |
| **Email opt-out** | Fans can opt out of sharing email with creators (Patreon pattern) → creator sees "Hidden — fan opted out" instead of the address. v1 note: fan-shell has no such toggle yet — parked with fan profile, flag exists in the model |
| **GDPR removal** | Fan requests removal → fan row anonymized/hidden from creator lists (production note; mock: no-op) |
| **Imports** | We do NOT import fan lists (Beacons does with ICANN consent) — fans come from real engagement only. No import surface |

**Mock:** flags stored on `fan_accounts`; no real enforcement needed until production.

---

## Part 6: Data Model & API Routes

### Data model (additions)

| Field/Table | Where | Notes |
|---|---|---|
| `do_not_contact` | `fan_accounts` (new column) | Part 5 flag |
| `notes` | `fan_accounts` (new column) | Part 3 creator note (single string in v1; multiple notes = deferred) |
| `last_seen_at` | `fan_accounts` (new column) | Derived from `fan_sessions` at read time or written on session |

No new tables in v1 — everything derives from `fan_accounts` + `fan_purchases` + `subscriptions` + `fan_installs` + `fan_sessions` + `conversations`.

### API routes

| Route | Purpose |
|---|---|
| `GET /api/creator/fans` | Fan list (search + quick filters) |
| `GET /api/creator/fans/[id]` | Fan profile (purchases, subscription, installs, last-seen) |
| `PATCH /api/creator/fans/[id]` | Update `do_not_contact`, `notes` |
| `GET /api/creator/fans/export` | CSV export (respects filters) — exists, extend columns |
| `GET /api/creator/relationships` | My Peeps umbrella: partners/fans/staffs counts + lists (Part 1) |

Auth: creator-only (`mock_auth_uid` / Supabase) — fans never see this data.

---

## Part 7: Deferred Features (end of development)

| Feature | Notes |
|---|---|
| **Tags & saved segments** | The Patreon/Teachable escalation: combinable filters, saved sets, tags as organizing primitive. Not v1 |
| **MRR per fan** | Podia's per-contact revenue card — v2 analytics |
| **Per-product progress** | Kajabi's course-completion view inside the profile — ties to course items |
| **Multiple notes / note history** | v1 = one note string |
| **Grant/revoke access, refunds from drawer** | Production-ready actions; mocked in v1 |
| **Fan email opt-out UI (fan side)** | Parked with fan profile (`fan-shell.md` #9) — flag exists, toggle comes later |
| **LTV breakdown by period** | v1 = lifetime total only |

---

## Part 8: Competitor Research (synthesis, full report in session notes)

| Platform | List | Beyond the list |
|---|---|---|
| Stan Store | Customers tab, filters, bulk delete/grant | Per-customer Overview (subscriptions, cancel/pause); CSV import/export. No tags/segments/LTV |
| Gumroad | Sales = customer list (purchases model), CSV 72 columns | "Do not contact?" flag. No profiles/notes |
| Patreon | Relationship Manager: customizable columns, LTV, notes, saved filters, bulk DM | Side drawer with payment history + refunds; benefit-eligibility matrix; email opt-out |
| Podia / Teachable / Kajabi | Contacts/Users tables: filters → segments → tags, CSV | Contact profile: LTV, MRR, invoices, last login, per-product progress, notes |
| Ko-fi | Payments list, CSV tax export | Nothing — email always shared, name can be anonymized |
| Beacons | Audience Manager: fan profiles, custom fields, purchase history, CSV | Opt-in confirmation on import (ICANN) |

**The 4 universal patterns:** (1) the table, (2) CSV export, (3) filters → segments → tags, (4) per-person profile drawer with history + actions.

**Our wedge:** pattern 4 with **message history included** — nobody else has chat, so nobody's profile drawer shows the relationship's conversations.

---

## Part 9: Decisions

| Topic | Status |
|---|---|
| #1 File structure | ✅ Decided — ONE umbrella spec; collabs stay in `network.md`, community stays in `messaging.md` Part 3, staff stays in `team.md` (founder decision 2026-08-04) |
| #2 Hub concept ("My Peeps") | ✅ Decided 2026-08-05 — the umbrella is **My Peeps**: 3 rows (Partners / Fans / Staffs) in an expandable table, no one-search box |
| #3 Fan list | ✅ Decided — table (email/joined/referred-by/status/LTV/last-purchase) + quick filters + CSV export (competitor floor) |
| #4 Profile drawer | ✅ Decided — purchases, subscription, installs/activity, MESSAGES (ChatShell reuse), notes, actions. The differentiator |
| #5 Referred-by | ✅ Decided — column + filter + tie-in to collab stats (data exists) |
| #6 Consent | ✅ Decided — do-not-contact flag, email opt-out (flag exists, fan toggle parked), GDPR note, no imports |
| #7 Deferred | ✅ Decided — tags/segments, MRR-per-fan, product progress, multi-notes, access-grant/refund actions, fan opt-out UI |
| #8 Wiring home | ✅ **Decided 2026-08-05 — Network page, right rail, anchored (Layout B).** My Peeps = Partners / Fans / Staffs rows. Team → Staffs row (`team.md`), Partnership → Partners row (`partnership.md`). NOT an own tab, NOT Overview |
