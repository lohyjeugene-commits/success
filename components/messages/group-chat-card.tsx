import Link from "next/link";
import type { GroupChatPreview } from "@/types/message";

type GroupChatCardProps = {
  chat: GroupChatPreview;
};

export function GroupChatCard({ chat }: GroupChatCardProps) {
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <Link
      href={`/messages/${chat.group_id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-950 truncate">
            {chat.group_title}
          </h3>
          <p className="text-sm text-slate-600">
            {chat.activity_type} • {chat.area}
          </p>
          {chat.latest_message && (
            <p className="mt-2 text-sm text-slate-700 line-clamp-2">
              {chat.latest_message}
            </p>
          )}
        </div>
        {chat.latest_message_time && (
          <span className="ml-2 text-xs text-slate-500 flex-shrink-0">
            {formatTime(chat.latest_message_time)}
          </span>
        )}
      </div>
      {!chat.latest_message && (
        <p className="mt-2 text-sm text-slate-500 italic">
          No messages yet
        </p>
      )}
    </Link>
  );
}