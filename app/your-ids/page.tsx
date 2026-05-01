import Link from "next/link";
import { IdMetadataRow } from "@/components/ids/id-metadata-row";
import { QuickGroupIdList } from "@/components/ids/quick-group-id-list";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { getDashboardData } from "@/lib/supabase/dashboard";

export default async function YourIdsPage() {
  const user = await requireAuthenticatedUser({
    message: "Please log in to view your IDs.",
    returnTo: "/your-ids",
  });

  const idsResult = await getDashboardData(user.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
          >
            Back to dashboard
          </Link>

          <section className="rounded-3xl border border-slate-200 bg-white px-7 py-8 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Your IDs
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                  Account and group IDs
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Copy your auth user ID, account email, and joined group IDs
                  from one compact page.
                </p>
              </div>

              <div className="space-y-2 lg:pt-1">
                <IdMetadataRow
                  align="end"
                  className="lg:max-w-sm"
                  inline
                  label="Auth user ID"
                  value={user.id}
                />
                <p className="text-sm text-slate-500 lg:text-right">
                  {user.email ?? "No email available"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {idsResult.errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {idsResult.errorMessage}
          </div>
        ) : null}

        {idsResult.joinedGroups.length > 0 ? (
          <QuickGroupIdList
            groups={idsResult.joinedGroups}
            title="Group IDs for every group you joined"
            description="Copy a group ID without opening each group page or reading it from the URL."
          />
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Group IDs
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Group IDs for every group you joined
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                You have not joined any groups yet, so there are no group IDs to
                copy here.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
