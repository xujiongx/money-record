"use client";

import { ChatBotMascot } from "@/components/features/chat/mascot/ChatBotMascot";

export function ChatEmptyHero() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative h-28 w-28 overflow-hidden rounded-3xl bg-white/80 shadow-inner shadow-orange-100/60 ring-1 ring-orange-100/50">
        <ChatBotMascot variant="header" className="absolute inset-0" />
      </div>
      <p className="max-w-[16rem] text-center text-sm leading-relaxed text-stone-500">
        问我记账相关的问题，或点下方按钮，让{" "}
        <span className="font-medium text-orange-600">小布</span>{" "}
        帮你生成本月小结～
      </p>
    </div>
  );
}
