/**
 * 服务端：按环境选择 LLM 实现。勿在 Client Component 中 import 本文件。
 */

import type { LlmClient } from "@/lib/foundation/llm/types";
import { MistralThenOpenRouterLlmClient } from "@/lib/foundation/llm/implementations/mistral-then-openrouter";

/**
 * 构造新的 LLM 客户端实例（无单例；测试可注入自定义实现）。
 * 默认：Mistral 优先并回退 OpenRouter；后续可在此 switch 返回 `MistralLlmClient` / `OpenRouterLlmClient` 等。
 */
export function createLlmClient(): LlmClient {
  return new MistralThenOpenRouterLlmClient();
}

let defaultClient: LlmClient | null = null;

/** 进程内默认单例，供 xiaobu 薄封装使用 */
export function getDefaultLlmClient(): LlmClient {
  if (!defaultClient) {
    defaultClient = createLlmClient();
  }
  return defaultClient;
}
