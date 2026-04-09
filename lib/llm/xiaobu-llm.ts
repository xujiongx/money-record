/**
 * 小布对话出站入口（兼容层）：委托 `lib/foundation/llm` 默认客户端。
 * 仅服务端使用；业务代码可继续 import 本文件的 `xiaobuChatCompletion` 与类型别名。
 */

import { getDefaultLlmClient } from "@/lib/foundation/llm/factory";
import type {
  LlmCompleteOptions,
  LlmMessage,
} from "@/lib/foundation/llm/types";

export type XiaobuChatRole = LlmMessage["role"];
export type XiaobuChatMessage = LlmMessage;
export type XiaobuChatOptions = LlmCompleteOptions;

/**
 * 统一入口：默认有 Mistral 密钥则先请求 Mistral；失败或未配置密钥时，若存在 OPEN_ROUTER_API_KEY 则走 OpenRouter。
 * 设置 `XIAOBU_LLM_PROVIDER=openrouter` 时忽略 Mistral，仅走 OpenRouter（须配置 OPEN_ROUTER_API_KEY）。
 */
export async function xiaobuChatCompletion(
  messages: XiaobuChatMessage[],
  options?: XiaobuChatOptions,
): Promise<string> {
  return getDefaultLlmClient().complete(messages, options);
}
