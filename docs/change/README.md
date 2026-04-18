# 迭代变更文档（change）

本目录**每个迭代一份**独立 Markdown，记录该迭代的范围、设计与回顾。**同一自然日建议合并为单文件** `YYYY-MM-DD.md`，日内用二级标题分主题。

## 命名建议

| 形式 | 示例 |
|------|------|
| **按日合并（推荐）** | `2026-04-08.md` |
| 日期 + 主题 | `2026-04-02-sprint1.md` |
| 版本号 | `v1.2.0.md` |
| 迭代编号 | `iter-03.md` |

新文件可复制 [iteration-template.md](./iteration-template.md) 后改名填写。

## 迭代索引

| 迭代 | 日期 | 摘要 | 文档 |
|------|------|------|------|
| 文档对齐主分支 | 2026-04-02 | PRD/库表/API/缓存/部署/开发指南与多家庭、登录创建、轮询一致 | [2026-04-02-docs-sync.md](./2026-04-02-docs-sync.md) |
| 2026-04-08 合并 | 2026-04-08 | 文档同步（性能缓存/小布 Mistral）、组件分层、浮窗布局、Markdown 渲染、**`chat_messages` 对话持久化** | [2026-04-08.md](./2026-04-08.md) |
| 账本读缓存与 RSC stale | 2026-04-18 | **`unstable_cache` / `staleTimes` 对齐 3600s**、首页 **「刷新数据」**、Tab **prefetch**；**`app-branding` / metadata / manifest / `icon.svg` / `AppLogo`** | [2026-04-18.md](./2026-04-18.md) |
| （在此登记） | | | |

## 相关文档

- 迭代说明与约定：[../iteration-design.md](../iteration-design.md)
- 需求总览：[../PRD.md](../PRD.md)
- 接口：[../api.md](../api.md)
