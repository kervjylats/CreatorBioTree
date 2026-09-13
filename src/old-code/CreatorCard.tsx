/** TODO: Add purpose docstring. */
"use client";

export interface CreatorCardData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

interface CreatorCardProps {
  creator: CreatorCardData;
  onClick: () => void;
  actionLabel: string;
}

export function CreatorCard({ creator, onClick, actionLabel }: CreatorCardProps) {
  return (
    <button onClick={onClick}
      className="flex flex-col gap-3 rounded-3xl border border-[#E8E4DB] bg-white p-5 shadow-sm text-left hover:border-[#5A6A4A]/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {creator.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.avatar_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {creator.display_name || creator.username}
          </p>
          <p className="text-xs text-gray-400">@{creator.username}</p>
        </div>
      </div>
      {creator.bio && (
        <p className="text-xs text-gray-500 line-clamp-2">{creator.bio}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">{actionLabel}</p>
    </button>
  );
}
