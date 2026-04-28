import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser, getAuthenticatedUser } from "@/lib/supabase/auth";
import { getDashboardData } from "@/lib/supabase/dashboard";
import { getUserRating } from "@/lib/supabase/reliability";
import { GroupCard } from "@/components/groups/group-card";
import { ReliabilityDisplay } from "@/components/users/reliability-display";
import { joinGroup } from "@/app/supabase-test/actions";
import { getExistingTemporaryDisplayName } from "@/lib/server/temporary-user";
import { getDisplayNameForUser } from "@/lib/supabase/auth";
import { DisplayNameField } from "@/components/groups/display-name-field";

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
  
  // Get user's hosted groups (where they are the creator)
  const { hostedGroups, joinedGroupIds } = await getUserGroups(user.id);
  
  // Get user's reliability rating
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
        
        {/* User Reliability */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Your Reliability</h2>
          <div className="mt-3">
            <ReliabilityDisplay rating={userRating} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Your reliability rating is based on your attendance history.
          </p>
        </section>
        
        {/* Error Message */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}
        
        {/* Hosted Groups */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Groups I Host</h2>
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
              {hostedGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  href={`/groups/${group.id}`}
                />
              ))}
            </div>
          )}
        </section>
        
        {/* Joined Groups */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Groups I Joined</h2>
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
              {joinedGroups.map(group => {
                const isFull = 
                  group.max_members !== null && 
                  group.current_member_count >= group.max_members;
                const isHosted = hostedGroups.some(h => h.id === group.id);
                
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    href={`/groups/${group.id}`}
                    actionSlot={
                      !isFull && !isHosted ? (
                        <form action={joinGroup} className="space-y-3">
                          <input type="hidden" name="group_id" value={group.id} />
                          <input type="hidden" name="redirect_to" value="/my-groups" />
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
                      ) : isHosted ? (
                        <span className="text-sm font-medium text-emerald-700">
                          You host this group
                        </span>
                      ) : null
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

async function getUserGroups(userId: string) {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  
  // Get groups where user is the creator
  const hostedResult = await supabase
    .from("activity_groups")
    .select("id, title, activity_type, area, max_members, creator_user_id")
    .eq("creator_user_id", userId)
    .order("id", { ascending: false });
  
  // Get member counts for hosted groups
  const hostedGroupIds = (hostedResult.data ?? []).map(g => g.id);
  const memberCounts = new Map<string, number>();
  
  if (hostedGroupIds.length > 0) {
    const memberResult = await supabase
      .from("group_members")
      .select("group_id");
    
    for (const m of memberResult.data ?? []) {
      memberCounts.set(
        m.group_id,
        (memberCounts.get(m.group_id) ?? 0) + 1
      );
    }
  }
  
  const hostedGroups = (hostedResult.data ?? []).map(g => ({
    ...g,
    current_member_count: memberCounts.get(g.id) ?? 0
  }));
  
  // Get groups user has joined (from dashboard)
  const { joinedGroups } = await getDashboardData(userId);
  const joinedGroupIds = joinedGroups.map(g => g.id);
  
  return { hostedGroups, joinedGroupIds };
}