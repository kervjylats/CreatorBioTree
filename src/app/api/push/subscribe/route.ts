/** TODO: Add purpose docstring — Route handler. */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimiter } from "@/lib/rate-limiter";
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
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await rateLimiter.check(`push-subscribe:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const { subscription, fan_id, creator_id } = await request.json();

    if (!subscription || !creator_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // If fan_id is provided, verify it belongs to this creator
    if (fan_id) {
      const { data: fan } = await supabase
        .from("fan_accounts")
        .select("id")
        .eq("id", fan_id)
        .eq("creator_id", creator_id)
        .maybeSingle();

      if (!fan) {
        return NextResponse.json({ error: "Invalid fan for this creator" }, { status: 403 });
      }
    }

    // Save subscription
    if (fan_id) {
      await supabase.from("push_subscriptions").upsert(
        { fan_id, creator_id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth_key: subscription.keys.auth },
        { onConflict: "fan_id,creator_id" }
      );
    } else {
      await supabase.from("push_subscriptions").upsert(
        { fan_id: null, creator_id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth_key: subscription.keys.auth },
        { onConflict: "endpoint" }
      );
    }

    // Welcome push
    const { data: creator } = await supabase.from("creators").select("display_name, username").eq("id", creator_id).single();
    const creatorName = creator?.display_name || creator?.username || "Creator";

    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
          JSON.stringify({ title: "App Installed!", body: `You are now subscribed to ${creatorName}`, url: `/${creator?.username ?? ""}` })
        );
      } catch (pushErr) {
        console.error("[subscribe] Welcome push failed:", pushErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}