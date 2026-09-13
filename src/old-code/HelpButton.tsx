/** TODO: Add purpose docstring. */
"use client";

import { Button } from "@/components/ui/button";

/**
 * WHAT CHANGED:
 *   - The original had "+230 5XXX XXXX" hardcoded as the WhatsApp number fallback.
 *     This placeholder would have shipped to production and opened a broken link.
 *   - Now falls back gracefully: if NEXT_PUBLIC_SUPPORT_WHATSAPP is not set,
 *     the button shows "Contact Support" and opens a mailto instead.
 *   - Added the env var to .env.example (see that file).
 */

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
const SUPPORT_EMAIL   = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@creatorbiotree.app";

export function HelpButton() {
  const handleClick = () => {
    if (WHATSAPP_NUMBER) {
      // Format: remove spaces, dashes, parentheses — keep only digits and leading +
      const cleaned = WHATSAPP_NUMBER.replace(/[^\d+]/g, "");
      const message = encodeURIComponent(
        "Hi! I need help with my CreatorBioTree account."
      );
      window.open(`https://wa.me/${cleaned}?text=${message}`, "_blank");
    } else {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=CreatorBioTree%20Support`;
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      title={WHATSAPP_NUMBER ? "Chat on WhatsApp" : "Email support"}
    >
      {WHATSAPP_NUMBER ? (
        <>
          <span aria-hidden="true">💬</span>
          <span>WhatsApp Support</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">✉️</span>
          <span>Contact Support</span>
        </>
      )}
    </Button>
  );
}
