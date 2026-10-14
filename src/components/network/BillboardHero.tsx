/**
 * BillboardHero — the billboard visual (network.md §2 hero, 2026-10-14): the
 * creator's spotlight item as a roadside LED screen. Video loops muted without
 * controls; images poster; covers stand in for gated/paid media. Overlay keeps
 * text in the lower third (eyebrow + headline over a scrim) — the visual
 * shouts. Null media = null render (the honest blank lives in the caller).
 * Shared by Modal A, the Playground preview, and the Connect Lineup.
 */
import type { HeroMedia } from "@/lib/spotlightHero";

interface BillboardHeroProps {
  media: HeroMedia | null;
  /** Category kicker (primary_field) — small caps above the headline. */
  eyebrow?: string;
  /** Headline (tagline) — bold over the scrim. */
  headline?: string;
  /** Taller frame for full-bleed slots (Lineup); default = compact card. */
  large?: boolean;
}

export function BillboardHero({ media, eyebrow, headline, large }: BillboardHeroProps) {
  if (!media) return null;
  const showVideo = media.type === "video" && media.file_url;
  const imgSrc = media.file_url ?? media.cover_url;
  const showOverlay = Boolean(eyebrow || headline);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-muted ${large ? "aspect-[16/10]" : "aspect-video"}`}
    >
      {showVideo ? (
        <>
          <video
            src={media.file_url as string}
            poster={media.cover_url ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            aria-label={media.title}
            className="h-full w-full object-cover motion-reduce:hidden"
          />
          {media.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.cover_url}
              alt={media.title}
              className="hidden h-full w-full object-cover motion-reduce:block"
            />
          )}
        </>
      ) : imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt={media.title} className="h-full w-full object-cover" />
      ) : null}
      {showOverlay && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
          {eyebrow && (
            <p className="text-micro font-bold uppercase tracking-widest text-white/80">{eyebrow}</p>
          )}
          {headline && (
            <p className="mt-0.5 line-clamp-2 text-base font-bold leading-snug text-white">{headline}</p>
          )}
        </div>
      )}
    </div>
  );
}
