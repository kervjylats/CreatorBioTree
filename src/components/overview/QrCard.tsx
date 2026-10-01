/**
 * QrCard — share the creator's fan page URL (Overview): show the link, copy it.
 */
"use client";

// The card used to draw a "QR code" from `Math.random() > 0.55` and offer a
// Download button that saved that noise as `qr-code.svg` while toasting "QR code
// downloaded" — a file that scans to nothing (2026-10-01 audit, founder policy:
// never fake a success). The fake grid and the download are gone; the card now
// does what it can actually do: show the page link and copy it.
//
// To bring a real QR back: add a real encoder (e.g. the `qrcode` package) and
// render its matrix here — the URL below is already the exact value to encode.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/fetchJson";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export function QrCard() {
  const [url, setUrl] = useState("");
  const { copy } = useCopyToClipboard();

  useEffect(() => {
    fetchJson<{ creator?: { username?: string } }>("/api/creator/my-app")
      .then((data) => {
        const username = data?.creator?.username;
        if (username) setUrl(`${window.location.origin}/${username}`);
      })
      .catch(() => { toast.error("Failed to load page link"); });
  }, []);

  const copyLink = () => {
    if (!url) return;
    void copy(url).then((ok) => {
      if (ok) toast.success("Link copied");
    });
  };

  return (
    <Card id="qr-section">
      <CardHeader>
        <CardTitle>Share Your Page</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="flex w-full max-w-[220px] items-center gap-2 rounded-xl border border-border px-3 py-2">
          <Link2 size={14} className="shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {url || "Loading your link…"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={copyLink} disabled={!url}>
          <Copy size={14} />
          Copy link
        </Button>
        <p className="text-xs text-muted-foreground">
          A scannable QR code isn&apos;t available yet — the link above is the real one.
        </p>
      </CardContent>
    </Card>
  );
}
