import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { findMatchingGroups } from "@/lib/supabase/matching";
import { SINGAPORE_AREAS } from "@/lib/constants/singapore-areas";
import { GroupCard } from "@/components/groups/group-card";
import { joinGroup } from "@/app/supabase-test/actions";
import { getExistingTemporaryDisplayName } from "@/lib/server/temporary-user";
import { getDisplayNameForUser, getAuthenticatedUser } from "@/lib/supabase/auth";
import { DisplayNameField } from "@/components/groups/display-name-field";
import { ActivityPicker } from "@/components/groups/activity-picker";

const groupSizes = [2, 3, 4, 5, 6, 8, 10];

type FindMatchPageProps = {
  searchParams: Promise<{
    activity_category?: string | string[];
    activity_type?: string | string[];
    area?: string | string[];
    preferred_size?: string | string[];
    error?: string | string[];
    message?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FindMatchPage({
  searchParams,
}: FindMatchPageProps) {
  await requireAuthenticatedUser({
    message: "Please log in to find a group.",
    returnTo: "/find-match",
  });

  const resolvedSearchParams = await searchParams;
  const authenticatedUser = await getAuthenticatedUser();
  const temporaryDisplayName = await getExistingTemporaryDisplayName();
  const currentDisplayName = authenticatedUser
    ? getDisplayNameForUser(authenticatedUser)
    : temporaryDisplayName;

  const activityCategory = getSearchParamValue(
    resolvedSearchParams.activity_category,
  );
  const activityType = getSearchParamValue(resolvedSearchParams.activity_type);
  const area = getSearchParamValue(resolvedSearchParams.area);
  const preferredSize = getSearchParamValue(resolvedSearchParams.preferred_size);
  const message = getSearchParamValue(resolvedSearchParams.message);
  const error = getSearchParamValue(resolvedSearchParams.error);

  let matchedGroups: Awaited<ReturnType<typeof findMatchingGroups>>["groups"] = [];
  const searchPerformed = Boolean(
    activityCategory || activityType || area || preferredSize,
  );

  if (searchPerformed) {
    const result = await findMatchingGroups({
      activityCategory: activityCategory || undefined,
      activityType: activityType || undefined,
      area: area || undefined,
      preferredSize: preferredSize ? parseInt(preferredSize, 10) : undefined,
    });
    matchedGroups = result.groups;
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Link
              href="/"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
            >
              Back to home
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Find me a group
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Tell us what you&apos;re looking for and we&apos;ll find the
                best matching groups for you.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form method="get" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ActivityPicker
                defaultActivityCategory={activityCategory || null}
                defaultActivityType={activityType || null}
                required={false}
                categoryPlaceholder="Any category"
                activityPlaceholder="Choose a category first"
                emptyActivityOptionLabel="Any activity in this category"
              />

              <div className="space-y-2">
                <label
                  htmlFor="area"
                  className="block text-sm font-medium text-slate-700"
                >
                  Area
                </label>
                <select
                  id="area"
                  name="area"
                  defaultValue={area || ""}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Any area</option>
                  {SINGAPORE_AREAS.map((areaOption) => (
                    <option key={areaOption} value={areaOption}>
                      {areaOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="preferred_size"
                  className="block text-sm font-medium text-slate-700"
                >
                  Preferred Size
                </label>
                <select
                  id="preferred_size"
                  name="preferred_size"
                  defaultValue={preferredSize || ""}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Any size</option>
                  {groupSizes.map((size) => (
                    <option key={size} value={size}>
                      {size} people
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Find Match
            </button>
          </form>
        </section>

        {(message || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}

        {searchPerformed && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              {matchedGroups.length > 0
                ? `Found ${matchedGroups.length} matching group${
                    matchedGroups.length > 1 ? "s" : ""
                  }`
                : "No matches found"}
            </h2>

            {matchedGroups.length === 0 ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-slate-600">
                  No good match found. Create a new group instead?
                </p>
                <Link
                  href="/create-group"
                  className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create a Group
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {matchedGroups.map((group) => {
                  const isFull =
                    group.max_members !== null &&
                    group.current_member_count >= group.max_members;

                  return (
                    <GroupCard
                      key={group.id}
                      group={group}
                      href={`/groups/${group.id}`}
                      actionSlot={
                        !isFull ? (
                          <form action={joinGroup} className="space-y-3">
                            <input type="hidden" name="group_id" value={group.id} />
                            <input
                              type="hidden"
                              name="redirect_to"
                              value="/find-match"
                            />
                            <input type="hidden" name="success_key" value="message" />
                            <input type="hidden" name="error_key" value="error" />
                            <DisplayNameField
                              currentDisplayName={currentDisplayName}
                              inputId={`group-display-name-${group.id}`}
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Join Group
                            </button>
                          </form>
                        ) : null
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
