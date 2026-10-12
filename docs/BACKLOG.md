/**
 * BACKLOG.md — Open feedback items from manual testing.
 * Harvested from mytesting.md (2026-09-14 testing session).
 * Items here are NOT wired yet — they are design/product decisions to address.
 */
# Backlog

Open items from manual testing. Not wired yet — design/product decisions pending.

---

## Overview Screen (/dashboard)

- [x] **Remove setup checklist** — **DONE:** the Overview no longer renders it (component unreferenced) and `components/overview/SetupChecklist.tsx` was deleted in the 2026-09-28 cleanup.
- [ ] **Remove quick actions except "Edit Playground"** — View my page is already in the sidebar, Install my fan app is already in the sidebar, Share your page is already in the QR section. Only "Edit Playground" should remain. Move it to take the space where the setup checklist was.

## Playground Editor — Identity Tab

- [x] **Move Display Name to Identity tab** — **SUPERSEDED 2026-10-09:** display name is NOT a Playground field at all — it moved to Settings → Profile as an identity field with a 7-day cooldown + avatar editor (settings.md Part 13, founder decision). It is not deployable from the Playground (draft carry + Deploy strip removed).
- [ ] **App Icon needs upload button** — currently URL-only input. Add a file upload button (same pattern as catalog cover uploads).

## Admin Panel

- [ ] **Invite staff button broken** — clicking "Invite" in the staff invite popup does nothing (stays in the popup). Needs debugging.

## Search

- [x] **Search should be accessible from Network tab** — **DONE 2026-09-26:** the Network hub's center is now a Discover grid (search input + result cards), per `docs/archive/NETWORK_REDESIGN_PLAN.md` Phase B.
- [ ] **Add server-side `limit()` to `GET /api/discover/creators`** — the scorer fetches ALL creators rows on every query (fine in mock; needs a LIMIT + pagination before real scale). Found 2026-10-09 during the identity smoke.

## Duplication audit (2026-09-29) — see `docs/DUPLICATION_AUDIT.md`

- [x] **Phase 1 sync fixes** — Logo · getInitials · INPUT_CLASS · affiliate rate bug · social-links helper · shared search engine. **DONE 2026-09-29.**
- [x] **Phase 2 dedupe batch** — fetchJson helper (19 sites) · shared EmptyState (14) · useCopyToClipboard (4) · follow-flow helper (3) · money/cents formatters · wire `contentService.getForCreator()` (3) · `lib/username.ts` · admin role labels · `enforceRateLimit()` (13 routes) · zod id + error shape unification · shared Sheet (z-index drift) · `lib/limits.ts` (client/server cap mismatch) · trivial sweep (spinner, formatDate, DAY_LABELS, setMockSession, guards, stat grid, red pill, avatar, form labels, switch, table shell). **DONE 2026-09-29.** Notable: the "cents" formatter was a trap — the money pipeline is all dollars, so `formatCents` was removed and both StatCards' `/100` display bug fixed with `money()`. Intentional skips: 3 EmptyState sites with pixel-drift markup, `<p>Loading…</p>` text variants, themed (brand-color) avatar variants.
- [ ] **Passkeys (WebAuthn) v2** — native-grade login: OS-stored credential survives cookie clearing; one biometric tap to re-auth. No roadmap overlap — new feature.
- [ ] **Branding → scoped CSS vars refactor** — `resolveBranding()` sets `--brand-*` on the fan-shell container (not `:root` — theme bleed with platform dashboard/preview); components read `var(--brand-accent)`. Medium refactor; current prop-based system works — tech-debt tidy.
- [x] **P1 migration: naming columns** — `is_discoverable` → `show_in_search` + new `open_to_collab` boolean (Naming Option B, 2026-09-29). **Code-side done 2026-09-29** (types/mock/routes/UI/specs renamed); the real-DB `ALTER TABLE creators RENAME COLUMN` + `ADD COLUMN open_to_collab boolean NOT NULL DEFAULT true` run at mock→production migration.

## Affiliate / settlement — money batch (parked 2026-10-12)

- [ ] **Refund clawback** (production-migration item, NOT v1) — when a fan's sale is refunded, the promoter's already-logged `affiliate_conversions` cut must be reversed (industry norm: Stripe/PayPal webhooks fire `refund` → engine writes a negative conversion / marks the receipt clawed-back). v1 has no real refund rail (PayPal webhook 501s outside mock), so nothing to wire yet — pair with the real PayPal webhook migration. Decided 2026-10-12 during the deals-overhaul review (that batch is parked until near end of dev).
