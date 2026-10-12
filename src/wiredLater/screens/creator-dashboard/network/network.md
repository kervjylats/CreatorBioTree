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

- **Right rail = "My Peeps"** — the anchored umbrella (see `relationships.md`): 3 rows (Partners / Fans / Staffs), each with a count. Tap a row → expands to that group's list (Partners → collab list + partnership invites; Fans → fan list; Staffs → staff list). Selections open their detail in the center column
- **Left rail** = the **billboard mirror** only (design editing lives in Playground → Billboard view; the whole **Affiliates block moved to the Earnings screen 2026-10-12** — Network = social, Earnings = money)
- **Center** = detail view of whatever is selected (collab detail, fan profile drawer, staff member, affiliate page) — today's hub renders **Discover** here (search box + result cards + the one collab-switch card)
- **Mobile** = stacks vertically: Discover first, then the billboard mirror

**Wiring homes (DECIDED 2026-08-05):** Relationships (My Peeps) → Network page right rail. Staff → My Peeps → Staffs row. Partnership invites → My Peeps → Partners row (plus the invite button in Discover). All three spec files have their wiring home notes updated to match.

---

## Features

### 1. Creator Search Engine
- Search by display name and Link Address (user-facing copy; code/docs keep `username` — permanent, set once at signup, see `onboarding.md`)
- Filter by tags (up to 3 from billboard)
- **All creators appear** — search is a full directory, always on (FB-style, founder 2026-10-09; no hidden-creator filter)
- Featured creators float to top
- Results in a grid of BillboardCards
- **Live note (2026-09-26 hub rebuild):** search + Discover cards live in the **CENTER** column; the left rail holds the Billboard mirror (the layout diagram above predates this — full relayout pending the full-file review). **2026-10-12:** the affiliate block left the rail too → the Earnings screen (§2b) — the rail is billboard-only now.

**Two views in the Discover section (founder decision 2026-10-07; model revised 2026-10-09 — FB-style):**

| View | Pool (who appears) | Behavior |
|---|---|---|
| **Collab list** — default, before typing | `open_to_collab` ON only (willing collaborators) | Appears immediately — **shuffled every load** (Featured pinned first, rest Fisher–Yates — same pattern as the landing marquee). Never a blank box |
| **Search results** — while typing | **every creator** — collab switch ignored (find anyone by name even if they're closed to collabs) | Typo-tolerant exact → approximate match (engine: `search.md` Part 3). Replaces the list while typing; clearing the box brings the list back |

- The split is deliberate: the list answers *"who wants to collab?"* (browse), search answers *"find this specific person"* (targeted, FB-style directory)
- **Search is ALWAYS on — no greying, ever** (founder 2026-10-09): the old `show_in_search` switch + mutual blind rule are **removed**; a closed creator is still findable, their card just shows the disabled **"Not open to collabs"** button (line below) — profile visible, request blocked
- Clicking any card (either view) opens the **billboard modal** — `CreatorBillboardModal` in Component Concepts
- Search-result cards whose target has `open_to_collab` OFF show a disabled **"Not open to collabs"** button instead of Connect — closed sign, not error-after-click
- **Batching for scale (founder 2026-10-09 — "thinking big"):** both views render **batches of 24** with a **Show more** button (next 24; batches reset on every query change). The collab list **reshuffles on every Network visit/refresh** AND on demand via a **⇄ Shuffle button** (icon + label, **directly above the card list — below the switch card**, placement fixed by founder 2026-10-09; default feed only — typed search is ranked, not shuffled, so the button hides while typing; hidden while the list is loading/empty). Featured pinned first (max ~4 so they never dominate)
- **Production note (scale):** today's pattern (server sends the full willing set → client shuffles → slices batches) is dev/small-scale only. At growth: real mode switches to **server-side random batches** (`ORDER BY random() LIMIT 24`, separate featured query) with keyset/`not.in(seen ids)` paging — the full-download pattern never ships (same for typed search: server `LIMIT` + offset)

### 2. Billboard (Creator Discovery Card)
Each creator can write a mini billboard:
- **Tagline** — max 60 chars, one-liner pitch
- **Tags** — up to 3 topic keywords
- **Collab style** — what kind of collab they want (free-text)

Billboard appears on the search result card and as a mirror in the creator's own Network rail. **Editing home moved to Playground → Billboard view (founder decision 2026-10-09 — `playground.md` Part 1d)** — the full field set (tagline, tags, collab style, **bio, rate card, media kit**) is edited there; Network shows the result (rail mirror) + the collab switch (inside the Discover section) only.

### 3. Collab Switch (Discover section, instant-save — one switch since 2026-10-09)
- **2026-10-09 (two rounds):** morning — extracted from `BillboardEditor` (design fields moved to Playground → Billboard view, `playground.md` Part 1d) and moved rail → its own card **inside the Discover section** (under the heading, above the results). Afternoon — founder simplified to the **FB model: `show_in_search` is REMOVED** (search always on, no greying, everyone findable by name); the one switch that remains is **Accept collab requests**
- **Accept collab requests** — ON = you appear in the default collab feed AND anyone can send you a Connect request; OFF = you drop out of the collab feed + `POST /api/creator/partners/request` returns 403 ("This creator isn't accepting collab requests.") + your card elsewhere shows the disabled **"Not open to collabs"**. Typed search still finds you either way
- Stored in `creators.open_to_collab` (boolean, default true). **`creators.show_in_search` is PARKED** (column kept, default true, zero UI/logic reads — candidate for a future Settings "private mode")
- The BillboardPreview card's pill is a **status badge only** (no click) mirroring this switch — label **"Open to collabs / Closed to collabs"** (relabelled 2026-10-09 with the switch removal; "In search/Hidden" would be permanently true) — one toggle home: the Discover switch card
- **✏️ profile gateway on BillboardPreview (founder decision 2026-10-09):** a small pencil beside the card's name/@handle → `ProfileEditDialog` ("changes apply everywhere immediately · once every 7 days") → **[Open Settings]** → Settings → Profile (`settings.md` Part 13 — the one edit home for display name + avatar). **Not** the same as the card's *header* ✏️ (next to the "My Billboard" title — design → Playground → Billboard view, direct jump, no dialog). Two pencils, two rows: header = design, name row = identity

**Discover rules (founder decisions 2026-10-07; revised 2026-10-09):**

- **No cooldown, no confirmation** — flips are instant and unlimited (TikTok profile-views precedent; a privacy control must not carry friction). Any abuse concern is a backend rate-limit matter, never a UI one
- **No greying, ever** (2026-10-09): the search box + collab list never disable, no banner, no [Turn on] — turning the collab switch OFF only affects (a) your presence in the default collab feed and (b) whether people can Connect with you. Your own browsing is untouched
- **OFF-state note above the feed** (founder "yes to both" 2026-10-09): when the switch is OFF, a single subtle muted line renders above the default collab list — *"You're not in this list while \"Accept collab requests\" is off."* — **informational only**: no box, no border, list stays fully visible and browsable (your settings never hide the world from you — the FB/LinkedIn rule). Typed-search view gets no note (search results aren't "the list")
- **Billboard nudge (prompt):** fires on the **first Network visit while the billboard is still undesigned** (per creator, persisted flag — localStorage `billboard_nudge_seen_*` for v1; production note: move to a `creators` column if cross-device consistency is wanted; trigger retargeted 2026-10-09 from the deleted search-switch flip): a modal appears — *"🎉 Design your billboard (~2 min) — tagline, tags, and collab style are what make creators hit Connect"* → **[Design my billboard]** (jumps to Playground → Billboard view, `/dashboard/playground?view=billboard`) / **[Maybe later]** (dismisses, never shows again). Optional forever — same non-forcing philosophy as Playground for fans. The permanent edit door is the **✏️ pencil in the My Billboard card header** — always visible, one click → Playground → Billboard view. No nagging
- **Undesigned-billboard standard:** empty fields render a plain clean card (avatar + display name + @handle only) — no fake default tagline, no placeholder pitch. Plain-but-clean beats fake (same philosophy as the fan shell's smart empty stacks + Minimal preset). **Confirmed 2026-10-09 — also the default in the Playground Billboard result-preview**

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

> **Cross-ref:** this section is the **UI/wiring view**. The **economics live in `monetization/creators.md` Part 2** (5 deal types × **creator-only scope (2026-10-10)** × 6 triggers, asymmetric deals, no min/max validation, immutable audit log, server-side attribution, Deal Rules & Settlement Engine — PayPal splits or manual settlement — dispute resolution, fan invisibility). The creator-side list of fans/clients (with referred-by + source) lives in `relationships.md` — this spec covers collabs + affiliate UI, NOT fans. Collab stats already track referred fans (`fans_referred` via `get_creator_partnership_stats`). **The money screen (earnings, receipt rows, Red Card) moved to `screens/creator-dashboard/earnings/earnings.md` (2026-10-10).**

**Flow:**
1. Two creators are connected as collabs (step 4 above)
2. Creator A configures a deal for a collab — choosing **deal type** (percentage / fixed / free / tiered / custom), **trigger** (purchase / follow / subscribe / tip / signup / any), and the terms. **Scope is creator-only since 2026-10-10** — the deal covers A's whole catalog (no item picker; `creators.md` 2b). The deal is A's own row — asymmetric (B configures their own deals independently, no forced pairing)
3. Creator B discovers Creator A's deal in the **Earnings screen's Affiliate deals block (§2b)** → reads the terms → generates an affiliate link if they accept
4. Creator B shares the link **or a fan simply opens B's partner surface (the in-app hop)** → the fan action happens (per the trigger) → the platform **evaluates the deal rules** and writes the conversion as a pending debt; settlement runs through the **receipt protocol + prompt ladder + Red Card** on the **Earnings screen** (`earnings.md` Parts 3–5; `creators.md` 2e2)

> **Live in mock since 2026-10-09 (attribution + conversion writer):** step 3's link serves `GET /ref/[code]` — click counted, `affiliate_attributions` row + a 30-day `aff_attr` handoff cookie, redirect to the **deal owner's** fan page (not the link creator's — the product lives with the owner). Step 4 runs in `POST /api/fan/purchases/complete` → `lib/affiliateAttribution.ts`: deal rules (status / validity window / creator-only scope / trigger) → `computeDealCuts` → immutable `affiliate_conversions` row, `pending` until settled — idempotent per sale + deal (a replayed purchase heals a missed row; no cookie = no conversion). **Door 2 (the in-app hop) + the settlement marking action are SPEC'D 2026-10-10** (`creators.md` 2e/2e2 + `earnings.md`) — wiring = Sheet 23. Still open: the `?ref=` param passthrough (cookie-only today), follow/subscribe/signup trigger writers, and the real PayPal webhook (route is mock-only).

**The affiliate UI MOVED → the Earnings screen (2026-10-12, founder "A1" — one money home):** the whole rail block — `＋ New deal` → `YourDealsCard` → `AffiliateDiscover` → `AffiliateLinks` — now renders as **§2b** of `/dashboard/earnings` (`earnings.md`; components `git mv`'d to `components/earnings/`). Network keeps **only the billboard mirror** + the Discover center (billboard + discover = the social screen). Deal *creation* behavior is unchanged (relocation only) — the parked deals-overhaul batch (creation in Circle Partners, chat-negotiated cards, partners-only, cancel-future-only) will pick the form up again later.

**Discover (§2b on Earnings):** browse other creators' open deals, "Create link" button (only available if the deal terms are acceptable to you — no silent sign-ups)
**My Links (§2b on Earnings):** all your affiliate links, per-link stats (clicks, conversions, revenue), deactivate toggle

**Deal config (one surface, rule-builder style — simplified 2026-10-10):**
- **The deal form** (`＋ New deal` in the Earnings §2b block — `AffiliateDealForm`, `git mv`'d from `components/network/` 2026-10-12):
  - Collaborator (@username, resolved via the search engine) · deal type dropdown: Percentage (0-100%) / Fixed amount ($) / Free cross-promo (0%) / Tiered / Custom
  - Fields per type: rate, fixed amount, tier rules, custom-terms textarea
  - **Trigger** dropdown: Purchase (default) / Follow / Subscribe / Tip / Signup / Any
  - Optional: deal valid_from / valid_until range; optional max affiliates (default unlimited)
  - **No scope selector** — creator-only since 2026-10-10 (the deal covers your whole catalog; `creators.md` 2b). The old per-item surface (an "Affiliate" section in each catalog item's editor) and its external-link warning are **removed with the item picker**
- **In a collab detail** the same form can open (same fields, same rules — one form component)

**Asymmetry (2026-08-05):** each side's deals are THEIR OWN rows. A configures "10% on my course" for B; B configures "free cross-promo" for A — or nothing at all. No shared deal object, no echo. Money flows from the deal's owner to the promoter per conversion.

**Fan experience:** Invisible — fan buys/acts normally; attribution is written behind the scenes by either door (`/ref` click or the in-app hop — server-side, `monetization/creators.md` Part 2e). No affiliate labels anywhere on the fan shell.

**Platform take rate in v1: 0%.** Creators keep 100% of their sales. The platform's value-add is the trust layer (audit log + automatic attribution + settlement engine + dispute resolution), not a cut. See `monetization/creators.md` Part 2 for the full picture + `monetization/owner.md` for the platform's own money.

---

## Component Concepts

### VisibilitySwitch
- Switch labeled **"Accept collab requests"** (the only switch since 2026-10-09 — "Show me in search" removed)
- States: checked/unchecked, disabled while saving
- Saves instantly on toggle (not form-submit)
- **Own card inside the Discover section since 2026-10-09** (extracted from `BillboardEditor` — the design fields moved to Playground; position moved rail → under the DISCOVER heading the same day, founder: it gates this section so it lives with it)

### BillboardEditor *(moved — 2026-10-09)*
- **Editing now lives in Playground → Billboard view** (`playground.md` Part 1d, founder decision 2026-10-09): result-preview + full field set (tagline, tags, collab style, bio, rate card, media kit) + Save-button states — all specced there; component home becomes `components/playground/`
- Network keeps only the collab switch (§3, its own card in Discover)

### BillboardCard
- Shows avatar, display name, link address, tagline, tags (as chips), collab style
- "Featured" badge for featured creators
- "Send Request" button sends a simple friend-style collab request
- Hover effect on card border
- Uses Avatar component from shadcn

### CreatorSearch
- Search Input + optional tag filter Select dropdown
- **Default (empty box):** renders the **collab list** — `open_to_collab` ON creators only, shuffled per load (Featured pinned) — see §1
- **Typing:** debounced live search against the discover engine — **ALL creators** (FB-style directory; the collab switch never hides anyone from typed search), exact → approximate ranking (`search.md` Part 3)
- **Never greys** (2026-10-09): the input and list are always active — no disabled state, no banner
- Loading state: spinner in the box, Zero results: "No creators match …", no discoverable creators yet: encouraging first-creator empty state
- Results in 2-column grid (responsive)
- Card click → `CreatorBillboardModal`

### CreatorBillboardModal (founder decision 2026-10-07 — "Modal A")
- Click any card (collab list OR search result) → center modal overlay on top of the dimmed Network screen — **no page navigation**, close (✕ / backdrop) returns to the exact list position
- Content: avatar, display name, @handle, Featured badge, tagline, tags (chips), collab style, bio, rate card (post/story/video), media kit message
- Actions inside: **Connect** (same state machine as the card — … → Requested → Connected; disabled **"Not open to collabs"** when the target has `open_to_collab` OFF) + **Visit ↗** (opens `/{username}`, new tab)
- Data: fetch the target's billboard by id — `GET /api/discover/creators/[id]` (any creator with a username; 404 only for unknown/username-less ids — the hidden-creator 404 was removed 2026-10-09 with the switch). The list/search response carries `open_to_collab` (collab-feed pool filter + disabled button)
- Reuses the app's existing `Dialog` (same machinery as checkout / guest-contact modals)

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
- **Real `MessageIcon` in the row (since 2026-10-12)** — quick mini thread; clicking it stops there, clicking the row opens the detail (the old decorative `MessageCircle` glyph is gone)
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

### AffiliateDealForm *(lives on the Earnings screen §2b since 2026-10-12 — concept kept here, component `git mv`'d to `components/earnings/`)*
- Collaborator (@username resolver) — no scope selector since 2026-10-10 (creator-only deals, `creators.md` 2b)
- Deal type dropdown: Percentage (0-100%) / Fixed amount ($) / Free cross-promo (0%) / Tiered / Custom
- **Trigger** dropdown: Purchase / Follow / Subscribe / Tip / Signup / Any
- Fields per type: rate, fixed amount, tier rules, custom-terms textarea
- Optional valid_from / valid_until date range; optional max affiliates
- NO min/max validation on rate/amount — any values the creators agree to
- Saves as the creator's OWN `affiliate_deals` row (asymmetric — no echo to the other side)
- States: loading, saving, error (silent)

### NetworkSettings
- Composes VisibilitySwitch **only** — *(BillboardEditor moved to Playground → Billboard view, `playground.md` Part 1d, 2026-10-09)*
- **Renders inside the Discover section** (under the heading, above the results — position since 2026-10-09; the rail holds only the Billboard mirror)
- Loads current collab switch from Supabase (`open_to_collab` only since 2026-10-09)
- Toggle saves instantly; loading state while fetching

### MyPeeps (right rail — see `relationships.md`)
- The anchored umbrella: 3 rows — **Partners** (count), **Fans** (count), **Staffs** (count)
- Tap a row → expands in the rail to that group's list; selection opens detail in the center column
- Partners row = collab list + partnership invites + "Invite a partner" button (`partnership.md`)
- Fans row = the fan list (`relationships.md` Part 2)
- Staffs row = the staff list (`staff.md` Part 4)

### NetworkPage (main page) — layout DECIDED
- Page heading + subtitle
- **Live layout since the 2026-09-26 hub rebuild:** 2 columns — LEFT rail (**billboard mirror only** — the affiliate block left for Earnings §2b on 2026-10-12) / CENTER = Discover (switch card + search + cards) — the 3-section diagram above is the original 2026-08-05 vision, pending the full-file review
- Mobile: stacks vertically (Discover first, then the billboard mirror)

---

## Data Model

| Field | Table | Type | Notes |
|---|---|---|---|
| `show_in_search` | `creators` | boolean | **PARKED 2026-10-09** (switch removed — search always on; column kept, default true, zero reads; future Settings "private mode") |
| `open_to_collab` | `creators` | boolean | Exists (new 2026-09-29, default true; collab-feed pool + partners/request 403 gate — the ONE switch since 2026-10-09) |
| `tags` | `creators` | string[] | Exists |
| `tagline` | `creators` | string? | Need to add to Creator type |
| `collab_style` | `creators` | string? | Need to add to Creator type |
| `commission_pct` | `partnerships` | number | Exists (optional — set in DealMaker) |
| `notes` | `partnerships` | string? | Exists |
| `status` | `partnerships` | enum | pending / active / declined / ended |
| `source` | `partnerships` | enum | `invited` / `collab` — NEW (2026-08-04), records the entry point (`partnership.md`) |
| `scope` | `affiliate_deals` | enum | **REMOVED 2026-10-10** (creator-only — `creators.md` 2b; column dropped pre-migration) |
| `trigger` | `affiliate_deals` | enum | `purchase` / `follow` / `subscribe` / `tip` / `signup` / `any` — NEW (2026-08-05) |
| `affiliate_enabled` | `content_items` | boolean | **PARKED 2026-10-10** — per-item machinery died with scope (zero readers; candidate for cleanup at migration) |
| `affiliate_rate` | `content_items` | number | **PARKED 2026-10-10** (same — per-item rate) |
| `affiliate_links` | *(new table)* | — | `creator_id`, `item_id`, `commission_rate`, `clicks`, `conversions`, `revenue`, `is_active` |

Full affiliate data model (the immutable ledger): `monetization/creators.md` Part 2f (`affiliate_deals` / `affiliate_attributions` / `affiliate_conversions`).

## API Routes Needed

| Route | Method | Purpose |
|---|---|---|
| `/api/creator/partners/request` | POST | Send simple collab request |
| `/api/creator/partners/respond` | POST | Accept/decline/cancel request |
| `/api/creator/partners/list` | GET | Get my collabs |
| `/api/creator/partners/billboard` | GET/PUT | Get/save billboard settings |
| `/api/discover/creators` | GET | Search engine + default collab list (empty `q` = willing pool; typed `q` = ALL creators); excludes the searcher (2026-10-09); response carries `open_to_collab` (2026-10-07) |
| `/api/discover/creators/[id]` | GET | Billboard-modal payload by id — any creator with a username, 404 only for unknown ids (2026-10-07; hidden-creator 404 removed 2026-10-09) |
| `/api/messages/*` *(all creator↔creator chat)* | — | Shared messaging API — see `messaging.md` (Part 7). No separate per-collab chat route |
| `/api/creator/partners/deal` | POST | Create/update deal agreement *(future — superseded by affiliates in v1)* |
| `/api/creator/affiliates/deals` | GET/POST | List/create MY affiliate deals (owner side; scope + trigger + type + terms) — **UI caller = the Earnings screen §2b since 2026-10-12** |
| `/api/creator/affiliates/deals/[id]` | PATCH/DELETE | Edit/pause/revoke a deal |
| `/api/creator/affiliates/earnings` | GET | Earnings summary |
| `/api/creator/affiliates/discover` | GET | Browse affiliate-eligible deals |
| `/api/creator/affiliates/link` | POST | Generate affiliate link |
| `/api/creator/affiliates/links` | GET | List your affiliate links |
| `/api/creator/affiliates/links/[id]` | PATCH | Activate/deactivate link |
| *(earnings screen)* | — | The money routes moved with the screen: `GET /creator/earnings/sales` · extended `GET /creator/affiliates/earnings` · `POST /creator/affiliates/conversions/[id]/settle` · `PUT /creator/earnings/paypal` + admin dispute verdicts — all spec'd in `earnings.md` Part 6 |

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
│   └── StaffsRow → StaffList (staff.md Part 4)
├── LEFT RAIL (billboard mirror ONLY since 2026-10-12)
│   ├── NetworkSettings → renders inside the Discover section (§3)
│   │   ├── VisibilitySwitch (the single collab switch)
│   │   └── BillboardEditor → moved to Playground Billboard view (Part 1d, 2026-10-09)
│   ├── BillboardPreview (mirror; status pill Open/Closed to collabs; card-header ✏️ → Playground, name-row ✏️ → Settings)
│   └── (the affiliate block — AffiliateDealForm / YourDealsCard / AffiliateDiscover / AffiliateLinks —
│        MOVED → Earnings screen §2b, 2026-10-12)
├── CENTER = Discover
│   ├── SearchBox (§1: default collab list = willing only + typed search = ALL creators — never greys)
│   │   └── BillboardCard[] → CreatorBillboardModal (click)
│   ├── Inbox
│   │   ├── IncomingRequest[]
│   │   └── OutgoingRequest[]
│   └── …(detail views of dock selections: collab / fan / staff member)
└── CENTER
    └── Detail view of selected row (collab / fan / staff member / affiliate page)
```

---

## Deferred Features (end of development)

| Feature | Notes |
|---------|-------|
| **Chat/messaging** | Spec'd above — implement when building from this spec |
| **Deal Maker** | Parked — affiliate deals (§7) are the active money mechanism in v1 |
| **Billboard interactivity** | Editing relocation **spec'd 2026-10-09** (billboard design lives in Playground → Billboard view — `playground.md` Part 1d; Network = mirror + the one collab switch). True *interactivity* (animations, hover, rotation ideas) still parked — user will return with specifics |
| **Playground Connection** | ✅ RESOLVED 2026-10-09 — Network links to Playground via the billboard entry points (My Billboard card-header ✏️ + nudge [Design my billboard] → `/dashboard/playground?view=billboard`). Deeper integration stays TBD |
| **External brand affiliates** | Self-serve brand deals (Beacon-style 12K network) — v2 |
| **Auto-DM for affiliates** | Auto-notify affiliates when their link converts |
