# Playground — Complete Vision & Spec

> **Filename + name history:** this file is `playground.md` (in `screens/creator-dashboard/playground/`). The **user-facing name is "Playground"** — the sidebar entry, the route `/dashboard/playground`, and all creator-facing copy. History: born **Playground** → renamed **"My App"** (founder decision 2026-08-05) → **renamed back to "Playground"** (founder decision 2026-10-01, *"I prefer the words playground"*). Type names (`PlaygroundTheme`, `PlaygroundColors`, `PlaygroundProfile`) and component names (`usePlaygroundForm`, `PlaygroundForm`) follow the current name; `src/old-code/` keeps its archived pre-2026-08-05 filenames.

> **⚠️ STATUS 2026-09-24 (updated 2026-10-15) — PREVIEW-FIRST with live editors.** Live on `/dashboard/playground` today: the **phone frame** (status-beacon + Deploy bar, Part 1b reversed 2026-10-15 + the real fan surfaces in a fluid 390×844 frame), the **Billboard view** (Part 1d, wired 2026-10-09), and — once Part 1e ships — the **📌 "Who I am" note** (shared identity: name/avatar/bio/banner/app identity). **Still deferred to the editor-sheet design pass:** tap-to-edit popovers + the sheet tabs (Design/Catalog/Artist Links/Integrations/Email). This file remains the full target spec; the generic catalog components (`AddItemPicker`, `ItemEditor`, `PricingEditor`, `FileUploadField`) are kept for reuse.


## Concept

**Playground** is the single place where a creator sees and edits their **entire fan shell** — one sidebar entry that replaces both the old Playground editor AND the old "View my fan page" action (merged 2026-08-05). ("Playground" — where you build the app your fans install.)

It opens as a **full-screen phone view** (no cramped 3-panel editor) that shows the **guest page first** — exactly what a visitor sees — and the creator swipes through the fan tabs (Home / Content / Connect / Settings). **The page IS the editor:** tap any visible element to edit it (brand layer), or tap an Edit button to reach the content editor (sheet). One screen, both jobs.

**PWA setup is deliberately separated** — App Name, App Icon, status bar color are NOT on-page editable. They live in the editor's **Identity tab → App section** (see Part 2a). On-page editing covers what's visible on the screen; app-level settings live in the editor.

---

## Part 1: Playground — Full-Screen Phone View

- The phone frame **fills the available screen** (no left/right panels, no small 260×520 mockup). It renders the real fan shell components at full size
- **Defaults to the guest page** (the first thing any visitor sees — founder decision, 2026-08-05)
- **Swipe between the 5 surfaces:** Guest → Home → Content → Connect → Settings (same strip + swipe as the fan app; see `fan-shell.md` Part 4)
- Uses the **actual fan tab components** (same code fans get) for accurate preview — no mockups
- The 3 display layers render as on the live page: Spotlight → Catalog Feed (artist links live in the **Connect tab** — `fan-shell.md` Part 4c)
- **Tap-to-edit** is the brand-editing mechanism (Part 1a); content editing goes through the editor sheet (Part 1c)

**Surface strip (bottom of the phone frame, creator-only chrome):** `Guest | Home | Content | Connect | Settings` — identical to the fan's bottom nav but marked as creator chrome (small pencil watermark so it's never confused with the real fan UI).

---

## Part 1a: Tap-to-Edit — the Brand Layer (universal editable)

**What the creator taps changes what pops up.** Every visible, brand-owned element is a tap target. Tapping it opens a small floating **popover** near the element with that element's controls. The page never leaves full-screen — the popover IS the editor.

| Element (tap target) | Popover shows | Applies to |
|---|---|---|
| **Background** (tap any empty area) | Background color / gradient / image / opacity / blend | Every surface, every screen |
| **Text** (tap any heading/body text) | Text color + font (Sans / Serif / Modern) | Every surface, every screen |
| **Button** (tap any button) | Button style (Rounded / Sharp / Pill / Squircle / Outline) + accent color | Every button on every screen |
| **Card / box** (tap any card container) | Card color + border + shadow + corner radius | Every card on every surface |
| **Link** (tap any link) | Link color (separate from accent) | Every link on every surface |

**Behavior:**
- Popover floats near the tapped element; dismiss = tap anywhere else
- **Changes are global by design** — the brand layer is universal. Change the accent once → every button on all 5 surfaces changes (the "make everything look the same" requirement)
- Live update as you tweak (same `resolveBranding()` resolver — `features/branding.md` Part 4)
- Popovers are the SAME on every surface — no per-surface popovers (theme is global; per-tab theming is a deferred premium idea, `features/branding.md` Part 10)
- All changes go to the local draft buffer (`localStorage[playground_draft_${creatorId}]`) until **Deploy** (Part 4c)
- Data model: same `custom_theme` fields as the Design tab — tap-to-edit and the Design tab edit the same thing (see `features/branding.md` Part 6)
- **Not tappable:** content data (item titles, prices, images, partner names, updates, payments). Those are per-box content — they go through the editor sheet (Part 1c)

**Component name (tentative):** `ElementPopover` — one component, config per element type.

---

## Part 1b: Draft status beacon + Deploy (toggle REVERSED 2026-10-15)

> **⚠️ FOUNDER REVERSAL (2026-10-15):** the original design below (a Draft | Live pill toggle = two "preview modes") is **DEAD and removed from the build**. It was a **dead control** — `PhonePreview` never received the toggle's state, so the phone *always* rendered the draft, while the two pills read as "which mode am I looking at?" and "what's live vs what's draft" both went to the same place. The founder's ruling: *"the live we can remove it — it will always be draft and deploy… without deployed this isn't what their fans would see."* No fake preview modes; the phone is always the draft, and one honest strip says the truth.

**What ships instead (wired 2026-10-15):**

```
       ┌────────────── phone bezel strip ──────────────┐
       │ 🟠 Draft — not live yet      [ CloudUpload    │   ← status beacon (left)
       │                                Deploy ]       │      + Deploy button (right)
       │ 🟢 What fans see now         [ Deployed ]     │   ← clean state (draft == server)
       └───────────────────────────────────────────────┘
            ┌──────────────────────┐
            │ 📱  FULL-SCREEN      │   ← the fan shell, full size — ALWAYS the draft
            │  phone (5 surfaces,  │   (Guest/Home/Content/Connect/Settings)
            │  swipeable)          │
            └──────────────────────┘
```

- **Strip = one status beacon + the Deploy button** (component keeps the `PreviewStateToggle` filename; `state`/`onChange` props are gone).
- **🟠 dirty** (`draft ≠ server snapshot`): *"Draft — not live yet"* + **Deploy** enabled. **🟢 clean**: *"What fans see now"* + **Deployed** (disabled).
- The phone renders `draftToCreator` at all times — clean state = draft == server == the live page, so "what fans see now" is literally true.
- Deploy stays the only publish path (Part 4c); the beacon flips 🟢 the moment Deploy succeeds (draft key cleared).

**Owner live-page banner (new, same day):** when the **owner** opens their own live `/{username}/guest`, a sticky amber strip mounts on top — *"🟡 Unpublished changes — this is your live page; fans don't see these edits yet."* + **[Open Playground]** (`components/fan-pwa/OwnerDraftBanner.tsx`). Owner-only (Screen compares the session id to `data.branding.creatorId`); fans/strangers never see it. Verdict is **content-based** — the localStorage draft is merged over the server snapshot with the *same* helpers the hook uses (`creatorToDraft` + `mergeRestoredDraft`), so a pristine auto-saved draft never cries wolf. It disappears once Deploy clears the key. The never-shipped "same toggle on the owner live page" (see the reversal note above) is superseded by this banner.

---

## Part 1c: The Content Editor — 4 Options (ALL SPEC'D, DECISION AT WIRING)

**Brand editing** = tap-to-edit popovers (Part 1a) — decided. **Content editing** (catalog items, community, emails, integrations, media kit, partner invites) needs forms, validation, and multi-step flows that don't fit popovers. Four options are specced below; **all four ship as options during Phase F wiring so the founder can A/B test** and pick the winner (or a hybrid). Default for v1: **Option A**.

### Option A — Slide-up Sheet (DEFAULT)
- A floating **"Edit" button** sits on each phone surface (creator chrome, small pencil circle)
- Tap → a **sheet slides up from the bottom** (~80% of screen height) over the phone
- Sheet has the **8-tab editor strip** at top: `Identity | Design | Catalog | Artist Links | Integrations | Email | Media Kit | Spotlight`
- The relevant tab is **pre-selected by the surface** the Edit button was tapped from (mapping in Part 2)
- Phone stays as the anchor behind the sheet — swipe the sheet closed, the page is right there
- Matches the partner modal pattern (swipe up, ~3/4 screen — `features/partner-page.md` Part 2)

### Option B — Edit Replaces the Phone
- Tap Edit → the phone view is replaced by the editor form (full screen)
- ← back returns to the phone view
- Pros: biggest working area. Cons: lose live preview while editing

### Option C — Persistent Side Drawer
- Drawer slides in from the right; phone shrinks to ~60% width
- Editor + page side-by-side (see change as you type)
- Pros: live feedback. Cons: smaller phone again (the thing we're trying to escape)

### Option D — In-Place Card Morph
- Tap a content card itself → the card morphs into its edit form (Product card → Product form)
- Save → morphs back
- Pros: most direct. Cons: needs 16 per-type forms built twice (card + form), deep navigation for nested editors

**Verdict rule:** if A/B/C/D all feel wrong during wiring, the founder invents a 5th option and the spec updates. Nothing is locked until the founder approves a winner.

---

## Part 1d: Top-Level Switch — Fans | Billboard (founder decision 2026-10-09)

**Playground = the editing room for how the world sees you.** Two views behind one segmented switch at the top of the screen:

| View | What it is |
|---|---|
| **Fans** (default) | Today's phone preview — status beacon + Deploy bar (Part 1b) + the 5 fan surfaces (Part 1) |
| **Billboard** | Your billboard **exactly as Discover renders it** (live result-preview) + the billboard editors |

- **The one rule (extends the identity pattern):** *Network = see + toggle visibility · Playground = design.* Name/avatar/bio/app identity → the 📌 "Who I am" note (Part 1e); billboard ✏️ → this screen's Billboard view — **direct jump, no dialog** (founder: no 7-day rule to explain)
- **URL:** `/dashboard/playground?view=billboard` — `view` ∈ `fans` | `billboard`, default/absent = `fans`. The existing `?tab=` is unrelated: it deep-links a fan surface *inside* Fans view (`FAN_TAB_IDS` validation unchanged)
- **Chrome split:** the beacon + Deploy bar and the phone frame render **only in Fans view** — the billboard has no draft state; it saves immediately

### Billboard view layout

- **Result-preview card (top):** how your card looks to other creators — avatar, display name, @handle, tagline (only if set), tag chips (only if set), collab style (only if set), Featured badge when featured. **Hero on top (2026-10-14):** your spotlight item as the modal would show it (muted-loop video / poster image / nothing when unfeatured) — mirror of Modal A. **No actions** (no Connect/Visit — it's you), **no pencils** (you're already in the edit room), **no visibility pill** (switches live in Network). **Undesigned = the plain standard** (`network.md` §3, confirmed 2026-10-09): avatar + name + @handle only — nothing fake, no placeholders
- **Editors below** — moved verbatim from `network.md` (Component Concepts → BillboardEditor), plus the two fields that always belonged:
  - **Primary field:** single-select dropdown of the ~20 preset buckets (`network.md` §1b) — nullable, unset by default, never forced; the filterable identity (not printed on cards)
  - Tagline: input, max 60 chars with live counter
  - Tags: **pill-adder** (2026-10-13) — input + [+ Add]/Enter → pill with ×, "N left" counter, dup-reject case-insensitive, disables at 3; label **"What do you do?"**, placeholders `e.g. beats/mixing/vocals`; empty values filtered before save (existing)
  - Collab style: textarea (2 rows), free text
  - **Bio — ➡️ edited in the 📌 note (Part 1e, 2026-10-15).** The billboard *displays* it (modal + media kit); this view no longer edits it (one edit home moved with the shared-identity set)
  - **Rate card:** 3 inputs (post / story / video), free-text price labels
  - **Media kit message:** textarea, max `BILLBOARD_LIMITS.mediaKit` (300)
  - **Save button** (not auto-save) + saving/disabled states; loading state while fetching
  - **NOT here:** the collab switch (Network Discover card — `network.md` §3) · App Name/Icon/Status bar + display name/avatar/**bio**/banner → the 📌 note (Part 1e)
- **Data:** existing `GET/PUT /api/creator/partners/billboard` — covers every pitch field, **no new API**. Bio no longer saves here, so the old `syncBio` refresh (billboard-save → fan draft) is removed — bio drafts via Part 1e and the fan preview reads the draft directly
- **Entry points (all land on this view):**
  1. Network My Billboard card-header **✏️** button
  2. Billboard nudge modal **[Design my billboard]** (first Network visit while the billboard is undesigned — `network.md` §3, trigger retargeted 2026-10-09)
  3. Direct: `/dashboard/playground?view=billboard`

  (The rail card's pencil beside name/@handle stays the *identity* pencil → Settings. Two pencils, two homes, never stacked on the same spot.)
- **Why here:** Playground is *"how the world sees me"* — fan app + billboard, two previews one room (Settings stays account-ish: account, billing). This is also the Playground's **first real editor** — preview-first defers the fan-side editor UI, so "the page IS the editor" applies to the billboard before the phone.

---

## Part 1e: The 📌 "Who I am" Sticky Note (founder decision 2026-10-15)

**The shared-identity quick editor.** Fields split into two families: **identity** (appears on many surfaces) and **pitch** (billboard-only). Pitch stays in the Billboard view (Part 1d); identity gets ONE visible home in the Playground — a sticky note pinned top-left of **both** views (Fans | Billboard). Rationale (founder): shared fields don't belong in Settings (too many jumps, and you can't *see* the change there) — they belong where the preview is.

### The note (sticky trigger + small modal)

- **Sticky trigger:** small note button pinned **top-left** of the Playground screen — always visible in both views, never covered by the phone frame or Draft bar. Label: **"📌 Who I am"**.
- **Tap → small corner modal, NOT fullscreen** — the phone (or billboard preview) stays visible behind it so the creator sees edits paint **while making them**. Anchors top-left; stops short of full width (~90%) so the preview peeks through.
- **Live feedback is free:** every field edits the Playground **draft** (Part 4a), which already feeds the previews — type a new name, see the phone header change instantly.

### Fields — the complete shared set (inventoried 2026-10-15)

| Field | Moved from | Rules |
|---|---|---|
| Display name | Settings → Profile (Part 13) | cap 80 · **7-day lock** (existing server law, unchanged) |
| Avatar | Settings → Profile (Part 13) | upload `type=avatar` · **7-day lock** |
| Bio | Billboard view (Part 1d) | max 600 · shows on fan Home header + billboard modal + media kit |
| Banner | *orphaned — had no door* | upload `type=banner` · shows on the fan page header |
| App name | *never had a door* | `custom_theme.profile.appName` · **7-day lock** (Part 2a law) |
| App icon | *never had a door* | upload `type=app_icon` · **7-day lock** |
| Status bar color | *never had a door* | `custom_theme.profile.statusBarColor` · defaults to accent · no lock |

- **"Shows on:" hint line** under each field (founder's visibility map — creators know exactly where each word lands): bio → *"Your fan page, your billboard and your media kit."* Name/avatar → the existing Part 13 helper line. App name → *"On fans' phones after their app updates."* App icon → the same line once a custom icon is uploaded, else *"Fans see the default icon until you upload one; updates land on their phones after an app refresh."* Banner → *"Top of your fan page."*
- **App-icon preview = the REAL icon (fix 2026-10-15):** the square renders `appIconUrl || /icons/icon-192x192.png` — exactly what fans get. It must **never** show the avatar photo as a stand-in: that read as "the photo upload changed my icon automatically" (founder report). The manifest already fell back to the default icon; only the preview lied.
- **Locks:** name/avatar already enforced server-side in `PUT /api/creator/playground` (unchanged). App name/app icon get the same pattern — two new stamp columns (`app_name_changed_at`, `app_icon_changed_at`, mock now) + checks in that same PUT. Status bar color = no lock (low-risk).
- **Save style: Draft + Deploy (founder option A).** Everything in the note edits the draft → orange Draft dot → **Deploy** publishes "who I am" in one deliberate moment. While dirty, the note shows a muted *"Local until you Deploy"* line.
  - ⚠️ **Draft law change — supersedes the 2026-10-09 "identity never in the draft" rule:** the draft now carries `display_name` + `avatar_url` too (bio/banner/app identity already ride it via `custom_theme`/`bio`/`banner_url`). The old rule guarded a *stale draft paints dead identity* bug; that class is covered now — the Draft dot is honest (there IS a pending change) and the **server-side 409 lock at Deploy** still blocks any bypass of the 7-day rule. Deploy's allow-list gains exactly `display_name` + `avatar_url`, nothing else.
- **NOT in the note (stays put):** Link Address (permanent, read-only) · pitch fields — tagline / tags / collab style / primary field / rate card / media-kit message → Billboard view · social links + Connect empty text + theme colors + catalog → the deferred editor-sheet session (big pass, parked) · email / password / billing → Settings.

### Ripple effects (one edit home; everywhere else reads)

- **Settings → Profile becomes a pointer stub** (`settings.md` Part 13 — same pattern as its Part 2). Settings keeps Account & Security · Billing · Notifications · Messaging & Privacy · Your Page · Integrations · Danger Zone.
- **✏️ `ProfileEditDialog`** (sidebar + BillboardPreview gateways): button **[Open Settings] → [Open Playground]** → `/dashboard/playground` (the note is top-left); explainer copy unchanged.
- **Billboard view loses its bio row** (Part 1d updated) — its preview card never rendered bio anyway; the `syncBio` plumbing (billboard-save → fan draft) becomes dead and is removed. The billboard API keeps accepting/returning `bio` (Discover modal + media kit read it).
- **Data:** no new API — the draft rides the existing `GET/PUT /api/creator/playground`; uploads ride `POST /api/creator/upload` (avatar/banner/app_icon types all already whitelisted). Only new data = the 2 app-lock stamp columns (mock now, real DB at migration).

### Build phases (after founder approval)

1. Note component (sticky + modal + 7 fields + hint lines) mounted in `PlaygroundForm`
2. Draft: add `display_name`/`avatar_url` → Deploy allow-list + preview wiring
3. Retire old homes: Billboard bio row + `syncBio` · Settings `ProfileSection` → pointer · `ProfileEditDialog` repoint
4. App name/icon 7-day locks (stamps + server checks)
5. Gates ×3 + smoke → AGENTS build entry

---

## Part 2: The Editor Tabs (content editing)

**Where they live:** inside the editor **sheet** (Option A — Part 1c) as a tab strip: `Identity | Design | Catalog | Artist Links | Integrations | Email | Media Kit | Spotlight`. (Options B/C/D relocate the same 8 tabs; the tabs themselves are identical in all four options.)

**Surface → default tab mapping:** tapping "Edit" on a phone surface opens the sheet with the relevant tab pre-selected:

| Phone surface | Default tab in the sheet |
|---|---|
| Guest page | Identity (top) — also Spotlight + Media Kit are one tap away in the strip |
| Home tab | Catalog (content drives Home sections) |
| Content tab | Catalog |
| Connect tab | Artist Links |
| Settings tab | Integrations + Email |
| Any surface | Design tab = the full theme editor (same data as the tap-to-edit popovers, Part 1a — richer, non-tap form) |

### 2a. Identity Tab

> **➡️ MOSTLY MOVED → Part 1e 📌 note (founder decision 2026-10-15):** App Name, App Icon, Status bar color, Display Name, and Bio now edit from the Playground's 📌 "Who I am" note — **ships now, not deferred with this sheet.** The 7-day locks on App Name/App Icon still apply (enforced there). This tab keeps only: Link Address (read-only) + the Connect empty-state text. Below is the original spec, retained for the field rules.

> **PWA separation (founder decision 2026-08-05):** App Name, App Icon, and the PWA status bar color are **NOT on-page editable** — they're app-level (install-time) settings, not screen visuals. On-page tap-to-edit (Part 1a) covers only what's visible on screen.

- **Link Address** — *permanent, display-only.* Set once at signup (`onboarding.md`), never editable here. Shown as a read-only row: `creatorbiotree.com/{username}`. The public URL lives here; everything else on this tab is changeable.
  - ⚠️ The Link Address is permanent by founder decision — no change control, no redirects, no exceptions. A hidden backend UUID anchors all data (content, fans, purchases, follows); the Link Address is just the public label. Code/DB column stays `username` (user-facing copy says "Link Address").
  - Clarifying line on the tab: *"Your Link Address is the fan-facing URL. Your own Dashboard lives at `/dashboard` — it is never under your Link Address."*
- **App sub-section (PWA — separated from on-page editing):**
- **App Name** — PWA home screen title (shown on fans' phones)
  - ⚠️ Changeable anytime, with a **7-day lock** between changes (per founder decision — matches TikTok's nickname cadence). Existing installs keep old name until phone refresh.
- **App Icon** — file upload, shows preview
  - ⚠️ Same 7-day lock as App Name — existing installs keep old icon.
- **Status bar color** — PWA `theme_color` = `statusBarColor` (wired 2026-10-15 — `manifest.json` route reads it; falls back to `colors.accent` when unset — `features/branding.md` Part 9 #4). Edited via the 📌 note's status-bar field (Part 1e)
- **Display Name** — **➡️ moved to the 📌 note (Part 1e, 2026-10-15)** — was Settings → Profile (founder 2026-10-09), now the shared-identity note; 7-day cooldown unchanged (`settings.md` Part 13 law retained). Not editable on this tab.
- **Bio** — **➡️ moved to the 📌 note (Part 1e, 2026-10-15)** — was the Billboard view.
- **Connect Tab Empty State** — a single textarea (max 200 chars) for the message shown when the Connect tab is completely empty (no partners, no community, no socials, no followed)
  - Default value: "More to come — check back soon"
  - Helper text: "Shown to fans when your Connect tab has nothing to display yet"
  - Optional — if blank, falls back to the platform default. **No 7-day lock** (low-risk text field, changeable anytime)
  - Stored in: `custom_theme.connect_empty_text` (see `features/branding.md` Part 9 #5)
  - The fan sees it only when ALL Connect sections are empty; adding any content (a partner, community, a link) hides it automatically, and removing content brings it back — no special logic

### 2b. Design Tab

- Fill type: Solid / Gradient / Image
- Color picker (background + accent)
- 9 theme presets: Minimal, Dark, Coffee Shop, Neon Nightlife, Clean Editorial, Ocean, Rose, Emerald, Gold
- Gradient controls: Linear/Radial toggle, angle slider, live preview
- Background image upload with preview
- Opacity slider + blend mode select
- Contrast checker (pass/fail badge)
- "Surprise Me" button (random palette)
- Font picker: Sans / Serif / Modern
- Button style: Rounded / Sharp / Pill / Squircle / Outline
- AI Copilot: vibe chips + text prompt → LLM generates palettes (uses the unified AI assistant — see `ai-features.md`)

> **The full theme system, 9 presets, the resolver, the 4 safety rules (validation / fallback / performance / accessibility), and the 7 easy-win + 5 touch-native rebrand extensions live in `features/branding.md`** (single home for everything that controls how a creator's brand renders). This tab is the editor; the brand spec is the contract.

### 2c. Catalog Tab

**What it is:** The creator's warehouse — all items they create, sell, and share. 16 item types:

| Type | What It Is | Category |
|---|---|---|
| 🔗 Link | External URL with platform category | Content |
| 🎬 Video | MP4 / streaming video file | Content |
| 🎵 Audio | MP3 / podcast episode | Content |
| 🖼️ Image | JPEG / PNG / WebP | Content |
| 📄 PDF | Document / ebook / workbook | Content |
| 🛍️ Product | Digital or hybrid product (variants + stock) | Commerce |
| 📚 Course | Multi-module course with lessons | Commerce |
| 📅 Session | 1:1 booking call | Commerce |
| ⭐ Membership | Recurring subscription (benefits list) | Commerce |
| 📦 Physical | Shippable merchandise (variants + stock) | Commerce |
| ☕ Tip Jar | One-tap donations (suggested amounts) | Commerce |
| 🎁 Bundle | Package multiple items at a discount | Commerce |
| 📡 Live | Streaming event / webinar | Engagement |
| 💬 Messaging | "Message me" entry (fans contact the creator) | Engagement |
| 📧 Newsletter | Free email list or paid subscription | Engagement |
| 📝 Page | Rich text / custom page | Content |

**Pricing models:** free, paid_one_time, pay-what-you-want, per_minute, recurring (weekly/monthly/yearly), tiered. (**No `per_message`** — messaging is free, founder decision 2026-08-04; the 💬 catalog item is a free "Message me" entry.)

**Payment handling (per item — founder decision 2026-08-10):**
- **In-app checkout (default)** — fan pays via PayPal right in the fan app (email-only guest checkout; cards accepted, no PayPal account needed). Money lands in the creator's PayPal balance (`monetization/creators.md` Part 1a). All in-app items are eligible for affiliate deals.
- **External link (opt-in)** — "Buy" opens the creator's own URL in a new tab (e.g., PayPal.me / Stripe Payment Link / Gumroad). The picker warns: **"Payments happen off-platform — this item is excluded from affiliate deals"** (external-link quarantine, `creators.md` Part 1c). Fans still see "Buy — $X" on the card — the rail is invisible to them.
- The choice is per item, in the Pricing field of every commerce editor; changing it later re-checks deal eligibility (`network.md` §7).

**Link scheduling (metadata on any item):**
- `scheduled_publish_at` — auto-publish on a date
- `scheduled_unpublish_at` — auto-hide on a date
- Fan query filters: `WHERE (scheduled_publish_at IS NULL OR <= now()) AND (scheduled_unpublish_at IS NULL OR > now())`

**Creator workflow:**
1. Click "+ Create Item" → pick type from categorized menu (Content / Commerce / Engagement)
2. Type-specific editor opens inline (FileEditor, CourseEditor, LinkEditor, etc.)
3. Options: title, description, cover image, pricing, countdown timer, scheduling
4. Toggle Published / Draft (drafts are invisible to fans)
5. Save → appears in catalog list

**Funnels (subsection of Catalog):**
- A funnel chains catalog items into a buy/skip/upsell/downsell sequence
- Entry page (free/low) → Subsequent offer (main paid) → Upsell/Downsell paths
- Creator drags items into step slots, sets upsell/downsell branches
- On fan side: fan enters → sees step 1 → acts → auto-redirected to next step
- Fan sees a progress indicator: `Funnel: "Launch Bundle" [Step 2 of 3]`
- Data model: `funnels` + `funnel_steps` tables

**Item order on fan page:** Controlled by the Page Layout sub-tab — drag-and-drop reorder of published items.

### 2d. Artist Links Tab

**What it does:** Turns social/external URLs into rich interactive cards — not boring icons.

**How it works:**
1. Creator pastes a URL (e.g. `https://instagram.com/kevin`)
2. System fetches oEmbed / Open Graph metadata
3. Returns rich preview: platform badge, title, image, description
4. Connect tab shows as an interactive card (the **only** display home — see `fan-shell.md` Part 4c; the editor for the card's data lives here)

**Two tiers — TENTATIVE, NOT enforced in v1** (see `monetization/owner.md` — all pricing decided in one pass at end of dev):
- **Free:** Static rich card (title + image + platform badge + "Visit" button)
- **Pro:** Interactive embed (playable YouTube video, TikTok reel, Spotify widget, scrollable IG post)

**Supported platforms:** Instagram, TikTok, YouTube, X/Twitter, Spotify, Facebook, Twitch, Amazon, any website

**No API keys, no OAuth** — uses public oEmbed + Open Graph standards. Old reference code at `src/old-code/integrations/social-scrape-route-old.ts`.

### 2e. Integrations Tab

Two features for connecting to external platforms:

**1. Auto-DM**
- Automatically sends Instagram DM when a fan takes an action (purchase, tip, subscribe, follow)
- Creator sets DM templates per trigger type (with `{{fan_name}}` variables)
- Requires Instagram OAuth connection
- Fallback: email autoresponder (no API restrictions)
- Mock: logs to console

**2. Commerce Platform Integration**
- Connect Shopify, Gumroad, Spring, Etsy stores
- Auto-import products into catalog as Link or Product items
- Periodic background sync keeps prices/inventory updated
- Checkout redirects to external platform
- Mock: generates fake products

### 2f. Email Tab

**What it does:** Full email marketing tool (beyond just newsletter signup).

The `newsletter` catalog item handles **signup** (fan enters email). This tab handles what happens **after**: campaigns, templates, subscribers.

**Sub-tabs:**
- **Campaigns** — list of sent/draft/scheduled campaigns. Create: subject line → choose subscribers → drag-and-drop block editor (text, image, button, divider) → send or schedule
- **Subscribers** — total count, growth chart, list (email, source, date), export CSV, import CSV
- **Templates** — save/load reusable email layouts

**Automation:** Welcome sequence — when fan subscribes → auto-sends 3 emails (welcome, what you get, top content)

**Data model:** `email_subscribers`, `email_campaigns`, `email_templates` tables

### 2g. Media Kit Tab

**What it does:** Auto-generated brand kit for sponsor deals. Pulls real data and presents it professionally.

**Auto-generated from:**
- Profile: display name, bio, avatar, social links
- Stats: total installs, active fans, views, engagement rate
- Top content: best catalog items by views/purchases
- Collabs: past/current collabs

**Editable:** Bio, rate card (post/story/video prices), custom message
**Shareable:** Unique URL (`/[username]/media-kit`), downloadable PDF, embed iframe

**Brand partner view:** Opens media kit → "Interested?" → Contact form or partnership request

> **ADDENDUM v1 door (2026-10-14, founder "go" on spec):** sponsors have no
> accounts (readers, never users — no login, no checkout, no ad units). So v1
> ships the smallest reachable door: a **Copy media-kit link** button in the
> Billboard view (below the editors, beside Save — same room as the fields it
> shares) → public read-only `GET /[username]/media-kit` rendering bio + rate
> card + custom message + spotlight hero (gated media per the audit law —
> cover-only for strangers on paid items). No PDF / iframe / contact form in
> v1 (deferred — sharing = you send the link, they read what's public).

### 2h. Spotlight Tab

**What it does:** Auto-aggregated showcase at the top of the fan page. A stories-style carousel of ALL published items + social previews. No manual config needed — it just exists.

- Auto-picks from all published catalog items + artist links
- Swipeable, auto-advancing carousel
- Shows: latest content, best-sellers, upcoming live events, social previews
- Optional: creator can pin items to force them into spotlight (Pro feature — **tentative**, not enforced in v1, see `monetization/owner.md`)
- The PhonePreview shows the spotlight in real-time

---

## Part 3: The Fan Page (What Fans See)

> **Fan-side UX details** (account model, the three gates, guest vs fan views, the 4 tabs, auth) live in `screens/fan-shell/fan-shell.md`. This part covers the display layers and per-item cards.

When a fan visits `/[username]`, they see 3 layers stacked:

```
┌─── HEADER ────────┐
│ Profile pic, name, bio
├─── SPOTLIGHT ─────┤
│ Auto-carousel of all items + social
├─── CATALOG FEED ──┤
│ Published items as interactive cards
└───────────────────┘
```

**Item card display per type:**
- **Video** — auto-playing preview clip → tap to full player
- **Audio** — inline waveform player
- **Image** — gallery/lightbox with swipe
- **PDF** — preview page + download button
- **Link** — rich card with platform badge + "Visit" CTA
- **Product** — card with image, price, variants, "Buy"
- **Course** — card with module count, "Enroll"
- **Session** — card with price + duration + "Book"
- **Membership** — card with benefits list + price/cycle + "Subscribe"
- **Physical** — card with stock badge + variants + "Buy"
- **Tip Jar** — suggested amount buttons + support message
- **Bundle** — discount badge + included items + "Buy Bundle"
- **Newsletter** — inline email input + subscribe
- **Live** — card with countdown + "Join Stream"
- **Messaging** — card with free "Message me" button + "Send Message"

**Pricing / Paywall:**
- Free items: shown immediately
- Paid items: preview (cover, title, description) + "Unlock — $X" button
- Purchased: "Purchased ✓" badge, full access
- Member: "Unlocked ✓" if fan has active subscription

---

## Part 4: System Features

### 4a. Draft System (auto-save)
- Every change auto-saved to localStorage every 3s (`playground_draft_${creatorId}`)
- On mount, restores draft if one exists
- Deploy clears the draft
- Survives: browser close, lost connection, crash
- **Draft field set:** `custom_theme` (colors + **profile = app name/icon/status bar**) · `bio` · `banner_url` · `connect_empty_text` · `social_links` · **+ `display_name` + `avatar_url` (added 2026-10-15 with the 📌 note — Part 1e supersedes the 2026-10-09 "identity never in the draft" rule; server 409 locks still guard Deploy)**

### 4b. Unsaved Changes Modal
- Shows when navigating away with unsaved changes
- Options: **Save & Leave** / **Leave without saving** / **Cancel**
- "Don't ask me again" checkbox — stores preference, skips modal on future navigations

### 4c. Deploy Button
- Floating button at **top-right of the full-screen page** (above the phone frame, next to the Preview State Toggle)
- States: "Deploy Changes" (idle) / "..." (saving) / disabled
- Saves theme + profile + content to DB → clears draft → success feedback
- Success feedback includes a **"Deployed — view it live"** link → opens `/{username}` in a new tab (guest view of the live page)

### 4d. BottomEditor (the editor sheet — Option A)
- Slide-up sheet (~80% height) opened by the Edit button on any phone surface (Part 1c)
- Tab strip inside: **Identity | Design | Catalog | Artist Links | Integrations | Email | Media Kit | Spotlight**
- "Changes are local until you deploy" indicator
- Unsaved badge (amber pill) when un-deployed changes exist
- Duplicate deploy button for convenience
- Options B/C/D (Part 1c) relocate the same editor; 4d is the Option A layout

---

## Part 5: Free vs Pro Tiers (TENTATIVE — NOT enforced in v1)

> ⚠️ **Founder decision 2026-08-05:** this table is **tentative reference only.** No Free/Pro gate exists in v1 — every creator gets every feature. See `monetization/owner.md` Part 1 (#5): "**No Free/Pro tier gate in v1 — `is_pro` checks forbidden during Phase F wiring.**" The pricing is decided at end-of-dev (one pass, see `monetization/owner.md` Part 3) and THIS table gets re-reviewed at that point.

| Feature | Free (tentative) | Pro (tentative) |
|---|---|---|
| Catalog items | Up to 10 | Unlimited |
| Artist Links | Static rich cards | Interactive embeds + auto-refresh |
| Spotlight | Auto-carousel | Auto + manual pinning |
| Funnels | 1 funnel | Unlimited |
| Email | Up to 100 subscribers | Unlimited |
| Media kit | ✅ | ✅ |
| Affiliates | ✅ | ✅ |
| Auto-DM | ✅ | ✅ |
| Commerce integrations | ✅ | ✅ |
| AI assistant | 10 queries/day | Unlimited |
| Remove branding | — | ✅ |

---

## Part 6: Build Priority

### Phase 1 — Core
1. Wire Playground full-screen shell (5 surfaces, swipe, guest-first) + Preview State Toggle
2. Wire tap-to-edit popovers (Part 1a) + `ElementPopover` component
3. Wire editor sheet Option A (Part 1c) with the 8-tab strip + surface→tab mapping
4. Wire CatalogManager + 16 item types into the Catalog tab
5. Wire fan-facing catalog feed into Content tab
6. Wire newsletter → Settings tab, live events → Home tab
7. Link scheduling (metadata extension)
8. Purchase/payment flow (mock → PayPal; Stripe deferred — the Atlas path)

### Phase 2 — Display
9. Interactive item cards (reel-style, not thumbnails)
10. Artist Links tab (scrape URL → rich card)

### Phase 3 — Spotlight + Layout
11. Spotlight carousel component + tab
12. Page Layout sub-tab (drag-drop reorder)
13. Funnels (creator UI + fan flow)

### Phase 4 — Remaining Tabs
14. Integrations tab (Auto-DM + Commerce)
15. Email tab (campaigns + subscribers)
16. Media kit tab
17. AI personal assistant widget

### Phase 5 — A/B Test the Editor Options
18. Build Options B/C/D (Part 1c) behind a feature flag
19. Founder tests all 4, picks the winner (or a hybrid, or a 5th idea) → spec updates → non-winners removed

---

## Part 7: Current Components (in `src/old-code/` — parts archive, reference only)

| Component | File | Purpose |
|---|---|---|
| PhonePreview | `PhonePreview.tsx` | Old phone mockup + mini strip — **becomes the full-screen Playground shell** (Part 1) |
| ElementPopover | *(new — no old code)* | Tap-to-edit popovers (Part 1a) |
| PreviewStateToggle | `components/playground/` | Status beacon + Deploy (Part 1b — Draft/Live pills removed 2026-10-15) |
| AppIdentityEditor | `AppIdentityEditor.tsx` | Link Address (read-only), app name, icon, bio |
| GlobalSettingsEditor | `GlobalSettingsEditor.tsx` | Colors, fonts, AI palette |
| BottomEditor | `BottomEditor.tsx` | Tab wrapper |
| BottomPanel | `BottomPanel.tsx` | Deploy bar (merge into BottomEditor) |
| PlaygroundInfoBanner | archived as `PlaygroundInfoBanner.tsx` in `src/old-code/` (live copy deleted 2026-09-24) | Dismissable banner |
| usePlaygroundForm | `usePlaygroundForm.ts` (live) + archive copy in `src/old-code/` | State + deploy + auto-save |
| useAutoSave | `useAutoSave.tsx` | localStorage auto-save |
| CatalogManager | `catalog/CatalogManager.tsx` | Catalog list + editors |
| AddItemPicker | `catalog/AddItemPicker.tsx` | Type picker modal |
| PricingEditor | `catalog/PricingEditor.tsx` | Universal pricing |
| FileEditor | `catalog/FileEditor.tsx` | File upload editor |
| CoverUploader | `catalog/CoverUploader.tsx` | Thumbnail upload (less prominent in new vision) |
| LinkEditor | `catalog/LinkEditor.tsx` | External URL editor |
| ProductEditor | `catalog/ProductEditor.tsx` | Product variants + stock |
| CourseEditor | `catalog/CourseEditor.tsx` | Multi-module course |
| SessionEditor | `catalog/SessionEditor.tsx` | 1:1 booking |
| MembershipEditor | `catalog/MembershipEditor.tsx` | Subscription benefits |
| TipJarEditor | `catalog/TipJarEditor.tsx` | Donations |
| BundleEditor | `catalog/BundleEditor.tsx` | Package deals |
| NewsletterEditor | `catalog/NewsletterEditor.tsx` | Email signup |
| LiveEditor | `catalog/LiveEditor.tsx` | Streaming events |
| MessagingEditor | `catalog/MessagingEditor.tsx` | "Message me" entry (free — no paid DMs) |
| PhysicalEditor | `catalog/PhysicalEditor.tsx` | Merchandise |
| CountdownField | `catalog/CountdownField.tsx` | Countdown timer |

---

## Part 8: Deferred Features (end of development)

| Feature | Notes |
|---|---|
| Network screen (search, collabs, affiliates) | See `screens/creator-dashboard/network/network.md` |
| Landing page | See `screens/public/landing.md` |
| Per-tab theming (premium upsell) | Future premium — individual colors per fan tab |
| Chat/messaging between creators | Spec'd in network.md |
| Deal Maker (commission agreements) | Spec'd in network.md |
| Billboard interactivity | Parked |
| Install quota cap | Until pricing is decided |
| Sentry error monitoring | End of dev |

---

## Merger Reference

This single `playground.md` (file history: born `playground.md` → `my-app.md` 2026-08-05 → back to `playground.md` 2026-10-01) replaces these 5 separate files:

| Old File | Merged Into |
|---|---|
| `catalog/catalog-roadmap.md` | Part 2c, Part 3, Part 5, Part 6 |
| `catalog/funnel/funnel.md` | Part 2c (Funnels subsection) |
| `integrations/integrations.md` | Part 2d (Artist Links), Part 2e (Integrations) |
| `email/email-campaigns.md` | Part 2f (Email Tab) |
| `media-kit/media-kit.md` | Part 2g (Media Kit Tab) |
