import Link from "next/link";
import { notFound } from "next/navigation";
import { joinGroup } from "@/app/supabase-test/actions";
import { DisplayNameField } from "@/components/groups/display-name-field";
import { IdMetadataRow } from "@/components/ids/id-metadata-row";
import { ReliabilityBadge } from "@/components/users/reliability-display";
import {
  getExistingTemporaryDisplayName,
  getExistingTemporaryUserId,
} from "@/lib/server/temporary-user";
import {
  getAuthenticatedUser,
  getDisplayNameForUser,
} from "@/lib/supabase/auth";
import { getGroupDetails } from "@/lib/supabase/group-details";
import { getMultipleUserRatings } from "@/lib/supabase/reliability";
import { createMeetupSlot, voteAvailability } from "./actions";

type GroupDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const dynamic = "force-dynamic";

export default async function GroupDetailsPage({
  params,
  searchParams,
}: GroupDetailsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const authenticatedUser = await getAuthenticatedUser();
  const temporaryUserId = await getExistingTemporaryUserId();
  const temporaryDisplayName = await getExistingTemporaryDisplayName();
  const currentUserId = authenticatedUser?.id ?? temporaryUserId;
  const currentDisplayName = authenticatedUser
    ? getDisplayNameForUser(authenticatedUser)
    : temporaryDisplayName;
  const message = getSearchParamValue(resolvedSearchParams.message);
  const joinError = getSearchParamValue(resolvedSearchParams.error);
  const { availabilityErrorMessage, errorMessage, group, members, slots } =
    await getGroupDetails(resolvedParams.id, currentUserId);

  // Get ratings for members who have user IDs
  const memberUserIds = members
    .filter((m) => m.user_id)
    .map((m) => m.user_id as string);
  const memberRatings = memberUserIds.length > 0 
    ? await getMultipleUserRatings(memberUserIds)
    : new Map<string, number>();

  if (!errorMessage && !group) {
    notFound();
  }

  const isFull = group
    ? group.max_members !== null &&
      group.current_member_count >= group.max_members
    : false;
  const mostPopularSlotIds = getMostPopularSlotIds(slots);
  const remainingSpots =
    group && group.max_members !== null
      ? Math.max(group.max_members - group.current_member_count, 0)
      : null;
  const showSeparateActivityBadge = Boolean(
    group && group.activity_category !== group.activity_type,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-4">
          <Link
            href="/groups"
            className="inline-flex items-center text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
          >
            Back to groups
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white px-7 py-8 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">
              TouchGrass MVP
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              Group Details
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              See who joined, compare meetup slot interest, and keep the group
              organized without changing the simple MVP flow.
            </p>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm">
            {message}
          </div>
        ) : null}

        {joinError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
            {joinError}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </div>
        ) : null}

        {group ? (
          <>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-7 py-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {group.activity_category}
                      </span>
                      {showSeparateActivityBadge ? (
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          {group.activity_type}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {group.area}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500">
                        Group info
                      </p>
                      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                        {group.title}
                      </h2>
                      <p className="max-w-2xl text-sm leading-6 text-slate-600">
                        Keep this group lightweight and easy to coordinate with
                        a simple member list and meetup slot voting.
                      </p>
                      <IdMetadataRow
                        className="max-w-2xl"
                        label="Group ID"
                        value={group.id}
                      />
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      isFull
                        ? "border border-rose-200 bg-rose-50 text-rose-700"
                        : "border border-emerald-200 bg-white text-emerald-700"
                    }`}
                  >
                    {isFull ? "Group full" : "Open for members"}
                  </span>
                </div>
              </div>

              <div className="space-y-6 px-7 py-7">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Current members
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {group.current_member_count}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Max members
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {group.max_members ?? "Open"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Spots left
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {remainingSpots ?? "Flexible"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      Join this group
                    </p>
                    <p className="text-sm text-slate-600">
                      Join with a simple display name. We&apos;ll remember it on
                      later visits.
                    </p>
                  </div>

                  <form action={joinGroup}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <input
                      type="hidden"
                      name="redirect_to"
                      value={`/groups/${group.id}`}
                    />
                    <input type="hidden" name="success_key" value="message" />
                    <input type="hidden" name="error_key" value="error" />
                    <div className="mb-3 min-w-[240px]">
                      <DisplayNameField
                        currentDisplayName={currentDisplayName}
                        inputId={`join-display-name-${group.id}`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={Boolean(isFull)}
                      className={getJoinButtonClasses(Boolean(isFull))}
                    >
                      {isFull ? "Group full" : "Join Group"}
                    </button>
                  </form>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Proposed Meetup Slots
                  </h2>
                  <p className="text-sm text-slate-600">
                    Compare simple date options and see which time is getting
                    the most support.
                  </p>
                </div>
                <div className="text-sm font-medium text-slate-500">
                  {slots.length} slot{slots.length === 1 ? "" : "s"}
                </div>
              </div>

              {availabilityErrorMessage ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  {availabilityErrorMessage}
                </div>
              ) : null}

              {slots.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                  No meetup slots yet.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {slots.map((slot) => {
                    const isMostPopular = mostPopularSlotIds.has(slot.id);

                    return (
                      <article
                        key={slot.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {isMostPopular ? (
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                  {"\uD83D\uDD25 Most popular"}
                                </span>
                              ) : null}
                              {slot.current_user_voted ? (
                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  You&apos;re available
                                </span>
                              ) : null}
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
                              people marked this time
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 border-t border-slate-200 pt-5">
                          <p className="text-sm font-medium text-slate-900">
                            Available now
                          </p>

                          {slot.available_display_names.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500">
                              No one has marked this slot yet.
                            </p>
                          ) : (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {slot.available_display_names.map((displayName) => (
                                <span
                                  key={`${slot.id}-${displayName}`}
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                                >
                                  {displayName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-500">
                            Each member can vote once for this meetup slot.
                          </p>

                          <form action={voteAvailability}>
                            <input type="hidden" name="group_id" value={group.id} />
                            <input type="hidden" name="slot_id" value={slot.id} />
                            <input
                              type="hidden"
                              name="redirect_to"
                              value={`/groups/${group.id}`}
                            />
                            <div className="mb-3 min-w-[240px]">
                              <DisplayNameField
                                currentDisplayName={currentDisplayName}
                                inputId={`vote-display-name-${slot.id}`}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={slot.current_user_voted}
                              className={getAvailabilityButtonClasses(
                                slot.current_user_voted,
                              )}
                            >
                              {slot.current_user_voted
                                ? "You're available"
                                : "I'm Available"}
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-950">
                  Add a Meetup Slot
                </h2>
                <p className="text-sm text-slate-600">
                  Group creators and admins can propose a time so members can
                  coordinate availability.
                </p>
              </div>

              <form action={createMeetupSlot} className="mt-6 grid gap-5 md:grid-cols-2">
                <input type="hidden" name="group_id" value={group.id} />
                <input
                  type="hidden"
                  name="redirect_to"
                  value={`/groups/${group.id}`}
                />

                <div className="space-y-2">
                  <label
                    htmlFor="starts_at"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Start date and time
                  </label>
                  <input
                    id="starts_at"
                    name="starts_at"
                    type="datetime-local"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="ends_at"
                    className="block text-sm font-medium text-slate-700"
                  >
                    End date and time
                  </label>
                  <input
                    id="ends_at"
                    name="ends_at"
                    type="datetime-local"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Add a few realistic options so the group can vote quickly.
                  </p>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Add Slot
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Members
                  </h2>
                  <p className="text-sm text-slate-600">
                    Showing each member display name from{" "}
                    <code>group_members</code>.
                  </p>
                </div>
                <div className="text-sm font-medium text-slate-500">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </div>
              </div>

              {members.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                  No members yet.
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-3">
                  {members.map((member) => {
                    const memberRating = member.user_id 
                      ? memberRatings.get(member.user_id) ?? 5.0 
                      : 5.0;
                    return (
                      <span
                        key={member.id}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        {member.display_name}
                        {member.user_id && (
                          <span className="ml-2">
                            <ReliabilityBadge rating={memberRating} />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function formatSlotDateTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}

function getJoinButtonClasses(isDisabled: boolean) {
  return `inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
    isDisabled
      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
      : "bg-slate-950 text-white hover:bg-slate-800"
  }`;
}

function getAvailabilityButtonClasses(alreadyVoted: boolean) {
  return `inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
    alreadyVoted
      ? "cursor-not-allowed border border-emerald-200 bg-emerald-50 text-emerald-700"
      : "bg-slate-950 text-white hover:bg-slate-800"
  }`;
}

function getMostPopularSlotIds(
  slots: {
    availability_count: number;
    id: string;
  }[],
) {
  const highestVoteCount = Math.max(
    0,
    ...slots.map((slot) => slot.availability_count),
  );

  if (highestVoteCount === 0) {
    return new Set<string>();
  }

  return new Set(
    slots
      .filter((slot) => slot.availability_count === highestVoteCount)
      .map((slot) => slot.id),
  );
}
