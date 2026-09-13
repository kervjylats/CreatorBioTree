/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  file_url: z.string().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  sort_order: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("course_lessons")
      .update(validation.data)
      .eq("id", lessonId)
      .eq("creator_id", user.id);

    if (updateError) return NextResponse.json({ error: updateError.message || "Update failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lesson update error:", err);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error: deleteError } = await supabase
      .from("course_lessons")
      .delete()
      .eq("id", lessonId)
      .eq("creator_id", user.id);

    if (deleteError) return NextResponse.json({ error: deleteError.message || "Delete failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lesson delete error:", err);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
