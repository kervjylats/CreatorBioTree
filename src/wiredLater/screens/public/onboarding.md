# Onboarding — Vision & Spec

## Concept
The creator signup page. Creates a creator account (Link Address, display name, email, password). After signup, redirects to `/dashboard/my-app`. Also handles **partnership invites** via `?invite=CODE` (see `partnership.md`).

Two invite modes exist — only ONE flows through onboarding:

| Invite type | Path | Spec |
|---|---|---|
| Partnership (`partner_invites` code) | Outsider clicks `?invite=CODE` → completes onboarding → auto-connected as the inviter's partner (`partnerships` row, `source: "invited"`), title "Join your partner" | `partnership.md` |
| Team (`creator_team_invites` code) | Email link → direct accept at `dashboard/team/accept?token=...` via a **dedicated lightweight screen** (email + password only — no Link Address) — does NOT touch onboarding | `team.md` |

## Status
**WIRED 2026-08-10 (Sheet 7)** — the core form is live: Link Address field (debounced availability check), display name, email, password, permanence confirm dialog, `?invite=` ride-in (stored in signup metadata; auto-connect wiring is Sheet 13), success → `/dashboard/my-app`. **Education copy + full design are deferred to the post-launch polish pass, like the landing page.**

---

## What the old page had (backup in `page-old.tsx`)
- Centered card form: Display Name, Email, Password (min 8 chars)
- Title switches when `?invite=` present ("Join your partner" for partnership invites vs "Create your account")
- Already-logged-in guard → redirects to `/dashboard/my-app`
- Error display; on success → `/dashboard/my-app`

---

## The Link Address field (finalized decision)

The user-facing name for what code/docs call **`username`**. Chosen **once, at signup — permanent, never changeable, no exceptions.**

- **Field:** "Link Address" — 3-20 chars, lowercase, numbers, underscores
- **Live availability check** (debounced) — shows available/unavailable as they type; must be available to submit
- **Confirm dialog on submit:** *"Your Link Address is permanent and can never be changed. Fans will visit you at `creatorbiotree.com/{link-address}`. Continue?"* — no path back
- **Inline permanence note** under the field: *"Choose carefully — this is your fan-facing URL and can't be changed later."*
- **On success:** Link Address (as `username`) saved with the creator row → redirect to `/dashboard/my-app`

**Why permanent:** the Link Address is the public URL. Changing it would break every fan bookmark, install, and old link — we decided NO redirects (competitors: Linktree/TikTok/Patreon all let old links die). The hidden backend UUID anchors all data (content, fans, purchases, follows); the Link Address is just the public label. Display name / app name / app icon ARE changeable (7-day locks) — see `my-app.md` Part 2a.

**Terminology:** user-facing copy says "Link Address"; code, DB column, and docs keep `username`. Never show "username" in UI copy.

## What might change (to be decided)
- Messaging, layout, design (deferred with landing/demo)
- Whether post-signup setup steps appear here or live entirely in My App

---

## References
- Old implementation: `src/old-code/allScreens/onboarding/page-old.tsx` (130 lines)
- Live: `src/app/onboarding/page.tsx` → `src/screens/public/onboarding/Screen.tsx` + `src/components/auth/OnboardingForm.tsx` (Sheet 7, 2026-08-10)
- Live routes: `POST /api/creator/register` (sets Link Address + display name on the mock-created row), `GET /api/creator/check-username` (anonymous availability)
- Parts archive (old code, reference only): `src/old-code/AuthCard.tsx` (shared with login/forgot-password)
