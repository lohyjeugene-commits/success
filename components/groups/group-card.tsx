import Link from "next/link";
import type { ReactNode } from "react";
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
