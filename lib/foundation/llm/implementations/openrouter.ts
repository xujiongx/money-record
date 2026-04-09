/**
 * OpenRouter（OpenAI 兼容 SDK）。仅服务端使用。
 */

import OpenAI from "openai";
import type { LlmClient, LlmCompleteOptions, LlmMessage } from "@/lib/foundation/llm/types";
import type { LlmAttemptResult } from "@/lib/foundation/llm/implementations/attempt-result";
import { readEnv } from "@/lib/llm/mistral-fetch";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OPENROUTER_DEFAULT_MODEL = "openrouter/free";
const OPENROUTER_DEFAULT_X_TITLE = "record-xiaobu";

function isHeaderByteStringSafe(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 255) return false;
  }
  return true;
}

function pickOpenRouterOptionalHeader(
  name: string,
  raw: string | undefined,
): string | undefined {
  if (raw === undefined) return undefined;
  const t = raw.trim();
  if (!t || !isHeaderByteStringSafe(t)) {
    if (t && !isHeaderByteStringSafe(t) && process.env.NODE_ENV === "development") {
      console.warn(
        `[xiaobu-openrouter] skip header ${name}: use ASCII/Latin-1 only (HTTP ByteString; CJK not allowed).`,
      );
    }
    return undefined;
  }
  return t;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function logOpenRouterFailure(
  e: unknown,
  ctx: { model: string; responseFormatJsonObject?: boolean },
): void {
  const base = {
    tag: "xiaobu-openrouter",
    model: ctx.model,
    responseFormatJsonObject: ctx.responseFormatJsonObject ?? false,
  };

  if (e instanceof OpenAI.APIError) {
    console.error("[xiaobu-openrouter] APIError", {
      ...base,
      status: e.status,
      message: e.message,
      code: e.code,
      type: e.type,
      param: e.param,
      requestID: e.requestID,
      errorBody: e.error,
    });
    return;
  }

  if (e instanceof Error) {
    const cause =
      e.cause instanceof Error
        ? { name: e.cause.name, message: e.cause.message }
        : e.cause;
    console.error("[xiaobu-openrouter] Error", {
      ...base,
      name: e.name,
      message: e.message,
      cause: cause ?? undefined,
      stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
    });
    return;
  }

  console.error("[xiaobu-openrouter] unknown", { ...base, raw: safeJsonStringify(e) });
}

function formatOpenRouterError(e: unknown): string {
  if (e instanceof OpenAI.APIError) {
    const s = e.status;
    if (s === 429) {
      return "备用对话通道较忙，请稍后再试或点击「重试」。";
    }
    if (s === 401 || s === 403) {
      return "备用通道密钥无效或无权访问，请检查 OPEN_ROUTER_API_KEY。";
    }
    if (s === 400) {
      return "备用通道无法处理本次请求，请换一句话或稍后再试。";
    }
    if (s === 503 || s === 502 || s === 504 || (s !== undefined && s >= 500)) {
      return "备用智能服务暂时不可用，请稍后再试。";
    }
    return "备用对话通道请求失败，请稍后再试。";
  }
  if (e instanceof Error) {
    return e.message.includes("timeout") || e.message.includes("Timeout")
      ? "备用通道连接超时，请重试。"
      : "备用对话通道异常，请稍后再试。";
  }
  return "备用对话通道异常，请稍后再试。";
}

function getOpenRouterSdkClient(): OpenAI | null {
  const apiKey = readEnv("OPEN_ROUTER_API_KEY");
  if (!apiKey) return null;
  const referer = pickOpenRouterOptionalHeader(
    "HTTP-Referer",
    readEnv("OPEN_ROUTER_HTTP_REFERER"),
  );
  const titleEnv = readEnv("OPEN_ROUTER_APP_TITLE");
  const title =
    pickOpenRouterOptionalHeader("X-Title", titleEnv) ??
    OPENROUTER_DEFAULT_X_TITLE;
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      ...(referer ? { "HTTP-Referer": referer } : {}),
      "X-Title": title,
    },
  });
}

export async function attemptOpenRouterCompletion(
  messages: LlmMessage[],
  options?: LlmCompleteOptions,
): Promise<LlmAttemptResult> {
  const client = getOpenRouterSdkClient();
  if (!client) {
    return { ok: false, userMessage: "" };
  }

  const model =
    readEnv("OPEN_ROUTER_MODEL")?.trim() || OPENROUTER_DEFAULT_MODEL;
  const temperature = options?.temperature ?? 0.6;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 2048,
      temperature,
      ...(options?.responseFormatJsonObject
        ? { response_format: { type: "json_object" as const } }
        : {}),
    });
    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      console.error("[xiaobu-openrouter] empty assistant content", {
        tag: "xiaobu-openrouter",
        model,
        choices: safeJsonStringify(completion.choices),
        id: completion.id,
        finishReason: completion.choices[0]?.finish_reason,
      });
      return { ok: false, userMessage: "备用模型未返回有效内容，请重试。" };
    }
    return { ok: true, content };
  } catch (e) {
    logOpenRouterFailure(e, {
      model,
      responseFormatJsonObject: options?.responseFormatJsonObject,
    });
    return { ok: false, userMessage: formatOpenRouterError(e) };
  }
}

export class OpenRouterLlmClient implements LlmClient {
  async complete(
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
  ): Promise<string> {
    const r = await attemptOpenRouterCompletion(messages, options);
    if (r.ok) return r.content;
    if (!r.userMessage) {
      throw new Error("未配置 OPEN_ROUTER_API_KEY。");
    }
    throw new Error(r.userMessage);
  }
}
