/**
 * NotificationsSection — push notification preferences (settings.md Part 4).
 * HONEST DISABLED STATE (2026-10-01 audit): the toggle used to flip local state
 * and toast "Push notifications enabled" without persisting anything or asking
 * the browser for permission, so it reset on every reload and no push could ever
 * arrive. Until POST /api/push/subscribe is wired to a real subscription, the
 * control says so instead of pretending (founder policy: label honestly).
 */
"use client";

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Bell size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Push notifications</p>
              <p className="text-xs text-muted-foreground">
                Send a push to your device when something happens
              </p>
            </div>
          </div>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
