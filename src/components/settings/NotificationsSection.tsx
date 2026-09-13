/**
 * NotificationsSection — push notification preferences.
 * Shows a toggle for enabling push notifications. Local state only in mock mode.
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationsSection() {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setSaving(true);
    try {
      setEnabled(checked);
      toast.success(checked ? "Push notifications enabled" : "Push notifications disabled");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Push notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onChange={(checked) => void handleToggle(checked)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
}
