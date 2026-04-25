"use client";

import { useState } from "react";
import { getProfileAvatarFallback } from "@/lib/profile-display";

type ProfilePictureSectionProps = {
  avatarEmoji: string | null;
  fullName: string | null;
  profilePictureUrl: string | null;
  username: string | null;
};

function isPreviewableUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function ProfilePictureSection({
  avatarEmoji,
  fullName,
  profilePictureUrl,
  username,
}: ProfilePictureSectionProps) {
  const [value, setValue] = useState(profilePictureUrl ?? "");
  const [previewFailed, setPreviewFailed] = useState(false);
  const trimmedValue = value.trim();
  const showImagePreview = isPreviewableUrl(trimmedValue) && !previewFailed;
  const fallbackLabel = getProfileAvatarFallback({
    avatar_emoji: avatarEmoji,
    full_name: fullName,
    username,
  });

  return (
    <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Profile picture
          </p>
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {showImagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trimmedValue}
                alt="Profile picture preview"
                className="h-full w-full object-cover"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <span className="text-3xl font-semibold tracking-tight text-slate-700">
                {fallbackLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <label
            htmlFor="profile_picture_url"
            className="block text-sm font-medium text-slate-700"
          >
            Profile picture URL
          </label>
          <input
            id="profile_picture_url"
            name="profile_picture_url"
            type="url"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setPreviewFailed(false);
            }}
            placeholder="https://example.com/your-photo.jpg"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <p className="text-xs text-slate-500">
            Paste an image URL to preview it instantly. Leave this blank to keep
            the current initials or avatar fallback.
          </p>
          {trimmedValue && !isPreviewableUrl(trimmedValue) ? (
            <p className="text-xs text-amber-700">
              Preview works with URLs that start with `http://` or `https://`.
            </p>
          ) : null}
          {previewFailed ? (
            <p className="text-xs text-amber-700">
              We could not load that image preview. Double-check the URL and try
              again.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
