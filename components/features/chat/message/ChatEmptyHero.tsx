"use client";

import { ChatBotMascot } from "@/components/features/chat/mascot/ChatBotMascot";

export function ChatEmptyHero() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-[var(--line)] bg-background">
        <ChatBotMascot variant="header" className="absolute inset-0" />
      </div>
      <p className="max-w-[16rem] text-center text-sm leading-relaxed text-stone-500">
        问记账的事，或点下面按钮，让{" "}
        <span className="font-medium text-accent">小布</span>{" "}
        帮你生成本月小结。
      </p>
    </div>
  );
}
