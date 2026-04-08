/**
 * 小布底层对话：优先 Mistral，失败或未配置时回退 OpenRouter（如 DeepSeek 免费模型）。
 * 仅服务端使用；密钥通过 readEnv 读取，勿下发浏览器。
 */

import OpenAI from "openai";
import {
  fetchUpstream,
  formatMistralHttpErrorForUser,
  formatMistralNetworkErrorForUser,
  readEnv,
} from "@/lib/mistral-fetch";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export type XiaobuChatRole = "system" | "user" | "assistant";

export type XiaobuChatMessage = {
  role: XiaobuChatRole;
  content: string;
};

export type XiaobuChatOptions = {
  temperature?: number;
  /** 与 Mistral / OpenAI 兼容的 JSON 输出模式 */
  responseFormatJsonObject?: boolean;
};

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OPENROUTER_DEFAULT_MODEL = "deepseek/deepseek-chat:free";

type TryResult =
  | { ok: true; content: string }
  | { ok: false; userMessage: string };

async function tryMistralCompletion(
  messages: XiaobuChatMessage[],
  options?: XiaobuChatOptions,
): Promise<TryResult> {
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

function getOpenRouterClient(): OpenAI | null {
  const apiKey = readEnv("OPEN_ROUTER_API_KEY");
  if (!apiKey) return null;
  const referer = readEnv("OPEN_ROUTER_HTTP_REFERER");
  const title = readEnv("OPEN_ROUTER_APP_TITLE") ?? "家庭记账小布";
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      ...(referer ? { "HTTP-Referer": referer } : {}),
      "X-Title": title,
    },
  });
}

async function tryOpenRouterCompletion(
  messages: XiaobuChatMessage[],
  options?: XiaobuChatOptions,
): Promise<TryResult> {
  const client = getOpenRouterClient();
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
      return { ok: false, userMessage: "备用模型未返回有效内容，请重试。" };
    }
    return { ok: true, content };
  } catch (e) {
    return { ok: false, userMessage: formatOpenRouterError(e) };
  }
}

/**
 * 统一入口：有 Mistral 密钥则先请求 Mistral；失败或未配置密钥时，若存在 OPEN_ROUTER_API_KEY 则走 OpenRouter。
 */
export async function xiaobuChatCompletion(
  messages: XiaobuChatMessage[],
  options?: XiaobuChatOptions,
): Promise<string> {
  const hasMistral = Boolean(readEnv("MISTRAL_API_KEY"));
  const hasOpenRouter = Boolean(readEnv("OPEN_ROUTER_API_KEY"));

  if (!hasMistral && !hasOpenRouter) {
    throw new Error(
      "对话服务未配置：请在环境变量中设置 MISTRAL_API_KEY 或 OPEN_ROUTER_API_KEY。",
    );
  }

  let mistralErr = "";

  if (hasMistral) {
    const m = await tryMistralCompletion(messages, options);
    if (m.ok) return m.content;
    mistralErr = m.userMessage;
    if (hasOpenRouter) {
      const o = await tryOpenRouterCompletion(messages, options);
      if (o.ok) return o.content;
      throw new Error(`${mistralErr}（已尝试备用通道：${o.userMessage}）`);
    }
    throw new Error(mistralErr);
  }

  const o = await tryOpenRouterCompletion(messages, options);
  if (!o.ok) {
    throw new Error(o.userMessage || "备用对话通道不可用。");
  }
  return o.content;
}
