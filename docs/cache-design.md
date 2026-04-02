# 缓存设计文档

> 项目：家庭记账 · 更新日期：2026-04-02

## 1. 概述

本版本**未使用** Redis / Memcached 等外部缓存中间件；**未使用** Supabase Realtime 推送（多家庭 + 无 anon 策略下的替代方案）。

| 层级 | 机制 | 目标 |
|------|------|------|
| 服务端渲染 | `export const dynamic = "force-dynamic"` | 避免账本页静态化为过期快照 |
| Next 路由缓存 | `revalidatePath`（记账、删账、登录会话变更后） | 相关路由下次请求刷新 |
| 会话 | httpOnly Cookie `ledger_household_code` | 服务端识别当前家庭 |
| 前端持久化 | `localStorage` 同名 key | **仅存家庭编码**，用于恢复 Cookie；不存流水明细 |
| 客户端列表状态 | React `useState` + 首屏 props | 仪表盘 / 统计展示 |
| 准实时 | `setInterval` 调用 `fetchTransactions()` | 首页约 4s、统计约 5s |

**一致性**：以 PostgreSQL 为唯一事实源；轮询间隔内多设备可能存在短暂不一致。

## 2. 无服务端 KV

- 未对查询结果做 SWR/React Query 持久化；若接入需补充 Key 与失效策略。

## 3. 与页面行为的对应关系

| 场景 | 行为 |
|------|------|
| 打开首页 / 统计 | 首屏 RSC + Server Actions；客户端定时再拉 |
| 他端新增流水 | 依赖轮询在数秒内反映 |
| 记账成功 | `revalidatePath` + 跳转；轮询叠加 |
| 登录 / 创建家 | `setHouseholdSession` / `createHouseholdAndLogin` 写 Cookie + revalidate |
| 切换家庭 | 清 Cookie + 清 localStorage → `/login` |

## 4. CDN / 静态资源

- 与动态 RSC 分离；`force-dynamic` 下页面数据不走长期静态缓存。

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
