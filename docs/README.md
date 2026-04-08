# 项目文档索引

本目录为**家庭记账**（Next.js + Supabase）的中文项目文档，与根目录 [README.md](../README.md)（快速上手）配合使用。

**当前能力摘要**：多家庭（6 位数字编码）、`/login` 加入或**创建新家**（默认成员布布/一二）、httpOnly Cookie + localStorage 编码缓存、中间件保护业务路由、数据随页面加载/导航刷新（无定时轮询、无 Realtime）。列表读接口带 **`unstable_cache`（`ledger` 标签）**；统计页 **Recharts 按需动态加载**；**`app/loading.tsx`** 与 **`app/stats/loading.tsx`** 改善切换感知。

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求与验收要点（含登录/多家庭） |
| [architecture.md](./architecture.md) | **系统架构**（渲染模型、数据流、安全边界、与其它文档索引） |
| [development-guide.md](./development-guide.md) | **开发指南**（目录、环境、命令、FAQ） |
| [database-design.md](./database-design.md) | 表结构、`households.code`、RLS 策略 |
| [api.md](./api.md) | `household` / `ledger` Server Actions、Cookie、中间件 |
| [cache-design.md](./cache-design.md) | Cookie、localStorage、刷新策略 |
| [deployment.md](./deployment.md) | 环境变量、上线步骤（无 Realtime 要求） |
| [iteration-design.md](./iteration-design.md) | 迭代说明与 `change/` 约定 |
| [change/](./change/) | **各迭代独立文档**（见 [change/README.md](./change/README.md)） |
