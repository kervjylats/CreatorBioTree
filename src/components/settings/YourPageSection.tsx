/**
 * YourPageSection — "Your Page" card in Settings: view your fan page link.
 * If the fan app is not installed as a PWA, shows an install prompt too.
 * Install is account-free (fan-shell.md Part 3).
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function YourPageSection() {
  const [username, setUsername] = useState<string | null>(null);
  const { installState, triggerInstall } = usePWAInstall();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creator/my-app")
      .then((r) => r.json())
      .then((data) => {
        const u = data?.creator?.username;
        if (u) setUsername(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!username) return null;

  const pageUrl = `/${username}`;
  const showInstall = installState !== "installed" && installState !== "unsupported";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ExternalLink size={16} />
          View my page
        </a>
        {showInstall && (
          <Button variant="outline" size="sm" onClick={() => void triggerInstall()}>
            <Download className="mr-1.5 h-4 w-4" />
            Install my fan app
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
