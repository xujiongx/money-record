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
| 小布对话 / 本月小结 | `mistralChatAction`、`generateMonthlySummaryAction` 等 | Client（`FloatingChatBot`） |
| 小布历史 | `fetchChatMessagesAction`、`persistChatExchangeAction` | Client（打开浮层拉取、每轮成功后落库） |

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

## 4. Server Actions — 小布助手

### 4.0 分层说明

- **对话模型调用**：`app/actions/mistral-chat.ts` — 仅只读账本拼提示词，**不直接写** `chat_messages`；需 **`MISTRAL_API_KEY`**，HTTP 见 **`lib/mistral-fetch.ts`**。  
- **对话持久化**：`app/actions/chat-history.ts` — 读 Cookie 得 `household_id`，读写表 **`chat_messages`**（Service Role）。客户端在模型成功返回后调用 **`persistChatExchangeAction`**；打开浮层时 **`fetchChatMessagesAction`** 回填。

### 4.1 返回类型 `MistralTextResult`

```ts
type MistralTextResult =
  | { ok: true; data: string }
  | { ok: false; error: string };
```

- 网络 / API / 校验失败时返回 **`{ ok: false, error }`**，**不在 Action 边界 `throw`**，以免客户端收到整页 **500**（RSC POST）。

### 4.2 `mistralChatAction(history, userMessage)`

| 参数 | 说明 |
|------|------|
| `history` | 已完成的 `{ role: 'user' \| 'assistant', content }[]`（不含当前句） |
| `userMessage` | 当前用户输入（trim 后） |

- 成功：`{ ok: true, data: 助手回复文本 }`。

### 4.3 `generateMonthlySummaryAction()`

- 读取本月账本摘要（与统计「本月」一致的日期范围与成员拆分），调用模型生成「本月小结」文案。  
- 提示词内注入 **`buildMonthSummaryTimeContext`（同日历进度、上/中/下旬等）**，要求模型按「截至目前」写阶段性小结，避免在月初/月中使用「全月收官」式表述（详见 `app/actions/mistral-chat.ts`）。  
- 成功：`{ ok: true, data: 小结文本 }`。

### 4.4 `buildMonthlyLedgerDigest()`（导出，供扩展）

- 返回当月汇总纯文本（总额、分类、各成员收支笔数等），供小结提示词使用。

### 4.5 `fetchChatMessagesAction()`（`app/actions/chat-history.ts`）

- 返回当前家庭最近最多 300 条 **`chat_messages`**，按时间升序。  
- 成功：`{ ok: true, data: { id, role, content }[] }`；失败：`{ ok: false, error }`（与 Mistral 一致，不 throw）。

### 4.6 `persistChatExchangeAction(userContent, assistantContent)`

- 依次插入一条 `role=user`、一条 `role=assistant`（同一轮对话）。  
- 成功：`{ ok: true }`；失败：`{ ok: false, error }`。

## 5. 路由与中间件

- [`middleware.ts`](../middleware.ts)：访问 `/`、`/record`、`/stats`、`/members` 时，若 Cookie 中无合法 6 位编码，**302 → `/login`**。  
- `/login`：若已有合法 Cookie，服务端可 **redirect('/')**（见 `app/login/page.tsx`）。

## 6. 接口设计决策（备忘）

| 议题 | 结论 |
|------|------|
| 多家庭隔离 | `households.code` + Cookie + 服务端解析 |
| 浏览器直连 Supabase | 不使用（无 anon 业务读） |
| 实时推送 | 多租户下弃用 Realtime；靠导航与 `revalidatePath` / `revalidateTag("ledger")` 刷新 |
| LLM | Mistral 仅服务端；客户端只收 `MistralTextResult` 文本结果 |

## 7. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-04-02 | 多家庭、`household.ts`、Cookie 会话、弃用 Realtime 描述 |
| 2026-04-02 | 首版 ledger 契约 |
| 2026-04-08 | `updateTransaction`；`fetch*` 与 `unstable_cache` / `revalidateTag("ledger")`；`requireHouseholdId` 与 React `cache()` |
| 2026-04-08 | `mistral-chat.ts`：`mistralChatAction`、`generateMonthlySummaryAction`、`MistralTextResult`、`buildMonthlyLedgerDigest` |
| 2026-04-08 | `chat-history.ts`：`fetchChatMessagesAction`、`persistChatExchangeAction`；迁移 `003_chat_messages` |
