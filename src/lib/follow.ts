/**
 * follow.ts — shared "follow with email" POST (duplication audit 2026-09-29 #7).
 * FollowBox, GuestPageContent, and ChatShell each inlined the
 * `/api/fan/follow-creator` fetch; they keep their own toast copy + reload
 * timing, this only owns the request/parse/normalize step.
 */

export interface FollowResult {
  ok: boolean;
  /** Server-provided error message when `ok` is false (undefined = network/parse failure). */
  error?: string;
}

/** POST a follow (or unlock) for `email` on `creatorUsername`; normalizes the email like FollowBox does. */
export async function submitFollow(email: string, creatorUsername: string): Promise<FollowResult> {
  try {
    const res = await fetch("/api/fan/follow-creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), creator_username: creatorUsername }),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : undefined;
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
