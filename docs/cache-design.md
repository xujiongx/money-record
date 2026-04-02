# 缓存设计文档

> 项目：家庭记账 · 更新日期：2026-04-02

## 1. 概述

本版本**未使用** Redis / Memcached 等外部缓存中间件。

| 层级 | 机制 | 目标 |
|------|------|------|
| 服务端渲染 | `export const dynamic = "force-dynamic"` | 避免账本页被静态化为过期快照 |
| Next 路由缓存 | `revalidatePath`（写入/删除流水后） | 使相关页面下一次请求拿到新数据 |
| 客户端状态 | React `useState` + 首屏 props | 仪表盘列表在内存中展示 |
| 实时同步 | Supabase **Realtime**（`transactions` 表） | 多设备/多标签页尽快看到他人新记账 |

**一致性**：以数据库为唯一事实源；客户端在收到 Realtime 事件后再次调用 `fetchTransactions` 与本地 state 对齐（非强一致事务，存在极短延迟属预期）。

## 2. 无服务端 KV / 浏览器持久化

- 未使用 `localStorage` 存账本数据（避免与云端双源冲突）。
- 未对 Supabase 查询结果做 SWR/React Query 持久化；若后续接入，需在此文档补充 **Key 规范** 与 **失效策略**。

## 3. 与页面行为的对应关系

| 场景 | 行为 |
|------|------|
| 打开首页 | Server Action 拉全量流水（当前数据量小，可接受） |
| 他端新增流水 | Realtime 触发 → 客户端 `fetchTransactions` 刷新 |
| 本机记账成功 | `createTransaction` → `revalidatePath` + 跳转首页；Realtime 亦可触发刷新 |
| 删除流水 | `deleteTransaction` + `revalidatePath`；Realtime 同步其他端 |

## 4. CDN / 静态资源

- Next 默认对静态资源（JS/CSS）走构建产物缓存；与账本数据无关。
- 若部署在 Vercel，地理边缘缓存仅作用于前端静态文件，**不缓存**动态 RSC 数据流（在 `force-dynamic` 下）。

## 5. 后续可优化（非当前范围）

| 方向 | 说明 |
|------|------|
| 分页 + 游标 | 流水极大时减少单次 `fetchTransactions` 体量 |
| 只读查询缓存 | 在服务端对聚合结果短时缓存（需注意失效与多实例） |
| Edge + KV | 若引入全球边缘读副本，需单独设计一致性 |

## 6. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-04-02 | 明确当前无 Redis；以 Realtime + revalidate 为主 |
