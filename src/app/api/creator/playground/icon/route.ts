/**
 * POST /api/creator/playground/icon — persists a generated/uploaded app icon
 * (2026-08-13). Receives a 512px PNG data URL, writes it to storage, and
 * returns a real hosted URL (mock: public/mock-uploads via mock storage;
 * real: Supabase "creator-icons" bucket). Hosted icons are required — Chrome
 * refuses to install PWAs whose manifest icons are data: URLs. Auth-guarded
 * + rate-limited (10/min).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { MAX_APP_ICON_BYTES } from "@/lib/limits";

const iconSchema = z.object({
  dataUrl: z.string().regex(/^data:image\/png;base64,/, "Must be a PNG data URL").max(5_000_000),
});

export async function POST(request: NextRequest) {
  try {
    const tooMany = await enforceRateLimit(request, "playground-icon", 10, 60_000);
    if (tooMany) return tooMany;

    const { user, supabase } = await requireAuth();

    const body = await request.json();
    const validation = iconSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid icon image" }, { status: 400 });
    }

    const base64 = validation.data.dataUrl.split(",")[1] ?? "";
    const buffer = Buffer.from(base64, "base64");
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: "Invalid icon image" }, { status: 400 });
    }
    if (buffer.byteLength > MAX_APP_ICON_BYTES) {
      return NextResponse.json({ error: "Icon image is too large" }, { status: 400 });
    }

    const path = `icons/${user.id}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("creator-icons")
      .upload(path, buffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("[creator/playground/icon] upload:", uploadError);
      return NextResponse.json({ error: "Failed to save icon" }, { status: 500 });
    }

    const { data } = supabase.storage.from("creator-icons").getPublicUrl(path);
    return NextResponse.json({ appIconUrl: data.publicUrl });
  } catch (err) {
    const handled = handleAuthError(err);
    if (handled) return handled;
    console.error("[creator/playground/icon] POST:", err);
    return NextResponse.json({ error: "Failed to save icon" }, { status: 500 });
  }
}
