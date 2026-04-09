"use client";

import { ChatBotMascot } from "@/components/features/chat/mascot/ChatBotMascot";
import type { ChatAssistantTtsSession } from "@/components/features/chat/useChatAssistantTts";

export type ChatPanelHeaderProps = {
  onClose: () => void;
  ttsSupported: boolean;
  ttsEnabled: boolean;
  onTtsEnabledChange: (enabled: boolean) => void;
  ttsSession: ChatAssistantTtsSession;
  onTtsPause: () => void;
  onTtsResume: () => void;
};

export function ChatPanelHeader({
  onClose,
  ttsSupported,
  ttsEnabled,
  onTtsEnabledChange,
  ttsSession,
  onTtsPause,
  onTtsResume,
}: ChatPanelHeaderProps) {
  const showTransport = ttsSession === "playing" || ttsSession === "paused";

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
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/95 shadow-lg shadow-orange-200/40 ring-1 ring-orange-100/80">
            <ChatBotMascot variant="header" className="absolute inset-0" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2
                id="chatbot-title"
                className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-base font-semibold text-transparent"
              >
                小布助手
              </h2>
              {ttsSupported && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ttsEnabled}
                    aria-label={ttsEnabled ? "关闭语音播报" : "开启语音播报"}
                    onClick={() => onTtsEnabledChange(!ttsEnabled)}
                    className={`inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-stone-200/80 px-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
                      ttsEnabled
                        ? "justify-end bg-orange-400/90 shadow-inner shadow-orange-600/20"
                        : "justify-start bg-stone-200/90"
                    }`}
                  >
                    <span
                      className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm"
                      aria-hidden
                    />
                  </button>
                  <span className="text-xs text-stone-500">播报</span>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-500">
              记账问答 · 本月与本年小结
            </p>
            {ttsSupported && ttsEnabled && showTransport && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {ttsSession === "playing" ? (
                  <button
                    type="button"
                    onClick={onTtsPause}
                    className="rounded-full border border-orange-200/90 bg-white/90 px-2.5 py-1 text-xs font-medium text-orange-800 shadow-sm transition hover:bg-orange-50"
                  >
                    暂停播报
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onTtsResume}
                    className="rounded-full border border-orange-200/90 bg-white/90 px-2.5 py-1 text-xs font-medium text-orange-800 shadow-sm transition hover:bg-orange-50"
                  >
                    继续播报
                  </button>
                )}
              </div>
            )}
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
