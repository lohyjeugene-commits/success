export type MessageRow = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type MessageWithSender = MessageRow & {
  sender_display_name: string;
};

export type GroupChatPreview = {
  group_id: string;
  group_title: string;
  activity_type: string;
  area: string;
  latest_message?: string;
  latest_message_time?: string;
  unread_count?: number;
};