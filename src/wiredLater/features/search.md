# Search — Vision & Spec

> **STATUS (2026-09-28): the standalone `/search` page was REMOVED from live code.** The Network hub's Discover center (Sheet 18) is the live search home — `GET /api/discover/creators` still powers it (plus the affiliate deal form's `@username` lookup). This spec remains the blueprint for the **landing-page search section** (Part 1a, ships with the landing page / Sheet 23); Part 1b (standalone page) is retired.

## Concept

Public creator discovery. Anyone can search for creators by display name, Link Address, **field, tags, tagline, or bio (extended 2026-10-13 — `network.md` §1b)** — names rank first, discovery fields after. Browse discoverable creators, and land on their fan page. The search is the platform's answer to "find your favorite creator on CreatorBioTree" — a differentiator, since the link-in-bio competitors have **no public creator name-search** (Linktree offers category browse, not name lookup; Stan/Beacons offer none — verified 2026-10-13); only marketplace-style platforms (Patreon, Gumroad) do.

Two audiences, one search engine:

- **Everyone (public)** — on the landing page and the standalone `/search` page. No account needed.
- **Creators** — inside the dashboard Network, searching other creators (already spec'd in `network.md` Part 1 — the public search and the network search share the same matching rules, but the network adds collab actions on the result cards).

---

## Part 1: The Two Surfaces

### 1a. Landing page search section

- A search section on the landing page (`/`), visible to everyone, no account required.
- **Built later with the landing page** — the landing page itself is deferred (see Part 6). The search component it embeds is the same one used on the `/search` page.

### 1b. Standalone `/search` page

- A dedicated search page with a prominent search bar and a results grid.
- Reachable from the landing page (nav / CTA) and from anywhere the platform links out.
- Shares the exact same matching, ranking, and card design as the landing section.

### 1c. Network search (creators searching creators)

- Already spec'd in `network.md` Part 1 (Creator Search Engine): discoverable creators only, same matching rules, plus collab actions on cards.
- Cross-reference, no duplication — the public search is the read-only version of the same engine.

---

## Part 2: Identity & Uniqueness

### Username = unique handle

- **Username is unique** — no two creators can own the same one, chosen once at signup and **permanent** (never changeable — see `onboarding.md` and `playground.md` Part 2a). Debounced availability check at creation (per `playground.md`: 3-20 chars, lowercase, numbers, underscores).
- It's the public URL: `creatorbiotree.com/{username}`.
- Typing an exact username finds **THE one creator** — no ambiguity.

> **Terminology:** user-facing copy calls this the **"Link Address"**. The code, DB column, and docs keep `username`. Search UI should say "Search by name or link address", never "search by username".

### Display name = NOT unique

- Many creators can share a display name ("Fitness Alex" x3).
- Every result card must disambiguate: **avatar + display name + @link-address** together (TikTok-style), so the searcher picks the right person.

### Discoverability gate

- **Search is ALWAYS on — every creator appears in results** (FB-style directory, founder 2026-10-09). The old `show_in_search` gate is **removed** (column parked, default true): there are no hidden creators, and your own searches are never blanked. The collab switch (`open_to_collab`) never hides anyone from typed search — it only gates the collab feed + whether Connect works on their card (`network.md` §1/§3).
- Featured creators (`is_featured`) float to the top.

---

## Part 3: Matching & Ranking

Results ordered (best first):

| # | Rule | Notes |
|---|---|---|
| 1 | **Exact username match** | Unique handle → that creator is first, clearly THE result |
| 2 | **Featured creators** | `is_featured` float above the rest |
| 3 | **Name/username contains match** | Case-insensitive partial match on display name OR username |
| 4 | **Tag / tagline match** (2026-10-13) | Query in `tags[]` or `tagline` (both normalized lowercase) — the field-finder tier |
| 5 | **Bio contains** (2026-10-13) | Last resort — a bio is a story, not labels; mentioning "music" once ≠ a musician |
| 6 | **Newest creators** | `created_at` desc breaks ties |
| 7 | **"Did you mean?" suggestions** | Shown **only when zero results** — see below |

### "Did you mean?" (typo tolerance)

- **Trigger: zero results only** (TikTok-style — no noise when the search already worked).
- Compute similarity between the typed query and known display names/usernames (edit-distance based).
- Show a suggestion row: *"Did you mean **@correcthandle**?"* — one tap re-searches with the suggestion.
- When the exact-username rule is hit, suggestions are never shown.

### Search bar behavior

- Debounced input (no query spam while typing).
- Enter submits; results update live as you type.
- **Empty query on the Network hub = the default collab list** — pool = willing-to-collab (`open_to_collab`) ONLY, shuffled per load with Featured pinned (founder decision 2026-10-07, revised 2026-10-09, `network.md` §1) — never blank.
- **Batched rendering (founder 2026-10-09):** typed results render in **batches of 24** with **Show more** (reset per query) — same batch rule as the collab list; production = server-side `LIMIT` + offset paging (see `network.md` §1 scale note).
- **Empty query on the landing section (Part 1a)** = show all creators (featured first) — that surface keeps the show-all behavior (pool de-gated 2026-10-09).
- **Search never greys** (2026-10-09): no disabled box, no banner — the old own-`show_in_search`-OFF rule is removed with the switch (`network.md` §3).

---

## Part 4: Edge States

| State | Behavior |
|---|---|
| **Empty query** | Network hub: default **collab list** (willing pool, shuffled, Featured pinned) — never a blank section. Landing section: show all creators (featured first) |
| **Zero results** | Friendly empty message + **"Did you mean?"** suggestions (Part 3) |
| **No creators yet** | Brand-new platform → encouraging empty state ("Be the first creator on CreatorBioTree" style) |
| **Your collab switch OFF** | You drop out of the default collab feed + others' Connect on your card is disabled (403 at the API) — typed search still finds you, and **nothing ever greys** (`network.md` §3) |
| **Target not open to collab** | Their search card shows a disabled "Not open to collabs" button instead of Connect — closed sign, not error-after-click |
| **Loading** | Skeleton/spinner while fetching |
| **Typing fast** | Debounced — one search per pause, no stale-result flicker |
| **Your own card** | Excluded from your own results (self-Connect would be a guaranteed 400 — self-exclusion added 2026-10-09); everyone else finds you normally |

---

## Part 5: Production Notes

| Piece | Mock | Production |
|---|---|---|
| Matching | In-memory JS similarity (edit distance) + partial match | Postgres `pg_trgm` trigram similarity (indexed) for fast fuzzy name/username search — **extend the trigram index to `tagline` + `tags` + `bio` at wiring (2026-10-13)** |
| Ranking | Simple sort in code | SQL ordering: exact match → featured → similarity → tag/tagline → bio → created_at |
| Volume | In-memory creators table | Indexed `creators` table (`open_to_collab` partial index for the collab-feed pool; `show_in_search` parked 2026-10-09 — no longer filtered); **filtered pool gets a `primary_field` partial index** (2026-10-13); if search volume grows, evaluate a dedicated search service |

---

## Part 6: Landing Deferral Note

The landing-page search section ships **with the landing page** (deferred to the end of development, per `landing.md`). The `/search` page and the search engine itself are built at wiring time (Phase F); the landing page just embeds the same component later. No rework: one search component, two placements.

---

## Open Decisions (discussed one at a time with the founder)

| Topic | Status |
|---|---|
| #1 Where public search lives | ✅ Decided — landing section + standalone `/search` page (same component) |
| #2 Data fetching | ✅ Decided — spec describes behavior only; implementation choice made at wiring time |
| #3 Typo suggestions | ✅ Decided — "Did you mean?" on zero results only |
| #4 Username uniqueness | ✅ Decided — unique handle, availability-checked; display name non-unique, disambiguated by avatar + @handle |
| #5 Platform updates feed ("What's new at CreatorBioTree") | ✅ Decided — roadmap future item only (see `docs/HOW_IT_WORKS.md` section 16); built with the landing page; small strip in dashboard Overview + small link in fan Settings |
| #6 Toggle friction | ✅ Decided 2026-10-07 — **no cooldown/confirmation** (TikTok profile-views precedent). **Superseded 2026-10-09:** the `show_in_search` switch (and its grey-out) was removed entirely — search is always on; the one switch left (`open_to_collab`) only gates the collab feed + Connect |
| #7 Default view | ✅ Decided 2026-10-07, revised 2026-10-09 — Network empty query = **collab list** (willing only, shuffled per load); typed search = **ALL creators** (FB directory); landing section shows all |
| #8 Billboard nudge | ✅ Decided 2026-10-07, trigger retargeted 2026-10-09 — first Network visit while the billboard is undesigned shows an optional "design your billboard" modal (once ever); the permanent ✏️ lives in the My Billboard card header (see `network.md` §3) |
| #9 Two-layer discovery identity | ✅ Decided 2026-10-13 (TT/Insta precedent) — ONE preset `primary_field` (the filterable identity) + 3 free-text `tags` (flavor + search matches, never filtered); multi-identity (musician + wellness) lives in the tags, the primary is "what I want to be FOUND as" |
| #10 Preset bucket list | ✅ Decided 2026-10-13 — 20 locked buckets (Music · Wellness · Fitness · Comedy · Food & Drink · Fashion & Beauty · Gaming · Education · Business & Finance · Travel · Photography · Art & Design · Film & Video · Sports · Parenting & Family · Pets & Animals · Tech · Books & Writing · Spirituality · Lifestyle); additions = future founder decision |
| #11 Filter chips | ✅ Decided 2026-10-13 — scrollable single row under the search box (`All` + 20), single-select, tap-active-clears; AND-combined with typed query; narrows both views (feed pool + directory, FB rule holds inside the field) |
| #12 Tag honesty rules | ✅ Decided 2026-10-13 — tags normalized lowercase + trim at save; tagline's 60-char cap already blocks stuffing (kept); bio searched LAST (story, not labels) |
| #13 Keep 1 primary + 3 tags | ✅ Decided 2026-10-13 (founder accepted the pushback) — NO second primary field (breaks filter crispness: AND/OR + ranking go blurry), NO widening to 5 (the cap is the honesty mechanism). Multi-identity lives in the tags. Revisit ONLY on real-creator complaints — never preemptively |
