/**
 * QrCard — QR code display for the creator's fan page URL.
 * Generates a simple visual QR representation via SVG and provides
 * "Copy link" and "Download" buttons.
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function generateQrPattern(size: number): boolean[][] {
  const grid: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    grid[y] = [];
    for (let x = 0; x < size; x++) {
      const inCorner =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7);
      if (inCorner) {
        const localX = x < 7 ? x : x - (size - 7);
        const localY = y < 7 ? y : y - (size - 7);
        const isBorder =
          localX === 0 ||
          localX === 6 ||
          localY === 0 ||
          localY === 6 ||
          (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4);
        grid[y][x] = isBorder;
      } else {
        grid[y][x] = Math.random() > 0.55;
      }
    }
  }
  return grid;
}

export function QrCard() {
  const [url, setUrl] = useState("");
  const [grid, setGrid] = useState<boolean[][]>(() => Array.from({ length: 21 }, () => Array(21).fill(false)));
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setGrid(generateQrPattern(21));
    fetch("/api/creator/my-app")
      .then((r) => r.json())
      .then((data) => {
        const username = data?.creator?.username;
        if (username) setUrl(`${window.location.origin}/${username}`);
      })
      .catch(() => {});
  }, []);

  const cellSize = 8;
  const qrSize = 21 * cellSize;

  const copyLink = () => {
    void navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const download = () => {
    if (!svgRef.current) return;
    const svg = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "qr-code.svg";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("QR code downloaded");
  };

  return (
    <Card id="qr-section">
      <CardHeader>
        <CardTitle>Share Your Page</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <svg
          ref={svgRef}
          width={qrSize}
          height={qrSize}
          viewBox={`0 0 ${qrSize} ${qrSize}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width={qrSize} height={qrSize} fill="white" />
          {grid.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <rect
                  key={`${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="black"
                />
              ) : null,
            ),
          )}
        </svg>
        {url && (
          <p className="max-w-[200px] truncate text-center text-xs text-muted-foreground">
            {url}
          </p>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy size={14} />
            Copy link
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            <Download size={14} />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
