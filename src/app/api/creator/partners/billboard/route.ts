/** GET: Retrieve billboard settings + identity (tagline, tags, collab_style, display_name, username, avatar_url) for the authenticated creator. PUT: Update billboard settings. */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: me } = await supabase
      .from("creators")
      .select("display_name, username, avatar_url, tagline, tags, collab_style, is_discoverable")
      .eq("id", user.id)
      .maybeSingle();
    if (!me) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({
      display_name: me.display_name ?? "",
      username: me.username ?? "",
      avatar_url: me.avatar_url ?? null,
      tagline: me.tagline ?? "",
      tags: me.tags ?? [],
      collab_style: me.collab_style ?? "",
      is_discoverable: me.is_discoverable,
    });
  } catch (e) {
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();
    const body = await req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.tagline === "string") {
      updates.tagline = body.tagline.slice(0, 60) || null;
    }
    if (Array.isArray(body.tags)) {
      updates.tags = body.tags.filter((t: unknown) => typeof t === "string").slice(0, 3);
    }
    if (typeof body.collab_style === "string") {
      updates.collab_style = body.collab_style || null;
    }
    if (typeof body.is_discoverable === "boolean") {
      updates.is_discoverable = body.is_discoverable;
    }

    const { data: updated } = await supabase
      .from("creators")
      .update(updates)
      .eq("id", user.id)
      .select("tagline, tags, collab_style, is_discoverable")
      .single();

    return NextResponse.json({
      tagline: updated?.tagline ?? "",
      tags: updated?.tags ?? [],
      collab_style: updated?.collab_style ?? "",
      is_discoverable: updated?.is_discoverable,
    });
  } catch (e) {
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
