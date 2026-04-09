# 接口与数据访问说明

> 本项目**无独立 REST Base URL**；数据访问由 **Next.js Server Actions** + Supabase **Service Role（服务端）** 完成。  
> 更新日期：2026-04-09

## 1. 设计说明

| 能力 | 实现方式 | 调用方 |
|------|----------|--------|
| 会话：加入家庭 | `setHouseholdSession(code)` | 登录页 |
| 会话：创建家庭并登录 | `createHouseholdAndLogin({ name, codeRaw })` | 登录页「创建新家」 |
| 会话：退出/切换 | `clearHouseholdSession()` | 成员页 |
| 读成员 / 读流水 | `fetchMembers`、`fetchTransactions`、`fetchMemberTransactionsPage`、`fetchLedgerSnapshotData` | Server / Client（依赖 Cookie）；分页接口与小布快照不走列表用的 `unstable_cache` |
| 写流水 | `createTransaction`、`updateTransaction`、`deleteTransaction` | Client |
| 小布对话 / 小结 | `mistralLedgerChatAction`（主对话：JSON 槽位 + 可自动记账）、`mistralChatAction`（纯文本，保留）、`generateMonthlySummaryAction`、`generateYearlySummaryAction` | Client（`FloatingChatBot`） |
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

均先 **`requireHouseholdId()`**：读 Cookie → 规范化 → 查 `households` 得 `id`，失败抛错。同一次 RSC 内用 React **`cache()`** 去重；**跨导航**对「规范化编码 → `household_id`」另经 **`unstable_cache`**（标签 **`ledger`**），与下列 `fetch*` 一并随 **`revalidateTag("ledger", "max")`** 失效。

### 3.1 `fetchMembers()` / `fetchTransactions()`

- 仅返回 **当前 Cookie 对应家庭** 的数据。  
- 服务端经 **`unstable_cache`** 缓存（缓存键含 `household_id`），标签 **`ledger`**；变更流水或会话时需配合 **`revalidateTag`** 失效。

### 3.1b `fetchMemberTransactionsPage(memberId, offset, limit)`

- 返回指定成员的流水分页（`occurred_at` 倒序）；先校验 `member_id` 属于当前家庭。  
- **不经** `unstable_cache`，供成员账单页与下拉/触底加载；`limit` 单次上限 50，内部多取 1 条用于判断 `hasMore`。

### 3.1c `fetchLedgerSnapshotData()`

- 并行 **`loadMembersForHousehold` + `loadTransactionsForHousehold`**（与 `fetchMembers` / `fetchTransactions` 同源查询），但**不经过** `unstable_cache`。  
- 供 **`mistralLedgerChatAction`**、**`buildMonthlyLedgerDigest`**、**`buildYearlyLedgerDigest`**（月年小结）使用，避免页面列表读缓存延迟或边界情况下小布读到旧账本。

### 3.2 `createTransaction(input)`

| 字段 | 类型 | 必填 |
|------|------|------|
| memberId | string | 是 |
| type | `'income' \| 'expense'` | 是 |
| category | string | 是 |
| amount | number | 是，> 0 |
| note | string | 否 |
| occurredAt | ISO 字符串 | 否 |

- 成功：**`revalidateTag("ledger", "max")`** + `revalidatePath`（`/`, `/record`, `/stats`, `/members` 及 `/members` **layout**）。

### 3.3 `updateTransaction(id, input)`

- 更新当前家庭下一条流水：`memberId`、`type`、`category`、`amount`、`note`、`occurredAt`（ISO）。  
- 成功：同 3.2 的失效策略。

### 3.4 `deleteTransaction(id)`

- 按 `id` + 当前 `household_id` 删除。  
- 成功：**`revalidateTag("ledger", "max")`** + `revalidatePath`（`/`, `/stats`, `/members` 及 `/members` **layout**）。

## 4. Server Actions — 小布助手

### 4.0 分层说明

- **对话模型调用**：`app/actions/mistral-chat.ts` 经 **`lib/llm/xiaobu-llm.ts`** 的 **`xiaobuChatCompletion`**，内部使用 **`lib/foundation/llm`** 的 **`getDefaultLlmClient()`**（默认 **`MistralThenOpenRouterLlmClient`**，兼容别名 **`MistralOpenRouterLlmClient`**）。行为与密钥约定不变：若配置了 **`MISTRAL_API_KEY`** 则先走 Mistral（`fetchUpstream`，见 **`lib/llm/mistral-fetch.ts`**）；失败且配置了 **`OPEN_ROUTER_API_KEY`** 时走 OpenRouter；**`XIAOBU_LLM_PROVIDER=openrouter`** 时仅 OpenRouter。详见 [**`lib/foundation/README.md`**](../lib/foundation/README.md)。**Client Component 不得 import `lib/foundation/llm`**。  
- **助手播报（客户端）**：**`NEXT_PUBLIC_TTS_PROVIDER`**（`web-speech` | `noop`，默认 `web-speech`），由 **`lib/foundation/tts/factory.client.ts`** 的 **`createTtsEngine`** 选择实现。  
- **语音输入 ASR（客户端）**：**`NEXT_PUBLIC_ASR_PROVIDER`**（`web-speech` | `noop`，默认 `web-speech`），由 **`lib/foundation/asr/factory.client.ts`** 的 **`createAsrEngine`** 选择实现；**`ChatVoiceInput`** 使用。  
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

### 4.2b `mistralLedgerChatAction(history, userMessage)`

| 参数 | 说明 |
|------|------|
| `history` | 同 4.2（不含当前句） |
| `userMessage` | 当前用户输入（trim 后） |

- **小布浮层主对话**使用本 Action。底层请求带 **`response_format: { type: "json_object" }`**（Mistral 与 OpenRouter 均尽量兼容），`temperature` 约 `0.2`。  
- 每轮 **`fetchLedgerSnapshotData()`**（**`ledger.ts`**，**绕过 `unstable_cache`**，避免与页面列表同源缓存导致「改账后小布仍念旧数」），用 **`computeMonthlyLedgerDigest`** 生成本月摘要，并**拼在当前 user 消息最上方**（`wrapUserMessageWithLedgerSnapshot`），要求模型统计类回答**只认该快照**；`temperature` 约 `0.2`。  
- 成功：`{ ok: true, reply: string, ledgerCreated?: boolean }`。`reply` 写入 UI 与 **`persistChatExchangeAction`**；**不**把模型原始 JSON 落库。  
- 模型输出契约与校验见 **`lib/llm/chat-ledger.ts`**（`ledgerChatResponseSchema`）：`ledger.intent` 为 `none`（闲聊）| `collect`（缺槽追问）| `ready`（可执行）。`ready` 时服务端 **`normalizeReadyLedger`** 校验 `member_id` 属于当前家庭、`amount` 等，通过后调用 **`createTransaction`**；分类不在白名单则归 **「其他」** 并把原描述并入 `note`。  
- 执行或校验失败时仍可能 `ok: true`，在 `reply` 末尾追加说明（避免 throw 导致整页 500）。解析/网络失败：`{ ok: false, error }`。

### 4.3 `generateMonthlySummaryAction()`

- 经 **`fetchLedgerSnapshotData`** 读取本月账本摘要（与统计「本月」一致的日期范围与成员拆分），调用模型生成「本月小结」文案。  
- 提示词内注入 **`buildMonthSummaryTimeContext`（同日历进度、上/中/下旬等）**，要求模型按「截至目前」写阶段性小结，避免在月初/月中使用「全月收官」式表述（详见 `app/actions/mistral-chat.ts`）。  
- 成功：`{ ok: true, data: 小结文本 }`。

### 4.3b `generateYearlySummaryAction()`

- 经 **`fetchLedgerSnapshotData`** 读取**本年**汇总（与统计「本年」一致：`getStatsDateRange("year")` + `occurred_at`），调用模型生成「本年小结」文案。  
- 提示词内注入 **`buildYearSummaryTimeContext`**（年初中末、是否 12 月 31 日等），正文篇幅建议约 400～720 字。  
- 成功：`{ ok: true, data: 小结文本 }`。

### 4.4 `buildMonthlyLedgerDigest()` / `buildYearlyLedgerDigest()` / `compute*LedgerDigest()`（供扩展）

- **`buildMonthlyLedgerDigest()`** / **`buildYearlyLedgerDigest()`**（`app/actions/mistral-chat.ts`，Server Action）：读库后返回当月 / 当年汇总纯文本。  
- **`computeMonthlyLedgerDigest(all, members, anchor?)`**、**`computeYearlyLedgerDigest(all, members, anchor?, categoryTop?)`**（**`lib/ledger/monthly-digest.ts`**）：纯函数；年度版分类行默认取前 **10** 项。**`mistralLedgerChatAction`** 每轮仅用月度摘要注入 user 消息顶部。放在 lib 而非 `"use server"` 文件，因 Next 要求 Server Actions 文件中的 **export 必须为 async**。

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
| LLM | Mistral（主）与 OpenRouter（备）仅服务端，经 `lib/llm/xiaobu-llm` 封装；客户端只收 `MistralTextResult` 文本结果 |

## 7. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-04-02 | 多家庭、`household.ts`、Cookie 会话、弃用 Realtime 描述 |
| 2026-04-02 | 首版 ledger 契约 |
| 2026-04-08 | `updateTransaction`；`fetch*` 与 `unstable_cache` / `revalidateTag("ledger")`；`requireHouseholdId` 与 React `cache()` |
| 2026-04-08 | `mistral-chat.ts`：`mistralChatAction`、`generateMonthlySummaryAction`、`MistralTextResult`、`buildMonthlyLedgerDigest` |
| 2026-04-08 | `chat-history.ts`：`fetchChatMessagesAction`、`persistChatExchangeAction`；迁移 `003_chat_messages` |
| 2026-04-08 | `mistralLedgerChatAction` + `lib/llm/chat-ledger.ts`（Zod）；浮层对话可结构化记账并 `createTransaction` |
| 2026-04-08 | `lib/llm/xiaobu-llm.ts`：Mistral 失败时回退 OpenRouter；环境变量见 deployment / `.env.example` |
| 2026-04-08 | 重组 `lib/`：`ledger/`、`household/`、`llm/`（见 development-guide 目录树） |
| 2026-04-09 | `mistralLedgerChatAction`：每轮注入 DB 本月快照；`computeMonthlyLedgerDigest`（`lib/ledger/monthly-digest.ts`）；`chat-ledger` 提示词强调历史数字不可信、无数据不编 |
| 2026-04-09 | `fetchLedgerSnapshotData`：小布读库绕过读缓存；快照改贴 user 消息顶部，降低模型采信历史气泡 |
| 2026-04-09 | `generateYearlySummaryAction`、`computeYearlyLedgerDigest`；浮层底栏「本月小结」旁「本年小结」；快捷文案见 `components/features/chat/summary-shortcuts.ts` |
| 2026-04-09 | **`lib/foundation`**：可插拔 **`LlmClient`**（`mistral-openrouter`）与 **`TtsEngine`**（`web-speech` / `noop`）；`xiaobu-llm` 改为薄封装 |
| 2026-04-09 | LLM 实现拆分为 **`mistral` / `openrouter` / `mistral-then-openrouter`**；**`MistralOpenRouterLlmClient`** 仍为链式类别名 |
| 2026-04-09 | **`lib/foundation/asr`**：`AsrEngine`、`createAsrEngine`；`ChatVoiceInput` 委托 foundation |
