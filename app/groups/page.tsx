import Link from "next/link";
import { DisplayNameField } from "@/components/groups/display-name-field";
import { getExistingTemporaryDisplayName } from "@/lib/server/temporary-user";
import { GroupCard } from "@/components/groups/group-card";
import { QuickGroupIdList } from "@/components/ids/quick-group-id-list";
import {
  getAuthenticatedUser,
  getDisplayNameForUser,
} from "@/lib/supabase/auth";
import { getActivityGroups } from "@/lib/supabase/activity-groups";
import { SINGAPORE_AREAS } from "@/lib/constants/singapore-areas";
import { joinGroup } from "../supabase-test/actions";

type GroupsPageProps = {
  searchParams: Promise<{
    area?: string | string[];
    error?: string | string[];
    message?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const dynamic = "force-dynamic";

export default async function GroupsPage({
  searchParams,
}: GroupsPageProps) {
  const resolvedSearchParams = await searchParams;
  const authenticatedUser = await getAuthenticatedUser();
  const temporaryDisplayName = await getExistingTemporaryDisplayName();
  const currentDisplayName = authenticatedUser
    ? getDisplayNameForUser(authenticatedUser)
    : temporaryDisplayName;
  const message = getSearchParamValue(resolvedSearchParams.message);
  const joinError = getSearchParamValue(resolvedSearchParams.error);

  // Area filter from query string
  const area = getSearchParamValue(resolvedSearchParams.area) || "";
  const { error, groups } = await getActivityGroups(area);

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
                Groups
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Browse activity groups from Supabase, including each group&apos;s
                category, specific activity, current size limit, and join one
                with a simple saved display name.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Dashboard
            </Link>
            <Link
              href="/create-group"
              className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create a Group
            </Link>
          </div>
        </div>

        <QuickGroupIdList
          groups={groups}
          title="Quick Group IDs"
          description="Every group ID is listed here in one place so you can copy it directly without opening each card or reading the URL."
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Area Filter Dropdown */}
          <form
            method="get"
            className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            style={{ maxWidth: 480 }}
          >
            <label htmlFor="area" className="text-sm font-medium text-slate-700">
              Filter by area
            </label>
            <select
              id="area"
              name="area"
              defaultValue={area}
              className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All areas</option>
              {SINGAPORE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </form>
          <div className="space-y-3">
            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {joinError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {joinError}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Error: {error.message}
              </div>
            )}
          </div>

          {!error && groups.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              No groups yet. Create the first one.
            </div>
          )}

          {!error && groups.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {groups.map((group) => {
                const isFull =
                  group.max_members !== null &&
                  group.current_member_count >= group.max_members;

                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    href={`/groups/${group.id}`}
                    actionSlot={
                      <form action={joinGroup} className="space-y-3">
                        <input type="hidden" name="group_id" value={group.id} />
                        <input type="hidden" name="redirect_to" value="/groups" />
                        <input type="hidden" name="success_key" value="message" />
                        <input type="hidden" name="error_key" value="error" />
                        <DisplayNameField
                          currentDisplayName={currentDisplayName}
                          inputId={`group-display-name-${group.id}`}
                        />
                        <button
                          type="submit"
                          disabled={isFull}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            isFull
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : "border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          Join Group
                        </button>
                      </form>
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
