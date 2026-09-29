/**
 * POST /api/messages/upload — message attachment upload (messaging.md Part 4
 * files): accepts a data URL + filename, stores it in the message-attachments
 * bucket (mock: public/mock-uploads via the mock storage API; production:
 * Supabase storage) and returns a hosted URL for message_attachments.
 * Works for both creators and fans (either message identity).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMessageIdentity } from "@/lib/messages";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { MAX_MESSAGE_UPLOAD_BYTES } from "@/lib/limits";

const uploadSchema = z.object({
  dataUrl: z.string().regex(/^data:([a-zA-Z0-9/+-]+);base64,/, "Must be a base64 data URL").max(12_000_000),
  name: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const tooMany = await enforceRateLimit(request, "message-upload", 10, 60_000);
    if (tooMany) return tooMany;

    const supabase = await createClient();
    const me = await getMessageIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = uploadSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid file" }, { status: 400 });

    const [header, base64] = validation.data.dataUrl.split(",");
    const mime = /^data:([^;]+)/.exec(header ?? "")?.[1] ?? "application/octet-stream";
    const buffer = Buffer.from(base64 ?? "", "base64");
    if (buffer.byteLength === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });
    if (buffer.byteLength > MAX_MESSAGE_UPLOAD_BYTES) return NextResponse.json({ error: "File is too large (max 8MB)" }, { status: 400 });

    const safeName = validation.data.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `message/${me.key}-${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(path, buffer, { contentType: mime, upsert: true });
    if (uploadError) {
      console.error("[messages/upload]:", uploadError);
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
    }

    const { data } = supabase.storage.from("message-attachments").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, name: validation.data.name, mime, size: buffer.byteLength });
  } catch (err) {
    console.error("[messages/upload] POST:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}