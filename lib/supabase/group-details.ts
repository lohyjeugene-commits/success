import { createSupabaseServerClient } from "./server";
import type {
  ActivityGroupRow,
  GroupMemberIdentifier,
  MeetupSlotRow,
} from "@/types/group";
import { isMissingColumnError, isMissingTableError } from "./errors";
import { formatTemporaryUserLabel } from "@/lib/server/temporary-user";

type GroupDetailsResult = {
  availabilityErrorMessage: string | null;
  errorMessage: string | null;
  group: ActivityGroupRow | null;
  members: GroupMemberIdentifier[];
  slots: MeetupSlotRow[];
};

type GroupBase = Omit<ActivityGroupRow, "current_member_count">;
type GroupWithoutLimit = Omit<GroupBase, "max_members">;

type GroupMemberRow = {
  id: string;
  display_name?: string | null;
  name?: string | null;
  user_id: string | null;
};

type GroupMemberIdOnly = {
  id: string;
};

type MeetupSlotBase = Omit<
  MeetupSlotRow,
  "availability_count" | "available_display_names" | "current_user_voted"
>;

type AvailabilityVoteRow = {
  auth_user_id?: string | null;
  slot_id: string;
  user_id: string | null;
};

function getResolvedMemberDisplayName(
  userId: string | null | undefined,
  ...candidateDisplayNames: Array<string | null | undefined>
) {
  for (const candidateDisplayName of candidateDisplayNames) {
    const normalizedDisplayName = candidateDisplayName?.trim();

    if (normalizedDisplayName) {
      return normalizedDisplayName;
    }
  }

  return formatTemporaryUserLabel(userId, null);
}

function isMissingAnyColumnError(
  error: Parameters<typeof isMissingColumnError>[0],
  columns: string[],
) {
  return columns.some((column) => isMissingColumnError(error, column));
}

function mapGroupMembers(rows: GroupMemberRow[]) {
  return rows.map((member) => {
    const resolvedUserId = member.user_id || member.id;

    return {
      display_name: getResolvedMemberDisplayName(
        resolvedUserId,
        member.display_name,
        member.name,
      ),
      id: member.id,
      user_id: resolvedUserId,
    };
  });
}

async function getGroupMembers(groupId: string): Promise<{
  errorMessage: string | null;
  members: GroupMemberIdentifier[];
}> {
  const supabase = await createSupabaseServerClient();

  const withAllNameColumnsResult = await supabase
    .from("group_members")
    .select("id, user_id, display_name, name")
    .eq("group_id", groupId);

  if (!withAllNameColumnsResult.error) {
    return {
      errorMessage: null,
      members: mapGroupMembers(
        (withAllNameColumnsResult.data ?? []) as GroupMemberRow[],
      ),
    };
  }

  if (
    !isMissingAnyColumnError(withAllNameColumnsResult.error, [
      "display_name",
      "name",
      "user_id",
    ])
  ) {
    return {
      errorMessage: `Could not load group members: ${withAllNameColumnsResult.error.message}`,
      members: [],
    };
  }

  const withDisplayNameResult = await supabase
    .from("group_members")
    .select("id, user_id, display_name")
    .eq("group_id", groupId);

  if (!withDisplayNameResult.error) {
    return {
      errorMessage: null,
      members: mapGroupMembers(
        (withDisplayNameResult.data ?? []) as GroupMemberRow[],
      ),
    };
  }

  if (
    !isMissingAnyColumnError(withDisplayNameResult.error, [
      "display_name",
      "user_id",
    ])
  ) {
    return {
      errorMessage: `Could not load group members: ${withDisplayNameResult.error.message}`,
      members: [],
    };
  }

  const withNameResult = await supabase
    .from("group_members")
    .select("id, user_id, name")
    .eq("group_id", groupId);

  if (!withNameResult.error) {
    return {
      errorMessage: null,
      members: mapGroupMembers((withNameResult.data ?? []) as GroupMemberRow[]),
    };
  }

  if (
    !isMissingAnyColumnError(withNameResult.error, [
      "name",
      "user_id",
    ])
  ) {
    return {
      errorMessage: `Could not load group members: ${withNameResult.error.message}`,
      members: [],
    };
  }

  const idOnlyResult = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId);

  if (idOnlyResult.error) {
    return {
      errorMessage: `Could not load group members: ${idOnlyResult.error.message}`,
      members: [],
    };
  }

  return {
    errorMessage: null,
    members: ((idOnlyResult.data ?? []) as GroupMemberIdOnly[]).map(
      (member) => ({
        display_name: formatTemporaryUserLabel(member.id, null),
        id: member.id,
        user_id: member.id,
      }),
    ),
  };
}

async function getMeetupSlots(
  groupId: string,
  currentUserId: string | null,
): Promise<{
  errorMessage: string | null;
  slots: MeetupSlotRow[];
}> {
  const supabase = await createSupabaseServerClient();
  const slotResult = await supabase
    .from("meetup_slots")
    .select("id, group_id, starts_at, ends_at, created_at")
    .eq("group_id", groupId)
    .order("starts_at", { ascending: true });

  if (slotResult.error) {
    const errorMessage = isMissingTableError(slotResult.error)
      ? "Meetup slots are not set up yet. Run the SQL in supabase/migrations/20260422_create_meetup_slots_and_availability_votes.sql."
      : `Could not load meetup slots: ${slotResult.error.message}`;

    return {
      errorMessage,
      slots: [],
    };
  }

  const slots = (slotResult.data ?? []) as MeetupSlotBase[];

  if (slots.length === 0) {
    return {
      errorMessage: null,
      slots: [],
    };
  }

  const slotIds = slots.map((slot) => slot.id);
  const voteResult = await supabase
    .from("availability_votes")
    .select("slot_id, user_id, auth_user_id")
    .in("slot_id", slotIds);

  if (voteResult.error) {
    const errorMessage = isMissingTableError(voteResult.error)
      ? "Availability votes are not set up yet. Run the SQL in supabase/migrations/20260422_create_meetup_slots_and_availability_votes.sql."
      : `Could not load availability votes: ${voteResult.error.message}`;

    return {
      errorMessage,
      slots: slots.map((slot) => ({
        ...slot,
        availability_count: 0,
        available_display_names: [],
        current_user_voted: false,
      })),
    };
  }

  const voteCounts = new Map<string, number>();
  const userIdsBySlot = new Map<string, string[]>();
  const currentUserVotes = new Set<string>();

  for (const vote of (voteResult.data ?? []) as AvailabilityVoteRow[]) {
    voteCounts.set(vote.slot_id, (voteCounts.get(vote.slot_id) ?? 0) + 1);

    const userId = vote.user_id || vote.auth_user_id || "Unknown user";
    const existingUserIds = userIdsBySlot.get(vote.slot_id) ?? [];
    userIdsBySlot.set(vote.slot_id, [...existingUserIds, userId]);

    if (
      currentUserId &&
      (vote.auth_user_id === currentUserId || vote.user_id === currentUserId)
    ) {
      currentUserVotes.add(vote.slot_id);
    }
  }

  return {
    errorMessage: null,
    slots: slots.map((slot) => ({
      ...slot,
      availability_count: voteCounts.get(slot.id) ?? 0,
      available_display_names: userIdsBySlot.get(slot.id) ?? [],
      current_user_voted: currentUserVotes.has(slot.id),
    })),
  };
}

async function getGroupBase(groupId: string): Promise<{
  errorMessage: string | null;
  group: GroupBase | null;
}> {
  const supabase = await createSupabaseServerClient();

  const withLimitResult = await supabase
    .from("activity_groups")
    .select("id, title, activity_type, area, max_members")
    .eq("id", groupId)
    .maybeSingle();

  if (!withLimitResult.error) {
    return {
      errorMessage: null,
      group: (withLimitResult.data ?? null) as GroupBase | null,
    };
  }

  if (!isMissingColumnError(withLimitResult.error, "max_members")) {
    return {
      errorMessage: `Could not load group: ${withLimitResult.error.message}`,
      group: null,
    };
  }

  const fallbackResult = await supabase
    .from("activity_groups")
    .select("id, title, activity_type, area")
    .eq("id", groupId)
    .maybeSingle();

  if (fallbackResult.error) {
    return {
      errorMessage: `Could not load group: ${fallbackResult.error.message}`,
      group: null,
    };
  }

  if (!fallbackResult.data) {
    return {
      errorMessage: null,
      group: null,
    };
  }

  return {
    errorMessage: null,
    group: {
      ...((fallbackResult.data ?? null) as GroupWithoutLimit),
      max_members: null,
    },
  };
}

export async function getGroupDetails(
  groupId: string,
  currentUserId: string | null,
): Promise<GroupDetailsResult> {
  const [groupResult, memberResult, slotResult] = await Promise.all([
    getGroupBase(groupId),
    getGroupMembers(groupId),
    getMeetupSlots(groupId, currentUserId),
  ]);

  if (groupResult.errorMessage) {
    return {
      availabilityErrorMessage: null,
      errorMessage: groupResult.errorMessage,
      group: null,
      members: [],
      slots: [],
    };
  }

  if (!groupResult.group) {
    return {
      availabilityErrorMessage: null,
      errorMessage: null,
      group: null,
      members: [],
      slots: [],
    };
  }

  const group: ActivityGroupRow = {
    ...groupResult.group,
    current_member_count: memberResult.members.length,
  };

  const displayNamesByUserId = new Map(
    memberResult.members.map((member) => [member.user_id, member.display_name]),
  );

  const slotsWithDisplayNames = slotResult.slots.map((slot) => ({
    ...slot,
    available_display_names: slot.available_display_names.map((userId) =>
      displayNamesByUserId.get(userId) ?? formatTemporaryUserLabel(userId, null),
    ),
  }));

  return {
    availabilityErrorMessage: slotResult.errorMessage,
    errorMessage: memberResult.errorMessage,
    group,
    members: memberResult.members,
    slots: slotsWithDisplayNames,
  };
}
