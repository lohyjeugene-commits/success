import Link from "next/link";
import { CopyTextButton } from "@/components/ids/copy-text-button";
import { ProfilePictureSection } from "@/components/profile/profile-picture-section";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import {
  ensureProfileForUser,
  getCurrentUserProfile,
} from "@/lib/supabase/profiles";
import { updateProfile } from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireAuthenticatedUser({
    message: "Please log in to manage your profile.",
    returnTo: "/profile",
  });

  await ensureProfileForUser(user);

  const resolvedSearchParams = await searchParams;
  const message = getSearchParamValue(resolvedSearchParams.message);
  const error = getSearchParamValue(resolvedSearchParams.error);
  const profileResult = await getCurrentUserProfile(user);
  const profile = profileResult.profile;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
          >
            Back to dashboard
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white px-7 py-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Public profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Edit your member profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Your profile is publicly readable so other TouchGrass members can
              see who they are meeting.
            </p>
          </div>
        </div>

        {profileResult.errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {profileResult.errorMessage}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <form action={updateProfile} className="flex flex-col gap-6">
          <ProfilePictureSection
            avatarEmoji={profile?.avatar_emoji ?? null}
            fullName={profile?.full_name ?? null}
            profilePictureUrl={profile?.profile_picture_url ?? null}
            username={profile?.username ?? null}
          />

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Profile details
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Keep this short, friendly, and easy to read.
                </p>
              </div>

              <Link
                href={`/profiles/${user.id}`}
                className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View public profile
              </Link>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="Ethan Tan"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={profile?.username ?? ""}
                  placeholder="ethan-runs"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="favorite_activity"
                  className="block text-sm font-medium text-slate-700"
                >
                  Favorite activity
                </label>
                <input
                  id="favorite_activity"
                  name="favorite_activity"
                  type="text"
                  defaultValue={profile?.favorite_activity ?? ""}
                  placeholder="Basketball"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="home_area"
                  className="block text-sm font-medium text-slate-700"
                >
                  Home area
                </label>
                <input
                  id="home_area"
                  name="home_area"
                  type="text"
                  defaultValue={profile?.home_area ?? ""}
                  placeholder="Punggol"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-slate-700"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={profile?.bio ?? ""}
                  placeholder="I usually host early morning basketball or quiet library study meetups."
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="avatar_emoji"
                  className="block text-sm font-medium text-slate-700"
                >
                  Avatar emoji
                </label>
                <input
                  id="avatar_emoji"
                  name="avatar_emoji"
                  type="text"
                  defaultValue={profile?.avatar_emoji ?? ""}
                  placeholder="🏀"
                  maxLength={4}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Account email
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {user.email ?? "No email available"}
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-200 pt-5 md:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Save profile
                </button>
              </div>
            </div>
          </section>
        </form>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                SQL / Admin IDs
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Your auth user ID
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-700">
                This is the user ID to use in Supabase SQL when you want to
                promote yourself, check memberships, or inspect your account
                directly.
              </p>
            </div>

            <CopyTextButton text={user.id} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Auth user ID
              </p>
              <code className="mt-3 block break-all rounded-2xl bg-slate-950 px-4 py-4 text-base font-medium text-white">
                {user.id}
              </code>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Account email
              </p>
              <p className="mt-3 break-all text-sm text-slate-900">
                {user.email ?? "No email available"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
