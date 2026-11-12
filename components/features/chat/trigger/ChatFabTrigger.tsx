"use client";

import { ChatBotMascot } from "@/components/features/chat/mascot/ChatBotMascot";
import { DraggableFab } from "@/components/common/DraggableFab";

const OFFSET_STORAGE_KEY = "record-chatbot-offset-v1";

export function ChatFabTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <DraggableFab
      storageKey={OFFSET_STORAGE_KEY}
      aria-label="打开记账助手，可拖动位置"
      className="size-16 bg-transparent shadow-none"
      onPress={onOpen}
    >
      <ChatBotMascot
        variant="fab"
        className="pointer-events-none absolute inset-0 z-10"
      />
    </DraggableFab>
  );
}
