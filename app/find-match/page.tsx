import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { findMatchingGroups } from "@/lib/supabase/matching";
import { SINGAPORE_AREAS } from "@/lib/constants/singapore-areas";
import { GroupCard } from "@/components/groups/group-card";
import { joinGroup } from "@/app/supabase-test/actions";
import { getExistingTemporaryDisplayName } from "@/lib/server/temporary-user";
import { getDisplayNameForUser, getAuthenticatedUser } from "@/lib/supabase/auth";
import { DisplayNameField } from "@/components/groups/display-name-field";

const activityTypes = [
  "Basketball",
  "Badminton",
  "Tennis",
  "Football",
  "Running",
  "Cycling",
  "Swimming",
  "Hiking",
  "Gym",
  "Yoga",
  "Dance",
  "Climbing",
  "Table Tennis",
  "Volleyball",
  "Other"
];

const groupSizes = [2, 3, 4, 5, 6, 8, 10];

type FindMatchPageProps = {
  searchParams: Promise<{
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

export default async function FindMatchPage({ searchParams }: FindMatchPageProps) {
  const user = await requireAuthenticatedUser({
    message: "Please log in to find a group.",
    returnTo: "/find-match",
  });
  
  const resolvedSearchParams = await searchParams;
  const authenticatedUser = await getAuthenticatedUser();
  const temporaryDisplayName = await getExistingTemporaryDisplayName();
  const currentDisplayName = authenticatedUser
    ? getDisplayNameForUser(authenticatedUser)
    : temporaryDisplayName;
  
  const activityType = getSearchParamValue(resolvedSearchParams.activity_type);
  const area = getSearchParamValue(resolvedSearchParams.area);
  const preferredSize = getSearchParamValue(resolvedSearchParams.preferred_size);
  const message = getSearchParamValue(resolvedSearchParams.message);
  const error = getSearchParamValue(resolvedSearchParams.error);
  
  let matchedGroups: Awaited<ReturnType<typeof findMatchingGroups>>["groups"] = [];
  let searchPerformed = false;
  
  if (activityType || area) {
    searchPerformed = true;
    const result = await findMatchingGroups({
      activityType: activityType || undefined,
      area: area || undefined,
      preferredSize: preferredSize ? parseInt(preferredSize, 10) : undefined
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
                Tell us what you&apos;re looking for and we&apos;ll find the best matching groups for you.
              </p>
            </div>
          </div>
        </div>
        
        {/* Search Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form method="get" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label
                  htmlFor="activity_type"
                  className="block text-sm font-medium text-slate-700"
                >
                  Activity Type
                </label>
                <select
                  id="activity_type"
                  name="activity_type"
                  defaultValue={activityType || ""}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Any activity</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
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
                  {SINGAPORE_AREAS.map(a => (
                    <option key={a} value={a}>{a}</option>
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
                  {groupSizes.map(size => (
                    <option key={size} value={size}>{size} people</option>
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
        
        {/* Messages */}
        {(message || error) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            error 
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}>
            {error || message}
          </div>
        )}
        
        {/* Results */}
        {searchPerformed && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              {matchedGroups.length > 0 
                ? `Found ${matchedGroups.length} matching group${matchedGroups.length > 1 ? 's' : ''}`
                : "No matches found"
              }
            </h2>
            
            {matchedGroups.length === 0 && searchPerformed && (
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
            )}
            
            {matchedGroups.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {matchedGroups.map(group => {
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
                            <input type="hidden" name="redirect_to" value="/find-match" />
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