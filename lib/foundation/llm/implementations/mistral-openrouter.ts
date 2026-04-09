/**
 * 向后兼容：默认链式客户端的类名别名。
 * 独立实现见 `mistral.ts`、`openrouter.ts`、`mistral-then-openrouter.ts`。
 */

export { MistralThenOpenRouterLlmClient as MistralOpenRouterLlmClient } from "@/lib/foundation/llm/implementations/mistral-then-openrouter";
export { MistralLlmClient } from "@/lib/foundation/llm/implementations/mistral";
export { OpenRouterLlmClient } from "@/lib/foundation/llm/implementations/openrouter";
export { attemptMistralCompletion } from "@/lib/foundation/llm/implementations/mistral";
export { attemptOpenRouterCompletion } from "@/lib/foundation/llm/implementations/openrouter";
