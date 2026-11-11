"use client";

import { ChatTypingDots } from "@/components/features/chat/message/ChatTypingDots";

export function ChatPendingRow() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-paper px-2 py-1">
        <ChatTypingDots />
        <span className="pr-2 text-xs text-stone-400">思考中</span>
      </div>
    </div>
  );
}
