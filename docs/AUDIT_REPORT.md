# Data-Drift Audit — live code (2026-10-01)

Full-project audit of one bug class, run with 4 read-only agents over the whole live tree: **do the widgets show what the data actually says?**

The class, stated once:

> A widget asks an API (or a table) for a field/number, and instead of getting it, it **invents** one — a `?? 0` fallback, a client-side sum, a hardcoded literal. The page then shows a confident, wrong number. Nobody notices, because a wrong number looks exactly like a right one.

Trigger finding: `overview/StatCards.tsx` read `fans_count` from an API that never sends it (card = 0 forever) and computed "Total Sales" by summing **catalog price tags**.

**Method:** every `"use client"` widget was opened and every response field it reads was diffed against its route's *actual* `NextResponse.json` keys. Server components were checked for select-vs-render drift. `src/old-code/` excluded (archive). `src/wiredLater/` read as spec reference for expected behavior.

**Result:** ~75 unique findings — **18 HIGH · ~30 MED · ~22 LOW**. Severity = HIGH shows the user wrong or zero data; MED = misleading, fragile, or drifted from a shared helper; LOW = style/cleanup.

**The one law that fixes the whole class:**

> ### 🧠 The API computes. The widget displays.
> Widgets never sum, never invent, never default a number to 0 to hide a missing field. The server is the only brain; the client is the mouth.

---

## The fix policy (founder, 2026-10-01)

| Policy | Decision |
|---|---|
| Features that toast success without doing anything | **Label honestly.** Remove the fake success toast, mark the control "Coming soon" until it's wired for real. Never leave a lie in the UI. (Tip jar, PayPal connect, push bell, DangerZone export/delete, Notifications toggles, AuditLog.) |
| Fan-shell navigation | **Bottom bar at every width** (no desktop top-links variant). |
| `screens/creator` wing name | **Kept** — wings are named by *who* (creator · fan · admin · public), leaves are named by the *URL word*. |

### Found while fixing (not in the original sweep)

| # | Where | Broken | Fix | Batch |
|---|---|---|---|---|
| 76 | `lib/mocks/mockSupabaseClient.ts` `getUser()` / `getSession()` | **Every route that reads the user and then builds a service client returned empty lists.** The mock returned the auth singleton *by reference*; `createServiceClient()` (no cookie hydration) blanks it for the "no cookie" case, so a route's already-captured `user.id` became `""` before the query — `.eq("creator_id", user.id)` matched nothing. `fans/list` and `fans/export` answered `[]` for a creator with 3 fans. | Return a snapshot (`{ ...currentAuthUser }`), as real Supabase does. | ✅ C (2026-10-01) |
| 77 | `api/creator/fans/export/route.ts:31,39` | *Audit false positive:* "Last Purchase/View Date uses `[0]` of an unordered query". Both queries already had `.order(..., { ascending: false })`, so `[0]` is genuinely the latest. | No change — corrected in this report. | — |

---

## 1. HIGH — user sees wrong or zero data

| # | Where | Broken | Fix | Batch |
|---|---|---|---|---|
| 1 | `components/fan-pwa/ItemCards.tsx:139,144,149,152` | **Paid media renders without purchase.** "Play preview" / "View full image" / `<audio src={file_url}>` / Download render for paid video/image/pdf/audio; `file_url` ships in server props and via `/api/fan/partner-data`. The `/api/fan/content/access` gate exists and is unused. | Render type actions only when `gate.state === "free" \| "purchased"`; resolve media through `content/access`. | ✅ B (2026-10-01) |
| 2 | `components/fan-pwa/FanAuthModal.tsx:34,76,121,124` | **Fan signup/login reports failure on success.** `post()` returns `res.json()`, routes return flat `{ fan_id }` → `res.data` undefined → throw → "Something went wrong. Try again." while the session cookie *was* set and the view never reloads. | Read the flat shape; check `res.ok`; call `onSuccess` only on a real `fan_id`. | ✅ B (2026-10-01) |
| 3 | `components/overview/StatCards.tsx:43` | **Total Fans always 0.** Reads `data.fans_count`; `api/creator/playground/route.ts:48` returns `{ creator, items, page_views }` only. | Count `fan_accounts` server-side; return `fans_count`. | ✅ B (2026-10-01) |
| 4 | `components/overview/StatCards.tsx:45` | **Subscribers always 0.** `subscribers_count` has no producer anywhere in `src/` (no `subscriptions` table). | Drop the card (spec's 5-card set has no Subscribers) or spec the table. | ✅ B (2026-10-01) |
| 5 | `components/overview/StatCards.tsx:37-40` | **"Total Sales" = sum of catalog price tags.** Unsold/free items included; ignores `status`, `payment_handling`, currency. A creator with 3 unsold $9 items shows $27. | `SUM(amount_paid) WHERE status='completed'` server-side (same formula as `fans/list:30-35`). | ✅ B (2026-10-01) |
| 6 | `components/admin/StatsCards.tsx:30-33` | **All 4 admin cards = 0.** Reads `total_creators/total_fans/total_content/total_revenue`; the mock RPC returns `{ totalCreators, totalFans, totalRevenue, proCreators, freeCreators }` — camelCase, and no content count. | Read the real keys; add a content count to the stats source. | ✅ B (2026-10-01) |
| 7 | `components/admin/CreatorsTable.tsx:92-93` | **Fans + Items columns = 0 for every creator.** RPC returns raw `creators` rows. | Count `fan_accounts` / `content_items` per creator server-side. | ✅ B (2026-10-01) |
| 8 | `components/overview/ActivityTimeline.tsx:20-25,41,59,67` | **Activity rows render blank.** Widget reads `{id, action, description}`; the source returns `{type, email?|amount?, created_at}` → undefined keys, default gear icon, no text. Also unsorted, so `slice(0,10)` hides purchases. | Map `type → action`, build `description`, sort chronologically, emit stable ids. | ✅ B (2026-10-01) |
| 9 | `components/settings/ProfileSection.tsx:27,40-44` | **Tagline is a silent no-op.** GET select omits `tagline` (always blank); PUT body sends only `display_name` and `deploySchema` has no `tagline` key (edits stripped) — yet a "Profile saved" toast fires. | Wire it (select + schema + body) or delete the input; the billboard editor already owns the column. | ✅ B (2026-10-01) |
| 10 | `components/circle/staff/StaffPage.tsx:98,143` | **Accepted invites stay "Pending" forever.** Filter is `status !== "accepted"`; no `status` field exists on the row (writer, acceptor, and `types/index.ts:593` all agree). Every row passes, always — while the dock badge (`peeps:49-50`) counts the same rows as 0. | Filter `!used_by && expires_at > now` (the predicate the rest of the codebase already uses). | ✅ B (2026-10-01) |
| 11 | `components/settings/PaymentsPanel.tsx:21-23,30` | **PayPal connection never persists.** Reads `creator.paypal_email` (not in the GET select); the connect button only `setConnected(true)` locally + a mock toast. | Policy: label "Coming soon" until the `paypal/connect` route ships (Sheet 9). | ✅ B (2026-10-01) |
| 12 | `components/overview/QrCard.tsx:36,50,74` | **The "QR code" is random noise.** `Math.random() > 0.55` grid; only the 3 finder squares are structural. Download serializes it to a file that scans to nothing, and toasts "QR code downloaded". | Remove the fake Download; either add a real encoder (needs a dependency — founder call) or present it as a share graphic. | ✅ B (2026-10-01) |
| 13 | `components/network/AffiliateLinks.tsx:56,107,130` | **Copied affiliate links 404** (`/ref/[code]` route doesn't exist) and `click_count` is never incremented anywhere (stays 0). | Add the `/ref/[code]` redirect route (attribute + count), or hide the link UI. | ✅ B (2026-10-01) |
| 14 | `components/fan-pwa/ItemCards.tsx:165-167,398,419` | **Tip jar collects nothing.** $5/$10/$25 chips call `onTip → submitFollow`: a Follower row + "Unlocked — thanks!" with zero money moved and no `fan_purchases` row. | Policy: label "Coming soon" (or route through `/api/paypal/checkout` with the amount). | ✅ B (2026-10-01) |
| 15 | `components/fan-pwa/FanHomeTab.tsx:47,61-66` | **Spec'd "Upcoming" section can never render.** `upcoming` filters `items`, which were already filtered by `isScheduledVisible` (drops anything not yet published). | Build `upcoming` from the unfiltered list + countdown. | ✅ B (2026-10-01) |
| 16 | `app/api/creator/playground/route.ts:15` vs `lib/limits.ts:21` | **Deploy lockout:** billboard allows a 600-char bio, deploy schema caps 500. A 501–600 char bio saved in the Billboard makes **every** Deploy fail with "Invalid request". | Use `BILLBOARD_LIMITS.bio` in the schema. | ✅ B (2026-10-01) |
| 17 | `app/api/creator/affiliates/earnings/route.ts:25,39` + `EarningsSummary.tsx:101-103` | **"Total earned" mixes money earned with money owed.** `allDealIds = [...owned, ...promoted]` sums `promoter_cut` for both — on owned deals that cut is what the creator *pays*. | Split into "earned" (promoted) and "owed" (owned). | ✅ B (2026-10-01) |
| 18 | `app/api/messages/conversations/route.ts:33` vs `unread/route.ts:23` | **Two unread numbers on one screen.** Row pills count muted conversations; the total excludes them → a muted 3-unread thread shows "3" beside a total of "0". | One shared predicate for both routes. | ✅ C (2026-10-01) |

## 2. MED — misleading, fragile, or drifted from a shared helper

| # | Where | Issue | Fix | Batch |
|---|---|---|---|---|
| 19 | `components/circle/fans/FanListTable.tsx:31-35` | Status chip derives identity from the **consent** flag (`do_not_contact`); spec's follower test is `password_hash IS NULL`. | Select `password_hash` + subscription state; derive server-side. | ✅ C (2026-10-01) |
| 20 | `FanListTable.tsx:160` · `FanProfileDrawer.tsx:121` | `${x.toFixed(2)}` hand-rolled money (two renderings of one number on one screen). | `money()`. | ✅ C (2026-10-01) |
| 21 | `components/layout/MyPeeps.tsx:27-31` vs `api/messages/unread` | Dock unread (direct only, grouped) and 💬 unread (all types) are different scopes, documented in neither. | Document the scopes; or derive the dock from one source. | ✅ C (2026-10-01) |
| 22 | `InboxRequests.tsx:41` vs `peeps/route.ts:39-43` | Inbox shows incoming+outgoing pending; the dock badge counts incoming only. | Align or label. | ✅ C (2026-10-01) |
| 23 | `components/network/NetworkPage.tsx:221-224` | Only `YourDealsCard` gets `refreshKey` — a new link never appears in "My Links"/earnings without a full reload. | Thread one key through all four widgets. | ✅ C (2026-10-01) |
| 24 | `NetworkPage.tsx:117-127` | Billboard instant-toggle: optimistic set, **no `res.ok`**, no rollback → a failed save leaves the switch ON while the DB says OFF. | Check `res.ok`; roll back + toast. | ✅ C (2026-10-01) |
| 25 | `NetworkPage.tsx:84-98` | Billboard save failure is swallowed (`.catch(() => null)`) with no toast. | Toast on failure. | ✅ C (2026-10-01) |
| 26 | `AffiliateLinks.tsx:64-73` · `FanProfileDrawer.tsx:65-75` | Toggle/pause writes mutate state without reading `res.ok` → a 403/500 renders as success. | Check + revert + toast. | ✅ C (2026-10-01) |
| 27 | `FanProfileDrawer.tsx:77-87` | Notes PATCH fires **per keystroke**, optimistic, no `res.ok`, no ordering guard → out-of-order writes clobber newer text. | Debounce, check, guard. | ✅ C (2026-10-01) |
| 28 | `FanListTable.tsx:71-86` vs `api/creator/fans/export/route.ts` | **Two CSV exporters** that disagree (5 unquoted columns vs 11 quoted, one honors filters, neither has `do_not_contact`). | One server exporter with filter params; delete the client builder. | ✅ C (2026-10-01) |
| 29 | `components/settings/NotificationsSection.tsx:17-25` | Toggles + success toast, zero persistence (local state only). | Policy: label "Coming soon". | ✅ B (2026-10-01) |
| 30 | `components/settings/DangerZone.tsx:33-42` | "Export started" / "deletion requested" toasts; only `console.log`. | Policy: label "Coming soon". | ✅ B (2026-10-01) |
| 31 | `components/admin/AuditLog.tsx:5-17` | Static placeholder reading as a live panel. | Policy: "Coming soon" badge. | ✅ B (2026-10-01) |
| 32 | `lib/mocks/mockSupabaseClient.ts:884-889` | Admin revenue sums **all** purchases (no `status` filter) while 5 other sites filter `completed`. | Add the filter. | ✅ C (2026-10-01) |
| 33 | `components/network/AffiliateLinks.tsx:123-131` | Shows raw `deal_type/trigger/scope` and no rate; siblings use `formatDealRate`. | Use the shared formatter. | ✅ C (2026-10-01) |
| 34 | `lib/affiliate-format.ts:17` + 6 sites | `money(amount)` without the `currency` argument (silently USD): `StatCards:54`, `admin/StatsCards:33`, `EarningsSummary:83,87,91,103`, `PartnerBody:128`. | Thread currency; single-currency assert. | ✅ C (2026-10-01) |
| 35 | `MessagesShell.tsx:685-686` · `api/messages/upload/route.ts:16,37` | 8MB cap hardcoded in 3 places (plus a 12MB base64 cap not derived from it); `FileUploadField` has no client check. | One exported constant. | ✅ C (2026-10-01) |
| 36 | Anonymous routes with no rate limit | `api/discover/creators` (full table scan per keystroke) and `api/fan/reset-password`. | `enforceRateLimit` on every anonymous route. | ✅ C (2026-10-01) |
| 37 | `api/admin/accounts/route.ts:48` + `api-keys/route.ts:24` | Fourth copy of the role vocabulary; api-keys bypasses validation, and `getAdminAccount` (unordered lookup) can return the `agent` row → **admin locks themselves out** after generating a key. | One enum source; privilege-ordered lookup. | ✅ C (2026-10-01) |
| 38 | `GuestPageContent.tsx:220` · `FanSettingsTab.tsx:47,200` | "Total spent" summed client-side twice; `GET /api/fan/purchases` (0 callers) doesn't return a total; mixed currencies sum into the first row's currency. | Server returns the total (+ per-currency). | ✅ C (2026-10-01) |
| 39 | `api/landing discover` vs `api/creator/billboard` | `show_in_search`: strict `eq(true)` in landing/discover vs `?? true` elsewhere → a NULL shows the toggle ON but the creator is invisible. | Normalize once. | ✅ C (2026-10-01) |
| 40 | `FanHomeTab.tsx:75-77` · `FanSettingsTab.tsx:51-55` | "Active member" is permanent (any past membership purchase); no renewal date, per spec. | Derive or relabel. | ✅ C (2026-10-01) |
| 41 | `PartnerBody.tsx:39-50` | Follow button silently does nothing for guests (401 swallowed). | Show "Sign in to follow" + open the auth modal. | ✅ C (2026-10-01) |
| 42 | `FanCommunitySection.tsx:26-44` | Join on invite-only/fans-only communities silently no-ops (403 swallowed). | Surface the server error. | ✅ C (2026-10-01) |
| 43 | `GuestPageContent.tsx:181-182` | Receipt copy keyed on marketing opt-in ("logged to the dev console" vs "see Settings") — consent has nothing to do with it. | One sentence. | ✅ C (2026-10-01) |
| 44 | `FanAuthModal.tsx:89-90` | Forgot-password ignores the response — a 429 still shows "reset link sent". | Check `{ok,error}`. | ✅ C (2026-10-01) |
| 45 | `FanAppShell.tsx:66-79` · `FanSettingsTab.tsx:37-73` | Bell + 4 notify toggles write `localStorage` only; nothing calls `/api/push/subscribe` and no `Notification.requestPermission` exists → `push_subscriptions` always empty. | Policy: label "Coming soon". | ✅ B (2026-10-01) |
| 46 | `api/creator/fans/export/route.ts:29,36,69-72` | "Last Purchase/View Date" uses `[0]` of an **unordered** query (storage order = earliest). | `.order(desc)`. | FALSE POSITIVE - queries already sort desc |
| 47 | `api/creator/fans/export/route.ts:84` vs `:75` | "Purchases (Total)" counts all statuses while Lifetime Value filters `completed` → columns disagree by design. | State the scope in the header. | ✅ D (2026-10-01) |
| 48 | `admin/AccountsTable.tsx:181` | A live API-key prefix is rendered in the Admins table. | Mask harder. | ✅ C (2026-10-01) |

## 3. LOW — cleanup and drift prevention

| # | Where | Issue | Fix | Batch |
|---|---|---|---|---|
| 49 | `ProfileSection.tsx:79` · `BillboardEditor.tsx:106,115` · `OnboardingForm.tsx:179` | Limits hardcoded in copy (`maxLength={60}`, "max 60 chars", "up to 3"). | Import `BILLBOARD_LIMITS` / `lib/username`. | D |
| 50 | `api/creator/check-username/route.ts:6` · `register/route.ts:5` | `USERNAME_PATTERN` duplicated inline; `lib/username.ts` is imported by the client only. | Import the shared pattern. | ✅ D (2026-10-01) |
| 51 | `staff/invite/route.ts:36` · `partners/invite` · `PartnerInviteCard.tsx:66` | 7-day TTL computed/copy-written 3×. | One `INVITE_TTL_DAYS`. | ✅ D (2026-10-01) |
| 52 | `FanListTable.tsx:25,88-93` | `"subscribers"` filter is typed and dead; Subscribers + Referred chips missing vs spec. | Add the chips or drop the dead member. | D |
| 53 | `types/index.ts:593-603,616-664,695-702` | 4 stale interfaces (`StaffInvite.status`, `AffiliateDeal` columns/enums, `AffiliateLink.code`, `FanProfile.subscription_status`) shadowed by local ones. | Regenerate from real payloads. | ✅ D (2026-10-01) |
| 54 | `CollabDetail.tsx:107` | "Deal history will appear here" placeholder while the API already returns the data. | Query it or hide the panel. | D |
| 55 | `api/messages/unread/route.ts:4,17` · `conversations/route.ts:50` · `wiredLater/features/messaging.md:223` | Docstrings + spec still say `useUnreadBadge` (deleted in the Messages rename) and "every 6s" (real: `useMessages`, 30s). | Correct all three. | ✅ D (2026-10-01) |
| 56 | `lib/fanShellData.ts:25` | Comment claims scheduling is filtered server-side; it's client-side. | Fix the comment. | ✅ D (2026-10-01) |
| 57 | `ItemCards.tsx:88-94` | Unreachable "Messages is coming soon" toast branch. | Delete. | ✅ D (2026-10-01) |
| 58 | `FanHomeTab.tsx:186-231,267-282` | "Your activity" section renders with no rows; announcements section is copy-only. | Gate on data; hide placeholders. | ✅ D (2026-10-01) |
| 59 | `FanSettingsTab.tsx:32-34` | `notify/setNotify` declared, never read. | Delete. | ✅ D (2026-10-01) |
| 60 | `CreatorHeader.tsx:19` | Unused `fanCount` prop documented as "server-resolved". | Remove. | ✅ D (2026-10-01) |
| 61 | `FanConnectTab.tsx:133` | Dot highlight indexes `partners`, cards index `weightedPartners` → wrong dot lit when any deal has weight 2. | Derive both from the same list. | D |
| 62 | `FanConnectTab.tsx:229` | "1 channels". | Shared plural helper. | ✅ D (2026-10-01) |
| 63 | `api/messages/communities/[id]/channels/route.ts:55` | Hardcoded `memberCount: 0` (unused). | Compute or drop. | ✅ D (2026-10-01) |
| 64 | `screens/fan/partner/Screen.tsx:38-40` | No schedule filter (guest page filters client-side) → scheduled items leak onto partner pages. | Same filter server-side. | ✅ D (2026-10-01) |
| 65 | `GuestPageContent.tsx:70` | `JSON.parse(pending)` without try/catch → a corrupt value throws out of the effect. | try/catch. | D |
| 66 | `screens/public/landing/Screen.tsx:130` | Demo CTA falls back to a hardcoded username that may not exist. | Hide if unknown. | D |
| 67 | `ActivityTimeline.tsx:69` · `ItemCards.tsx:213` | Timestamps hand-formatted; no `formatDateTime`/`formatCountdown` in `lib/format.ts`. | Add the helpers, use them. | ✅ D (2026-10-01) |
| 68 | `SearchBox.tsx:34` · `MessagesShell.tsx:755` · `BillboardEditor.tsx:149` | 3 inline `<Loader2>` spinners; `shared/Spinner` exists. | Use it. | ✅ D (2026-10-01) |
| 69 | `FanProfileDrawer.tsx:96` · `FanListTable` | Hand-rolled "Loading..." blocks; `shared/EmptyState` exists. | Use it. | PARTIAL (2026-10-01) |
| 70 | `FanAuthModal.tsx:67-79` · `FanProfileDrawer.tsx:67,79` · `FanSettingsTab.tsx:58` | 3 raw `fetch` sites that never read `res.ok` (25 files use `fetchJson`). | `fetchJson`. | ✅ C (2026-10-01) |
| 71 | `EarningsSummary.tsx:36-44` · `hooks/usePlaygroundForm.ts:138-144` | Two hand-rolled re-implementations of `fetchJson`. | Use `fetchJson`. | ✅ C (2026-10-01) |
| 72 | `layout/MyPeeps.tsx:57` vs `MessagesShell.tsx:136` | 30s poll interval written twice, no shared constant. | One `POLL_MS`. | D |
| 73 | `layout/MyPeeps.tsx:17-31` | `partners/fans/staff` fetched and polled, never rendered. | Drop from the response or render. | D |
| 74 | `screens/public/landing/Screen.tsx:54,80` | `slice(0, 12)` twice for unrelated things. | Named constants. | ✅ D (2026-10-01) |
| 75 | `api/messages/conversations/route.ts:33,104` | Redundant `!left_at` filter after `.is("left_at", null)`; `memberCount` re-filters. | Delete. | ✅ D (2026-10-01) |

---

## Still open (deliberately not fixed here)

| # | Finding | Why it's open |
|---|---|---|
| 46 | Export "last purchase" ordering | **Audit false positive** — both queries already `.order(desc)`. |
| 49 | Limits hardcoded in UI copy ("max 60 chars", "up to 3") | Cosmetic; the enforced `maxLength` values already read `BILLBOARD_LIMITS` where it matters. |
| 52 | Fan-list Subscribers/Referred chips | Needs a subscriptions source — feature work, not a bug. |
| 54 | CollabDetail "Deal history will appear here" | Needs a query by partner to be worth showing; a placeholder until then. |
| 61 | FanConnectTab billboard dot index | Off-by-one only when a deal has weight 2 — cosmetic. |
| 65 | `JSON.parse(pending)` in GuestPageContent | Needs a try/catch on a corrupt localStorage value — real but cosmetic. |
| 66 | Landing demo-CTA fallback username | Hardcoded demo creator; should hide when unknown. |
| 69 | Hand-rolled loading blocks | `FanProfileDrawer` now uses `Spinner`; `FanListTable` still has its own. |
| 72 | 30s poll interval written twice | Now documented as intentional in both files; a shared constant is optional. |
| 73 | `peeps` returns partners/fans/staff the dock never renders | Either render them or trim the payload — product decision. |
| 77 | Export ordering | **Audit false positive** — see #46. |

**No HIGH or MED finding is left open.** Every HIGH and MED row above is ticked, plus all but ~10 LOW cleanups.

---

## Verified clean (no action — keep it that way)

`page_views` pipeline · billboard ↔ editor (all 11 keys + shared limits) · affiliate deals/earnings/discover/links response shapes · staff members + permissions · collab flows + error-string parity · auth forms (availability race guard, no-enumeration) · `fetchJson` contract · pageview tracker · `resolveFanShellData` ↔ `FanShellData` field-for-field · fan partners/partner-data/follow/purchases/checkout response shapes · messages conversations/messages/requests/preferences/upload · `money()`/`formatDate`/`formatDealRate`/`BILLBOARD_LIMITS`/`ROLE_LABELS`/`Avatar`/`CountPill`/`EmptyState`/`SearchBox`/`Sheet`/`Spinner`/`cardRadius`/`buttonClass` singletons · `enforceRateLimit` IP handling.

## Orphan routes (built, never called — future wiring, not bugs)

`GET /api/fan/purchases` · `POST /api/fan/content/access` (the real Three-Gates + signed-URL implementation — unused by `ItemCards`, which is finding #1) · `GET /api/fan/content/list` · `POST /api/push/subscribe` · `POST /api/push/send` · `rpc get_creator_stats` + `get_creator_analytics` (the canonical revenue/install counters, 0 live callers).

## Not audited (out of scope, for the record)

`src/old-code/` · mock store internals beyond the RPCs quoted here · real-Supabase behavior (no DB exists yet) · performance · accessibility beyond the responsive matrix.
