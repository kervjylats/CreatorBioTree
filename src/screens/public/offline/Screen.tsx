/**
 * Offline fallback screen — displayed when the user has no connection.
 * Shows a friendly message, retry button, list of available PWAs, and
 * localStorage outbox status (offline.md Part 1).
 */
"use client";

import Link from "next/link";

export default function OfflineScreen() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mb-2">You&apos;re offline</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Some content might be unavailable until you&apos;re back online.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity mb-10"
      >
        Try Again
      </button>

      <div className="w-full max-w-sm">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Available Apps
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <p className="font-medium text-sm">CreatorBioTree Dashboard</p>
              <p className="text-xs text-muted-foreground">Manage your creators</p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-primary underline"
            >
              Open
            </Link>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <p className="font-medium text-sm">Fan App</p>
              <p className="text-xs text-muted-foreground">Browse your creators</p>
            </div>
            <Link
              href="/"
              className="text-xs text-primary underline"
            >
              Open
            </Link>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <p className="font-medium text-sm">Your Creator Apps</p>
              <p className="text-xs text-muted-foreground">Installed creator PWAs</p>
            </div>
            <span className="text-xs text-muted-foreground">Installed apps open from home screen</span>
          </div>
        </div>
      </div>

      <div className="mt-10 w-full max-w-sm">
        <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          Outbox Status
        </h2>
        <p className="text-xs text-muted-foreground" id="outbox-status">
          Checking...
        </p>
      </div>
    </main>
  );
}
