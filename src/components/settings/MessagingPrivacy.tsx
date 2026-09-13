/**
 * MessagingPrivacy — "Allow messages from anyone" toggle.
 * Fetches from GET /api/chat/preferences, saves via PATCH /api/chat/preferences.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MessagingPrivacy() {
  const [allowAny, setAllowAny] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/chat/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.allow_messages_from_anyone === "boolean") {
          setAllowAny(data.allow_messages_from_anyone);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (checked: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/chat/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow_messages_from_anyone: checked }),
      });
      if (!res.ok) {
        toast.error("Failed to update preference");
        return;
      }
      setAllowAny(checked);
      toast.success("Preference saved");
    } catch {
      toast.error("Failed to update preference");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messaging &amp; Privacy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Allow messages from anyone
              </p>
              <p className="text-xs text-muted-foreground">
                When off, strangers&apos; first messages land in your Requests
                folder
              </p>
            </div>
          </div>
          <Switch
            checked={allowAny}
            onChange={(checked) => void handleToggle(checked)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
}
