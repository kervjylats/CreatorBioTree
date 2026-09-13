/**
 * PayPal checkout (v1 rail, fan-shell.md Part 7 + monetization/creators.md Part 1a —
 * founder decision 2026-08-10): guest checkout is email-only; cards are accepted
 * without a PayPal account. The mock returns a fake PayPal URL that bounces back
 * to /[username]/guest?payment=success&item=… where the purchase is recorded
 * (see /api/fan/purchases/complete). Real mode: 503 until the PayPal SDK is
 * wired (WIRING_PLAN Sheet 21 note; stripe/checkout stays as the Atlas reference).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimiter } from "@/lib/rate-limiter";
import { contentService } from "@/services/contentService";
import { z } from "zod";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

const idSchema = USE_MOCKS ? z.string().min(1) : z.string().uuid();

const checkoutSchema = z.object({
  content_item_id: idSchema,
  fan_email: z.string().email(),
  creator_id: idSchema,
  /** "Also send me updates?" — a purchase NEVER auto-follows; this is the only bridge (fan-shell.md decision #12). */
  opt_in_updates: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!(await rateLimiter.check(`paypal-checkout:${ip}`, 10, 60_000))) {
      return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    if (!USE_MOCKS) {
      return NextResponse.json(
        { error: "PayPal is not configured yet. Please contact the creator directly." },
        { status: 503 },
      );
    }

    const { content_item_id, fan_email, creator_id, opt_in_updates } = validation.data;
    const supabase = createServiceClient();

    let item;
    try {
      item = await contentService.getById(content_item_id, supabase);
    } catch (err) {
      const message = (err as Error).message ?? "";
      if (message.toLowerCase().includes("not found")) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }
      throw err;
    }

    if ((item.price ?? 0) <= 0) {
      return NextResponse.json({ error: "Item is not paid" }, { status: 400 });
    }
    if (item.payment_handling === "external_link") {
      return NextResponse.json({ error: "This item uses the creator's own checkout." }, { status: 400 });
    }
    if (item.creator_id !== creator_id) {
      return NextResponse.json({ error: "Item does not belong to this creator" }, { status: 400 });
    }

    const { data: creator } = await supabase
      .from("creators")
      .select("username")
      .eq("id", creator_id)
      .maybeSingle();
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Origin of the request (dev: http://localhost:3000, any port) — the old
    // hardcoded localhost broke checkout on other dev ports; the real-mode
    // fallback env is the deployed app URL.
    const appUrl = USE_MOCKS ? request.nextUrl.origin : (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin);
    // Bounce straight to the guest screen — the completion logic lives there
    // (the old /[username] root redirect would drop the query params).
    const url = `${appUrl}/${creator.username}/guest?payment=success&item=${content_item_id}`;

    // In real mode this is where the PayPal order is created server-side.
    // v1: creator keeps 100% of sales — PayPal settlement splits land with
    // the Sheet 16 settlement engine (auto_split / manual).
    void fan_email;
    void opt_in_updates;

    return NextResponse.json({ url, session_id: `mock_paypal_${content_item_id}` });
  } catch (err) {
    console.error("PayPal checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}