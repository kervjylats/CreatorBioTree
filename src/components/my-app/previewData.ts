/**
 * previewData.ts — builds a FanShellData from the My App DRAFT so the phone
 * preview renders the fan components against un-deployed theme edits
 * (my-app.md Part 1: the page IS the editor). resolveBranding runs client-side
 * here — it is a pure function over the creator row.
 */
"use client";

import { resolveBranding, type CreatorBranding } from "@/lib/branding";
import type { ContentItem, Creator } from "@/types";
import type { FanIdentity, FanShellData } from "@/components/fan-pwa/fanData";
import type { MyAppDraft } from "@/hooks/useMyAppForm";

/** Patch a creator row with draft values → branding resolves over the draft. */
export function draftToCreator(draft: MyAppDraft, base: Creator): Creator {
  return {
    ...base,
    display_name: draft.display_name ?? base.username,
    bio: draft.bio,
    avatar_url: draft.avatar_url,
    banner_url: draft.banner_url,
    connect_empty_text: draft.connect_empty_text,
    social_links: draft.social_links,
    custom_theme: draft.custom_theme,
  };
}

export function draftToBranding(draft: MyAppDraft, base: Creator): CreatorBranding {
  return resolveBranding(draftToCreator(draft, base));
}

/** Preview FanShellData: no identity (creator previews the visitor view), no purchases. */
export function buildPreviewData(draft: MyAppDraft, base: Creator, items: ContentItem[]): FanShellData {
  const branding = draftToBranding(draft, base);
  return {
    branding,
    username: base.username,
    bio: draft.bio,
    items,
    identity: null as FanIdentity | null,
    purchases: [],
    connectEmptyText: draft.connect_empty_text ?? "",
    artistLinks: Object.entries(draft.social_links ?? {})
      .filter(([, url]) => Boolean(url))
      .map(([label, url]) => ({ label, url })),
    community: null,
  };
}