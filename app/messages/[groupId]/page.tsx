import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { getGroupMessages, sendMessage } from "@/lib/supabase/messages";
import { getGroupDetails } from "@/lib/supabase/group-details";
import { MessageBubble } from "@/components/messages/message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import { sendGroupMessage } from "./actions";

type GroupChatPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function GroupChatPage({ params }: GroupChatPageProps) {
  const { groupId } = await params;

  const user = await requireAuthenticatedUser({
    message: "Please log in to view this chat.",
    returnTo: `/messages/${groupId}`,
  });

  // Check if user is a member of this group
  const { group, error: groupError } = await getGroupDetails(groupId);

  if (groupError || !group) {
    notFound();
  }

  // Verify user is a member
  const isMember = group.members.some(member => member.user_id === user.id);
  if (!isMember) {
    notFound();
  }

  const { messages, error: messagesError } = await getGroupMessages(groupId);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur px-6 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4">
          <Link
            href="/messages"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
          >
            ← Messages
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-950 truncate">
              {group.title}
            </h1>
            <p className="text-sm text-slate-600">
              {group.activity_type} • {group.area} • {group.members.length} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex w-full max-w-4xl flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            {messagesError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4">
                Error loading messages: {messagesError}
              </div>
            )}

            {!messagesError && messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-slate-500 mb-2">No messages yet.</p>
                  <p className="text-sm text-slate-400">Start the conversation!</p>
                </div>
              </div>
            )}

            {!messagesError && messages.length > 0 && (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.user_id === user.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
            <div className="mx-auto w-full max-w-4xl">
              <MessageInput groupId={groupId} sendMessageAction={sendGroupMessage} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}