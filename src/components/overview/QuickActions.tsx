/**
 * QuickActions — single shortcut to the My App editor.
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
        <Link href="/dashboard/my-app">
          <Button variant="outline" className="w-full justify-start">
            <Pencil size={14} />
            Edit My App
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
