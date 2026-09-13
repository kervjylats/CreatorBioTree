# Search — Vision & Spec

## Concept

Public creator discovery. Anyone can search for creators by display name or Link Address, browse discoverable creators, and land on their fan page. The search is the platform's answer to "find your favorite creator on CreatorBioTree" — a differentiator, since the link-in-bio competitors (Stan Store, Linktree, Beacon) have **no** creator search at all; only marketplace-style platforms (Patreon, Gumroad) do.

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

- **Username is unique** — no two creators can own the same one, chosen once at signup and **permanent** (never changeable — see `onboarding.md` and `my-app.md` Part 2a). Debounced availability check at creation (per `my-app.md`: 3-20 chars, lowercase, numbers, underscores).
- It's the public URL: `creatorbiotree.com/{username}`.
- Typing an exact username finds **THE one creator** — no ambiguity.

> **Terminology:** user-facing copy calls this the **"Link Address"**. The code, DB column, and docs keep `username`. Search UI should say "Search by name or link address", never "search by username".

### Display name = NOT unique

- Many creators can share a display name ("Fitness Alex" x3).
- Every result card must disambiguate: **avatar + display name + @link-address** together (TikTok-style), so the searcher picks the right person.

### Discoverability gate

- Only creators with `is_discoverable = true` appear in public search. Opt-out creators are invisible to everyone (they can still send collab requests from the Network).
- Featured creators (`is_featured`) float to the top.

---

## Part 3: Matching & Ranking

Results ordered (best first):

| # | Rule | Notes |
|---|---|---|
| 1 | **Exact username match** | Unique handle → that creator is first, clearly THE result |
| 2 | **Featured creators** | `is_featured` float above the rest |
| 3 | **Name/username contains match** | Case-insensitive partial match on display name OR username |
| 4 | **Newest creators** | `created_at` desc breaks ties |
| 5 | **"Did you mean?" suggestions** | Shown **only when zero results** — see below |

### "Did you mean?" (typo tolerance)

- **Trigger: zero results only** (TikTok-style — no noise when the search already worked).
- Compute similarity between the typed query and known display names/usernames (edit-distance based).
- Show a suggestion row: *"Did you mean **@correcthandle**?"* — one tap re-searches with the suggestion.
- When the exact-username rule is hit, suggestions are never shown.

### Search bar behavior

- Debounced input (no query spam while typing).
- Enter submits; results update live as you type.
- Empty query = show all discoverable creators (featured first) — the page is still useful before typing.

---

## Part 4: Edge States

| State | Behavior |
|---|---|
| **Empty query** | Show all discoverable creators (featured first, newest after) — never a blank page |
| **Zero results** | Friendly empty message + **"Did you mean?"** suggestions (Part 3) |
| **No discoverable creators yet** | Brand-new platform → encouraging empty state ("Be the first creator on CreatorBioTree" style) |
| **Loading** | Skeleton/spinner while fetching |
| **Typing fast** | Debounced — one search per pause, no stale-result flicker |
| **Creator not discoverable** | Never appears, even on exact-username match |

---

## Part 5: Production Notes

| Piece | Mock | Production |
|---|---|---|
| Matching | In-memory JS similarity (edit distance) + partial match | Postgres `pg_trgm` trigram similarity (indexed) for fast fuzzy name/username search |
| Ranking | Simple sort in code | SQL ordering: exact match → featured → similarity → created_at |
| Volume | In-memory creators table | Indexed `creators` table (`is_discoverable` partial index); if search volume grows, evaluate a dedicated search service |

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
