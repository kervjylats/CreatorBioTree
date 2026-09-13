# My App — Complete Vision & Spec

> **Filename:** this file is `my-app.md` (in `screens/creator-dashboard/my-app/`). The **user-facing name is "My App"** — the sidebar entry, the route `/dashboard/my-app`, and all creator-facing copy. **"My App" replaces the earlier names "Playground" + "My Page" + "View My App"** (full rename founder decision 2026-08-05). Type names (`MyAppTheme`, `MyAppColors`, `MyAppProfile`) and the old-code component names (`useMyAppForm`, `MyAppInfoBanner`) follow the same rename.

## Concept

**My App** is the single place where a creator sees and edits their **entire fan shell** — one sidebar entry that replaces the old Playground editor AND the old "View My App" action. ("My App" because you get YOUR own app — that's the whole point of the platform.)

It opens as a **full-screen phone view** (no cramped 3-panel editor) that shows the **guest page first** — exactly what a visitor sees — and the creator swipes through the fan tabs (Home / Content / Connect / Settings). **The page IS the editor:** tap any visible element to edit it (brand layer), or tap an Edit button to reach the content editor (sheet). One screen, both jobs.

**PWA setup is deliberately separated** — App Name, App Icon, status bar color are NOT on-page editable. They live in the editor's **Identity tab → App section** (see Part 2a). On-page editing covers what's visible on the screen; app-level settings live in the editor.

---

## Part 1: My App — Full-Screen Phone View

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
- All changes go to the local draft buffer (`localStorage[my-app_draft_${creatorId}]`) until **Deploy** (Part 4c)
- Data model: same `custom_theme` fields as the Design tab — tap-to-edit and the Design tab edit the same thing (see `features/branding.md` Part 6)
- **Not tappable:** content data (item titles, prices, images, partner names, updates, payments). Those are per-box content — they go through the editor sheet (Part 1c)

**Component name (tentative):** `ElementPopover` — one component, config per element type.

---

## Part 1b: Preview State Toggle (Draft / Live)

A **toggle at the top center** of My App (above the phone frame) lets the creator compare what they have in the editor right now (Draft) against what fans currently see on the live `/{username}` page (Live). The same toggle also appears at the top of the live page when the owner views their own `/{username}` (per `overview.md` Part 7).

**UI:**

```
       ┌─────────── Preview state ───────────┐
       │  [ ● Draft ]  [ Live ]              │   ← toggle, top center
       └─────────────────────────────────────┘
            ┌──────────────────────┐
            │ 📱  FULL-SCREEN      │   ← the fan shell, full size
            │  phone (5 surfaces,  │   (Guest/Home/Content/Connect/Settings)
            │  swipeable)          │
            └──────────────────────┘

   [ Deploy ]   ← deploy button (Part 4c)
```

**Behavior:**

| Scenario | Draft view | Live view | Visual cue |
|---|---|---|---|
| **Never deployed, fresh creator** | Empty draft / initial state | Platform default (Minimal theme + empty content) | Both views work; Live shows the fallback (see `features/branding.md` Part 11 Rule 2) |
| **After first deploy, no edits** | Matches Live (no diff) | The deployed page | Orange dot on "Draft" only if local buffer has anything pending |
| **Edited, not deployed** | The edits (in the local draft buffer) | The still-live page (old state) | **Orange dot on "Draft" + "Deploy" button pulses** |
| **After deploy** | Cleared (matches Live) | The deployed page | No dot, no pulse — creator is up to date |

**Data sources:**

- **Draft view** — reads from `localStorage[my-app_draft_${creatorId}]` (auto-saved every 3s per Part 4a). For "Live" comparison, also reads from the DB
- **Live view** — reads from `creators.custom_theme` + `creators.theme_id` + `creators.content_items` (filtered to **published only** per the Three Gates in `fan-shell.md` Part 2). Same `resolveBranding()` resolver as the real `/{username}` page (see `features/branding.md` Part 4)

**Defaults (founder decision, 2026-08-05):**

- **Default to Live** on opening My App — creators see "what fans see" first
- **Orange dot on the "Draft" label only** when `localStorage draft ≠ DB deployed state`
- **No dot on "Live"** — Live is always the source of truth
- **Same toggle when the owner visits their own live `/{username}`** — a bar at the top shows the same toggle (Draft / Live, default Live, orange dot on Draft when un-deployed). Same data sources + same resolver
- **Tap-to-edit popovers are always available** — every edit goes to the draft buffer (Live or Draft mode); the toggle only changes what's rendered

**Component name (tentative):** `PreviewStateToggle` — single component reused in both My App and the owner-view page.

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

> **PWA separation (founder decision 2026-08-05):** App Name, App Icon, and the PWA status bar color are **NOT on-page editable** — they're app-level (install-time) settings, not screen visuals. They live here in the **App sub-section** (below) and in `features/branding.md` Part 8. On-page tap-to-edit (Part 1a) covers only what's visible on screen.

- **Link Address** — *permanent, display-only.* Set once at signup (`onboarding.md`), never editable here. Shown as a read-only row: `creatorbiotree.com/{username}`. The public URL lives here; everything else on this tab is changeable.
  - ⚠️ The Link Address is permanent by founder decision — no change control, no redirects, no exceptions. A hidden backend UUID anchors all data (content, fans, purchases, follows); the Link Address is just the public label. Code/DB column stays `username` (user-facing copy says "Link Address").
  - Clarifying line on the tab: *"Your Link Address is the fan-facing URL. Your own Dashboard lives at `/dashboard` — it is never under your Link Address."*
- **App sub-section (PWA — separated from on-page editing):**
- **App Name** — PWA home screen title (shown on fans' phones)
  - ⚠️ Changeable anytime, with a **7-day lock** between changes (per founder decision — matches TikTok's nickname cadence). Existing installs keep old name until phone refresh.
- **App Icon** — file upload, shows preview
  - ⚠️ Same 7-day lock as App Name — existing installs keep old icon.
- **Status bar color** — PWA `theme_color` (from `colors.accent` by default — `features/branding.md` Part 9 #4)
- **Display Name** — creator's public name
  - ⚠️ Changeable anytime, with a **7-day lock** between changes. Static note: frequent changes confuse fans.
- **Bio** — textarea
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
- Every change auto-saved to localStorage every 3s (`my-app_draft_${creatorId}`)
- On mount, restores draft if one exists
- Deploy clears the draft
- Survives: browser close, lost connection, crash

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
1. Wire My App full-screen shell (5 surfaces, swipe, guest-first) + Preview State Toggle
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
| PhonePreview | `PhonePreview.tsx` | Old phone mockup + mini strip — **becomes the full-screen My App shell** (Part 1) |
| ElementPopover | *(new — no old code)* | Tap-to-edit popovers (Part 1a) |
| PreviewStateToggle | *(new — see branding.md Part 1b)* | Draft/Live toggle (Part 1b) |
| AppIdentityEditor | `AppIdentityEditor.tsx` | Link Address (read-only), app name, icon, bio |
| GlobalSettingsEditor | `GlobalSettingsEditor.tsx` | Colors, fonts, AI palette |
| BottomEditor | `BottomEditor.tsx` | Tab wrapper |
| BottomPanel | `BottomPanel.tsx` | Deploy bar (merge into BottomEditor) |
| MyAppInfoBanner | `MyAppInfoBanner.tsx` (formerly `PlaygroundInfoBanner.tsx`) | Dismissable banner |
| useMyAppForm | `useMyAppForm.ts` (formerly `usePlaygroundForm.ts`) | State + deploy + auto-save |
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

This single `my-app.md` (formerly `playground.md` — full rename 2026-08-05) replaces these 5 separate files:

| Old File | Merged Into |
|---|---|
| `catalog/catalog-roadmap.md` | Part 2c, Part 3, Part 5, Part 6 |
| `catalog/funnel/funnel.md` | Part 2c (Funnels subsection) |
| `integrations/integrations.md` | Part 2d (Artist Links), Part 2e (Integrations) |
| `email/email-campaigns.md` | Part 2f (Email Tab) |
| `media-kit/media-kit.md` | Part 2g (Media Kit Tab) |
