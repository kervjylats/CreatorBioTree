# BUILD_PLAN — Complete Phase F Wiring (All-Mock)

> **Purpose:** the master execution plan for wiring ALL remaining screens/features in mock mode. Read this first, then execute sheet-by-sheet, checking `[x]` off each item. After EVERY sheet: `npm.cmd run typecheck` (0) + `npm.cmd run lint` (0 errors, 3 pre-existing warnings OK) + `python scripts/check-docs.py` (PASS).
>
> **Rules:**
> - Wire from specs in `src/wiredLater/` ONLY. Old code is reference-only (`src/old-code/`).
> - Mock mode always on (`USE_MOCKS=true`). No real external services.
> - Never touch upload route or mock files unless asked.
> - Do NOT commit until founder says so.
> - Dev server logs: `C:\Users\rowlu\AppData\Local\Temp\opencode\dev-err.log` / `dev-out.log`.
> - Use `npm.cmd` not `npm` for commands.

---

## Phase 0 — Fix 6 Review Findings

- [x] **#1 (Medium) Fan allow-anyone gate:** `src/app/api/chat/conversations/route.ts:147` — the allow-anyone gate only checks `ownerPrefs.allow` (creator side). Add the SAME gate for fan recipients: when the recipient is a fan, check `getPrefs(fanKey).allow` before allowing the conversation creation.
- [x] **#2 (Medium) purchases/complete guard:** `src/app/api/fan/purchases/complete/route.ts` — add `if (process.env.USE_MOCKS !== "true") return 501` guard at the top (no payment verification in mock = fine; real mode must verify PayPal webhook signature).
- [x] **#3 (Low) hasExistingConversation dead code:** `src/lib/chat.ts` — `hasExistingConversation` is imported but unused AND doesn't filter `left_at`. Either remove the import from `conversations/route.ts` (preferred — `findDirect` already does the job) or align `hasExistingConversation` with `findDirect` (filter `left_at IS NULL`).
- [x] **#4 (Low) isFanOf email coupling:** `src/app/api/chat/conversations/route.ts` — `isFanOf(me.displayName, creatorId)` passes `me.displayName` as the fan email. Fix: look up the fan's actual email from `fan_accounts` row, or pass the correct identifier. Fragile coupling — `displayName` is NOT guaranteed to be an email.
- [x] **#5 (Low) blocks default party:** `src/app/api/chat/blocks/route.ts` — defaults `blocked_party` to `"creator"`. When a fan blocks a creator, this should be `"fan"`. Fix: derive from the auth identity (if `fan_session` → `"fan"`, if `mock_auth_uid` → `"creator"`), or accept it as a request body field.
- [x] **#6 (Low) ChatIcon dead button:** `src/components/chat/ChatShell.tsx` — the "Open full" button in `ChatIcon` is permanently hidden (`{false && ...}`). Either unhide it (wire to open the full inbox) or remove the dead code entirely.

---

## Phase 1 — Dead File Cleanup

- [x] **Delete `src/components/branding/`** — 2 duplicate stubs (`ElementPopover.tsx`, `PreviewStateToggle.tsx`). The real wired versions live in `src/components/my-app/`.
- [x] **Delete `src/components/creator-dashboard/`** — empty directory.
- [x] **Delete 17 dead catalog editor stubs** in `src/components/my-app/catalog/`:
  - `BundleEditor.tsx`, `CatalogManager.tsx`, `CountdownField.tsx`, `CourseEditor.tsx`, `CoverUploader.tsx`, `FileEditor.tsx`, `LinkEditor.tsx`, `LiveEditor.tsx`, `MembershipEditor.tsx`, `MessagingEditor.tsx`, `NewsletterEditor.tsx`, `PhysicalEditor.tsx`, `ProductEditor.tsx`, `SessionEditor.tsx`, `TipJarEditor.tsx`
  - **KEEP** `AddItemPicker.tsx`, `ItemEditor.tsx`, `PricingEditor.tsx`, `FileUploadField.tsx` (these are the live generic editors).
- [x] **Remove dead `editor` field** from `src/types/contentTypes.ts` — the `editor: "…Editor"` string metadata is no longer consumed by any live code (ItemEditor is generic).
- [x] **Delete `src/components/my-app/MyAppInfoBanner.tsx`** if unimported (verify with grep first).
- [x] **Verify `src/lib/themePresets.ts`** — keep if imported by DesignTab; delete if dead.

---

## Phase 2 — Remove Mock Auto-Login

- [x] **Delete the auto-provision block in `src/proxy.ts`** — the section that auto-creates sessions for `/dashboard*` (test creator) and `/admin*` (admin). Keep `seedMockAdmin()` so `admin@creatorpwa.app` exists and can log in via `/login`.
- [x] **Re-test:** `/login` with `admin@creatorpwa.app` → `/admin`; any email+password → onboarding → `/dashboard/my-app`. Login/onboarding/forgot-password must work from scratch.
- [x] **Verify:** visiting `/dashboard/my-app` without a session cookie redirects to `/login` (not auto-logs-in).

---

## Phase 3 — Wire Remaining Sheets

### 3a. Sheet 11 — Search (shared component)

> **Spec:** `src/wiredLater/features/search.md`
> **Components:** `SearchBar` + `CreatorResultCard` (build shared, reused by Network + landing later)
> **Route:** `GET /api/search/creators` (already 501 stub)
> **Depends on:** nothing (first sheet, low dependency)

- [x] **Wire `src/app/api/search/creators/route.ts`** — `GET` with `q` query param, filter `creators` where `is_discoverable = true` AND (`username ILIKE %q%` OR `display_name ILIKE %q%`), return top 20 results. Use the mock store query pattern.
- [x] **Wire `src/components/search/SearchBar.tsx`** — input with debounce, calls `/api/search/creators?q=...`, shows `CreatorResultCard` results. Shared component (export for reuse in Network).
- [x] **Wire `src/components/search/CreatorResultCard.tsx`** — card showing avatar, display name, username, tagline, "Visit" button linking to `/{username}`.
- [x] **Wire `src/screens/public/search/Screen.tsx`** — page wrapper rendering `SearchBar` centered on the page. Metadata: title "Search Creators".
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3b. Sheet 8 — Admin

> **Spec:** `src/wiredLater/screens/admin/admin.md`
> **Components:** StatsCards, CreatorsTable, AccountsTable, AuditLog, APIKeys
> **Routes:** All 7 admin routes already LIVE (`/api/admin/*`)
> **Depends on:** nothing (routes are live)

- [x] **Wire `src/screens/admin/Screen.tsx`** — admin dashboard page. Layout: tabbed interface with 5 sections (Overview, Creators, Staff Accounts, Audit Log, API Keys). Use `requireAdmin()` guard.
- [x] **Wire `src/components/admin/StatsCards.tsx`** — 4 stat cards (total creators, total fans, total revenue, active staff). Read from mock store counts.
- [x] **Wire `src/components/admin/CreatorsTable.tsx`** — table of all creators with columns: name, email, link address, created_at, status. Fetch from `GET /api/admin/creators`. Include search/filter.
- [x] **Wire `src/components/admin/AccountsTable.tsx`** — staff accounts management. Fetch from `GET /api/admin/accounts`. Show email, role, created_at. Include "Invite staff" button that calls `POST /api/admin/accounts` with email + role.
- [x] **Wire `src/components/admin/AuditLog.tsx`** — chronological log of admin actions. Fetch from `GET /api/admin/accounts` (activity). Show action, actor, timestamp.
- [x] **Wire `src/components/admin/ApiKeysPanel.tsx`** — API key management (list + create). Fetch from `GET /api/admin/api-keys` (or stub). Show key name, created, last used. "Create key" button.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3c. Sheet 9 — Settings

> **Spec:** `src/wiredLater/screens/creator-dashboard/settings/settings.md`
> **Components:** ProfileSection, PaymentsPanel (PayPal mock), Notifications, MessagingPrivacy, DangerZone
> **Routes:** `profileUpdateService` LIVE, `/api/creator/settings` may need creation
> **Depends on:** nothing

- [x] **Wire `src/screens/creator/settings/Screen.tsx`** — settings page with 5 sections. Use `requireAuth()`.
- [x] **Wire `src/components/settings/ProfileSection.tsx`** — display name + tagline edit. Save via `profileUpdateService` or `PATCH /api/creator/profile`.
- [x] **Wire `src/components/settings/PaymentsPanel.tsx`** — PayPal connect panel (mock). Show "Connect PayPal" button (mock: sets `paypal_account_id` on creator row). Show connected status. Per `settings.md` Part 2: payout rail = creator's PayPal balance.
- [x] **Wire `src/components/settings/NotificationsSection.tsx`** — push notification preferences (bell toggle, email digest). Local state in mock.
- [x] **Wire `src/components/settings/MessagingPrivacy.tsx`** — "Allow messages from anyone" toggle. Save via `PATCH /api/chat/preferences`. Show allow/deny state.
- [x] **Wire `src/components/settings/DangerZone.tsx`** — account deletion, export data. Stub actions in mock (show confirmation dialog, log to console).
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3d. Sheet 10 — Overview

> **Spec:** `src/wiredLater/screens/creator-dashboard/overview/overview.md`
> **Components:** StatCards, ActivityTimeline, SetupChecklist, QuickActions, QRCard, FanExportButton
> **Routes:** `GET /api/creator/activity` LIVE, `get_creator_stats` RPC (mock zeros)
> **Depends on:** nothing

- [x] **Wire `src/screens/creator/overview/Screen.tsx`** — overview/dashboard page. Use `requireAuth()`.
- [x] **Wire `src/components/overview/StatCards.tsx`** — 4 stat cards (sales $, total fans, page views, subscribers). Fetch from `get_creator_stats` RPC or compute from mock store.
- [x] **Wire `src/components/overview/ActivityTimeline.tsx`** — recent activity feed (new followers, purchases, messages). Fetch from `GET /api/creator/activity`. Show action, timestamp, details.
- [x] **Wire `src/components/overview/SetupChecklist.tsx`** — onboarding checklist: "Set up your profile" → `/dashboard/settings`, "Create your first item" → `/dashboard/my-app`, "Customize your design" → `/dashboard/my-app` (design tab), "Share your page" → QR. Check off completed steps.
- [x] **Wire `src/components/overview/QuickActions.tsx`** — action buttons: "Edit My App" → `/dashboard/my-app`, "Install my fan app" → PWA install trigger, "View my page" → `/{username}` (open in new tab), "Share page" → copy link.
- [x] **Wire `src/components/overview/QrCard.tsx`** — QR code for the creator's fan page. Generate inline (simple QR lib or SVG pattern). Include download button.
- [x] **Wire `src/components/overview/FanExportButton.tsx`** — CSV export of fan list. Call `GET /api/creator/fans/export`, download as CSV. Columns: email, joined, referred_by, lifetime_value, last_purchase.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3e. Sheet 13 — Partnerships

> **Spec:** `src/wiredLater/features/partnership.md`
> **Components:** PartnerInviteCard
> **Routes:** `GET /api/creator/partners/invite` (501 stub), `POST /api/creator/partners/onboarding` (501 stub)
> **Tables:** `partnerships` (+ `source` column: `invited` | `collab`), `partner_invites`
> **Depends on:** tables exist (mock store has `partnerships`)

- [x] **Wire `GET /api/creator/partners/invite`** — generate a 7-day single-use invite code, store in `partner_invites` table, return `{ code, url }` (url = `/${username}?invite=CODE`). If active invite exists, return it instead of creating new.
- [x] **Wire `POST /api/creator/partners/onboarding`** — called during onboarding when `?invite=CODE` is present. Validate code (not expired, not used), create `partnerships` row with `source: "invited"`, mark invite as used. Return partner info.
- [x] **Wire `src/components/partnership/PartnerInviteCard.tsx`** — share card showing the invite link + copy button + "Share via message" action. Display the link URL, expiration info.
- [x] **Update `src/components/auth/OnboardingForm.tsx`** — when `?invite=` is present, capture the invite code and call `POST /api/creator/partners/onboarding` after successful registration.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3f. Sheet 14 — Relationships / My Peeps

> **Spec:** `src/wiredLater/features/relationships.md`
> **Components:** MyPeeps (umbrella), FanListTable, FanProfileDrawer
> **Routes:** `GET /api/creator/fans/list` (LIVE), `GET /api/creator/fans/export` (LIVE), `GET /api/creator/relationships` (501 stub), `GET /api/creator/fans/[id]` (501 stub), `PATCH /api/creator/fans/[id]` (501 stub)
> **Depends on:** messaging (ChatShell for profile drawer chat history)

- [x] **Wire `GET /api/creator/relationships`** — return umbrella counts: `{ partners: N, fans: N, staff: N }`. Query mock store for each.
- [x] **Wire `GET /api/creator/fans/[id]`** — return fan profile: fan_account row + purchases + subscription + installs + recent messages (last 10 from ChatShell).
- [x] **Wire `PATCH /api/creator/fans/[id]`** — update `do_not_contact` flag and `notes` field on `fan_accounts` row.
- [x] **Wire `src/components/relationships/MyPeeps.tsx`** — umbrella component showing 3 count cards (Partners / Fans / Staff). Each card is tappable to expand the respective list. This lives in the Network right rail (Sheet 18).
- [x] **Wire `src/components/relationships/FanListTable.tsx`** — table of fans with columns: email, joined date, referred_by, status chip (New/Paid/Subscriber/Follower), lifetime_value, last_purchase. Include quick filters (All, New, Paid, Subscribers, Followers, Referred). Include CSV export button.
- [x] **Wire `src/components/relationships/FanProfileDrawer.tsx`** — slide-out drawer showing fan detail: email, tier, purchases list, subscription status, install/activity history, message history (ChatShell `ChatThread` embedded). Include `do_not_contact` toggle and notes textarea.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3g. Sheet 15 — Team

> **Spec:** `src/wiredLater/features/team.md`
> **Components:** TeamRow, PermissionsToggles, InviteEmail, ContextSwitcher
> **Routes:** 8 routes under `/api/creator/team/*` (all 501 stubs)
> **Tables:** `creator_team_members`, `creator_team_invites`, `creator_team_activity`
> **Depends on:** tables exist (mock store)

- [x] **Wire `POST /api/creator/team/invite`** — create invite row in `creator_team_invites` with email + role + 7-day expiry. Return invite link.
- [x] **Wire `GET /api/creator/team/invites`** — list pending invites for this creator.
- [x] **Wire `POST /api/creator/team/invites/accept`** — validate invite code, create `creator_team_members` row, mark invite accepted.
- [x] **Wire `GET /api/creator/team/members`** — list team members with roles + permission toggles.
- [x] **Wire `PATCH /api/creator/team/members/[id]`** — update permission toggles (Content/Stats/Relationships/Messages/Community/Network/Settings/Money — all OFF by default; Settings+Money default OFF with warning).
- [x] **Wire `DELETE /api/creator/team/members/[id]`** — remove team member.
- [x] **Wire `GET /api/creator/team/activity`** — audit log of team actions (owner-only).
- [x] **Wire `GET /api/creator/team/contexts`** — context switcher data (creator can switch between managing their own app + team-managed apps).
- [x] **Wire `src/components/team/TeamRow.tsx`** — row in My Peeps Staffs list: avatar, name, email, role, permission count, actions (edit/remove).
- [x] **Wire `src/components/team/PermissionsToggles.tsx`** — toggle grid for the 8 permission categories. Each is an on/off switch. Settings+Money show a warning note.
- [x] **Wire `src/components/team/InviteEmail.tsx`** — email input + role select + "Send invite" button. Calls `POST /api/creator/team/invite`.
- [x] **Wire `src/components/team/ContextSwitcher.tsx`** — dropdown to switch between own creator context and team-managed contexts. Shows in sidebar or top bar.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3h. Sheet 16 — Affiliates + Mock Settlement

> **Spec:** `src/wiredLater/features/network.md` §7 + `src/wiredLater/monetization/creators.md` Part 2
> **Components:** AffiliateDealForm, EarningsSummary, AffiliateDiscover, AffiliateLinks
> **Routes:** 7 routes under `/api/creator/affiliates/*` (all 501 stubs)
> **Tables:** `affiliate_deals`, `affiliate_attributions`, `affiliate_conversions` (+ settlement fields), `affiliate_links`
> **Depends on:** tables exist, network layout (Sheet 18) for placement

- [x] **Wire `GET /api/creator/affiliates/deals`** — list deals where user is owner or promoter.
- [x] **Wire `POST /api/creator/affiliates/deals`** — create deal: validate fields, store in `affiliate_deals` (immutable). Fields: `owner_id`, `promoter_id`, `scope` (item|creator), `item_id?`, `deal_type` (percentage|fixed|free|tiered|custom), `trigger` (purchase|follow|subscribe|tip|signup|any), `rate?`, `custom_terms?`, `valid_from?`, `valid_until?`.
- [x] **Wire `PATCH /api/creator/affiliates/deals/[id]`** — update status only (active|paused|expired|revoked). Deal terms are immutable after creation.
- [x] **Wire `DELETE /api/creator/affiliates/deals/[id]`** — revoke deal (set status = "revoked").
- [x] **Wire `GET /api/creator/affiliates/earnings`** — return earnings summary: settled total, pending total, conversions list. Query `affiliate_conversions` for this creator as promoter.
- [x] **Wire `GET /api/creator/affiliates/discover`** — browse available deals from other creators (creators with active deals where user could be promoter).
- [x] **Wire `POST /api/creator/affiliates/links`** — generate affiliate link for a deal (creates `affiliate_links` row with unique `ref_code`).
- [x] **Wire `GET /api/creator/affiliates/links`** — list active affiliate links for this creator.
- [x] **Wire `PATCH /api/creator/affiliates/links/[id]`** — toggle link active/inactive.
- [x] **Wire mock Settlement Engine** in `src/lib/mocks/mockPayments.ts` — when a `fan_purchases` row is created, check if the item has an `affiliate_enabled` flag and a matching deal. If so, compute `owner_cut` and `promoter_cut` per deal rules, write `affiliate_conversions` row with `settle_method: "auto_split"` and `settlement_status: "settled"` (mock = instant settlement). External-link items are excluded (quarantine rule).
- [x] **Wire `src/components/affiliates/AffiliateDealForm.tsx`** — deal creation form: select collaborator, scope (per-item or per-creator), deal type, trigger, rate/amount, custom terms, validity dates. Show external-link quarantine warning when selecting items with `payment_handling: "external_link"`.
- [x] **Wire `src/components/affiliates/EarningsSummary.tsx`** — earnings dashboard: settled vs pending amounts, conversion count, per-deal breakdown.
- [x] **Wire `src/components/affiliates/AffiliateDiscover.tsx`** — browse available deals from other creators. Show deal card with creator name, deal terms, "Create link" button.
- [x] **Wire `src/components/affiliates/AffiliateLinks.tsx`** — list of active links: deal info, link URL, copy button, toggle active/inactive.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3i. Community (Messaging Part 3)

> **Spec:** `src/wiredLater/features/messaging.md` Part 3
> **Tables:** `communities` table already in mock store
> **Depends on:** messaging engine (Sheet 12, done), groups (Part 4, done)

- [x] **Wire community routes:**
  - `POST /api/chat/communities` — create community (creator only, one per creator in v1). Fields: name, icon, join_rule (open|fans_partners|invite_only). Auto-create 4 default channels (General, Announcements, VIPs, Partner collab) as `conversations` with type `community_chat`.
  - `GET /api/chat/communities` — get creator's community (or fan's joined community).
  - `POST /api/chat/communities/join` — fan joins community. Check join_rule: open = auto-join; fans_partners = check follow/partner status; invite_only = check invite.
  - `POST /api/chat/communities/leave` — fan leaves community.
  - `GET /api/chat/communities/[id]/channels` — list channels with access check (open channels visible to all; restricted channels only for members with correct role).
  - `PATCH /api/chat/communities/[id]/channels/[channelId]` — creator: rename, toggle announcements-only, toggle restricted, assign roles.
  - `POST /api/chat/communities/[id]/members` — creator: add member, assign role (Member/VIP/Partner).
  - `DELETE /api/chat/communities/[id]/members/[key]` — creator: remove member.
- [x] **Update fan Home tab** (`src/components/fan-pwa/FanHomeTab.tsx`) — add "Community" section below spotlight. Show community name + branding, join/leave button, channel list (open = clickable, restricted = lock icon). Hidden when creator has no community.
- [x] **Update guest page** (`src/components/fan-pwa/GuestPageContent.tsx`) — add "Join the community" CTA card below the 3-layer view. Tap → fan-auth modal → on success, redirect to Home tab community section.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3j. Sheet 18 — Network (3-Section Layout)

> **Spec:** `src/wiredLater/screens/creator-dashboard/network/network.md`
> **Layout:** 3-section anchored: LEFT rail (Discover + Affiliates) · CENTER detail · RIGHT rail (My Peeps)
> **Components:** NetworkPage, MyPeeps, CollabList, CollabDetail, DiscoverCreators, BillboardEditor, BillboardCard + chat icons
> **Routes:** Partners family (request/respond/list/discoverable/billboard), collab routes
> **Depends on:** Sheets 11 (search), 13 (partnerships), 14 (relationships), 15 (team), 16 (affiliates), 12 (chat icons)

- [x] **Wire `src/screens/creator/network/Screen.tsx`** — network page with 3-section anchored layout (CSS grid: left 250px, center 1fr, right 300px). Use `requireAuth()`.
- [x] **Wire left rail:**
  - `src/components/network/DiscoverCreators.tsx` — search input (reuses `SearchBar` from Sheet 11) + results list of discoverable creators. Show avatar, name, "Connect" button (friend request).
  - Affiliates section (reuses `AffiliateDiscover` + `AffiliateLinks` from Sheet 16).
- [x] **Wire center detail:**
  - `src/components/network/CollabList.tsx` — list of collab connections (accepted friend requests). Show avatar, name, status, chat icon (ChatShell).
  - `src/components/network/CollabDetail.tsx` — detail view when a collab is selected: profile info, shared content, partnership stats, deal history, chat thread.
  - `src/components/network/BillboardCard.tsx` — rotating partner billboard (auto-rotates partners with active deals at 2x weight; shows partner names underneath).
  - `src/components/network/BillboardEditor.tsx` — edit billboard settings (select featured partners, rotation speed).
- [x] **Wire right rail:**
  - `src/components/network/InboxRequests.tsx` — collab requests inbox (pending friend requests). Show avatar, name, "Accept"/"Decline" buttons.
  - My Peeps umbrella (reuse from Sheet 14: `MyPeeps` → `FanListTable` → `FanProfileDrawer` + `TeamRow` → `PermissionsToggles`).
- [x] **Wire partner routes:**
  - `POST /api/creator/partners/request` — send collab request (friend request). Store in `partnerships` with `source: "collab"` and status `pending`.
  - `POST /api/creator/partners/respond` — accept/decline collab request. Update status.
  - `GET /api/creator/partners/list` — list all partnerships (both invited and collab sources).
  - `GET /api/creator/partners/discoverable` — list discoverable creators for the left rail.
  - `GET /api/creator/partners/billboard` — get billboard configuration.
  - `PUT /api/creator/partners/billboard` — update billboard configuration.
- [x] **Add chat icons** next to creator names in CollabList, DiscoverCreators, and CollabDetail (reuse `ChatIcon` from ChatShell).
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3k. Sheet 20 — Partner Page + Connect Billboard

> **Spec:** `src/wiredLater/features/partner-page.md`
> **Entry:** `src/screens/fan/partner-page/Screen.tsx` + `src/app/(fan)/[username]/partner/[partnerUsername]/page.tsx`
> **Depends on:** fan shell (Sheet 21-V1, done), messaging (Sheet 12, done)

- [x] **Wire `src/screens/fan/partner-page/Screen.tsx`** — partner profile page (fan-auth gate). Show partner's branding, featured items, social links, follow button. 4-element view (avatar + name + items + artist links).
- [x] **Wire `src/app/(fan)/[username]/partner/[partnerUsername]/page.tsx`** — thin page re-export from Screen.
- [x] **Update fan Connect tab** (`src/components/fan-pwa/FanConnectTab.tsx`) — implement smart live-stack: Partner Billboard (rotate partners with active deals at 2x weight) → All Partners/Followed mini-spotlight cards → Community deep-link → Artist Links → empty-state text (`connect_empty_text`). Each section renders ONLY if it has data.
- [x] **Add partner modal** — when a fan taps a partner card in Connect tab, open a modal showing the partner's profile (follow/unfollow + partner catalog). This is the one surface that keeps the partner's own Artist Links in the 4-element view.
- [x] **Gates:** typecheck + lint + check-docs PASS.

### 3l. Sheet 22 — Offline

> **Spec:** `src/wiredLater/screens/public/offline.md`
> **Entry:** `src/screens/public/offline/Screen.tsx` + `src/app/(public)/offline/page.tsx`
> **Depends on:** nothing

- [x] **Wire `src/screens/public/offline/Screen.tsx`** — offline app-shell page. Show: "You're offline" message + icon + list of 3 PWAs (Platform Dashboard, Creator Fan App, per-creator app) with "installed" status. Show localStorage outbox status (pending messages/drafts count). Include "Retry" button.
- [x] **Verify `src/app/(public)/offline/page.tsx`** — thin re-export from Screen.
- [x] **Gates:** typecheck + lint + check-docs PASS.

---

## Phase 4 — Rewrite TESTING.md

- [x] **Rewrite `TESTING.md`** with full end-to-end, all-roles checklist covering:
  1. **Guest/Visitor** — browse guest page, see catalog, follow (email-only), community CTA
  2. **Follower** — personalized guest page, "Following ✓", notify toggle, free-gated unlock
  3. **Fan** — signup → 4-tab app, content with gates, purchases, messaging
  4. **Member** — subscription unlock, member-only content
  5. **Buyer** — PayPal mock checkout, receipts, access
  6. **Creator** — onboarding → My App (identity/design/catalog/upload all 16 types/deploy), overview, settings, network, messages
  7. **Admin** — login as `admin@creatorpwa.app`, RBAC, creators table, staff invites, audit log, API keys
  8. **Staff admin** — invited by admin, limited permissions, audit trail
  9. **Team member** — creator invites staff, permission toggles, context switcher
  10. **Partner** — `?invite=CODE` → signup → auto-connected
  11. **Collab** — in-app friend request → accept → connected
  12. **Affiliate** — deal creation → link generation → attribution → settlement (mock)
  13. **Community** — join channels, roles, announcements-only, moderation

---

## Explicitly Deferred (NOT built — documented here)

- **Landing page** (`/`) — post-launch polish pass. Keep naked.
- **Founder setup** (`/founder/setup?token=`) — spec only, skip Phase F.
- **AI Copilot** — post-launch.
- **Real external services** — PayPal/Resend/Groq/Paddle stay mock.
- **Real push broadcasts** — mock infra only.
- **Claim purchases** — fan Settings claim flow (Layer 4).
- **Per-tab theming** — touch-native extensions.
- **Editor options B/C/D** — My App editor alternatives (A is live).

---

## Verification Checklist (after every sheet)

```bash
npm.cmd run typecheck        # 0 errors
npm.cmd run lint             # 0 errors (3 pre-existing warnings OK)
python scripts/check-docs.py # PASS
```

---

*This plan is the single source of truth for Phase F execution. Check items off as done. After all items are checked, the final step is writing the test checklist (Phase 4) and running the full smoke test.*
