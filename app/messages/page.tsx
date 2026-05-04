import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { getUserGroupChats } from "@/lib/supabase/messages";
import { GroupChatCard } from "@/components/messages/group-chat-card";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireAuthenticatedUser({
    message: "Please log in to view your messages.",
    returnTo: "/messages",
  });

  const { chats, error } = await getUserGroupChats(user.id);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
          >
            Back to home
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Messages
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Chat with members of groups you've joined.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Error: {error}
          </div>
        )}

        {!error && chats.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            <p className="mb-2">No group chats yet.</p>
            <p>Join a group to start messaging with other members.</p>
          </div>
        )}

        {!error && chats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {chats.map((chat) => (
              <GroupChatCard key={chat.group_id} chat={chat} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}