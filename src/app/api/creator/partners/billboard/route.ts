/** GET: Retrieve billboard + media-kit settings (tagline, tags, collab_style, bio, rate_card, media_kit_message, identity) for the authenticated creator. PUT: Update those settings. */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";
import { BILLBOARD_LIMITS } from "@/lib/limits";

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: me } = await supabase
      .from("creators")
      .select("display_name, username, avatar_url, tagline, tags, collab_style, show_in_search, open_to_collab, bio, rate_card, media_kit_message")
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
      show_in_search: me.show_in_search ?? true,
      open_to_collab: me.open_to_collab ?? true,
      bio: me.bio ?? "",
      rate_card: me.rate_card ?? { post: "", story: "", video: "" },
      media_kit_message: me.media_kit_message ?? "",
    });
  } catch (e) {
    console.error("[partners/billboard] GET:", e);
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();
    const body = await req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.tagline === "string") {
      updates.tagline = body.tagline.slice(0, BILLBOARD_LIMITS.tagline) || null;
    }
    if (Array.isArray(body.tags)) {
      updates.tags = body.tags.filter((t: unknown) => typeof t === "string").slice(0, BILLBOARD_LIMITS.tags);
    }
    if (typeof body.collab_style === "string") {
      updates.collab_style = body.collab_style || null;
    }
    if (typeof body.show_in_search === "boolean") {
      updates.show_in_search = body.show_in_search;
    }
    if (typeof body.open_to_collab === "boolean") {
      updates.open_to_collab = body.open_to_collab;
    }
    if (typeof body.bio === "string") {
      updates.bio = body.bio.slice(0, BILLBOARD_LIMITS.bio);
    }
    if (typeof body.media_kit_message === "string") {
      updates.media_kit_message = body.media_kit_message.slice(0, BILLBOARD_LIMITS.mediaKit);
    }
    if (body.rate_card && typeof body.rate_card === "object") {
      const rc = body.rate_card as Record<string, unknown>;
      updates.rate_card = {
        post: typeof rc.post === "string" ? rc.post : "",
        story: typeof rc.story === "string" ? rc.story : "",
        video: typeof rc.video === "string" ? rc.video : "",
      };
    }

    const { data: updated } = await supabase
      .from("creators")
      .update(updates)
      .eq("id", user.id)
      .select("tagline, tags, collab_style, show_in_search, open_to_collab, bio, rate_card, media_kit_message")
      .single();

    return NextResponse.json({
      tagline: updated?.tagline ?? "",
      tags: updated?.tags ?? [],
      collab_style: updated?.collab_style ?? "",
      show_in_search: updated?.show_in_search ?? true,
      open_to_collab: updated?.open_to_collab ?? true,
      bio: updated?.bio ?? "",
      rate_card: updated?.rate_card ?? { post: "", story: "", video: "" },
      media_kit_message: updated?.media_kit_message ?? "",
    });
  } catch (e) {
    console.error("[partners/billboard] PUT:", e);
    return handleAuthError(e) ?? NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
