/** TODO: Add purpose docstring — Route handler. */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveBranding } from "@/lib/branding";
import type { Creator } from "@/types";
import webpush from "web-push";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@CreatorBioTree.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify creator is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body required" }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Resolve branding for the creator's app icon
    const { data: creatorProfile } = await serviceSupabase
      .from("creators")
      .select("id, display_name, avatar_url, custom_theme, theme_id")
      .eq("id", user.id)
      .single();
    const branding = creatorProfile ? resolveBranding(creatorProfile as Creator) : null;

    // Get all push subscriptions for this creator
    const { data: subscriptions } = await serviceSupabase
      .from("push_subscriptions")
      .select("*")
      .eq("creator_id", user.id);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscribers yet" });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url ?? `${process.env.NEXT_PUBLIC_APP_URL}`,
      icon: branding?.appIconUrl,
      tag: `creator-${user.id}`,
    });

    let sent = 0;
    let failed = 0;
    const toDelete: string[] = [];

    // 🔥 Chunk the push requests into batches of 50 to prevent Vercel Serverless timeouts
    const BATCH_SIZE = 50;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth_key },
              },
              payload
            );
            sent++;
          } catch (err: unknown) {
            failed++;
            if (err && typeof err === "object" && "statusCode" in err) {
              const statusCode = (err as { statusCode: number }).statusCode;
              // 410 (Gone) or 404 means the user unsubscribed on their device
              if (statusCode === 410 || statusCode === 404) {
                toDelete.push(sub.id);
              }
            }
          }
        })
      );
    }

    // Clean up dead subscriptions
    if (toDelete.length > 0) {
      await serviceSupabase
        .from("push_subscriptions")
        .delete()
        .in("id", toDelete);
    }

    return NextResponse.json({ sent, failed, total: subscriptions.length });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
