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

| #   | Persona           | How to create                                              |
| --- | ----------------- | ---------------------------------------------------------- |
| 1   | **Guest/Visitor** | Open `/[username]` in incognito (no cookies)               |
| 2   | **Follower**      | Enter email on guest page "Follow" box (no password)       |
| 3   | **Fan**           | Sign up with password via `/login` → `/onboarding`         |
| 4   | **Member**        | Fan buys a membership item                                 |
| 5   | **Buyer**         | Fan buys any paid item (mock PayPal)                       |
| 6   | **Creator**       | Sign up via `/login` → `/onboarding` → choose Link Address |
| 7   | **Admin**         | Login as `admin@creatorpwa.app`                            |
| 8   | **Staff Admin**   | Admin invites via Admin Panel → staff accepts              |
| 9   | **Team Member**   | Creator invites via Network → My Peeps → Staffs            |
| 10  | **Partner**       | Creator shares `?invite=CODE` link → invitee signs up      |
| 11  | **Collab**        | In-app friend request between two creators                 |
| 12  | **Affiliate**     | Deal created between two collabed creators                 |
| 13  | **Community**     | Creator creates community → fans join channels             |

---

## 1. Auth & Onboarding (Persona 6: Creator)

- [x] Visit `/login` — login form shows (email + password, social buttons, "Create one free" link).
- [x] Enter any email + password → creates account → redirects to `/onboarding`.
- [x] `/onboarding` — Link Address field with debounced availability check.
- [ ] Type a taken name → "Already taken" message.

Haven't tested this yet

- [x] Type an available name → "Available" + permanence note.
- [x] Submit → permanence confirm dialog → confirm → redirects to `/dashboard/my-app`.
- [x] Visit `/login` again while logged in → redirects to `/dashboard`.
- [ ] `/forgot-password` → enter email → "If an account exists, a reset link has been sent" (mock: logs to console).

Haven't tested it yet.

- [x] Logout → session cleared → visit `/dashboard` → redirects to `/login`.

## 2. Admin (Persona 7)

- [x] Login as `admin@creatorpwa.app` → `/admin` shows in sidebar.
- [x] `/admin` Overview tab — stat cards (Total Creators, Fans, Content Items, Revenue).
- [x] `/admin` Creators tab — table of all creators with search, feature toggle (star icon).
- [x] `/admin` Staff Accounts tab — list admins, "Invite staff" button (email + role select).
- [ ] Invite a staff member with `support_admin` role → appears in list.

I have enter the email add and support to invite but when i click on invite nothing happens it stay in the pop up

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

Overall i will test the admin side later on if that's ok.

## 4. Overview (Persona 6)

- [x] `/dashboard/overview` — 4 stat cards (Sales, Fans, Views, Subscribers).
- [ ] Activity timeline — shows recent events (follows, purchases, messages).

I can't really say anything about this because it said no activity yet which is logical i guess.

- [x] Setup checklist — "Set up profile" → link to settings, "Create first item" → link to my-app.
- [x] Quick actions — "Edit My App" → `/dashboard/my-app`, "View my page" → opens `/{username}`.

These 2 should be removed in the overview screen.  First the setup checklist part - its kinda duplication set up your profile already in setting, create your first item, customize your design same thing, inside my app (in the left sidebar panel),  share your page already in the section share your page where there is the qr code, copy link, download. 



As for the quick acitions same thing, duplication view my page already in the left side panel, same as install my fan app, and share your page as i already told you above its already inside its own section. only edit my app might be logically there.



So completely removed the setup checklist part and quick actions only edit my app is there, and we might add things later on. make the quick action take the same place as setup checklist is right now.

- [x] QR card — shows QR code for fan page URL + copy/download buttons.
- [x] Fan export button — downloads CSV of fan list.

## 5. My App Editor (Persona 6)

### 5a. Identity tab

- [x] Link Address read-only, shows permanence note.
- [x] App Name editable with 7-day lock note.
- [ ] Display Name editable.

Where is the display name, is it the same as app name ? because i can't see the display name anywhere inside the tab. Actually the display name is inside the design tab and not identity.

- [ ] App Icon uploads image.

Its only a url, and no upload button to say.

- [x] Status bar color editable.

### 5b. Design tab

- [x] Preset dropdown — Default / Minimal + 7 more.
- [x] Color picker with Background/Cards/Text/Accent tabs.
- [x] Font: Sans / Serif / Mono — preview updates.
- [x] Button style: Rounded / Sharp / Pill / Squircle / Outline.
- [x] Corner radius slider — cards follow it.
- [x] "Reset to default" restores Default preset.

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

Catalog tab, Artist Links tab, Phone preview, Deploy. I will test all later on ok.

## 6. Settings (Persona 6)

- [x] `/dashboard/settings` — Profile section (display name, tagline).
- [x] PayPal connect panel — "Connect PayPal" mock button.
- [x] Notifications — push toggle.
- [x] Messaging privacy — "Allow messages from anyone" toggle.
- [x] Danger zone — export data, delete account buttons.

## 7. Search (Public)

- [ ] `/search` — search bar + results.
- [ ] Type a creator name → filtered results with avatar, name, @handle.
- [ ] Type an exact username → that creator is first.
- [ ] Empty query → all discoverable creators (featured first).
- [ ] "Visit" button → navigates to `/{username}`.

I can't find the search anywhere and it should be inside the network tab, for creators to be able to search for other creators. just input it there and we will config/go deeper into this later on.

## 
