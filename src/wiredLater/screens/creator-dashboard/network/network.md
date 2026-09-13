# Network Screen — Vision & Spec

## Concept
The Network is a creator discovery engine + collab hub + people hub. Creators can find each other, advertise themselves, form business relationships, and manage everyone connected to their business.

> **Terminology (founder decision 2026-08-04):** in-app creator↔creator relationships are **collabs**. Relationships created by inviting someone from OUTSIDE the app via a link are **partnerships** — see `partnership.md`. One shared `partnerships` table, `source: "collab" | "invited"` records the entry point.

## Page Layout (DECIDED 2026-08-05 — Layout B, anchored)

The Network page is **3 sections, no tabs** (founder decision — tabs rejected):

```
┌──────────────────────────────────────────────────────┐
│  [Page header / welcome line]                        │
├───────────────┬──────────────┬───────────────────────┤
│  LEFT RAIL    │   CENTER     │  RIGHT RAIL (anchored)│
│  • Discover   │  Detail of   │  MY PEEPS             │
│  • Affiliates │  selected    │  ┌─────────────────┐  │
│               │  row         │  │ Partners    12  │  │
│               │              │  ├─────────────────┤  │
│               │              │  │ Fans       847  │  │
│               │              │  ├─────────────────┤  │
│               │              │  │ Staffs       2  │  │
│               │              │  └─────────────────┘  │
└───────────────┴──────────────┴───────────────────────┘
```

- **Right rail = "My Peeps"** — the anchored umbrella (see `relationships.md`): 3 rows (Partners / Fans / Staffs), each with a count. Tap a row → expands to that group's list (Partners → collab list + partnership invites; Fans → fan list; Staffs → team list). Selections open their detail in the center column
- **Left rail** = the Network tools: **Discover** (search + billboard) and **Affiliates** (My Earnings / Discover / My Links)
- **Center** = detail view of whatever is selected (collab detail, fan profile drawer, team member, affiliate page)
- **Mobile** = stacks vertically: My Peeps anchored at top, then Discover, then Affiliates

**Wiring homes (DECIDED 2026-08-05):** Relationships (My Peeps) → Network page right rail. Team → My Peeps → Staffs row. Partnership invites → My Peeps → Partners row (plus the invite button in Discover). All three spec files have their wiring home notes updated to match.

---

## Features

### 1. Creator Search Engine
- Search by display name and Link Address (user-facing copy; code/docs keep `username` — permanent, set once at signup, see `onboarding.md`)
- Filter by tags (up to 3 from billboard)
- Only discoverable creators appear
- Featured creators float to top
- Results in a grid of BillboardCards

### 2. Billboard (Creator Discovery Card)
Each creator can write a mini billboard:
- **Tagline** — max 60 chars, one-liner pitch
- **Tags** — up to 3 topic keywords
- **Collab style** — what kind of collab they want (free-text)

Billboard appears on the search result card and on the creator's own Network settings.

### 3. Visibility Switch
- ON = visible in search, can browse other creators
- OFF = invisible to everyone, cannot browse/search the Network
- Stored in `creators.is_discoverable`

### 4. Collab Flow
Simple friend-request style:
- Creator A sends a request to Creator B — no commission, no deal, no notes required
- Creator B gets the request and can Accept or Decline
- Once accepted, they are **connected** as collabs
- Agreements (deals/splits/commission) are **optional and done later** inside the collab

### 5. Creator Chat ✅ DECIDED (see `messaging.md`)

**Fully free, WhatsApp-style messaging between creators — before AND after collabbing:**
- A **chat icon appears next to every creator's name** in search results, creator cards, and the collab list → quick mini chat box + "open full"
- Works without any collab (just a fan-account or creator account)
- After collabbing, the chat stays (persistent) — collab detail view links straight into the conversation
- Simple message history, fetch + post (no real-time needed for mock; Supabase Realtime in production)
- Same engine as fan messaging — one spec: **`messaging.md`** (floating inbox, 1-on-1s, group chats, files, block/mute, "allow anyone" toggle)
- **Full spec lives in `messaging.md` — this section points there, no duplication.**

### 6. Deal Maker *(future, optional)*
- Inside a connected collab, creators can open a deal modal
- Agree on commission splits, revenue share, terms
- All optional — collabs can stay connected with no deal
- *(2026-08-05: affiliate deals supersede this as the money mechanism — see §7. Deal Maker stays as a parked future concept.)*

### 7. Affiliates (extends collabs) — the UI view

Collabs can optionally promote each other's products under ANY deal the two creators agree to. Think: "I'll share your course with my audience and earn 10%." Or: "Just cross-promo, no money." Or: "$5 per sale." Or: "Tiered 5% then 10%."

> **Cross-ref:** this section is the **UI/wiring view**. The **economics live in `monetization/creators.md` Part 2** (5 deal types × 2 scopes × 6 triggers, asymmetric deals, no min/max validation, immutable audit log, server-side attribution, Deal Rules & Settlement Engine — PayPal splits or manual settlement — dispute resolution, fan invisibility). The creator-side list of fans/clients (with referred-by + source) lives in `relationships.md` — this spec covers collabs + affiliate UI, NOT fans. Collab stats already track referred fans (`fans_referred` via `get_creator_partnership_stats`).

**Flow:**
1. Two creators are connected as collabs (step 4 above)
2. Creator A configures a deal for a collab — choosing **scope** (per-item or per-creator), **deal type** (percentage / fixed / free / tiered / custom), **trigger** (purchase / follow / subscribe / tip / signup / any), and the terms. The deal is A's own row — asymmetric (B configures their own deals independently, no forced pairing)
3. Creator B discovers Creator A's deal in the Affiliates tab → reads the terms → generates an affiliate link if they accept
4. Creator B shares the link → the fan action happens (per the trigger) → the platform **evaluates the deal rules + settles automatically** (PayPal split) or flags the cut as pending for manual settlement (PayPal.me) + logs the conversion immutably (Deal Rules & Settlement Engine — `creators.md` 2e2)

**Affiliates (left rail section):**
```
┌──────────────────────────────────────────┐
│  [My Earnings]  [Discover]  [My Links]   │
└──────────────────────────────────────────┘
```

**My Earnings:** total earned, pending/available/payout, transaction log (downloadable CSV)
**Discover:** browse your collabs' deals with affiliate deals enabled, filter by category/deal type/scope, "Get Affiliate Link" button (only available if the deal terms are acceptable to you — no silent sign-ups)
**My Links:** all your affiliate links, per-link stats (clicks, conversions, revenue), deactivate toggle

**For the product owner — deal config (two surfaces, rule-builder style):**
- **Per-item deals:** each catalog item has an "Affiliate" section in its editor:
  - Enable toggle + deal type dropdown: Percentage (0-100%) / Fixed amount ($) / Free cross-promo (0%) / Tiered / Custom
  - Fields per type: rate, fixed amount, tier rules, custom-terms textarea
  - **Trigger** dropdown: Purchase (default) / Follow / Subscribe / Tip / Signup / Any
  - Optional: deal valid_from / valid_until range; optional max affiliates (default unlimited)
  - Scope is fixed to `item` — this deal covers exactly this item
- **Per-creator deals:** in the collab detail (My Peeps → Partners → collab detail):
  - Same fields as above, plus a **scope selector: "This item" (pick one) vs "My whole catalog"** — per-creator deals target everything the creator sells
  - One collab can carry multiple deals (several per-item + one per-creator); per-item wins on a sale when both exist
- **No-payout-rail warning (2026-08-10):** items using **external-link payment** (PayPal.me / Stripe Payment Link / Gumroad — `my-app.md` Catalog "Payment handling" + `creators.md` Part 1c) are **quarantined from affiliate deals** — the platform can't see or split off-platform transactions. The editor shows an amber note on the item row ("Pays off-platform — excluded from deals") and the deal rule builder blocks/warns when a selected item is external-link. No silent partial sums — a deal covers only in-app-processed items.

**Asymmetry (2026-08-05):** each side's deals are THEIR OWN rows. A configures "10% on my course" for B; B configures "free cross-promo" for A — or nothing at all. No shared deal object, no echo. Money flows from the deal's owner to the promoter per conversion.

**Fan experience:** Invisible — fan buys/acts normally, `ref` param logged behind the scenes (server-side attribution, survives cookie clearing — `monetization/creators.md` Part 2e). No affiliate labels anywhere on the fan shell.

**Platform take rate in v1: 0%.** Creators keep 100% of their sales. The platform's value-add is the trust layer (audit log + automatic attribution + settlement engine + dispute resolution), not a cut. See `monetization/creators.md` Part 2 for the full picture + `monetization/owner.md` for the platform's own money.

---

## Component Concepts

### VisibilitySwitch
- Switch with label "Show me in collab search?" + helper text
- States: checked/unchecked, disabled while saving
- Saves instantly on toggle (not form-submit)

### BillboardEditor
- Tagline: Input, max 60 chars with live counter
- Tags: 3 Input fields side by side, filter empty before save
- Collab style: Textarea (2 rows), free-text
- Save button (not auto-save)
- States: loading (fetching current values), saving (save button disabled), error (silent)

### BillboardCard
- Shows avatar, display name, link address, tagline, tags (as chips), collab style
- "Featured" badge for featured creators
- "Send Request" button sends a simple friend-style collab request
- Hover effect on card border
- Uses Avatar component from shadcn

### CreatorSearch
- Search Input + optional tag filter Select dropdown
- Fetches discoverable creators from Supabase: `creators` table, `is_discoverable=true`, ordered by `is_featured` desc then `created_at` desc
- Client-side tag filtering after fetch
- Loading state: "Searching…", Empty state: "No creators match your search" / "No discoverable creators yet"
- Results in 2-column grid (responsive)

### FriendRequest (simple)
- No commission, no deal, no notes
- Just a confirm button: "Send collab request to @link-address?"
- Cancel + Send buttons
- Sends POST to `/api/creator/partners/request`
- States: idle, sending (disabled buttons), sent (closes modal)

### Inbox
- Incoming requests → Accept or Decline buttons (no commission input)
- Outgoing requests → Shows "Pending" status
- Empty state: "No collab requests yet"
- Each request shows: avatar, display name, tagline

### CollabList
- Shows only connected (active) collabs
- Each collab shows: avatar, display name, "Since {date}" joined date
- "Collab" badge (green)
- Clicking a collab → opens collab detail view (chat, deal maker, activity)
- Empty state: dashed border card with "No collabs yet" + subtext

### Chat ✅ (decided — spec in `messaging.md`)
- Simple message list per collab (reuses the shared messaging thread view)
- **Chat icon next to collab names** anywhere in Network (list, cards, search) → quick mini chat box + "open full"
- No real-time for mock — just fetch + post messages (Supabase Realtime in production)
- Shows the collab's avatar + name as header
- Empty state: "Start a conversation"

### DealMaker *(future)*
- Accessed from collab detail view
- Commission % input, notes, terms
- Both partners must agree/accept
- Deep dive later — affiliate deals (§7) are the active money mechanism

### AffiliateDealForm
- Scope selector: **Per-item** (item picker — the catalog item this deal covers) vs **Per-creator** (whole catalog)
- Deal type dropdown: Percentage (0-100%) / Fixed amount ($) / Free cross-promo (0%) / Tiered / Custom
- **Trigger** dropdown: Purchase / Follow / Subscribe / Tip / Signup / Any
- Fields per type: rate, fixed amount, tier rules, custom-terms textarea
- Optional valid_from / valid_until date range; optional max affiliates
- NO min/max validation on rate/amount — any values the creators agree to
- Saves as the creator's OWN `affiliate_deals` row (asymmetric — no echo to the other side)
- States: loading, saving, error (silent)

### NetworkSettings
- Composes VisibilitySwitch + BillboardEditor
- Loads current creator settings from Supabase (`is_discoverable`, `tagline`, `tags`, `collab_style`)
- Save saves billboard fields; toggle saves immediately
- Loading state while fetching settings

### MyPeeps (right rail — see `relationships.md`)
- The anchored umbrella: 3 rows — **Partners** (count), **Fans** (count), **Staffs** (count)
- Tap a row → expands in the rail to that group's list; selection opens detail in the center column
- Partners row = collab list + partnership invites + "Invite a partner" button (`partnership.md`)
- Fans row = the fan list (`relationships.md` Part 2)
- Staffs row = the team list (`team.md` Part 4)

### NetworkPage (main page) — layout DECIDED
- Page heading + subtitle
- 3-section anchored layout: LEFT rail (Discover + Affiliates) / CENTER detail / RIGHT rail (My Peeps) — see the layout diagram at the top
- Mobile: stacks vertically (My Peeps first, anchored)

---

## Data Model

| Field | Table | Type | Notes |
|---|---|---|---|
| `is_discoverable` | `creators` | boolean | Exists |
| `tags` | `creators` | string[] | Exists |
| `tagline` | `creators` | string? | Need to add to Creator type |
| `collab_style` | `creators` | string? | Need to add to Creator type |
| `commission_pct` | `partnerships` | number | Exists (optional — set in DealMaker) |
| `notes` | `partnerships` | string? | Exists |
| `status` | `partnerships` | enum | pending / active / declined / ended |
| `source` | `partnerships` | enum | `invited` / `collab` — NEW (2026-08-04), records the entry point (`partnership.md`) |
| `scope` | `affiliate_deals` | enum | `item` / `creator` — NEW (2026-08-05) |
| `trigger` | `affiliate_deals` | enum | `purchase` / `follow` / `subscribe` / `tip` / `signup` / `any` — NEW (2026-08-05) |
| `affiliate_enabled` | `content_items` | boolean | New — toggle per item |
| `affiliate_rate` | `content_items` | number | New — commission % |
| `affiliate_links` | *(new table)* | — | `creator_id`, `item_id`, `commission_rate`, `clicks`, `conversions`, `revenue`, `is_active` |

Full affiliate data model (the immutable ledger): `monetization/creators.md` Part 2f (`affiliate_deals` / `affiliate_attributions` / `affiliate_conversions`).

## API Routes Needed

| Route | Method | Purpose |
|---|---|---|
| `/api/creator/partners/request` | POST | Send simple collab request |
| `/api/creator/partners/respond` | POST | Accept/decline/cancel request |
| `/api/creator/partners/list` | GET | Get my collabs |
| `/api/creator/partners/discoverable` | GET | Get discoverable creators |
| `/api/creator/partners/billboard` | GET/PUT | Get/save billboard settings |
| `/api/chat/*` *(all creator↔creator chat)* | — | Shared messaging API — see `messaging.md` (Part 7). No separate per-collab chat route |
| `/api/creator/partners/deal` | POST | Create/update deal agreement *(future — superseded by affiliates in v1)* |
| `/api/creator/affiliates/deals` | GET/POST | List/create MY affiliate deals (owner side; scope + trigger + type + terms) |
| `/api/creator/affiliates/deals/[id]` | PATCH/DELETE | Edit/pause/revoke a deal |
| `/api/creator/affiliates/earnings` | GET | Earnings summary |
| `/api/creator/affiliates/discover` | GET | Browse affiliate-eligible deals |
| `/api/creator/affiliates/link` | POST | Generate affiliate link |
| `/api/creator/affiliates/links` | GET | List your affiliate links |
| `/api/creator/affiliates/links/[id]` | PATCH | Activate/deactivate link |

---

## Component Tree *(layout DECIDED 2026-08-05 — 3-section anchored)*
```
NetworkPage
├── MyPeeps (RIGHT RAIL — anchored)
│   ├── PartnersRow
│   │   ├── CollabList
│   │   │   └── CollabDetail (CENTER when opened)
│   │   └── PartnershipInviteCard (partnership.md)
│   ├── FansRow → FanList (relationships.md Part 2)
│   └── StaffsRow → TeamList (team.md Part 4)
├── LEFT RAIL
│   ├── Discover
│   │   ├── NetworkSettings
│   │   │   ├── VisibilitySwitch
│   │   │   └── BillboardEditor
│   │   ├── CreatorSearch
│   │   │   ├── SearchInput
│   │   │   └── BillboardCard[]
│   │   └── Inbox
│   │       ├── IncomingRequest[]
│   │       └── OutgoingRequest[]
│   └── Affiliates
│       ├── AffiliateDealForm (scope + trigger + type + terms)
│       ├── EarningsSummary
│       ├── AffiliateDiscover
│       └── AffiliateLinks
└── CENTER
    └── Detail view of selected row (collab / fan / team member / affiliate page)
```

---

## Deferred Features (end of development)

| Feature | Notes |
|---------|-------|
| **Chat/messaging** | Spec'd above — implement when building from this spec |
| **Deal Maker** | Parked — affiliate deals (§7) are the active money mechanism in v1 |
| **Billboard interactivity** | Parked — user will return with specific ideas |
| **My App Connection** | How Network links to My App — TBD |
| **External brand affiliates** | Self-serve brand deals (Beacon-style 12K network) — v2 |
| **Auto-DM for affiliates** | Auto-notify affiliates when their link converts |
