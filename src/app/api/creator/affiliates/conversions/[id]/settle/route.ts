/**
 * POST /api/creator/affiliates/conversions/[id]/settle — receipt protocol
 * (earnings.md Part 3): mark_paid (owner → awaiting_confirm, hold 409 +
 * grace-cure), confirm (promoter → settled), dispute (promoter → disputed +
 * reason). Role-checked, idempotent, immutable cuts; emails the counterparty.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";
import { computeRedCard, type SettlementConvRow } from "@/lib/settlement";
import { settlementDue } from "@/lib/limits";
import { emailSender } from "@/lib/email";
import { money } from "@/lib/format";

const settleSchema = z.object({
  action: z.enum(["mark_paid", "confirm", "dispute"]),
  reason: z.string().max(500).optional(),
});

interface DealForRow {
  id: string;
  owner_id: string;
  promoter_id: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const validation = settleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { action, reason } = validation.data;

    const { data: row } = await supabase
      .from("affiliate_conversions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const conversion = row as SettlementConvRow | null;
    if (!conversion) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: dealData } = await supabase
      .from("affiliate_deals")
      .select("id, owner_id, promoter_id")
      .eq("id", String(conversion.deal_id))
      .maybeSingle();
    const deal = dealData as DealForRow | null;
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const status = conversion.settlement_status;
    const amount = Number(conversion.promoter_cut ?? 0);

    if (action === "mark_paid") {
      if (deal.owner_id !== user.id) {
        return NextResponse.json({ error: "Only the deal owner can mark this paid" }, { status: 403 });
      }
      if (status === "awaiting_confirm") {
        return NextResponse.json({ conversion, already: true });
      }
      if (status !== "pending") {
        return NextResponse.json({ error: "This payment is no longer open" }, { status: 409 });
      }

      // Lock ③ + grace-cure: hold while the RECEIVER is red — but a payer who is
      // themselves 🟥 may always pay (clearing their own arrears is the unlock).
      const [receiverRed, payerRed] = await Promise.all([
        computeRedCard(supabase, deal.promoter_id),
        computeRedCard(supabase, user.id),
      ]);
      if (receiverRed.red && !payerRed.red) {
        return NextResponse.json(
          { error: "This payment is on hold — the receiver has overdue affiliate payments. The clock is paused until they clear." },
          { status: 409 },
        );
      }

      const now = new Date().toISOString();
      const { data: updated } = await supabase
        .from("affiliate_conversions")
        .update({
          settlement_status: "awaiting_confirm",
          owner_paid_at: now,
          due_at: settlementDue(), // promoter's 14-day confirm window
          held_since: null,
        })
        .eq("id", id)
        .select("*")
        .single();

      const promoterEmail = await contactEmail(supabase, deal.promoter_id);
      if (promoterEmail) {
        emailSender
          .send(promoterEmail, `Payment of ${money(amount)} marked sent — confirm or dispute`, `<p>The deal owner marked your ${money(amount)} payment as sent. Confirm within 14 days to settle it, or dispute it and the platform owner decides.</p>`)
          .catch((err) => console.error("[settle] email failed:", err));
      }
      return NextResponse.json({ conversion: updated ?? null });
    }

    // confirm / dispute — promoter side only.
    if (deal.promoter_id !== user.id) {
      return NextResponse.json({ error: "Only the promoter can act on this receipt" }, { status: 403 });
    }

    if (action === "confirm") {
      if (status === "settled") return NextResponse.json({ conversion, already: true });
      if (status !== "awaiting_confirm") {
        return NextResponse.json({ error: "The owner hasn't marked this paid yet" }, { status: 409 });
      }
      const now = new Date().toISOString();
      const { data: updated } = await supabase
        .from("affiliate_conversions")
        .update({ settlement_status: "settled", confirmed_at: now, settled_at: now, settled_manually: true })
        .eq("id", id)
        .select("*")
        .single();
      const ownerEmail = await contactEmail(supabase, deal.owner_id);
      if (ownerEmail) {
        emailSender
          .send(ownerEmail, `Payment of ${money(amount)} confirmed ✓`, `<p>Your promoter confirmed the ${money(amount)} payment. Settled.</p>`)
          .catch((err) => console.error("[settle] email failed:", err));
      }
      return NextResponse.json({ conversion: updated ?? null });
    }

    // dispute
    if (status === "disputed") return NextResponse.json({ conversion, already: true });
    if (status !== "awaiting_confirm") {
      return NextResponse.json({ error: "Only a marked-paid payment can be disputed" }, { status: 409 });
    }
    const now = new Date().toISOString();
    const { data: updated } = await supabase
      .from("affiliate_conversions")
      .update({ settlement_status: "disputed", disputed_at: now, dispute_reason: reason ?? null })
      .eq("id", id)
      .select("*")
      .single();
    const ownerEmail = await contactEmail(supabase, deal.owner_id);
    if (ownerEmail) {
      emailSender
        .send(ownerEmail, `Your ${money(amount)} payment was disputed`, `<p>${reason ? `Reason: ${reason}. ` : ""}A platform admin reviews it in the Disputes queue — both accounts are in Red Card until a verdict.</p>`)
        .catch((err) => console.error("[settle] email failed:", err));
    }
    return NextResponse.json({ conversion: updated ?? null });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to settle" }, { status: 500 });
  }
}

/** Counterparty email for event notices — creators.email, no auth lookup needed. */
async function contactEmail(supabase: SupabaseClient, creatorId: string): Promise<string | null> {
  const { data } = await supabase
    .from("creators")
    .select("email")
    .eq("id", creatorId)
    .maybeSingle();
  return (data as { email?: string | null } | null)?.email ?? null;
}
