/** TODO: Add purpose docstring — Route handler. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

/**
 * POST /api/fan/content/access
 *
 * FIX: Free link-type content (YouTube, Instagram, etc.) was crashing
 * with 500 because the route was trying to generate a signed URL for
 * an external URL (not a storage file). Now it returns the URL directly
 * for link-type or external URL content, and only generates signed URLs
 * for actual storage files (PDFs, audio, video).
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function isStoragePath(url: string): boolean {
  // Storage paths look like: "creators/uuid/type/filename"
  // External URLs start with http(s)://
  return !isExternalUrl(url) && url.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content_item_id } = body;

    if (!content_item_id || typeof content_item_id !== "string") {
      return NextResponse.json({ error: "content_item_id required" }, { status: 400 });
    }

    if (!UUID_REGEX.test(content_item_id)) {
      return NextResponse.json({ error: "Invalid content_item_id" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: item, error: itemError } = await supabase
      .from("content_items")
      .select("id, type, access_type, file_url, is_published, creator_id")
      .eq("id", content_item_id)
      .eq("is_published", true)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const { getFanAccountForCreator } = await import("@/lib/fanSession");
    const fanId = await getFanAccountForCreator(cookieStore, supabase, item.creator_id);

    let hasAccess = false;

    if (item.access_type === "free") {
      hasAccess = true;
    } else if (item.access_type === "locked") {
      if (fanId) {
        const { data: fanAccount } = await supabase
          .from("fan_accounts")
          .select("id")
          .eq("id", fanId)
          .eq("creator_id", item.creator_id)
          .single();
        hasAccess = !!fanAccount;
      }
    } else if (item.access_type === "paid") {
      if (fanId) {
        const { data: purchase } = await supabase
          .from("fan_purchases")
          .select("id")
          .eq("fan_id", fanId)
          .eq("content_item_id", content_item_id)
          .eq("status", "completed")
          .single();
        hasAccess = !!purchase;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ── Return the URL ────────────────────────────────────────
    const fileUrl = item.file_url ?? "";

    // No file attached (e.g. demo content with empty URL)
    if (!fileUrl) {
      return NextResponse.json({
        url: null,
        type: item.type,
        message: "No file attached to this content item",
      });
    }

    // External URL (links, YouTube, etc.) — return directly, no signing needed
    if (isExternalUrl(fileUrl) || item.type === "link") {
      return NextResponse.json({
        url: fileUrl,
        type: item.type,
        expires_in: null, // external URLs don't expire
      });
    }

    // Storage file (PDF, audio, video) — generate a signed URL
    if (isStoragePath(fileUrl)) {
      const { data: signedData, error: signError } = await supabase
        .storage
        .from("content")
        .createSignedUrl(fileUrl, 3600); // 1 hour

      if (signError || !signedData?.signedUrl) {
        console.error("[content/access] Signed URL error:", signError?.message);
        return NextResponse.json(
          { error: "Failed to generate access URL" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: signedData.signedUrl,
        type: item.type,
        expires_in: 3600,
      });
    }

    // Fallback
    return NextResponse.json({ url: fileUrl, type: item.type });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[content/access] Unexpected error:", msg);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}