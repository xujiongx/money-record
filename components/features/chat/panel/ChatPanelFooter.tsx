"use client";

import { useCallback, useState } from "react";
import {
  ChatVoiceInputProvider,
  ChatVoiceMicButton,
  ChatVoiceStatusLine,
} from "@/components/features/chat/panel/ChatVoiceInput";

type ChatPanelFooterProps = {
  error: string | null;
  /** 与 error 同时出现时展示「重试」按钮（如模型请求失败但用户消息已保留） */
  onRequestRetry?: (() => void) | null;
  pending: boolean;
  historyLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onMonthlyShortcut: () => void;
  onYearlyShortcut: () => void;
  onSend: () => void;
};

export function ChatPanelFooter({
  error,
  onRequestRetry,
  pending,
  historyLoading,
  input,
  onInputChange,
  onMonthlyShortcut,
  onYearlyShortcut,
  onSend,
}: ChatPanelFooterProps) {
  const busy = pending || historyLoading;
  const [voiceListening, setVoiceListening] = useState(false);

  const onListeningChange = useCallback((listening: boolean) => {
    setVoiceListening(listening);
  }, []);

  return (
    <>
      {error && (
        <div className="shrink-0 flex flex-col items-center gap-2 border-t border-red-100 bg-red-50/80 px-4 py-2">
          <p className="text-center text-xs text-red-600">{error}</p>
          {onRequestRetry && (
            <button
              type="button"
              disabled={busy}
              onClick={onRequestRetry}
              className="rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-45"
            >
              重试
            </button>
          )}
        </div>
      )}

      <ChatVoiceInputProvider
        disabled={busy}
        input={input}
        onTranscript={onInputChange}
        onListeningChange={onListeningChange}
      >
        <div className="shrink-0 border-t border-orange-100/80 bg-gradient-to-t from-orange-50/50 to-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              aria-label="帮我生成本月小结"
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-orange-200/90 bg-gradient-to-r from-orange-50 to-amber-50 px-2 py-2.5 text-xs font-medium text-orange-800 shadow-sm transition hover:border-orange-300 hover:from-orange-100/80 hover:to-amber-50 disabled:opacity-45 sm:text-sm"
              onClick={onMonthlyShortcut}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-orange-500"
                aria-hidden
              >
                <path
                  d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M12 11v6M9.5 14.5h5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="min-w-0 text-center leading-tight">本月小结</span>
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="帮我生成本年小结"
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-yellow-50/90 px-2 py-2.5 text-xs font-medium text-amber-900 shadow-sm transition hover:border-amber-300 hover:from-amber-100/70 hover:to-yellow-50 disabled:opacity-45 sm:text-sm"
              onClick={onYearlyShortcut}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-amber-600"
                aria-hidden
              >
                <path
                  d="M4 6h16M4 10h16M4 14h10M4 18h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy="7"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
              <span className="min-w-0 text-center leading-tight">本年小结</span>
            </button>
          </div>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={
                  voiceListening
                    ? "正在听…说完后点麦克风结束"
                    : "和小布说点什么…"
                }
                className="min-w-0 flex-1 rounded-2xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-inner shadow-stone-100 outline-none ring-orange-200/50 transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-2"
                disabled={busy || voiceListening}
                autoComplete="off"
              />
              <ChatVoiceMicButton />
              <button
                type="submit"
                disabled={busy || !input.trim() || voiceListening}
                className="shrink-0 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-300/40 transition hover:brightness-105 disabled:opacity-40"
              >
                发送
              </button>
            </div>
            <ChatVoiceStatusLine />
          </form>
        </div>
      </ChatVoiceInputProvider>
    </>
  );
}
