import Link from "next/link";
import {
  getAuthenticatedUser,
  getDisplayNameForUser,
  requireAuthenticatedUser,
} from "@/lib/supabase/auth";
import { getDashboardData } from "@/lib/supabase/dashboard";
import { getUserRating } from "@/lib/supabase/reliability";
import { GroupCard } from "@/components/groups/group-card";
import { ReliabilityDisplay } from "@/components/users/reliability-display";
import { getExistingTemporaryDisplayName } from "@/lib/server/temporary-user";

export const dynamic = "force-dynamic";

export default async function MyGroupsPage() {
  const user = await requireAuthenticatedUser({
    message: "Please log in to view your groups.",
    returnTo: "/my-groups",
  });

  const authenticatedUser = await getAuthenticatedUser();
  const temporaryDisplayName = await getExistingTemporaryDisplayName();
  const currentDisplayName = authenticatedUser
    ? getDisplayNameForUser(authenticatedUser)
    : temporaryDisplayName;

  const { errorMessage, joinedGroups } = await getDashboardData(user.id);
  const hostedGroups = joinedGroups.filter(
    (group) => group.membership_role === "creator",
  );
  const userRating = await getUserRating(user.id);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
          >
            Back to home
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              My Groups
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Manage the groups you&apos;ve joined and hosted.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Your Reliability
          </h2>
          <div className="mt-3">
            <ReliabilityDisplay rating={userRating} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Your reliability rating is based on your attendance history.
          </p>
        </section>

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">
              Groups I Host
            </h2>
            <Link
              href="/create-group"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
            >
              + Create new
            </Link>
          </div>

          {hostedGroups.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              You haven&apos;t hosted any groups yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {hostedGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  href={`/groups/${group.id}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">
              Groups I Joined
            </h2>
            <Link
              href="/groups"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
            >
              Browse groups
            </Link>
          </div>

          {joinedGroups.length === 0 ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                You haven&apos;t joined any groups yet.
              </div>
              <Link
                href="/groups"
                className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Browse Groups
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {joinedGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  href={`/groups/${group.id}`}
                  actionSlot={
                    hostedGroups.some((hostedGroup) => hostedGroup.id === group.id) ? (
                      <span className="text-sm font-medium text-emerald-700">
                        You host this group
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">
                        Joined as {group.membership_role ?? "member"}
                        {currentDisplayName ? `: ${currentDisplayName}` : ""}
                      </span>
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
