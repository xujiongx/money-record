/**
 * Mistral 优先，失败或未配置密钥时在具备 OpenRouter 密钥时回退 OpenRouter。
 * `XIAOBU_LLM_PROVIDER=openrouter` 时仅走 OpenRouter。
 */

import type { LlmClient, LlmCompleteOptions, LlmMessage } from "@/lib/foundation/llm/types";
import { attemptMistralCompletion } from "@/lib/foundation/llm/implementations/mistral";
import { attemptOpenRouterCompletion } from "@/lib/foundation/llm/implementations/openrouter";
import { readEnv } from "@/lib/llm/mistral-fetch";

function isUseOpenRouterOnly(): boolean {
  return readEnv("XIAOBU_LLM_PROVIDER")?.toLowerCase() === "openrouter";
}

export class MistralThenOpenRouterLlmClient implements LlmClient {
  async complete(
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
  ): Promise<string> {
    const openRouterOnly = isUseOpenRouterOnly();
    const hasMistral = Boolean(readEnv("MISTRAL_API_KEY")) && !openRouterOnly;
    const hasOpenRouter = Boolean(readEnv("OPEN_ROUTER_API_KEY"));

    if (openRouterOnly && !hasOpenRouter) {
      throw new Error(
        "已设置 XIAOBU_LLM_PROVIDER=openrouter，但未配置 OPEN_ROUTER_API_KEY。",
      );
    }

    if (!hasMistral && !hasOpenRouter) {
      throw new Error(
        "对话服务未配置：请在环境变量中设置 MISTRAL_API_KEY 或 OPEN_ROUTER_API_KEY。",
      );
    }

    let mistralErr = "";

    if (hasMistral) {
      const m = await attemptMistralCompletion(messages, options);
      if (m.ok) return m.content;
      mistralErr = m.userMessage;
      if (hasOpenRouter) {
        const o = await attemptOpenRouterCompletion(messages, options);
        if (o.ok) return o.content;
        throw new Error(`${mistralErr}（已尝试备用通道：${o.userMessage}）`);
      }
      throw new Error(mistralErr);
    }

    const o = await attemptOpenRouterCompletion(messages, options);
    if (!o.ok) {
      throw new Error(o.userMessage || "备用对话通道不可用。");
    }
    return o.content;
  }
}
