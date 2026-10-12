/**
 * GET/PUT /api/creator/earnings/paypal — the creator's PayPal.me handle
 * (earnings.md §3, the one edit home). GET returns it for the editor; PUT
 * saves it (3–77 chars). Debtors' [Pay now] buttons open paypal.me/{handle},
 * so this is the payout endpoint for creator-to-creator settlements — profile
 * only, zero payment integration (v1 holds no money).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

const paypalSchema = z.object({
  paypal_handle: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9._-]{3,77}$/, "Use 3–77 letters, digits, dots, dashes or underscores")
    .nullable(),
});

/** GET — the current handle for §3's editor (own row only). */
export async function GET() {
  try {
    const { user, supabase } = await requireAuth();
    const { data, error } = await supabase
      .from("creators")
      .select("paypal_handle")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[earnings/paypal] read failed:", error);
      return NextResponse.json({ error: "Couldn't read your handle" }, { status: 500 });
    }
    return NextResponse.json({ paypal_handle: (data as { paypal_handle?: string | null } | null)?.paypal_handle ?? null });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { user, supabase } = await requireAuth();
    const body = await req.json();
    const validation = paypalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "That doesn't look like a PayPal.me handle." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("creators")
      .update({ paypal_handle: validation.data.paypal_handle })
      .eq("id", user.id)
      .select("paypal_handle")
      .single();
    if (error) {
      console.error("[earnings/paypal] update failed:", error);
      return NextResponse.json({ error: "Couldn't save your handle" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
