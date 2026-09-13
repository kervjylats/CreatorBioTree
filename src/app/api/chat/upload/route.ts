/**
 * POST /api/chat/upload — message attachment upload (messaging.md Part 4
 * files): accepts a data URL + filename, stores it in the chat-attachments
 * bucket (mock: public/mock-uploads via the mock storage API; production:
 * Supabase storage) and returns a hosted URL for message_attachments.
 * Works for both creators and fans (either chat identity).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getChatIdentity } from "@/lib/chat";
import { rateLimiter } from "@/lib/rate-limiter";

const uploadSchema = z.object({
  dataUrl: z.string().regex(/^data:([a-zA-Z0-9/+-]+);base64,/, "Must be a base64 data URL").max(12_000_000),
  name: z.string().min(1).max(255),
});

const MAX_BYTES = 8_000_000;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!(await rateLimiter.check(`chat-upload:${ip}`, 10, 60_000))) {
      return NextResponse.json({ error: "Too many uploads — try again in a minute" }, { status: 429 });
    }

    const supabase = await createClient();
    const me = await getChatIdentity(supabase);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = uploadSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid file" }, { status: 400 });

    const [header, base64] = validation.data.dataUrl.split(",");
    const mime = /^data:([^;]+)/.exec(header ?? "")?.[1] ?? "application/octet-stream";
    const buffer = Buffer.from(base64 ?? "", "base64");
    if (buffer.byteLength === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });
    if (buffer.byteLength > MAX_BYTES) return NextResponse.json({ error: "File is too large (max 8MB)" }, { status: 400 });

    const safeName = validation.data.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `chat/${me.key}-${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(path, buffer, { contentType: mime, upsert: true });
    if (uploadError) {
      console.error("[chat/upload]:", uploadError);
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
    }

    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, name: validation.data.name, mime, size: buffer.byteLength });
  } catch (err) {
    console.error("[chat/upload] POST:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}