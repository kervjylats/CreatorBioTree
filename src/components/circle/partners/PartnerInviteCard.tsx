"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Shareable partner invite card showing invite link URL, copy button, and expiration info (partnership.md Part 1). */
export function PartnerInviteCard() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/creator/partners/invite")
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setInviteUrl(data.url);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Loading invite link...
        </CardContent>
      </Card>
    );
  }

  if (!inviteUrl) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Couldn&apos;t generate invite link.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invite a Partner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Share this link to invite a collaborator. They&apos;ll sign up and automatically become your partner.
        </p>
        <div className="flex gap-2">
          <Input readOnly value={inviteUrl} className="font-mono text-xs" />
          <Button size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Link expires in 7 days. One use per link.
        </p>
      </CardContent>
    </Card>
  );
}
