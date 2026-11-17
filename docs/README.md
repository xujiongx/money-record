# 项目文档索引

本目录为**家庭记账**（Next.js + Supabase）的中文项目文档，与根目录 [README.md](../README.md)（快速上手）配合使用。

**当前能力摘要**：多家庭（6 位数字编码）、`/login` 加入已审核家庭或**提交创建申请**（默认成员布布/一二，待 `/admin` 通过）、httpOnly Cookie + localStorage 编码缓存、中间件保护业务路由与管理路由、数据随页面加载/导航刷新（无定时轮询、无 Realtime）。列表读接口带 **`unstable_cache`（`ledger` 标签，TTL 与 Next **`staleTimes`** 同量级）**；首页可 **「刷新数据」**（**`refreshLedgerReadCache`** + **`router.refresh()`**）对齐他端写入。**品牌与安装体验**：**`lib/app-branding`** + **`app/layout.tsx` metadata/viewport** + **`app/manifest.ts`** + **`app/icon.svg`**（favicon / 主屏幕同源）；界面经 **Hallmark polish + restyle**（羊皮纸账本材质，见 [change/2026-11-17.md](./change/2026-11-17.md)）。统计页 **Recharts 按需动态加载**；**`app/loading.tsx`** 与 **`app/stats/loading.tsx`** 改善切换感知。**小布助手**（`FloatingChatBot`）：可拖动浮动入口、Mistral 多轮对话与「本月小结」（服务端 Action + `MISTRAL_API_KEY`）。**月预算**与 **家庭创建审核**见 PRD F-00d / F-11–12。

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求与验收要点（登录审核/账本/统计分析/小布/大事/预算等已实现对齐） |
| [architecture.md](./architecture.md) | **系统架构**（渲染模型、数据流、安全边界、与其它文档索引） |
| [adr/](./adr/) | **架构决策**（如统计页 [区间洞察](./adr/0001-stats-period-insights.md)）；术语见根 [GLOSSARY.md](../GLOSSARY.md) |
| [development-guide.md](./development-guide.md) | **开发指南**（目录、环境、命令、FAQ） |
| [database-design.md](./database-design.md) | 表结构、`households.code` / `status`、`admin_users`、RLS |
| [api.md](./api.md) | `household` / `admin` / `ledger` / **mistral-chat** Server Actions、Cookie、中间件 |
| [cache-design.md](./cache-design.md) | Cookie、localStorage、刷新策略 |
| [deployment.md](./deployment.md) | 环境变量、上线步骤（无 Realtime 要求） |
| [iteration-design.md](./iteration-design.md) | 迭代说明与 `change/` 约定 |
| [change/](./change/) | **各迭代独立文档**（见 [change/README.md](./change/README.md)） |
