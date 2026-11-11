"use client";

import { MarkdownText } from "@/components/common/MarkdownText";
import type { ChatUiMessage } from "@/components/features/chat/types";

export function ChatMessageBubble({ message: m }: { message: ChatUiMessage }) {
  return (
    <div
      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          m.role === "user"
            ? "bg-accent text-paper"
            : "border border-[var(--line)] bg-paper text-ink"
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
