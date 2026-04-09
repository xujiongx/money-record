"use client";

import type { RefObject } from "react";
import { createPortal } from "react-dom";
import type { ChatUiMessage } from "@/components/features/chat/types";
import { ChatMessageList } from "@/components/features/chat/panel/ChatMessageList";
import { ChatPanelFooter } from "@/components/features/chat/panel/ChatPanelFooter";
import {
  ChatPanelHeader,
  type ChatPanelHeaderProps,
} from "@/components/features/chat/panel/ChatPanelHeader";

export type FloatingChatPanelProps = {
  open: boolean;
  onDismiss: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  historyLoading: boolean;
  messages: ChatUiMessage[];
  pending: boolean;
  error: string | null;
  onRequestRetry?: (() => void) | null;
  input: string;
  onInputChange: (value: string) => void;
  onMonthlyShortcut: () => void;
  onYearlyShortcut: () => void;
  onSend: () => void;
} & Pick<
  ChatPanelHeaderProps,
  | "ttsSupported"
  | "ttsEnabled"
  | "onTtsEnabledChange"
  | "ttsSession"
  | "onTtsPause"
  | "onTtsResume"
>;

export function FloatingChatPanel({
  open,
  onDismiss,
  listRef,
  historyLoading,
  messages,
  pending,
  error,
  onRequestRetry,
  input,
  onInputChange,
  onMonthlyShortcut,
  onYearlyShortcut,
  onSend,
  ttsSupported,
  ttsEnabled,
  onTtsEnabledChange,
  ttsSession,
  onTtsPause,
  onTtsResume,
}: FloatingChatPanelProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex h-full min-h-0 items-end justify-center bg-stone-900/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md sm:items-center sm:pb-4 sm:pt-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chatbot-title"
      onClick={onDismiss}
    >
      <div
        className="flex max-h-full w-full max-w-md min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-b from-white via-orange-50/35 to-white shadow-[0_25px_80px_-20px_rgba(249,115,22,0.35),0_0_1px_rgba(0,0,0,0.06)] h-[min(86svh,640px)] sm:h-[min(86dvh,640px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <ChatPanelHeader
          onClose={onDismiss}
          ttsSupported={ttsSupported}
          ttsEnabled={ttsEnabled}
          onTtsEnabledChange={onTtsEnabledChange}
          ttsSession={ttsSession}
          onTtsPause={onTtsPause}
          onTtsResume={onTtsResume}
        />
        <ChatMessageList
          listRef={listRef}
          historyLoading={historyLoading}
          messages={messages}
          pending={pending}
        />
        <ChatPanelFooter
          error={error}
          onRequestRetry={onRequestRetry}
          pending={pending}
          historyLoading={historyLoading}
          input={input}
          onInputChange={onInputChange}
          onMonthlyShortcut={onMonthlyShortcut}
          onYearlyShortcut={onYearlyShortcut}
          onSend={onSend}
        />
      </div>
    </div>,
    document.body,
  );
}
