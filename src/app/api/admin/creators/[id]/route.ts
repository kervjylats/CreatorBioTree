/** Admin creator update — PATCH features/plan for a specific creator. Admin only. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccount } from "@/lib/admin-permissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await getAdminAccount(user.id);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const allowedUpdates = ["is_featured", "plan"];
    const updateData: any = {};
    allowedUpdates.forEach(key => {
      if (body[key] !== undefined) updateData[key] = body[key];
    });

    const { data, error } = await supabase
      .from("creators")
      .update(updateData)
      .eq("id", creatorId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
