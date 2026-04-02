# 家庭记账（Next.js 移动端 + Supabase）

布布与一二共用的家庭账本：移动端视口、橙粉渐变 UI、收支记账、成员统计、图表分析与 Supabase 实时同步。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS 4
- Supabase（PostgreSQL + Realtime）
- Recharts、Framer Motion、date-fns

## 本地运行

### 1. 创建 Supabase 项目

在 [Supabase](https://supabase.com) 新建项目，打开 **SQL Editor**，执行仓库内：

`supabase/migrations/001_init.sql`

### 2. 打开 Realtime

在 Supabase 控制台：**Database → Publications**（或 Replication），为表 `transactions` 启用 `supabase_realtime`（若 SQL 末尾注释中的 `ALTER PUBLICATION` 无权限执行，可在控制台界面勾选）。

### 3. 环境变量

复制 `.env.example` 为 `.env.local`，填入：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名公钥（客户端 Realtime 只读） |
| `SUPABASE_SERVICE_ROLE_KEY` | **仅服务端**，用于记账写入，勿提交或暴露 |
| `NEXT_PUBLIC_HOUSEHOLD_ID` | 默认与迁移脚本中种子家庭 UUID 一致即可 |

### 4. 安装与启动

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，建议使用移动端调试或窄屏查看。

## 路由说明

| 路径 | 功能 |
|------|------|
| `/` | 仪表盘：汇总、最近账单、成员头像墙 |
| `/record` | 智能记账 |
| `/stats` | 支出分类饼图、收入占比、成员支出柱状图 |
| `/members` | 成员列表与各人明细 |

## 部署

将环境变量配置到 Vercel（或其它平台）项目设置中，**切勿**将 `SUPABASE_SERVICE_ROLE_KEY` 设为 `NEXT_PUBLIC_` 前缀。

## 安全说明

当前 RLS 允许匿名用户**只读**本家庭数据（用于 Realtime）；**写入**仅通过服务端 Service Role。若应用将公开发布，建议后续接入登录并收紧 RLS。

## 项目文档（中文）

更完整的说明见 **[docs/](./docs/)** 目录，推荐优先阅读 [docs/development-guide.md](./docs/development-guide.md)（架构、目录结构、环境变量、FAQ）。
