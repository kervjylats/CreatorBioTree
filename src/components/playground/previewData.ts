/**
 * previewData.ts — builds a FanShellData from the Playground DRAFT so the phone
 * preview renders the fan components against un-deployed theme edits
 * (playground.md Part 1: the page IS the editor). resolveBranding runs client-side
 * here — it is a pure function over the creator row.
 */
"use client";

import { resolveBranding, socialLinksToArtistLinks, type CreatorBranding } from "@/lib/branding";
import type { ContentItem, Creator } from "@/types";
import type { FanIdentity, FanShellData } from "@/components/fan-pwa/fanData";
import type { PlaygroundDraft } from "@/hooks/usePlaygroundForm";

/** Patch a creator row with draft values → branding resolves over the draft.
 * Identity (display_name/avatar_url) is NOT draftable — it comes from base
 * (Settings → Profile owns it; settings.md Part 13). */
export function draftToCreator(draft: PlaygroundDraft, base: Creator): Creator {
  return {
    ...base,
    display_name: base.display_name ?? base.username,
    bio: draft.bio,
    banner_url: draft.banner_url,
    connect_empty_text: draft.connect_empty_text,
    social_links: draft.social_links,
    custom_theme: draft.custom_theme,
  };
}

export function draftToBranding(draft: PlaygroundDraft, base: Creator): CreatorBranding {
  return resolveBranding(draftToCreator(draft, base));
}

/** Preview FanShellData: no identity (creator previews the visitor view), no purchases. */
export function buildPreviewData(draft: PlaygroundDraft, base: Creator, items: ContentItem[]): FanShellData {
  const branding = draftToBranding(draft, base);
  return {
    branding,
    username: base.username,
    bio: draft.bio,
    items,
    identity: null as FanIdentity | null,
    purchases: [],
    spendByCurrency: {},
    connectEmptyText: draft.connect_empty_text ?? "",
    artistLinks: socialLinksToArtistLinks(draft.social_links),
    community: null,
  };
}