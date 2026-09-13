# Login — Vision & Spec

## Concept

`/login` is the **creator/staff gateway** — one door for everyone on the platform side: the owner, future staff admins, and creators. Fans never land here — their auth lives inside the fan shell (see `fan-shell.md` Part 5: per-creator fan accounts, email + password).

The page has one job: **verify the creator's identity fast and get them to the dashboard.** Nothing more.

Designed from competitor research (Gumroad login, Patreon login, Stan 2FA, Beacons social login): email+password baseline → 2FA step when enabled → forgot password → clear create-account path → specific error copy → deep-link redirect.

**Design/UI = TBD.** This spec covers logic, flow, states, and behavior only. Visual design (branding, layout) is deferred — founder decision pending. Old page (`page-old.tsx`) kept as reference until then.

---

## Part 1: The Form (logic)

| Piece | Behavior |
|---|---|
| Email field | Required, trimmed, basic email validation |
| Password field | Required, no client-side length rules |
| Submit | Validate → attempt login → loading state on button → redirect on success |
| Error state | Inline error box above submit button, clears on next attempt |

**Specific error copy (Gumroad-style — differentiate root causes):**

| Cause | Message |
|---|---|
| No account with that email | "An account does not exist with that email." |
| Wrong password | "The password you entered was incorrect." |
| Account deleted | "This account was deleted. Create a new one to get started." |

In mock mode: **any email + password logs in** (creates/signs in the mock user) — the specific error copy only matters in production. Mock errors never occur.

---

## Part 2: After Login

| Context | Behavior |
|---|---|
| Mock | Set `mock_auth_uid` + `mock_auth_email` cookies (`max-age=3600`) → redirect |
| Default redirect | `/dashboard` |
| Deep-link | `?next=/dashboard/my-app` (etc.) → redirect there instead (Gumroad `next` param pattern) |
| `next` validation | Only allow internal paths (same-origin) — never open redirects to external URLs |
| Already logged in | Visiting `/login` while authenticated → redirect straight to `/dashboard` |

---

## Part 3: 2FA Step (production-only)

When the creator has 2FA enabled (see `settings.md` Part 1 + `admin.md` Part 1):

| Piece | Behavior |
|---|---|
| Flow | Email + password → **2FA code step** → success |
| Code entry | 6-digit TOTP input (authenticator app) |
| Backup codes | Link "Use a backup code" → 8-char code entry (single-use) |
| Device recognition | After successful 2FA, remember the device to skip the step next time (Stan-style) |
| Failure | Wrong code → inline error, retry; too many failures → lockout (prod) |
| Mock | 2FA flag stored on mock user; **no code verification** — step skipped in mock |

---

## Part 4: Forgot Password

| Piece | Behavior |
|---|---|
| Link | "Forgot your password?" below the form |
| Request | Enter email → "If an account exists, a reset link has been sent" (no account enumeration) |
| Mock | Reset email **logged to console** (mockResend), shows "check your email" message |
| Reset | Link/token → new password + confirm → success → back to login |
| Production | Real reset email via Resend; token TTL + single-use |

**Note (2026-08-10):** live routes `/api/fan/forgot-password` + `/api/fan/reset-password` are fan-side, and **`/api/creator/forgot-password` is also WIRED** (anonymous, 3/min, no enumeration — mock logs the reset link; production uses Supabase's native reset email). A creator **reset-password page** is not wired — mock logs the token link, and real mode uses Supabase's recovery email.

---

## Part 5: Create Account

- "Don't have an account? **Create one free**" → `/onboarding`
- Logic only; onboarding handles account creation (see `screens.md` onboarding entry)

---

## Part 6: Edge Cases

| Case | Behavior |
|---|---|
| Already logged in | Redirect to `/dashboard` (or `?next=`) |
| Invalid `?next=` | Fall back to `/dashboard` |
| Network error | Generic error message, no crash |
| 2FA-enabled user, backup codes exhausted | Production: reset via support flow (note only) |
| Rate limiting | Production: throttle repeated failures (Gumroad/rack-attack style) — not in mock |

---

## Part 7: Deferred (production roadmap)

| Feature | Status |
|---|---|
| Social login (Google / TikTok / Instagram / Facebook — **no Apple**, paid) | ✅ Decided 2026-08-08 — **mock buttons now** (log in as a test account), real providers plug behind the same buttons at production. Applies to creators AND fans (fan-shell.md Part 5) |
| Passkeys (WebAuthn) | Deferred — post-v1, production roadmap |
| CAPTCHA | Production hardening — deferred |

**Mock note:** the mock social buttons set a test user session directly (no real OAuth in mock). Real OAuth = developer registrations per provider at production time.

---

## Part 8: Mock ↔ Production Notes

| Piece | Mock | Production |
|---|---|---|
| Auth | Any email+password creates/signs in mock user, cookie set | Real Supabase auth + session cookie |
| 2FA | Flag stored, step skipped | TOTP via authenticator + backup codes |
| Forgot password | Console log (mockResend) | Resend email + token flow |
| Error copy | Unused (always logs in) | Specific messages per Part 1 |
| `next=` redirect | Works | Works + open-redirect guard |
| Rate limiting | None | Throttled attempts |

---

## Part 9: Decisions

| Topic | Status |
|---|---|
| #1 Email + password form with specific error copy | ✅ Decided |
| #2 `?next=` deep-link redirect (internal-only) | ✅ Decided |
| #3 2FA step in login flow (prod-only) | ✅ Decided — consistent with settings.md + admin.md |
| #4 Forgot password flow (mock: console log) | ✅ Decided — **wired 2026-08-10** (creator + fan routes; reset-password page = production work) |
| #5 Create account → `/onboarding` | ✅ Decided |
| #6 Social login for creators + fans (Google/TikTok/IG/FB), no Apple | ✅ Decided 2026-08-08 — mock buttons now, real providers at production |
| #7 Design/UI | ⏳ **TBD** — logic-first; founder decides later |

---

## Part 10: Existing Code Reference

### LIVE (still working)

| Piece | What it does |
|---|---|
| `src/app/login/page.tsx` | Address-book re-export → `src/screens/public/login/Screen.tsx` (server component: `?next=` validated, already-logged-in redirect) |
| `src/components/auth/AuthCard.tsx` | Centered wrapper — logo, title, subtitle, children |
| `src/components/auth/LoginForm.tsx` | Email + password, root-cause error copy, `?next=` redirect, mock auto-signup fallback, mock-only social buttons |

### Backups / reusable

| File | State | Reuse plan |
|---|---|---|
| `src/old-code/allScreens/login/page-old.tsx` | Old full page (104 lines, client component) | Reference only — design TBD, not deleted |
| `src/old-code/LoginForm.tsx` | Old email + password form | Archive copy of the promoted component — reference only |

| `src/old-code/AuthCard.tsx` | Centered card wrapper (logo, title, subtitle, children) | Reuse — shared by login/onboarding/forgot-password |