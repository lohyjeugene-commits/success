import Link from "next/link";
import type { ReactNode } from "react";
import { CopyTextButton } from "@/components/ids/copy-text-button";
import type { ActivityGroupRow } from "@/types/group";

type GroupCardProps = {
  actionSlot?: ReactNode;
  group: ActivityGroupRow;
  href?: string;
};

export function GroupCard({ actionSlot, group, href }: GroupCardProps) {
  const isFull =
    group.max_members !== null &&
    group.current_member_count >= group.max_members;

  const content = (
    <>
      <h3 className="text-base font-semibold text-slate-950">{group.title}</h3>
      <p className="mt-2 text-sm text-slate-600">
        Activity: {group.activity_type}
      </p>
      <p className="text-sm text-slate-600">Area: {group.area}</p>
      <p className="text-sm text-slate-600">
        Current members: {group.current_member_count}
      </p>
      <p className="text-sm text-slate-600">
        Max members: {group.max_members ?? "Not set yet"}
      </p>
      {isFull ? (
        <p className="text-sm font-medium text-rose-700">Group full</p>
      ) : null}
      {href ? (
        <p className="text-sm font-medium text-emerald-700">View details</p>
      ) : null}
    </>
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Group ID
            </p>
            <p className="text-sm text-slate-600">
              Use this exact ID for SQL, admin updates, or debugging.
            </p>
          </div>

          <CopyTextButton text={group.id} />
        </div>

        <code className="mt-4 block break-all rounded-2xl bg-white px-4 py-4 text-sm font-medium text-slate-900">
          {group.id}
        </code>
      </div>

      {href ? (
        <Link
          href={href}
          className="block space-y-1 rounded-xl transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          {content}
        </Link>
      ) : (
        <div className="space-y-1">{content}</div>
      )}

      {actionSlot ? <div className="mt-4">{actionSlot}</div> : null}
    </article>
  );
}
