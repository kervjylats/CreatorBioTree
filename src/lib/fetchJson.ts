/**
 * fetchJson — one fetch → JSON helper replacing the 19 hand-rolled
 * `fetch(url).then(r => r.json())` blocks (duplication audit 2026-09-29 #8).
 * Throws an Error carrying the server's `error` message (or a status
 * fallback) on non-OK responses; callers keep their own catch/toast copy.
 */
export async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = "";
    try {
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "error" in body) {
        const err = (body as { error?: unknown }).error;
        if (typeof err === "string") message = err;
      }
    } catch {
      // non-JSON error body — fall through to the status fallback
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}
