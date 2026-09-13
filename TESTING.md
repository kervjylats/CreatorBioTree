# CreatorBioTree — Full E2E Manual Testing Checklist (All Roles, All Mock)

Everything runs in mock mode (`USE_MOCKS=true`). No real services. All data is in-memory — restarting the dev server wipes catalog items, themes, drafts, and sessions.

---

## How to test

1. `npm run dev` → open **http://localhost:3000**
2. **No auto-login** — visiting `/dashboard*` without a session cookie redirects to `/login`.
3. **Any email + password** at `/login` creates/signs in a user (mock mode).
4. **Admin seed** exists: `admin@creatorpwa.app` (any password).
5. **Restart dev server** between major test sessions to clear stale data.

---

## Personas

| # | Persona | How to create |
|---|---|---|
| 1 | **Guest/Visitor** | Open `/[username]` in incognito (no cookies) |
| 2 | **Follower** | Enter email on guest page "Follow" box (no password) |
| 3 | **Fan** | Sign up with password via `/login` → `/onboarding` |
| 4 | **Member** | Fan buys a membership item |
| 5 | **Buyer** | Fan buys any paid item (mock PayPal) |
| 6 | **Creator** | Sign up via `/login` → `/onboarding` → choose Link Address |
| 7 | **Admin** | Login as `admin@creatorpwa.app` |
| 8 | **Staff Admin** | Admin invites via Admin Panel → staff accepts |
| 9 | **Team Member** | Creator invites via Network → My Peeps → Staffs |
| 10 | **Partner** | Creator shares `?invite=CODE` link → invitee signs up |
| 11 | **Collab** | In-app friend request between two creators |
| 12 | **Affiliate** | Deal created between two collabed creators |
| 13 | **Community** | Creator creates community → fans join channels |

---

## 1. Auth & Onboarding (Persona 6: Creator)

- [ ] Visit `/login` — login form shows (email + password, social buttons, "Create one free" link).
- [ ] Enter any email + password → creates account → redirects to `/onboarding`.
- [ ] `/onboarding` — Link Address field with debounced availability check.
- [ ] Type a taken name → "Already taken" message.
- [ ] Type an available name → "Available" + permanence note.
- [ ] Submit → permanence confirm dialog → confirm → redirects to `/dashboard/my-app`.
- [ ] Visit `/login` again while logged in → redirects to `/dashboard`.
- [ ] `/forgot-password` → enter email → "If an account exists, a reset link has been sent" (mock: logs to console).
- [ ] Logout → session cleared → visit `/dashboard` → redirects to `/login`.

## 2. Admin (Persona 7)

- [ ] Login as `admin@creatorpwa.app` → `/admin` shows in sidebar.
- [ ] `/admin` Overview tab — stat cards (Total Creators, Fans, Content Items, Revenue).
- [ ] `/admin` Creators tab — table of all creators with search, feature toggle (star icon).
- [ ] `/admin` Staff Accounts tab — list admins, "Invite staff" button (email + role select).
- [ ] Invite a staff member with `support_admin` role → appears in list.
- [ ] Edit a staff member's role → change to `content_admin` → updated.
- [ ] Revoke a staff member → removed from list.
- [ ] `/admin` Audit Log tab — shows placeholder message (mock).
- [ ] `/admin` API Keys tab — "Generate Key" creates an `api_...` key → shown once → copy button.
- [ ] Visit `/admin` without admin session → redirects to `/login`.

## 3. Staff Admin (Persona 8)

- [ ] Staff member logs in with their email+password → sees `/admin` in sidebar.
- [ ] Staff can view creators table and stats.
- [ ] Staff cannot see "Invite staff" or "Revoke" buttons (role check).
- [ ] Staff with `content_admin` role sees audit log but not API keys.

## 4. Overview (Persona 6)

- [ ] `/dashboard/overview` — 4 stat cards (Sales, Fans, Views, Subscribers).
- [ ] Activity timeline — shows recent events (follows, purchases, messages).
- [ ] Setup checklist — "Set up profile" → link to settings, "Create first item" → link to my-app.
- [ ] Quick actions — "Edit My App" → `/dashboard/my-app`, "View my page" → opens `/{username}`.
- [ ] QR card — shows QR code for fan page URL + copy/download buttons.
- [ ] Fan export button — downloads CSV of fan list.

## 5. My App Editor (Persona 6)

### 5a. Identity tab
- [ ] Link Address read-only, shows permanence note.
- [ ] App Name editable with 7-day lock note.
- [ ] Display Name editable.
- [ ] App Icon uploads image.
- [ ] Status bar color editable.

### 5b. Design tab
- [ ] Preset dropdown — Default / Minimal + 7 more.
- [ ] Color picker with Background/Cards/Text/Accent tabs.
- [ ] Font: Sans / Serif / Mono — preview updates.
- [ ] Button style: Rounded / Sharp / Pill / Squircle / Outline.
- [ ] Corner radius slider — cards follow it.
- [ ] "Reset to default" restores Default preset.

### 5c. Catalog tab
- [ ] "Add item" opens 3-section picker (Upload / Links / Everything else).
- [ ] Add a Video — file upload, "Uploading…" spinner, preview.
- [ ] Add a Product — cover upload + variants + stock.
- [ ] Add a Course — lesson rows with uploads.
- [ ] Add a Tip Jar — suggested amounts.
- [ ] Add a Membership — benefits + billing cycle.
- [ ] Add a Newsletter — welcome email field.
- [ ] Pricing editor — switch Free ↔ Paid, billing model select.
- [ ] External-link quarantine — amber warning.
- [ ] Scheduling — publish/unpublish dates.

### 5d. Artist Links tab
- [ ] Add Instagram / X / TikTok / YouTube / website links.
- [ ] Links appear in Connect tab preview.

### 5e. Phone preview
- [ ] Swipe Guest → Home → Content → Connect → Settings.
- [ ] Empty catalog → themed "Sample item · Buy — $9.00" card.
- [ ] Tap-to-edit popovers on background/text/button/card/header.

### 5f. Deploy
- [ ] Auto-save — edit, wait 3s, reload → draft restored.
- [ ] Deploy button → orange dot clears.
- [ ] Open `/{username}` in another tab → deployed changes visible.

## 6. Settings (Persona 6)

- [ ] `/dashboard/settings` — Profile section (display name, tagline).
- [ ] PayPal connect panel — "Connect PayPal" mock button.
- [ ] Notifications — push toggle.
- [ ] Messaging privacy — "Allow messages from anyone" toggle.
- [ ] Danger zone — export data, delete account buttons.

## 7. Search (Public)

- [ ] `/search` — search bar + results.
- [ ] Type a creator name → filtered results with avatar, name, @handle.
- [ ] Type an exact username → that creator is first.
- [ ] Empty query → all discoverable creators (featured first).
- [ ] "Visit" button → navigates to `/{username}`.

## 8. Fan Shell (Personas 1-5)

### 8a. Guest page (`/{username}`)
- [ ] 3-layer view: header → spotlight → catalog feed.
- [ ] Free items → instant access.
- [ ] Email-gated → "Sign up to unlock" button.
- [ ] Paid → "Buy — $X" button.
- [ ] Membership → "Join membership" button.
- [ ] "Follow [creator]" email box.
- [ ] Community CTA card (if creator has community).

### 8b. Follow (Persona 2: Follower)
- [ ] Enter email in Follow box → "Following ✓" + notify toggle.
- [ ] Free-gated items now show "Unlocked ✓".
- [ ] Page is personalized (not the 4-tab app).

### 8c. Buy (Persona 5: Buyer)
- [ ] Tap "Buy — $X" → checkout modal (email only).
- [ ] Enter email → PayPal mock → success → "Purchased ✓" badge.
- [ ] Receipt logged to console.

### 8d. Fan login (Persona 3: Fan)
- [ ] Sign up with password → 4-tab app loads.
- [ ] Home tab — spotlight, new items, community section.
- [ ] Content tab — catalog with purchased/unlocked badges.
- [ ] Connect tab — billboard, partners, artist links.
- [ ] Settings tab — account, receipts, install.

### 8e. Membership (Persona 4: Member)
- [ ] Buy membership item → "Unlocked ✓" on member-only content.

## 9. Messaging (All Personas)

- [ ] Floating 💬 inbox — bottom-right on every screen.
- [ ] Click → popover with conversation list, newest first.
- [ ] "Open full" → full messaging screen.
- [ ] Fan → creator: tap chat icon → quick chat popover.
- [ ] Creator → creator: Network → Connect button → conversation.
- [ ] "Allow messages from anyone" OFF → stranger's message → Requests folder.
- [ ] Approve request → conversation opens, queued message delivered.
- [ ] Block user → blocked user can't message back.
- [ ] Group chat → creator creates → members added → announcements-only mode.

## 10. Partnerships (Persona 10)

- [ ] Creator A → Network → My Peeps right rail → expand Partners row → "Invite partner" → gets invite link (`?invite=CODE`).
- [ ] Creator B opens invite link → signup → auto-connected.
- [ ] Both see each other in Partners list.

## 11. Collabs (Persona 11)

- [ ] Creator A → Network → Discover → search Creator B → "Connect" (sends request).
- [ ] Creator B → Network → Requests → "Accept" → collab formed.
- [ ] Both see each other in CollabList.

## 12. Team (Persona 9)

- [ ] Creator → Network → My Peeps right rail → expand Staffs row → "Invite" → enter email + role.
- [ ] Staff member receives invite → accepts → becomes team member.
- [ ] Creator toggles permissions (Content ON, Settings OFF, etc.).
- [ ] Team member can access toggled-on sections.
- [ ] Note: TeamRow is wired into NetworkPage but requires team members to be created first (test via API or create via invite flow above).

## 13. Affiliates (Persona 12)

- [ ] Creator A (owner) creates deal with Creator B (promoter): 10% per-item.
- [ ] Creator B generates affiliate link.
- [ ] Fan buys via affiliate link → `affiliate_conversions` row created.
- [ ] Creator B sees earnings in Network left rail EarningsSummary (settled/pending).
- [ ] Creator A pauses deal → status = "paused".
- [ ] Creator A browses AffiliateDiscover in Network left rail to find deals to promote.

## 14. Community (Persona 13)

- [ ] Creator → creates community (open join rule).
- [ ] 4 default channels created (General, Announcements, VIPs, Partner collab).
- [ ] Fan joins community → appears in member list.
- [ ] Creator assigns VIP role → VIP channel unlocks.
- [ ] Announcements channel → only creator can post.
- [ ] Fan leaves community → removed from channels.
- [ ] Fan Home tab shows Community section with channel list.
- [ ] Guest page shows "Join the community" CTA card (if creator has community).
- [ ] Fan Connect tab shows community card → deep-links to Home tab.

## 15. Network (Persona 6)

- [ ] `/dashboard/network` — 3-column layout.
- [ ] Left rail: Billboard card + Discover (search + results) + AffiliateDiscover + EarningsSummary.
- [ ] Center: CollabList + CollabDetail (billboard editor visible when connected).
- [ ] Right rail: InboxRequests (pending collab requests) + My Peeps (3 expandable rows: Partners/Fans/Staffs).
- [ ] Billboard rotates partner cards (5s interval), partners with active deals get 2x weight.
- [ ] My Peeps Partners row expands → PartnerInviteCard + connected partners list.
- [ ] My Peeps Fans row expands → FanListTable with filters + CSV export.
- [ ] My Peeps Staffs row expands → TeamRow with invite button + permission toggles.

## 16. Offline

- [ ] Disconnect network → visit `/offline` → shows offline page.
- [ ] "Retry" button, 3 PWA links, outbox status.

---

## 17. Fan Shell Full Spec

### Home tab activity hub
- [ ] Spotlight section shows featured content.
- [ ] "New from creator" horizontal queue with recent items.
- [ ] "Updates from partners you follow" section (only if following partners).
- [ ] Community section shows channels + join/leave (only if creator has community).
- [ ] "Your activity" section shows recent interactions.
- [ ] Upcoming live events section (only if scheduled events exist).
- [ ] Announcements section (only if creator posted announcements).

### Connect tab
- [ ] All Partners column shows all connected partners.
- [ ] Followed column shows partners the fan follows.
- [ ] Billboard rotates partner cards, partners with active deals get 2x weight.
- [ ] Partner bottom modal (tap partner card → modal with follow toggle + catalog preview).
- [ ] Community card → deep-links to Home tab community section.
- [ ] Artist Links section shows creator's social links.
- [ ] Empty state text when all sections empty (configurable by creator).

### Settings tab
- [ ] Subscription card shows current subscription status.
- [ ] 4 notification toggles: New drops / Lives & events / Partner updates / Announcements.
- [ ] Payment methods stub section.
- [ ] Account identity (email), receipts, install, sign out.

---

## Gate checks (run after all wiring)

```bash
npm.cmd run typecheck        # 0 errors
npm.cmd run lint             # 0 errors (3 pre-existing img warnings OK)
python scripts/check-docs.py # PASS
```

---

## Explicitly deferred (not testable yet)

- Landing page (`/`) — naked, no content.
- Founder setup (`/founder/setup?token=`) — spec only.
- AI Copilot — post-launch.
- Real external services (PayPal/Resend/Groq/Paddle).
- Real push broadcasts.
- Claim purchases (fan Settings).
- Per-tab theming.
- Editor options B/C/D.
