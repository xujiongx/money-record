"use client";

import type { RefObject } from "react";
import type { ChatUiMessage } from "@/components/features/chat/types";
import { ChatEmptyHero } from "@/components/features/chat/message/ChatEmptyHero";
import { ChatMessageBubble } from "@/components/features/chat/message/ChatMessageBubble";
import { ChatPendingRow } from "@/components/features/chat/message/ChatPendingRow";

type ChatMessageListProps = {
  listRef: RefObject<HTMLDivElement | null>;
  historyLoading: boolean;
  messages: ChatUiMessage[];
  pending: boolean;
};

export function ChatMessageList({
  listRef,
  historyLoading,
  messages,
  pending,
}: ChatMessageListProps) {
  return (
    <div
      ref={listRef}
      className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain bg-gradient-to-b from-transparent to-orange-50/20 px-4 py-4 [-webkit-overflow-scrolling:touch]"
    >
      {historyLoading && (
        <p className="py-6 text-center text-sm text-stone-400">加载历史对话…</p>
      )}
      {!historyLoading && messages.length === 0 && <ChatEmptyHero />}
      {messages.map((m) => (
        <ChatMessageBubble key={m.id} message={m} />
      ))}
      {pending && <ChatPendingRow />}
    </div>
  );
}
