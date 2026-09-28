# NETWORK_REDESIGN_PLAN — Creator Network Screen Rebuild

> **Purpose:** the execution plan for rebuilding the creator Network screen
> (`/dashboard/network`). Read this first, then execute phase by phase (A → E),
> checking `[x]` off each item. After EVERY phase:
> `npm.cmd run typecheck` (0) + `npm.cmd run lint` (0) + `python scripts/check-docs.py` (PASS).
> Stop after each phase and continue only when told to.
>
> **Rules:**
> - Mock mode always on (`USE_MOCKS=true`). Never touch mock files unless asked.
> - ONE My Peeps component — responsive classes only, NO duplication/separation.
> - Wire from existing live components + routes. Old code is reference-only (`src/old-code/`).
> - Do NOT commit until founder says so.
> - Use `npm.cmd` not `npm` for commands.
> - Every `.ts`/`.tsx` file must keep a `/** ... */` purpose docstring that opens
>   AND closes within its first 10 lines.

---

## Final Design (founder-approved 2026-09-26)

> **Addendum (founder design review):** the dock and the 💬 bubble are now **ONE unified stack** — `Partners · Fans · Staff · 💬` (top→bottom), all uniform `h-11 w-11` round icon buttons (icon-only at every breakpoint, no desktop labels). Both `MyPeeps` and `ChatInboxPopover` are **position-less**; the single stack wrapper lives only in `app/(shell)/layout.tsx` (`fixed bottom-20 right-4 z-50 flex flex-col items-center gap-2 sm:bottom-6 sm:right-6`), eliminating the old `right-[4.5rem]`/`sm:right-20` magic offset. The bullets below describe the original (superseded) chip design.

- **My Peeps = bottom-right dock** — ONE component, sits on the same row,
  immediately LEFT of the existing 💬 chat bubble (`fixed bottom-20 right-4 z-50
  sm:bottom-6 sm:right-6`).
  - Mobile: 3 round icon-buttons (Partners / Fans / Staff) with red count badges.
  - Desktop: labeled chips (`Partners 2 · Fans 847 · Staff 1`).
  - Tap → navigates to that sub-screen; active page's chip highlights.
- **Hub = 2 columns** (`lg:grid-cols-[250px_1fr]`):
  - LEFT rail: BillboardPreview + BillboardEditor + AffiliateDiscover + EarningsSummary (unchanged).
  - CENTER: **Discover grid** (search box + result cards with Visit + Connect buttons).
  - RIGHT rail removed entirely. Mobile order: Discover → Billboard → Affiliates.
- **3 sub-screens** (route chain: `page.tsx` re-export → `src/screens/creator/circle/<name>/Screen.tsx`):
  - `/dashboard/circle/partners` — Requests section (incoming Accept/Decline + outgoing Pending), Active Collabs list → in-page detail panel (back button, Visit their page, 💬), Invite a partner card.
  - `/dashboard/circle/fans` — full-width FanListTable (filters + CSV + status chips) + FanProfileDrawer + 💬 per fan.
  - `/dashboard/circle/staff` — pending invites section + members list → permissions panel, mounts TeamRow / InviteEmail / PermissionsToggles + 💬 per member.
- **Badges = ONE red pill, combined count** per chip:
  - Partners = pending requests (incoming) + unread convos with partners.
  - Fans = unread convos with fans only (starts at 0). Fans have no requests concept.
  - Staff = pending invites + unread convos with staff.
  - Data comes from extending `GET /api/creator/relationships`.
- **ChatIcon** (existing export from `src/components/messages/ChatShell.tsx`) mounted on:
  collab detail, fan drawer, staff rows.
  ChatIconProps = `{ otherKey, otherParty: "creator"|"fan", name, accentColor?, guest?, onGuestContact? }`.

## Parked (do NOT build)
- Billboard redesign (next discussion).
- AffiliateDealForm / My Links mounting, Deal Maker.
- G3 / G4 / G5 (monetization backlog).

---

## Phase A — Fix 4 Known Bugs

- [x] **A1. Connect button (send collab request).** `POST /api/creator/partners/request`
      (`{ partner_id }`) is LIVE and returns 409 "Request already pending" /
      "Already connected". Add a **Connect** button to Discover result cards in the
      hub center that calls it, shows an inline "Requested ✓" (or "Connected" on 409 "Already connected"),
      and disables further actions.
- [x] **A2. `GET /api/creator/partners/list` returns pending + direction.**
      `src/app/api/creator/partners/list/route.ts` filters `.eq("status", "active")`
      only — the reason "No collab requests yet" is wrong. Change to return ALL
      non-ended rows (active + pending), and add a computed `direction` field:
      `"incoming"` when `creator_b === user.id`, `"outgoing"` when `creator_a === user.id`.
      Enrich `partner_info` for both sides as today.
- [x] **A3. `GET /api/creator/fans/list` returns `id` + status fields.**
      `src/app/api/creator/fans/list/route.ts` selects only `email, created_at, referred_by`.
      `FanListTable`'s `FanRow` already expects `id`, `do_not_contact`, `total_spent`
      (they render as every fan = "New", LTV $0.00, and clicks are dead). Fix the select
      to add `id, do_not_contact`, and compute `total_spent` from `fan_purchases`
      (completed, amount_paid sum) per fan — mirror the `fans/[id]` route.
      Also replace the placeholder docstring with a real one.
- [x] **A4. Media Kit persistence + dead link removal.**
      `PUT /api/creator/partners/billboard` accepts `tagline/tags/collab_style/is_discoverable`
      only — the NetworkPage already sends `bio/rate_card/media_kit_message` but they're
      silently dropped. Add those 3 fields to both GET and PUT (persist on the creators row).
      Find the dead `/media-kit` link in `src/components/network/BillboardEditor.tsx` (or
      wherever it lives) and remove it — it renders a broken page.

---

## Phase B — Structure: Hub 2-Column + 3 Sub-Screens + My Peeps Dock

- [x] **B1. Rewrite `src/components/network/NetworkPage.tsx`** to the 2-column layout:
      left rail (BillboardPreview/BillboardEditor/AffiliateDiscover/EarningsSummary),
      center = Discover grid. Remove the right rail, the inline `InboxRequests`/`MyPeeps`/
      `FanListTable`/`PartnerInviteCard`, and the `peepRow` selection state.
      Mobile order: Discover, Billboard, Affiliates (order via flex/grid ordering classes).
- [x] **B2. Discover grid in center.** Reuse the existing search + result-card markup
      (search ← `/api/search/creators?q=`). Add per-card actions: **Visit** (`/{username}`)
      and **Connect** (Phase A1). Cards show avatar / display name / @username / tagline /
      featured badge.
- [x] **B3. Partners sub-screen.**
      `src/app/(shell)/dashboard/circle/partners/page.tsx` (re-export) →
      `src/screens/creator/circle/partners/index.ts` + `Screen.tsx` (server, metadata
      "Partners", renders `src/components/circle/PartnersPage.tsx`).
      Content: Requests section (reuses/replaces `InboxRequests` — incoming Accept/Decline,
      outgoing Pending badge) → Active Collabs list (`CollabList` + `CollabDetail` panel,
      ChatIcon on detail, back button, "Visit their page" link) → `PartnerInviteCard`.
- [x] **B4. Fans sub-screen.**
      `src/app/(shell)/dashboard/circle/fans/page.tsx` → `src/screens/creator/circle/fans/{index,Screen}.tsx`
      (metadata "Fans", renders the fans content). Full-width `FanListTable` + `FanProfileDrawer`
      + ChatIcon per row (drawer). No side columns.
- [x] **B5. Staff sub-screen.**
      `src/app/(shell)/dashboard/circle/staff/page.tsx` → `src/screens/creator/circle/staff/{index,Screen}.tsx`
      (metadata "Staff"). Pending invites section (from `GET /api/creator/team/invites`),
      members list (`TeamRow` from `GET /api/creator/team/members`), edit panel
      (`PermissionsToggles`, PATCH `team/members/[id]`), `InviteEmail` on top, ChatIcon per member.
- [x] **B6. Convert `MyPeeps` → bottom-right dock** (`src/components/layout/MyPeeps.tsx`).
      ONE component, position-less (fragment of 3 buttons) — mounted in the shell layout's
      single floating row next to the 💬 bubble (superseded by the dock-unification addendum
      at the top of this file). Uniform `h-11 w-11` icon buttons + red count badge at every
      breakpoint. Row click → `useRouter().push("/dashboard/network/<tab>")`. Active page (from
      `usePathname()`) highlights. Fetch counts from `GET /api/creator/relationships`
      (Phase C). Mounted once in the dashboard layout (visible from the 3 sub-screens too).
- [x] **B7. Remove migrated pieces** from the hub: `InboxRequests`, `MyPeeps`,
      `FanListTable`, `PartnerInviteCard` no longer render in `NetworkPage.tsx`
      (they move to sub-screens). Nothing is deleted — all stay live components.

---

## Phase C — Relationships API + Badge Math

- [x] **C1. Extend `GET /api/creator/relationships`** (`src/app/api/creator/relationships/route.ts`)
      to return, alongside `partners/fans/staff` counts:
      - `pending_requests` (partnerships status=pending AND `creator_b === user.id`),
      - `pending_invites` (`creator_team_invites` rows for this creator),
      - `unread: { partners, fans, staff }` — sum of chat unread keyed by the other
        party's type, from `conversation_members` + `messages` (mirror the
        `listConversations` unread math: message later than `last_read_at`, owned by
        the other key). Skip muted. Use `getChatIdentity` to get my key.
- [x] **C2. Badge math in MyPeeps dock:**
      - Partners pill = `pending_requests + unread.partners`
      - Fans pill = `unread.fans` (only)
      - Staff pill = `pending_invites + unread.staff`
      Single red pill showing the combined number; hide pill when 0. Poll the
      relationships endpoint on an interval while a sub-screen or network page is open.

---

## Phase D — ChatIcon + Unread Wiring

- [x] **D1. Mount `ChatIcon`** (from ChatShell) in:
      - collab detail (otherParty "creator", otherKey = partner creator id, name = display name),
      - fan drawer (otherParty "fan", otherKey = fan_accounts.id, name = fan email/name),
      - staff rows (otherParty "creator", otherKey = member user_id, name = display name).
- [x] **D2. Feed unread counts into the dock badges** (Phase C2) so opening a sub-screen
      + the dock stays accurate. Verify chat unread updates after opening/reading a thread.
- [x] **D3. Guests:** ChatIcon's `guest`/`onGuestContact` path is fan-shell only — creator
      dashboard always has an identity, so pass identity-based props only.

---

## Phase E — Docs + Final Gates

- [x] **E1. AGENTS.md** — add an Impromptu Fix Log entry (2026-09-26): Network redesign
      (Phases A–E, this plan), bugs fixed, dock added, sub-screens added.
- [x] **E2. WIRING_PLAN.md** — Sheet 18 addendum (overrides): network is now hub+dock+3
      sub-screens; pending/direction in list route; relationships API shape.
- [x] **E3. `docs/CODEBASE.md` + `docs/HOW_IT_WORKS.md` + `src/wiredLater/screens.md`**
      — network section updated (2-col hub, dock, sub-screens, fans API fields).
- [x] **E4. `TESTING.md` §15** — align with new layout + sub-screens.
- [x] **E5. Backlog tick** — `docs/BACKLOG.md` "Search on Network" item: mark done
      (Discover grid is now the search surface).
- [x] **E6. Final gates** — typecheck 0 · lint 0 · check-docs PASS · manual smoke:
      login → network hub, discover+connect, requests accept/decline, fans table + drawer,
      staff invite/edit, dock badges navigate + count, chat icons open threads.

---

## Verification Checklist (after every phase)

```bash
npm.cmd run typecheck        # 0 errors
npm.cmd run lint             # 0 errors
python scripts/check-docs.py # PASS
```

---

*Single source of truth for the Network rebuild. Check items off as done.
Stop after each phase; continue only when told.*