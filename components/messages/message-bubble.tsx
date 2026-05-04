import type { MessageWithSender } from "@/types/message";

type MessageBubbleProps = {
  message: MessageWithSender;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${isOwn ? "order-2" : "order-1"}`}>
        {!isOwn && (
          <div className="text-xs text-slate-500 mb-1 px-3">
            {message.sender_display_name}
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            isOwn
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-900"
          }`}
        >
          {message.content}
        </div>
        <div
          className={`text-xs text-slate-500 mt-1 px-3 ${
            isOwn ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}