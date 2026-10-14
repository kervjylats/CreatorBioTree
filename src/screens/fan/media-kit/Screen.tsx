/**
 * Media-kit screen — /[username]/media-kit (playground.md Part 2g v1 door,
 * 2026-10-14): public read-only one-pager for sponsors (readers, no accounts).
 * Bio + rate card + custom message + the gated spotlight hero (stranger view —
 * paid media renders cover-only per the 2026-10-01 audit law). No PDF, iframe,
 * or contact form in v1 — sharing = the creator sends this link.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/admin";
import { toHeroMedia } from "@/lib/spotlightHero";
import { BillboardHero } from "@/components/network/BillboardHero";
import { Avatar } from "@/components/shared/Avatar";
import type { ContentItem } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media kit",
};

interface RateCard {
  post?: string;
  story?: string;
  video?: string;
}

export default async function MediaKitScreen({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = createServiceClient();

  const { data: creator } = await supabase
    .from("creators")
    .select(
      "id, username, display_name, avatar_url, tagline, primary_field, bio, rate_card, media_kit_message",
    )
    .eq("username", username)
    .maybeSingle();

  if (!creator || !creator.username) notFound();
  const c = creator as {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tagline: string | null;
    primary_field: string | null;
    bio: string | null;
    rate_card: RateCard | null;
    media_kit_message: string | null;
  };

  // Stranger view: identity null, no purchases — paid heroes shape cover-only.
  const { data: featured } = await supabase
    .from("content_items")
    .select("*")
    .eq("creator_id", c.id)
    .eq("is_featured", true)
    .eq("is_published", true)
    .limit(1)
    .maybeSingle();
  const hero = featured ? toHeroMedia(featured as ContentItem, null, new Set<string>()) : null;

  const name = c.display_name || c.username;
  const rates = [
    { label: "Post", value: c.rate_card?.post?.trim() },
    { label: "Story", value: c.rate_card?.story?.trim() },
    { label: "Video", value: c.rate_card?.video?.trim() },
  ].filter((r) => r.value);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="flex items-center gap-3">
        <Avatar src={c.avatar_url} name={name} size="h-14 w-14" textClass="text-base" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground">{name}</h1>
          <p className="text-sm text-muted-foreground">@{c.username} · Media kit</p>
        </div>
      </div>

      <div className="mt-4">
        <BillboardHero
          media={hero}
          eyebrow={c.primary_field || undefined}
          headline={c.tagline || undefined}
        />
      </div>

      {c.bio && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">About</h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{c.bio}</p>
        </section>
      )}

      {rates.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rate card</h2>
          <dl className="mt-2 divide-y divide-border rounded-xl border border-border">
            {rates.map((r) => (
              <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-sm text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-bold text-foreground">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {c.media_kit_message && (
        <p className="mt-6 text-sm italic text-muted-foreground">“{c.media_kit_message}”</p>
      )}

      <Link
        href={`/${c.username}`}
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Visit {name}’s page →
      </Link>
    </main>
  );
}
