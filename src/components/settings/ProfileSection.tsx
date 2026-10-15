/**
 * ProfileSection — Settings' Profile card, now a POINTER STUB (settings.md
 * Part 13, moved 2026-10-15): the display-name + avatar edit home is the 📌
 * "Who I am" note in the Playground (playground.md Part 1e). This card keeps
 * the laws visible (helper line + 7-day rule) and sends the creator to the
 * real door — no fields here anymore. The 7-day cooldown enforcement itself
 * still lives server-side in PUT /api/creator/playground.
 */
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function ProfileSection() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Display name &amp; photo live in the Playground now — the 📌
          &quot;Who I am&quot; note, top-left. Edit there, then Deploy.
        </p>
        <p className="text-micro text-muted-foreground">
          Your name &amp; photo appear on your fan page, Discover, landing and
          messages — changes show everywhere immediately. Each can be changed
          once every 7 days.
        </p>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/playground")}>
          Open Playground <ArrowRight size={14} />
        </Button>
      </CardContent>
    </Card>
  );
}
