/**
 * My Peeps umbrella: three count cards for Partners/Fans/Staff
 * (relationships.md Part 1).
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, Briefcase } from "lucide-react";

interface Counts {
  partners: number;
  fans: number;
  staff: number;
}

interface MyPeepsProps {
  onSelectRow?: (row: "partners" | "fans" | "staff") => void;
  activeRow?: "partners" | "fans" | "staff" | null;
}

/** My Peeps umbrella: three count cards for Partners/Fans/Staff (relationships.md Part 1). */
export function MyPeeps({ onSelectRow, activeRow }: MyPeepsProps) {
  const [counts, setCounts] = useState<Counts>({ partners: 0, fans: 0, staff: 0 });

  useEffect(() => {
    fetch("/api/creator/relationships")
      .then((r) => r.json())
      .then((data) => {
        if (data.partners !== undefined) {
          setCounts(data);
        }
      })
      .catch(() => {});
  }, []);

  const rows = [
    { key: "partners" as const, label: "Partners", count: counts.partners, icon: Users },
    { key: "fans" as const, label: "Fans", count: counts.fans, icon: Heart },
    { key: "staff" as const, label: "Staff", count: counts.staff, icon: Briefcase },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">My Peeps</h3>
      {rows.map((row) => (
        <Card
          key={row.key}
          className={`cursor-pointer transition-colors hover:bg-accent/50 ${
            activeRow === row.key ? "border-primary" : ""
          }`}
          onClick={() => onSelectRow?.(row.key)}
        >
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <row.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{row.label}</span>
            </div>
            <span className="text-sm text-muted-foreground">{row.count}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
