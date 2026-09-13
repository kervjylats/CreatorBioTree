/** Partner content page — placeholder. Shows partner branding with a "coming soon" message. Requires fan authentication. */
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveBranding } from "@/lib/branding";
import type { Creator } from "@/types";
import { getFanAccountForCreator } from "@/lib/fanSession";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string; partnerUsername: string }>;
}

export default async function PartnerContentPage({ params }: Props) {
  const { username, partnerUsername } = await params;
  const supabase = createServiceClient();
  const cookieStore = await cookies();

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (!creator) notFound();

  const fanId = await getFanAccountForCreator(cookieStore, supabase, creator.id);

  if (!fanId) {
    redirect(`/${username}`);
  }

  const { data: partnerCreator } = await supabase
    .from("creators")
    .select("*")
    .eq("username", partnerUsername.toLowerCase())
    .single();

  if (!partnerCreator) notFound();

  const partnerBranding = resolveBranding(partnerCreator as Creator);
  const primaryBranding = resolveBranding(creator as Creator);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: partnerBranding.backgroundColor,
        color: partnerBranding.textColor,
        fontFamily: partnerBranding.fontFamily,
      }}
    >
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <a
          href={`/${username}`}
          className="inline-flex items-center gap-2 text-sm mb-4 transition hover:opacity-70"
          style={{ color: primaryBranding.accentColor }}
        >
          ← Back to @{username}
        </a>

        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <h1 className="text-xl font-bold" style={{ color: partnerBranding.textColor }}>
            {partnerBranding.displayName}
          </h1>
          <p className="text-sm text-center" style={{ color: partnerBranding.textColor + "80" }}>
            Partner content coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
