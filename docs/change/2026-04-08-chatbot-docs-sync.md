# 2026-04-08 文档同步：小布助手 / Mistral

## 范围

对齐主分支已实现能力：**浮动对话入口**（`FloatingChatBot`、`DraggableFab` + react-draggable、`ChatBotMascot`）、**服务端 Mistral**（`mistral-chat.ts`、`mistral-fetch.ts`、`MistralTextResult`）、**Next `serverExternalPackages: ["undici"]`** 与相关环境变量。

## 文档更新清单

| 文档 | 变更要点 |
|------|----------|
| [development-guide.md](../development-guide.md) | 架构说明、目录树、`MobileShell`、Mistral 环境变量表、依赖与 FAQ |
| [architecture.md](../architecture.md) | 技术栈、Client 职责、`MobileShell`/`FloatingChatBot`、§7 小布与 Mistral、安全表、变更记录 |
| [api.md](../api.md) | §4 `mistral-chat` Actions 与 `MistralTextResult`；章节顺延 |
| [deployment.md](../deployment.md) | Mistral / 代理相关环境变量；更新日期 |
| [README.md](../README.md) | 能力摘要与 api 索引一行 |
| [change/README.md](./README.md) | 本迭代索引行 |

## 实现索引（交叉引用）

| 路径 | 说明 |
|------|------|
| `app/actions/mistral-chat.ts` | `mistralChatAction`、`generateMonthlySummaryAction`、`buildMonthlyLedgerDigest` |
| `lib/mistral-fetch.ts` | undici、`readEnv`、Proxy 缓存、`fetchUpstream` |
| `components/features/chat/FloatingChatBot.tsx` | 对话 UI、Portal |
| `components/common/DraggableFab.tsx` | react-draggable、偏移 localStorage |
| `components/features/chat/ChatBotMascot.tsx` | 吉祥物 SVG |
| `components/common/MobileShell.tsx` | 条件挂载 `FloatingChatBot` |
| `next.config.ts` | `serverExternalPackages: ["undici"]` |
