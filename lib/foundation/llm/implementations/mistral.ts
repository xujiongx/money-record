/**
 * Mistral Chat Completions（fetchUpstream）。仅服务端使用。
 */

import type { LlmClient, LlmCompleteOptions, LlmMessage } from "@/lib/foundation/llm/types";
import type { LlmAttemptResult } from "@/lib/foundation/llm/implementations/attempt-result";
import {
  fetchUpstream,
  formatMistralHttpErrorForUser,
  formatMistralNetworkErrorForUser,
  readEnv,
} from "@/lib/llm/mistral-fetch";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export async function attemptMistralCompletion(
  messages: LlmMessage[],
  options?: LlmCompleteOptions,
): Promise<LlmAttemptResult> {
  const key = readEnv("MISTRAL_API_KEY");
  if (!key) {
    return { ok: false, userMessage: "" };
  }

  const model = readEnv("MISTRAL_MODEL") ?? "mistral-small-latest";
  const temperature = options?.temperature ?? 0.6;
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: 2048,
    temperature,
  };
  if (options?.responseFormatJsonObject) {
    body.response_format = { type: "json_object" };
  }

  let res: Awaited<ReturnType<typeof fetchUpstream>>;
  try {
    res = await fetchUpstream(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      userMessage: formatMistralNetworkErrorForUser(err),
    };
  }

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      userMessage: formatMistralHttpErrorForUser(res.status, text),
    };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { ok: false, userMessage: "小布没有生成有效内容，请重试。" };
  }
  return { ok: true, content };
}

export class MistralLlmClient implements LlmClient {
  async complete(
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
  ): Promise<string> {
    const r = await attemptMistralCompletion(messages, options);
    if (r.ok) return r.content;
    if (!r.userMessage) {
      throw new Error("未配置 MISTRAL_API_KEY。");
    }
    throw new Error(r.userMessage);
  }
}
