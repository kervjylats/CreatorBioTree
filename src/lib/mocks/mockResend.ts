/** TODO: Add purpose docstring. */
/**
 * mockResend.ts
 *
 * Local replacement for the Resend email API (`resend.emails.send`). Mirrors
 * the `resend.emails.send({ from, to, subject, html })` call shape used directly
 * by `src/app/api/webhooks/paddle/route.ts` and the fan auth routes
 * (registration, forgot/reset password).
 *
 * Captures every email — including welcome credentials and reset links — by:
 *   1. `console.log`-ing a concise one-line summary (recipient + subject).
 *   2. Appending the full payload (to / subject / html / timestamp) to
 *      `temp_emails.log` at the workspace root, so reset URLs can be
 *      copied straight from the file without scrolling the terminal.
 *
 * `temp_emails.log` is gitignored and lives outside `src/` — so writing to it
 * never trips Next.js's file watcher.
 *
 * PRODUCTION-NOTE: Real Resend provides:
 *   - Domain authentication (SPF/DKIM) for deliverability
 *   - Bounce and complaint webhook callbacks
 *   - Attachment support (attachments array)
 *   - CC/BCC/reply_to fields
 *   - Tags for email analytics
 *   - Higher rate limits per plan
 *   - Real open/click tracking
 * When migrating, the mock's function signature (from, to, subject, html)
 * must remain the same, but the real call can ADD these features.
 */

interface ResendEmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string;
  attachments?: unknown[];
  tags?: unknown[];
  [key: string]: unknown;
}

interface ResendSendResponse {
  id: string;
}

const LOG_PATH_PREFIX = "temp_emails.log";

async function appendToLog(line: string): Promise<void> {
  try {
    // Lazy import — keeps `fs` out of the browser bundle.
    const fs = await import("node:fs/promises");
    const nodePath = await import("node:path");
    const full = nodePath.join(process.cwd(), LOG_PATH_PREFIX);
    await fs.appendFile(full, line + "\n");
  } catch (err) {
    // Never let logging break an email-triggering flow.
    console.warn("[mockResend] Failed to append to temp_emails.log:", err);
  }
}

/**
 * Mirrors `resend.emails.send(payload)` exactly. Returns a fake Resend message
 * id so callers using the (rare) return value keep working.
 */
export async function mockResendSend(
  payload: ResendEmailPayload,
): Promise<{ data: ResendSendResponse | null; error: null }> {
  const recipients = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;
  const ts = new Date().toISOString();

  // 1) Concise terminal line so the dev knows an "email" was captured.
  console.log(`[MockEmail] ${ts} TO:${recipients} SUBJECT:${payload.subject}`);

  // 2) Full payload to file — including any reset URLs living in the HTML.
  const block = [
    "──────────────────────────────────────────────────────────",
    `Timestamp: ${ts}`,
    `From:    ${payload.from}`,
    `To:      ${recipients}`,
    `Subject: ${payload.subject}`,
    payload.html ? `--- HTML ---\n${payload.html}` : "",
    payload.text ? `--- TEXT ---\n${payload.text}` : "",
    "──────────────────────────────────────────────────────────",
  ]
    .filter(Boolean)
    .join("\n");

  await appendToLog(block);

  return { data: { id: `mock-email-${Date.now()}` }, error: null };
}

/**
 * Convenience wrapper — many call sites do `new Resend(key).emails.send(...)`.
 * This builder returns an object that mimics just enough of the Resend client
 * so the existing `new Resend(...)` call sites can swap one line and still
 * type-check against the real `Resend` class (via the supabase/paddle-style
 * `as` boundary in the route interceptor).
 */
export function mockResendClient(): {
  emails: {
    send: (
      payload: ResendEmailPayload,
    ) => Promise<{ data: ResendSendResponse | null; error: null }>;
  };
} {
  return {
    emails: {
      send: (payload) => mockResendSend(payload),
    },
  };
}