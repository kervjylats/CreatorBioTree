/** TODO: Add purpose docstring — Route handler. */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

// Format conversion map: source mimetype → target mimetype
const CONVERTIBLE_IMAGE_FORMATS: Record<string, string> = {
  "image/heic":       "image/webp",
  "image/heif":       "image/webp",
  "image/tiff":       "image/webp",
  "image/bmp":        "image/png",
};

const ALLOWED_TYPES: Record<string, string[]> = {
  image:  ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/tiff", "image/bmp"],
  audio:  ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/x-m4a"],
  video:  ["video/mp4", "video/webm"],
  pdf:    ["application/pdf"],
  file:   ["application/pdf", "application/zip", "application/x-zip-compressed",
           "text/plain", "application/msword",
           "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  avatar: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/tiff", "image/bmp"],
  banner: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/tiff", "image/bmp"],
  app_icon: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/tiff", "image/bmp"],
};

const UNSUPPORTED_VIDEO_FORMATS = new Set(["video/quicktime", "video/x-msvideo", "video/x-matroska", "video/avi"]);
const UNSUPPORTED_AUDIO_FORMATS = new Set(["audio/ogg", "audio/flac", "audio/x-flac"]);
const UNSUPPORTED_DOC_FORMATS = new Set(["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

const PUBLIC_UPLOAD_TYPES = new Set(["avatar", "banner", "app_icon"]);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const type     = (formData.get("type") as string) ?? "file";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const allowedForType = ALLOWED_TYPES[type] ?? ALLOWED_TYPES.file;
    if (!allowedForType.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed for ${type} uploads` },
        { status: 400 }
      );
    }

    // Reject unsupported formats with a clear message (Phase 2: auto-convert later)
    if (UNSUPPORTED_VIDEO_FORMATS.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported video format. Please upload MP4 or WebM." },
        { status: 400 }
      );
    }
    if (UNSUPPORTED_AUDIO_FORMATS.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported audio format. Please upload MP3 or M4A." },
        { status: 400 }
      );
    }
    if (UNSUPPORTED_DOC_FORMATS.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported document format. Please upload PDF." },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage (mock or real)
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const filePath  = `${user.id}/${type}/${timestamp}-${safeName}`;

    const bucketName = PUBLIC_UPLOAD_TYPES.has(type) ? "avatars" : "content";

    const adminSupabase = createServiceClient();
    const fileBuffer    = await file.arrayBuffer();
    let uploadBuffer    = Buffer.from(fileBuffer);
    let uploadMimeType  = file.type;

    // Auto-convert unsupported image formats to WebP/PNG (free via sharp)
    const targetFormat = CONVERTIBLE_IMAGE_FORMATS[file.type];
    if (targetFormat) {
      try {
        const sharp = (await import("sharp")).default;
        uploadBuffer = await sharp(fileBuffer)
          .toFormat(targetFormat === "image/webp" ? "webp" : "png")
          .toBuffer();
        uploadMimeType = targetFormat;
      } catch (convErr) {
        console.error("[upload] Image conversion failed, using original:", convErr);
        // Continue with original — sharp fails on some malformed files
      }
    }

    const { error: uploadError } = await adminSupabase.storage
      .from(bucketName)
      .upload(filePath, uploadBuffer, {
        contentType:  uploadMimeType,
        cacheControl: "3600",
        upsert:       true,
      });

    if (uploadError) {
      console.error("[upload] Storage error:", uploadError.message);
      return NextResponse.json(
        { error: "Upload failed: " + uploadError.message },
        { status: 500 }
      );
    }

    let fileUrl: string;

    if (PUBLIC_UPLOAD_TYPES.has(type)) {
      const { data: urlData } = adminSupabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    } else {
      const { data: signedData, error: signError } = await adminSupabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signError || !signedData?.signedUrl) {
        return NextResponse.json(
          { error: "Failed to generate file URL" },
          { status: 500 }
        );
      }
      fileUrl = signedData.signedUrl;
    }

    return NextResponse.json({
      url:      fileUrl,
      filename: file.name,
      path:     filePath,
      bucket:   bucketName,
      size:     file.size,
      mimetype: uploadMimeType,
      is_stream: false,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload] Unexpected error:", message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
