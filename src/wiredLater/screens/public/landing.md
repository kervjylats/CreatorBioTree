# Landing Page — Vision & Spec

## Concept
The platform's public face. Anyone who visits `/` sees this page. It explains what BioTree is, how it works, and drives creator sign-ups.

## Status
**DEFERRED — end of development.** The current landing page is naked. Design will be spec'd later.

---

## Features (TBD — to be decided)

### What the old page had (backup in `page-old.tsx`):
- Hero section ("Your fans deserve more than a Linktree")
- How it works (3-step grid)
- Features grid (6 cards)
- Comparison table (BioTree vs Linktree)
- Nav bar with Sign In button
- Footer

### What might change (to be decided):
- Messaging, layout, sections, CTA strategy
- Whether to include creator search (like Network)
- Brand tone, imagery, animations

---

## Returning-Fan Row: "Your creators" (PLANNED — founder decision 2026-08-08)

When a returning fan — someone with an account (a **Fan**) **or an email-only follower relationship** (a **Follower**, `fan-shell.md` Part 1) under one or more creators — visits the landing page, it recognizes them and shows a personal row of the creators they follow, so they never need bookmarks or to remember URLs to get back to a creator's app.

**How it works (backend):**
1. The landing page reads the `fan_session` cookie (if present) → server looks up the session record → fan email. **Follower recognition uses the same cookie** — the follow-creator route sets the same `fan_session`, so email-only followers are recognized exactly like fans
2. Server queries `fan_accounts` for all rows with that email → the list of creator IDs the fan has accounts with (full accounts AND no-password follower rows)
3. Renders a **"Your creators" row** of creator cards (avatar + name) at the top of the landing page — tap → straight into that creator's app

**Edge cases:**

| Case | Behavior |
|---|---|
| No cookie (logged out / never signed up) | Normal landing page — no row, no hint that it exists |
| Cookies cleared / new device / different browser | Normal landing page; the row reappears the moment the fan logs into any creator app again (the list is rebuilt from server-side fan accounts by email, never from the cookie) |
| Email-only Follower who followed via email | Recognized via the follow session cookie; the row shows the creators they follow — same mechanism, no account needed |
| Fan has accounts under multiple creators | One row with all of them |
| Creator deleted their account | Row shows the remaining creators; the deleted one is dropped |
| Privacy | The row only renders for the identified fan — never leaks any creator names to random visitors. No tracking, no profiles — the cookie is only a session key |

**Wiring home:** rides the landing page build (Sheet 23 — deferred); the underlying query (fan email → all `fan_accounts` rows) can be wired with the fan shell (Sheet 21), where the follow-creator route also sets the `fan_session` so followers appear in this row. Spec'd now so it's not forgotten.

---

## References
- Old implementation: `src/old-code/allScreens/landing/page-old.tsx` (213 lines)
- Live page: `src/app/page.tsx` (naked skeleton)
