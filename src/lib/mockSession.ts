/**
 * mockSession — the mock-mode cookie session helper (duplication audit
 * 2026-09-29 trivial sweep: byte-identical `setMockSession` lived in both
 * LoginForm and OnboardingForm). Writes `mock_auth_uid` + `mock_auth_email`
 * for 1h (mock only — never call when USE_MOCKS is false).
 */

/** Set the in-browser mock session cookies (1 hour). */
export function setMockSession(userId: string, email: string): void {
  document.cookie = `mock_auth_uid=${userId}; path=/; max-age=3600; samesite=lax`;
  document.cookie = `mock_auth_email=${encodeURIComponent(email)}; path=/; max-age=3600; samesite=lax`;
}
