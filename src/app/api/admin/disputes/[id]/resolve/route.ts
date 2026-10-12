/**
 * POST /api/admin/disputes/[id]/resolve — the admin verdict on a settlement
 * (earnings.md Part 6). `settled` pays the promoter (admin judgment) and clears
 * both Red Cards; `reopen` returns a disputed row to awaiting_confirm with a
 * fresh 14-day window. History is never erased — disputed_at/dispute_reason stay.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { canPerform, getAdminAccount } from "@/lib/admin-permissions";
import { settlementDue } from "@/lib/limits";

const verdictSchema = z.object({
  verdict: z.enum(["settled", "reopen"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin || !canPerform(admin, "manage_disputes")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = verdictSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });
    }

    const { id } = await params;
    const serviceClient = createServiceClient();
    const { data: row } = await serviceClient
      .from("affiliate_conversions")
      .select("id, settlement_status")
      .eq("id", id)
      .maybeSingle();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.settlement_status !== "disputed") {
      return NextResponse.json({ error: "Only disputed payments can be resolved" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const patch =
      validation.data.verdict === "settled"
        ? { settlement_status: "settled", confirmed_at: now, settled_at: now, settled_manually: true }
        : { settlement_status: "awaiting_confirm", due_at: settlementDue() };

    const { data: updated, error } = await serviceClient
      .from("affiliate_conversions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ conversion: updated });
  } catch (err) {
    console.error("[admin/disputes/resolve]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
