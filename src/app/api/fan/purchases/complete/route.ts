/**
 * Fan purchases complete — mock PayPal webhook (fan-shell.md Part 7). After the
 * mock PayPal bounce-back, the guest screen POSTs here: find-or-create the buyer's
 * fan_accounts row (no password — guest buyers are Followers, never auto-followed),
 * record the completed purchase, write the affiliate conversion (creators.md Part
 * 2e2), and always set the fan_session cookie so the buyer is recognized on this
 * device (G1, 2026-09-23). The "Also send me updates?" opt-in (fan-shell.md
 * decision #12) is persisted as `marketing_opt_in` — the only bridge to email
 * updates. Real mode: PayPal webhook verifier (WIRING_PLAN Sheet 21). Idempotent.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { idSchema } from "@/lib/zod-helpers";
import { contentService } from "@/services/contentService";
import { setFanSession } from "@/lib/fanSession";
import { recordAffiliateConversion } from "@/lib/affiliateAttribution";
import { z } from "zod";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

const completeSchema = z.object({
  content_item_id: idSchema,
  fan_email: z.string().email(),
  creator_id: idSchema,
  opt_in_updates: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const tooMany = await enforceRateLimit(request, "fan-purchase-complete", 20, 60_000);
    if (tooMany) return tooMany;

    // No payment verification in mock — real mode must verify PayPal webhook signature
    // before recording a purchase (WIRING_PLAN Sheet 21).
    if (!USE_MOCKS) {
      return NextResponse.json({ error: "Not implemented — requires PayPal webhook verification" }, { status: 501 });
    }

    const body = await request.json();
    const validation = completeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
        .insert({
          email: normalizedEmail,
          creator_id,
          password_hash: null,
          marketing_opt_in: opt_in_updates,
          last_seen_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (insertError || !inserted) {
        console.error("[fan/purchases/complete] fan_accounts insert failed:", insertError);
        return NextResponse.json({ error: "Couldn't record the purchase — contact the creator." }, { status: 500 });
      }
      fanId = inserted.id;
    } else if (opt_in_updates) {
      // The buyer opted in on this purchase — persist the email-updates consent
      // on their existing Follower row (never downgrades an existing opt-in).
      await supabase.from("fan_accounts").update({ marketing_opt_in: true }).eq("id", fanId);
    }

    // Idempotency — a completed purchase for this item + email already exists.
    const { data: dupes } = await supabase
      .from("fan_purchases")
      .select("id")
      .eq("fan_id", fanId)
      .eq("content_item_id", content_item_id)
      .eq("status", "completed")
      .maybeSingle();

    const purchaseCtx = {
      creatorId: creator_id,
      itemId: content_item_id,
      itemType: item.type,
      amount: item.price ?? 0,
      fanId,
    };

    if (dupes) {
      // Idempotent second chance — the conversion writer dedupes per sale + deal,
      // so a replayed purchase heals a ledger row whose first write failed.
      await recordAffiliateConversion(supabase, request.cookies, {
        saleId: dupes.id,
        ...purchaseCtx,
      });
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

    // Affiliate conversion (creators.md Part 2e2) — validates the /ref attribution
    // cookie against this deal's rules, computes both cuts and writes the pending
    // settlement row. Best-effort: a ledger failure logs, never fails the receipt.
    await recordAffiliateConversion(supabase, request.cookies, {
      saleId: purchase.id,
      ...purchaseCtx,
    });

    // Receipt — mock mode logs it (real: Resend/Supabase email, WIRING_PLAN Sheet 21).
    console.info(`[mock-receipt] ${normalizedEmail} purchased "${item.title}" for ${item.price} ${item.currency} — thanks!`);

    const response = NextResponse.json({ ok: true, purchase_id: purchase.id });

    // G1 (2026-09-23): ALWAYS recognize the buyer on this device so they're
    // never asked to re-buy something they already own. The "Also send me
    // updates?" opt-in remains the ONLY bridge to actual email updates — a
    // purchase still NEVER auto-follows (fan-shell.md decision #12).
    await setFanSession(response, fanId, creator_id, supabase, request.cookies);

    return response;
  } catch (err) {
    console.error("[fan/purchases/complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}