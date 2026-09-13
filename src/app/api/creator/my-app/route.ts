/**
 * GET/PUT /api/creator/my-app — the My App editor's read + deploy endpoint
 * (my-app.md Part 2/4b). GET returns the creator row (theme + identity +
 * social links) and the catalog; PUT persists a deploy: display_name, bio,
 * avatar_url, banner_url, custom_theme, connect_empty_text, social_links. Both are
 * auth-guarded — the write mirrors profileUpdateService's ALLOWED_FIELDS.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

const deploySchema = z.object({
  display_name: z.string().min(1).max(80).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatar_url: z.string().max(500).nullable().optional(),
  banner_url: z.string().max(500).nullable().optional(),
  custom_theme: z.record(z.unknown()).nullable().optional(),
  connect_empty_text: z.string().max(200).nullable().optional(),
  social_links: z.record(z.string()).nullable().optional(),
});

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: creator } = await supabase
      .from("creators")
      .select("id, username, display_name, bio, avatar_url, banner_url, theme_id, custom_theme, connect_empty_text, social_links")
      .eq("id", user.id)
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });

    const { data: items } = await supabase
      .from("content_items")
      .select("*")
      .eq("creator_id", user.id)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ creator, items: items ?? [] });
  } catch (err) {
    const handled = handleAuthError(err);
    if (handled) return handled;
    console.error("[creator/my-app] GET:", err);
    return NextResponse.json({ error: "Failed to load My App" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();

    const body = await request.json();
    const validation = deploySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("creators")
      .update(validation.data)
      .eq("id", user.id);

    if (updateError) {
      console.error("[creator/my-app] PUT:", updateError);
      return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const handled = handleAuthError(err);
    if (handled) return handled;
    console.error("[creator/my-app] PUT:", err);
    return NextResponse.json({ error: "Failed to deploy" }, { status: 500 });
  }
}