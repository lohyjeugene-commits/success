import type { ActivityCategory } from "@/lib/constants/activity-categories";
import { resolveActivitySelection } from "@/lib/constants/activity-categories";
import { createSupabaseServerClient } from "./server";
import { getMembershipsForUser } from "./memberships";
import {
  isMissingColumnError,
  isMissingMaxMembersError,
  isMissingTableError,
} from "./errors";
import type { ActivityGroupRow, MeetupSlotRow } from "@/types/group";

export type JoinedGroupSummary = ActivityGroupRow & {
  can_manage: boolean;
  membership_role: string | null;
};

export type InvitedSlotSummary = MeetupSlotRow & {
  accepted_invite: boolean;
  group_activity_category: ActivityCategory;
  group_activity_type: string;
  group_area: string;
  group_title: string;
};

type GroupBase = Omit<ActivityGroupRow, "current_member_count"> & {
  creator_user_id?: string | null;
};

type GroupRecord = {
  area: string;
  activity_category?: string | null;
  activity_type: string | null;
  creator_user_id?: string | null;
  id: string;
  max_members?: number | null;
  title: string;
};

type SlotAcceptanceRow = {
  slot_id: string;
};

type AvailabilityVoteRow = {
  auth_user_id?: string | null;
  slot_id: string;
  user_id?: string | null;
};

type MeetupSlotBase = Omit<
  MeetupSlotRow,
  "availability_count" | "available_display_names" | "current_user_voted"
>;

function asGroupRecords(value: unknown): GroupRecord[] {
  return (value ?? []) as GroupRecord[];
}

function asGroupIdRows(value: unknown): Array<{ group_id: string }> {
  return (value ?? []) as Array<{ group_id: string }>;
}

function asMeetupSlotRows(value: unknown): MeetupSlotBase[] {
  return (value ?? []) as MeetupSlotBase[];
}

function asAvailabilityVoteRows(value: unknown): AvailabilityVoteRow[] {
  return (value ?? []) as AvailabilityVoteRow[];
}

function asSlotAcceptanceRows(value: unknown): SlotAcceptanceRow[] {
  return (value ?? []) as SlotAcceptanceRow[];
}

function normalizeGroupRecord(group: GroupRecord): GroupBase {
  const selection = resolveActivitySelection(
    group.activity_category,
    group.activity_type,
  );

  return {
    area: group.area,
    activity_category: selection.activity_category,
    activity_type: selection.activity_type,
    creator_user_id: group.creator_user_id ?? null,
    id: group.id,
    max_members: group.max_members ?? null,
    title: group.title,
  };
}

export async function getDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const membershipsResult = await getMembershipsForUser(supabase, userId);

  if (membershipsResult.errorMessage) {
    return {
      errorMessage: membershipsResult.errorMessage,
      joinedGroups: [] as JoinedGroupSummary[],
      invitedSlots: [] as InvitedSlotSummary[],
    };
  }

  const groupIds = membershipsResult.memberships.map((membership) => membership.group_id);

  if (groupIds.length === 0) {
    return {
      errorMessage: null,
      joinedGroups: [] as JoinedGroupSummary[],
      invitedSlots: [] as InvitedSlotSummary[],
    };
  }

  const groupsResult = await supabase
    .from("activity_groups")
    .select(
      "id, title, activity_category, activity_type, area, max_members, creator_user_id",
    )
    .in("id", groupIds)
    .order("id", { ascending: false });

  const missingActivityCategory = groupsResult.error
    ? isMissingColumnError(groupsResult.error, "activity_category")
    : false;
  const missingMaxMembers = groupsResult.error
    ? isMissingMaxMembersError(groupsResult.error)
    : false;
  const missingCreatorUserId = groupsResult.error
    ? isMissingColumnError(groupsResult.error, "creator_user_id")
    : false;

  if (
    groupsResult.error &&
    !missingActivityCategory &&
    !missingMaxMembers &&
    !missingCreatorUserId
  ) {
    return {
      errorMessage: `Could not load joined groups: ${groupsResult.error.message}`,
      joinedGroups: [] as JoinedGroupSummary[],
      invitedSlots: [] as InvitedSlotSummary[],
    };
  }

  const fallbackGroupsResult =
    groupsResult.error
      ? await supabase
          .from("activity_groups")
          .select(
            [
              "id",
              "title",
              ...(missingActivityCategory ? [] : ["activity_category"]),
              "activity_type",
              "area",
              ...(missingMaxMembers ? [] : ["max_members"]),
              ...(missingCreatorUserId ? [] : ["creator_user_id"]),
            ].join(", "),
          )
          .in("id", groupIds)
          .order("id", { ascending: false })
      : null;

  if (fallbackGroupsResult?.error) {
    return {
      errorMessage: `Could not load joined groups: ${fallbackGroupsResult.error.message}`,
      joinedGroups: [] as JoinedGroupSummary[],
      invitedSlots: [] as InvitedSlotSummary[],
    };
  }

  const groups = asGroupRecords(groupsResult.data ?? fallbackGroupsResult?.data).map(
    normalizeGroupRecord,
  );

  const memberResult = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  if (memberResult.error) {
    return {
      errorMessage: `Could not load group members: ${memberResult.error.message}`,
      joinedGroups: [] as JoinedGroupSummary[],
      invitedSlots: [] as InvitedSlotSummary[],
    };
  }

  const memberCountMap = new Map<string, number>();

  for (const member of asGroupIdRows(memberResult.data)) {
    memberCountMap.set(
      member.group_id,
      (memberCountMap.get(member.group_id) ?? 0) + 1,
    );
  }

  const membershipRoleMap = new Map(
    membershipsResult.memberships.map((membership) => [
      membership.group_id,
      membership.role ?? "member",
    ]),
  );

  const joinedGroups: JoinedGroupSummary[] = groups.map((group) => ({
    can_manage:
      group.creator_user_id === userId ||
      membershipRoleMap.get(group.id) === "admin" ||
      membershipRoleMap.get(group.id) === "creator",
    ...group,
    current_member_count: memberCountMap.get(group.id) ?? 0,
    membership_role: membershipRoleMap.get(group.id) ?? null,
  }));

  const slotsResult = await supabase
    .from("meetup_slots")
    .select("id, group_id, starts_at, ends_at, created_at")
    .in("group_id", groupIds)
    .order("starts_at", { ascending: true });

  if (slotsResult.error) {
    const errorMessage = isMissingTableError(slotsResult.error)
      ? "Meetup slots are not set up yet. Run the SQL in supabase/migrations/20260422_create_meetup_slots_and_availability_votes.sql."
      : `Could not load invited slots: ${slotsResult.error.message}`;

    return {
      errorMessage,
      invitedSlots: [] as InvitedSlotSummary[],
      joinedGroups,
    };
  }

  const slots = asMeetupSlotRows(slotsResult.data);

  if (slots.length === 0) {
    return {
      errorMessage: null,
      invitedSlots: [] as InvitedSlotSummary[],
      joinedGroups,
    };
  }

  const slotIds = slots.map((slot) => slot.id);
  const voteResult = await supabase
    .from("availability_votes")
    .select("slot_id, user_id, auth_user_id")
    .in("slot_id", slotIds);

  if (voteResult.error) {
    return {
      errorMessage: `Could not load availability votes: ${voteResult.error.message}`,
      invitedSlots: [] as InvitedSlotSummary[],
      joinedGroups,
    };
  }

  const acceptanceResult = await supabase
    .from("slot_acceptances")
    .select("slot_id")
    .eq("user_id", userId)
    .in("slot_id", slotIds);

  if (acceptanceResult.error && !isMissingTableError(acceptanceResult.error)) {
    return {
      errorMessage: `Could not load slot acceptances: ${acceptanceResult.error.message}`,
      invitedSlots: [] as InvitedSlotSummary[],
      joinedGroups,
    };
  }

  const voteCounts = new Map<string, number>();
  const userAvailableSlotIds = new Set<string>();
  const availableUserIdsBySlot = new Map<string, string[]>();

  for (const vote of asAvailabilityVoteRows(voteResult.data)) {
    voteCounts.set(vote.slot_id, (voteCounts.get(vote.slot_id) ?? 0) + 1);

    const displayUserId = vote.user_id || vote.auth_user_id || "Unknown user";
    const currentUsers = availableUserIdsBySlot.get(vote.slot_id) ?? [];
    availableUserIdsBySlot.set(vote.slot_id, [...currentUsers, displayUserId]);

    if (vote.auth_user_id === userId || vote.user_id === userId) {
      userAvailableSlotIds.add(vote.slot_id);
    }
  }

  const acceptedSlotIds = new Set(
    asSlotAcceptanceRows(acceptanceResult.data).map((row) => row.slot_id),
  );
  const groupsMap = new Map(joinedGroups.map((group) => [group.id, group]));

  const invitedSlots: InvitedSlotSummary[] = slots
    .map((slot) => {
      const group = groupsMap.get(slot.group_id);

      if (!group) {
        return null;
      }

      return {
        ...slot,
        accepted_invite: acceptedSlotIds.has(slot.id),
        availability_count: voteCounts.get(slot.id) ?? 0,
        available_display_names: availableUserIdsBySlot.get(slot.id) ?? [],
        group_activity_category: group.activity_category,
        current_user_voted: userAvailableSlotIds.has(slot.id),
        group_activity_type: group.activity_type,
        group_area: group.area,
        group_title: group.title,
      };
    })
    .filter((slot): slot is InvitedSlotSummary => slot !== null);

  return {
    errorMessage: null,
    invitedSlots,
    joinedGroups,
  };
}
