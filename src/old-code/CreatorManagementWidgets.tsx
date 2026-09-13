/** TODO: Add purpose docstring. */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// ─── SharePageButton ────────────────────────────────────────────────────────

interface SharePageButtonProps {
  url: string;
  pageName: string;
}

export function SharePageButton({ url, pageName }: SharePageButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pageName}'s CreatorBioTree`,
          text: `Check out ${pageName}'s page on CreatorBioTree!`,
          url,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      alert("Could not copy link. Please copy it manually.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {shared ? "✓ Copied!" : "📤 Share your page"}
    </Button>
  );
}

// ─── CopyLinkButton removed — use SharePageButton instead (has clipboard fallback) ──

// ─── QRCodeCard ──────────────────────────────────────────────────────────────

interface QRCodeCardProps {
  url: string;
  username: string;
}

export function QRCodeCard({ url, username }: QRCodeCardProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qr-code-${username}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download QR code", err);
      alert("Failed to download QR code. Try right-clicking the image.");
    }
  };

  return (
    <div className="rounded-3xl border border-[#E8E4DB] bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-sm font-semibold text-gray-900">Your QR Code</h2>
        <p className="mt-1 text-xs text-gray-500 mb-6">
          Fans can scan this to open your app instantly.
        </p>

        <div className="relative group">
          <div className="aspect-square w-48 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrUrl} 
              alt="QR Code" 
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col w-full gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} className="w-full">
            Download PNG ↓
          </Button>
          <p className="text-[10px] text-gray-400">
            Link: {url}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── FanExportButton ─────────────────────────────────────────────────────────

export function FanExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/fans/export");
      if (!res.ok) {
        alert("Export failed — please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fans-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E8E4DB] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Fan email list</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Download a detailed report of all fan activity as a CSV file
          </p>
        </div>
        <Button variant="outline" size="default" onClick={handleExport} disabled={loading}>
          {loading ? "Generating…" : "Export Fan Report ↓"}
        </Button>
      </div>
    </div>
  );
}
