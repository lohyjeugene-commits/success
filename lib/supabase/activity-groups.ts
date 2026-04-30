import type { PostgrestError } from "@supabase/supabase-js";
import { resolveActivitySelection } from "@/lib/constants/activity-categories";
import type { ActivityGroupRow } from "@/types/group";
import { isMissingColumnError, isMissingMaxMembersError } from "./errors";
import { createSupabaseServerClient } from "./server";

type ActivityGroupsResult = {
  error: PostgrestError | null;
  groups: ActivityGroupRow[];
};

type ActivityGroupBase = Omit<ActivityGroupRow, "current_member_count">;
type ActivityGroupRecord = {
  area: string;
  activity_category?: string | null;
  activity_type: string | null;
  id: string;
  max_members?: number | null;
  title: string;
};

type GroupMemberRow = {
  group_id: string;
};

function asActivityGroupRecords(value: unknown): ActivityGroupRecord[] {
  return (value ?? []) as ActivityGroupRecord[];
}

function asGroupMemberRows(value: unknown): GroupMemberRow[] {
  return (value ?? []) as GroupMemberRow[];
}

function normalizeActivityGroupBase(
  group: ActivityGroupRecord,
): ActivityGroupBase {
  const selection = resolveActivitySelection(
    group.activity_category,
    group.activity_type,
  );

  return {
    area: group.area,
    activity_category: selection.activity_category,
    activity_type: selection.activity_type,
    id: group.id,
    max_members: group.max_members ?? null,
    title: group.title,
  };
}

function addMemberCounts(
  groups: ActivityGroupBase[],
  memberRows: GroupMemberRow[],
): ActivityGroupRow[] {
  const memberCounts = new Map<string, number>();

  for (const member of memberRows) {
    memberCounts.set(
      member.group_id,
      (memberCounts.get(member.group_id) ?? 0) + 1,
    );
  }

  return groups.map((group) => ({
    ...group,
    current_member_count: memberCounts.get(group.id) ?? 0,
  }));
}

export async function getActivityGroups(
  area?: string,
): Promise<ActivityGroupsResult> {
  const supabase = await createSupabaseServerClient();

  let withOptionalColumnsQuery = supabase
    .from("activity_groups")
    .select("id, title, activity_category, activity_type, area, max_members")
    .order("id", { ascending: false });

  if (area && area !== "") {
    withOptionalColumnsQuery = withOptionalColumnsQuery.eq("area", area);
  }

  const withOptionalColumnsResult = await withOptionalColumnsQuery;
  let groups: ActivityGroupBase[] = [];

  if (!withOptionalColumnsResult.error) {
    groups = asActivityGroupRecords(withOptionalColumnsResult.data).map(
      normalizeActivityGroupBase,
    );
  } else {
    const missingActivityCategory = isMissingColumnError(
      withOptionalColumnsResult.error,
      "activity_category",
    );
    const missingMaxMembers = isMissingMaxMembersError(
      withOptionalColumnsResult.error,
    );

    if (!missingActivityCategory && !missingMaxMembers) {
      return {
        error: withOptionalColumnsResult.error,
        groups: [],
      };
    }

    const fallbackFields = [
      "id",
      "title",
      ...(missingActivityCategory ? [] : ["activity_category"]),
      "activity_type",
      "area",
      ...(missingMaxMembers ? [] : ["max_members"]),
    ].join(", ");

    let fallbackQuery = supabase
      .from("activity_groups")
      .select(fallbackFields)
      .order("id", { ascending: false });

    if (area && area !== "") {
      fallbackQuery = fallbackQuery.eq("area", area);
    }

    const fallbackResult = await fallbackQuery;

    if (fallbackResult.error) {
      return {
        error: fallbackResult.error,
        groups: [],
      };
    }

    groups = asActivityGroupRecords(fallbackResult.data).map(
      normalizeActivityGroupBase,
    );
  }

  const memberResult = await supabase.from("group_members").select("group_id");

  if (memberResult.error) {
    return {
      error: memberResult.error,
      groups: [],
    };
  }

  return {
    error: null,
    groups: addMemberCounts(groups, asGroupMemberRows(memberResult.data)),
  };
}
