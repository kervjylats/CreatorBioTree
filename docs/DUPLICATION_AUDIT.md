# Duplication Audit — live code

Full project sweep (2026-09-29) for code written inline instead of importing a shared file, and the same logic re-implemented independently in 2+ places (drift risk).

**Scope:** `src/app`, `src/components`, `src/screens`, `src/hooks`, `src/lib`, `src/services`.
**Excluded:** `src/old-code/` (archive), `src/wiredLater/` (specs), `docs/`, `node_modules`, `.next`.

**Status legend:** Phase 1 = sync fixes ✅ (2026-09-29) · Phase 2 = dedupe batch ✅ (2026-09-29 — see BACKLOG for skips) · ✅ already shared (no action).

---

## High severity — drift already happening

| # | What | Where | Should use | Phase |
|---|---|---|---|---|
| 1 | **Affiliate rate display bug** — `AffiliateDiscover` does `$${(rate/100).toFixed(2)}` but the form stores dollars → a **$5 deal renders "$0.05"** in Discover and "$5" in Your Deals | `network/AffiliateDiscover.tsx:27-31` vs `network/YourDealsCard.tsx:34-39` | one shared formatter (create) | **1** |
| 2 | **`getInitials` written 7×** beside its shared home | shared: `lib/fan-helpers.ts:7-14`. Hand-rolled: `messages/MessagesShell.tsx:124-131`, `network/BillboardPreview.tsx:33-38`, `network/NetworkPage.tsx:287`, `circle/partners/CollabDetail.tsx:83-89`, `circle/partners/CollabList.tsx:87-93`, `circle/partners/InboxRequests.tsx:98-104`, `fan-pwa/FanConnectTab.tsx:112-117` (same file already imports it) | `@/lib/fan-helpers` → `getInitials()` | **1** |
| 3 | **`INPUT_CLASS` ×10 in one file** | shared: `lib/ui-constants.ts:7` (docstring names ItemEditor). Hand-rolled: `my-app/catalog/ItemEditor.tsx:32` (local const) + raw literal ×9 (`:82,92,104,518,527,540,552,567,578`) | `@/lib/ui-constants` → `INPUT_CLASS` | **1** |
| 4 | **Logo rendered 3× differently** | `auth/AuthCard.tsx:15` (`<Trees size={32}>`), `screens/public/landing/Screen.tsx:27` (`<Trees size={20}>`), `layout/DashboardSidebar.tsx:49` (`🌳 CreatorBioTree` text) | shared `<Logo>` component (create) | **1** |
| 5 | **`social_links` → `artistLinks[]` mapping ×3** | `lib/fanShellData.ts:83-85` (filters empties), `my-app/previewData.ts:43-45`, `screens/fan/partner-page/Screen.tsx:46-51` (**omits `.filter(Boolean)`** → blank links render there only) | shared `socialLinksToArtistLinks()` (create in `lib/branding.ts`) | **1** |
| 6 | **Creator search hand-rolled ×2** | `network/NetworkPage.tsx:173` (live search box) + `network/AffiliateDealForm.tsx:93` (resolve-on-submit) each fetch `/api/discover/creators` inline; the old shared `useCreatorSearch` was deleted 2026-09-28 | `hooks/useCreatorSearch` + `components/shared/SearchBox` (create) | **1** |
| 7 | **"Follow with email" flow ×3** | `fan-pwa/FollowBox.tsx:70-93`, `fan-pwa/GuestPageContent.tsx:97-110`, `messages/MessagesShell.tsx:894-897` — POST `/api/fan/follow-creator` + toast + reload (copy/timing already differ) | shared `submitFollow()` helper | 2 |
| 8 | **fetch → json → "Failed to load X" boilerplate ×19** | admin/StatsCards, CreatorsTable, AccountsTable, ApiKeysPanel, ServiceAccessDialog, ExternalServicesPanel, overview/StatCards, ActivityTimeline, QrCard, settings/ProfileSection, YourPageSection, PaymentsPanel, MessagingPrivacy, layout/MyPeeps, network/NetworkPage, circle/fans/FanListTable, FanProfileDrawer, circle/staff/StaffPage, circle/partners/CollabDetail | `lib/fetchJson.ts` or `useFetchJson` (create) | 2 |

## Medium severity

| # | What | Where | Should use | Phase |
|---|---|---|---|---|
| 9 | **Money formatting ×3 conventions** | (a) `money()` Intl in `fan-pwa/fanData.ts:72-81` — but `PartnerBody.tsx:127` does raw `price.toFixed(2)`; (b) cents→dollars inline in overview/StatCards:48, admin/StatsCards:32, AffiliateDiscover:29; (c) private `formatCurrency` in EarningsSummary:27 | `money()` + one cents formatter | 2 |
| 10 | **`contentService.getForCreator()` zero callers** | shared exists `services/contentService.ts:29-42`; hand-rolled identical queries: `lib/fanShellData.ts:77-81`, `screens/fan/partner-page/Screen.tsx:38-42`, `app/api/fan/content/list/route.ts:18` | `contentService.getForCreator()` | 2 |
| 11 | **Username regex ×3** | `auth/OnboardingForm.tsx:21`, `app/api/creator/check-username/route.ts:6`, `app/api/creator/register/route.ts:5` (`^[a-z0-9_]{3,20}$`) + slug cleaner `OnboardingForm.tsx:91` | `lib/username.ts` (create) | 2 |
| 12 | **Admin role labels drifted** | `admin/AccountsTable.tsx:29-34` ("Support Admin") vs `admin/ServiceAccessDialog.tsx:21-26` ("Support") | shared label map | 2 |
| 13 | **Rate-limit boilerplate ×13** | IP extract + `rateLimiter.check` + 429 body in check-username, fan/login, fan/register, fan/forgot-password, creator/forgot-password, fan/follow, fan/follow-creator, fan/install, push/subscribe, messages/upload, creator/my-app/icon, paypal/checkout, fan/purchases/complete — `creator/pageview:35-37` diverges (splits x-forwarded-for) | `enforceRateLimit()` wrapper | 2 |
| 14 | **Zod id schema ×4** | `fan/purchases:8`, `fan/purchases/complete:19`, `fan/content/list:7`, `paypal/checkout:16` — `USE_MOCKS ? z.string().min(1) : z.string().uuid()` | `lib/zod-helpers.ts` (create) | 2 |
| 15 | **Zod error responses mixed ×14** | 7 routes return `{error:"Invalid request"}`, 7 return raw `validation.error.format()` | unified shape | 2 |
| 16 | **Copy-to-clipboard block ×4** | `admin/ApiKeysPanel.tsx:52-55`, `network/AffiliateLinks.tsx:54-56`, `circle/partners/PartnerInviteCard.tsx:25-27`, `overview/QrCard.tsx:61-62` | `useCopyToClipboard` (create) | 2 |
| 17 | **Bottom-sheet shell ×6, z-index drifted 50/60/90** | `messages/MessagesShell.tsx:918` (z-90), `fan-pwa/FanAuthModal.tsx:139` + `ItemCards.tsx:476` (z-60), `my-app/catalog/AddItemPicker.tsx:27` + `ItemEditor.tsx:59`, `fan-pwa/IOSInstallGuide.tsx:38` (z-50) | `shared/Sheet.tsx` (create; `ui/dialog` exists for centered modals) | 2 |
| 18 | **Empty-state markup ×14** | MessagesShell:273,439, ApiKeysPanel:75, AccountsTable:137, StaffPage:153, CollabList:54, InboxRequests:75, FanListTable:133, ActivityTimeline:55, YourDealsCard:107, AffiliateLinks:84, NetworkPage:261-272, GuestPageContent:240, PartnerBody:147, FanSettingsTab:188 — archived component exists at `src/old-code/EmptyState.tsx` | `shared/EmptyState.tsx` (create from old-code pattern) | 2 |
| 19 | **Upload limits duplicated, client/server disagree** | 8MB `MessagesShell.tsx:695` vs `api/messages/upload:19,40`; 50MB `creator/upload:6`; 2MB `my-app/icon:18`; billboard caps client `BillboardEditor.tsx:74,97` vs server `partners/billboard:43,46,55,58` (server caps bio/media-kit with **no** client counterpart — silent truncation) | `lib/limits.ts` constants (create) | 2 |

## Trivial / cosmetic — one sweep

- **Spinner:** `<Loader2 animate-spin>` ×14 sites / 10 files — no shared `Spinner`.
- **`<p>Loading…</p>`** variants ×6 (MessagingPrivacy:55, ActivityTimeline:53, YourDealsCard:104, AdminClient:45, FanProfileDrawer:95, PartnerModal:126).
- **Dates:** bare `toLocaleDateString()` ×15 files — no `formatDate`.
- **`DAY_LABELS`** byte-identical in `my-app/catalog/ItemEditor.tsx:26` = `fan-pwa/ItemCards.tsx:35`.
- **`setMockSession()`** identical in `auth/LoginForm.tsx:25-28` = `auth/OnboardingForm.tsx:30-33`.
- **Already-logged-in guard** identical in `screens/public/login/Screen.tsx:28-41` = `onboarding/Screen.tsx:30-43` (redirect target differs).
- **Fan-only guard** `redirect(/guest)` in 4 screens: `fan/{home,content,connect,settings}/Screen.tsx`.
- **Stat-card grid JSX** `overview/StatCards.tsx:56-68` ≈ `admin/StatsCards.tsx:35-47`.
- **Red count pill** `layout/MyPeeps.tsx:86-88` = `messages/MessagesShell.tsx:257-259`.
- **Avatar circle + initials fallback** ×13 sites (logic half = finding #2).
- **Form-label class drift:** `ui/input.tsx:15` vs 30+ hand-rolled `text-xs font-bold uppercase…`.
- **Toggle switch:** `ui/switch.tsx` exists (6 users) but `FanSettingsTab.tsx:160` hand-rolls one; `MessagesShell.tsx:389` uses raw checkbox.
- **Admin table shell** CreatorsTable:71 ≈ AccountsTable:134 ≈ FanListTable:118.
- **Search input shell** CreatorsTable:60 ≈ NetworkPage:242 (input visual only — logic covered by Phase 1 SearchBox).
- **Platform button string** `bg-primary text-primary-foreground` ×3 files (cosmetic).

## ✅ Already shared — no action

`nav-config.ts` (all nav lists) · `utils.ts` cn() · `branding.ts` resolveBranding/contrastText/FONT_MAP · `contentTypes.ts` CONTENT_TYPES/TYPE_ICONS · `team-permissions.ts` · `admin-permissions.ts` · `rate-limiter.ts` singleton (only surrounding boilerplate duped) · `api-error.ts` · `fanSession.ts` / `chat.ts` / `requireAuth.ts` / `email.ts` / `fanShellData.ts` · `themeStyles.ts` buttonClass/buttonShape/cardRadius · `PoweredByFooter` · `PartnerBody` · `SectionTitle` · `ui/*` (Badge ×12, Dialog ×5, Switch ×6) · `hooks/usePWAInstall` · `services/fanService` · `shared/InviteEmail`.

---

*Generated 2026-09-29 (founder-approved audit-first pass). Phase 1 + Phase 2 both executed 2026-09-29; intentional skips logged in `BACKLOG.md`. One finding beyond the table: the assumed "cents" money values were actually dollars (item.price / amount_paid / deal rates) — `formatCents` removed, both StatCards `/100` display bugs fixed via `money()`.*
