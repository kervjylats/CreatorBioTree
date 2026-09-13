/**
 * FileUploadField — device file upload for catalog items (my-app.md Part 2c).
 * Hidden file input opens the OS/phone picker, posts to the existing
 * POST /api/creator/upload (per-type MIME validation, mock storage →
 * public/mock-uploads/), and shows a preview (thumbnail for image/video,
 * file chip for audio/pdf) with Change/Remove. No URL/paste fallback —
 * external links belong to the link item type.
 */
"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

export type UploadKind = "video" | "image" | "audio" | "pdf";

interface FileUploadFieldProps {
  kind: UploadKind;
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
}

const ACCEPT: Record<UploadKind, string> = {
  video: "video/mp4,video/webm",
  image: "image/jpeg,image/png,image/webp,image/gif,image/heic,image/tiff,image/bmp",
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/x-m4a",
  pdf: "application/pdf",
};

export function FileUploadField({ kind, label, value, onChange }: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileName = value ? decodeURIComponent(value.split("/").pop() ?? "") : null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", kind);
      const res = await fetch("/api/creator/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Upload failed — try again.");
        return;
      }
      const data = await res.json();
      if (data.url) onChange(data.url as string);
    } catch {
      setError("Upload failed — try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      {label && <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</label>}
      <div className={label ? "mt-1.5 flex items-center gap-3" : "flex items-center gap-3"}>
        {uploading ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-input bg-background">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : value ? (
          kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic mock/real storage URLs; next/image would need remotePatterns
            <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          ) : kind === "video" ? (
            <video src={value} muted className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex max-w-[180px] items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground">
              <FileText size={13} className="shrink-0 text-muted-foreground" />
              <span className="truncate">{fileName ?? "File"}</span>
            </span>
          )
        ) : (
          <span className="h-14 w-14 shrink-0 rounded-lg border border-dashed border-input bg-background" />
        )}

        <label
          className="cursor-pointer rounded-full border border-input px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground disabled:opacity-50"
          style={uploading ? { pointerEvents: "none", opacity: 0.5 } : undefined}
        >
          {uploading ? "Uploading…" : value ? "Change" : "Upload"}
          <input type="file" accept={ACCEPT[kind]} onChange={handleFile} className="hidden" />
        </label>

        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}