/**
 * hopAttribution.ts — client-side fire-and-forget for the silent partner hop
 * (earnings.md Part 8, Door 2; fan-shell.md Part 4c). One POST per
 * host+partner pair per session, never awaited, failures swallowed — a hop
 * NEVER blocks opening the partner surface. The server tags attribution only
 * when an active deal exists between the pair.
 */
const fired = new Set<string>();

export function firePartnerHop(host: string, partner: string): void {
  if (!host || !partner || host === partner) return;
  const key = `${host}>${partner}`;
  if (fired.has(key)) return;
  fired.add(key);
  void fetch("/api/fan/hop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, partner }),
    keepalive: true,
  }).catch(() => {
    // Untracked hop is the conservative default — navigation already happened.
  });
}
