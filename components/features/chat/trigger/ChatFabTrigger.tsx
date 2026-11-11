"use client";

import { ChatBotMascot } from "@/components/features/chat/mascot/ChatBotMascot";
import { DraggableFab } from "@/components/common/DraggableFab";

const OFFSET_STORAGE_KEY = "record-chatbot-offset-v1";

export function ChatFabTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <DraggableFab
      storageKey={OFFSET_STORAGE_KEY}
      aria-label="打开记账助手，可拖动位置"
      className="size-16 rounded-full border border-[var(--line)] bg-accent text-paper shadow-[0_8px_24px_-8px_rgba(196,92,38,0.45)] transition-shadow hover:shadow-[0_10px_28px_-8px_rgba(196,92,38,0.55)]"
      onPress={onOpen}
    >
      <ChatBotMascot
        variant="fab"
        className="pointer-events-none absolute inset-0 z-10"
      />
    </DraggableFab>
  );
}
