/**
 * username.ts — the Link Address rule, one home (duplication audit 2026-09-29 #11).
 * `^[a-z0-9_]{3,20}$` was written verbatim in OnboardingForm, check-username,
 * and register; the input cleaner lived only in OnboardingForm.
 */

/** Link Address pattern: 3–20 chars, lowercase letters / digits / underscore. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/** True when `value` is a valid Link Address (format only — availability is separate). */
export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

/** Sanitize live input to the Link Address alphabet (lowercase, strip everything else). */
export function cleanUsernameInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}
