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
