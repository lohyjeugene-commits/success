import type { ActivityGroupRow } from "@/types/group";
import { formatActivitySummary } from "@/lib/constants/activity-categories";
import { CopyTextButton } from "./copy-text-button";

type QuickGroupIdListItem = Pick<
  ActivityGroupRow,
  "activity_category" | "activity_type" | "area" | "id" | "title"
>;

type QuickGroupIdListProps = {
  description: string;
  groups: QuickGroupIdListItem[];
  title: string;
};

export function QuickGroupIdList({
  description,
  groups,
  title,
}: QuickGroupIdListProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-sky-200 bg-sky-50 p-7 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          Quick IDs
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          {description}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl border border-sky-200 bg-white px-5 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-950">
                  {group.title}
                </p>
                <p className="text-sm text-slate-600">
                  {formatActivitySummary(
                    group.activity_category,
                    group.activity_type,
                  )}{" "}
                  in {group.area}
                </p>
              </div>

              <CopyTextButton text={group.id} />
            </div>

            <code className="mt-4 block break-all rounded-2xl bg-slate-950 px-4 py-4 text-sm font-medium text-white">
              {group.id}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}
