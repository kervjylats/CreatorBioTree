# Landing Page — Vision & Spec

## Concept
The platform's public face. Anyone who visits `/` sees this page. It explains what BioTree is, how it works, and drives creator sign-ups.

## Status
**✅ WIRED** — base page built 2026-09-14 (responsive pass) · Phase 4 extras wired 2026-09-29 (creator showcase, hero auth modal, platform install button, returning-fan row). Live: `src/screens/public/landing/Screen.tsx` + `src/components/landing/`.

---

## What's on the page (live)

1. **Nav** — Logo + **Sign in** → opens the real `LoginForm` in a dialog (`LandingAuthModal`) so visitors authenticate without leaving `/`. Sign-UP stays a link to `/onboarding` (multi-step flow).
2. **Returning-fan row** — "Your creators" (see Part 2 below); renders only for a recognized fan/follower.
3. **Hero** — headline + "Get your app" (→ `/onboarding`) + "See a live demo" + **Install BioTree** button (`LandingInstallButton`, platform PWA #1; hidden when installed/unsupported, iOS/in-app browsers get the manual steps).
4. **How it works** — 3-step grid.
5. **Creator showcase** (`CreatorShowcase`) — auto-scrolling marquee of discoverable creators (`show_in_search = true`, featured first, newest, max 12), each card links to `/{username}`. Hidden when fewer than 2 creators (smart live-stack rule). Pure CSS loop: duplicated track + `translateX(-50%)`, pauses on hover/focus, honors `prefers-reduced-motion`.
6. **Features grid** — 6 cards.
7. **Comparison table** — BioTree vs Linktree.
8. **Footer** — "Powered by BioTree".

Platform tokens only — never creator branding (branding.md). Responsive: 1-col phone → 2/3-col tablet/desktop.

---

## Returning-Fan Row: "Your creators" (✅ WIRED 2026-09-29; founder decision 2026-08-08)

When a returning fan — someone with an account (a **Fan**) **or an email-only follower relationship** (a **Follower**, `fan-shell.md` Part 1) under one or more creators — visits the landing page, it recognizes them and shows a personal row of the creators they follow, so they never need bookmarks or to remember URLs to get back to a creator's app.

**How it works (backend):**
1. The landing page (server component) reads the `fan_session` cookie (if present) → `getFanSession()` → fan email. **Follower recognition uses the same cookie** — the follow-creator route sets the same `fan_session`, so email-only followers are recognized exactly like fans
2. Server queries `fan_accounts` for all rows with that email → the list of creator IDs the fan has accounts with (full accounts AND no-password follower rows)
3. Renders a **"Your creators" row** of creator cards (avatar + name) directly under the nav — tap → straight into that creator's app

**Edge cases:**

| Case | Behavior |
|---|---|
| No cookie (logged out / never signed up) | Normal landing page — no row, no hint that it exists |
| Cookies cleared / new device / different browser | Normal landing page; the row reappears the moment the fan logs into any creator app again (the list is rebuilt from server-side fan accounts by email, never from the cookie) |
| Email-only Follower who followed via email | Recognized via the follow session cookie; the row shows the creators they follow — same mechanism, no account needed |
| Fan has accounts under multiple creators | One row with all of them |
| Creator deleted their account | Row shows the remaining creators; the deleted one is dropped (inner filter) |
| Privacy | The row only renders for the identified fan — never leaks any creator names to random visitors. No tracking, no profiles — the cookie is only a session key |

---

## References
- Old implementation: `src/old-code/allScreens/landing/page-old.tsx` (213 lines)
- Live page: `src/screens/public/landing/Screen.tsx` + `src/components/landing/{LandingAuthModal,LandingInstallButton,CreatorShowcase,YourCreatorsRow}.tsx` (route entry: `src/app/(public)/page.tsx`)
