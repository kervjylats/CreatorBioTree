/**
 * Single source of truth for the mock/offline mode flag.
 *
 * Every interceptor reads this constant instead of re-checking the env var,
 * so there is no risk of string-literal drift between modules.
 *
 * The flag is evaluated once at module load. Next.js exposes
 * NEXT_PUBLIC_USE_MOCKS to both server and client bundles, so this works in
 * route handlers, server components, and client components alike.
 */
export const USE_MOCKS: boolean = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/** Re-export the raw value for any logger that wants a string. */
export const MOCK_MODE_LABEL: string = USE_MOCKS ? "MOCK" : "LIVE";