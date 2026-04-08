# 迭代变更文档（change）

本目录**每个迭代一份**独立 Markdown，记录该迭代的范围、设计与回顾。

## 命名建议

| 形式 | 示例 |
|------|------|
| 日期 + 主题 | `2026-04-02-sprint1.md` |
| 版本号 | `v1.2.0.md` |
| 迭代编号 | `iter-03.md` |

新文件可复制 [iteration-template.md](./iteration-template.md) 后改名填写。

## 迭代索引

| 迭代 | 日期 | 摘要 | 文档 |
|------|------|------|------|
| 文档对齐主分支 | 2026-04-02 | PRD/库表/API/缓存/部署/开发指南与多家庭、登录创建、轮询一致 | [2026-04-02-docs-sync.md](./2026-04-02-docs-sync.md) |
| 文档对齐：性能与统计分包 | 2026-04-08 | 缓存/revalidateTag、loading、StatsChartsGate、目录与 FAQ | [2026-04-08-docs-sync.md](./2026-04-08-docs-sync.md) |
| 文档对齐：小布 / Mistral | 2026-04-08 | FloatingChatBot、mistral-chat API、部署环境变量、架构与开发指南 | [2026-04-08-chatbot-docs-sync.md](./2026-04-08-chatbot-docs-sync.md) |
| 组件目录：公共与业务域分层 | 2026-04-08 | `common/` + `features/{household,record,stats,chat}/`，文档与导入路径对齐 | [2026-04-08-components-structure.md](./2026-04-08-components-structure.md) |
| 小布浮窗：移动端布局 | 2026-04-08 | 明确面板高度、safe-area、消息区滚动与滚到底时机 | [2026-04-08-chatbot-mobile-layout.md](./2026-04-08-chatbot-mobile-layout.md) |
| （在此登记） | | | |

## 相关文档

- 迭代说明与约定：[../iteration-design.md](../iteration-design.md)
- 需求总览：[../PRD.md](../PRD.md)
- 接口：[../api.md](../api.md)
