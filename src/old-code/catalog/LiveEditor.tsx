/** TODO: Add purpose docstring. */
"use client";

import { CoverUploader } from "./CoverUploader";

interface LiveEditorProps {
  platform: string | null;
  thumbnailUrl: string | null;
  onChange: (patch: { platform: string | null; thumbnail_url: string | null }) => void;
}

const LIVE_PLATFORMS = [
  "youtube_live",
  "twitch",
  "zoom",
  "google_meet",
  "restream",
  "custom",
];

export function LiveEditor({ platform, thumbnailUrl, onChange }: LiveEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Streaming platform</label>
        <select
          value={platform ?? "youtube_live"}
          onChange={(e) => onChange({ platform: e.target.value, thumbnail_url: thumbnailUrl })}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {LIVE_PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>
      <CoverUploader currentUrl={thumbnailUrl} onUpload={(url) => onChange({ platform, thumbnail_url: url || null })} />
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
        <p className="text-[9px] text-amber-700">
          <strong>Mock mode:</strong> Stream URLs are generated automatically. Real platform integration will be added later.
        </p>
      </div>
    </div>
  );
}
