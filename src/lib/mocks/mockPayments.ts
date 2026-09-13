/** TODO: Add purpose docstring. */
/**
 * mockPayments.ts
 *
 * Local replacements for the Stripe (`src/lib/stripe.ts`) and Paddle
 * (`src/lib/paddle.ts`) integrations.
 *
 * The Stripe mock intercepts `checkout.sessions.create`. The migration usage
 * in `src/app/api/stripe/checkout/route.ts` passes:
 *   - `metadata.content_item_id`
 *   - `metadata.creator_id`
 * and reads `success_url` shaped `${appUrl}/${creatorUsername}?payment=…`
 * — so we synthesise an offline-friendly equivalent without any network.
 *
 * The Paddle mock implements `webhooks.unmarshal` so the Paddle webhook route
 * can be exercised offline by POSTing a JSON body.
 *
 * PRODUCTION-NOTE (Stripe): Real Stripe Checkout supports:
 *   - automatic_tax (Stripe Tax for VAT/GST compliance)
 *   - payment_intent_data.metadata (for tracking purchases)
 *   - expires_at (session auto-expiry)
 *   - customer_email and customer_creation
 *   - shipping_address_collection for physical goods
 *   - Radar fraud detection (built-in)
 *   - Real webhook event verification (signature checking)
 *
 * PRODUCTION-NOTE (Paddle): Real Paddle SDK supports:
 *   - Cryptographic webhook signature verification (webhooks.unmarshal)
 *   - Sandbox vs production environment switching
 *   - Transaction-level metadata and custom data
 *   - Subscription management APIs
 * When migrating, the returned data shape must match, but add the above features.
 */

// ─── Stripe ──────────────────────────────────────────────────────────────────

interface StripeCheckoutSession {
  id: string;
  url: string;
  payment_intent?: string;
  metadata?: Record<string, string | null>;
}

interface CheckoutMetadata {
  content_item_id?: string | null;
  creator_id?: string | null;
  fan_email?: string | null;
  referred_by?: string | null;
  commission_pct?: string | null;
  partner_stripe_account_id?: string | null;
}

interface CheckoutOptions {
  metadata?: CheckoutMetadata;
  success_url?: string;
  cancel_url?: string;
  line_items?: unknown[];
  // Everything else is ignored by the mock.
  [key: string]: unknown;
}

/**
 * Construct a mock Stripe Checkout Session URL that points the browser back to
 * the creator's page with a `payment=success` query param.
 *
 * `creatorUsername` and `contentItemId` are resolved from the metadata, and
 * `appUrl` is the running Next.js origin (defaults to localhost:3000).
 */
export function mockStripeCheckoutSessionCreate(
  opts: CheckoutOptions | undefined,
  creatorUsername?: string,
  contentItemId?: string,
): StripeCheckoutSession {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const username = creatorUsername ?? "creator";
  const item = contentItemId ?? opts?.metadata?.content_item_id ?? "";

  const url = `${appUrl}/${username}?payment=success&item=${item}`;

  return {
    id: `mock-session-${Date.now()}`,
    url,
    metadata: opts?.metadata as Record<string, string | null> | undefined,
  };
}

/**
 * Helper used by tests / dev-only POSTs to `/api/stripe/webhook` to synthesise
 * a `checkout.session.completed` event payload object (the shape the Stripe
 * webhook route consumes). Returns a plain JSON-friendly object so callers can
 * just `POST` it.
 */
export function mockStripeCheckoutEvent(
  metadata: CheckoutMetadata,
  amountPaid: number,
): Record<string, unknown> {
  return {
    id: `mock_evt_${Date.now()}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `mock_session_${Date.now()}`,
        amount_total: amountPaid,
        metadata,
        customer_details: { email: metadata.fan_email ?? "fan@example.com" },
      },
    },
  };
}

// ─── Paddle ──────────────────────────────────────────────────────────────────

interface PaddleUnmarshalledEvent {
  event_type: string;
  data: {
    id: string;
    customer_email?: string;
    email?: string;
    [key: string]: unknown;
  };
}

/**
 * Mock Paddle SDK. `webhooks.unmarshal` parses the raw body (which we expect
 * to be a JSON `transaction.completed` payload) into the shape the Paddle
 * webhook route consumes.
 *
 * The signature/secret args are intentionally ignored — in mock mode we trust
 * the incoming body verbatim.
 */
export const mockPaddle = {
  webhooks: {
    async unmarshal(
      rawBody: string,
      _secret: string | undefined,
      _signature: string | undefined,
    ): Promise<PaddleUnmarshalledEvent | null> {
      try {
        const parsed = JSON.parse(rawBody) as PaddleUnmarshalledEvent;
        if (!parsed || !parsed.event_type) return null;
        return parsed;
      } catch {
        return null;
      }
    },
  },
};

/** Build a `transaction.completed` Paddle-like payload for dev/testing. */
export function mockPaddleTransactionCompletedEvent(
  customerEmail: string,
): PaddleUnmarshalledEvent {
  return {
    event_type: "transaction.completed",
    data: {
      id: `mock_txn_${Date.now()}`,
      customer_email: customerEmail.toLowerCase(),
    },
  };
}