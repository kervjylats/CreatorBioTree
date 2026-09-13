/**
 * Background Queue — Interface + Direct Mock
 *
 * For production at scale, use QStash (500 messages/day free)
 * or Inngest (10k events/month free).
 * See docs/EXTERNAL_SERVICES.md for setup steps.
 */

export interface IQueue {
  enqueue(name: string, payload: unknown): Promise<void>;
}

// ─── Handler registry ─────────────────────────────────────────────────────────

type JobHandler = (payload: unknown) => Promise<void>;
const handlers = new Map<string, JobHandler>();

/** Register a handler for a named job. Idempotent — replaces previous handler. */
export function onJob(name: string, handler: JobHandler): void {
  handlers.set(name, handler);
}

// ─── Direct Mock ─────────────────────────────────────────────────────────────

/**
 * Executes the job handler immediately (synchronous). Works locally for
 * small-scale testing. Not suitable for long-running jobs or Vercel
 * serverless timeouts.
 */
export class DirectQueue implements IQueue {
  async enqueue(name: string, payload: unknown): Promise<void> {
    const handler = handlers.get(name);
    if (handler) {
      await handler(payload);
    } else {
      console.log(`[DirectQueue] No handler for "${name}", payload:`, JSON.stringify(payload).slice(0, 200));
    }
  }
}

// ─── Production (commented — ready to activate) ─────────────────────────────
//
// export class QStashQueue implements IQueue {
//   private baseUrl = "https://qstash.upstash.io/v2/publish";
//   private token = process.env.QSTASH_TOKEN!;
//
//   async enqueue(name: string, payload: unknown): Promise<void> {
//     await fetch(`${this.baseUrl}/${name}`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${this.token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });
//   }
// }

// ─── Singleton ───────────────────────────────────────────────────────────────

export const queue: IQueue = new DirectQueue();
