/**
 * 服务端：默认 LLM 客户端。勿在 Client Component 中 import 本文件。
 */

import type { LlmClient } from "@/lib/foundation/llm/types";
import { MistralThenOpenRouterLlmClient } from "@/lib/foundation/llm/implementations/mistral-then-openrouter";

let defaultClient: LlmClient | null = null;

/** 进程内默认单例：Mistral 优先，失败回退 OpenRouter */
export function getDefaultLlmClient(): LlmClient {
  if (!defaultClient) {
    defaultClient = new MistralThenOpenRouterLlmClient();
  }
  return defaultClient;
}
