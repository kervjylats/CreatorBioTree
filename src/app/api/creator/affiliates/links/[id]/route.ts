/**
 * PATCH /api/creator/affiliates/links/[id] — toggle an affiliate link
 * between active and inactive (network.md §7).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

const toggleSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, supabase } = await requireAuth();
    const body = await req.json();
    const validation = toggleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "active boolean required" }, { status: 400 });
    }

    const { data: link } = await supabase
      .from("affiliate_links")
      .select("id, creator_id")
      .eq("id", id)
      .maybeSingle();

    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });
    if (link.creator_id !== user.id) {
      return NextResponse.json({ error: "Not your link" }, { status: 403 });
    }

    await supabase.from("affiliate_links").update({ active: validation.data.active }).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to update link" }, { status: 500 });
  }
}
