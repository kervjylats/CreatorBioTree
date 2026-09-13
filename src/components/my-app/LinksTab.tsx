/**
 * LinksTab — merged editor for Links + Integrations + Email.
 * Replaces the old separate Artist Links, Integrations, and Email tabs.
 * "Links" section has live content (manual URLs + platform connect);
 * the other two are collapsible placeholder sections.
 */
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MyAppDraft } from "@/hooks/useMyAppForm";
import { LinksEditor } from "./LinksEditor";

interface LinksTabProps {
  draft: MyAppDraft;
  patch: (partial: Partial<MyAppDraft>) => void;
}

function Section({ title, badge, defaultOpen = false, children }: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-input">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-semibold text-muted-foreground">
              {badge}
            </span>
          )}
          {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </span>
      </button>
      {open && <div className="border-t border-input px-3 py-3">{children}</div>}
    </div>
  );
}

export function LinksTab({ draft, patch }: LinksTabProps) {
  return (
    <div className="space-y-3">
      <Section title="Links" defaultOpen>
        <LinksEditor draft={draft} patch={patch} />
      </Section>

      <Section title="Integrations" badge="coming soon">
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-input p-4 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Auto-DM</p>
            <p className="mt-1">Automatically send Instagram DMs when fans purchase, tip, or follow.</p>
          </div>
          <div className="rounded-xl border border-dashed border-input p-4 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Commerce platforms</p>
            <p className="mt-1">Connect Shopify, Gumroad, or Etsy to auto-import products into your catalog.</p>
          </div>
        </div>
      </Section>

      <Section title="Email" badge="coming soon">
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-input p-4 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Campaigns</p>
            <p className="mt-1">Send email campaigns to your subscribers with a drag-and-drop editor.</p>
          </div>
          <div className="rounded-xl border border-dashed border-input p-4 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Subscribers</p>
            <p className="mt-1">View your subscriber list, growth chart, and export to CSV.</p>
          </div>
          <div className="rounded-xl border border-dashed border-input p-4 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Welcome sequence</p>
            <p className="mt-1">Auto-send 3 emails when a fan subscribes (welcome, what you get, top content).</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
