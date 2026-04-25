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
  const hasCustomPicture = trimmedValue.length > 0;

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-7 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Public profile photo
          </p>
          <h2 className="text-xl font-semibold text-slate-950">
            Change profile picture
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Paste an image URL to preview your picture instantly. If you leave
            it blank, we&apos;ll keep showing your initials or avatar fallback.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setValue("");
            setPreviewFailed(false);
          }}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Clear picture
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Current preview
          </p>
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            {showImagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trimmedValue}
                alt="Profile picture preview"
                className="h-full w-full object-cover"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <span className="text-4xl font-semibold tracking-tight text-slate-700">
                {fallbackLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {hasCustomPicture
              ? "Preview updates as soon as you paste a valid image URL."
              : "No picture URL saved yet. Your public profile will keep using this fallback until you add one."}
          </p>
        </div>

        <div className="space-y-2">
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
            autoComplete="url"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <p className="text-xs text-slate-500">
            Use a full image link that starts with `http://` or `https://`.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
            Add a URL, check the preview, then click <span className="font-semibold text-slate-900">Save profile</span> below.
          </div>
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
    </section>
  );
}
