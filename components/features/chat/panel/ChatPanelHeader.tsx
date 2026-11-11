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
    <header className="relative shrink-0 border-b border-[var(--line)] bg-paper px-4 py-3.5">
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-background">
            <ChatBotMascot variant="header" className="absolute inset-0" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2
                id="chatbot-title"
                className="page-title text-base"
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
                    className={`inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-[var(--line)] px-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      ttsEnabled
                        ? "justify-end bg-accent"
                        : "justify-start bg-stone-200/90"
                    }`}
                  >
                    <span
                      className="pointer-events-none block h-4 w-4 rounded-full bg-paper shadow-sm"
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
                    className="rounded-lg border border-[var(--line)] bg-paper px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent-soft"
                  >
                    暂停播报
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onTtsResume}
                    className="rounded-lg border border-[var(--line)] bg-paper px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent-soft"
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
          className="shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-background hover:text-ink"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </header>
  );
}
