/** GET: Retrieve billboard + media-kit settings (tagline, tags, collab_style, bio, rate_card, media_kit_message, identity) for the authenticated creator. PUT: Update those settings. */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";
import { BILLBOARD_LIMITS, PRIMARY_FIELD_BUCKETS } from "@/lib/limits";

type BillSupabase = Awaited<ReturnType<typeof requireAuth>>["supabase"];

/** Own published featured item shaped for the preview hero — no gate (owner). */
async function ownFeaturedItem(supabase: BillSupabase, userId: string) {
  const { data } = await supabase
    .from("content_items")
    .select("id, type, title, file_url, thumbnail_url, cover_image_url")
    .eq("creator_id", userId)
    .eq("is_featured", true)
    .eq("is_published", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const file_url = (data as { file_url?: string | null }).file_url ?? null;
  const cover_url =
    (data as { thumbnail_url?: string | null }).thumbnail_url ??
    (data as { cover_image_url?: string | null }).cover_image_url ??
    null;
  if (!file_url && !cover_url) return null;
  return {
    id: data.id as string,
    type: (data as { type?: string }).type ?? "",
    title: (data as { title?: string }).title ?? "",
    file_url,
    cover_url,
  };
}

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: me } = await supabase
      .from("creators")
      .select("display_name, username, avatar_url, is_featured, tagline, tags, collab_style, primary_field, open_to_collab, bio, rate_card, media_kit_message")
      .eq("id", user.id)
      .maybeSingle();
    if (!me) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({
      display_name: me.display_name ?? "",
      username: me.username ?? "",
      avatar_url: me.avatar_url ?? null,
      is_featured: me.is_featured ?? false,
      tagline: me.tagline ?? "",
      tags: me.tags ?? [],
      collab_style: me.collab_style ?? "",
      primary_field: (me as { primary_field?: string | null }).primary_field ?? "",
      open_to_collab: me.open_to_collab ?? true,
      bio: me.bio ?? "",
      rate_card: me.rate_card ?? { post: "", story: "", video: "" },
      media_kit_message: me.media_kit_message ?? "",
      // Own spotlight hero (network.md §2): ungated — it's your row. The
      // preview mirrors Modal A; featuring happens in the catalog editor.
      featured_item: await ownFeaturedItem(supabase, user.id),
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
      // Normalized at save (network.md §2, 2026-10-13): lowercase + trim so
      // `Music` and `music` are the same tag; empties dropped.
      updates.tags = body.tags
        .filter((t: unknown) => typeof t === "string")
        .map((t: string) => t.trim().toLowerCase())
        .filter((t: string) => t.length > 0)
        .slice(0, BILLBOARD_LIMITS.tags);
    }
    // Primary field (network.md §1b): a locked bucket, or "" to clear.
    // Anything else is ignored — the client only sends buckets.
    if (typeof body.primary_field === "string") {
      updates.primary_field = (PRIMARY_FIELD_BUCKETS as readonly string[]).includes(body.primary_field)
        ? body.primary_field
        : null;
    }
    if (typeof body.collab_style === "string") {
      updates.collab_style = body.collab_style || null;
    }
    // show_in_search is intentionally NOT accepted (switch removed 2026-10-09 —
    // the column is parked; only open_to_collab round-trips now).
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
      .select("tagline, tags, collab_style, primary_field, open_to_collab, bio, rate_card, media_kit_message")
      .single();

    return NextResponse.json({
      tagline: updated?.tagline ?? "",
      tags: updated?.tags ?? [],
      collab_style: updated?.collab_style ?? "",
      primary_field: (updated as { primary_field?: string | null } | null)?.primary_field ?? "",
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
