/**
 * SetupChecklist — onboarding checklist for new creators.
 * Shows completion status for: set up profile, create first item,
 * customize design, share page. Checkmarks based on data from the API.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle, Settings, Palette, Package, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistState {
  hasProfile: boolean;
  hasItems: boolean;
  hasDesign: boolean;
}

export function SetupChecklist() {
  const [state, setState] = useState<ChecklistState>({
    hasProfile: false,
    hasItems: false,
    hasDesign: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creator/my-app")
      .then((r) => r.json())
      .then((data) => {
        const creator = data?.creator;
        const items = data?.items ?? [];
        setState({
          hasProfile: !!creator?.display_name,
          hasItems: items.length > 0,
          hasDesign: !!creator?.custom_theme,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const steps = [
    {
      label: "Set up your profile",
      href: "/dashboard/settings",
      done: state.hasProfile,
      icon: Settings,
    },
    {
      label: "Create your first item",
      href: "/dashboard/my-app?tab=catalog",
      done: state.hasItems,
      icon: Package,
    },
    {
      label: "Customize your design",
      href: "/dashboard/my-app?tab=design",
      done: state.hasDesign,
      icon: Palette,
    },
    {
      label: "Share your page",
      href: "#qr-section",
      done: false,
      icon: Share2,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Setup Checklist ({completedCount}/{steps.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-2">
            {steps.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-accent/30"
              >
                {s.done ? (
                  <CheckCircle size={16} className="shrink-0 text-green-500" />
                ) : (
                  <Circle size={16} className="shrink-0 text-muted-foreground" />
                )}
                <s.icon size={16} className="shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground">{s.label}</span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
