import { resolveActivitySelection } from "@/lib/constants/activity-categories";
import type { ActivityGroupRow } from "@/types/group";
import { isMissingColumnError, isMissingMaxMembersError } from "./errors";
import { createSupabaseServerClient } from "./server";

export type MatchPreference = {
  activityCategory?: string;
  activityType?: string;
  area?: string;
  preferredSize?: number;
};

type MatchedGroup = ActivityGroupRow & {
  matchReason: string;
  matchScore: number;
};

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

function normalizeActivityGroup(
  group: ActivityGroupRecord,
  currentMemberCount: number,
): ActivityGroupRow {
  const selection = resolveActivitySelection(
    group.activity_category,
    group.activity_type,
  );

  return {
    area: group.area,
    activity_category: selection.activity_category,
    activity_type: selection.activity_type,
    current_member_count: currentMemberCount,
    id: group.id,
    max_members: group.max_members ?? null,
    title: group.title,
  };
}

export async function findMatchingGroups(
  preference: MatchPreference,
): Promise<{ groups: MatchedGroup[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();

  let withOptionalColumnsQuery = supabase
    .from("activity_groups")
    .select("id, title, activity_category, activity_type, area, max_members");

  if (preference.area && preference.area.trim() !== "") {
    withOptionalColumnsQuery = withOptionalColumnsQuery.eq(
      "area",
      preference.area.trim(),
    );
  }

  const withOptionalColumnsResult = await withOptionalColumnsQuery;
  let rawGroups: ActivityGroupRecord[] = [];

  if (!withOptionalColumnsResult.error) {
    rawGroups = asActivityGroupRecords(withOptionalColumnsResult.data);
  } else {
    const missingActivityCategory = isMissingColumnError(
      withOptionalColumnsResult.error,
      "activity_category",
    );
    const missingMaxMembers = isMissingMaxMembersError(
      withOptionalColumnsResult.error,
    );

    if (!missingActivityCategory && !missingMaxMembers) {
      return { groups: [], error: withOptionalColumnsResult.error.message };
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
      .select(fallbackFields);

    if (preference.area && preference.area.trim() !== "") {
      fallbackQuery = fallbackQuery.eq("area", preference.area.trim());
    }

    const fallbackResult = await fallbackQuery;

    if (fallbackResult.error) {
      return { groups: [], error: fallbackResult.error.message };
    }

    rawGroups = asActivityGroupRecords(fallbackResult.data);
  }

  const memberResult = await supabase.from("group_members").select("group_id");

  if (memberResult.error) {
    return { groups: [], error: memberResult.error.message };
  }

  const memberCounts = new Map<string, number>();

  for (const member of asGroupMemberRows(memberResult.data)) {
    memberCounts.set(
      member.group_id,
      (memberCounts.get(member.group_id) ?? 0) + 1,
    );
  }

  const normalizedActivityCategory = preference.activityCategory?.trim();
  const normalizedActivityType = preference.activityType?.trim().toLowerCase();
  const filteredGroups = rawGroups
    .map((group) =>
      normalizeActivityGroup(group, memberCounts.get(group.id) ?? 0),
    )
    .filter((group) => {
      if (
        group.max_members !== null &&
        group.current_member_count >= group.max_members
      ) {
        return false;
      }

      if (
        normalizedActivityCategory &&
        group.activity_category !== normalizedActivityCategory
      ) {
        return false;
      }

      if (
        normalizedActivityType &&
        group.activity_type.toLowerCase() !== normalizedActivityType
      ) {
        return false;
      }

      return true;
    });

  const scoredGroups = filteredGroups.map((group) => {
    let score = 0;
    const reasons: string[] = [];

    if (group.max_members !== null) {
      const fillRatio = group.current_member_count / group.max_members;

      if (fillRatio >= 0.5 && fillRatio < 1) {
        score += 30 * fillRatio;
        reasons.push("Almost full");
      }
    }

    score += group.current_member_count * 5;

    if (group.current_member_count > 0) {
      reasons.push(
        `${group.current_member_count} member${
          group.current_member_count > 1 ? "s" : ""
        }`,
      );
    }

    if (
      preference.preferredSize &&
      group.max_members === preference.preferredSize
    ) {
      score += 20;
      reasons.push("Perfect size");
    }

    if (
      normalizedActivityCategory &&
      group.activity_category === normalizedActivityCategory
    ) {
      score += 10;
      reasons.push("Right category");
    }

    if (
      normalizedActivityType &&
      group.activity_type.toLowerCase() === normalizedActivityType
    ) {
      score += 15;
      reasons.push("Exact activity");
    }

    if (preference.area && group.area === preference.area.trim()) {
      score += 10;
    }

    return {
      ...group,
      matchReason: reasons.join(", ") || "Available group",
      matchScore: score,
    };
  });

  scoredGroups.sort((a, b) => b.matchScore - a.matchScore);

  return {
    groups: scoredGroups.slice(0, 10),
    error: null,
  };
}
