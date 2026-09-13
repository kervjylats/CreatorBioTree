/**
 * Fan purchases complete — mock PayPal webhook (fan-shell.md Part 7). After the
 * mock PayPal bounce-back, the guest screen POSTs here: find-or-create the buyer's
 * fan_accounts row (no password — guest buyers are Followers, never auto-followed),
 * record the completed purchase, and — only when the fan explicitly opted in —
 * set the fan_session cookie. Real mode: replaced by a PayPal webhook verifier
 * (WIRING_PLAN Sheet 21). Idempotent: a completed purchase for the same item +
 * email is not duplicated.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimiter } from "@/lib/rate-limiter";
import { contentService } from "@/services/contentService";
import { setFanSession } from "@/lib/fanSession";
import { z } from "zod";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

const idSchema = USE_MOCKS ? z.string().min(1) : z.string().uuid();

const completeSchema = z.object({
  content_item_id: idSchema,
  fan_email: z.string().email(),
  creator_id: idSchema,
  opt_in_updates: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!(await rateLimiter.check(`fan-purchase-complete:${ip}`, 20, 60_000))) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    // No payment verification in mock — real mode must verify PayPal webhook signature
    // before recording a purchase (WIRING_PLAN Sheet 21).
    if (!USE_MOCKS) {
      return NextResponse.json({ error: "Not implemented — requires PayPal webhook verification" }, { status: 501 });
    }

    const body = await request.json();
    const validation = completeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { content_item_id, fan_email, creator_id, opt_in_updates } = validation.data;
    const supabase = createServiceClient();
    const normalizedEmail = fan_email.toLowerCase();

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

    if (item.creator_id !== creator_id) {
      return NextResponse.json({ error: "Item does not belong to this creator" }, { status: 400 });
    }

    // Find-or-create the buyer row. Never touch an existing row's password_hash.
    const { data: existing } = await supabase
      .from("fan_accounts")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("creator_id", creator_id)
      .maybeSingle();

    let fanId = existing?.id ?? null;
    if (!fanId) {
      const { data: inserted, error: insertError } = await supabase
        .from("fan_accounts")
        .insert({ email: normalizedEmail, creator_id, password_hash: null, last_seen_at: new Date().toISOString() })
        .select("id")
        .single();
      if (insertError || !inserted) {
        console.error("[fan/purchases/complete] fan_accounts insert failed:", insertError);
        return NextResponse.json({ error: "Couldn't record the purchase — contact the creator." }, { status: 500 });
      }
      fanId = inserted.id;
    }

    // Idempotency — a completed purchase for this item + email already exists.
    const { data: dupes } = await supabase
      .from("fan_purchases")
      .select("id")
      .eq("fan_id", fanId)
      .eq("content_item_id", content_item_id)
      .eq("status", "completed")
      .maybeSingle();

    if (dupes) {
      return NextResponse.json({ ok: true, purchase_id: dupes.id, duplicate: true });
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from("fan_purchases")
      .insert({
        fan_id: fanId,
        creator_id,
        content_item_id,
        amount_paid: item.price ?? 0,
        currency: item.currency ?? "USD",
        status: "completed",
        purchased_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (purchaseError || !purchase) {
      console.error("[fan/purchases/complete] insert failed:", purchaseError);
      return NextResponse.json({ error: "Couldn't record the purchase — contact the creator." }, { status: 500 });
    }

    // Receipt — mock mode logs it (real: Resend/Supabase email, WIRING_PLAN Sheet 21).
    console.info(`[mock-receipt] ${normalizedEmail} purchased "${item.title}" for ${item.price} ${item.currency} — thanks!`);

    const response = NextResponse.json({ ok: true, purchase_id: purchase.id });

    // The ONLY follow bridge: the buyer's explicit "Also send me updates?" opt-in.
    if (opt_in_updates) {
      await setFanSession(response, fanId, creator_id, supabase);
    }

    return response;
  } catch (err) {
    console.error("[fan/purchases/complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}