import Link from "next/link";
import { acceptSlotInvite, voteAvailability } from "@/app/groups/[id]/actions";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { getDashboardData } from "@/lib/supabase/dashboard";
import { ensureProfileForUser } from "@/lib/supabase/profiles";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatSlotDateTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireAuthenticatedUser({
    message: "Please log in to view your dashboard.",
    returnTo: "/dashboard",
  });
  await ensureProfileForUser(user);

  const resolvedSearchParams = await searchParams;
  const message = getSearchParamValue(resolvedSearchParams.message);
  const error = getSearchParamValue(resolvedSearchParams.error);
  const dashboardResult = await getDashboardData(user.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Member dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Your TouchGrass activity hub
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            See the groups you joined, track which meetup slots you are invited
            to, and accept event invites when the timing works for you.
          </p>
        </section>

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

        {dashboardResult.errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {dashboardResult.errorMessage}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950">Groups you joined</h2>
              <p className="text-sm text-slate-600">
                These are the activity groups linked to your account.
              </p>
            </div>
            <Link
              href="/groups"
              className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
            >
              Browse more groups
            </Link>
          </div>

          {dashboardResult.joinedGroups.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              You have not joined any groups yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {dashboardResult.joinedGroups.map((group) => (
                <article
                  key={group.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {group.activity_type}
                    </span>
                    {group.membership_role ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                        {group.membership_role}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-slate-950">
                    {group.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">Area: {group.area}</p>
                  <p className="text-sm text-slate-600">
                    Members: {group.current_member_count} / {group.max_members ?? "Open"}
                  </p>

                  <Link
                    href={`/groups/${group.id}`}
                    className="mt-5 inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View group
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950">Slot invitations</h2>
              <p className="text-sm text-slate-600">
                Every meetup slot from your joined groups appears here as a
                simple invite box you can respond to.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
            >
              Update your profile
            </Link>
          </div>

          {dashboardResult.invitedSlots.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              No meetup slot invites yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {dashboardResult.invitedSlots.map((slot) => (
                <article
                  key={slot.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {slot.group_activity_type}
                        </span>
                        {slot.current_user_voted ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            You&apos;re available
                          </span>
                        ) : null}
                        {slot.accepted_invite ? (
                          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            Invite accepted
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {slot.group_area}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-slate-950">
                          {slot.group_title}
                        </h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Starts
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-950">
                            {formatSlotDateTime(slot.starts_at)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Ends
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-950">
                            {formatSlotDateTime(slot.ends_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 lg:min-w-[180px]">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Available
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-950">
                        {slot.availability_count}
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        members for this slot
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-3">
                      <form action={voteAvailability}>
                        <input type="hidden" name="group_id" value={slot.group_id} />
                        <input type="hidden" name="slot_id" value={slot.id} />
                        <input type="hidden" name="redirect_to" value="/dashboard" />
                        <button
                          type="submit"
                          disabled={slot.current_user_voted}
                          className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            slot.current_user_voted
                              ? "cursor-not-allowed border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {slot.current_user_voted ? "Availability saved" : "I'm Available"}
                        </button>
                      </form>

                      <form action={acceptSlotInvite}>
                        <input type="hidden" name="slot_id" value={slot.id} />
                        <input type="hidden" name="redirect_to" value="/dashboard" />
                        <button
                          type="submit"
                          disabled={slot.accepted_invite}
                          className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            slot.accepted_invite
                              ? "cursor-not-allowed border border-orange-200 bg-orange-50 text-orange-700"
                              : "bg-slate-950 text-white hover:bg-slate-800"
                          }`}
                        >
                          {slot.accepted_invite ? "Invite accepted" : "Accept invite"}
                        </button>
                      </form>
                    </div>

                    <Link
                      href={`/groups/${slot.group_id}`}
                      className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
                    >
                      Open group details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
