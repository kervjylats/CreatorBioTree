/** Fan page root — old URL; the Guest surface now lives at /[username]/guest. Keeps old links working. */
import { redirect } from "next/navigation";

export default async function FanRootPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/${username}/guest`);
}