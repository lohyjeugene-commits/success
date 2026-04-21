import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfileById } from "@/lib/supabase/profiles";

type PublicProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getProfileTitle(profile: {
  full_name: string | null;
  username: string | null;
}) {
  return profile.full_name || profile.username || "TouchGrass member";
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const resolvedParams = await params;
  const profileResult = await getPublicProfileById(resolvedParams.id);
  const errorMessage = profileResult.errorMessage;
  const profile = profileResult.profile;

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/groups"
          className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
        >
          Back to groups
        </Link>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                {profile.avatar_emoji || "TG"}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Public profile
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {getProfileTitle(profile)}
                </h1>
                <p className="text-sm text-slate-500">
                  @{profile.username || "touchgrass-member"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:min-w-[220px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Favorite activity
                </p>
                <p className="mt-2 text-sm font-medium text-slate-950">
                  {profile.favorite_activity || "Still filling this in"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Home area
                </p>
                <p className="mt-2 text-sm font-medium text-slate-950">
                  {profile.home_area || "Somewhere in Singapore"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-950">About</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {profile.bio || "This member has not added a bio yet."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
