import type { PostgrestError } from "@supabase/supabase-js";
import type { ActivityGroupRow } from "@/types/group";
import { createSupabaseServerClient } from "./server";

type ActivityGroupsResult = {
  error: PostgrestError | null;
  groups: ActivityGroupRow[];
};

type ActivityGroupBase = Omit<ActivityGroupRow, "current_member_count">;
type ActivityGroupWithoutLimit = Omit<ActivityGroupBase, "max_members">;
type GroupMemberRow = {
  group_id: string;
};

function isMissingMaxMembersError(error: PostgrestError) {
  const message = error.message.toLowerCase();

  return (
    error.code === "42703" ||
    (message.includes("max_members") &&
      (message.includes("column") || message.includes("schema cache")))
  );
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

export async function getActivityGroups(): Promise<ActivityGroupsResult> {
  const supabase = await createSupabaseServerClient();

  const withLimitResult = await supabase
    .from("activity_groups")
    .select("id, title, activity_type, area, max_members")
    .order("id", { ascending: false });

  if (!withLimitResult.error) {
    const memberResult = await supabase.from("group_members").select("group_id");

    if (memberResult.error) {
      return {
        error: memberResult.error,
        groups: [],
      };
    }

    return {
      error: null,
      groups: addMemberCounts(
        (withLimitResult.data ?? []) as ActivityGroupBase[],
        (memberResult.data ?? []) as GroupMemberRow[],
      ),
    };
  }

  if (!isMissingMaxMembersError(withLimitResult.error)) {
    return {
      error: withLimitResult.error,
      groups: [],
    };
  }

  const fallbackResult = await supabase
    .from("activity_groups")
    .select("id, title, activity_type, area")
    .order("id", { ascending: false });

  if (fallbackResult.error) {
    return {
      error: fallbackResult.error,
      groups: [],
    };
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
    groups: addMemberCounts(
      ((fallbackResult.data ?? []) as ActivityGroupWithoutLimit[]).map(
        (group) => ({
          ...group,
          max_members: null,
        }),
      ),
      (memberResult.data ?? []) as GroupMemberRow[],
    ),
  };
}
