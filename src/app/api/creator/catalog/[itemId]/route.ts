/**
 * Catalog item route — GET/PATCH/DELETE one content_items row (my-app.md Part
 * 2c, Stage A 2026-08-13: all 16 types). PATCH accepts the per-type fields
 * (variants, booking_slots, stock, live platform, scheduling, metadata) plus
 * the pricing/access block; ownership is scoped by creator_id.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { TYPE_VALUES, ACCESS_TYPE_VALUES, PRICING_MODEL_VALUES, BILLING_CYCLE_VALUES, FILE_SUBTYPE_VALUES } from "@/types/contentTypes";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  type: z.enum(TYPE_VALUES).optional(),
  subtype: z.enum(FILE_SUBTYPE_VALUES as [string, ...string[]]).nullable().optional(),
  file_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  external_url: z.string().nullable().optional(),
  cover_image_url: z.string().max(2000).nullable().optional(),
  payment_handling: z.enum(["in_app", "external_link"]).nullable().optional(),
  external_payment_url: z.string().max(2000).nullable().optional(),
  scheduled_publish_at: z.string().nullable().optional(),
  scheduled_unpublish_at: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  access_type: z.enum(ACCESS_TYPE_VALUES as [string, ...string[]]).optional(),
  pricing_model: z.enum(PRICING_MODEL_VALUES as [string, ...string[]]).optional(),
  billing_cycle: z.enum(BILLING_CYCLE_VALUES as [string, ...string[]]).nullable().optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  stock_quantity: z.number().int().nullable().optional(),
  is_physical: z.boolean().optional(),
  variants: z
    .array(z.object({ name: z.string().min(1).max(80), options: z.array(z.string().max(80)).max(50) }))
    .nullable()
    .optional(),
  booking_slots: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        start: z.string().min(1).max(10),
        end: z.string().min(1).max(10),
        duration: z.number().int().min(5).max(600),
        max_bookings: z.number().int().min(1).max(1000),
      }),
    )
    .nullable()
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", itemId)
      .eq("creator_id", user.id)
      .single();

    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Catalog get error:", err);
    return NextResponse.json({ error: "Failed to get item" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("content_items")
      .update(validation.data)
      .eq("id", itemId)
      .eq("creator_id", user.id);

    if (updateError) return NextResponse.json({ error: updateError.message || "Update failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Catalog update error:", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error: deleteError } = await supabase
      .from("content_items")
      .delete()
      .eq("id", itemId)
      .eq("creator_id", user.id);

    if (deleteError) return NextResponse.json({ error: deleteError.message || "Delete failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Catalog delete error:", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
