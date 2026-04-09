/** 基础模块 LLM：与 OpenAI/Mistral 兼容的对话消息（仅服务端使用） */

export type LlmChatRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmChatRole;
  content: string;
};

export type LlmCompleteOptions = {
  temperature?: number;
  /** 与 Mistral / OpenAI 兼容的 JSON 输出模式 */
  responseFormatJsonObject?: boolean;
};

/** 可插拔的对话补全客户端 */
export type LlmClient = {
  complete(
    messages: LlmMessage[],
    options?: LlmCompleteOptions,
  ): Promise<string>;
};
