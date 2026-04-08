"use client";

import { MarkdownText } from "@/components/common/MarkdownText";
import type { ChatUiMessage } from "@/components/features/chat/types";

export function ChatMessageBubble({ message: m }: { message: ChatUiMessage }) {
  return (
    <div
      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          m.role === "user"
            ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-orange-300/30"
            : "border border-orange-100/80 bg-white/95 text-stone-800 shadow-orange-100/40"
        }`}
      >
        {m.role === "assistant" ? (
          <MarkdownText content={m.content} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{m.content}</p>
        )}
      </div>
    </div>
  );
}
