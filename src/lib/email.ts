/** TODO: Add purpose docstring. */
/**
 * Email Sender — Interface + Mock Implementation
 *
 * For production, use Resend (3,000 emails/month free).
 *
 * PRODUCTION-NOTE: Real Resend provides:
 *   - Domain authentication (SPF/DKIM) for deliverability
 *   - Bounce and complaint webhook notifications
 *   - Attachment support
 *   - CC/BCC/reply_to fields
 *   - Tags for email analytics and categorization
 *   - Scheduled sending
 *   - Rate limits per plan (100/day free, higher on paid)
 * When migrating, uncomment ResendEmailSender and set RESEND_API_KEY.
 * The mock's .send(to, subject, html) signature must stay the same.
 */

import { USE_MOCKS } from "@/lib/mocks/useMocks";
import { mockResendSend } from "@/lib/mocks/mockResend";

export interface IEmailSender {
  send(to: string, subject: string, html: string): Promise<void>;
}

// ─── Mock Implementation ─────────────────────────────────────────────────────

/** Logs emails to console. No external service needed for local testing. */
export class MockEmailSender implements IEmailSender {
  async send(to: string, subject: string, html: string): Promise<void> {
    if (USE_MOCKS) {
      await mockResendSend({ from: "noreply@localhost", to, subject, html });
      return;
    }
    console.log(`[MockEmail] TO: ${to} | SUBJECT: ${subject}`);
  }
}

// ─── Production (commented — ready to activate) ─────────────────────────────
//
// import { Resend } from "resend";
//
// export class ResendEmailSender implements IEmailSender {
//   private resend = new Resend(process.env.RESEND_API_KEY!);
//
//   async send(to: string, subject: string, html: string): Promise<void> {
//     await this.resend.emails.send({
//       from: process.env.EMAIL_FROM ?? "noreply@creatorbiotree.com",
//       to,
//       subject,
//       html,
//     });
//   }
// }

// ─── Singleton ───────────────────────────────────────────────────────────────

export const emailSender: IEmailSender = new MockEmailSender();