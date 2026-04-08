# 缓存设计文档

> 项目：家庭记账 · 更新日期：2026-04-08

## 1. 概述

本版本**未使用** Redis / Memcached 等外部缓存中间件；**未使用** Supabase Realtime 推送（多家庭 + 无 anon 策略下的替代方案）。

| 层级 | 机制 | 目标 |
|------|------|------|
| Next 数据缓存 | `unstable_cache` 包装 `fetchMembers` / `fetchTransactions`（按 `household_id` 分键），标签 **`ledger`**，`revalidate` 兜底（如 120s） | 减少 Tab 切换时重复打 Supabase |
| 同请求去重 | React **`cache()`** 包装 **`requireHouseholdId()`** | `Promise.all([fetchMembers, fetchTransactions])` 只查一次 `households` |
| 缓存失效 | **`revalidateTag("ledger", "max")`** + 既有 **`revalidatePath`** | 记账、改账、删账、登录写 Cookie、清除会话后数据立即刷新 |
| 根布局 | **不**再使用 `export const dynamic = "force-dynamic"` | 需动态的片段仍因 `cookies()` 等为动态；利于部分静态优化 |
| Next 路由缓存 | `revalidatePath`（与上配合） | 相关路由下次请求刷新 |
| 会话 | httpOnly Cookie `ledger_household_code` | 服务端识别当前家庭 |
| 前端持久化 | `localStorage` 同名 key | **仅存家庭编码**；不存流水明细 |
| 客户端列表状态 | React `useState` + 首屏 props（仪表盘删账后主动拉取） | 仪表盘列表与汇总 |
| 统计页 | RSC 拉数 → **`StatsChartsGate`** 客户端动态加载图表 | 与其它 Tab 分包隔离 Recharts |

**一致性**：以 PostgreSQL 为唯一事实源；写操作会 `revalidateTag`；他端更新在缓存窗口内可能短暂滞后，直至 TTL 或本端再次写入触发失效。

## 2. 无服务端 KV

- 未对查询结果做 SWR/React Query 持久化；若接入需补充 Key 与失效策略。

## 3. 与页面行为的对应关系

| 场景 | 行为 |
|------|------|
| 打开首页 / 统计 / 成员 | 首屏 RSC；读列表可走数据缓存；统计图表 JS 按需加载 |
| 路由切换 Loading | `app/loading.tsx`（通用）；进入 `/stats` 时额外有 `app/stats/loading.tsx` |
| 他端新增流水 | 在缓存未失效前可能仍为旧列表；刷新或等待 TTL；本端记账会 `revalidateTag` |
| 记账 / 改账 / 删账成功 | `revalidateTag("ledger")` + `revalidatePath`，下次导航为最新数据 |
| 登录 / 创建家 | 写 Cookie + `revalidatePath` + `revalidateTag` |
| 切换家庭 | 清 Cookie + 清 localStorage → `/login`；`clearHouseholdSession` 打 `revalidateTag` |

## 4. CDN / 静态资源

- 与动态 RSC 分离；业务数据以服务端渲染 + 缓存标签失效为主。

## 5. 后续可优化

| 方向 | 说明 |
|------|------|
| 分页 | 流水增大时减少单次拉取量 |
| 受控 Realtime | 在用户登录 + RLS 完善后，可按家庭订阅 |
| 创建接口限流 | 防刷家庭 |

## 6. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-04-02 | 改为 Cookie + localStorage 编码 + 轮询；移除 Realtime 描述 |
| 2026-04-02 | 移除首页/统计定时轮询，改为仅靠页面加载与导航刷新 |
| 2026-04-08 | 根布局去掉 `force-dynamic`；引入 `unstable_cache` + `revalidateTag("ledger")`、`requireHouseholdId` 的 React `cache()` |
| 2026-04-08 | 补充 `app/loading.tsx`、`stats/loading`、统计页 Recharts 动态分包说明 |
