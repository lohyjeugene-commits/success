import Link from "next/link";
import { GroupForm } from "@/components/groups/group-form";
import { createGroup } from "../supabase-test/actions";

type CreateGroupPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CreateGroupPage({
  searchParams,
}: CreateGroupPageProps) {
  const resolvedSearchParams = await searchParams;
  const message = getSearchParamValue(resolvedSearchParams.message);
  const error = getSearchParamValue(resolvedSearchParams.error);

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
              Create Group
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Add a new activity group to Supabase with the same working create
              logic used in the test page.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">
              New activity group
            </h2>
            <p className="text-sm text-slate-600">
              Fill in the details below, choose a small group size limit, then
              view the result on the Groups page.
            </p>
          </div>

          <GroupForm
            errorMessage={error}
            message={message}
            redirectTo="/create-group"
            submitAction={createGroup}
          />
        </section>

        <div>
          <Link
            href="/groups"
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            View all groups
          </Link>
        </div>
      </div>
    </main>
  );
}
