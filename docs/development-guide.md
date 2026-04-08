# 开发指南

> 项目：家庭记账（Next.js 移动端 + Supabase） · 更新日期：2026-04-08

## 1. 环境要求

| 工具 | 建议版本 | 说明 |
|------|----------|------|
| Node.js | 20.x / 22.x（与 Next 16 兼容） | |
| 包管理器 | npm（默认） | 亦可用 pnpm / yarn |
| Supabase | 云端项目 | 执行仓库内 SQL 迁移 |

## 2. 技术架构概要

```mermaid
flowchart LR
  subgraph next [Next.js]
    MW[middleware 会话]
    RSC[Server Components]
    SA[Server Actions]
    CC[Client Components]
  end
  subgraph supa [Supabase]
    PG[(PostgreSQL)]
  end
  MW --> RSC
  RSC --> SA
  CC --> SA
  SA -->|Service Role| PG
```

- **会话**：合法 **6 位家庭编码** 存 httpOnly Cookie；`ledger` 与 `household` Server Actions 据此解析 `household_id`。  
- **登录页**：`setHouseholdSession`、`createHouseholdAndLogin`（新建家庭 + 默认成员布布/一二）。  
- **写入流水**：`createTransaction` / `updateTransaction` / `deleteTransaction`；不经浏览器直连 Supabase。  
- **列表刷新**：无定时轮询；统计页数据由 RSC 拉取后通过 `StatsChartsGate` 注入客户端图表；`DashboardClient` 在删账/改账后调用 `fetchTransactions()` 等更新状态。  
- **读缓存**：`ledger.ts` 中成员与流水列表经 `unstable_cache`（标签 `ledger`）缓存，变更时 `revalidateTag("ledger", "max")`；同一次 RSC 内 `requireHouseholdId` 经 React `cache()` 去重。  
- **布局**：`app/layout.tsx` 中 `max-w-md`；**不再**在根布局声明 `force-dynamic`（业务页因 `cookies()` 等仍为动态渲染）。  
- **Loading**：`app/loading.tsx` 为通用路由骨架；`app/stats/loading.tsx` 仅统计页；统计图表由 `components/StatsChartsGate.tsx` 内 `dynamic(..., { ssr: false })` 分包加载 Recharts。

详见 [database-design.md](./database-design.md)、[api.md](./api.md)、根目录 [`middleware.ts`](../middleware.ts)。

## 3. 仓库结构

```
/
├── middleware.ts           # 无合法家庭 Cookie 时重定向 /login
├── app/
│   ├── actions/
│   │   ├── household.ts    # 会话、创建新家
│   │   └── ledger.ts       # 账本读写（读 Cookie）
│   ├── login/page.tsx      # 登录 / 创建新家（EnterHouseholdCode）
│   ├── page.tsx            # 仪表盘
│   ├── loading.tsx         # 通用路由切换骨架
│   ├── record/page.tsx
│   ├── stats/
│   │   ├── loading.tsx     # 统计页专用轻量骨架
│   │   └── page.tsx
│   ├── members/page.tsx
│   └── layout.tsx
├── components/
│   ├── EnterHouseholdCode.tsx
│   ├── SwitchHouseholdButton.tsx
│   ├── DashboardClient.tsx     # 最近账单左滑编辑/删除、编辑弹窗
│   ├── StatsCharts.tsx         # 统计图表（由 Gate 动态加载）
│   ├── StatsChartsGate.tsx     # Client：dynamic 加载 StatsCharts（ssr:false）
│   ├── StatsChartsSkeleton.tsx
│   ├── SwipeTransactionRow.tsx
│   └── ...
├── lib/
│   ├── household.ts        # 编码规范化、Cookie/Storage 键名
│   ├── household-server.ts # RSC 读 Cookie 编码
│   ├── supabase/service.ts
│   ├── categories.ts
│   ├── aggregates.ts
│   └── types.ts
├── supabase/migrations/
└── docs/
```

## 4. 快速开始

```bash
npm install
cp .env.example .env.local
# 至少配置 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY
```

1. Supabase **SQL Editor** 执行 `supabase/migrations/001_init.sql`。  
2. `npm run dev`，打开 http://localhost:3000 → 应进入 `/login`，可用 **`000001`** 加入示例家庭，或 **创建新家**。

## 5. 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发（Turbopack） |
| `npm run build` / `npm run start` | 生产构建与运行 |
| `npm run lint` | ESLint |

## 6. 环境变量

| 变量 | 作用域 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 服务端 | 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **仅服务端** | 所有 DB 访问 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | 可选；当前主流程未用 |

## 7. 代码与约定

- **TypeScript**、React 19、Next.js 16 App Router、Tailwind 4。  
- **Server Actions**：`app/actions/*.ts`。  
- **Lint**：避免在 `try/catch` 内直接 `return <JSX />`（见历史 eslint 规则）。  
- **金额**：`lib/format.ts` 展示。

## 8. 测试

未接自动化测试；可后续加 Vitest / Playwright。

## 9. 文档索引

| 主题 | 文档 |
|------|------|
| 产品 | [PRD.md](./PRD.md) |
| 库表 / RLS | [database-design.md](./database-design.md) |
| Actions / 会话 | [api.md](./api.md) |
| 缓存与刷新策略 | [cache-design.md](./cache-design.md) |
| 部署 | [deployment.md](./deployment.md) |
| 迭代 | [change/](./change/) |

## 10. 常见问题（FAQ）

| 问题 | 处理 |
|------|------|
| 一直跳登录 | 检查 Cookie 是否写入；中间件是否校验 6 位数字。 |
| 创建家提示编码已存在 | 换 6 位数字；查表 `households.code`。 |
| 无法连库 | `.env.local`、Supabase 项目状态、Service Role 是否正确。 |
| 另一台设备更新不自动出现 | 刷新页面或切换路由；若需近实时可后续接 Realtime 或手动刷新按钮。 |
| Tab 切换仍慢 | 生产环境看 Supabase 区域延迟；已做 `unstable_cache` + 统计页 Recharts 分包；可开 Network 看 RSC 与 JS chunk。 |
| `ssr: false` 报错 | 勿在 Server Component 写 `dynamic(..., { ssr:false })`；统计页用 `StatsChartsGate` 客户端封装。 |
