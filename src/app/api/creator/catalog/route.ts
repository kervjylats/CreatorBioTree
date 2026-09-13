/** TODO: Add purpose docstring — Route handler. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { TYPE_VALUES } from "@/types/contentTypes";

const createSchema = z.object({
  type: z.enum(TYPE_VALUES),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("creator_id", user.id)
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("Catalog list error:", err);
    return NextResponse.json({ error: "Failed to list catalog" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { type, title, description } = validation.data;

    const { data: countData } = await supabase
      .from("content_items")
      .select("id", { count: "exact" })
      .eq("creator_id", user.id);

    const nextSort = (countData ?? []).length + 1;

    const { data, error } = await supabase
      .from("content_items")
      .insert({
        creator_id: user.id,
        type,
        title,
        description: description ?? null,
        access_type: "free",
        pricing_model: "free",
        is_published: false,
        sort_order: nextSort,
        currency: "usd",
        price: 0,
        metadata: {},
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Catalog create error:", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
