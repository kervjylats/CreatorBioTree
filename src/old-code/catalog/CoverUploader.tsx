/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";

interface CoverUploaderProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
}

export function CoverUploader({ currentUrl, onUpload }: CoverUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "image");
    try {
      const res = await fetch("/api/creator/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onUpload(data.url);
    } catch {
      // non-fatal
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Cover image</label>
      <div className="flex items-center gap-3">
        {currentUrl && (
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <label
          className="cursor-pointer px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-[10px] rounded-lg"
        >
          {uploading ? "..." : currentUrl ? "Change" : "Upload"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
        </label>
        {currentUrl && (
          <button
            type="button"
            onClick={() => onUpload("")}
            className="text-[10px] text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
