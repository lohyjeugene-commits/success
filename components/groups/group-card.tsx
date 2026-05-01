import Link from "next/link";
import type { ReactNode } from "react";
import { IdMetadataRow } from "@/components/ids/id-metadata-row";
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

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex justify-end border-b border-slate-200 pb-4">
        <IdMetadataRow
          align="end"
          className="sm:max-w-[240px]"
          label="Group ID"
          value={group.id}
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-950">
          {href ? (
            <Link
              href={href}
              className="rounded-xl transition hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              {group.title}
            </Link>
          ) : (
            group.title
          )}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Category: {group.activity_category}
        </p>
        <p className="text-sm text-slate-600">Activity: {group.activity_type}</p>
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
          <Link
            href={href}
            className="inline-flex text-sm font-medium text-emerald-700 transition hover:text-emerald-600"
          >
            View details
          </Link>
        ) : null}
      </div>

      {actionSlot ? <div className="mt-4">{actionSlot}</div> : null}
    </article>
  );
}
