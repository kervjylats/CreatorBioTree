/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { PlaygroundTheme } from "@/types";


interface AppIdentityEditorProps {
  theme: PlaygroundTheme;
  onAppNameChange: (name: string) => void;
  onAppIconUpload: (file: File) => Promise<string | null>;
  bio: string;
  onBioChange: (bio: string) => void;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  username: string;
  onUsernameChange: (username: string) => void;
}

export function AppIdentityEditor({
  theme, onAppNameChange, onAppIconUpload,
  bio, onBioChange, displayName, onDisplayNameChange,
  username, onUsernameChange,
}: AppIdentityEditorProps) {
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const valid = /^[a-z0-9_]{3,20}$/.test(username);
    if (!valid) {
      setUsernameAvailable(false);
      setUsernameError("Usernames must be 3-20 characters: lowercase letters, numbers, and underscores only.");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/creator/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
        setUsernameError(data.available ? null : "This username is already taken.");
      } catch {
        setUsernameAvailable(null);
        setUsernameError(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username]);

  const handleUsernameInput = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    onUsernameChange(clean);
  };

  return (
    <div className="space-y-5">
      {/* Username */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => handleUsernameInput(e.target.value)}
          placeholder="yourname"
          maxLength={20}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <div className="mt-1 flex items-center gap-1.5">
          {checkingUsername && <span className="text-[9px] text-indigo-500 animate-pulse">Checking availability...</span>}
          {!checkingUsername && username.length >= 3 && usernameAvailable === true && (
            <span className="text-[9px] text-green-600 font-medium">Available ✓</span>
          )}
          {!checkingUsername && username.length >= 3 && usernameAvailable === false && (
            <span className="text-[9pxs] text-red-500 font-medium">{usernameError}</span>
          )}
        </div>
        <p className="text-[9px] text-amber-600 mt-1">
          Changing your username changes your fan link. Old links may break.
        </p>
      </div>

      {/* App Name */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">App Name</label>
        <input
          type="text"
          value={theme.profile.appName || ""}
          onChange={(e) => onAppNameChange(e.target.value)}
          placeholder="Creator App"
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <p className="text-[9px] text-amber-600 mt-1">
          Fans see this as the app title. Don&apos;t change it casually.
        </p>
      </div>

      {/* App Icon */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">App Icon</label>
        <div className="flex items-center gap-2">
          {theme.profile.appIconUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
              <Image src={theme.profile.appIconUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
            </div>
          )}
          <button
            type="button"
            onClick={() => document.getElementById("icon-upload-input")?.click()}
            disabled={uploadingIcon}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            {uploadingIcon ? "Uploading..." : "Upload Icon"}
          </button>
          <input
            id="icon-upload-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingIcon(true);
              await onAppIconUpload(file);
              setUploadingIcon(false);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-[9px] text-amber-600 mt-1">
          Fans who already installed your app won&apos;t see the new icon until their phone refreshes.
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Display Name</label>
        <input
          type="text"
          value={displayName || ""}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Your Name"
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Bio</label>
        <textarea
          value={bio || ""}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell fans about yourself..."
          rows={3}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>
    </div>
  );
}
