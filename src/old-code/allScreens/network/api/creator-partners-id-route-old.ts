/** Backup — PATCH/DELETE /api/creator/partners/[id]. Uses partnershipService from wiredLater. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* partnershipService was imported here — moved to wiredLater */

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnershipId } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status, commission_pct } = await req.json();
    const updateData: Record<string, unknown> = {};
    if (status) {
      if (!["active", "declined"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
    }
    if (commission_pct !== undefined) {
      const pct = parseFloat(commission_pct);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json({ error: "Invalid commission percentage (0-100)" }, { status: 400 });
      }
      updateData.commission_pct = pct;
    }

    const userId = user.id;
    /* was: partnershipService.getForCreator + partnershipService.update */
    const { data: partnerships } = await supabase.from("partnerships").select("id, creator_b, status").eq("id", partnershipId).limit(1).single();
    if (!partnerships || (partnerships as any).creator_b !== userId) {
      return NextResponse.json({ error: "Partnership request not found or unauthorized" }, { status: 404 });
    }
    if (status && (partnerships as any).status !== "pending") {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 });
    }
    await supabase.from("partnerships").update(updateData).eq("id", partnershipId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnershipId } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = user.id;
    /* was: partnershipService.getForCreator + partnershipService.delete */
    const { data: p } = await supabase.from("partnerships").select("id").eq("id", partnershipId).or(`creator_a.eq.${userId},creator_b.eq.${userId}`).limit(1).single();
    if (!p) {
      return NextResponse.json({ error: "Partnership not found or unauthorized" }, { status: 404 });
    }
    await supabase.from("partnerships").delete().eq("id", partnershipId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
