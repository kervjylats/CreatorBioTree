/** PartnerInviteCard — old backup. */
"use client";

import { useState, useEffect } from "react";

export function PartnerInviteCard() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/creator/partners/invite");
        const data = await res.json();
        if (data.invite_code) {
          setInviteCode(data.invite_code);
        }
      } catch (err) {
        console.error("Failed to load invite code", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const inviteUrl = inviteCode 
    ? `${window.location.origin}/onboarding?invite=${inviteCode}`
    : "";

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if ('share' in navigator && inviteUrl) {
      navigator.share({
        title: "Join my CreatorBioTree Collab",
        text: "Hey! I'm using CreatorBioTree to run my creator page. Join my collab network and we'll split commissions:",
        url: inviteUrl,
      }).catch(console.error);
    }
  };

  const whatsappUrl = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hey! I'm using CreatorBioTree to run my creator page. Join my collab network and we'll split commissions: ${inviteUrl}`
      )}`
    : "";

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-gray-50" />;

  return (
    <div className="rounded-3xl border border-[#E8E4DB] bg-[#5A6A4A] p-6 text-white shadow-lg shadow-[#D4CBB6]/20">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Invite a Collab</h2>
          <p className="mt-1 text-sm text-[#F0EDE4] max-w-sm">
            {`Invite another creator to join. When they join, they'll be automatically linked to you for collaborations.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#5A6A4A] transition hover:bg-[#F0EDE4] active:scale-95"
          >
            {copied ? "✓ Copied!" : "Copy link"}
          </button>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-600 active:scale-95"
          >
            WhatsApp
          </a>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#A67C52] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#8e6a46] active:scale-95"
            >
              Share
            </button>
          )}
        </div>
      </div>
      
      {inviteCode && (
        <div className="mt-4 rounded-lg bg-[#47543a]/50 px-3 py-2 text-xs font-mono text-[#D4CBB6] truncate">
          {inviteUrl}
        </div>
      )}
    </div>
  );
}
