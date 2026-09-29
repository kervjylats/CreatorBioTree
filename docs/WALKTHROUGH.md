# WALKTHROUGH — The App, One Screen at a Time

> **What this is:** a living, screen-by-screen tour of CreatorBioTree — what each
> URL is, which files build it, what they do, and what to touch to change things.
> Written in plain terms (sandwiches, kitchens, fridges) — no CS degree required.
>
> **How we walk:** one stop at a time, in journey order (Landing → … → Offline).
> Each stop is researched from the real files before it's written here.
> **Status legend:** ✅ written · ⬜ not visited yet.
>
> **Companion docs:** `docs/HOW_IT_WORKS.md` (how the machine works),
> `docs/CODEBASE.md` (exhaustive file reference). This one is the guided tour.

---

## 🗺️ The route (14 stops)

| # | Stop | URL | Status |
|---|---|---|---|
| 00 | Primer — how to read any screen | — | ✅ |
| 01 | Landing | `/` | ✅ |
| 02 | Login | `/login` | ⬜ |
| 03 | Onboarding (signup + Link Address) | `/onboarding` | ⬜ |
| 04 | The Frame — shell (sidebar / bottom bar / dock) | `/dashboard` | ⬜ |
| 05 | Overview | `/dashboard/overview` | ⬜ |
| 06 | My App (phone preview + deploy) | `/dashboard/my-app` | ⬜ |
| 07 | Network hub (Discover + affiliate rail) | `/dashboard/network` | ⬜ |
| 08 | Circle → Partners | `/dashboard/circle/partners` | ⬜ |
| 09 | Circle → Fans | `/dashboard/circle/fans` | ⬜ |
| 10 | Circle → Staff | `/dashboard/circle/staff` | ⬜ |
| 11 | Circle → Messages | `/dashboard/circle/messages` | ⬜ |
| 12 | Settings | `/dashboard/settings` | ⬜ |
| 13 | Admin | `/admin` | ⬜ |
| 14 | Fan side — guest page → fan shell → partner page | `/{username}...` | ⬜ |
| 15 | Offline + the 3 PWAs | `/offline` | ⬜ |

---

## 🧠 Stop 00 — The Primer: how to read ANY screen

**Nutshell:** every screen is a **3-layer sandwich**. Once you see it, you can't unsee it:

```
🚪 page.tsx          → the door (URL). Usually just 2 lines pointing downstairs.
🧠 Screen.tsx        → the manager (src/screens/...). Chooses what shows, grabs data, sets page title.
🎨 components/       → the pixels (buttons, cards). The actual stuff you see.
🔧 /api/...          → the kitchen (routes that cook data)
🧊 lib/mocks/        → the fake fridge (in-memory data until real Supabase)
```

### The folder dictionary

| Folder | Analogy | What it holds |
|---|---|---|
| `src/app/` | 📮 Post office | Every folder = a URL. `(public)` / `(shell)` / `(fan)` are **invisible** in the URL — they just organize related pages |
| `src/screens/` | 🧠 Managers | One `Screen.tsx` per page — the real logic lives here |
| `src/components/` | 🎨 Pixels | Reusable UI. Folder named after the screen/button it serves (the "product-name folder rule") |
| `src/app/api/` | 🔧 Kitchen | Data endpoints (`/api/messages/*`, `/api/creator/peeps`, `/api/discover/creators`, …) |
| `src/lib/` | 🧰 Toolbox | Helpers: `chat.ts`, `branding.ts`, `fanSession.ts`, `mocks/` |
| `src/wiredLater/` | 📐 Blueprints | **Specs only, zero code** — the plans for what gets built |
| `src/old-code/` | 🏛️ Museum | Old code kept for reference — **never wire from it** |
| `docs/` | 📖 Guidebooks | `HOW_IT_WORKS`, `CODEBASE`, and this walkthrough |

### 3 primer facts that apply everywhere

1. **URL = folder mirror:** `/dashboard/circle/staff` →
   `src/app/(shell)/dashboard/circle/staff/page.tsx`
   (the `(shell)` group never appears in the URL)
2. **The bouncer = `src/proxy.ts`:** middleware that runs before every page.
   Visit `/dashboard` with no login cookie → bounced to `/login`.
   It also maps `yourname.creatorpwa.app` → your page, and gates `/admin` to admins.
3. **Colors = design tokens:** classes like `bg-background`, `text-primary`,
   `border-border` pull from ONE palette defined in `src/styles/globals.css`
   (cream + forest green = the platform look). **Fan pages don't use these** —
   creators get their own colors through `branding.ts` (inline styles).

---

## 🚪 Stop 01 — Landing `/`

**🎯 What it is:** the shop sign. Public marketing homepage — no login, no data,
no API. Pure static UI.

**🗂️ The chain** (this one's SPECIAL — it skips the components layer):

| Layer | File | Role |
|---|---|---|
| 🚪 Door | `src/app/(public)/page.tsx` | 2 lines: re-exports `@/screens/public/landing` |
| 🧠 Manager | `src/screens/public/landing/Screen.tsx` (181 lines) | **The ENTIRE page lives here** — nav, hero, "How it works", features grid, Linktree comparison table, footer + tiny local `FeatureCard` / `TableRow` helpers |
| 📐 Spec | `src/wiredLater/screens/public/landing.md` | The blueprint it was built from |

**🧠 Gotchas:**
- **Self-contained** — the only screen with no `components/` folder and no `/api`
  calls (100% static)
- **`export const metadata`** (Screen.tsx line 10) = SEO / tab title — lives in
  Screen.tsx, NOT page.tsx
- **"See a live demo"** (line 65) → ``/${NEXT_PUBLIC_DEMO_USERNAME ?? "rowin"}``
  — an env var decides which creator the demo links to
- `min-h-screen-safe` = phone-safe full-screen height (the responsive pattern
  from `wiredLater/features/responsive.md`)

**🛠️ Common edits:**

| You want to change... | Touch |
|---|---|
| Hero headline / subtext / CTAs | `Screen.tsx` lines 42–75 |
| Demo link target | line 65 (or set `NEXT_PUBLIC_DEMO_USERNAME`) |
| Add a new section | new `<section>` inside `Screen.tsx` |
| Page title / SEO | `metadata` block, lines 10–18 |
| Platform colors (affects ALL pages) | `src/styles/globals.css` tokens |

---

*(Stops 02–15 get appended here as we walk.)*
