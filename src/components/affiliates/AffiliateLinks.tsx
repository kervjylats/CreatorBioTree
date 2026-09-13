"use client";

/**
 * My affiliate links — lists active links with deal info, referral URL,
 * copy button, and active/inactive toggle (network.md §7). Fetches from
 * GET /api/creator/affiliates/links.
 */
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface AffiliateLink {
  id: string;
  deal_id: string;
  creator_id: string;
  ref_code: string;
  active: boolean;
  click_count: number;
  created_at: string;
  deal: {
    id: string;
    deal_type: string;
    trigger: string;
    rate: number | null;
    scope: string;
  } | null;
}

export function AffiliateLinks() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/affiliates/links");
      if (res.ok) {
        const json = await res.json();
        setLinks(json.links ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function handleCopy(link: AffiliateLink) {
    const url = `${window.location.origin}/ref/${link.ref_code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleToggle(link: AffiliateLink) {
    await fetch(`/api/creator/affiliates/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !link.active }),
    });
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, active: !l.active } : l))
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading links...
        </CardContent>
      </Card>
    );
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No affiliate links yet. Browse deals or create one from a collaboration.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My Links</h2>
      {links.map((link) => (
        <Card key={link.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-mono text-sm">
                /ref/{link.ref_code}
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant={link.active ? "default" : "secondary"}>
                  {link.active ? "Active" : "Inactive"}
                </Badge>
                <Switch
                  checked={link.active}
                  onCheckedChange={() => handleToggle(link)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground space-x-3">
                {link.deal && (
                  <>
                    <span>{link.deal.deal_type}</span>
                    <span>• {link.deal.trigger}</span>
                    <span>• {link.deal.scope}</span>
                  </>
                )}
                <span>• {link.click_count} clicks</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(link)}
              >
                {copiedId === link.id ? "Copied!" : "Copy link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
