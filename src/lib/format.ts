/**
 * format.ts — shared display formatting (duplication audit 2026-09-29 #9 + trivial).
 * `money()` moved out of fan-pwa/fanData (was file-private; PartnerBody did raw
 * toFixed). NOTE: the whole money pipeline stores DOLLARS (item.price,
 * amount_paid, deal rates) — there is no cents path; `formatCents` was removed
 * 2026-09-29 after it surfaced a /100 display bug in both StatCards.
 * `formatDate()` replaces the bare `new Date(x).toLocaleDateString()` sites,
 * `DAY_LABELS` was byte-identical in two files.
 */

/** Currency amount → localized price string ("$9.00"). Falls back to `$N.NN` on bad input. */
export function money(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/** Date-ish → locale date string (e.g. "9/29/2026"). */
export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString();
}

/** Date-ish → locale date AND time (e.g. "9/29/2026, 4:12 PM"). */
export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString();
}

/**
 * Countdown to a future moment ("in 2h 14m"). Returns null for anything in the
 * past or unparseable, so callers can skip the line entirely.
 */
export function formatCountdown(target: string | number | Date, now: Date = new Date()): string | null {
  const ms = new Date(target).getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

/** Weekday full names, indexed by JS day number (0 = Sunday). */
export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
