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

    const { data, error } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", itemId)
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Modules list error:", err);
    return NextResponse.json({ error: "Failed to list modules" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
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

    const body = await req.json();
    const { title, description } = body;

    const { data: countData } = await supabase
      .from("course_modules")
      .select("id", { count: "exact" })
      .eq("course_id", itemId);

    const nextSort = (countData ?? []).length + 1;

    const { data, error } = await supabase
      .from("course_modules")
      .insert({
        course_id: itemId,
        creator_id: user.id,
        title: title || "New Module",
        description: description ?? null,
        sort_order: nextSort,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Modules create error:", err);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}
