/** TODO: Add purpose docstring. */
"use client";

import type { CreatorBranding } from "@/lib/branding";

interface GuestPageContentProps {
  branding: CreatorBranding;
  onSignUpClick?: () => void;
  selection?: any;
  onSelect?: (sel: any) => void;
}

export function GuestPageContent({
  branding,
  onSignUpClick,
  selection,
  onSelect,
}: GuestPageContentProps) {
  const editMode = !!onSelect;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 space-y-6">
      {/* Display name */}
      <h1 className="text-2xl font-bold text-center" style={{ color: branding.textColor }}>
        {branding.displayName}
      </h1>

      {/* Bio */}
      {branding.description && (
        <p className="text-sm text-center leading-relaxed" style={{ color: branding.textColor + "80" }}>
          {branding.description}
        </p>
      )}

      {/* Sign Up button */}
      {editMode ? (
        <button
          className="w-full max-w-xs py-3 rounded-xl text-sm font-medium text-white opacity-60 cursor-not-allowed"
          style={{ backgroundColor: branding.accentColor }}
          disabled
        >
          Sign Up to See More
        </button>
      ) : onSignUpClick ? (
        <button
          onClick={onSignUpClick}
          className="px-8 py-3 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: branding.accentColor }}
        >
          Sign Up to See More
        </button>
      ) : null}
    </div>
  );
}
