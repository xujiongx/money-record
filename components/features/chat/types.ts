export type ChatUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function newChatMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
