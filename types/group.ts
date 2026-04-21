export type ActivityGroupRow = {
  id: string;
  title: string;
  activity_type: string;
  area: string;
  current_member_count: number;
  max_members: number | null;
};

export type GroupMemberIdentifier = {
  id: string;
  user_id: string;
};

export type MeetupSlotRow = {
  id: string;
  group_id: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  availability_count: number;
  available_user_ids: string[];
  current_user_voted: boolean;
};
