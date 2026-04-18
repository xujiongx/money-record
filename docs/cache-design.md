# 缓存设计文档

> 项目：家庭记账 · 更新日期：2026-04-18

## 1. 概述

本版本**未使用** Redis / Memcached 等外部缓存中间件；**未使用** Supabase Realtime 推送（多家庭 + 无 anon 策略下的替代方案）。

| 层级 | 机制 | 目标 |
|------|------|------|
| Next 数据缓存 | `unstable_cache` 包装 **编码 → `household_id`**、`fetchMembers` / `fetchTransactions`（按编码或 `household_id` 分键），标签 **`ledger`**，`revalidate` 兜底（当前 **3600s**，即 1h） | 与客户端 `staleTimes` 同量级，减少读库 |
| 同请求去重 | React **`cache()`** 包装 **`requireHouseholdId()`** | 同一次 RSC 内多次 `fetch*` 只解析一次 Cookie |
| 客户端预取 | 底部 **`Link prefetch`**（完整预取动态页）+ **`usePrefetchAppTabs`**：挂载时立即 **`router.prefetch`** 四 Tab，空闲再补一轮 | 硬刷新后尽快填满客户端 RSC 缓存，配合 **`staleTimes.dynamic`** 在约 1h 内少重复请求 |
| 客户端路由复用 | **`next.config` → `experimental.staleTimes.dynamic`**（**3600s**） | 同一会话内 Tab 切换少打 Flight |
| 手动刷新 | 首页 **`refreshLedgerReadCache`**（`ledger.ts`）→ `revalidateTag("ledger")` + `revalidatePath`，再由 **`router.refresh()`** | 用户点「刷新数据」时立即清读缓存并重查库渲染 |
| 缓存失效 | **`revalidateTag("ledger", "max")`** + 既有 **`revalidatePath`** | 记账、改账、删账、登录写 Cookie、清除会话后数据立即刷新 |
| 根布局 | **不**再使用 `export const dynamic = "force-dynamic"` | 需动态的片段仍因 `cookies()` 等为动态；利于部分静态优化 |
| Next 路由缓存 | `revalidatePath`（与上配合） | 相关路由下次请求刷新 |
| 会话 | httpOnly Cookie `ledger_household_code` | 服务端识别当前家庭 |
| 前端持久化 | `localStorage` 同名 key | **仅存家庭编码**；不存流水明细 |
| 客户端列表状态 | React `useState` + 首屏 props（仪表盘删账后主动拉取） | 仪表盘列表与汇总 |
| 统计页 | RSC 拉数 → **`StatsChartsGate`** 客户端动态加载图表 | 与其它 Tab 分包隔离 Recharts |

**一致性**：以 PostgreSQL 为唯一事实源；写操作会 `revalidateTag`。他端更新在 **约 1h** 读缓存窗口内可能滞后，直至 TTL 或用户在首页点 **「刷新数据」** / 本端写入触发失效。

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

## 4. CDN / 静态资源（图片、字体、JS/CSS 分包）

与动态 RSC 分离；业务数据以服务端渲染 + 缓存标签失效为主。

### 4.1 为什么「感觉没有缓存」

| 情况 | 说明 |
|------|------|
| **`next dev` 开发模式** | 为热更新（HMR），对 **`/_next/*`** 等往往下发 **`Cache-Control: no-store`** 或极短缓存，**浏览器几乎每次都会重新请求**。这是预期行为，**不代表生产环境也不缓存**。 |
| **生产 `next build` + `next start`（或 Vercel）** | **`/_next/static/*`** 下的 JS/CSS 等文件名带 **内容哈希**，通常带 **`immutable` + 长 `max-age`**，浏览器可长期缓存；换版本后文件名变，自然换资源。 |
| **`public/` 根路径文件**（如 `/vercel.svg`、成员默认头像 `/bubu.png`） | 由 Next 静态提供，**无哈希**；生产上是否长缓存取决于部署环境与是否自定义 `headers`。若需「改文件不换名仍立刻生效」，不宜配 **`immutable`**。 |
| **`next/image` 的远程图**（如成员 `avatar_url` 指向 Supabase Storage） | **缓存头由图片所在域名（CDN/存储）返回**，Next 只负责优化/转发，**不在本仓库 `next.config` 里统一控制**。 |
| **本地 `public/` 头像 + `next/image` 默认** | 会走 **`/_next/image?url=...`**；**`next dev`** 上该接口常为 **no-store**，体感「每次进页都重新加载」。**`MemberAvatar`** 对非 `http(s)` 的 `src` 使用 **`unoptimized`**，直接请求 **`/bubu.png`** 等静态路径，便于浏览器缓存；远程 URL 仍走优化管线。 |
| **304 仍闪灰（多出现在移动 WebKit）** | 缓存命中也会做 **304 校验**；路由切换时组件 **重挂载**，手机端常 **丢弃已解码位图** 再解码，解码前一帧 **`img` 区域无像素**，易透出默认灰底。**`MemberAvatar`** 用与壳层一致的 **`bg-[#fff7f5]`**、小本地图 **`decoding="sync"`**、**`translateZ(0)`** 合成层以减轻；远程图仍 **`async`** 解码。 |
| **开发者工具** | Chrome「Network」里勾选 **Disable cache** 时，**所有资源**都会绕过缓存，容易误判。 |

### 4.2 与业务数据缓存的区别

静态资源缓存解决的是 **同一 URL 的脚本/样式/图片少打几次 HTTP**；**Tab 切换、列表刷新**仍由 **RSC / `unstable_cache` / `staleTimes`** 等机制负责，二者不要混为一谈。

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
| 2026-04-09 | 补充 §4：静态资源与 `next dev` / 生产 / 远程图缓存说明 |
