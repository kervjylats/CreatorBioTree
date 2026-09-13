import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * /[username]/app → redirects to /[username]
 *
 * The old gated fan app route. Now that /[username] serves the FanAppShell
 * directly (no sign-up wall), this route simply redirects.
 */

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function FanAppRedirect({ params }: Props) {
  const { username } = await params;

  // Verify the creator exists
  const supabase = createServiceClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (!creator) notFound();

  redirect(`/${username}`);
}