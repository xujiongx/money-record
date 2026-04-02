# 接口与数据访问说明

> 本项目**无独立 REST Base URL**；对外逻辑由 **Next.js Server Actions** 与 **Supabase 客户端（PostgREST + Realtime）** 组成。  
> 更新日期：2026-04-02

## 1. 设计说明

| 能力 | 实现方式 | 调用方 |
|------|----------|--------|
| 读成员 / 读流水（首屏） | Server Actions：`fetchMembers`、`fetchTransactions` | Server Components |
| 新增 / 删除流水 | Server Actions：`createTransaction`、`deleteTransaction` | Client Components（表单、按钮） |
| 实时感知流水变更 | Supabase Realtime：`postgres_changes` on `transactions` | Client（`DashboardClient`） |

### 1.1 为何不用开放 HTTP API

- 减少密钥暴露面：写入仅服务端持有 **Service Role**。
- 与 Next 缓存协作：`revalidatePath` 在写入后刷新相关路由。

### 1.2 与「传统接口文档」的对应关系

若需对接第三方系统，可后续增加 `app/api/*` Route Handlers，并在此文档补充路径、鉴权与错误码；当前版本以本文件 **§2 Server Actions** 为契约。

## 2. Server Actions（`app/actions/ledger.ts`）

以下函数均可在服务端或标记为 `"use client"` 的组件中 `await` 调用（Next 会序列化请求）。

### 2.1 `fetchMembers()`

- **返回**：`Promise<MemberRow[]>`，按 `sort_order` 升序。
- **数据范围**：`household_id = HOUSEHOLD_ID`（见 `lib/constants.ts`）。
- **错误**：Supabase 错误时 `throw new Error(message)`。

### 2.2 `fetchTransactions()`

- **返回**：`Promise<TransactionRow[]>`，按 `occurred_at` 降序；每条含嵌套 `members: { id, name }`。
- **错误**：同上。

### 2.3 `createTransaction(input)`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| memberId | string | 是 | `members.id` |
| type | `'income' \| 'expense'` | 是 | 收支类型 |
| category | string | 是 | 与前端分类常量一致 |
| amount | number | 是 | > 0 |
| note | string | 否 | trim 后入库，空则 `null` |
| occurredAt | string (ISO) | 否 | 默认当前时间 |

- **成功**：插入一行；并对 `/`、`/record`、`/stats`、`/members` 执行 `revalidatePath`。
- **错误**：金额无效或 DB 错误时抛错。

### 2.4 `deleteTransaction(id)`

- **行为**：按 `id` + `household_id` 删除，防止跨家庭误删。
- **成功**：`revalidatePath` 首页、统计、成员页。

## 3. Supabase 直连（仅说明，非业务对外 API）

### 3.1 匿名客户端（浏览器）

- 使用 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，受 **RLS** 限制，仅可对种子家庭相关行 **SELECT**。
- **Realtime**：订阅 `public.transactions`，`filter` 形如 `household_id=eq.<UUID>`（与 `HOUSEHOLD_ID` 一致）。

### 3.2 Service 客户端（服务端）

- 使用 `SUPABASE_SERVICE_ROLE_KEY`，**不得**出现在浏览器。
- 用于上述 Server Actions 内所有 `insert` / `delete` / `select`（开发上也可用于服务端查询）。

## 4. 接口设计决策（备忘）

| 议题 | 结论 | 理由 |
|------|------|------|
| 是否暴露 REST CRUD | 否 | MVP 家庭场景，Server Actions + RLS 足够 |
| 写入是否走浏览器 Supabase | 否 | 避免 anon 需放开写权限，降低泄露风险 |
| 多家庭扩展 | 预留 `household_id` + 环境变量 | 后续可接 Auth 与动态 household |

## 5. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-04-02 | 首版：与当前 `ledger.ts` 实现一致 |
