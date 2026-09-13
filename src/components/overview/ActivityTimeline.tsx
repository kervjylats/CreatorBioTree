/**
 * ActivityTimeline — recent activity feed for the creator dashboard.
 * Fetches from GET /api/creator/activity. Shows action icon, description,
 * and timestamp. Empty state: "No activity yet".
 */
"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  UserPlus,
  MessageSquare,
  FileText,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Activity {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

const ACTION_ICONS: Record<string, typeof ShoppingCart> = {
  purchase: ShoppingCart,
  follow: UserPlus,
  message: MessageSquare,
  content: FileText,
  default: Settings,
};

export function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creator/activity")
      .then((r) => r.json())
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((a) => {
              const Icon = ACTION_ICONS[a.action] ?? ACTION_ICONS.default;
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{a.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
