/** Partner page screen at /[username]/partner/[partnerUsername] — fan-auth gate, partner's 3-layer view with branding, featured items, social links, follow button. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveBranding } from "@/lib/branding";
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

  const { data: items } = await supabase
    .from("content_items")
    .select("*")
    .eq("creator_id", partnerCreator.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  const branding = resolveBranding(partnerCreator);

  const socialLinks = partnerCreator.social_links
    ? Object.entries(partnerCreator.social_links).map(([label, url]) => ({
        label,
        url: url as string,
      }))
    : [];

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
