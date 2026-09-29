/**
 * Shared CSS class constants for form inputs across the admin/dashboard UI.
 * Centralizes the repeated inputClass string used in PricingEditor, ItemEditor, etc.
 */

/** Standard input field class for admin/dashboard forms. */
export const INPUT_CLASS = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

/** Standard form section label class (was hand-rolled 30+×; `ui/input`'s drifted variant moves here too). */
export const LABEL_CLASS = "text-xs font-bold uppercase tracking-wide text-muted-foreground";
