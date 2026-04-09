/** 单次通道尝试结果（供链式客户端组合，不对外作 LlmClient 契约） */
export type LlmAttemptResult =
  | { ok: true; content: string }
  | { ok: false; userMessage: string };
