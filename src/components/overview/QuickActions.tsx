/**
 * QuickActions — single shortcut to the Playground editor.
 */
"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard/playground">
          <Button variant="outline" className="w-full justify-start">
            <Pencil size={14} />
            Edit Playground
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
