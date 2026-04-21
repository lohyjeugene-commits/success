import { createSupabaseServerClient } from "./server";
import { getMembershipsForUser } from "./memberships";
import { isMissingColumnError, isMissingTableError } from "./errors";
import type { ActivityGroupRow, MeetupSlotRow } from "@/types/group";

export type JoinedGroupSummary = ActivityGroupRow & {
  membership_role: string | null;
};

export type InvitedSlotSummary = MeetupSlotRow & {
  accepted_invite: boolean;
  group_activity_type: string;
  group_area: string;
  group_title: string;
};

type GroupBase = Omit<ActivityGroupRow, "current_member_count"> & {
  creator_user_id?: string | null;
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
    .select("id, title, activity_type, area, max_members")
    .in("id", groupIds)
    .order("id", { ascending: false });

  if (groupsResult.error && !isMissingColumnError(groupsResult.error, "max_members")) {
    return {
      errorMessage: `Could not load joined groups: ${groupsResult.error.message}`,
      joinedGroups: [] as JoinedGroupSummary[],
      invitedSlots: [] as InvitedSlotSummary[],
    };
  }

  const fallbackGroupsResult =
    groupsResult.error && isMissingColumnError(groupsResult.error, "max_members")
      ? await supabase
          .from("activity_groups")
          .select("id, title, activity_type, area")
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

  const groups = (
    groupsResult.data ??
    (fallbackGroupsResult?.data ?? []).map((group) => ({
      ...group,
      max_members: null,
    }))
  ) as GroupBase[];

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

  for (const member of (memberResult.data ?? []) as { group_id: string }[]) {
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

  const slots = (slotsResult.data ?? []) as MeetupSlotBase[];

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

  for (const vote of (voteResult.data ?? []) as AvailabilityVoteRow[]) {
    voteCounts.set(vote.slot_id, (voteCounts.get(vote.slot_id) ?? 0) + 1);

    const displayUserId = vote.user_id || vote.auth_user_id || "Unknown user";
    const currentUsers = availableUserIdsBySlot.get(vote.slot_id) ?? [];
    availableUserIdsBySlot.set(vote.slot_id, [...currentUsers, displayUserId]);

    if (vote.auth_user_id === userId || vote.user_id === userId) {
      userAvailableSlotIds.add(vote.slot_id);
    }
  }

  const acceptedSlotIds = new Set(
    ((acceptanceResult.data ?? []) as SlotAcceptanceRow[]).map((row) => row.slot_id),
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
