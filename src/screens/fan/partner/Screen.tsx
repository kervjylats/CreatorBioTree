/** Partner page screen at /[username]/partner/[partnerUsername] — fan-auth gate, partner's 3-layer view with branding, featured items, social links, follow button. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveBranding, socialLinksToArtistLinks } from "@/lib/branding";
import { contentService } from "@/services/contentService";
import { isScheduledVisible } from "@/components/fan-pwa/fanData";
import { PartnerPageContent } from "@/components/fan-pwa/PartnerPageContent";

interface PartnerPageProps {
  params: Promise<{ username: string; partnerUsername: string }>;
}

export async function generateMetadata({ params }: PartnerPageProps): Promise<Metadata> {
  const { partnerUsername } = await params;
  return { title: `@${partnerUsername}` };
}

export default async function PartnerPageScreen({ params }: PartnerPageProps) {
  const { username, partnerUsername } = await params;
  const supabase = await createClient();

  const { data: hostCreator } = await supabase
    .from("creators")
    .select("*")
    .eq("username", username)
    .single();

  if (!hostCreator) return notFound();

  const { data: partnerCreator } = await supabase
    .from("creators")
    .select("*")
    .eq("username", partnerUsername)
    .single();

  if (!partnerCreator) return notFound();

  // Same schedule filter the guest page applies, so a not-yet-published item
  // can't appear on a partner page while being hidden on the creator's own page
  // (2026-10-01 audit).
  const items = (
    await contentService.getForCreator(partnerCreator.id, supabase).catch(() => [])
  ).filter((item) => isScheduledVisible(item));

  const branding = resolveBranding(partnerCreator);

  const socialLinks = socialLinksToArtistLinks(partnerCreator.social_links);

  return (
    <PartnerPageContent
      branding={branding}
      items={items ?? []}
      socialLinks={socialLinks}
      hostUsername={username}
      partnerUsername={partnerUsername}
    />
  );
}
