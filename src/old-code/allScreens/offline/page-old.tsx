/** PWA offline fallback — shown by service worker when user is offline and page isn't cached. */
"use client";

import React from "react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="mb-6 text-6xl">📶</div>
      <h1 className="text-2xl font-bold text-gray-900">{`You're Offline`}</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-xs">
        {`It looks like you don't have an internet connection. Some content might
        be unavailable until you're back online.`}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white transition active:scale-95"
      >
        Try Again
      </button>
    </div>
  );
}
