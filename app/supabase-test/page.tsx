import Link from "next/link";
import { DisplayNameField } from "@/components/groups/display-name-field";
import { GroupCard } from "@/components/groups/group-card";
import { GroupForm } from "@/components/groups/group-form";
import { getExistingTemporaryDisplayName } from "@/lib/server/temporary-user";
import { getActivityGroups } from "@/lib/supabase/activity-groups";
import { createGroup, joinGroup } from "./actions";

type SupabaseTestPageProps = {
  searchParams: Promise<{
    createError?: string | string[];
    createMessage?: string | string[];
    joinError?: string | string[];
    joinMessage?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: SupabaseTestPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentDisplayName = await getExistingTemporaryDisplayName();
  const createMessage = getSearchParamValue(resolvedSearchParams.createMessage);
  const createError = getSearchParamValue(resolvedSearchParams.createError);
  const joinMessage = getSearchParamValue(resolvedSearchParams.joinMessage);
  const joinError = getSearchParamValue(resolvedSearchParams.joinError);
  const { error, groups } = await getActivityGroups();

  return (
    <main className="min-h-screen px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
          >
            Back to home
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Supabase Test
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Use this page to create a group in the `activity_groups` table and
              immediately see the updated list below. Joining groups now uses a
              simple saved display name on top of the temporary member flow.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">
              Create Group
            </h2>
            <p className="text-sm text-slate-600">
              Add a simple activity group with a title, activity type, area,
              and a small size limit.
            </p>
          </div>

          <GroupForm
            errorMessage={createError}
            message={createMessage}
            redirectTo="/supabase-test"
            submitAction={createGroup}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">
              Available Groups
            </h2>
            <p className="text-sm text-slate-600">
              Groups currently stored in the `activity_groups` table, including
              their current size limit.
            </p>
          </div>

          <div className="mt-6">
            {joinMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {joinMessage}
              </div>
            )}

            {joinError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {joinError}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Error: {error.message}
              </div>
            )}

            {!error && groups.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                No groups yet.
              </div>
            )}

            {!error && groups.length > 0 && (
              <div className="space-y-4">
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
                          <DisplayNameField
                            currentDisplayName={currentDisplayName}
                            inputId={`supabase-test-display-name-${group.id}`}
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
          </div>
        </section>
      </div>
    </main>
  );
}
