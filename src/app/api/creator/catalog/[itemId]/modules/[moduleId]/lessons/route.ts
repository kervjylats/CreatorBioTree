/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ itemId: string; moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: mod } = await supabase
      .from("course_modules")
      .select("id")
      .eq("id", moduleId)
      .eq("creator_id", user.id)
      .single();
    if (!mod) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Lessons list error:", err);
    return NextResponse.json({ error: "Failed to list lessons" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string; moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: mod } = await supabase
      .from("course_modules")
      .select("id")
      .eq("id", moduleId)
      .eq("creator_id", user.id)
      .single();
    if (!mod) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { title, description, file_url, duration_minutes } = body;

    const { data: countData } = await supabase
      .from("course_lessons")
      .select("id", { count: "exact" })
      .eq("module_id", moduleId);

    const nextSort = (countData ?? []).length + 1;

    const { data, error } = await supabase
      .from("course_lessons")
      .insert({
        module_id: moduleId,
        creator_id: user.id,
        title: title || "New Lesson",
        description: description ?? null,
        file_url: file_url ?? null,
        duration_minutes: duration_minutes ?? null,
        sort_order: nextSort,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Lessons create error:", err);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
