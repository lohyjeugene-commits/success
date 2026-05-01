import type { ActivityGroupRow } from "@/types/group";
import { formatActivitySummary } from "@/lib/constants/activity-categories";
import { IdMetadataRow } from "./id-metadata-row";

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
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Quick IDs
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          {description}
        </p>
      </div>

      <div className="mt-5 divide-y divide-slate-200">
        {groups.map((group) => (
          <div key={group.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">
                  {group.title}
                </p>
                <p className="text-xs text-slate-500">
                  {formatActivitySummary(
                    group.activity_category,
                    group.activity_type,
                  )}{" "}
                  in {group.area}
                </p>
              </div>

              <IdMetadataRow
                align="end"
                className="sm:max-w-xs"
                inline
                label="Group ID"
                value={group.id}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
