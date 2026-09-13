/**
 * HomeScreenPreview — live "how it looks on fans' phones" display for the
 * Identity tab (2026-08-13): renders the app icon + app name exactly as they
 * appear on a phone home screen, updating instantly as the fields change.
 * Falls back to the display name under the icon and an accent-coloured letter
 * tile until an icon is set — matching the fan-shell fallbacks.
 */
"use client";

interface HomeScreenPreviewProps {
  appName: string;
  appIconUrl: string;
  fallbackName: string;
  accent: string;
}

export function HomeScreenPreview({ appName, appIconUrl, fallbackName, accent }: HomeScreenPreviewProps) {
  const name = appName.trim() || fallbackName.trim() || "Your App";
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #3b4a63, #0f172a)" }} />
      <div className="relative flex flex-col items-center gap-1.5 px-4 pb-2 pt-5">
        {appIconUrl ? (
          <img
            src={appIconUrl}
            alt="App icon"
            className="h-16 w-16 rounded-[18px] object-cover shadow-lg shadow-black/40"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center text-2xl font-bold text-white shadow-lg shadow-black/40"
            style={{ backgroundColor: accent, borderRadius: 18 }}
          >
            {initial}
          </div>
        )}
        <p className="max-w-[150px] truncate text-center text-caption font-medium text-white/90">{name}</p>
        <p className="text-[9px] uppercase tracking-widest text-white/40">Home screen</p>
      </div>
    </div>
  );
}
