/** TODO: Add purpose docstring. */
"use client";

import { CoverUploader } from "./CoverUploader";

interface LinkEditorProps {
  externalUrl: string | null;
  platform: string | null;
  thumbnailUrl: string | null;
  onChange: (patch: { external_url: string | null; platform: string | null; thumbnail_url: string | null }) => void;
}

const PLATFORMS = [
  "website",
  "youtube",
  "vimeo",
  "spotify",
  "apple_podcasts",
  "amazon",
  "etsy",
  "gumroad",
  "shopify",
  "other",
];

export function LinkEditor({ externalUrl, platform, thumbnailUrl, onChange }: LinkEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">URL</label>
        <input
          type="url"
          value={externalUrl ?? ""}
          onChange={(e) => onChange({ external_url: e.target.value || null, platform, thumbnail_url: thumbnailUrl })}
          placeholder="https://..."
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Platform</label>
        <select
          value={platform ?? "website"}
          onChange={(e) => onChange({ external_url: externalUrl, platform: e.target.value, thumbnail_url: thumbnailUrl })}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>
      <CoverUploader currentUrl={thumbnailUrl} onUpload={(url) => onChange({ external_url: externalUrl, platform, thumbnail_url: url || null })} />
    </div>
  );
}
