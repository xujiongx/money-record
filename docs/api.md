# 接口与数据访问说明

> 本项目**无独立 REST Base URL**；数据访问由 **Next.js Server Actions** + Supabase **Service Role（服务端）** 完成。  
> 更新日期：2026-04-08

## 1. 设计说明

| 能力 | 实现方式 | 调用方 |
|------|----------|--------|
| 会话：加入家庭 | `setHouseholdSession(code)` | 登录页 |
| 会话：创建家庭并登录 | `createHouseholdAndLogin({ name, codeRaw })` | 登录页「创建新家」 |
| 会话：退出/切换 | `clearHouseholdSession()` | 成员页 |
| 读成员 / 读流水 | `fetchMembers`、`fetchTransactions` | Server / Client（依赖 Cookie）；服务端经 `unstable_cache`（标签 `ledger`） |
| 写流水 | `createTransaction`、`updateTransaction`、`deleteTransaction` | Client |

**当前家庭**由 **httpOnly Cookie** `ledger_household_code`（6 位数字）标识；`ledger.ts` 内根据 Cookie 查询 `households.code` 得到 `household_id`，**不接受**客户端传入的 `household_id`，避免跨家庭伪造。

客户端另将编码写入 **localStorage**（`ledger_household_code`）用于在 Cookie 丢失时尝试恢复会话（调用 `setHouseholdSession`）。

**多端列表刷新**：不使用 Supabase Realtime；首页与统计 **不在客户端定时拉取**；数据来自 RSC 首屏，仪表盘在删账后调用 `fetchTransactions()` 更新本地列表。

### 1.1 为何不用开放 HTTP API

- Service Role 仅存服务端；家庭边界由 Cookie + 服务端校验编码保证。

### 1.2 与「传统接口文档」的对应关系

若需第三方对接，可新增 `app/api/*`；当前以本文件 **§2、§3** 为契约。

## 2. Server Actions — 会话（`app/actions/household.ts`）

### 2.1 `setHouseholdSession(raw: string)`

- 将输入规范为 6 位数字；在 `households` 中按 `code` 查询，存在则写入 Cookie 并 `revalidatePath`，且 **`revalidateTag("ledger", "max")`** 清空账本读缓存。
- 不存在则抛错（文案供 UI 展示）。

### 2.2 `createHouseholdAndLogin(input)`

| 字段 | 说明 |
|------|------|
| `name` | 家庭名称，trim 后 1～60 字 |
| `codeRaw` | 原始输入，规范后为 6 位数字 `code` |

- 若 `code` 已存在则抛错。  
- `insert households` 后 `insert members`：**布布**（`sort_order` 1）、**一二**（2）。成员插入失败则删除刚插入的家庭行。  
- 成功后写入与 `setHouseholdSession` 相同的 Cookie。

### 2.3 `clearHouseholdSession()`

- 删除 Cookie；`revalidatePath`；**`revalidateTag("ledger", "max")`**。客户端需同步 `localStorage.removeItem`。

## 3. Server Actions — 账本（`app/actions/ledger.ts`）

均先 **`requireHouseholdId()`**（实现上用 React **`cache()`** 包裹，同一次 RSC 请求内多次调用只执行一次）：读 Cookie → 规范化 → 查 `households` 得 `id`，失败抛错。

### 3.1 `fetchMembers()` / `fetchTransactions()`

- 仅返回 **当前 Cookie 对应家庭** 的数据。  
- 服务端经 **`unstable_cache`** 缓存（缓存键含 `household_id`），标签 **`ledger`**；变更流水或会话时需配合 **`revalidateTag`** 失效。

### 3.2 `createTransaction(input)`

| 字段 | 类型 | 必填 |
|------|------|------|
| memberId | string | 是 |
| type | `'income' \| 'expense'` | 是 |
| category | string | 是 |
| amount | number | 是，> 0 |
| note | string | 否 |
| occurredAt | ISO 字符串 | 否 |

- 成功：**`revalidateTag("ledger", "max")`** + `revalidatePath`（`/`, `/record`, `/stats`, `/members`）。

### 3.3 `updateTransaction(id, input)`

- 更新当前家庭下一条流水：`memberId`、`type`、`category`、`amount`、`note`、`occurredAt`（ISO）。  
- 成功：同 3.2 的失效策略。

### 3.4 `deleteTransaction(id)`

- 按 `id` + 当前 `household_id` 删除。  
- 成功：**`revalidateTag("ledger", "max")`** + `revalidatePath`（`/`, `/stats`, `/members`）。

## 4. 路由与中间件

- [`middleware.ts`](../middleware.ts)：访问 `/`、`/record`、`/stats`、`/members` 时，若 Cookie 中无合法 6 位编码，**302 → `/login`**。  
- `/login`：若已有合法 Cookie，服务端可 **redirect('/')**（见 `app/login/page.tsx`）。

## 5. 接口设计决策（备忘）

| 议题 | 结论 |
|------|------|
| 多家庭隔离 | `households.code` + Cookie + 服务端解析 |
| 浏览器直连 Supabase | 不使用（无 anon 业务读） |
| 实时推送 | 多租户下弃用 Realtime；靠导航与 `revalidatePath` / `revalidateTag("ledger")` 刷新 |

## 6. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-04-02 | 多家庭、`household.ts`、Cookie 会话、弃用 Realtime 描述 |
| 2026-04-02 | 首版 ledger 契约 |
| 2026-04-08 | `updateTransaction`；`fetch*` 与 `unstable_cache` / `revalidateTag("ledger")`；`requireHouseholdId` 与 React `cache()` |
