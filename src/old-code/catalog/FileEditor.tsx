/** TODO: Add purpose docstring. */
"use client";

import type { FileSubtype } from "@/types";
import { CoverUploader } from "./CoverUploader";

interface FileEditorProps {
  subtype: FileSubtype | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  onChange: (patch: { subtype: FileSubtype | null; file_url: string | null; thumbnail_url: string | null }) => void;
}

const SUBTYPE_OPTIONS: { value: FileSubtype; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Image" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
];

export function FileEditor({ subtype, fileUrl, thumbnailUrl, onChange }: FileEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">File type</label>
        <select
          value={subtype ?? "other"}
          onChange={(e) => onChange({ subtype: e.target.value as FileSubtype, file_url: fileUrl, thumbnail_url: thumbnailUrl })}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {SUBTYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">File URL</label>
        <input
          type="text"
          value={fileUrl ?? ""}
          onChange={(e) => onChange({ subtype, file_url: e.target.value || null, thumbnail_url: thumbnailUrl })}
          placeholder="https://..."
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <CoverUploader currentUrl={thumbnailUrl} onUpload={(url) => onChange({ subtype, file_url: fileUrl, thumbnail_url: url || null })} />
    </div>
  );
}
