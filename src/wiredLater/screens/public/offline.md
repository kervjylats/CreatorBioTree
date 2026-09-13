# Offline — Vision & Spec

## Concept

Every installable app in the platform (landing page, creator dashboard, per-creator fan apps) gets a proper offline experience: a friendly fallback page when navigation fails, plus an **App Shell** pattern — the app's skeleton (layout, branding, nav) is saved on the user's device at install time so installed apps **open instantly, even offline**.

One principle governs everything: **the default pocket is tiny.** Only the app shell + session state + a curated list of small data are stored automatically. Anything big (media, files) is stored **only when the user deliberately presses Download** — never in the background.

---

## Part 1: The Fallback Page

When a user is offline and navigates to a page that isn't cached, the service worker serves the fallback page instead of a dead screen.

- Shows: offline indicator, "You're Offline" message, short explanation ("Some content might be unavailable until you're back online")
- **"Try Again" button** — reloads the page; when the connection is back, the real page loads
- Pre-cached at install time, so it's always available even fully offline
- Applies to every installed PWA (landing, dashboard, fan apps)

**Analogy:** the internet is a restaurant kitchen; every page is a dish. The fallback page is a take-home menu — when the kitchen is closed (offline), you still get something instead of an empty table.

---

## Part 2: What We Store (the tiny pocket)

Stored on the device automatically — **small by design**:

| What | Why | Size |
|---|---|---|
| **App Shell** (UI code, styles, icons, branding) | App skeleton — opens instantly, works offline | ~100KB–2MB (less than one photo) |
| **Session cookie** | Login state (per-creator fan / creator) | ~1KB |
| **Drafts** (My App autosave) | Unsaved work survives refresh/close | KBs |
| **Saved items** (fan bookmarks) | Fan's saved list persists | KBs |
| **Last-viewed content** (fan apps) | Offline = read what you already saw | small — only what was viewed |

**Never stored automatically:** media blobs, whole catalogs, anything the user hasn't viewed or downloaded.

**Storage is per-app:** each installed PWA has its own pocket (scope). A fan with Kevin's app + Shakiro's app has two separate pockets; clearing one never touches the other.

**Browser limits:** browsers cap per-site storage automatically (Chrome ~60% of free disk, capped at GBs). When full, old entries are dropped — the app still works.

---

## Part 3: Clearing Cache vs Cookies

| User clears... | What happens | Restore |
|---|---|---|
| **Cookies** | Logged out — just log in again. Nothing else changes (purchases/account/content are server-side, email-based) | Re-login |
| **Cache** | NOT like a new phone — app works exactly the same; first load is slower (fetches once), then copies re-fill automatically while browsing. No data lost, no re-login | Automatic |
| **Site data entirely** (cache + cookies + local) | Re-login + re-fill, plus local-only user data is gone (drafts, saved items) — **unless** it was server-synced (Part 4). User's deliberate choice | Server-synced data restored on login |

**Key rule:** cache = copies (rebuilt for free) · cookies = identity (re-login) · local user data = user-created (only they can delete it).

---

## Part 4: Local-First, Server-Synced

**Principle:** everything small the user creates is saved **on the phone first** (works offline), then **synced to the server** in the background. If the user clears site data or switches phones, they log back in (email-based) and the app pulls their data back.

| User | What syncs local ↔ server |
|---|---|
| **Creators** | Current My App draft, settings, **outbox messages** (pending sends queue and flush on reconnect — `messaging.md` Part 4) |
| **Fans** | Saved items, preferences, **draft message text** (unsent message survives a lost connection); purchases (server is the truth) |
| **Guests (no account)** | **Draft message text** only — a half-typed guest message survives; sending requires a connection + email capture |

**Draft lifecycle (My App):**
- New draft → overwrites the current draft (one working copy, not version history) — local + server both hold the latest
- **Deploy** → draft becomes the live version → draft is cleared automatically (local + server)
- Redesign later → becomes a draft again → synced to server again

**Retention:** server-side drafts + saved items are kept **forever** (until the user deletes or deploys) — cost is negligible because only text/IDs sync, never media.

**Cost guardrail:** media (videos, images, files) is never duplicated — it lives in one place (creator uploads); the server only stores tiny references to it. Storing 10,000 creators' drafts + saved items is a fraction of the free tier.

---

## Part 5: Downloads with Permission

**Big data is stored only on deliberate user action.**

- Creators offer downloadable items (any media: PDF, video, audio, image, course files — per `my-app.md` item types)
- Fan sees the item → buys/unlocks → presses **Download** → file saves to their phone
- Once downloaded, it's **their file** — works forever, even offline
- Downloads are tied to purchase records server-side → **re-downloadable** anytime (they own it)
- Never any background downloading; never any media stored without the user pressing Download

**Analogy:** Spotify downloads are user-requested; Netflix downloads are user-requested. Same rule here — the tiny pocket is automatic, downloads are a conscious act.

---

## Part 6: Who Gets What (all scenarios)

| Who | Installed? | Offline experience |
|---|---|---|
| **Anyone on landing PWA** (no account) | Yes | Homepage opens instantly from shell; static content works offline |
| **Creator dashboard** | Yes | Dashboard opens instantly; drafts autosave locally + sync (Part 4) |
| **Fan app (with account)** | Yes | Shell + last-viewed content + saved items + drafts-restorable data |
| **Guest on a creator's app** (no account) | Yes | Shell + the content from their last visit (old content shows offline; new content needs internet) |
| **Any of the above** | No (browser only) | Nothing cached — browser's standard error page, like every normal website. App still works 100% online |

**The offline rule everyone must know:** the phone only holds what was already seen. New content (creator uploads while the user was away) **never arrives offline** — that's the definition of offline, not a bug. The moment the user is online, the app fetches fresh content automatically.

**Install is always optional** — never required for anything, never tied to having an account. Non-installers get the normal internet experience.

---

## Part 7: Production Notes

| Piece | Mock | Production |
|---|---|---|
| Fallback page | Served from cache when fetch fails | Same (service worker navigation fallback) |
| App Shell cache | In-memory / dev SW | Real SW with precache of shell assets (landing, dashboard, fan apps) |
| Cache cleanup | Manual | SW deletes old cache versions on update (versioned cache names) |
| Drafts sync | In-memory | Draft column/table + debounced autosave sync; deploy clears it |
| Saved items sync | In-memory | `fan_saved_items`-style table (ID references only) |
| Downloads | Stub (no real files) | Real file delivery + storage; purchase-linked, re-downloadable |
| Sync details | — | Deferred to wiring/production: exact tables, sync timing, conflict handling |

---

## Open Decisions (discussed one at a time with the founder)

| Topic | Status |
|---|---|
| #1 App Shell scope | ✅ Decided — all 3 apps (landing, dashboard, fan apps) get the shell treatment |
| #2 Guest content cache | ✅ Decided — guests get shell + last-visit content (no account needed) |
| #3 Downloads | ✅ Decided — any media type; user-pressed Download only; re-downloadable; design stays in my-app.md |
| #4 Local-first sync | ✅ Decided — drafts + saved items sync local ↔ server; media never duplicated |
| #5 Retention | ✅ Decided — keep forever (current state only, no version history); deploy clears draft |
| #6 When to finalize sync details | ✅ Decided — principle now in this spec; implementation details at wiring/production |
