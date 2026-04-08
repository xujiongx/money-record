"use client";

import { ChatBotMascot } from "@/components/features/chat/mascot/ChatBotMascot";
import { DraggableFab } from "@/components/common/DraggableFab";

const OFFSET_STORAGE_KEY = "record-chatbot-offset-v1";

export function ChatFabTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <DraggableFab
      storageKey={OFFSET_STORAGE_KEY}
      aria-label="打开记账助手，可拖动位置"
      className="size-16 rounded-full border border-white/60 bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-white shadow-[0_12px_40px_-8px_rgba(249,115,22,0.55),0_0_0_1px_rgba(255,255,255,0.25)_inset] ring-2 ring-white/40 backdrop-blur-sm transition-shadow hover:shadow-[0_14px_44px_-6px_rgba(244,63,94,0.45)] hover:ring-white/55"
      onPress={onOpen}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_55%)]"
        aria-hidden
      />
      <ChatBotMascot
        variant="fab"
        className="pointer-events-none absolute inset-0 z-10 drop-shadow-md"
      />
    </DraggableFab>
  );
}
