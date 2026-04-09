# 基础模块（`lib/foundation`）

可插拔的 **LLM 对话补全** 与 **TTS 语音合成** 能力，与业务（小布 Action、记账契约、UI）解耦。

## 分层

| 目录 | 职责 |
|------|------|
| `llm/types.ts` | `LlmClient`、`LlmMessage`、`LlmCompleteOptions` |
| `llm/factory.ts` | `createLlmClient()` / `getDefaultLlmClient()`（**仅服务端**引用） |
| `llm/implementations/*` | **`MistralLlmClient`**、**`OpenRouterLlmClient`**、**`MistralThenOpenRouterLlmClient`**（默认链）；**`mistral-openrouter.ts`** 为兼容再导出 |
| `tts/types.ts` | `TtsEngine`、`TtsSessionState` |
| `tts/factory.client.ts` | `createTtsEngine()`（**`"use client"`**，仅客户端） |
| `tts/text/*` | 与合成无关的纯函数（如去 Markdown） |
| `tts/implementations/*` | 如 Web Speech、`noop` |

## 服务端 / 客户端边界

- **`lib/foundation/llm/**`**：不得被 Client Component 直接或间接 import（避免密钥与 Node 逻辑进浏览器包）。业务侧可继续通过 [`lib/llm/xiaobu-llm.ts`](../llm/xiaobu-llm.ts) 的 `xiaobuChatCompletion` 调用，其内部委托 `getDefaultLlmClient()`。
- **`lib/foundation/tts/factory.client.ts`** 及其实现类：仅客户端使用；`NEXT_PUBLIC_TTS_PROVIDER` 选择实现（默认 `web-speech`，可选 `noop`）。

## 领域契约（不放在 foundation）

- 记账 JSON 契约、Zod、`buildLedgerChatSystemPrompt` 等仍在 [`lib/llm/chat-ledger.ts`](../llm/chat-ledger.ts)。
- Mistral 底层 HTTP/代理仍可在 [`lib/llm/mistral-fetch.ts`](../llm/mistral-fetch.ts)，由 LLM 实现引用。

## 新增实现

1. **LLM**：新建 `llm/implementations/your-client.ts` 实现 `LlmClient`；可选导出 `attemptXxxCompletion` 返回 `LlmAttemptResult` 供链式组合。在 [`llm/factory.ts`](llm/factory.ts) 的 `createLlmClient()` 中按环境变量分支返回（或组合现有 **`MistralLlmClient`** / **`OpenRouterLlmClient`**）。
2. **TTS**：新建 `tts/implementations/your-engine.ts` 实现 `TtsEngine`，在 [`tts/factory.client.ts`](tts/factory.client.ts) 中注册 `NEXT_PUBLIC_TTS_PROVIDER` 取值。
