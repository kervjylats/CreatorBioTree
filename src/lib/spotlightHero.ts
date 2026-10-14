/**
 * spotlightHero.ts — one spotlight, two audiences (network.md §2, 2026-10-14).
 * The billboard hero IS the creator's featured catalog item (the same row the
 * guest page + Home tab spotlight renders): collab discovery reuses what fans
 * see, zero billboard-specific work. `toHeroMedia` applies the 2026-10-01
 * audit law — a gated item's `file_url` never leaves the server (cover only
 * for strangers); the client picks video-loop / poster / cover from the shape.
 */
import type { ContentItem } from "@/types";
import { computeItemGate, type FanIdentity } from "@/components/fan-pwa/fanData";

export interface HeroMedia {
  id: string;
  type: string;
  title: string;
  /** Full media — null when gated (cover-only) or absent. */
  file_url: string | null;
  /** Poster/cover frame — thumbnail, else cover image, else null. */
  cover_url: string | null;
}

/** Shape a featured item for hero display, or null when nothing showable
 *  (no file AND no cover — the honest blank). `identity`/`purchasedItemIds`
 *  mirror fanShellData: strangers get covers on gated items, never file URLs. */
export function toHeroMedia(
  item: ContentItem,
  identity: FanIdentity | null,
  purchasedItemIds: Set<string>,
): HeroMedia | null {
  const gate = computeItemGate(item, identity, purchasedItemIds);
  const open = gate.state === "free" || gate.state === "purchased";
  const file_url = open ? item.file_url : null;
  const cover_url = item.thumbnail_url ?? item.cover_image_url ?? null;
  if (!file_url && !cover_url) return null;
  return { id: item.id, type: item.type, title: item.title, file_url, cover_url };
}
