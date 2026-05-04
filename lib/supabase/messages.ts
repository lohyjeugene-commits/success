import { createSupabaseServerClient } from "./server";
import type { MessageRow, MessageWithSender, GroupChatPreview } from "@/types/message";

export async function getGroupMessages(groupId: string): Promise<{
  messages: MessageWithSender[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      group_id,
      user_id,
      content,
      created_at,
      profiles!messages_user_id_fkey(display_name)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (error) {
    return { messages: [], error: error.message };
  }

  const messages: MessageWithSender[] = (data ?? []).map((msg: any) => ({
    id: msg.id,
    group_id: msg.group_id,
    user_id: msg.user_id,
    content: msg.content,
    created_at: msg.created_at,
    sender_display_name: msg.profiles?.display_name || "Unknown User",
  }));

  return { messages, error: null };
}

export async function sendMessage(
  groupId: string,
  userId: string,
  content: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("messages")
    .insert({
      group_id: groupId,
      user_id: userId,
      content: content.trim(),
    });

  return { error: error ? error.message : null };
}

export async function getUserGroupChats(userId: string): Promise<{
  chats: GroupChatPreview[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();

  // Get groups the user is a member of
  const { data: memberships, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (membershipError) {
    return { chats: [], error: membershipError.message };
  }

  if (!memberships || memberships.length === 0) {
    return { chats: [], error: null };
  }

  const groupIds = memberships.map(m => m.group_id);

  // Get group details
  const { data: groups, error: groupsError } = await supabase
    .from("activity_groups")
    .select("id, title, activity_type, area")
    .in("id", groupIds);

  if (groupsError) {
    return { chats: [], error: groupsError.message };
  }

  // Get latest message for each group
  const chats: GroupChatPreview[] = await Promise.all(
    (groups ?? []).map(async (group) => {
      const { data: latestMessage } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        group_id: group.id,
        group_title: group.title,
        activity_type: group.activity_type,
        area: group.area,
        latest_message: latestMessage?.content,
        latest_message_time: latestMessage?.created_at,
      };
    })
  );

  return { chats, error: null };
}