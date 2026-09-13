/** type: component — Single creator card with avatar, display name, username, featured badge. */
import Link from "next/link";
import Image from "next/image";

interface CreatorResultCardProps {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_featured?: boolean;
}

export function CreatorResultCard({
  id,
  username,
  display_name,
  avatar_url,
  is_featured,
}: CreatorResultCardProps) {
  return (
    <Link
      key={id}
      href={`/${username}`}
      className="group relative flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5"
    >
      {is_featured && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100">
          ✨ Featured
        </div>
      )}
      <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full ring-2 ring-transparent transition-all group-hover:ring-indigo-500/20">
        {avatar_url ? (
          <Image src={avatar_url} alt={display_name ?? username} width={80} height={80} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-indigo-50 text-2xl font-semibold text-indigo-600">
            {(display_name?.[0] ?? username[0] ?? "C").toUpperCase()}
          </div>
        )}
      </div>
      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
        {display_name || username}
      </h3>
      <p className="text-sm text-gray-400 mb-3">@{username}</p>
    </Link>
  );
}
