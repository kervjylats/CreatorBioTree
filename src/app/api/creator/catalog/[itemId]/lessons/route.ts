/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: course } = await supabase
      .from("content_items")
      .select("id")
      .eq("id", itemId)
      .eq("creator_id", user.id)
      .single();
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: modules, error: modError } = await supabase
      .from("course_modules")
      .select("id")
      .eq("course_id", itemId);

    if (modError) return NextResponse.json({ error: modError.message }, { status: 500 });

    const moduleIds = (modules ?? []).map((m) => (m as { id: string }).id);
    if (moduleIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from("course_lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order("sort_order", { ascending: true });

    if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 });
    return NextResponse.json({ data: lessons ?? [] });
  } catch (err) {
    console.error("Bulk lessons list error:", err);
    return NextResponse.json({ error: "Failed to list lessons" }, { status: 500 });
  }
}
