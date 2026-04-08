"use client";

import { ChatBotMascot } from "@/components/features/chat/mascot/ChatBotMascot";

export function ChatPanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="relative shrink-0 overflow-hidden border-b border-orange-100/90 bg-gradient-to-r from-orange-50 via-white to-pink-50/90 px-4 py-3.5">
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-orange-200/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-pink-200/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/95 shadow-lg shadow-orange-200/40 ring-1 ring-orange-100/80">
            <ChatBotMascot variant="header" className="absolute inset-0" />
          </span>
          <div className="min-w-0">
            <h2
              id="chatbot-title"
              className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-base font-semibold text-transparent"
            >
              小布助手
            </h2>
            <p className="text-xs text-stone-500">记账问答 · 本月小结</p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-white/80 hover:text-stone-700"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </header>
  );
}
