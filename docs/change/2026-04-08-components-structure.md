# 2026-04-08：组件目录按公共 / 业务域分层

## 范围

将原 `components/*.tsx` 平铺结构改为 **`components/common/`**（跨页面复用、壳层与轻量展示块）与 **`components/features/<域>/`**（家庭、记账、统计、小布对话）。

## 目录约定

| 路径 | 用途 |
|------|------|
| `components/common/` | `MobileShell`、`DraggableFab`、`MemberAvatar`、`StatsChartsSkeleton` |
| `components/features/household/` | `EnterHouseholdCode`、`SwitchHouseholdButton`、`SetupPrompt` |
| `components/features/record/` | `RecordForm`、`DashboardClient`、`SwipeTransactionRow`、`EditTransactionModal` |
| `components/features/stats/` | `StatsCharts`、`StatsChartsGate` |
| `components/features/chat/` | `FloatingChatBot`、`ChatBotMascot` |

## 导入

业务代码与组件之间统一使用 **`@/components/common/...`** 与 **`@/components/features/...`**，避免再从已删除的顶层 `components/Foo.tsx` 引用。

## 相关文档

- [development-guide.md](../development-guide.md) 第 3 节仓库结构
- [architecture.md](../architecture.md) 小布助手入口路径
